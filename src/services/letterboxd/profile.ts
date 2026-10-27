import { DOMParser } from "@b-fuze/deno-dom";
import { parse } from "@std/xml";
import {
  LETTERBOXD_BASE_URL,
  LETTERBOXD_FALLBACK_HEADERS,
  LETTERBOXD_HTTP_HEADERS,
} from "./client.ts";
import { findChildren, findFirst, getText, getUserDiary } from "./rss.ts";
import type {
  DiaryEntry,
  LetterboxdProfile,
  ProfileFavourite,
  ProfileStat,
  UserStats,
  XmlDocument,
} from "./types.ts";

export async function fetchFilmPoster(
  filmSlug: string,
): Promise<string | null> {
  try {
    const res = await fetch(`${LETTERBOXD_BASE_URL}/film/${filmSlug}/`, {
      headers: LETTERBOXD_HTTP_HEADERS,
    });
    if (!res.ok) return null;

    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    if (!doc) return null;

    const ldJson = doc.querySelector('script[type="application/ld+json"]')
      ?.textContent;
    if (ldJson) {
      try {
        const cleanJson = ldJson
          .replace(/\/\* <!\[CDATA\[ \*\//, "")
          .replace(/\/\* \]\]> \*\//, "")
          .trim();
        const data = JSON.parse(cleanJson);
        if (typeof data.image === "string") {
          return data.image.replace(/-0-\d+-0-\d+-crop/, "-0-300-0-450-crop");
        }
      } catch {
        // fallback below
      }
    }

    const ogImage = doc.querySelector('meta[property="og:image"]')
      ?.getAttribute("content");
    return ogImage ?? null;
  } catch {
    return null;
  }
}

async function fetchProfilePage(
  profileUrl: string,
): Promise<{ ok: boolean; status: number; html: string | null }> {
  try {
    let res = await fetch(profileUrl, { headers: LETTERBOXD_HTTP_HEADERS });

    if (res.status === 403) {
      // Retry with fallback browser headers
      res = await fetch(profileUrl, { headers: LETTERBOXD_FALLBACK_HEADERS });
    }

    if (res.status === 404) {
      throw new Error("NOT_A_VALID_LETTERBOXD_USER");
    }

    if (!res.ok) {
      return { ok: false, status: res.status, html: null };
    }

    const html = await res.text();
    return { ok: true, status: res.status, html };
  } catch (error) {
    if (
      error instanceof Error && error.message === "NOT_A_VALID_LETTERBOXD_USER"
    ) {
      throw error;
    }
    return { ok: false, status: 500, html: null };
  }
}

function extractNameFromRss(xmlText: string): string | null {
  try {
    const parsed = parse(xmlText) as XmlDocument;
    const channel = findFirst(parsed.root, "channel");
    if (!channel) return null;

    const titleNode = findFirst(channel, "title");
    const rawTitle = getText(titleNode);
    if (!rawTitle) return null;

    const name = rawTitle.replace(/^Letterboxd\s*-\s*/i, "").trim();
    return name || null;
  } catch {
    return null;
  }
}

export async function getLetterboxdProfile(
  username: string,
): Promise<LetterboxdProfile> {
  const profileUrl = `${LETTERBOXD_BASE_URL}/${username}/`;

  // Fetch profile page and RSS in parallel
  const [profileResult, recentActivity] = await Promise.all([
    fetchProfilePage(profileUrl),
    getUserDiary(username).catch((err) => {
      if (
        err instanceof Error && err.message === "NOT_A_VALID_LETTERBOXD_USER"
      ) {
        throw err;
      }
      return [] as DiaryEntry[];
    }),
  ]);

  // If HTML could not be fetched (e.g. 403 on cloud server IP), gracefully fallback to RSS data
  if (!profileResult.ok || !profileResult.html) {
    console.warn(
      `[Letterboxd] Could not fetch profile HTML for '${username}' (status ${profileResult.status}). Using RSS fallback.`,
    );

    let fallbackName = username;
    try {
      const xmlRes = await fetch(`${LETTERBOXD_BASE_URL}/${username}/rss/`, {
        headers: LETTERBOXD_FALLBACK_HEADERS,
      });
      if (xmlRes.ok) {
        const xmlText = await xmlRes.text();
        const extracted = extractNameFromRss(xmlText);
        if (extracted) fallbackName = extracted;
      }
    } catch {
      // Use username if RSS name fails
    }

    return {
      name: fallbackName,
      username,
      avatar: null,
      accountType: "free",
      backdrop: undefined,
      stats: [],
      favourites: [],
      recentActivity,
    };
  }

  const doc = new DOMParser().parseFromString(profileResult.html, "text/html");

  if (!doc) {
    throw new Error("Failed to parse Letterboxd profile");
  }

  // Name
  const nameElement =
    doc.querySelector(".person-display-name .displayname .label") ||
    doc.querySelector(".person-display-name .displayname") ||
    doc.querySelector(".profile-header h1.title-1");
  const name = nameElement?.textContent?.trim() || username;

  // Avatar
  const avatarImg = doc.querySelector("#avatar-large img") ||
    doc.querySelector(".profile-avatar img") ||
    doc.querySelector(".avatar img");
  const avatar = avatarImg?.getAttribute("src") || null;

  // Account Type
  const badgeText = doc
    .querySelector(
      ".person-display-name .badge, .profile-name-and-actions .badge, .profile-header .badge",
    )
    ?.textContent?.trim()
    .toLowerCase();

  let accountType: "free" | "pro" | "patron" = "free";
  if (badgeText?.includes("patron")) {
    accountType = "patron";
  } else if (badgeText?.includes("pro")) {
    accountType = "pro";
  }

  // Backdrop
  const backdropEl = doc.querySelector("#backdrop");
  const backdrop = backdropEl?.getAttribute("data-backdrop") || undefined;

  // Stats
  const statElements = doc.querySelectorAll(
    ".profile-stats .profile-statistic",
  );
  const stats: ProfileStat[] = [];
  for (const s of statElements) {
    const rawVal = s.querySelector(".value")?.textContent?.trim() || "0";
    const definition = s.querySelector(".definition")?.textContent?.trim() ||
      "";
    const parsedVal = Number(rawVal.replace(/[^0-9]/g, "")) || 0;
    if (definition) {
      stats.push({ value: parsedVal, definition });
    }
  }

  // Favourites
  const favItems = doc.querySelectorAll(
    "#favourites .griditem, section.favourites .griditem",
  );
  const rawFavs: { film: string; slug?: string; poster?: string }[] = [];

  for (const item of favItems) {
    const reactComp = item.querySelector(".react-component");
    const itemName = reactComp?.getAttribute("data-item-name") ||
      item.querySelector("img")?.getAttribute("alt");
    const itemSlug = reactComp?.getAttribute("data-item-slug");
    const imgPoster = item.querySelector("img")?.getAttribute("src");
    const hasValidImg = imgPoster && !imgPoster.includes("empty-poster");

    if (itemName) {
      rawFavs.push({
        film: itemName,
        slug: itemSlug ?? undefined,
        poster: hasValidImg ? imgPoster : undefined,
      });
    }
  }

  // Resolve posters for favourites in parallel
  const favourites: ProfileFavourite[] = await Promise.all(
    rawFavs.map(async (fav) => {
      if (fav.poster) {
        return { film: fav.film, poster: fav.poster };
      }
      if (fav.slug) {
        const poster = await fetchFilmPoster(fav.slug);
        return { film: fav.film, poster: poster || undefined };
      }
      return { film: fav.film, poster: undefined };
    }),
  );

  return {
    name,
    username,
    avatar,
    accountType,
    backdrop,
    stats,
    favourites,
    recentActivity,
  };
}

export async function getLetterboxdUserStats(
  username: string,
): Promise<UserStats> {
  const profile = await getLetterboxdProfile(username);

  const filmsStat = profile.stats.find((s) =>
    s.definition.toLowerCase() === "films"
  );
  const yearStat = profile.stats.find((s) =>
    s.definition.toLowerCase().includes("year")
  );

  const lastFilms = profile.recentActivity.slice(0, 3).map((item) =>
    `${item.film.title}${item.film.year ? ` (${item.film.year})` : ""}`
  );

  return {
    watchedFilms: filmsStat ? filmsStat.value.toLocaleString("pt-BR") : "0",
    watchedFilmsThisYear: yearStat
      ? yearStat.value.toLocaleString("pt-BR")
      : "0",
    lastFilms,
  };
}

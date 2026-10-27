import { DOMParser } from "@b-fuze/deno-dom";
import { LETTERBOXD_BASE_URL, LETTERBOXD_HTTP_HEADERS } from "./client.ts";
import { getUserDiary } from "./rss.ts";
import type {
  LetterboxdProfile,
  ProfileFavourite,
  ProfileStat,
  UserStats,
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

export async function getLetterboxdProfile(
  username: string,
): Promise<LetterboxdProfile> {
  const profileUrl = `${LETTERBOXD_BASE_URL}/${username}/`;

  // Fetch profile page and RSS in parallel
  const [profileRes, recentActivity] = await Promise.all([
    fetch(profileUrl, { headers: LETTERBOXD_HTTP_HEADERS }),
    getUserDiary(username).catch(() => []),
  ]);

  if (!profileRes.ok) {
    if (profileRes.status === 404) {
      throw new Error("NOT_A_VALID_LETTERBOXD_USER");
    }
    throw new Error(`Request failed with status: ${profileRes.status}`);
  }

  const html = await profileRes.text();
  const doc = new DOMParser().parseFromString(html, "text/html");

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

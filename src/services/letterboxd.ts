import { DOMParser } from "@b-fuze/deno-dom";
import { parse } from "@std/xml";

export type Rating = {
  text: RatingText;
  score: number | null;
};

export type FilmDate = {
  published: number | null;
  watched: number | null;
};

export type FilmPoster = {
  tiny: string | null;
  small: string | null;
  medium: string | null;
  large: string | null;
};

export type FilmImages = FilmPoster;

export type Film = {
  title: string;
  year?: number;
  poster: FilmPoster;
};

export type DiaryEntry = {
  date: FilmDate;
  film: Film;
  rating: Rating;
  review: string | null;
  spoilers: boolean;
  isRewatch: boolean;
  link: string;
};

export type RatingText =
  | "½"
  | "★"
  | "★½"
  | "★★"
  | "★★½"
  | "★★★"
  | "★★★½"
  | "★★★★"
  | "★★★★½"
  | "★★★★★"
  | null;

export type TimeFilter =
  | "all"
  | "overall"
  | "7d"
  | "1w"
  | "15d"
  | "30d"
  | "1m";

export type UserStats = {
  watchedFilms: string;
  watchedFilmsThisYear: string;
  lastFilms: string[];
};

type ScoreMap = Record<string, RatingText>;

export type XmlName = {
  raw: string;
  local: string;
};

export type XmlTextNode = {
  type: "text";
  text: string;
};

export type XmlElementNode = {
  type: "element";
  name: XmlName;
  attributes: Record<string, string>;
  children?: XmlNode[];
};

export type XmlCDataNode = {
  type: "cdata";
  text: string;
};

export type XmlNode = XmlElementNode | XmlTextNode | XmlCDataNode;

export type XmlDocument = {
  root: XmlElementNode;
};

type ProcessItemParams = {
  item: XmlElementNode;
  descriptionHtml: string;
};

export type GetLastFilmsSeenParams = {
  username: string;
  limit?: number;
  time?: TimeFilter;
};

const SCORE_TO_TEXT_MAP: ScoreMap = {
  "-1.0": null,
  "0.5": "½",
  "1.0": "★",
  "1.5": "★½",
  "2.0": "★★",
  "2.5": "★★½",
  "3.0": "★★★",
  "3.5": "★★★½",
  "4.0": "★★★★",
  "4.5": "★★★★½",
  "5.0": "★★★★★",
};

const ORIGINAL_IMAGE_CROP_REGEX = /-0-.*-crop/;
const REVIEW_PARAGRAPH_REGEX = /<p>(.*?)<\/p>/gis;
const HTML_TAG_REGEX = /<[^>]+>/g;

function findChildren(
  node: XmlElementNode,
  tag: string,
): XmlElementNode[] {
  if (!node.children) {
    return [];
  }

  return node.children.filter(
    (child): child is XmlElementNode =>
      child.type === "element" && child.name.raw === tag,
  );
}

function findFirst(
  node: XmlElementNode,
  tag: string,
): XmlElementNode | null {
  return findChildren(node, tag)[0] ?? null;
}

function getText(node: XmlElementNode | null): string {
  if (!node?.children) {
    return "";
  }

  return node.children
    .map((child) => {
      if (child.type === "text" || child.type === "cdata") {
        return child.text;
      }
      return getText(child);
    })
    .join("")
    .trim();
}

function parseNumber(value: string): number | null {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseYear(value: string | null | undefined): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function parseDate(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function extractPosterFromDescription(description: string): FilmPoster {
  if (!description) {
    return { tiny: null, small: null, medium: null, large: null };
  }

  const match = description.match(/<img[^>]+src="([^"]+)"/i);
  if (!match) {
    return { tiny: null, small: null, medium: null, large: null };
  }

  const rawUrl = match[1];
  return {
    tiny: rawUrl.replace(ORIGINAL_IMAGE_CROP_REGEX, "-0-35-0-50-crop"),
    small: rawUrl.replace(ORIGINAL_IMAGE_CROP_REGEX, "-0-70-0-105-crop"),
    medium: rawUrl.replace(ORIGINAL_IMAGE_CROP_REGEX, "-0-150-0-225-crop"),
    large: rawUrl.replace(ORIGINAL_IMAGE_CROP_REGEX, "-0-230-0-345-crop"),
  };
}

function extractReviewFromDescription(description: string): string | null {
  if (!description) {
    return null;
  }

  const paragraphs = Array.from(description.matchAll(REVIEW_PARAGRAPH_REGEX))
    .map((match) => match[1].replace(HTML_TAG_REGEX, "").trim());

  if (!paragraphs.length) {
    return null;
  }

  const lastParagraph = paragraphs[paragraphs.length - 1];
  if (lastParagraph.includes("Watched on ")) {
    return null;
  }

  const review = paragraphs
    .filter(
      (paragraph) =>
        paragraph && paragraph !== "This review may contain spoilers.",
    )
    .join("\n")
    .trim();

  return review || null;
}

function getRating(item: XmlElementNode): Rating {
  const ratingNode = findFirst(item, "letterboxd:memberRating");
  const memberRating = getText(ratingNode);

  return {
    text: SCORE_TO_TEXT_MAP[memberRating] ?? null,
    score: parseNumber(memberRating),
  };
}

function getSpoilers(item: XmlElementNode): boolean {
  const titleNode = findFirst(item, "title");
  const title = getText(titleNode);
  return title.includes("(contains spoilers)");
}

function processItem({
  item,
  descriptionHtml,
}: ProcessItemParams): DiaryEntry | null {
  const linkNode = findFirst(item, "link");
  const link = getText(linkNode);

  if (!link || link.includes("/list/")) {
    return null;
  }

  const pubDate = getText(findFirst(item, "pubDate"));
  const watchedDate = getText(findFirst(item, "letterboxd:watchedDate"));
  const yearText = getText(findFirst(item, "letterboxd:filmYear"));
  const poster = extractPosterFromDescription(descriptionHtml);

  return {
    date: {
      published: parseDate(pubDate),
      watched: parseDate(watchedDate),
    },
    film: {
      title: getText(findFirst(item, "letterboxd:filmTitle")),
      year: parseYear(yearText),
      poster,
    },
    rating: getRating(item),
    review: extractReviewFromDescription(descriptionHtml),
    spoilers: getSpoilers(item),
    isRewatch: getText(findFirst(item, "letterboxd:rewatch")) === "Yes",
    link,
  };
}

export async function getLetterboxdUserXml(username: string): Promise<string> {
  const response = await fetch(`https://letterboxd.com/${username}/rss/`, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("NOT_A_VALID_LETTERBOXD_USER");
    } else {
      throw new Error(`Request failed with status: ${response.status}`);
    }
  }

  return await response.text();
}

async function getUserDiary(username: string): Promise<DiaryEntry[]> {
  const xml = await getLetterboxdUserXml(username);
  const parsed = parse(xml) as XmlDocument;
  const rss = parsed.root;

  const channel = findFirst(rss, "channel");
  if (!channel) {
    return [];
  }

  const items = findChildren(channel, "item");
  const results: DiaryEntry[] = [];

  for (const item of items) {
    const descriptionNode = findFirst(item, "description");
    const descriptionHtml = getText(descriptionNode);
    const entry = processItem({ item, descriptionHtml });

    if (entry) {
      results.push(entry);
    }
  }

  return results;
}

function filterByTime(
  diary: DiaryEntry[],
  time: TimeFilter,
): DiaryEntry[] {
  if (time === "all" || time === "overall") {
    return diary;
  }

  const now = Date.now();
  const daysMap: Record<string, number> = {
    "7d": 7,
    "1w": 7,
    "15d": 15,
    "30d": 30,
    "1m": 30,
  };

  const days = daysMap[time] ?? 30;
  const fromTimestamp = now - days * 24 * 60 * 60 * 1000;

  return diary.filter(
    (item) =>
      item.date.watched !== null &&
      item.date.watched >= fromTimestamp &&
      item.date.watched <= now,
  );
}

export async function getLastFilmsSeen({
  username,
  limit = 1,
  time = "all",
}: GetLastFilmsSeenParams): Promise<DiaryEntry[]> {
  const userDiary = await getUserDiary(username);

  if (!userDiary.length) {
    throw new Error("ZERO_ACTIVITIES");
  }

  const filtered = filterByTime(userDiary, time);
  return filtered.slice(0, limit);
}

export async function getLetterboxdUserStats(
  username: string,
): Promise<UserStats> {
  const response = await fetch(`https://letterboxd.com/${username}/`, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("NOT_A_VALID_LETTERBOXD_USER");
    }
    throw new Error(`Request failed with status: ${response.status}`);
  }

  const html = await response.text();
  const doc = new DOMParser().parseFromString(html, "text/html");

  if (!doc) {
    throw new Error("Failed to parse Letterboxd profile");
  }

  const statValues = doc.querySelectorAll(
    ".profile-stats .profile-statistic .value",
  );

  const watchedFilms = statValues.length > 0
    ? (statValues[0].textContent?.trim().replace(",", ".") || "0")
    : "0";
  const watchedFilmsThisYear = statValues.length > 1
    ? (statValues[1].textContent?.trim().replace(",", ".") || "0")
    : "0";

  let lastFilmsList: string[] = [];
  try {
    const recentSeen = await getLastFilmsSeen({
      username,
      limit: 3,
      time: "all",
    });
    lastFilmsList = recentSeen.map((item) =>
      `${item.film.title}${item.film.year ? ` (${item.film.year})` : ""}`
    );
  } catch {
    lastFilmsList = [];
  }

  return {
    watchedFilms,
    watchedFilmsThisYear,
    lastFilms: lastFilmsList,
  };
}

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

export type TimeFilter =
  | "all"
  | "overall"
  | "7d"
  | "1w"
  | "15d"
  | "30d"
  | "1m";

export type ProfileStat = {
  value: number;
  definition: string;
};

export type ProfileFavourite = {
  film: string;
  poster?: string;
};

export type LetterboxdProfile = {
  name: string;
  username: string;
  avatar: string | null;
  accountType: "free" | "pro" | "patron";
  backdrop?: string;
  stats: ProfileStat[];
  favourites: ProfileFavourite[];
  recentActivity: DiaryEntry[];
};

export type UserStats = {
  watchedFilms: string;
  watchedFilmsThisYear: string;
  lastFilms: string[];
};

export type Watchlist = {
  count: number;
  recentlyAdded: string[];
  url: URL;
};

export type GetWatchlistParams = {
  username: string;
  limit?: number;
};

export type GetLastFilmsSeenParams = {
  username: string;
  limit?: number;
  time?: TimeFilter;
};

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

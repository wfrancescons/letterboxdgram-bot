import { FormattedString } from "@grammyjs/parse-mode";

export type FormatProfileLbParams = {
  firstName: string;
  profileLink: string;
  watchedFilms: string;
  watchedFilmsThisYear: string;
  lastFilms: string[];
};

export default function formatProfileLb({
  firstName,
  profileLink,
  watchedFilms,
  watchedFilmsThisYear,
  lastFilms,
}: FormatProfileLbParams) {
  const namePossessive = firstName.endsWith("s") || firstName.endsWith("S")
    ? `${firstName}'`
    : `${firstName}'s`;

  let message = new FormattedString("👤 ")
    .link(namePossessive, profileLink)
    .plain(" Letterboxd:\n\n")
    .plain(`📽️ Watched Films: ${watchedFilms}\n`)
    .plain(`📅 This Year: ${watchedFilmsThisYear}`);

  if (lastFilms.length > 0) {
    message = message.plain("\n\n⏰ Recent Activity:");
    for (const title of lastFilms) {
      message = message.plain(`\n• ${title}`);
    }
  }

  return {
    text: message.text,
    entities: message.entities,
    link_preview_options: {
      prefer_small_media: true,
      url: profileLink,
    },
  };
}

import type { DiaryEntry } from "@/services/letterboxd.ts";
import limitText from "@/utils/limitText.ts";

import { FormattedString } from "@grammyjs/parse-mode";

const DATE_FORMAT_OPTIONS = {
  year: "numeric",
  month: "numeric",
  day: "numeric",
} satisfies Intl.DateTimeFormatOptions;

type FormatLbParams = DiaryEntry & {
  displayName: string;
};

export default function formatLb(
  {
    displayName,
    film,
    date,
    isRewatch,
    rating,
    review,
    spoilers,
    link,
  }: FormatLbParams,
) {
  const watchedDate = new Date(
    date.watched,
  ).toLocaleDateString(
    "pt-BR",
    DATE_FORMAT_OPTIONS,
  );

  const filmTitle = `${film.title}${film.year ? ` (${film.year})` : ""}`;

  const header = FormattedString
    .b(displayName || "")
    .plain(` ${isRewatch ? "rewatched" : "watched"}:\n`)
    .plain("📽️ ")
    .b(filmTitle);

  const dateLine = new FormattedString(`\n📅 ${watchedDate}`);

  const ratingLine = rating.text
    ? new FormattedString(`\n📈 ${rating.text}`)
    : new FormattedString("");

  let reviewSection = new FormattedString("");

  if (review) {
    const limitedReview = limitText(review, 400);

    const reviewBody = spoilers
      ? FormattedString
        .i("⚠️ This review may contain spoilers")
        .plain("\n")
        .spoiler(limitedReview)
      : new FormattedString(limitedReview);

    reviewSection = new FormattedString("\n\n📝 Review:\n")
      .expandableBlockquote(reviewBody);
  }

  const message = header
    .concat(
      dateLine,
      ratingLine,
      reviewSection,
    );

  return {
    text: message.text,
    entities: message.entities,

    link_preview_options: {
      prefer_large_media: true,
      url: film.poster ?? undefined,
    },

    reply_markup: {
      inline_keyboard: [[{
        text: "Check it out on Letterboxd",
        url: link,
      }]],
    },
  };
}

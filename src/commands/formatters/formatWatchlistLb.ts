import { FormattedString } from "@grammyjs/parse-mode";

type FormatWatchlistLbParams = {
  displayName: string;
  count: number;
  recentlyAdded: string[];
  url: URL;
};

export default function formatWatchlistLb(
  {
    displayName,
    count,
    recentlyAdded,
    url,
  }: FormatWatchlistLbParams,
) {
  const header = new FormattedString("Watchlist for ")
    .b(displayName)
    .plain(":\n\n");

  const countLine = new FormattedString("🍿 ")
    .i(
      FormattedString
        .b(`${count}`)
        .plain(` ${count === 1 ? "film" : "films"} to watch`),
    )
    .plain("\n\n");

  let recentAdded = new FormattedString("");

  if (recentlyAdded.length > 0) {
    recentAdded = recentAdded.b("Recently added:\n");

    for (const item of recentlyAdded) {
      recentAdded = recentAdded
        .plain(`• ${item}`)
        .plain("\n");
    }
  }

  const message = header
    .concat(
      countLine,
      recentAdded,
    );

  return {
    text: message.text,
    entities: message.entities,
    reply_markup: {
      inline_keyboard: [[{
        text: "View Full List",
        url: url.toString(),
      }]],
    },
  };
}

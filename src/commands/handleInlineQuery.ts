import type { BotContext } from "@/types/context.ts";
import type { InlineQueryResultArticle } from "grammy/types";
import { getLetterboxdUser } from "@/database/services/users.ts";
import { logCommand } from "@/database/services/commandLogs.ts";
import { getLastFilmsSeen } from "@/services/letterboxd.ts";
import errorHandler from "@/handlers/errorHandler.ts";
import formatLb from "./formatters/formatLb.ts";

export default async function handleInlineQuery(ctx: BotContext) {
  const inlineQuery = ctx.inlineQuery;
  if (!inlineQuery) {
    return;
  }

  const telegram_id = inlineQuery.from.id;
  const displayName = inlineQuery.from.first_name ||
    inlineQuery.from.username || "User";

  logCommand("inline_query", telegram_id, telegram_id);

  try {
    const letterboxd_username = await getLetterboxdUser(telegram_id);
    if (!letterboxd_username) {
      throw "USER_NOT_FOUND";
    }

    const lastFilms = await getLastFilmsSeen({
      username: letterboxd_username,
      limit: 15,
      time: "all",
    });

    if (!lastFilms.length) {
      throw "ZERO_ACTIVITIES";
    }

    const results: InlineQueryResultArticle[] = lastFilms.map(
      (entry, index) => {
        const message = formatLb({
          displayName,
          ...entry,
        });

        const filmTitle = `${entry.film.title}${
          entry.film.year ? ` (${entry.film.year})` : ""
        }`;
        const description = entry.rating.text
          ? `${entry.rating.text}${entry.isRewatch ? " • Rewatched" : ""}`
          : entry.isRewatch
          ? "Rewatched"
          : "Watched";

        const thumbUrl = entry.film.image.small || entry.film.poster ||
          undefined;

        return {
          type: "article",
          id: `film-${index}-${entry.date.watched}`,
          title: filmTitle,
          description,
          thumbnail_url: thumbUrl,
          input_message_content: {
            message_text: message.text,
            entities: message.entities,
            link_preview_options: message.link_preview_options,
          },
          reply_markup: message.reply_markup,
        };
      },
    );

    await ctx.answerInlineQuery(results, {
      is_personal: true,
      cache_time: 0,
    });
  } catch (error) {
    await errorHandler(ctx, error);
  }
}

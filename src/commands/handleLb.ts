import type { BotContext } from "@/types/context.ts";
import { getLetterboxdUser } from "@/database/services/users.ts";
import { logCommand } from "@/database/services/commandLogs.ts";
import { getLastFilmsSeen } from "@/services/letterboxd.ts";
import errorHandler from "@/handlers/errorHandler.ts";
import formatLb from "./formatters/formatLb.ts";

export default async function handleLb(ctx: BotContext) {
  const telegram_id = ctx.from?.id;
  const chat_id = ctx.chat?.id;

  if (!telegram_id || !chat_id) {
    return;
  }

  logCommand("lb", telegram_id, chat_id);

  try {
    await ctx.replyWithChatAction("typing");

    const displayName = ctx.from?.first_name || ctx.from?.username || "User";
    const letterboxd_username = await getLetterboxdUser(telegram_id);

    if (!letterboxd_username) {
      throw "USER_NOT_FOUND";
    }

    const lastFilms = await getLastFilmsSeen({
      username: letterboxd_username,
      limit: 1,
    });

    const lastFilm = lastFilms[0];
    if (!lastFilm) {
      throw "ZERO_ACTIVITIES";
    }

    const message = formatLb({
      displayName,
      ...lastFilm,
    });

    await ctx.reply(message.text, {
      entities: message.entities,
      link_preview_options: message.link_preview_options,
      reply_markup: message.reply_markup,
      reply_parameters: ctx.message
        ? { message_id: ctx.message.message_id }
        : undefined,
    });
  } catch (error) {
    await errorHandler(ctx, error);
  }
}

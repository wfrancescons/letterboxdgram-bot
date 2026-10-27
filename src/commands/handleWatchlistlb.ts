import type { BotContext } from "@/types/context.ts";
import { getLetterboxdUser } from "@/database/services/users.ts";
import { logCommand } from "@/database/services/commandLogs.ts";
import { getWatchlist } from "@/services/letterboxd/index.ts";
import errorHandler from "@/handlers/errorHandler.ts";
import formatWatchlistLb from "./formatters/formatWatchlistLb.ts";

export default async function handleWatchlistlb(ctx: BotContext) {
  const telegram_id = ctx.from?.id;
  const chat_id = ctx.chat?.id;

  if (!telegram_id || !chat_id) {
    return;
  }

  logCommand("watchlistlb", telegram_id, chat_id);

  try {
    await ctx.replyWithChatAction("typing");

    const displayName = ctx.from?.first_name || ctx.from?.username || "User";
    const letterboxd_username = await getLetterboxdUser(telegram_id);

    if (!letterboxd_username) {
      throw "USER_NOT_FOUND";
    }

    const watchlist = await getWatchlist({
      username: letterboxd_username,
      limit: 10,
    });

    const message = formatWatchlistLb({
      displayName,
      ...watchlist,
    });

    await ctx.reply(message.text, {
      entities: message.entities,
      reply_markup: message.reply_markup,
      reply_parameters: ctx.message
        ? { message_id: ctx.message.message_id }
        : undefined,
    });
  } catch (error) {
    await errorHandler(ctx, error);
  }
}

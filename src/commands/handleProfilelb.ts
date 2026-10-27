import type { BotContext } from "@/types/context.ts";
import { getLetterboxdUser } from "@/database/services/users.ts";
import { logCommand } from "@/database/services/commandLogs.ts";
import { getLetterboxdProfile } from "@/services/letterboxd/index.ts";
import errorHandler from "@/handlers/errorHandler.ts";
import formatProfileLb from "./formatters/formatProfileLb.ts";

export default async function handleProfilelb(ctx: BotContext) {
  const telegram_id = ctx.from?.id;
  const chat_id = ctx.chat?.id;

  if (!telegram_id || !chat_id) {
    return;
  }

  logCommand("profilelb", telegram_id, chat_id);

  try {
    await ctx.replyWithChatAction("typing");

    const firstName = ctx.from?.first_name || ctx.from?.username || "User";
    const letterboxd_username = await getLetterboxdUser(telegram_id);

    if (!letterboxd_username) {
      throw "USER_NOT_FOUND";
    }

    const profile = await getLetterboxdProfile(letterboxd_username);

    const message = formatProfileLb({
      firstName,
      profile,
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

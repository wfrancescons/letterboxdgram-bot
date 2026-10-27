import type { BotContext } from "@/types/context.ts";
import { setLetterboxdUsername } from "@/database/services/users.ts";
import { logCommand } from "@/database/services/commandLogs.ts";
import { getLetterboxdUserXml as validateLetterboxdUser } from "@/services/letterboxd/index.ts";
import errorHandler from "@/handlers/errorHandler.ts";
import { FormattedString } from "@grammyjs/parse-mode";

export default async function handleSetlb(ctx: BotContext) {
  const telegram_id = ctx.from?.id;
  const chat_id = ctx.chat?.id;

  if (!telegram_id || !chat_id) {
    return;
  }

  logCommand("setlb", telegram_id, chat_id);

  let targetUsername = typeof ctx.match === "string" ? ctx.match.trim() : "";

  // If ctx.match is empty but message text exists, try extracting the second argument
  if (!targetUsername && ctx.message?.text) {
    const parts = ctx.message.text.trim().split(/\s+/);
    if (parts.length > 1) {
      targetUsername = parts[1].trim();
    }
  }

  try {
    if (!targetUsername) {
      throw "REG_WITHOUT_ARGS";
    }

    await ctx.replyWithChatAction("typing");

    try {
      await validateLetterboxdUser(targetUsername);
    } catch {
      throw "NOT_A_VALID_LETTERBOXD_USER";
    }

    const user = await setLetterboxdUsername(telegram_id, targetUsername);
    if (!user) {
      throw new Error("COMMON_ERROR");
    }

    const message = new FormattedString("✅ ")
      .bold(targetUsername)
      .plain(" set as your Letterboxd username");

    await ctx.reply(message.text, {
      entities: message.entities,
      reply_parameters: ctx.message
        ? { message_id: ctx.message.message_id }
        : undefined,
    });
  } catch (error) {
    await errorHandler(ctx, error, targetUsername);
  }
}

import config from "@/config.ts";
import { logCommand } from "@/database/services/commandLogs.ts";
import type { BotContext } from "@/types/context.ts";
import { FormattedString } from "@grammyjs/parse-mode";

export default async function handleHelp(ctx: BotContext) {
  const telegram_id = ctx.from?.id;
  const chat_id = ctx.chat?.id;

  if (!telegram_id || !chat_id) {
    return;
  }

  logCommand("help", telegram_id, chat_id);

  try {
    await ctx.replyWithChatAction("typing");

    const botUsername = config.bot.username
      ? `@${config.bot.username.replace("@", "")}`
      : "@bot";

    const msg = FormattedString
      .bold("Valid commands: 🤖\n\n")
      .plain("/lb - Send your last logged movie\n")
      .code("/setlb <username>")
      .plain(" - Set your Letterboxd username\n")
      .plain("/profilelb - Send stats from your Letterboxd\n")
      .plain("/watchlistlb - Send your Letterboxd watchlist\n")
      .plain("/gridlb - Generate a grid collage\n\n")
      .bold("Inline Mode")
      .plain(
        ` - In any chat, type ${botUsername} to load your Letterboxd diary\n`,
      );

    if (config.bot.news_channel) {
      msg.plain(
        `\nAccess ${config.bot.news_channel} for news and server status`,
      );
    }

    await ctx.reply(msg.text, {
      entities: msg.entities,
      reply_parameters: ctx.message
        ? { message_id: ctx.message.message_id }
        : undefined,
    });
  } catch (error) {
    console.error("Error in handleHelp:", error);
  }
}

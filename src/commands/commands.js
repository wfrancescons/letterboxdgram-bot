import config from "../config.js";
import { logCommand } from "../database/services/commandUsageLog.js";
import { sendTextMessage } from "../utils/messageSender.js";
import botstatuslb from "./admin/botstatuslb.js";
import gridlb from "./gridlb.js";
import inlineQuery from "./inlineQuery.js";
import lb from "./lb.js";
import profilelb from "./profilelb.js";
import setlb from "./setlb.js";
// Start command
async function start(ctx) {
    const telegram_id = ctx.message.from.id;
    const chat_id = ctx.message.chat.id;
    const first_name = ctx.update.message.from.first_name;

    logCommand("start", telegram_id, chat_id);

    try {
        await ctx.replyWithChatAction("typing");

        const extra = {
            reply_to_message_id: ctx.message?.message_id,
            reply_markup: {
                inline_keyboard: [[{
                    text: "💬 Add to a group",
                    url: `https://t.me/${
                        config.bot.username.replace("@", "")
                    }?startgroup=new`,
                }]],
            },
        };

        const message = `Hello, ${first_name} 👋\n` +
            `Welcome to the letterboxd bot 🟠🟢🔵\n` +
            `\n➡️ Use /setlb to set your Letterboxd username\n` +
            `\n➡️ Type / or /help to see a list of valid commands\n` +
            `\nAccess ${config.bot.news_channel} for news and server status\n` +
            `\nOn Last.fm? 🔴🎵 Give @telelastfmbot a try`;

        await sendTextMessage(ctx, message, extra);
    } catch (error) {
        console.error(error);
    }
}

// Help command
async function help(ctx) {
    const telegram_id = ctx.message.from.id;
    const chat_id = ctx.message.chat.id;

    logCommand("help", telegram_id, chat_id);

    try {
        await ctx.replyWithChatAction("typing");

        await sendTextMessage(
            ctx,
            `Valid commands: 🤖\n` +
                `\n/lb \\- Send your last logged movie` +
                `\n\`/setlb your_username\` \\- Set your Letterboxd username` +
                `\n/profilelb \\- Send stats from your Letterboxd` +
                `\n/gridlb \\- Generate a grid collage` +
                `\n\nInline Mode \\- In any chat, type ${config.bot.username} to load your Letterboxd diary` +
                `\n\nAccess ${config.bot.news_channel} for news and server status`,
            { parse_mode: "MarkdownV2" },
        );
    } catch (error) {
        console.error(error);
    }
}

export { botstatuslb, gridlb, help, inlineQuery, lb, profilelb, setlb, start };

import config from "../config.js";
import { logCommand } from "../database/services/commandUsageLog.js";
import { setLetterboxdUsername } from "../database/services/user.js";
import errorHandler from "../handlers/errorHandler.js";
import createEntity from "../utils/createEntity.js";
import { sendTextMessage } from "../utils/messageSender.js";

async function setlb(ctx) {
    const telegram_id = ctx.message.from.id;
    const chat_id = ctx.message.chat.id;
    const text = ctx.update.message.text.split(" ");
    const [command, letterboxd_user] = text;

    logCommand("setlb", telegram_id, chat_id);

    try {
        await ctx.replyWithChatAction("typing");

        if (!letterboxd_user) return errorHandler(ctx, "REG_WITHOUT_ARGS");

        const user = await setLetterboxdUsername(telegram_id, letterboxd_user);

        if (user) {
            const extras = {
                reply_to_message_id: ctx.message.message_id,
                entities: [],
            };

            const message =
                `${letterboxd_user} set as your Letterboxd username ✅` +
                `\n\n➡️ Access ${config.bot.news_channel} for news and server status\n` +
                `\nOn Last.fm? 🔴🎵 Give @telelastfmbot a try`;

            extras.entities.push(
                createEntity(
                    message.indexOf(letterboxd_user),
                    letterboxd_user.length,
                    "bold",
                ),
            );

            await sendTextMessage(ctx, message, extras);
        }
    } catch (error) {
        errorHandler(ctx, error, letterboxd_user);
    }
}

export default setlb;

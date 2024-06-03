import { logCommand } from '../database/services/commandUsageLog.js'
import { getLetterboxdUser } from '../database/services/user.js'
import errorHandler from '../handlers/errorHandler.js'
import { getLetterboxdUserStats } from '../services/letterboxd.js'
import aboutModel from './formatters/aboutModel.js'

async function about(ctx) {

    const telegram_id = ctx.message.from.id
    const chat_id = ctx.message.chat.id
    const first_name = ctx.update.message.from.first_name

    logCommand('about', telegram_id, chat_id)

    try {
        await ctx.replyWithChatAction('typing')

        const letterboxd_user = await getLetterboxdUser(telegram_id)
        if (!letterboxd_user) throw 'USER_NOT_FOUND'

        const {
            watchedFilms,
            watchedFilmsThisYear,
            lastFilms
        } = await getLetterboxdUserStats(letterboxd_user)

        const dataToFormat = {
            first_name,
            profile_link: `https://letterboxd.com/${letterboxd_user}`,
            watchedFilms,
            watchedFilmsThisYear,
            lastFilms
        }

        const message = aboutModel(dataToFormat)
        const extras = {
            entities: message.entities,
            link_preview_options: message.link_preview_options,
            reply_to_message_id: ctx.message?.message_id
        }

        ctx.reply(message.text, extras)

    } catch (error) {
        errorHandler(ctx, error)
    }
}

export default about
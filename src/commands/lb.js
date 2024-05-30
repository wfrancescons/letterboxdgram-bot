import { logCommand } from '../database/services/commandUsageLog.js'
import { getLetterboxdUser } from '../database/services/user.js'
import errorHandler from '../handlers/errorHandler.js'
import { getLastFilmsSeen } from '../services/letterboxd.js'
import lbFormatter from './formatters/lbFormatter.js'

async function lb(ctx) {

    const telegram_id = ctx.message.from.id
    const chat_id = ctx.message.chat.id
    const first_name = ctx.update.message.from.first_name

    logCommand('lb', telegram_id, chat_id)

    try {
        await ctx.replyWithChatAction('typing')

        const letterboxd_user = await getLetterboxdUser(telegram_id)
        if (!letterboxd_user) throw 'USER_NOT_FOUND'

        const lastFilms = await getLastFilmsSeen(letterboxd_user, 1)
        const lastFilm = lastFilms[0]

        const message = lbFormatter({
            first_name,
            ...lastFilm
        })

        const extras = {
            entities: message.entities,
            link_preview_options: message.link_preview_options,
            reply_markup: message.reply_markup
        }

        ctx.reply(message.text, extras)

    } catch (error) {
        errorHandler(ctx, error)
    }
}

export default lb
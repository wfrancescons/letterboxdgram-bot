import { getLetterboxdUserStats } from '../controllers/letterboxd.js'
import { getLetterboxdUser } from '../database/user.js'
import errorHandler from '../handlers/errorHandler.js'
import aboutModel from './models/aboutModel.js'

async function about(ctx) {

    const telegram_id = ctx.message.from.id

    try {
        await ctx.replyWithChatAction('typing')

        const chat_id = ctx.message.chat.id
        let { first_name } = ctx.update.message.from

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
            link_preview_options: message.link_preview_options
        }

        ctx.reply(message.text, extras)

    } catch (error) {
        errorHandler(ctx, error)
    }
}

export default about
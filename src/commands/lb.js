import { getLastFilmsSeen } from '../controllers/letterboxd.js'
import { getLetterboxdUser } from '../database/user.js'
import errorHandler from '../handlers/errorHandler.js'
import lbModel from './models/lbModel.js'

async function lb(ctx) {

    const telegram_id = ctx.message.from.id

    try {
        await ctx.replyWithChatAction('typing')

        const chat_id = ctx.message.chat.id
        let { first_name } = ctx.update.message.from

        const letterboxd_user = await getLetterboxdUser(telegram_id)
        if (!letterboxd_user) throw 'USER_NOT_FOUND'

        const [lastFilm] = await getLastFilmsSeen(letterboxd_user, 1)

        if (!lastFilm) throw 'ZERO_ACTIVITIES'

        const regex = /<img\s+src\s*=\s*["']([^"']+)["']/i;
        const match = lastFilm.description[0].match(regex)

        let posterImgUrl = 'https://a.ltrbxd.com/logos/letterboxd-logo-alt-v-neg-rgb-1000px.png'
        if (match && match[1]) posterImgUrl = match[1]

        const dataToFormat = {
            first_name,
            film_name: lastFilm['letterboxd:filmTitle'][0],
            when: lastFilm['letterboxd:watchedDate'],
            rewatch: lastFilm['letterboxd:rewatch'][0] === 'No' ? false : true,
            rating: lastFilm['letterboxd:memberRating'] || null,
            image: posterImgUrl,
            link_review: lastFilm['link']
        }

        const message = lbModel(dataToFormat)
        const extras = {
            entities: message.entities,
            link_preview_options: message.link_preview_options
        }

        ctx.reply(message.text, extras)

    } catch (error) {
        errorHandler(ctx, error)
    }
}

export default lb
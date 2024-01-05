import { getLastFilmsSeen } from '../controllers/letterboxd.js'
import { getLetterboxdUser } from '../database/user.js'
import errorHandler from '../handlers/errorHandler.js'
import lbModel from './models/lbModel.js'

async function inlineQuery(ctx) {

    const telegram_id = ctx.update.inline_query.from.id
    const first_name = ctx.update.inline_query.from.first_name

    try {

        const letterboxd_user = await getLetterboxdUser(telegram_id)
        if (!letterboxd_user) throw 'USER_NOT_FOUND'

        const letterboxdData = await getLastFilmsSeen(letterboxd_user)
        const lastFilm = letterboxdData.rss.channel[0].item?.[0]
        if (!lastFilm) throw 'ZERO_ACTIVITIES'

        const regex = /<img\s+src\s*=\s*["']([^"']+)["']/i;
        const match = lastFilm.description[0].match(regex)

        let posterImgUrl
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

        const results = [
            {
                type: 'article',
                id: 1,
                title: '📽️ Film:',
                description: dataToFormat.film_name,
                thumb_url: dataToFormat.image,
                input_message_content: {
                    message_text: message.text,
                    entities: message.entities
                }
            }
        ]

        await ctx.answerInlineQuery(results, { is_personal: true, cache_time: 5 })

    } catch (error) {
        errorHandler(ctx, error)
    }
}

export default inlineQuery
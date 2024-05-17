import { getLastFilmsSeen } from '../controllers/letterboxd.js'
import { logCommand } from '../database/commandUsageLogs.js'
import { getLetterboxdUser } from '../database/user.js'
import errorHandler from '../handlers/errorHandler.js'
import lbModel from './models/lbModel.js'

async function inlineQuery(ctx) {

    console.log(ctx.update)
    const telegram_id = ctx.update.inline_query.from.id
    const chat_id = ctx.update.inline_query.from.id
    const first_name = ctx.update.inline_query.from.first_name

    logCommand('inline_query', telegram_id, chat_id)

    try {

        const letterboxd_user = await getLetterboxdUser(telegram_id)
        if (!letterboxd_user) throw 'USER_NOT_FOUND'

        const lastFilms = await getLastFilmsSeen(letterboxd_user, 10)
        if (!lastFilms.length) throw 'ZERO_ACTIVITIES'

        const films = lastFilms.reduce((sum, current) => {

            const regex = /<img\s+src\s*=\s*["']([^"']+)["']/i;
            const match = current.description[0].match(regex)

            let posterImgUrl = 'https://a.ltrbxd.com/logos/letterboxd-logo-alt-v-neg-rgb-1000px.png'
            if (match && match[1]) posterImgUrl = match[1]

            const dataToFormat = {
                first_name,
                film_name: current['letterboxd:filmTitle'][0],
                when: current['letterboxd:watchedDate'],
                rewatch: current['letterboxd:rewatch'][0] === 'No' ? false : true,
                rating: current['letterboxd:memberRating'] || null,
                image: posterImgUrl,
                link_review: current['link']
            }

            const formatedMessage = lbModel(dataToFormat)

            sum.content.push({
                type: 'photo',
                id: sum.id,
                photo_url: dataToFormat.image,
                thumbnail_url: dataToFormat.image,
                title: dataToFormat.film_name,
                description: dataToFormat.film_name,
                thumb_url: dataToFormat.image,
                caption: dataToFormat.film_name,
                input_message_content: {
                    message_text: formatedMessage.text,
                    entities: formatedMessage.entities
                }
            })

            sum.id++

            return sum
        }, { id: 1, content: [] })

        const results = []
        films.content.map(x => results.push(x))

        await ctx.answerInlineQuery(results, { is_personal: true, cache_time: 1 })

    } catch (error) {
        errorHandler(ctx, error)
    }
}

export default inlineQuery
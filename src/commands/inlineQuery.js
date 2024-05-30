import { logCommand } from '../database/services/commandUsageLog.js'
import { getLetterboxdUser } from '../database/services/user.js'
import errorHandler from '../handlers/errorHandler.js'
import { getLastFilmsSeen } from '../services/letterboxd.js'
import lbFormatter from './formatters/lbFormatter.js'

async function inlineQuery(ctx) {

    const telegram_id = ctx.update.inline_query.from.id
    const chat_id = ctx.update.inline_query.from.id
    const first_name = ctx.update.inline_query.from.first_name

    logCommand('inline_query', telegram_id, chat_id)

    try {

        const letterboxd_user = await getLetterboxdUser(telegram_id)
        if (!letterboxd_user) throw 'USER_NOT_FOUND'

        const lastFilms = await getLastFilmsSeen(letterboxd_user, 15)

        const films = lastFilms.reduce((sum, current) => {

            const message = lbFormatter({
                first_name,
                ...current
            })

            const article = {
                type: 'article',
                id: sum.id,
                title: `${current.film.title} (${current.film.year})`,
                description: `${current.rating.text ? current.rating.text : ''}`,
                input_message_content: {
                    message_text: message.text,
                    entities: message.entities
                },
                reply_markup: message.reply_markup
            }

            if (current.film.image && current.film.image.small) {
                article.thumb_url = current.film.image.small
            }

            sum.content.push(article)
            sum.id++

            return sum
        }, { id: 1, content: [] })

        const results = []
        films.content.map(x => results.push(x))

        await ctx.answerInlineQuery(results, { is_personal: true, cache_time: 0 })

    } catch (error) {
        errorHandler(ctx, error)
    }
}

export default inlineQuery

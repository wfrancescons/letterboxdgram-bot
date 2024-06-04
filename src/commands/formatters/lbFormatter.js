import createEntity from '../../utils/createEntity.js'
import limitText from '../../utils/limitText.js'

function lbFormatter(item) {
    const {
        first_name,
        film,
        date,
        isRewatch,
        rating,
        review,
        spoilers,
        link
    } = item

    if (!first_name || !film || !date || !link) {
        throw new Error('Missing required fields')
    }

    const stringOptions = {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
    }

    const entities = []
    const link_preview_options = {
        prefer_large_media: true
    }
    const reply_markup = {
        inline_keyboard: [[{
            text: 'Check it out on Letterboxd',
            url: link
        }]]
    }

    const text = [
        `${first_name} ${isRewatch ? 'rewatched' : 'watched'}:`,
        `\n📽️ ${film.title}${film.year ? ` (${film.year})` : ''}`,
        `\n📅 ${new Date(date.watched).toLocaleString('pt-BR', stringOptions)}`
    ]

    // Set 'first_name' as bold
    entities.push(createEntity(0, first_name.length, 'bold'))

    // Set film's title as bold
    const filmTitleOffset = text[0].length + '\n📽️ '.length
    entities.push(createEntity(filmTitleOffset, `${film.title} (${film.year})`.length, 'bold'))

    // Set film's poster as image preview
    if (film.image && film.image.large) {
        const emojiOffset = text[0].length + 1
        entities.push(createEntity(emojiOffset, '📽️'.length, 'text_link', film.image.large))
        link_preview_options.url = film.image.large
    }

    // Add rating to the message
    if (rating.text) {
        text.push(`\n📈 ${rating.text}`)
    }

    // Add review to the message
    if (review) {
        text.push(`\n\n 📝 Review:\n`)
        const limitedReview = limitText(review, 400)
        text.push(limitedReview)

        const reviewIndex = text.slice(0, -1).reduce((sum, current) => sum + current.length, 0)

        entities.push(createEntity(reviewIndex, limitedReview.length, 'blockquote'))

        // Set blockquote as spoiler if true
        if (spoilers) {
            entities.push(createEntity(reviewIndex, limitedReview.length, 'spoiler'))
        }
    }

    return {
        text: text.join(''),
        entities,
        link_preview_options,
        reply_markup
    }
}

export default lbFormatter
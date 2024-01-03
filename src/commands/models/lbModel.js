function lbModel(data) {

    const {
        first_name,
        film_name,
        when,
        rewatch,
        rating,
        image,
        link_review
    } = data

    const ratingStars = {
        '0.5': '½', '1.0': '★',
        '1.5': '★½', '2.0': '★★',
        '2.5': '★★½', '3.0': '★★★',
        '3.5': '★★★½', '4.0': '★★★★',
        '4.5': '★★★★½', '5.0': '★★★★★',
    }

    const stringOptions = {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
    }

    const text = [
        `${first_name} ${rewatch ? 'rewatched' : 'watched'} to:`,
        `\n📽️ ${film_name}`,
        `\n📅 ${new Date(when).toLocaleString('pt-BR', stringOptions)}`
    ]

    if (rating) {
        text.push(`\n📈 ${ratingStars[rating]}`)
    }

    text.push('\n➡️ Read the review')

    const filmNameIndex = text[0].length + '\n📽️ '.length

    const slicedText = text.slice(0, text.length - 1)
    const reviewIndex = slicedText.reduce((sum, current) => sum + current.length, 0)

    const entities = [

        {
            offset: 0,
            length: first_name.length,
            type: 'bold',
        },
        {
            offset: filmNameIndex,
            length: film_name.length,
            type: 'bold',
        },
        {
            offset: text[0].length + 1,
            length: '📽️'.length,
            type: 'text_link',
            url: image
        },
        {
            offset: reviewIndex + '\n ➡️'.length,
            length: 'Read the review'.length,
            type: 'text_link',
            url: link_review[0]
        }

    ]

    const link_preview_options = {
        prefer_large_media: true,
        url: image
    }


    return {
        text: text.join(''),
        entities,
        link_preview_options
    }

}

export default lbModel
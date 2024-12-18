function profilelb(data) {

    const {
        first_name,
        profile_link,
        watchedFilms,
        watchedFilmsThisYear,
        lastFilms
    } = data

    const text = [
        `👤 ${first_name.endsWith('s') ? first_name + '\'' : first_name + '\'s'} Letterboxd:`,
        `\n\n📽️ Watched Films: ${watchedFilms}`,
        `\n📅 This Year: ${watchedFilmsThisYear}`
    ]

    if (lastFilms.length) {
        text.push(`\n\n⏰ Recent Activity:`)
        lastFilms.map(title => text.push(`\n${title}`))
    }

    const entities = [

        {
            // Name in bold
            offset: '👤 '.length,
            length: (text[0].length - ' Letterboxd:'.length - '👤 '.length),
            type: 'bold',
        },
        {
            // Link in Name
            offset: '👤 '.length,
            length: (text[0].length - ' Letterboxd:'.length - '👤 '.length),
            type: 'text_link',
            url: profile_link
        }

    ]

    const link_preview_options = {
        prefer_small_media: true
    }


    return {
        text: text.join(''),
        entities,
        link_preview_options
    }

}

export default profilelb

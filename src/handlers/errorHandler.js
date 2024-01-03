export default async (ctx, error, info) => {

    const extras = { reply_to_message_id: ctx.message.message_id }

    try {
        switch (error) {

            case 'USER_NOT_FOUND': {
                await ctx.replyWithMarkdown('Type `/reg letterboxdmusername` to set your Letterboxd\'s username', extras)
                break
            }

            case 'REG_WITHOUT_ARGS': {
                await ctx.replyWithMarkdown(
                    'Type /reg with with your Letterboxd\'s username. \n' +
                    'Example: `/reg letterboxdmusername` \n' +
                    'Please, try again 🙂',
                    extras
                )
                break
            }

            case 'NOT_A_VALID_LETTERBOXD_USER': {
                extras.entities = [{
                    offset: 0,
                    length: info.length,
                    type: 'bold'
                }]
                await ctx.reply(
                    `${info} doesn't seem to be a valid Letterboxd's username 🤔 \n` +
                    `Please, try again 🙂`,
                    extras
                )
                break
            }

            case 'COMMON_ERROR': {
                await ctx.reply(
                    'Something went wrong with Letterboxd 🥴 \n' +
                    'But don\'t fret, let\'s give it another shot in a couple of minutes.\n' +
                    'If the issue keeps happening, contact me @telelastfmsac',
                    extras
                )
                break
            }

            default: {
                console.error('Error:', error)
                await ctx.reply(
                    'Something went wrong with Letterboxd 🥴 \n' +
                    'But don\'t fret, let\'s give it another shot in a couple of minutes.\n' +
                    'If the issue keeps happening, contact me @telelastfmsac',
                    extras
                )
                break
            }

        }
    } catch (error) {
        console.error(`Unknown error with ${ctx.from.id} user. Message: ${error}`)
    }
}
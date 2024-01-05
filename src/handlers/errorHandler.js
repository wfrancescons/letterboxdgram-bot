export default async (ctx, error, info) => {

    const extras = { reply_to_message_id: ctx.message?.message_id }
    const isInlineQuery = ctx.update?.inline_query

    try {
        switch (error) {

            case 'USER_NOT_FOUND': {

                if (isInlineQuery) {
                    const response = [{
                        type: 'article',
                        id: 1,
                        title: '⚠️ User not found',
                        description: 'Use /reg_lb to set your Letterboxd\'s username',
                        input_message_content: {
                            message_text: 'Type /reg_lb to set your Letterboxd\'s username'
                        }
                    }]

                    await ctx.answerInlineQuery(response)
                    break
                }

                await ctx.replyWithMarkdown('Type `/reg_lb letterboxdmusername` to set your Letterboxd\'s username', extras)
                break
            }

            case 'REG_WITHOUT_ARGS': {
                await ctx.reply(
                    'Type /reg_lb with with your Letterboxd\'s username.\n' +
                    'Example: /reg_lb letterboxdmusername \n' +
                    'Please, try again 🙂', extras
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

            case 'ZERO_ACTIVITIES': {

                if (isInlineQuery) {
                    const response = [{
                        type: 'article',
                        id: 1,
                        title: '⚠️ No films found',
                        description: 'There aren\'t any film in your Letterboxd. 🙁',
                        input_message_content: {
                            message_text: '⚠️ No films found'
                        }
                    }]

                    await ctx.answerInlineQuery(response)
                    break
                }

                await ctx.replyWithMarkdown(
                    'There aren\'t any film in your Letterboxd. 🙁\n' +
                    'Is your username correct? 🤔\n' +
                    'Type `/reg_lb letterboxdmusername` to set your Letterboxd\'s username',
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
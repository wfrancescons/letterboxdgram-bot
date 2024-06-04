import { sendTextMessage } from '../utils/messageSender.js'

export default async (ctx, error, info) => {

    const extras = { reply_to_message_id: ctx.message?.message_id }
    const isInlineQuery = ctx.update?.inline_query

    try {
        switch (error) {

            case 'COLLAGE_INCORRECT_ARGS': {

                extras.parse_mode = 'MarkdownV2'

                await sendTextMessage(ctx,
                    'Invalid argumments 🤔\n\n' +
                    '✅ Type a columns x rows value greater than 0 and up to 4\n' +
                    '\n➡️ Examples:\n' +
                    '`/collage 3x3`\n' +
                    '`/collage 4x1`\n' +
                    '`/collage 4x4 notext`',
                    extras
                )
                break
            }

            case 'USER_NOT_FOUND': {

                if (isInlineQuery) {
                    const response = [{
                        type: 'article',
                        id: 1,
                        title: '⚠️ User not found',
                        description: 'Use /reg to set your Letterboxd\'s username',
                        input_message_content: {
                            message_text: 'Type /reg to set your Letterboxd\'s username'
                        }
                    }]

                    await ctx.answerInlineQuery(response)
                    break
                }

                extras.parse_mode = 'MarkdownV2'

                await sendTextMessage(ctx, 'Type `/reg letterboxdmusername` to set your Letterboxd\'s username', extras)
                break
            }

            case 'REG_WITHOUT_ARGS': {
                await sendTextMessage(ctx,
                    'Type /reg with with your Letterboxd\'s username.' +
                    '\n\n➡️ Example: /reg letterboxdmusername' +
                    '\n\nPlease, try again 🙂', extras
                )
                break
            }

            case 'NOT_A_VALID_LETTERBOXD_USER': {
                extras.entities = [{
                    offset: 0,
                    length: info.length,
                    type: 'bold'
                }]
                await sendTextMessage(ctx,
                    `${info} doesn't seem to be a valid Letterboxd's username 🤔` +
                    `\n\nPlease, try again 🙂`,
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

                extras.parse_mode = 'MarkdownV2'

                await sendTextMessage(ctx,
                    'There aren\'t any film in your Letterboxd. 🙁\n' +
                    'Is your username correct? 🤔\n' +
                    'Type `/reg letterboxdmusername` to set your Letterboxd\'s username',
                    extras
                )
                break
            }

            default: {
                console.error('Error:', error)
                if (error.description.includes('Bad Request')) break
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
import config from '../config.js'
import createEntity from '../utils/createEntity.js'
import { sendTextMessage } from '../utils/messageSender.js'

export default async (ctx, error, info) => {

    const extras = {
        reply_to_message_id: ctx.message?.message_id,
        entities: []
    }
    const isInlineQuery = ctx.update?.inline_query

    try {
        switch (error) {

            case 'COLLAGE_INCORRECT_ARGS': {

                extras.parse_mode = 'MarkdownV2'

                await sendTextMessage(ctx,
                    'Invalid argumments 🤔\n\n' +
                    '✅ Type a columns x rows value greater than 0 and up to 4\n' +
                    '\n➡️ Examples:\n' +
                    '`/gridlb 3x3`\n' +
                    '`/gridlb 4x1`\n' +
                    '`/gridlb 4x4 notext`',
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
                        description: 'Use /setlb to set your Letterboxd username',
                        input_message_content: {
                            message_text: 'Type /setlb to set your Letterboxd username'
                        }
                    }]

                    await ctx.answerInlineQuery(response)
                    break
                }

                const command = '/setlb your_username'
                const message = `⚠️ You need to sign up first to use the bot\n` +
                    `\nWhat's your username on Letterboxd? 🤔\n` +
                    `\n➡️ Type ${command} to set it`

                extras.entities.push(createEntity(message.indexOf(command), command.length, 'code'))

                await sendTextMessage(ctx, message, extras)
                break
            }

            case 'REG_WITHOUT_ARGS': {

                const command = '/setlb your_username'
                const message = `What's your username on Letterboxd? 🤔\n` +
                    `\n➡️ Type ${command} to set it\n` +
                    `\nPlease, try again 🙂`

                extras.entities.push(createEntity(message.indexOf(command), command.length, 'code'))

                await sendTextMessage(ctx, message, extras)
                break
            }

            case 'NOT_A_VALID_LETTERBOXD_USER': {

                const message = `\n${info} isn't a valid Letterboxd username ❌\n` +
                    `\nIs it correct? 🤔\n` +
                    `\nPlease, try again 🙂`

                extras.entities.push(createEntity(message.indexOf(info), info.length, 'bold'))

                await sendTextMessage(ctx, message, extras)
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

                const command = '/setlb your_username'
                const message = `There aren't any film in your Letterboxd Diary 🙁\n` +
                    `Is your username correct? 🤔\n` +
                    `\n➡️ Type ${command} to update it`

                extras.entities.push(createEntity(message.indexOf(command), command.length, 'code'))

                await sendTextMessage(ctx, message, extras)
                break
            }

            default: {
                // TODO
                if (error.description.includes('message to delete not found')) break

                console.error('Error:', error)
                await ctx.reply(
                    'Something went wrong with Letterboxd 🥴\n' +
                    'But don\'t fret, let\'s give it another shot in a couple of minutes.\n' +
                    `If the issue keeps happening, contact me ${config.bot.support_chat}`,
                    extras
                )
                break
            }

        }
    } catch (error) {
        console.error(`Unknown error with ${ctx.from.id} user. Message: ${error}`)
    }
}

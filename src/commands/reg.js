import { setLetterboxdUsername } from '../database/user.js'
import errorHandler from '../handlers/errorHandler.js'

async function reg(ctx) {

    const telegram_id = ctx.message.from.id
    const text = ctx.update.message.text.split(' ')
    const [command, letterboxd_user] = text

    try {
        await ctx.replyWithChatAction('typing')

        if (!letterboxd_user) return errorHandler(ctx, 'REG_WITHOUT_ARGS')

        const user = await setLetterboxdUsername(telegram_id, letterboxd_user)

        const extras = {
            reply_to_message_id: ctx.message.message_id,
            entities: [
                {
                    offset: 0,
                    length: letterboxd_user.length,
                    type: 'bold',
                }
            ]
        }

        if (user) await ctx.reply(`${letterboxd_user} set as your Letterboxd's username ☑️`, extras)

    } catch (error) {
        errorHandler(ctx, error, letterboxd_user)
    }
}

export default reg
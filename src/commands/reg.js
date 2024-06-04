import { logCommand } from '../database/services/commandUsageLog.js'
import { setLetterboxdUsername } from '../database/services/user.js'
import errorHandler from '../handlers/errorHandler.js'
import { sendTextMessage } from '../utils/messageSender.js'

async function reg(ctx) {

    const telegram_id = ctx.message.from.id
    const chat_id = ctx.message.chat.id
    const text = ctx.update.message.text.split(' ')
    const [command, letterboxd_user] = text

    logCommand('reg', telegram_id, chat_id)

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

        if (user) await sendTextMessage(ctx, `${letterboxd_user} set as your Letterboxd's username ☑️`, extras)

    } catch (error) {
        errorHandler(ctx, error, letterboxd_user)
    }
}

export default reg
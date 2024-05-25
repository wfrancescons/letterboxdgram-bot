import { logCommand } from '../database/services/CommandUsageLogService.js'
import { setLetterboxdUsername } from '../database/services/UserService.js'
import errorHandler from '../handlers/errorHandler.js'

async function reg_lb(ctx) {

    const telegram_id = ctx.message.from.id
    const chat_id = ctx.message.chat.id
    const text = ctx.update.message.text.split(' ')
    const [command, letterboxd_user] = text

    logCommand('reg_lb', telegram_id, chat_id)

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

export default reg_lb
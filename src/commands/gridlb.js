import { logCommand } from '../database/services/commandUsageLog.js'
import { getLetterboxdUser } from '../database/services/user.js'
import errorHandler from '../handlers/errorHandler.js'
import renderCanvas from '../rendering/renderCanva.js'
import { getLastFilmsSeen } from '../services/letterboxd.js'
import createEntity from '../utils/createEntity.js'
import { sendPhotoMessage, sendTextMessage } from '../utils/messageSender.js'
import gridlbTemplate from './templates/gridlbTemplate.js'

async function gridlb(ctx) {

    const telegram_id = ctx.message.from.id
    const chat_id = ctx.message.chat.id
    const first_name = ctx.update.message.from.first_name
    const args = ctx.update.message.text.trim().toLowerCase().split(' ')

    logCommand('gridlb', telegram_id, chat_id)

    try {
        await ctx.replyWithChatAction('typing')

        const letterboxd_user = await getLetterboxdUser(telegram_id)
        if (!letterboxd_user) throw 'USER_NOT_FOUND'

        const grid_regex = /^(\d+)x(\d+)$/
        let grid = args.find(arg => arg.match(grid_regex))
        let param = args.find(arg => arg === 'notext')

        if (!grid) grid = '4x3'

        //verifica se a grade é composta por números e >= 1x1 e <= 4x4
        const regex_result = grid.match(grid_regex)
        if (!regex_result) return errorHandler(ctx, 'COLLAGE_INCORRECT_ARGS')

        const COLUMNS = Number(regex_result[1])
        const ROWS = Number(regex_result[2])

        if ((COLUMNS > 4 || COLUMNS < 1) || (ROWS > 4 || ROWS < 1)) return errorHandler(ctx, 'COLLAGE_INCORRECT_ARGS')

        const lastFilms = await getLastFilmsSeen(letterboxd_user, COLUMNS * ROWS)

        const responseExtra = {
            reply_to_message_id: ctx.message?.message_id,
            entities: []
        }

        const exampleCommand = '/gridlb 4x1 notext'
        const tipText = '💡 Tip: you can define your grid or make a collage with no text\n'
        const responseMessage = `Generating your ${grid} grid 🟠🟢🔵\n` +
            `⏰ It may take a while\n` +
            `\n${tipText}` +
            `\n➡️ Example: ${exampleCommand}`

        responseExtra.entities.push(createEntity(responseMessage.indexOf(tipText), tipText.length, 'italic'))
        responseExtra.entities.push(createEntity(responseMessage.indexOf(exampleCommand), exampleCommand.length, 'code'))

        const response = await sendTextMessage(ctx, responseMessage, responseExtra)

        const extra = {
            reply_to_message_id: ctx.message?.message_id,
            caption: `${first_name}, your ${grid} grid`
        }

        await ctx.replyWithChatAction('upload_photo')

        const template = gridlbTemplate(lastFilms, COLUMNS, ROWS, param)
        const canva = await renderCanvas(template)

        await sendPhotoMessage(ctx, { source: canva }, extra)
        await ctx.deleteMessage(response.message_id)

    } catch (error) {
        errorHandler(ctx, error)
    }
}

export default gridlb
import { logCommand } from '../database/services/commandUsageLog.js'
import { getLetterboxdUser } from '../database/services/user.js'
import errorHandler from '../handlers/errorHandler.js'
import renderCanvas from '../rendering/renderCanva.js'
import { getLastFilmsSeen } from '../services/letterboxd.js'
import createEntity from '../utils/createEntity.js'
import { sendPhotoMessage, sendTextMessage } from '../utils/messageSender.js'
import gridlbTemplate from './templates/gridlbTemplate.js'

const MAX_ROWS = 7
const MIN_ROWS = 1
const MAX_COLUMNS = 7
const MIN_COLUMNS = 1
const DEFAULT_GRID = '4x3'
const GRID_REGEX = /^(\d+)x(\d+)$/

function parseArgs(args) {
    let grid = args.find(arg => arg.match(GRID_REGEX)) || DEFAULT_GRID
    let param = args.find(arg => arg === 'notext')
    return { grid, param }
}

function validateGrid(grid) {
    const match = grid.match(GRID_REGEX)
    if (!match) throw 'COLLAGE_INCORRECT_ARGS'

    const COLUMNS = Number(match[1])
    const ROWS = Number(match[2])

    if (COLUMNS > MAX_COLUMNS || COLUMNS < MIN_COLUMNS || ROWS > MAX_ROWS || ROWS < MIN_ROWS) {
        throw 'COLLAGE_INCORRECT_ARGS'
    }

    return { COLUMNS, ROWS }
}

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

        const { grid, param } = parseArgs(args)
        const { COLUMNS, ROWS } = validateGrid(grid)

        const lastFilms = await getLastFilmsSeen(letterboxd_user, COLUMNS * ROWS)

        const responseExtra = {
            reply_to_message_id: ctx.message?.message_id,
            entities: []
        }

        const exampleCommand = '/gridlb 4x1 notext'
        const tipText = '💡 Tip: you can define your grid or make a collage with no text\n'
        const responseMessage = `Generating your ${grid} grid...\n` +
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

        const templateData = {
            lastFilms,
            columns: COLUMNS,
            rows: ROWS,
            param
        }

        const template = gridlbTemplate(templateData)
        const canva = await renderCanvas(template)

        await sendPhotoMessage(ctx, { source: canva }, extra)
        await ctx.deleteMessage(response.message_id)

    } catch (error) {
        errorHandler(ctx, error)
    }
}

export default gridlb
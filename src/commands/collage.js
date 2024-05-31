import { logCommand } from '../database/services/commandUsageLog.js'
import { getLetterboxdUser } from '../database/services/user.js'
import errorHandler from '../handlers/errorHandler.js'
import { getLastFilmsSeen } from '../services/letterboxd.js'
import generateGrid from './templates/collageTemplate.js'

async function collage(ctx) {

    const telegram_id = ctx.message.from.id
    const chat_id = ctx.message.chat.id
    const first_name = ctx.update.message.from.first_name
    const args = ctx.update.message.text.trim().toLowerCase().split(' ')

    logCommand('collage', telegram_id, chat_id)

    try {
        await ctx.replyWithChatAction('upload_photo')

        const letterboxd_user = await getLetterboxdUser(telegram_id)
        if (!letterboxd_user) throw 'USER_NOT_FOUND'

        const grid_regex = /^(\d+)x(\d+)$/
        let grid = args.find(arg => arg.match(grid_regex))
        let param = args.find(arg => arg === 'norating')

        if (!grid) grid = '4x3'

        //verifica se a grade é valida - >= 2x2 e <= 4x4
        const regex_result = grid.match(grid_regex)
        if (!regex_result) return errorHandler(ctx, 'COLLAGE_INCORRECT_ARGS')

        const COLUMNS = Number(regex_result[1])
        const ROWS = Number(regex_result[2])

        if ((COLUMNS > 4 || COLUMNS < 2) || (ROWS > 4 || ROWS < 2)) return errorHandler(ctx, 'COLLAGE_INCORRECT_ARGS')

        const lastFilms = await getLastFilmsSeen(letterboxd_user, COLUMNS * ROWS)
        const image = await generateGrid(lastFilms, COLUMNS, ROWS, param)

        ctx.replyWithPhoto({ source: image }, { caption: `${first_name}, your ${grid} collage` })

    } catch (error) {
        errorHandler(ctx, error)
    }
}

export default collage
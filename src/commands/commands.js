import { logCommand } from '../database/services/commandUsageLog.js'
import about from './about.js'
import collage from './collage.js'
import inlineQuery from './inlineQuery.js'
import lb from './lb.js'
import reg from './reg.js'

// Start command
async function start(ctx) {

    const telegram_id = ctx.message.from.id
    const chat_id = ctx.message.chat.id
    const first_name = ctx.update.message.from.first_name

    logCommand('start', telegram_id, chat_id)

    try {

        await ctx.replyWithChatAction('typing')

        await ctx.reply(
            `Hello, ${first_name} 👋\n` +
            `\nWelcome to the letterboxd bot 🤖🎵\n` +
            `\nUse /reg to set your Letterboxd's username\n` +
            `\nType / or /help to see a list of valid commands\n` +
            `\nAccess @telelastfmnews for server status and news 📰`
        )

    } catch (error) {
        console.error(error)
    }
}

// Help command
async function help(ctx) {

    const telegram_id = ctx.message.from.id
    const chat_id = ctx.message.chat.id

    logCommand('help', telegram_id, chat_id)

    try {
        await ctx.replyWithChatAction('typing')

        await ctx.replyWithMarkdown(
            `Valid commands: 🤖\n` +
            `\n/lb - See your last watched movie` +
            `\n\`/reg letterboxduser\` - Set your Letterboxd's username` +
            `\n/about - See stats from your Letterboxd` +
            `\n/collage - Generate a grid collage`
        )

    } catch (error) {
        console.error(error)
    }
}

export {
    about, collage, help, inlineQuery, lb, reg,
    start
}


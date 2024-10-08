import { Telegraf } from 'telegraf'
import config from './config.js'
import sequelize from './database/database.js'

import * as Commands from './commands/commands.js'

const bot = new Telegraf(config.bot.token)

try {
    console.log('BOT: starting components')

    // Try to connect to database
    await sequelize.authenticate()

    // Set bot 'Description'
    bot.telegram.setMyDescription('Share your Letterboxd activity with your friends 🎥')

    // Set bot 'About'
    const aboutDescription = `Share your Letterboxd activity with your friends 🎥\n` +
        `\n📰 News: ${config.bot.news_channel}\n` +
        `💬 Need help? Support: ${config.bot.support_chat}`

    if (aboutDescription.length <= 120) {
        bot.telegram.setMyShortDescription(aboutDescription)
    } else console.log(`BOT: 'About' section unchanged as string is longer than 120 characters`)

    // Set command descriptions
    bot.telegram.setMyCommands([
        { command: 'lb', description: 'Send your last logged movie' },
        { command: 'gridlb', description: 'Generate a grid collage' },
        { command: 'profilelb', description: 'Send stats from your Letterboxd' },
        { command: 'setlb', description: 'Set your Letterboxd username' },
        { command: 'help', description: 'Send a list of valid commands' }
    ])

    // Ignore channel messages
    bot.use((ctx, next) => {
        if (ctx.message) {
            const isFromChannel = ctx.message.chat?.type === 'channel'
            const isForwardedFromChannel = ctx.message.forward_from_chat?.type === 'channel'
            const isFromTelegram = ctx.from?.id === 777000

            if (isFromChannel || isForwardedFromChannel || isFromTelegram) {
                return
            }
        }

        return next()
    })

    // Set bot response
    bot.start((ctx) => Commands.start(ctx))
    bot.help((ctx) => Commands.help(ctx))

    bot.command('collage', (ctx) => ctx.reply(`Comando alterado para /gridlb\nMais informações: ${config.bot.news_channel}`))

    bot.command('lb', (ctx) => {
        (async () => {
            await Commands.lb(ctx)
        })()
    })

    bot.command('gridlb', (ctx) => {
        (async () => {
            await Commands.gridlb(ctx)
        })()
    })

    bot.command('profilelb', (ctx) => {
        (async () => {
            await Commands.profilelb(ctx)
        })()
    })

    bot.command('setlb', (ctx) => {
        (async () => {
            await Commands.setlb(ctx)
        })()
    })

    bot.on('inline_query', (ctx) => Commands.inlineQuery(ctx))

    // Set development webhook
    if (config.environment === 'development') {
        import('node:http').then((http) => {
            http.createServer(bot.webhookCallback('/secret-path')).listen(3000)
        }).catch(error => console.error(error))
    }

    bot.launch()

    console.log(`BOT: running in ${config.environment} environment`)
} catch (error) {
    console.error('BOT: error when starting - ', error)
}

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

export default bot

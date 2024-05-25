import { Telegraf } from 'telegraf'
import config from './config.js'
import sequelize from './database/index.js'

import * as Commands from './commands/index.js'

const bot = new Telegraf(config.bot_token)

try {
    console.log('BOT: starting components')

    // Try to connect to database
    await sequelize.authenticate()

    // Set bot response
    bot.start((ctx) => Commands.start(ctx))
    bot.help((ctx) => Commands.help(ctx))

    bot.command(['lb'], (ctx) => Commands.lb(ctx))
    bot.command('reg_lb', (ctx) => Commands.reg_lb(ctx))
    bot.command('about', (ctx) => Commands.about(ctx))

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
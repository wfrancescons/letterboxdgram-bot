import { Telegraf } from 'telegraf'
import config from './config.js'

import * as Commands from './commands/index.js'

const bot = new Telegraf(config.bot_token)

try {
    // Set bot response
    bot.start((ctx) => Commands.start(ctx))
    bot.help((ctx) => Commands.help(ctx))

    bot.command(['lb'], (ctx) => Commands.lb(ctx))
    bot.command('reg_lb', (ctx) => Commands.reg(ctx))

    // Set development webhook
    if (config.environment === 'development') {
        import('node:http').then((http) => {
            http.createServer(bot.webhookCallback('/secret-path')).listen(3000)
        }).catch(error => console.error(error))
    }

    bot.launch()

    console.log(`BOT: Running in ${config.environment} environment`)
} catch (error) {
    console.error('BOT: Erro ao iniciar', error)
}

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

export default bot
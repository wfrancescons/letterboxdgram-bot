const config = {
    environment: process.env.NODE_ENV,
    bot_token: process.env.TELEGRAM_BOT_TOKEN,
    sequelize: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_DATABASE,
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        dialect: process.env.DB_DIALECT,
    }
}

export default config
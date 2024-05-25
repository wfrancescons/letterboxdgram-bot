import { Sequelize } from 'sequelize'
import config from '../config.js'

import CommandUsageLogsModel from './models/CommandUsageLogsModel.js'
import UserModel from './models/UserModel.js'

const { host, port, database, username, password, dialect } = config.sequelize

const sequelize = new Sequelize({
    host,
    port,
    database,
    username,
    password,
    dialect,
    logging: config.environment === 'development'
})

const User = UserModel(sequelize)
const CommandUsageLogs = CommandUsageLogsModel(sequelize)

try {
    await sequelize.sync({ alter: true })
    console.log('DB: Tabelas sincronizadas')

    const userCount = await User.count()
    console.log(`DB: Total de registros na tabela Users: ${userCount}`)

    const commandUsageLogsCount = await CommandUsageLogs.count()
    console.log(`DB: Total de registros na tabela CommandUsageLogs: ${commandUsageLogsCount}`)

} catch (error) {
    console.error('DB: Erro ao sincronizar tabelas ou contar registros:', error)
}

export { CommandUsageLogs, User }
export default sequelize
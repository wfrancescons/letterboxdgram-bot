import { Sequelize } from 'sequelize'
import config from '../config.js'

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

export default sequelize
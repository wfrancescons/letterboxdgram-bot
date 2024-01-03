import { Sequelize } from 'sequelize'
import config from '../config.js'

const { username, password, database, host, dialect } = config.sequelize

const sequelize = new Sequelize(database, username, password, {
    host,
    dialect,
    logging: false
})

export default sequelize
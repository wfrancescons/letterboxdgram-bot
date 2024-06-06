import { Sequelize } from 'sequelize'
import config from '../config.js'
import initializeModels from './models/models.js'

const sequelize = new Sequelize({ ...config.sequelize })

const Models = initializeModels(sequelize)

try {
    await sequelize.sync({ alter: true })
    console.log('DB: Tabelas sincronizadas')

    const userCount = await Models.User.count()
    console.log(`DB: Total de registros na tabela Users: ${userCount}`)

} catch (error) {
    console.error('DB: Erro ao sincronizar tabelas ou contar registros:', error)
}

export { Models }
export default sequelize
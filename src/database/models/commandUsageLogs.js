import { DataTypes } from 'sequelize'
import sequelize from '../connect.js'

const CommandUsageLogs = sequelize.define('CommandUsageLogs', {
    telegram_id: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    chat_id: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    command: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    createdAt: 'timestamp',
    updatedAt: false
})

try {
    await sequelize.sync()
    console.log('DB: Tabela "CommandUsageLogs" sincronizada')

} catch (error) {
    console.error('DB: Erro ao sincronizar tabela "CommandUsageLogs":', error)
}

export default CommandUsageLogs
import { DataTypes } from 'sequelize'
import sequelize from '../connect.js'

const User = sequelize.define('user', {
    telegram_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        unique: true,
        primaryKey: true,
    },
    letterboxd_username: {
        type: DataTypes.STRING,
    },
}, { timestamps: true })

try {
    await sequelize.sync()
    console.log('DB: Tabela "users" sincronizada')

    const userCount = await User.count()
    console.log(`DB: Total de registros na tabela "users": ${userCount}`)

} catch (error) {
    console.error('DB: Erro ao sincronizar tabelas ou contar registros:', error)
}

export default User
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

await sequelize.sync()
console.log('DB: Tabela "users" sincronizada')

User.count().then((count) => {
    console.log(`DB: Total de registros na tabela "users": ${count}`);
}).catch((err) => {
    console.error('DB: Erro ao contar registros:', err);
})

export default User
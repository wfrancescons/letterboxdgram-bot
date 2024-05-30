import { DataTypes } from 'sequelize'

function User(sequelize) {
    return sequelize.define('User', {
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
}

export default User
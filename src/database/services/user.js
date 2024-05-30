import { getLetterboxdUserXml } from '../../services/letterboxd.js'
import { Models } from '../database.js'

const { User } = Models

async function createUser(telegram_id, letterboxd_username) {
    try {
        const user = await User.create({ telegram_id, letterboxd_username })
        return user
    } catch (error) {
        throw error
    }
}

async function getUser(telegram_id) {
    try {
        const user = await User.findByPk(telegram_id)
        return user
    } catch (error) {
        throw error
    }
}

async function updateUser(telegram_id, letterboxd_username) {
    try {
        const user = await User.findByPk(telegram_id)
        await user.update({ letterboxd_username })
        return user

    } catch (error) {
        throw error
    }
}

async function getLetterboxdUser(telegram_id) {
    try {
        const user = await getUser(telegram_id)
        return user ? user.letterboxd_username : null
    } catch (error) {
        throw error
    }
}

async function setLetterboxdUsername(telegram_id, letterboxd_username) {
    try {
        const userInfo = await getLetterboxdUserXml(letterboxd_username)
        const user = await getUser(telegram_id)

        if (!user && userInfo) {
            const newUser = await createUser(telegram_id, letterboxd_username)
            return newUser
        } else {
            const updatedUser = await updateUser(telegram_id, letterboxd_username)
            return updatedUser
        }
    } catch (error) {
        throw error
    }
}

export { getLetterboxdUser, getUser, setLetterboxdUsername }


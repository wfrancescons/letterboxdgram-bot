import { parseStringPromise } from 'xml2js'

async function getLetterboxdUserInfo(username) {
    try {
        const response = await fetch(`https://letterboxd.com/${username}/rss/`, {
            signal: AbortSignal.timeout(5000)
        })

        if (!response.ok) {
            if (response.status === 404) {
                throw 'NOT_A_VALID_LETTERBOXD_USER'
            } else {
                throw new Error(`Request failed with status: ${response.status}`)
            }
        }

        const data = response.text()
        return data
    } catch (error) {
        throw error
    }
}

async function getLastFilmsSeen(username) {
    try {
        const xml = await getLetterboxdUserInfo(username)
        const result = await parseStringPromise(xml)
        return result

    } catch (error) {
        console.log(error)
        throw error
    }
}

export { getLastFilmsSeen, getLetterboxdUserInfo }


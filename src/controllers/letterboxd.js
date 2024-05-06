import * as cheerio from 'cheerio'
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

async function getLastFilmsSeen(username, amount = 1) {
    try {
        const xml = await getLetterboxdUserInfo(username)
        const letterboxdUserData = await parseStringPromise(xml)
        const result = letterboxdUserData.rss.channel[0].item?.slice(0, amount)
        return result

    } catch (error) {
        console.log(error)
        throw error
    }
}

async function getLetterboxdUserStats(username) {
    try {

        const html = await fetch(`https://letterboxd.com/${username}/`, {
            signal: AbortSignal.timeout(5000)
        })

        const DOM = cheerio.load(await html.text())

        const stats = DOM('div.profile-stats')

        const watchedFilms = parseInt(stats.find('.profile-statistic:nth-child(1) .value').text())
        const watchedFilmsThisYear = parseInt(stats.find('.profile-statistic:nth-child(2) .value').text())

        const lastFilms = await getLastFilmsSeen(username, 3)
        if (!lastFilms.length) throw 'ZERO_ACTIVITIES'

        const userStats = {
            watchedFilms,
            watchedFilmsThisYear,
            lastFilms: lastFilms.map(film => film.title[0])
        }

        return userStats

    } catch (error) {
        throw error
    }
}

export { getLastFilmsSeen, getLetterboxdUserInfo, getLetterboxdUserStats }


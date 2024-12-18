import * as cheerio from 'cheerio'
import request from '../utils/request.js'

function getRating(element) {
    const memberRating = element.find('letterboxd\\:memberRating').text().toString()

    const scoreToTextMap = {
        '-1.0': null,
        '0.5': '½',
        '1.0': '★',
        '1.5': '★½',
        '2.0': '★★',
        '2.5': '★★½',
        '3.0': '★★★',
        '3.5': '★★★½',
        '4.0': '★★★★',
        '4.5': '★★★★½',
        '5.0': '★★★★★'
    }
    return {
        text: scoreToTextMap[memberRating],
        score: parseFloat(memberRating)
    }
}

function getImage(element) {
    const description = element.find('description').text()
    const $ = cheerio.load(description)
    const image = $('p img').attr('src')

    if (!image) return {}

    const originalImageCropRegex = /-0-.*-crop/
    return {
        tiny: image.replace(originalImageCropRegex, '-0-35-0-50-crop'),
        small: image.replace(originalImageCropRegex, '-0-70-0-105-crop'),
        medium: image.replace(originalImageCropRegex, '-0-150-0-225-crop'),
        large: image.replace(originalImageCropRegex, '-0-230-0-345-crop')
    }
}

function getReview(element) {
    const description = element.find('description').text()
    const $ = cheerio.load(description)
    const reviewParagraphs = $('p')
    let review = ''

    if (reviewParagraphs.length <= 0) {
        return review
    }

    if (reviewParagraphs.last().text().includes('Watched on ')) {
        return review
    }

    reviewParagraphs.each((i, el) => {
        const reviewParagraph = $(el).text()
        if (reviewParagraph !== 'This review may contain spoilers.') {
            review += reviewParagraph + '\n'
        }
    })

    return review.trim()
}

function getSpoilers(element) {
    const titleData = element.find('title').text()
    const containsSpoilersString = '(contains spoilers)'
    return titleData.includes(containsSpoilersString)
}

function processItem(element) {
    const isListItem = element.find('link').html().includes('/list/')

    if (isListItem) return null // Return null for list items

    return {
        date: {
            published: +new Date(element.find('pubDate').text()),
            watched: +new Date(element.find('letterboxd\\:watchedDate').text()),
        },
        film: {
            title: element.find('letterboxd\\:filmTitle').text(),
            year: element.find('letterboxd\\:filmYear').text(),
            image: getImage(element),
        },
        rating: getRating(element),
        review: getReview(element),
        spoilers: getSpoilers(element),
        isRewatch: element.find('letterboxd\\:rewatch').text() === 'Yes',
        link: element.find('link').html(),
    }
}

async function getLetterboxdUserXml(username) {
    try {
        const response = await request(`https://letterboxd.com/${username}/rss/`)

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

async function getUserDiary(username) {
    try {
        const xml = await getLetterboxdUserXml(username)
        const $ = cheerio.load(xml, { xmlMode: true })

        const items = []
        $('item').each((i, element) => {
            const diaryEntry = processItem($(element))
            if (diaryEntry) {
                items.push(diaryEntry) // Only add diary entries
            }
        })
        return items

    } catch (error) {
        throw error
    }
}

async function getLastFilmsSeen(username, amount = 1) {
    try {
        const userDiary = await getUserDiary(username)

        if (!userDiary.length) throw 'ZERO_ACTIVITIES'

        return userDiary.slice(0, amount)

    } catch (error) {
        throw error
    }
}

async function getLetterboxdUserStats(username) {
    try {

        const html = await request(`https://letterboxd.com/${username}/`)

        const DOM = cheerio.load(await html.text())

        const stats = DOM('div.profile-stats')

        const watchedFilms = stats.find('.profile-statistic:nth-child(1) .value').text().replace(',', '.')
        const watchedFilmsThisYear = stats.find('.profile-statistic:nth-child(2) .value').text().replace(',', '.')

        const lastFilms = await getLastFilmsSeen(username, 3)

        const userStats = {
            watchedFilms,
            watchedFilmsThisYear,
            lastFilms: lastFilms.map(item => `${item.film.title} (${item.film.year})`)
        }

        return userStats

    } catch (error) {
        throw error
    }
}

export { getLastFilmsSeen, getLetterboxdUserStats, getLetterboxdUserXml }

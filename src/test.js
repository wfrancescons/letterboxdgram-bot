import * as cheerio from 'cheerio'
import { getLastFilmsSeen } from './controllers/letterboxd.js'

try {

    const html = await fetch('https://letterboxd.com/wfrancescons')

    const DOM = cheerio.load(await html.text())

    const stats = DOM('div.profile-stats')
    const filmeTotal = parseInt(stats.find('.profile-statistic:nth-child(1) .value').text())
    const filmeEsteAno = parseInt(stats.find('.profile-statistic:nth-child(2) .value').text())

    const array = []

    const favourites = DOM('#favourites').find('ul')

    const test = DOM('span.frame-title')
    const favs = favourites.each(function (i, elem) {
        array[i] = DOM(this).text();
    })

    console.log(test)

    const filmes = await getLastFilmsSeen('wfrancescons')
    const ultimosFilmes = filmes.rss.channel[0].item?.slice(0, 3)

    const userStats = {
        filmeTotal,
        filmeEsteAno,
        ultimosFilmes: ultimosFilmes.map(film => film.title[0])
    }

    console.log(userStats)

} catch (error) {
    console.error(error)
}
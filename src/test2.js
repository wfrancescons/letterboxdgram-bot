import * as cheerio from 'cheerio';

const html = await fetch('https://github.com/cheeriojs/cheerio/releases')

const $ = cheerio.load(await html.text())

const data = $.extract({
    releases: [
        {
            // First, we select individual release sections.
            selector: 'section',
            // Then, we extract the release date, name, and notes from each section.
            value: {
                // Selectors are executed whitin the context of the selected element.
                name: 'h2',
                date: {
                    selector: 'relative-time',
                    // The actual date of the release is stored in the `datetime` attribute.
                    value: 'datetime',
                },
                notes: {
                    selector: '.markdown-body',
                    // We are looking for the HTML content of the element.
                    value: 'innerHTML',
                },
            },
        },
    ],
})

console.log(data);
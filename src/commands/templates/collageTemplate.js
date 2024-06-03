const POSTER_WIDTH = 270
const POSTER_HEIGHT = 405
const ICON_SIZE = 23
const ICON_MARGIN = 15
const TEXT_PADDING = 15

// Função auxiliar para quebrar texto em várias linhas
function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ')
    let lines = []
    let currentLine = words[0]

    for (let i = 1; i < words.length; i++) {
        const word = words[i]
        const width = ctx.measureText(currentLine + ' ' + word).width
        if (width < maxWidth) {
            currentLine += ' ' + word
        } else {
            lines.push(currentLine)
            currentLine = word
        }
    }
    lines.push(currentLine)
    return lines
}

function generatePosterData(item, index, COLUMNS, param) {
    const column = index % COLUMNS
    const row = Math.floor(index / COLUMNS)
    const x = column * POSTER_WIDTH
    const y = row * POSTER_HEIGHT

    const posterElements = []

    // Verificar se a imagem do filme está disponível
    if (item.film.image && item.film.image.large) {
        posterElements.push({
            type: 'image',
            src: item.film.image.large,
            x,
            y,
            width: POSTER_WIDTH,
            height: POSTER_HEIGHT
        })
    } else {
        // Adicionar um retângulo transparente caso não haja imagem
        posterElements.push({
            type: 'rectangle',
            fillStyle: 'rgba(0, 0, 0, 0.5)',
            x,
            y,
            width: POSTER_WIDTH,
            height: POSTER_HEIGHT
        })
    }

    if (param === 'notext') return posterElements

    posterElements.push({
        type: 'rectangle',
        fillStyle: {
            type: 'linearGradient',
            colors: [
                { stop: 0, color: 'rgba(14, 14, 14, 0)' },
                { stop: 1, color: 'rgba(14, 14, 14, 0.9)' }
            ],
            x0: x,
            y0: y + POSTER_HEIGHT - 150,
            x1: x,
            y1: y + POSTER_HEIGHT
        },
        x,
        y: y + POSTER_HEIGHT - 150,
        width: POSTER_WIDTH,
        height: 150
    })

    const ctx = {
        measureText: (text) => {
            // Mock measureText to return a pseudo width
            return { width: text.length * 10 }
        }
    }

    const title = `${item.film.title} (${item.film.year})`
    const titleLines = wrapText(ctx, title, POSTER_WIDTH - 2 * TEXT_PADDING)

    // Verificar se deve desenhar o texto na parte inferior
    const shouldDrawTextAtBottom = !item.rating?.text && !item.isRewatch && !item.review

    if (shouldDrawTextAtBottom) {
        // Texto começa na parte inferior
        titleLines.forEach((line, i) => {
            posterElements.push({
                type: 'text',
                text: line,
                x: x + TEXT_PADDING,
                y: y + POSTER_HEIGHT - 20 - (titleLines.length - 1 - i) * 25,
                font: 'bold 20px "Noto Sans", sans-serif',
                fillStyle: '#ffffff',
                shadow: {
                    color: 'rgba(0, 0, 0, 0.5)',
                    offsetX: 2,
                    offsetY: 2,
                    blur: 4
                }
            })
        })
    } else {
        // Texto começa na posição padrão
        titleLines.forEach((line, i) => {
            posterElements.push({
                type: 'text',
                text: line,
                x: x + TEXT_PADDING,
                y: y + POSTER_HEIGHT - 50 - (titleLines.length - 1 - i) * 25,
                font: 'bold 20px "Noto Sans", sans-serif',
                fillStyle: '#ffffff',
                shadow: {
                    color: 'rgba(0, 0, 0, 0.5)',
                    offsetX: 2,
                    offsetY: 2,
                    blur: 4
                }
            })
        })
    }

    if (item.rating && item.rating.text) {
        posterElements.push({
            type: 'text',
            text: item.rating.text,
            x: x + 15,
            y: y + POSTER_HEIGHT - 15,
            font: '25px "Noto Sans", sans-serif',
            fillStyle: '#00c030'
        })
    }

    let iconX = x + POSTER_WIDTH - ICON_MARGIN - ICON_SIZE

    if (item.review) {
        posterElements.push({
            type: 'image',
            src: './src/commands/templates/assets/review.png',
            x: iconX,
            y: y + POSTER_HEIGHT - ICON_MARGIN - ICON_SIZE,
            width: ICON_SIZE,
            height: ICON_SIZE
        })
        iconX -= ICON_SIZE + ICON_MARGIN
    }

    if (item.isRewatch) {
        posterElements.push({
            type: 'image',
            src: './src/commands/templates/assets/rewatch.png',
            x: iconX,
            y: y + POSTER_HEIGHT - ICON_MARGIN - ICON_SIZE,
            width: ICON_SIZE,
            height: ICON_SIZE
        })
    }

    return posterElements
}

function prepareData(films, COLUMNS, ROWS, param = null) {
    const data = {
        type: 'collage',
        width: COLUMNS * 270,
        height: ROWS * 405,
        background: '#0E0E0E',
        elements: []
    }

    for (let i = 0; i < films.length; i++) {
        const posterElements = generatePosterData(films[i], i, COLUMNS, param)
        data.elements.push(...posterElements)  // Use spread operator to flatten the array
    }

    return data
}

export default prepareData

// Constantes globais
const POSTER_WIDTH = 270
const POSTER_HEIGHT = 405
const ICON_SIZE = 23
const ICON_MARGIN = 15
const TEXT_PADDING = 15
const GRADIENT_HEIGHT = 200
const BOTTOM_TEXT_Y_OFFSET = 20
const REGULAR_TEXT_Y_OFFSET = 50

// Funções auxiliares para criar elementos
function createImageElement({ src, x, y, width, height }) {
    return { type: 'image', src, x, y, width, height }
}

function createRectangleElement({ fillStyle, x, y, width, height }) {
    return { type: 'rectangle', fillStyle, x, y, width, height }
}

function createTextElement({ text, x, y, font, fillStyle, shadow, maxWidth, lineHeight }) {
    return { type: 'text', text, x, y, font, fillStyle, shadow, maxWidth, lineHeight }
}

function createIconElement({ src, x, y, width, height }) {
    return { type: 'icon', src, x, y, width, height }
}

// Função para criar o gradiente
function createGradientRectangle(x, y) {
    return createRectangleElement({
        fillStyle: {
            type: 'linearGradient',
            colors: [
                { stop: 0, color: 'rgba(14, 14, 14, 0)' },
                { stop: 1, color: 'rgba(14, 14, 14, 0.9)' }
            ],
            x0: x,
            y0: y + POSTER_HEIGHT - GRADIENT_HEIGHT,
            x1: x,
            y1: y + POSTER_HEIGHT
        },
        x,
        y: y + POSTER_HEIGHT - GRADIENT_HEIGHT,
        width: POSTER_WIDTH,
        height: GRADIENT_HEIGHT
    })
}

// Função principal para gerar dados do pôster
function generatePosterData(item, index, COLUMNS, param) {
    const column = index % COLUMNS
    const row = Math.floor(index / COLUMNS)
    const x = column * POSTER_WIDTH
    const y = row * POSTER_HEIGHT

    const posterElements = []

    // Verificar se a imagem do filme está disponível
    if (item.film.image?.large) {
        posterElements.push(createImageElement({ src: item.film.image.large, x, y, width: POSTER_WIDTH, height: POSTER_HEIGHT }))
    } else {
        // Adicionar um retângulo transparente caso não haja imagem
        posterElements.push(createRectangleElement({ fillStyle: 'rgba(0, 0, 0, 0.5)', x, y, width: POSTER_WIDTH, height: POSTER_HEIGHT }))
    }

    if (param === 'notext') return posterElements

    posterElements.push(createGradientRectangle(x, y))

    const title = `${item.film.title}${item.film.year ? ` (${item.film.year})` : ''}`
    const shouldDrawTextAtBottom = !item.rating?.text && !item.isRewatch && !item.review
    const textY = shouldDrawTextAtBottom ? y + POSTER_HEIGHT - BOTTOM_TEXT_Y_OFFSET : y + POSTER_HEIGHT - REGULAR_TEXT_Y_OFFSET

    posterElements.push(createTextElement({
        text: title,
        x: x + TEXT_PADDING,
        y: textY,
        font: '20px "Noto Sans Bold", sans-serif',
        fillStyle: '#ffffff',
        shadow: {
            color: 'rgba(0, 0, 0, 0.5)',
            offsetX: 2,
            offsetY: 2,
            blur: 4
        },
        maxWidth: POSTER_WIDTH - 2 * TEXT_PADDING,
        lineHeight: 25
    }))

    if (item.rating?.text) {
        posterElements.push(createTextElement({
            text: item.rating.text,
            x: x + 15,
            y: y + POSTER_HEIGHT - 15,
            font: '25px "Noto Sans Symbol", sans-serif',
            fillStyle: '#00c030',
            shadow: {
                color: 'rgba(0, 0, 0, 0.5)',
                offsetX: 2,
                offsetY: 2,
                blur: 4
            },
            maxWidth: POSTER_WIDTH - 2 * TEXT_PADDING,
            lineHeight: 25
        }))
    }

    let iconX = x + POSTER_WIDTH - ICON_MARGIN - ICON_SIZE

    if (item.review) {
        posterElements.push(createIconElement({
            src: './src/commands/templates/assets/review.png',
            x: iconX,
            y: y + POSTER_HEIGHT - ICON_MARGIN - ICON_SIZE,
            width: ICON_SIZE,
            height: ICON_SIZE
        }))
        iconX -= ICON_SIZE + ICON_MARGIN
    }

    if (item.isRewatch) {
        posterElements.push(createIconElement({
            src: './src/commands/templates/assets/rewatch.png',
            x: iconX,
            y: y + POSTER_HEIGHT - ICON_MARGIN - ICON_SIZE,
            width: ICON_SIZE,
            height: ICON_SIZE
        }))
    }

    return posterElements
}

function gridlbTemplate(films, COLUMNS, ROWS, param = null) {
    const data = {
        type: 'grid',
        width: COLUMNS * POSTER_WIDTH,
        height: ROWS * POSTER_HEIGHT,
        background: '#0E0E0E',
        elements: []
    }

    films.forEach((film, i) => {
        const posterElements = generatePosterData(film, i, COLUMNS, param)
        data.elements.push(...posterElements)
    })

    return data
}

export default gridlbTemplate
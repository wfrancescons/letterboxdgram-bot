import { createCanvas, loadImage, registerFont } from 'canvas'

// Carregar e registrar a fonte
registerFont('./src/commands/templates/assets/NotoSans.ttf', { family: 'Noto Sans Bold' })

const POSTER_WIDTH = 270
const POSTER_HEIGHT = 405
const ICON_SIZE = 23
const ICON_MARGIN = 15
const TEXT_PADDING = 15

// Carregar as imagens dos ícones
const rewatchImagePromise = loadImage('./src/commands/templates/assets/rewatch.png')
const reviewImagePromise = loadImage('./src/commands/templates/assets/review.png')

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

async function generatePoster(ctx, item, index, COLUMNS, param) {
    const column = index % COLUMNS
    const row = Math.floor(index / COLUMNS)
    const x = column * POSTER_WIDTH
    const y = row * POSTER_HEIGHT

    // Verificar se a imagem do filme está disponível
    if (item.film.image && item.film.image.large) {
        const image = await loadImage(item.film.image.large)
        ctx.drawImage(image, x, y, POSTER_WIDTH, POSTER_HEIGHT)
    } else {
        // Desenhar um retângulo transparente caso não haja imagem
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)' // Fundo semi-transparente
        ctx.fillRect(x, y, POSTER_WIDTH, POSTER_HEIGHT)
    }

    // Verificar se deve desenhar o texto na parte inferior
    const shouldDrawTextAtBottom = !item.rating?.text && !item.isRewatch && !item.review

    if (param === 'notext') return

    // Desenhar o retângulo de fundo para a classificação
    const gradient = ctx.createLinearGradient(0, y + POSTER_HEIGHT - 200, 0, y + POSTER_HEIGHT)
    gradient.addColorStop(0, 'rgba(14, 14, 14, 0)')
    gradient.addColorStop(1, 'rgba(14, 14, 14, 0.9)')

    ctx.fillStyle = gradient
    ctx.fillRect(x, y + POSTER_HEIGHT - 200, POSTER_WIDTH, 200)

    // Configurar a sombra do texto
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)' // Cor da sombra
    ctx.shadowOffsetX = 2 // Deslocamento horizontal da sombra
    ctx.shadowOffsetY = 2 // Deslocamento vertical da sombra
    ctx.shadowBlur = 4 // Desfoque da sombra

    // Desenhar o texto do título
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'left'
    ctx.font = 'bold 20px "Noto Sans", sans-serif' // Fonte menor para o título
    const title = `${item.film.title} (${item.film.year})`
    const titleLines = wrapText(ctx, title, POSTER_WIDTH - 2 * TEXT_PADDING)

    if (shouldDrawTextAtBottom) {
        // Texto começa na parte inferior
        titleLines.forEach((line, i) => {
            ctx.fillText(line, x + TEXT_PADDING, y + POSTER_HEIGHT - 20 - (titleLines.length - 1 - i) * 25)
        })
    } else {
        // Texto começa na posição padrão
        titleLines.forEach((line, i) => {
            ctx.fillText(line, x + TEXT_PADDING, y + POSTER_HEIGHT - 50 - (titleLines.length - 1 - i) * 25)
        })
    }

    // Verificar se há avaliação e desenhá-la
    if (item.rating && item.rating.text) {

        // Desenhar o texto da classificação
        ctx.fillStyle = '#00c030'
        ctx.font = '25px "Noto Sans", sans-serif'
        ctx.fillText(item.rating.text, x + 15, y + POSTER_HEIGHT - 15) // 15px de espaço da lateral esquerda
    }

    // Resetar a sombra para outras operações
    ctx.shadowColor = 'transparent'
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.shadowBlur = 0

    // Verificar e desenhar os ícones conforme necessário
    let iconX = x + POSTER_WIDTH - ICON_MARGIN - ICON_SIZE

    if (item.review) {
        const reviewImage = await reviewImagePromise
        ctx.drawImage(reviewImage, iconX, y + POSTER_HEIGHT - ICON_MARGIN - ICON_SIZE, ICON_SIZE, ICON_SIZE)
        iconX -= ICON_SIZE + ICON_MARGIN
    }

    if (item.isRewatch) {
        const rewatchImage = await rewatchImagePromise
        ctx.drawImage(rewatchImage, iconX, y + POSTER_HEIGHT - ICON_MARGIN - ICON_SIZE, ICON_SIZE, ICON_SIZE)
    }
}

async function generateGrid(films, COLUMNS, ROWS, param = null) {
    const canvas = createCanvas(COLUMNS * POSTER_WIDTH, ROWS * POSTER_HEIGHT)
    const ctx = canvas.getContext('2d')

    // Preencher o fundo
    ctx.fillStyle = '#0E0E0E'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Desenhar todos os posters
    for (let i = 0; i < films.length; i++) {
        await generatePoster(ctx, films[i], i, COLUMNS, param)
    }

    return canvas.toBuffer() // Retorna a imagem como um buffer
}

export default generateGrid
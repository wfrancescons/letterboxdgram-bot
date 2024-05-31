import { createCanvas, loadImage, registerFont } from 'canvas'

registerFont('./src/commands/templates/NotoSans.ttf', { family: 'Noto Sans' })

const POSTER_WIDTH = 270
const POSTER_HEIGHT = 405

async function generatePoster(ctx, item, index, COLUMNS, param) {
    const column = index % COLUMNS
    const row = Math.floor(index / COLUMNS)
    const x = column * POSTER_WIDTH
    const y = row * POSTER_HEIGHT

    // Carregar a imagem do filme
    const image = await loadImage(item.film.image.large)

    // Desenhar a imagem do filme
    ctx.drawImage(image, x, y, POSTER_WIDTH, POSTER_HEIGHT)

    // Verificar se há avaliação e desenhá-la
    if (param !== 'norating' && item.rating && item.rating.text) {
        // Desenhar o retângulo de fundo para a classificação
        const gradient = ctx.createLinearGradient(0, y + POSTER_HEIGHT - 50, 0, y + POSTER_HEIGHT)
        gradient.addColorStop(0, 'rgba(14, 14, 14, 0)')
        gradient.addColorStop(1, '#0E0E0E')

        ctx.fillStyle = gradient
        ctx.fillRect(x, y + POSTER_HEIGHT - 50, POSTER_WIDTH, 50)

        // Desenhar o texto da classificação
        ctx.fillStyle = '#fff'
        ctx.textAlign = 'center'
        ctx.font = '30px "Noto Sans", sans-serif'
        ctx.fillText(item.rating.text, x + POSTER_WIDTH / 2, y + POSTER_HEIGHT - 20)
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
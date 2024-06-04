import { createCanvas, loadImage, registerFont } from 'canvas'

registerFont('./src/rendering/fonts/NotoSans-Symble.ttf', { family: 'Noto Sans Symble' })
registerFont('./src/rendering/fonts/NotoSans-Bold.ttf', { family: 'Noto Sans Bold' })

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

async function drawImage(ctx, element) {

    try {
        const image = await loadImage(element.src)
        ctx.drawImage(image, element.x, element.y, element.width, element.height)
    } catch (error) {
        console.error(error)
        drawRect(ctx, {
            fillStyle: 'rgba(0, 0, 0, 0.5)',
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height
        })
    }
}

function drawRect(ctx, element) {
    if (element.fillStyle.type === 'linearGradient') {
        const gradient = ctx.createLinearGradient(element.fillStyle.x0, element.fillStyle.y0, element.fillStyle.x1, element.fillStyle.y1)
        for (const colorStop of element.fillStyle.colors) {
            gradient.addColorStop(colorStop.stop, colorStop.color)
        }
        ctx.fillStyle = gradient
    } else {
        ctx.fillStyle = element.fillStyle
    }
    ctx.fillRect(element.x, element.y, element.width, element.height)
}

function drawText(ctx, element) {
    ctx.shadowColor = 'transparent'
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.shadowBlur = 0

    ctx.font = element.font
    ctx.fillStyle = element.fillStyle

    if (element.shadow) {
        ctx.shadowColor = element.shadow.color
        ctx.shadowOffsetX = element.shadow.offsetX
        ctx.shadowOffsetY = element.shadow.offsetY
        ctx.shadowBlur = element.shadow.blur
    }

    const lines = wrapText(ctx, element.text, element.maxWidth)
    lines.forEach((line, i) => {
        ctx.fillText(line, element.x, element.y - (lines.length - 1 - i) * element.lineHeight)
    })
}

async function renderCanvas(data) {
    const canvas = createCanvas(data.width, data.height)
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = data.background
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    if (data.type === 'collage') {
        const imageElements = []
        const rectangleElements = []
        const iconElements = []
        const textElements = []

        for (const element of data.elements) {
            if (element.type === 'image') {
                imageElements.push(element)
            }
            if (element.type === 'rectangle') {
                rectangleElements.push(element)
            }
            if (element.type === 'text') {
                textElements.push(element)
            }
            if (element.type === 'icon') {
                iconElements.push(element)
            }
        }

        for (const element of imageElements) {
            await drawImage(ctx, element)
        }

        for (const element of rectangleElements) {
            drawRect(ctx, element)
        }

        for (const element of iconElements) {
            await drawImage(ctx, element)
        }

        for (const element of textElements) {
            drawText(ctx, element)
        }
    }

    return canvas.toBuffer()
}

export default renderCanvas

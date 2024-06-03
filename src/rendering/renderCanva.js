import { createCanvas, loadImage, registerFont } from 'canvas'

registerFont('./src/commands/templates/assets/NotoSans.ttf', { family: 'Noto Sans Bold' })

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

    ctx.fillText(element.text, element.x, element.y)
}

async function renderCanvas(data) {
    const canvas = createCanvas(data.width, data.height)
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = data.background
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    if (data.type === 'collage') {
        const imageElements = []
        const rectangleElements = []
        const textElements = []

        for (const element of data.elements) {
            if (element.type === 'image') {
                imageElements.push(element)
            } else if (element.type === 'rectangle') {
                rectangleElements.push(element)
            } else if (element.type === 'text') {
                textElements.push(element)
            }
        }

        for (const element of imageElements) {
            await drawImage(ctx, element)
        }

        for (const element of rectangleElements) {
            drawRect(ctx, element)
        }

        for (const element of textElements) {
            drawText(ctx, element)
        }
    }

    return canvas.toBuffer()
}

export default renderCanvas
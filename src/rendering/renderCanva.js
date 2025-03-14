import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas'
import Bottleneck from 'bottleneck'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

const fonts_dir = './src/rendering/fonts/'
const loadAllFontsFromDirectory = async (dir) => {
    const files = await readdir(dir, { withFileTypes: true })
    for (const file of files) {
        const filePath = join(dir, file.name)
        if (file.isDirectory()) {
            await loadAllFontsFromDirectory(filePath)
        } else if (file.isFile() && (file.name.endsWith('.ttf') || file.name.endsWith('.otf'))) {
            const fontFamilyName = file.name.replace(/\.(ttf|otf)$/, '')
            GlobalFonts.registerFromPath(filePath, fontFamilyName)
            console.log(`Fonte registrada: ${fontFamilyName}`)
        }
    }
}
await loadAllFontsFromDirectory(fonts_dir)

const limiter = new Bottleneck({
    maxConcurrent: 4,
    minTime: 0
})

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
        // set filters
        ctx.filter = element.filter || 'none'
        ctx.globalCompositeOperation = element.composite || 'source-over'

        const image = await loadImage(element.src)

        ctx.drawImage(image, element.x, element.y, element.width, element.height)

        // reset filters
        ctx.globalCompositeOperation = 'source-over'
        ctx.filter = 'none'

    } catch (error) {
        console.error('Error on loadImage:', { error, element })
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
    if (element.fillStyle && element.fillStyle.type === 'linearGradient') {
        const gradient = ctx.createLinearGradient(element.fillStyle.x0, element.fillStyle.y0, element.fillStyle.x1, element.fillStyle.y1)
        for (const colorStop of element.fillStyle.colors) {
            gradient.addColorStop(colorStop.stop, colorStop.color)
        }
        ctx.fillStyle = gradient
    } else {
        ctx.fillStyle = element.fillStyle || 'black'
    }
    ctx.fillRect(element.x, element.y, element.width, element.height)
}

function drawText(ctx, element) {
    ctx.shadowColor = element.shadow?.color || 'transparent'
    ctx.shadowOffsetX = element.shadow?.offsetX || 0
    ctx.shadowOffsetY = element.shadow?.offsetY || 0
    ctx.shadowBlur = element.shadow?.blur || 0

    ctx.font = element.font || '16px sans-serif'
    ctx.fillStyle = element.fillStyle || 'black'
    ctx.textAlign = element.align || 'left'

    const lines = wrapText(ctx, element.text, element.maxWidth)
    lines.forEach((line, i) => {
        ctx.fillText(line, element.x, element.y - (lines.length - 1 - i) * element.lineHeight)
    })

    ctx.shadowColor = 'transparent'
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.shadowBlur = 0
}

async function renderCanvas(data) {
    const canvas = createCanvas(data.width, data.height)
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = data.background || 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    for (const element of data.elements) {
        if (element.type === 'image') {
            await drawImage(ctx, element)
        }
        if (element.type === 'rectangle') {
            drawRect(ctx, element)
        }
        if (element.type === 'text') {
            drawText(ctx, element)
        }
        if (element.type === 'icon') {
            await drawImage(ctx, element)
        }
    }

    const canvaBuffer = await canvas.encode('jpeg', { quality: 0.9 })
    return canvaBuffer
}

const wrapped = limiter.wrap(renderCanvas)

export default wrapped

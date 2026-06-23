// Generates PNG icons from SVG using canvas (Node.js)
import { createCanvas } from 'canvas'
import { writeFileSync, mkdirSync } from 'fs'

mkdirSync('icons', { recursive: true })

function drawIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  const r = size * 0.22

  // Background
  ctx.fillStyle = '#dc2626'
  ctx.beginPath()
  ctx.roundRect(0, 0, size, size, r)
  ctx.fill()

  // Key emoji-style icon
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${size * 0.55}px serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('🔑', size / 2, size / 2)

  return canvas.toBuffer('image/png')
}

for (const size of [16, 48, 128]) {
  writeFileSync(`icons/icon${size}.png`, drawIcon(size))
  console.log(`✅ icon${size}.png`)
}

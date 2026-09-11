import { mkdir, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const SOURCE = resolve(ROOT, 'scripts/softyfy-logo.png')
const RESOURCES = resolve(ROOT, 'resources')

await mkdir(RESOURCES, { recursive: true })

// 1. Legacy icon: full-bleed 1024 (opaque, square)
{
  const out = await sharp(SOURCE).resize(1024, 1024).png().toBuffer()
  await writeFile(resolve(RESOURCES, 'icon.png'), out)
  console.log('OK icon.png 1024x1024')
}

// 2. Adaptive foreground: transparent canvas, logo scaled to 62% centered
{
  const size = 1024
  const logoSize = Math.round(size * 0.62)
  const logo = await sharp(SOURCE).resize(logoSize, logoSize, { fit: 'contain' }).toBuffer()
  const canvas = await sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: logo, left: Math.round((size - logoSize) / 2), top: Math.round((size - logoSize) / 2) }])
    .png()
    .toBuffer()
  await writeFile(resolve(RESOURCES, 'icon-foreground.png'), canvas)
  console.log('OK icon-foreground.png 1024x1024 (transparent + logo 62%)')
}

// 3. Adaptive background: solid color #121212
{
  const size = 1024
  const canvas = await sharp({ create: { width: size, height: size, channels: 4, background: { r: 18, g: 18, b: 18, alpha: 1 } } })
    .png()
    .toBuffer()
  await writeFile(resolve(RESOURCES, 'icon-background.png'), canvas)
  console.log('OK icon-background.png 1024x1024 (#121212)')
}

// 4. Splash: 2732x2732 dark background + centered logo
{
  const width = 2732
  const height = 2732
  const logoSize = 480
  const bg = { r: 18, g: 18, b: 18, alpha: 1 }
  const canvas = sharp({ create: { width, height, channels: 4, background: bg } })
  const logo = await sharp(SOURCE).resize(logoSize, logoSize, { fit: 'contain' }).toBuffer()
  const out = await canvas
    .composite([{ input: logo, left: Math.round((width - logoSize) / 2), top: Math.round((height - logoSize) / 2) }])
    .png()
    .toBuffer()
  await writeFile(resolve(RESOURCES, 'splash.png'), out)
  console.log('OK splash.png 2732x2732 (centered logo + dark bg)')
}
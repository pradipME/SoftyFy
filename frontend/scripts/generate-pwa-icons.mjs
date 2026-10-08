// Dev-time utility: generate the SoftyFy PWA launcher icons + favicon from the
// official logo (public/Neon SoftyFy Music Emblem.png).
//
// The source artwork is the neon SoftyFy music emblem on a transparent
// background. It is used as provided:
//
//   icon-192.png / icon-512.png / apple-touch-icon.png / favicon.png
//     The emblem resized 1:1 to the target size over the app's dark
//     background (#121212), so the transparent edges never show through as
//     black or white patches.
//
//   maskable-192.png / maskable-512.png
//     Full-bleed dark fill with the emblem scaled into the Android safe
//     zone (central 80% circle) so the launcher mask never clips the mark.
//
// Usage:  node scripts/generate-pwa-icons.mjs   (or: npm run icons)

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const SOURCE = resolve(ROOT, 'public/Neon SoftyFy Music Emblem.png')
const ICONS_DIR = resolve(ROOT, 'public/icons')

// App background (#121212) — matches the manifest theme_color.
const SURROUND = { r: 18, g: 18, b: 18 }

// Proportion of the canvas the emblem occupies on maskable icons, keeping the
// whole mark comfortably inside Android's 80%-diameter safe-zone circle.
const MASKABLE_SCALE = 0.78

/**
 * Emblem resized 1:1 and flattened over the dark app background.
 */
async function flatIcon(size, outName, destDir) {
  const logo = await sharp(SOURCE).resize(size, size).png().toBuffer()
  const out = await sharp({
    create: { width: size, height: size, channels: 3, background: SURROUND },
  })
    .composite([{ input: logo, left: 0, top: 0 }])
    .png()
    .toBuffer()
  await writeFile(resolve(destDir, outName), out)
  console.log(`OK ${outName} (${size}x${size}, dark surround)`)
}

/**
 * Maskable icon: full-bleed dark fill + emblem scaled into the safe zone.
 */
async function maskableIcon(size, outName) {
  const logoSize = Math.round(size * MASKABLE_SCALE)
  const logo = await sharp(SOURCE).resize(logoSize, logoSize).png().toBuffer()
  const offset = Math.round((size - logoSize) / 2)
  const out = await sharp({
    create: { width: size, height: size, channels: 3, background: SURROUND },
  })
    .composite([{ input: logo, left: offset, top: offset }])
    .png()
    .toBuffer()
  await writeFile(resolve(ICONS_DIR, outName), out)
  console.log(
    `OK ${outName} (${size}x${size}, dark fill, logo ${MASKABLE_SCALE * 100}%)`,
  )
}

const main = async () => {
  await mkdir(ICONS_DIR, { recursive: true })
  const meta = await sharp(SOURCE).metadata()
  if (!meta.width) throw new Error(`${SOURCE} is missing or unreadable`)

  await flatIcon(192, 'icon-192.png', ICONS_DIR)
  await flatIcon(512, 'icon-512.png', ICONS_DIR)
  await flatIcon(180, 'apple-touch-icon.png', ICONS_DIR)
  await maskableIcon(192, 'maskable-192.png')
  await maskableIcon(512, 'maskable-512.png')
  await flatIcon(96, 'favicon.png', resolve(ROOT, 'public'))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

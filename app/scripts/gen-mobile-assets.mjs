// Generates the @capacitor/assets source images in resources/ from the brand
// logo (public/images/Demat_logo_4000x4000_black-background.png — the same art
// as the Webflow webclip). Run `node scripts/gen-mobile-assets.mjs`, then
// `npm run mobile:assets` to emit every platform size into ios/ and android/.
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'

const SRC = new URL('../public/images/Demat_logo_4000x4000_black-background.png', import.meta.url).pathname
const OUT = new URL('../resources/', import.meta.url).pathname
const BLACK = { r: 0, g: 0, b: 0, alpha: 1 }

await mkdir(OUT, { recursive: true })

async function onBlackCanvas(size, logoSize, dest) {
  const logo = await sharp(SRC).resize(logoSize, logoSize).toBuffer()
  await sharp({ create: { width: size, height: size, channels: 4, background: BLACK } })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(OUT + dest)
  console.log('wrote', dest)
}

// App icon: the logo art fills the tile (it is the webclip design).
await sharp(SRC).resize(1024, 1024).png().toFile(OUT + 'icon-only.png')
console.log('wrote icon-only.png')

// Android adaptive icon: keep the wordmark inside the ~66% safe zone; the black
// source blends seamlessly into the black background layer.
await onBlackCanvas(1024, 560, 'icon-foreground.png')
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: BLACK } })
  .png()
  .toFile(OUT + 'icon-background.png')
console.log('wrote icon-background.png')

// Splash: black with the wordmark at ~40% width (source art includes its margin).
await onBlackCanvas(2732, 1100, 'splash.png')
await onBlackCanvas(2732, 1100, 'splash-dark.png')

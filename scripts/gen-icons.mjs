// Génère toutes les tailles d'icônes PWA depuis icon.svg via @resvg/resvg-js
import { Resvg } from '@resvg/resvg-js'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'

const svg = readFileSync('public/icons/icon.svg', 'utf8')
mkdirSync('public/icons', { recursive: true })

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

for (const size of SIZES) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    font: { loadSystemFonts: false },
  })
  const png = resvg.render().asPng()
  const filename = `public/icons/icon-${size}x${size}.png`
  writeFileSync(filename, png)
  console.log(`✅ ${filename} (${(png.length / 1024).toFixed(1)} KB)`)
}

console.log(`\n🎉 ${SIZES.length} icônes générées dans public/icons/`)

// Exports the real area content, UI strings and lucide icons to docs/mockups/content.js
// so the design mockups render the same copy the site will ship.
import { createServer } from 'vite'
import { writeFileSync } from 'node:fs'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as Lucide from 'lucide-react'

const vite = await createServer({ configFile: false, root: process.cwd(), server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const { AREAS } = await vite.ssrLoadModule('/src/map/areas.ts')
const { strings } = await vite.ssrLoadModule('/src/i18n/strings.ts')
const { campConfig } = await vite.ssrLoadModule('/src/config/campConfig.ts')

const names = new Set(['Sun', 'Snowflake', 'Moon', 'Play', 'X', 'ChevronRight', 'ChevronLeft', 'RotateCcw', 'Route', 'Plus', 'Minus', 'MapPin', 'Leaf', 'Check', 'MessageCircle', 'Camera', 'Video', 'Mountain', 'Sparkles', 'Navigation', 'Hand', 'Info', 'Languages'])
for (const m of JSON.stringify(AREAS).matchAll(/"icon":"(\w+)"/g)) names.add(m[1])
const ICONS = {}
for (const n of names) {
  const C = Lucide[n]
  if (!C) { console.error('missing icon', n); continue }
  ICONS[n] = renderToStaticMarkup(React.createElement(C, { size: 20, strokeWidth: 1.75 }))
}
writeFileSync('docs/mockups/content.js', 'window.CONTENT = ' + JSON.stringify({ AREAS, strings, ICONS, campConfig }) + ';\n')
console.log('areas:', AREAS.length, 'icons:', Object.keys(ICONS).length)
await vite.close()

// Les 35 chemins ROUTES de HEAD (+ /lab) ⊂ indexedPages(site-routes.json)
import { readFileSync } from 'fs'
import { indexedPages } from '/home/jdrac/Documents/Workspace/seagle-website/src/lib/site-routes.mjs'
const head = readFileSync(new URL('./prerender.head.mjs', import.meta.url), 'utf-8')
const old = [...new Set([...head.matchAll(/path: '([^']+)'/g)].map(m => m[1]).concat('/lab'))]
const data = JSON.parse(readFileSync('/home/jdrac/Documents/Workspace/seagle-website/src/lib/site-routes.json', 'utf-8'))
const now = new Set(indexedPages(data).map(p => p.path))
const missing = old.filter(p => !now.has(p))
console.log(`old=${old.length} new=${now.size} missing=${missing.length}`, missing)

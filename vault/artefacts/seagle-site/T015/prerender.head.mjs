/**
 * Prerendering script — rend chaque route dans Chromium headless et sauvegarde le HTML final.
 * Usage : npm run build && node prerender.mjs
 *
 * Contrairement à un simple remplacement de <title>/<meta>, ce script exécute React
 * (via vite preview + Playwright) et capture le DOM une fois monté : titre, meta,
 * JSON-LD et contenu réel de la page sont donc tous présents dans le HTML statique,
 * visibles par les crawlers qui n'exécutent pas de JS (GPTBot, ClaudeBot, PerplexityBot, CCBot…).
 */

import { mkdirSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { spawn } from 'child_process'
import { setTimeout as sleep } from 'timers/promises'
import { chromium } from 'playwright'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = 4173

// `lang` sert à amorcer localStorage avant le chargement : sans ça, i18n démarre
// dans la langue par défaut et la page est capturée avant/pendant la bascule.
const ROUTES = [
  { path: '/',                            lang: 'fr' },
  { path: '/produits',                    lang: 'fr' },
  { path: '/a-propos',                    lang: 'fr' },
  { path: '/contact',                     lang: 'fr' },
  { path: '/rendez-vous',                 lang: 'fr' },
  { path: '/carrieres',                   lang: 'fr' },
  { path: '/solutions/kora',         lang: 'fr' },
  { path: '/secure-pass',             lang: 'fr' },
  { path: '/agentx',                  lang: 'fr' },
  { path: '/global-seo',                  lang: 'fr' },
  { path: '/leef-editor',                 lang: 'fr' },
  { path: '/nuit-etoilee',                lang: 'fr' },
  { path: '/la-creation-d-adam',          lang: 'fr' },
  { path: '/la-grande-vague',             lang: 'fr' },
  { path: '/la-joconde',                  lang: 'fr' },
  { path: '/cgu',                         lang: 'fr' },
  { path: '/services/built-application',  lang: 'fr' },
  { path: '/services/rework-application', lang: 'fr' },
  { path: '/services/data-analyse',       lang: 'fr' },
  { path: '/services/security-audit',     lang: 'fr' },
  { path: '/services/optimisation',       lang: 'fr' },
  { path: '/services/seo-branding',       lang: 'fr' },
  { path: '/services/ai-integration',     lang: 'fr' },
  { path: '/services/infrastructure',     lang: 'fr' },
  // Versions EN : ces URLs sont déclarées dans le sitemap et par les hreflang,
  // elles doivent donc exister en statique (GitHub Pages ne sait pas router une SPA).
  { path: '/products',                    lang: 'en' },
  { path: '/about',                       lang: 'en' },
  { path: '/careers',                     lang: 'en' },
  { path: '/book',                        lang: 'en' },
  { path: '/terms',                       lang: 'en' },
  { path: '/starry-night',                lang: 'en' },
  { path: '/creation-of-adam',            lang: 'en' },
  { path: '/the-great-wave',              lang: 'en' },
  { path: '/mona-lisa',                   lang: 'en' },
]

async function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {}
    await sleep(200)
  }
  throw new Error(`Preview server not ready at ${url}`)
}

// Appelle le binaire vite local directement (pas via npx) pour que `preview.pid`
// soit bien le process serveur — sinon kill() ne tue que le wrapper npx et le
// serveur reste orphelin sur le port.
const preview = spawn(
  resolve(__dirname, 'node_modules', '.bin', 'vite'),
  ['preview', '--port', String(PORT), '--strictPort'],
  { cwd: __dirname, stdio: 'pipe', detached: true }
)

let ok = 0
let failed = 0

try {
  await waitForServer(`http://localhost:${PORT}/`)

  const browser = await chromium.launch()

  for (const { path: route, lang } of ROUTES) {
    // Un contexte neuf par route : localStorage est amorcé avec la bonne langue et
    // ne fuit pas d'une route à l'autre (i18n persiste `i18nextLng` à chaque bascule).
    const context = await browser.newContext({ locale: lang })
    await context.addInitScript(l => {
      try { localStorage.setItem('i18nextLng', l) } catch {}
    }, lang)
    const page = await context.newPage()

    try {
      await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'load' })
      await page.waitForSelector('html.app-mounted', { timeout: 10000 })
      // attend que le chunk lazy de la page (React Suspense) ait fini de charger
      await page.waitForFunction(
        () => !document.body.innerText.includes('Chargement...'),
        { timeout: 10000 }
      )
      await page.waitForTimeout(150) // laisse les effets (usePageMeta, useJsonLd) se poser après le rendu

      // Le bloc de repli du index.html source contient un <h1> générique : une fois la
      // page réellement rendue, il ne ferait que dupliquer le h1 (et sur certaines pages
      // il devenait le seul h1, avec le titre de la home).
      await page.evaluate(() => document.getElementById('fallback-content')?.remove())

      const html = await page.content()

      const outPath = route === '/'
        ? resolve(__dirname, 'dist', 'index.html')
        : resolve(__dirname, 'dist', ...route.slice(1).split('/'), 'index.html')
      mkdirSync(dirname(outPath), { recursive: true })
      writeFileSync(outPath, html, 'utf-8')

      // GitHub Pages sert 404.html (avec un vrai statut 404) sur toute URL inconnue ;
      // le routeur prend alors le relais et renvoie le visiteur sur la home.
      if (route === '/') {
        writeFileSync(resolve(__dirname, 'dist', '404.html'), html, 'utf-8')
      }

      const title = await page.title()
      console.log(`✅ ${route.padEnd(30)} [${lang}] ${title.slice(0, 45)}`)
      ok++
    } catch (err) {
      console.error(`❌ ${route} — ${err.message}`)
      failed++
    } finally {
      await context.close()
    }
  }

  await browser.close()
} finally {
  try { process.kill(-preview.pid) } catch { preview.kill() }
}

console.log(`\nPrerendering terminé — ${ok} OK, ${failed} erreurs`)
if (failed > 0) process.exit(1)

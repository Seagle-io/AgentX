import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"
const PAGES = ['/', '/solutions/kora', '/secure-pass', '/agentx', '/leef-editor', '/global-seo', '/produits', '/services/ai-integration', '/services/infrastructure', '/services/seo-branding', '/a-propos', '/contact', '/carrieres', '/rendez-vous', '/book', '/la-joconde', '/nuit-etoilee']
const b = await chromium.launch({ args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] })
const c = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" })
const p = await c.newPage()
for (const u of PAGES) {
  await p.goto("http://localhost:4173" + u, { waitUntil: "load" }); await p.waitForTimeout(1200)
  const r = await p.evaluate(() => [...document.querySelectorAll("pre, [class*=text-faint], [class*=text-md]")].filter(e => {
    const t = (e.innerText || "").replace(/\s/g, ""); if (t.length < 12) return false
    const sym = [...t].filter(ch => !/[\p{L}\p{N}]/u.test(ch)).length
    return e.tagName === "PRE" || sym / t.length > 0.6
  }).map(e => `${e.tagName}.${(e.className.baseVal ?? e.className).match(/text-(faint|md)\S*/g)?.join("+") ?? "-"} "${e.innerText.replace(/\s+/g, " ").slice(0, 30)}" color=${getComputedStyle(e).color}`))
  if (r.length) console.log(u, r.length, "\n  " + [...new Set(r)].slice(0, 6).join("\n  "))
}
await b.close()

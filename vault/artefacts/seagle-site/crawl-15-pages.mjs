import { chromium } from '/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs'
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
const errs = []; p.on('pageerror', e => errs.push(p.url() + ' ' + e.message.slice(0, 200))); p.on('response', r => r.status() >= 400 && errs.push(r.status() + ' ' + r.url()))
for (const u of ['/', '/solutions/kora', '/secure-pass', '/agentx', '/leef-editor', '/global-seo', '/produits', '/services/ai-integration', '/services/infrastructure', '/services/seo-branding', '/a-propos', '/contact', '/carrieres', '/rendez-vous', '/book']) {
  await p.goto('http://localhost:4173' + u, { waitUntil: 'networkidle' })
  for (let y = 0; y < 6000; y += 1200) { await p.evaluate(y => window.scrollTo(0, y), y); await p.waitForTimeout(100) }
}
console.log(errs.join('\n') || 'no errors'); await b.close()

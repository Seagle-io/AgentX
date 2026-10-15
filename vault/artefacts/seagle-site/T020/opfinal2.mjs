import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"
const b = await chromium.launch({ args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] })
for (const rm of ["reduce", "no-preference"]) {
  const c = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: rm })
  await c.addInitScript(() => { localStorage.setItem("seagle-theme", "light"); localStorage.setItem("i18nextLng", "fr") })
  const p = await c.newPage()
  for (const [u, txts] of [["/", ["Savoir-faire français", "07"]], ["/solutions/kora", ["05", "Faites glisser pour comparer"]], ["/secure-pass", ["octet"]]]) {
    await p.goto("http://localhost:4173" + u); await p.waitForTimeout(1500)
    for (const t of txts) {
      const loc = p.locator("body *:not(:has(*))", { hasText: new RegExp("^\\s*" + t + "\\s*$") }).first()
      await loc.scrollIntoViewIfNeeded().catch(() => {}); await p.waitForTimeout(3000)
      const r = await loc.evaluate(el => { let op = 1, e2 = el, ch = []; while (e2) { const o = +getComputedStyle(e2).opacity; op *= o; if (o < 1) ch.push(`${e2.tagName}.${String(e2.className).split(" ").slice(0, 3).join(".")}=${o} anims=${e2.getAnimations().map(a => a.playState).join("/")}`); e2 = e2.parentElement } return `op=${op.toFixed(3)} col=${getComputedStyle(el).color} ${ch.join(" > ")}` }).catch(e => "ERR " + e.message.slice(0, 60))
      console.log(rm, u, t, r)
    }
  }
  await c.close()
}
await b.close()

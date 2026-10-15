import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"
const b = await chromium.launch({ args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] })
for (const rm of ["no-preference", "reduce"]) for (const theme of ["dark", "light"]) {
  const c = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: rm })
  await c.addInitScript(t => { localStorage.setItem("seagle-theme", t); localStorage.setItem("i18nextLng", "fr") }, theme)
  const p = await c.newPage()
  for (const [u, txts] of [["/", ["Savoir-faire français", "Défiler", "07"]], ["/solutions/kora", ["Découvrir", "05"]]]) {
    await p.goto("http://localhost:4173" + u); await p.waitForTimeout(6000)
    const r = await p.evaluate(txts => txts.map(t => { const el = [...document.querySelectorAll("body *")].find(e => e.children.length === 0 && e.textContent.trim() === t); if (!el) return t + ":∅"; let op = 1, e2 = el; while (e2) { op *= parseFloat(getComputedStyle(e2).opacity); e2 = e2.parentElement } const anims = el.getAnimations({ subtree: false }).length; let anc = el, chain = []; while (anc) { const o = getComputedStyle(anc).opacity; if (o !== "1") chain.push(`${anc.tagName}.${String(anc.className).split(" ").filter(c => /opacity|animate|fade/.test(c)).join(".")}=${o}`); anc = anc.parentElement } return `${t}: op=${op.toFixed(2)} ${chain.join(" > ")}` }), txts)
    console.log(rm, theme, u, JSON.stringify(r))
  }
  await c.close()
}
await b.close()

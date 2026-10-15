import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"
const browser = await chromium.launch()
for (const [ls, loc] of [["", "de-DE"], [null, "de-DE"], ["", "en-US"]]) {
  const ctx = await browser.newContext({ locale: loc })
  if (ls !== null) await ctx.addInitScript(v => { if (!sessionStorage.getItem("x")) { localStorage.setItem("i18nextLng", v); sessionStorage.setItem("x", 1) } }, ls)
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message))
  await p.goto("http://localhost:4173/"); await p.waitForTimeout(2000)
  console.log(`ls=${JSON.stringify(ls)} nav=${loc}`, await p.evaluate(() => [document.documentElement.lang, document.querySelector("#root h1")?.textContent.slice(0, 30), localStorage.getItem("i18nextLng")]), "pageerror=", errs.length)
  await ctx.close()
}
await browser.close()

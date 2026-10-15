import { launch, B } from "./lib.mjs"
const b = await launch()
const react = p => p.evaluate(() => Object.keys(document.getElementById("root") || {}).some(k => k.startsWith("__reactContainer")))
const probe = async (label, path, setup, wait = 5000) => {
  const ctx = await b.newContext({ locale: "fr-FR" })
  await ctx.addInitScript(() => { localStorage.setItem("seagle-theme", "dark") })
  const page = await ctx.newPage(); let loads = 0; const errs = []
  page.on("load", () => loads++); page.on("pageerror", e => errs.push(e.message.slice(0, 60)))
  if (setup) await setup(page)
  await page.goto(B + path, { waitUntil: "commit" }); await page.waitForTimeout(wait)
  const s = await page.evaluate(() => ({ url: location.pathname, lang: document.documentElement.lang, cls: document.documentElement.className, ss: Object.keys(sessionStorage).filter(k => k.startsWith("reloaded")), hidden: [...document.querySelectorAll("#root *")].filter(e => e.innerText?.trim() && +getComputedStyle(e).opacity < .05).length }))
  console.log(label, path, "loads=" + loads, "react=" + await react(page), JSON.stringify(s), errs.join("|"))
  await ctx.close()
}
for (const p of ["/", "/en", "/de", "/es", "/it"]) await probe("normal", p)
let n = 0
await probe("once-fr", "/", p => p.route(u => u.href.endsWith("index-wrQ7AnnA.js"), r => n++ ? r.continue() : r.abort()))
await probe("persist-fr", "/", p => p.route(u => u.href.endsWith("index-wrQ7AnnA.js"), r => r.abort()))
await probe("persist-page-about", "/a-propos", p => p.route(u => /\/assets\/index-[\w-]+\.js$/.test(u.pathname) && u.href.includes(process.env.ABOUT), r => r.abort()), 15000)
await b.close()

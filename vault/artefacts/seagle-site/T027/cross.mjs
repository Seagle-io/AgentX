import { launch, B, detect } from "./lib.mjs"
const LOC = { fr: "index-wrQ7AnnA.js", en: "index-DWnRCt51.js", de: "index-CX6jW941.js", es: "index-BFFoC9iq.js", it: "index-DNebYSPw.js" }
const b = await launch()
const cases = [["/DE", ["de"]], ["/DE/", ["de"]], ["/DE/products", ["de"]], ["/De/Products/", ["de"]], ["/DE", ["de"], "de"], ["/DE", ["de", "fr"]], ["/IT/", ["it"]], ["/DE", []], ["/DE?x=1#h", ["de"]], ["/", ["de"], "de"]]
for (const [path, ab, ls] of cases) {
  const ctx = await b.newContext({ locale: "fr-FR" })
  if (ls) await ctx.addInitScript(v => { if (!sessionStorage.__x) { localStorage.setItem("i18nextLng", v); sessionStorage.__x = 1 } }, ls)
  const page = await ctx.newPage()
  let loads = 0; const errs = [], navs = []
  page.on("load", () => loads++); page.on("pageerror", e => errs.push(e.message.slice(0, 60)))
  page.on("framenavigated", f => { if (f === page.mainFrame()) navs.push(f.url().replace(B, "")) })
  const files = ab.map(l => LOC[l])
  if (files.length) await page.route(u => files.some(a => u.href.endsWith(a)), r => r.abort())
  await page.goto(B + path, { waitUntil: "commit" })
  await page.waitForTimeout(15000)
  const s = await page.evaluate(() => ({ url: location.pathname + location.search + location.hash, lang: document.documentElement.lang, h1: document.querySelector("h1")?.textContent.replace(/\s+/g, " ").slice(0, 35), react: Object.keys(document.getElementById("root")).some(k => k.startsWith("__reactContainer")), canon: document.querySelector("link[rel=canonical]")?.href.replace("https://seagle.io", ""), t: (document.querySelector("main") || document.body).innerText.slice(0, 3000) }))
  console.log(JSON.stringify(path), "abort=" + ab.join("+"), "ls=" + (ls || "-"), "→", s.url, "lang=" + s.lang, "text=" + detect(s.t), "react=" + s.react, "canon=" + s.canon, "h1=" + JSON.stringify(s.h1), "loads=" + loads, "navs=" + navs.join(">"), "err=" + errs.length, errs.join("|"))
  await ctx.close()
}
await b.close()

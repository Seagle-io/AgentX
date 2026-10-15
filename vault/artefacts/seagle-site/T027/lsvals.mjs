import { launch, B, detect } from "./lib.mjs"
const b = await launch()
const cases = [["de-DE","fr-FR","de"],["DE","fr-FR","de"],["it-CH","fr-FR","it"],["xx","fr-FR","fr"],["xx","de-DE","de"],["","de-DE","de"],["","en-US","en"],["xx","ja-JP","fr"],["Es-mx","fr-FR","es"],["  de","fr-FR","fr?"],["de_DE","fr-FR","?"],["null","de-DE","de"],["EN","fr-FR","en"]]
for (const [ls, nav, exp] of cases) for (const path of ["/", "/contact/"]) {
  const ctx = await b.newContext({ locale: nav })
  await ctx.addInitScript(v => { if (!sessionStorage.__x) { localStorage.setItem("i18nextLng", v); sessionStorage.__x = 1 } }, ls)
  const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message.slice(0, 60)))
  await page.goto(B + path, { waitUntil: "networkidle" }); await page.waitForTimeout(1500)
  const s = await page.evaluate(() => { let il = null; for (const x of document.querySelectorAll('script[type="application/ld+json"]')) { try { const j = JSON.parse(x.textContent); const f = JSON.stringify(j).match(/"inLanguage":"([^"]*)"/); if (f) il = f[1] } catch { il = "PARSE-KO" } } return { url: location.pathname, lang: document.documentElement.lang, ls: localStorage.getItem("i18nextLng"), inLanguage: il, t: (document.querySelector("main") || document.body).innerText.slice(0, 3000) } })
  const tl = detect(s.t)
  const ok = (exp.length === 2 && s.lang === exp && tl === exp && (!s.inLanguage || s.inLanguage === exp)) ? "OK" : (exp.length === 2 ? "KO" : "obs")
  console.log(ok, `ls=${JSON.stringify(ls)} nav=${nav} ${path} →`, s.url, "lang=" + s.lang, "text=" + tl, "inLanguage=" + s.inLanguage, "ls'=" + JSON.stringify(s.ls), "exp=" + exp, "err=" + errs.length)
  await ctx.close()
}
await b.close()

import { launch, B } from "./lib.mjs"
const b = await launch()
const paths = (process.env.P || "/,/?Q=A#H,/#Main,/DE/Contact?X=1#F,/De/Services/Data-Analyse/,/LA-JOCONDE,/DE/MONA-LISA,/a-propo%53,/%44E/products,/de/über,/de/%C3%BC,/de/%c3%bc,/Über,/de/stra%C3%9Fe,/RENDEZ-VOUS?SLOT=X#Top,/DE/,/DE//Products,/ÄÖ/x").split(",")
for (const p of paths) {
  const ctx = await b.newContext({ locale: "fr-FR" }); const page = await ctx.newPage()
  const navs = [], errs = []
  page.on("framenavigated", f => { if (f === page.mainFrame()) navs.push(f.url().replace(B, "")) })
  page.on("pageerror", e => errs.push(e.message.slice(0, 60)))
  page.on("console", m => { if (/Maximum update|too many|throttl/i.test(m.text())) errs.push("console:" + m.text().slice(0, 80)) })
  await page.goto(B + p, { waitUntil: "load" }); await page.waitForTimeout(4000)
  const n4 = navs.length; await page.waitForTimeout(2000)
  const s = await page.evaluate(() => ({ url: location.pathname + location.search + location.hash, lang: document.documentElement.lang, canon: document.querySelector("link[rel=canonical]")?.href.replace("https://seagle.io", ""), h1: document.querySelector("h1")?.textContent.replace(/\s+/g, " ").slice(0, 30) }))
  console.log(JSON.stringify(p), "→", s.url, "lang=" + s.lang, "canon=" + s.canon, "h1=" + JSON.stringify(s.h1), "navs=" + navs.length + (navs.length !== n4 ? "(+idle!)" : ""), navs.slice(0, 6).join(" > "), errs.join("|"))
  await ctx.close()
}
await b.close()

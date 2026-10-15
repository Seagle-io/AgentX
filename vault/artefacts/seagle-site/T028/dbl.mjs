import { launch, B } from "./lib.mjs"
const b = await launch()
for (const [path, file] of [["/DE", "index-CX6jW941.js"], ["/IT/", "index-DNebYSPw.js"], ["/de/", "index-CX6jW941.js"]]) {
  const ctx = await b.newContext({ locale: "fr-FR" })
  await ctx.addInitScript(() => console.log("DOC " + location.pathname + " " + JSON.stringify(Object.keys(sessionStorage).filter(k => k.startsWith("reloaded")))))
  const page = await ctx.newPage(); const ev = []
  page.on("console", m => { if (m.text().startsWith("DOC ")) ev.push(m.text().slice(4)) })
  await page.route(u => u.href.endsWith(file), r => r.abort())
  await page.goto(B + path, { waitUntil: "commit" }); await page.waitForTimeout(4500)
  console.log(path, "abort", file, "docs=" + ev.length, ev.join(" → "))
  await ctx.close()
}
await b.close()

import { launch, B } from "./lib.mjs"
const b = await launch()
for (const [p, f] of [["/", "index-wrQ7AnnA.js"], ["/it/", "index-DNebYSPw.js"], ["/a-propos/", "index-wrQ7AnnA.js"], ["/de/products/", "index-CX6jW941.js"]]) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, locale: "fr-FR" }); const page = await ctx.newPage()
  await page.route(u => u.href.endsWith(f), r => r.abort())
  await page.goto(B + p, { waitUntil: "load" }); await page.waitForTimeout(3000)
  for (let y = 0; y < 30000; y += 800) { await page.mouse.wheel(0, 800); await page.waitForTimeout(40) }
  await page.waitForTimeout(800)
  console.log(p, JSON.stringify(await page.evaluate(() => ({ cls: document.documentElement.className, react: Object.keys(document.getElementById("root")).some(k => k.startsWith("__reactContainer")), op0: [...document.querySelectorAll("#root *")].filter(e => e.innerText?.trim() && +getComputedStyle(e).opacity < .05).length, styleOp0: document.querySelectorAll("#root [style*=\"opacity: 0;\"]").length, masked: [...document.querySelectorAll("#root [style*=translateY]")].filter(e => getComputedStyle(e).transform !== "none").map(e => e.getAttribute("style") + "|" + e.innerText.trim().slice(0,20)) }))))
  await ctx.close()
}
await b.close()

import { launch, B } from "./lib.mjs"
const b = await launch()
for (const p of ["/en", "/about", "/a-propos"]) {
  const ctx = await b.newContext({ locale: "en-US" }); await ctx.addInitScript(() => localStorage.setItem("seagle-theme", "dark"))
  const page = await ctx.newPage(); const ev = []
  page.on("load", () => ev.push("load")); page.on("framenavigated", f => f === page.mainFrame() && ev.push(f.url().replace(B, "")))
  await page.goto(B + p, { waitUntil: "commit" }); await page.waitForTimeout(8000)
  console.log(p, ev.join(" "), JSON.stringify(await page.evaluate(() => ({ lang: document.documentElement.lang, react: Object.keys(document.getElementById("root")).some(k => k.startsWith("__reactContainer")), h1: document.querySelector("h1")?.textContent.slice(0, 30) }))))
  await ctx.close()
}
await b.close()

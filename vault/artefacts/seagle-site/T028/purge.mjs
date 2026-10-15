import { launch, B } from "./lib.mjs"
const b = await launch(); const ctx = await b.newContext({ locale: "fr-FR" }); const page = await ctx.newPage(); let n = 0, loads = 0
page.on("load", () => loads++)
await page.route(u => u.href.endsWith("index-wrQ7AnnA.js"), r => n++ ? r.continue() : r.abort())
const ss = () => page.evaluate(() => JSON.stringify(Object.entries(sessionStorage).filter(([k]) => k.startsWith("reloaded"))))
await page.goto(B + "/", { waitUntil: "commit" }); await page.waitForTimeout(4000); console.log("après échec unique /", "loads=" + loads, await ss())
await page.goto(B + "/a-propos", { waitUntil: "load" }); await page.waitForTimeout(3000); console.log("montage /a-propos", await ss())
await b.close()

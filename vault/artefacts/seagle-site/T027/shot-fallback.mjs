import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"
const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 1440, height: 900 }, locale: "fr-FR" }); const p = await c.newPage()
await p.route(u => u.href.endsWith("index-wrQ7AnnA.js"), r => r.abort())
await p.goto("http://localhost:4173/", { waitUntil: "load" }); await p.waitForTimeout(3000)
await p.evaluate(() => document.querySelector("p")?.closest("section")?.nextElementSibling?.scrollIntoView())
const y = await p.evaluate(() => { const e = [...document.querySelectorAll("p")].find(e => e.textContent.startsWith("Huit métiers")); e.scrollIntoView({ block: "center" }); return Math.round(e.getBoundingClientRect().top) })
await p.waitForTimeout(500); await p.screenshot({ path: "fallback-abort-fr-huit-metiers.png" })
console.log("visible text in viewport:", await p.evaluate(() => [...document.querySelectorAll("#root h2,#root p,#root a")].filter(e => { const r = e.getBoundingClientRect(); return r.top > 0 && r.bottom < innerHeight && e.innerText.trim() }).map(e => (+getComputedStyle(e).opacity < .05 ? "INVIS:" : "vis:") + e.innerText.trim().slice(0, 25).replace(/\n/g, " ")).join(" | ")))
await b.close()

import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"
const b = await chromium.launch()
const c = await b.newContext({ viewport: { width: 1440, height: 900 } })
await c.addInitScript(() => { localStorage.setItem("i18nextLng", "fr") })
const d0 = new Date(); d0.setDate(d0.getDate() + 2); d0.setHours(10, 0, 0, 0)
await c.route("**/api/booking/slots*", r => r.fulfill({ json: { timezone: "Europe/Paris", minutes: 30, slots: [0, 1, 2].map(h => new Date(d0.getTime() + h * 3600e3).toISOString()) } }))
const p = await c.newPage(); await p.goto("http://localhost:4426/rendez-vous"); await p.waitForTimeout(1500)
const a = () => p.evaluate(() => { const e = document.activeElement; return `${e.tagName}[${(e.getAttribute("aria-label") || e.innerText || "").trim().slice(0, 30).replace(/\n/g, " ")}]` })
const seq = []
for (let i = 0; i < 40; i++) { await p.keyboard.press("Tab"); const s = await a(); seq.push(s); if (/^BUTTON\[\d\d:\d\d/.test(s)) break }
console.log("Tab jusqu'au créneau:", seq.slice(-4).join(" → "), `(${seq.length} tabs)`)
await p.keyboard.press("Enter"); await p.waitForTimeout(800)
console.log("après Entrée:", await a())
const after = []; for (let i = 0; i < 4; i++) { await p.keyboard.press("Tab"); after.push(await a()) }
console.log("Tab suivants:", after.join(" → "))
// retour : Changer de créneau
await p.getByRole("button", { name: "Changer de créneau" }).focus(); await p.keyboard.press("Enter"); await p.waitForTimeout(800)
console.log("après 'Changer de créneau':", await a())
await b.close()

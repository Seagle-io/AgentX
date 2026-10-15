import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"
import { readdirSync, readFileSync } from "node:fs"
const A = "/home/jdrac/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T006/dist/assets"
const mark = { fr: "libérez votre potentiel", en: "unleash your potential", de: "im Dienst Ihres", es: "al servicio de tu negocio", it: "al servizio della tua azienda" }
const chunk = {}
for (const f of readdirSync(A).filter(f => f.endsWith(".js"))) { const s = readFileSync(`${A}/${f}`, "utf8"); for (const [l, m] of Object.entries(mark)) if (s.includes(m)) chunk[f] = l }
console.log("chunks locale:", JSON.stringify(chunk))
const browser = await chromium.launch()
for (const l of Object.keys(mark)) {
	const page = await browser.newPage(); const got = []
	page.on("request", r => { const f = r.url().split("/").pop(); if (chunk[f]) got.push(chunk[f]) })
	await page.addInitScript(l => localStorage.setItem("i18nextLng", l), l)
	await page.goto("http://localhost:4401/", { waitUntil: "networkidle" })
	console.log(`${l} → chunks chargés: ${[...new Set(got)].sort().join(",")}`); await page.close()
}
await browser.close()

import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"
import { readFileSync } from "node:fs"

const DIR = "/home/jdrac/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T006"
const SRC = "/home/jdrac/Documents/Workspace/seagle-website/src/lib/local"
const BASE = "http://localhost:4401"
const norm = s => s.replace(/\s+/g, "")
const headline = l => norm(JSON.parse(readFileSync(`${SRC}/${l}/Home.ts`, "utf8").match(/headline: ("[^"]*")/)[1]))

const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] })
let ko = 0

async function open(lng) {
	const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
	const errors = []
	const locales = []
	page.on("pageerror", e => errors.push(e.message))
	page.on("request", r => { if (/\/assets\/index-.*\.js$/.test(r.url())) locales.push(r.url().split("/").pop()) })
	await page.addInitScript(l => {
		localStorage.setItem("seagle-theme", "dark")
		localStorage.setItem("i18nextLng", l)
	}, lng)
	await page.goto(BASE + "/", { waitUntil: "networkidle" })
	await page.waitForTimeout(2500)
	return { page, errors, locales }
}

const h1 = async page => norm(await page.locator("#root h1").first().textContent())
const rawKeys = async page => ((await page.evaluate(() => document.body.innerText)).match(/Home\./g) ?? []).length

for (const l of ["fr", "en", "de", "es", "it"]) {
	const { page, errors, locales } = await open(l)
	const got = await h1(page), want = headline(l)
	const ok = got === want && (await rawKeys(page)) === 0 && errors.length === 0
	if (!ok) ko++
	console.log(`${l} ${ok ? "OK" : "KO"} h1="${got}" attendu="${want}" clésBrutes=${await rawKeys(page)} pageerror=${errors.length} ${errors.join(" | ")} url=${page.url()}`)
	await page.close()
}

// bascule fr→de→en via le sélecteur
const { page, errors } = await open("fr")
await page.screenshot({ path: `${DIR}/bascule-1-fr.png` })
for (const [from, to, label] of [["fr", "de", "Deutsch"], ["de", "en", "English"]]) {
	const before = await h1(page)
	await page.locator("button[aria-expanded]:visible", { hasText: new RegExp(`^${from.toUpperCase()}$`) }).first().click()
	await page.waitForTimeout(300)
	await page.getByRole("button", { name: new RegExp(label, "i") }).first().click()
	// sonde écran vide pendant la bascule
	let blank = 0
	for (let i = 0; i < 20; i++) {
		const len = await page.evaluate(() => document.getElementById("root")?.innerText.trim().length ?? 0)
		if (len === 0) blank++
		await page.waitForTimeout(50)
	}
	await page.waitForTimeout(2000)
	const after = await h1(page), want = headline(to)
	const ok = after !== before && after === want && blank === 0 && errors.length === 0
	if (!ok) ko++
	console.log(`${from}→${to} ${ok ? "OK" : "KO"} avant="${before}" après="${after}" attendu="${want}" sondesVides=${blank} pageerror=${errors.length} url=${page.url()}`)
	await page.screenshot({ path: `${DIR}/bascule-${to === "de" ? 2 : 3}-${to}.png` })
}
await page.close()
await browser.close()
console.log(`KO=${ko}`)
process.exit(ko ? 1 : 0)

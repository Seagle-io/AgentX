import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"

const BASE = "http://localhost:4414"
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] })
let fails = 0

async function visit(path, { lang = "fr", act } = {}) {
	const ctx = await browser.newContext()
	await ctx.addInitScript(l => {
		if (!sessionStorage.getItem("t014-init")) {
			sessionStorage.setItem("t014-init", "1")
			localStorage.setItem("seagle-theme", "dark")
			localStorage.setItem("i18nextLng", l)
		}
	}, lang)
	const page = await ctx.newPage()
	const errors = []
	// framenavigated émis 2× pour l'URL d'arrivée (chargement + même URL) : on compte les changements d'URL
	let navs = 0, last = ""
	page.on("pageerror", e => errors.push(e.message))
	page.on("framenavigated", f => { if (f === page.mainFrame() && f.url() !== last) { last = f.url(); navs++ } })
	await page.goto(BASE + path, { waitUntil: "networkidle" })
	await page.waitForFunction(() => document.documentElement.classList.contains("app-mounted"))
	await page.waitForTimeout(600)
	const navsBeforeAct = navs
	if (act) await act(page)
	const state = await page.evaluate(() => ({
		url: location.pathname,
		lang: document.documentElement.lang,
		og: document.querySelector('meta[property="og:locale"]')?.content,
		text: document.body.innerText.slice(0, 4000),
	}))
	await ctx.close()
	return { ...state, errors, navs: navsBeforeAct }
}

function check(name, cond, info) {
	if (!cond) fails++
	console.log(`${cond ? "OK" : "KO"} ${name} ${JSON.stringify(info)}`)
}
const base = r => ({ url: r.url, lang: r.lang, og: r.og, navs: r.navs, errors: r.errors.length })
const ok = r => r.errors.length === 0 && r.navs <= 2

const de = /\b(und|der|die|das|für|mit)\b/
const it = /\b(il|per|della|che|di)\b/
const es = /\b(para|los|las|del|con)\b/

let r = await visit("/de/products")
check("/de/products", ok(r) && r.url === "/de/products" && r.lang === "de" && r.og === "de_DE" && de.test(r.text), base(r))
r = await visit("/it")
check("/it", ok(r) && r.url === "/it" && r.lang === "it" && r.og === "it_IT" && it.test(r.text), base(r))
r = await visit("/es/services/data-analyse")
check("/es/services/data-analyse", ok(r) && r.url === "/es/services/data-analyse" && r.lang === "es" && es.test(r.text), base(r))
r = await visit("/de/products", {
	act: async page => {
		await page.locator("button[aria-label*=Deutsch]:visible").first().click()
		await page.getByText("Français", { exact: true }).locator("visible=true").first().click()
		await page.waitForTimeout(600)
	},
})
check("toggle fr sur /de/products → /produits", ok(r) && r.url === "/produits" && r.lang === "fr" && r.og === "fr_FR", base(r))
r = await visit("/", { lang: "de" })
check("/ + i18nextLng=de → /de", ok(r) && r.url === "/de" && r.lang === "de", base(r))
r = await visit("/contact", { lang: "de" })
check("/contact + de → /de/contact", ok(r) && r.url === "/de/contact" && r.lang === "de", base(r))
for (const p of ["/produits", "/about", "/lab"]) {
	r = await visit(p)
	check(`${p} inchangé`, ok(r) && r.url === p, base(r))
}
r = await visit("/de/xyz")
check("/de/xyz → /de", ok(r) && r.url === "/de" && r.lang === "de", base(r))
r = await visit("/services/data-analyse", { lang: "en" })
check("/services/data-analyse en inchangé", ok(r) && r.url === "/services/data-analyse" && r.lang === "en", base(r))
r = await visit("/de/services")
check("/de/services → /de/services/built-application", ok(r) && r.url === "/de/services/built-application", base(r))

// Historique : /de/products → toggle fr (/produits) → /it/about (lien) → back → URL gagne
{
	const ctx = await browser.newContext()
	await ctx.addInitScript(() => { localStorage.setItem("seagle-theme", "dark"); if (!localStorage.getItem("i18nextLng")) localStorage.setItem("i18nextLng", "fr") })
	const page = await ctx.newPage()
	const errors = []
	page.on("pageerror", e => errors.push(e.message))
	await page.goto(BASE + "/de/products", { waitUntil: "networkidle" })
	await page.waitForTimeout(600)
	await page.evaluate(() => { history.pushState({}, "", "/it/about"); dispatchEvent(new PopStateEvent("popstate")) })
	await page.waitForTimeout(800)
	const a = await page.evaluate(() => [location.pathname, document.documentElement.lang])
	await page.goBack()
	await page.waitForTimeout(800)
	const b = await page.evaluate(() => [location.pathname, document.documentElement.lang])
	await page.goForward()
	await page.waitForTimeout(800)
	const c = await page.evaluate(() => [location.pathname, document.documentElement.lang])
	check("historique → langue de l'URL", errors.length === 0 && a.join() === "/it/about,it" && b.join() === "/de/products,de" && c.join() === "/it/about,it", { a, b, c, errors })
	await ctx.close()
}

await browser.close()
console.log(fails ? `KO ${fails}` : "ALL OK")
process.exit(fails ? 1 : 0)

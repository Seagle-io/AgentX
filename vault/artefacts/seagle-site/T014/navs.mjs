import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] })
for (const [path, lang] of [["/produits", "fr"], ["/contact", "de"], ["/de/xyz", "fr"]]) {
	const ctx = await browser.newContext()
	await ctx.addInitScript(l => { localStorage.setItem("seagle-theme", "dark"); if (!sessionStorage.getItem("x")) { sessionStorage.setItem("x", "1"); localStorage.setItem("i18nextLng", l) } }, lang)
	const page = await ctx.newPage()
	const log = []
	page.on("framenavigated", f => { if (f === page.mainFrame()) log.push(f.url().replace("http://localhost:4414", "")) })
	await page.goto("http://localhost:4414" + path, { waitUntil: "networkidle" })
	await page.waitForTimeout(800)
	console.log(path, lang, JSON.stringify(log))
	await ctx.close()
}
await browser.close()

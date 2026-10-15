// usage: node verif.mjs off|on  (preview servi sur :4406)
import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"

const mode = process.argv[2]
const origin = "http://localhost:4406"
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] })
const ctx = await browser.newContext()
await ctx.addInitScript(() => {
  localStorage.setItem("seagle-theme", "dark")
  localStorage.setItem("i18nextLng", "fr")
})
const blocked = []
await ctx.route(/plausible|umami|analytics/i, (route) => { blocked.push(route.request().url()); route.abort() })
const external = []
const page = await ctx.newPage()
page.on("request", (r) => { if (!r.url().startsWith(origin)) external.push(r.url()) })
for (const path of ["/", "/contact"]) {
  await page.goto(origin + path, { waitUntil: "networkidle" })
  const tags = await page.$$eval("script#seagle-analytics", (els) => els.map((e) => e.outerHTML))
  console.log(`${mode} ${path} script#seagle-analytics=${tags.length}`, tags.join(" "))
}
console.log(`${mode} audience-requests-blocked=${blocked.length}`, blocked.join(" "))
console.log(`${mode} external-hosts=`, [...new Set(external.map((u) => new URL(u).host))].join(","))
await browser.close()

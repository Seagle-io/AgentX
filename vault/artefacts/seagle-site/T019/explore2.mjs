import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"
const B="http://localhost:4173"
const browser = await chromium.launch({ args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] })
const ctx = await browser.newContext({ viewport: {width:1440,height:900}, locale: "fr-FR" })
const page = await ctx.newPage()
await page.goto(B+"/de", { waitUntil: "networkidle" })
const vis = () => page.evaluate(() => [...document.querySelectorAll("a,button,[role=menuitem],[role=option]")].filter(e=>e.offsetParent!==null && e.getBoundingClientRect().width>0).map(e=>e.tagName+"|"+(e.getAttribute("href")||"")+"|"+e.textContent.trim().replace(/\s+/g," ").slice(0,25)))
const base = new Set(await vis())
for (const name of ["Leistungen","Lösungen","Tools","Unternehmen"]) {
  await page.locator("header button:visible", { hasText: name }).first().click()
  await page.waitForTimeout(400)
  console.log(name, (await vis()).filter(x=>!base.has(x)))
  await page.keyboard.press("Escape"); await page.mouse.move(700,800); await page.waitForTimeout(300)
}
await page.locator('button[aria-label^="Sprache"]:visible').click(); await page.waitForTimeout(300)
console.log("lang", (await vis()).filter(x=>!base.has(x)))
await browser.close()

import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"
const B="http://localhost:4173"
const browser = await chromium.launch({ args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] })
for (const vp of [{width:1440,height:900},{width:390,height:844}]) {
  const ctx = await browser.newContext({ viewport: vp, locale: "fr-FR" })
  const page = await ctx.newPage()
  await page.goto(B+"/de", { waitUntil: "networkidle" })
  const info = await page.evaluate(() => ({
    buttons: [...document.querySelectorAll("header button, nav button, [role=button]")].map(b => (b.getAttribute("aria-label")||"")+"|"+b.textContent.trim().slice(0,30)+"|"+(b.offsetParent!==null)),
    headerA: [...document.querySelectorAll("header a")].map(a=>a.getAttribute("href")+"|"+a.textContent.trim().slice(0,20)+"|"+(a.offsetParent!==null)),
    footerA: [...document.querySelectorAll("footer a")].map(a=>a.getAttribute("href")+"|"+a.textContent.trim().slice(0,20)),
    selects: [...document.querySelectorAll("select")].map(s=>s.outerHTML.slice(0,200)),
  }))
  console.log(JSON.stringify(vp), JSON.stringify(info, null, 1))
  await ctx.close()
}
await browser.close()

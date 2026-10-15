import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"
const b = await chromium.launch({args:["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]})
for (const [start,lng] of [["/de","de"],["/","fr"]]) {
  const p = await b.newPage(); const errs=[]; p.on("pageerror",e=>errs.push(String(e)))
  await p.addInitScript(l=>{localStorage.setItem("seagle-theme","dark");localStorage.setItem("i18nextLng",l)},lng)
  await p.goto("http://localhost:4422"+start,{waitUntil:"networkidle"})
  const a = p.locator('a[href*="/services/"]').first()
  console.log(start,"href",await a.getAttribute("href"))
  await a.click(); await p.waitForTimeout(800)
  console.log(start,"url",new URL(p.url()).pathname,"lang",await p.evaluate(()=>document.documentElement.lang),"errs",errs.length)
}
await b.close()

import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"
export const B = "http://localhost:4424"
export const launch = () => chromium.launch({ args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] })
const W = { fr:[" les "," des "," et "," pour "," vos "," une "," nous "], en:[" the "," and "," for "," your "," with "," our "," we "], de:[" und "," die "," der "," mit "," für "," wir "," ihre "], es:[" los "," para "," con "," las "," sus "," nuestro"," una "], it:[" il "," per "," con "," della "," che "," una "," nostri"] }
export const detect = t => { t = " "+t.toLowerCase().replace(/\s+/g," ")+" "; const s = Object.fromEntries(Object.entries(W).map(([l,ws])=>[l, ws.reduce((n,w)=>n+t.split(w).length-1,0)])); return Object.entries(s).sort((a,b)=>b[1]-a[1])[0][0] }
export async function open(ctx, url, { storage } = {}) {
  const page = await ctx.newPage()
  const navs = [], errs = []
  page.on("framenavigated", f => { if (f === page.mainFrame()) navs.push(f.url().replace(B,"")) })
  page.on("pageerror", e => errs.push(String(e).slice(0,120)))
  if (storage) await page.addInitScript(s => { if (!sessionStorage.__x) { localStorage.setItem("i18nextLng", s); sessionStorage.__x=1 } }, storage)
  await page.goto(B+url, { waitUntil: "networkidle" }); await page.waitForTimeout(500)
  return { page, navs, errs }
}
export const state = page => page.evaluate(() => ({ url: location.pathname+location.search+location.hash, lang: document.documentElement.lang, og: document.querySelector('meta[property="og:locale"]')?.content, canon: document.querySelector('link[rel=canonical]')?.href?.replace("https://seagle.io",""), hl: document.querySelectorAll('link[rel=alternate][hreflang]').length, text: (document.querySelector("main")||document.body).innerText.slice(0,4000), bodyLen: document.body.innerText.trim().length }))
export const summ = s => ({ ...s, text: undefined, tlang: detect(s.text) })

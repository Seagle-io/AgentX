import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"
const B = process.env.B || "http://localhost:4173"
const LOC = { fr: "index-wrQ7AnnA.js", en: "index-DWnRCt51.js", de: "index-CX6jW941.js", es: "index-BFFoC9iq.js", it: "index-DNebYSPw.js" }
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] })
async function run(label, path, { abort = [], once = false, ls, vp } = {}) {
  const ctx = await browser.newContext({ locale: "fr-FR", viewport: vp || { width: 1440, height: 900 } })
  if (ls !== undefined) await ctx.addInitScript(v => { if (!sessionStorage.__x) { localStorage.setItem("i18nextLng", v); sessionStorage.__x = 1 } }, ls)
  const page = await ctx.newPage()
  const errs = [], docs = []
  page.on("pageerror", e => errs.push(e.message.slice(0, 80)))
  page.on("framenavigated", f => { if (f === page.mainFrame()) docs.push(f.url().replace(B, "")) })
  let n = 0
  const files = abort.map(l => LOC[l])
  if (files.length) await page.route(u => files.some(a => u.href.endsWith(a)), r => { n++; if (once && n > files.length) return r.continue(); return r.abort() })
  await page.goto(B + path, { waitUntil: "load" })
  await page.waitForTimeout(3500)
  // scroll whole page to trigger in-view anims
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)) } window.scrollTo(0, 0) })
  await page.waitForTimeout(800)
  const r = await page.evaluate(() => {
    const root = document.getElementById("root")
    const react = Object.keys(root).some(k => k.startsWith("__reactContainer"))
    const hidden = [...root.querySelectorAll("h1,h2,h3,p,a,button,li")].filter(e => e.innerText.trim() && +getComputedStyle(e).opacity < 0.05 && e.getBoundingClientRect().height > 0)
    return { h1: root.querySelector("h1")?.textContent.replace(/\s+/g, " ").trim().slice(0, 40), lang: document.documentElement.lang, react, rootLen: root.innerText.length,
      ss: Object.keys(sessionStorage).filter(k => k.startsWith("reloaded")), hiddenTxt: hidden.length, hiddenEx: hidden.slice(0, 2).map(e => e.innerText.slice(0, 30)) }
  })
  console.log(label.padEnd(22), path, JSON.stringify(r), "docs=" + docs.length, "reqLoc=" + n, "pageerror=" + errs.length, errs.join("|"))
  await ctx.close()
}
for (const p of (process.env.P || "/").split(",")) {}
await run("ok fr", "/")
await run("abort fr persist", "/", { abort: ["fr"] })
await run("abort fr once", "/", { abort: ["fr"], once: true })
await run("abort de persist", "/de/products/", { abort: ["de"] })
await run("abort de+fr persist", "/de/products/", { abort: ["de", "fr"] })
await run("abort de once", "/de/products/", { abort: ["de"], once: true })
await run("abort en persist", "/about/", { abort: ["en"] })
await run("abort fr persist 390", "/", { abort: ["fr"], vp: { width: 390, height: 844 } })
await run("abort it /it/ ls", "/it/", { abort: ["it"] })
await run("abort de ls=de /", "/", { abort: ["de"], ls: "de" })
await run("abort fr /a-propos", "/a-propos/", { abort: ["fr"] })
await browser.close()

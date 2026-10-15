import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"
const B = "http://localhost:4173"
const LOC = { "index-wrQ7AnnA.js": "fr", "index-DWnRCt51.js": "en", "index-CX6jW941.js": "de", "index-BFFoC9iq.js": "es", "index-DNebYSPw.js": "it" }
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] })
async function run(label, path, { ls, abort, locale } = {}) {
  const ctx = await browser.newContext({ locale: locale || "fr-FR" })
  if (ls !== undefined) await ctx.addInitScript(v => { try { localStorage.setItem("i18nextLng", v) } catch {} }, ls)
  const page = await ctx.newPage()
  const errs = [], cons = [], locs = []
  page.on("pageerror", e => errs.push(e.message.slice(0, 80)))
  page.on("console", m => { if (m.type() === "error") cons.push(m.text().slice(0, 80)) })
  page.on("request", r => { const f = r.url().split("/").pop(); if (LOC[f]) locs.push(LOC[f]) })
  if (abort) await page.route(u => abort.some(a => u.href.endsWith(a)), r => r.abort())
  await page.goto(B + path, { waitUntil: "load" })
  await page.waitForTimeout(2500)
  const r = await page.evaluate(() => ({
    h1: [...document.querySelectorAll("#root h1")].map(h => h.textContent.replace(/\s+/g, " ").trim()).join(" || ").slice(0, 70),
    lang: document.documentElement.lang, mounted: document.documentElement.classList.contains("app-mounted"),
    rootLen: document.getElementById("root")?.innerText.length, ls: localStorage.getItem("i18nextLng"),
    raw: (document.getElementById("root")?.innerText.match(/\b[A-Z][A-Za-z]+\.[a-z][A-Za-z]+\.[A-Za-z.]+\b/g) || []).slice(0, 4),
  }))
  console.log(label, path, JSON.stringify(r), "locales=", [...new Set(locs)].join(","), "pageerror=", errs.length, errs.join("|"), "console.err=", cons.length, cons.slice(0, 2).join("|"))
  await ctx.close()
}
await run("ls=xx", "/", { ls: "xx" })
await run("ls=empty", "/", { ls: "" })
await run("ls=xx", "/contact/", { ls: "xx" })
await run("ls=xx-YY", "/", { ls: "de-CH" })
await run("ls=xx nav=ja", "/", { ls: "xx", locale: "ja-JP" })
await run("no-ls nav=ja", "/", { locale: "ja-JP" })
await run("abort fr", "/", { abort: ["index-wrQ7AnnA.js"] })
await run("abort de", "/de/products/", { abort: ["index-CX6jW941.js"] })
await run("abort de+fr", "/de/products/", { abort: ["index-CX6jW941.js", "index-wrQ7AnnA.js"] })
await run("abort en", "/about/", { abort: ["index-DWnRCt51.js"] })
await run("ok de", "/de/products/")
await run("ok en", "/about/")
await browser.close()

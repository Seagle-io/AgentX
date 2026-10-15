// node shots.mjs <prefixe> [kbd] — captures survol (+ clavier si "kbd") sur BASE
import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"
const BASE = process.env.BASE ?? "http://localhost:4407"
const [pre, mode] = process.argv.slice(2)
const dir = new URL(".", import.meta.url).pathname
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] })
const mk = async vp => {
  const c = await b.newContext({ viewport: vp })
  await c.addInitScript(() => { localStorage.setItem("seagle-theme", "dark"); localStorage.setItem("i18nextLng", "fr") })
  const p = await c.newPage(); await p.goto(BASE + "/"); await p.waitForLoadState("networkidle").catch(() => {}); await p.waitForTimeout(1200)
  return p
}
const active = p => p.evaluate(() => { const e = document.activeElement; return e.tagName.toLowerCase() + ` "${(e.getAttribute("aria-label") || e.innerText || "").trim().slice(0, 30).replace(/\n/g, " ")}"` + (e.closest("main") ? " ∈main" : "") })
const visLinks = p => p.evaluate(() => [...document.querySelectorAll("header a[href]")].filter(a => { const r = a.getBoundingClientRect(); return r.width > 0 && r.top > 60 && r.top < 600 }).length)
const out = {}
// survol souris, desktop
let p = await mk({ width: 1440, height: 900 })
await p.locator("header nav button", { hasText: "Services" }).hover(); await p.waitForTimeout(700)
await p.screenshot({ path: `${dir}${pre}-survol-1440.png`, clip: { x: 0, y: 0, width: 1440, height: 520 } })
out.survol = { liens: await visLinks(p) }
await p.mouse.click(1400, 880); await p.waitForTimeout(300)
if (mode === "kbd") {
  const trig = p.locator("header nav button", { hasText: "Services" })
  await p.mouse.move(700, 880); await p.goto(BASE + "/"); await p.waitForTimeout(1200)
  await p.keyboard.press("Tab"); out.premierTab = await active(p)
  await p.screenshot({ path: `${dir}${pre}-skip-1440.png`, clip: { x: 0, y: 0, width: 1440, height: 200 } })
  await p.keyboard.press("Enter"); await p.waitForTimeout(800); await p.keyboard.press("Tab"); out.skipPuisTab = await active(p)
  await trig.focus(); await p.keyboard.press("Enter"); await p.waitForTimeout(700)
  out.menuEntrée = { liens: await visLinks(p), expanded: await trig.getAttribute("aria-expanded"), controls: await trig.getAttribute("aria-controls"), haspopup: await trig.getAttribute("aria-haspopup") }
  await p.keyboard.press("Tab"); out.menuTab1 = await active(p)
  await p.screenshot({ path: `${dir}${pre}-menu-clavier-1440.png`, clip: { x: 0, y: 0, width: 1440, height: 520 } })
  await p.keyboard.press("Escape"); await p.waitForTimeout(500)
  out.menuÉchap = { focus: await active(p), expanded: await trig.getAttribute("aria-expanded"), liens: await visLinks(p) }
  await p.keyboard.press("Space"); await p.waitForTimeout(500); out.menuEspace = await visLinks(p)
  for (let i = 0; i < 12; i++) await p.keyboard.press("Tab")
  await p.waitForTimeout(500); out.menuSortieTab = { focus: await active(p), expanded: await trig.getAttribute("aria-expanded") }
  const lang = p.locator("header button[aria-label^='Langue']:visible")
  out.langueNom = await lang.getAttribute("aria-label")
  await lang.focus(); await p.keyboard.press("Enter"); await p.waitForTimeout(300); await p.keyboard.press("Tab"); await p.keyboard.press("Escape"); await p.waitForTimeout(300)
  out.langueÉchap = { expanded: await lang.getAttribute("aria-expanded"), focus: await active(p) }
  // mobile
  p = await mk({ width: 390, height: 800 })
  const burger = p.locator("button[aria-label='Toggle menu']")
  out.tiroirFermé = await p.evaluate(() => [...document.querySelectorAll("#mobile-drawer a, #mobile-drawer button")].filter(e => !e.closest("[inert]")).length)
  const seq = []; for (let i = 0; i < 6; i++) { await p.keyboard.press("Tab"); seq.push(await active(p)) } out.tabMobile = seq
  await burger.focus(); await p.keyboard.press("Enter"); await p.waitForTimeout(600)
  out.tiroirOuvert = { expanded: await burger.getAttribute("aria-expanded"), controls: await burger.getAttribute("aria-controls"), focusables: await p.evaluate(() => [...document.querySelectorAll("#mobile-drawer a, #mobile-drawer button")].filter(e => !e.closest("[inert]")).length) }
  await p.keyboard.press("Tab"); out.tiroirTab1 = await active(p)
  await p.screenshot({ path: `${dir}${pre}-tiroir-clavier-390.png` })
  await p.keyboard.press("Escape"); await p.waitForTimeout(600)
  out.tiroirÉchap = { expanded: await burger.getAttribute("aria-expanded"), focus: await active(p), inert: await p.evaluate(() => document.getElementById("mobile-drawer").hasAttribute("inert")) }
}
// survol souris, mobile : tiroir ouvert au clic
p = await mk({ width: 390, height: 800 })
await p.locator("button[aria-label='Toggle menu']").click(); await p.waitForTimeout(600)
await p.screenshot({ path: `${dir}${pre}-tiroir-clic-390.png` })
await b.close()
console.log(JSON.stringify(out, null, 1))

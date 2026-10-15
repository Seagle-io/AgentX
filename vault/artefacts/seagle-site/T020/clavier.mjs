import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"
const BASE = process.env.BASE ?? "http://localhost:4173"
const b = await chromium.launch()
const act = pg => pg.evaluate(() => { const e = document.activeElement; return `${e.tagName}|${(e.getAttribute("aria-label")||e.textContent||"").trim().slice(0,28)}|exp=${e.getAttribute("aria-expanded")}|inMain=${!!e.closest("#main")}|inDrawer=${!!e.closest("#mobile-drawer")}` })
const vis = (pg, sel) => pg.$$eval(sel, els => els.filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== "hidden" }).length)
for (const p of ["/", "/de"]) {
  const out = {}
  // Desktop
  let pg = await b.newPage({ viewport: { width: 1440, height: 900 } }); await pg.goto(BASE + p, { waitUntil: "load" }); await pg.waitForTimeout(1000)
  await pg.keyboard.press("Tab"); out.tab1 = await act(pg)
  out.skipVisible = await pg.evaluate(() => { const r = document.activeElement.getBoundingClientRect(); return r.width > 1 && r.top >= 0 })
  await pg.keyboard.press("Enter"); await pg.waitForTimeout(300); out.afterSkip = await act(pg)
  out.hash = await pg.evaluate(() => location.hash + " mainExists=" + !!document.getElementById("main") + " mainTabindex=" + document.getElementById("main")?.getAttribute("tabindex"))
  await pg.keyboard.press("Tab"); out.afterSkipTab = await act(pg)
  // menu
  const trig = pg.locator("header nav button").first()
  await trig.focus(); await pg.keyboard.press("Enter"); await pg.waitForTimeout(400)
  out.menuEnter = `exp=${await trig.getAttribute("aria-expanded")} liens=${await vis(pg, "#mega-menu-1 a")}`
  await pg.keyboard.press("Tab"); out.menuTab = await act(pg)
  await pg.keyboard.press("Escape"); await pg.waitForTimeout(600)
  out.menuEsc = `${await act(pg)} liens=${await vis(pg, "#mega-menu-1 a")}`
  await pg.keyboard.press("Space"); await pg.waitForTimeout(400); out.menuSpace = `exp=${await trig.getAttribute("aria-expanded")} liens=${await vis(pg, "#mega-menu-1 a")}`
  // Tab through panel to leave it
  for (let i = 0; i < 12; i++) { await pg.keyboard.press("Tab"); if (!(await pg.evaluate(() => !!document.activeElement.closest("#mega-menu-1")))) break }
  await pg.waitForTimeout(600); out.menuSortie = `${await act(pg)} exp1=${await trig.getAttribute("aria-expanded")} liens=${await vis(pg, "#mega-menu-1 a")}`
  // langue
  const lang = pg.locator("header > div button[aria-label*=':']").first()
  await lang.focus(); await pg.keyboard.press("Enter"); await pg.waitForTimeout(300); out.langOpen = await lang.getAttribute("aria-expanded")
  await pg.keyboard.press("Escape"); await pg.waitForTimeout(300); out.langEsc = `exp=${await lang.getAttribute("aria-expanded")} ${await act(pg)}`
  await pg.close()
  // Mobile
  pg = await b.newPage({ viewport: { width: 390, height: 844 } }); await pg.goto(BASE + p, { waitUntil: "load" }); await pg.waitForTimeout(1000)
  out.drawerInert = await pg.getAttribute("#mobile-drawer", "inert")
  let inDrawer = 0, n = 0
  for (; n < 80; n++) { await pg.keyboard.press("Tab"); if (await pg.evaluate(() => !!document.activeElement.closest("#mobile-drawer"))) inDrawer++ }
  out.drawerFermeFocus = `${inDrawer}/${n} tabs`
  await pg.evaluate(() => window.scrollTo(0, 0)); await pg.waitForTimeout(300)
  const burger = pg.locator("button[aria-controls=mobile-drawer]")
  await burger.focus(); await pg.keyboard.press("Enter"); await pg.waitForTimeout(500)
  out.drawerOpen = `exp=${await burger.getAttribute("aria-expanded")} inert=${await pg.getAttribute("#mobile-drawer", "inert")}`
  // Tab dans le tiroir : chaque cible visible dans la zone non rognée ?
  const seen = []
  for (let i = 0; i < 12; i++) {
    await pg.keyboard.press("Tab")
    const r = await pg.evaluate(() => { const e = document.activeElement, d = document.getElementById("mobile-drawer"); if (!e.closest("#mobile-drawer")) return null; const a = e.getBoundingClientRect(), c = d.getBoundingClientRect(); return `${(e.getAttribute("aria-label")||e.textContent).trim().slice(0,22)}:${a.bottom <= c.bottom + 0.5 ? "visible" : `ROGNÉ(bas ${Math.round(a.bottom)}>${Math.round(c.bottom)})`}` })
    if (r === null) break; seen.push(r)
  }
  out.drawerTabs = seen.join(" · ")
  // langue dans le tiroir puis Échap
  const dl = pg.locator("#mobile-drawer button[aria-label*=':']")
  await dl.focus(); await pg.keyboard.press("Enter"); await pg.waitForTimeout(300)
  const lo = await dl.getAttribute("aria-expanded")
  await pg.keyboard.press("Escape"); await pg.waitForTimeout(400)
  out.drawerLangEsc = `langOuvert=${lo} → langExp=${await dl.getAttribute("aria-expanded")} drawerExp=${await burger.getAttribute("aria-expanded")} ${await act(pg)}`
  if ((await burger.getAttribute("aria-expanded")) === "true") { await pg.keyboard.press("Escape"); await pg.waitForTimeout(400) }
  out.drawerEsc = `exp=${await burger.getAttribute("aria-expanded")} inert=${await pg.getAttribute("#mobile-drawer", "inert")} ${await act(pg)}`
  await pg.close()
  console.log("==", p); for (const [k, v] of Object.entries(out)) console.log(k.padEnd(16), v)
}
await b.close()

import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"
const B = "http://localhost:4173"
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] })
for (const rm of ["reduce", "no-preference"]) {
  const c = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: rm }); const p = await c.newPage()
  for (const u of ["/", "/la-joconde/", "/nuit-etoilee/", "/solutions/kora/", "/lab/", "/de/"]) {
    await p.goto(B + u, { waitUntil: "load" }); await p.waitForTimeout(2500)
    const r = await p.evaluate(async () => {
      const cv = [...document.querySelectorAll("canvas")]
      const info = cv.map(cn => { let e = cn, anc = false; while (e) { if ((e.getAttribute?.("class") || "").includes("animate-")) anc = true; e = e.parentElement } let px = -1; try { const t = document.createElement("canvas"); t.width = 64; t.height = 64; const x = t.getContext("2d"); x.drawImage(cn, 0, 0, 64, 64); const d = x.getImageData(0, 0, 64, 64).data; let s = new Set(); for (let i = 0; i < d.length; i += 4) s.add(d[i] + "," + d[i + 1] + "," + d[i + 2] + "," + d[i + 3]); px = s.size } catch (e) { px = "err" } return { w: cn.width, h: cn.height, anim: anc, colors: px, anim2: getComputedStyle(cn).animationName } })
      // ascii pre-based?
      const pre = [...document.querySelectorAll("pre")].filter(e => e.innerText.length > 200).length
      const a = [...document.querySelectorAll('[class*="animate-"]')].map(e => [...e.classList].find(k => k.includes("animate-")) + ":" + getComputedStyle(e).animationName + ":op" + getComputedStyle(e).opacity)
      return { canvas: info, pre, animEls: [...new Set(a)] }
    })
    // canvas change over time
    const h = async () => p.evaluate(() => [...document.querySelectorAll("canvas")].map(c => { try { return c.toDataURL().length + ":" + c.toDataURL().slice(-40) } catch { return "x" } }).join("|"))
    const h0 = await h(); await p.waitForTimeout(1200); const h1 = await h()
    console.log(rm, u, JSON.stringify(r), "canvasAnimating=" + (h0 !== h1))
  }
  // menus
  await p.goto(B + "/", { waitUntil: "load" }); await p.waitForTimeout(1500)
  const t = p.locator("header nav button").first()
  await t.click(); await p.waitForTimeout(500)
  const mm = await p.evaluate(() => { const m = document.querySelector("#mega-menu-1"); if (!m) return "∅"; const r = m.getBoundingClientRect(); return { h: Math.round(r.height), op: getComputedStyle(m).opacity, links: [...m.querySelectorAll("a")].filter(a => a.getBoundingClientRect().width > 0 && +getComputedStyle(a).opacity > 0.9).length } })
  await p.keyboard.press("Escape")
  const lang = p.locator('header button[aria-label*=":"]:visible').first(); await lang.click(); await p.waitForTimeout(500)
  const lm = await p.evaluate(() => [...document.querySelectorAll("button")].filter(b => /^(Français|English|Deutsch|Español|Italiano)/.test(b.innerText.trim()) && b.getBoundingClientRect().width > 0).length)
  await p.keyboard.press("Escape")
  await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(500)
  await p.locator("button[aria-controls=mobile-drawer]").click(); await p.waitForTimeout(700)
  const dr = await p.evaluate(() => { const d = document.getElementById("mobile-drawer"); const r = d.getBoundingClientRect(); return { h: Math.round(r.height), op: getComputedStyle(d).opacity, inert: d.inert, vis: [...d.querySelectorAll("a")].filter(a => { const q = a.getBoundingClientRect(); return q.height > 0 && q.bottom <= innerHeight }).length } })
  console.log(rm, "megamenu", JSON.stringify(mm), "langItems=" + lm, "drawer", JSON.stringify(dr))
  await c.close()
}
await b.close()

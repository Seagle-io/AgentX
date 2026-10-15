import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"
const PAGES = []
const extra = (process.env.EXTRA ?? "").split(",").filter(Boolean)
const b = await chromium.launch({ args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] })
for (const rm of (process.env.RM ?? "reduce,no-preference").split(",")) {
  const c = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: rm }); const p = await c.newPage()
  let tot = 0
  for (const u of [...PAGES, ...extra]) {
    await p.goto("http://localhost:4426" + u, { waitUntil: "load" }); await p.waitForTimeout(1200)
    const a = await p.evaluate(() => {
      const css = [...document.querySelectorAll("*")].filter(e => { const cs = getComputedStyle(e); return cs.animationIterationCount.includes("infinite") && cs.animationName !== "none" && cs.animationPlayState !== "paused" }).map(e => getComputedStyle(e).animationName)
      const waapi = document.getAnimations().filter(an => an.playState === "running" && an.effect?.getComputedTiming().iterations === Infinity).map(an => an.animationName ?? "waapi")
      return { css, waapi }
    })
    let marquee = ""
    if (u === "/") marquee = await p.evaluate(async () => { const e = document.querySelector(".animate-marquee, .animate-marquee-reverse"); if (!e) return "∅"; const t0 = getComputedStyle(e).transform; await new Promise(r => setTimeout(r, 700)); return t0 === getComputedStyle(e).transform ? "fixe" : "bouge" })
    tot += a.css.length
    if (a.css.length || a.waapi.length || marquee) console.log(rm, u, JSON.stringify(a), marquee ? "marquee=" + marquee : "")
  }
  console.log(rm, "total css infinies", tot)
  await c.close()
}
await b.close()

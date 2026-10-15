import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] })
for (const [p, w] of [["/lab/", 1440], ["/lab/", 390], ["/de/lab/", 1440], ["/la-joconde/", 1440], ["/nuit-etoilee/", 1440], ["/de/mona-lisa/", 1440], ["/es/lab/", 1440]]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } }); const errs = []
  page.on("pageerror", e => errs.push(e.message.slice(0, 60)))
  const r = await page.goto("http://localhost:4173" + p); await page.waitForTimeout(2500)
  const s = await page.evaluate(() => {
    const links = [...document.querySelectorAll("main a, #root a")].map(a => a.getAttribute("href")).filter(h => /(nuit-etoilee|adam|vague|joconde|starry|wave|mona)/.test(h || ""))
    const uniq = [...new Set(links)]
    const cards = [...document.querySelectorAll("#root a")].filter(a => uniq.includes(a.getAttribute("href")) && a.querySelector("img,canvas,pre,svg")).map(a => Math.round(a.getBoundingClientRect().top + scrollY))
    return { h1: [...document.querySelectorAll("#root h1")].map(h => h.textContent.trim().slice(0, 40)), links: uniq, cardRows: [...new Set(cards)].length, cards: cards.length, h2: [...document.querySelectorAll("#root h2")].map(h => h.textContent.trim().slice(0, 30)).slice(0, 4) }
  })
  console.log(p, w, r.status(), JSON.stringify(s), "pageerror=", errs.length, errs.join("|"))
  await page.close()
}
await browser.close()

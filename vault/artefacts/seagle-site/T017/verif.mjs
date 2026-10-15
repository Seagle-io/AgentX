import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"

const OUT = "/home/jdrac/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T017"
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] })

async function open(port, path, theme, width) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "no-preference" })
  await ctx.addInitScript(t => { localStorage.setItem("seagle-theme", t); localStorage.setItem("i18nextLng", "fr") }, theme)
  const page = await ctx.newPage()
  await page.goto(`http://localhost:${port}${path}`, { waitUntil: "networkidle" })
  await page.mouse.move(0, 0)
  // défiler jusqu'en bas par paliers pour déclencher les animations inView
  const h = await page.evaluate(() => document.body.scrollHeight)
  for (let y = 0; y <= h; y += 400) { await page.evaluate(v => window.scrollTo(0, v), y); await page.waitForTimeout(120) }
  await page.waitForTimeout(1500)
  return { ctx, page }
}

const nav = "section:has(a.group h3)"

// 1. /la-joconde : zone nav avant/après
const shots = {}
for (const [tag, port] of [["avant", 4418], ["apres", 4417]]) {
  const { ctx, page } = await open(port, "/la-joconde", "dark", 1440)
  const el = page.locator(nav)
  await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(1500)
  shots[tag] = (await el.screenshot({ path: `${OUT}/joconde-nav-${tag}.png`, animations: "disabled" })).toString("base64")
  shots[tag + "Html"] = await el.evaluate(n => n.outerHTML)
  await ctx.close()
}
{
  const ctx = await browser.newContext(); const page = await ctx.newPage()
  const diff = await page.evaluate(async ([a, b]) => {
    const load = s => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = "data:image/png;base64," + s })
    const [ia, ib] = await Promise.all([load(a), load(b)])
    if (ia.width !== ib.width || ia.height !== ib.height) return `taille ${ia.width}x${ia.height} ≠ ${ib.width}x${ib.height}`
    const px = img => { const c = document.createElement("canvas"); c.width = img.width; c.height = img.height; const g = c.getContext("2d"); g.drawImage(img, 0, 0); return g.getImageData(0, 0, c.width, c.height).data }
    const da = px(ia), db = px(ib); let n = 0
    for (let i = 0; i < da.length; i += 4) if (da[i] !== db[i] || da[i + 1] !== db[i + 1] || da[i + 2] !== db[i + 2] || da[i + 3] !== db[i + 3]) n++
    return `${ia.width}x${ia.height} pixels différents=${n}`
  }, [shots.avant, shots.apres])
  console.log("joconde nav:", diff, "| outerHTML identique:", shots.avantHtml === shots.apresHtml)
  await ctx.close()
}

// 2. /lab : mesures + captures
for (const width of [1440, 390]) for (const theme of ["light", "dark"]) {
  const { ctx, page } = await open(4417, "/lab", theme, width)
  const m = await page.evaluate(sel => {
    const s = document.querySelector(sel)
    const cards = [...s.querySelectorAll("a.group")].map(a => a.getBoundingClientRect())
    const hero = s.previousElementSibling, h1el = hero.querySelector("h1"), h1 = h1el.getBoundingClientRect()
    const intro = hero.querySelector("p").getBoundingClientRect()
    const rows = new Set(cards.map(c => Math.round(c.top))).size
    return { h2: s.querySelectorAll("h2").length, span: s.querySelectorAll(":scope > div > span").length,
      maxw: s.firstElementChild.className, cartes: cards.length, lignes: rows,
      h1Left: h1.left, carteLeft: cards[0].left, ecart: Math.round(cards[0].top - intro.bottom) }
  }, nav)
  console.log(`lab ${width} ${theme}:`, JSON.stringify(m))
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(300)
  await page.screenshot({ path: `${OUT}/lab-${theme}-${width}.png`, fullPage: true })
  await ctx.close()
}
await browser.close()

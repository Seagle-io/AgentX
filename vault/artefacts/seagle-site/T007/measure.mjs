import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"

const URL = "http://localhost:4402/agentx"
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] })
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

async function open(width, height, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, ...opts })
  await ctx.addInitScript(() => {
    localStorage.setItem("seagle-theme", "dark")
    localStorage.setItem("i18nextLng", "fr")
  })
  const page = await ctx.newPage()
  const hits = []
  page.on("response", async (res) => {
    const u = res.url()
    if (!/\.(webm|mp4)(\?|$)/.test(u)) return
    let bytes = Number(res.headers()["content-length"] ?? 0)
    try { bytes = (await res.body()).length } catch {}
    hits.push({ file: u.split("/").pop(), status: res.status(), bytes })
  })
  await page.goto(URL, { waitUntil: "load" })
  return { ctx, page, hits }
}

const state = (page) => page.evaluate(() => [...document.querySelectorAll("video")].map((v) => {
  const r = v.getBoundingClientRect()
  return {
    src: v.currentSrc.split("/").pop() || "(none)",
    tabs: v.classList.contains("object-cover"),
    paused: v.paused,
    visible: r.bottom > 0 && r.top < innerHeight,
    top: Math.round(r.top),
  }
}))
const sum = (h) => h.reduce((a, x) => a + x.bytes, 0)

for (const [w, h] of [[390, 844], [1440, 900]]) {
  const { ctx, page, hits } = await open(w, h)
  await wait(4000)
  console.log(`${w}x${h} load+4s: video bytes=${sum(hits)} hits=${JSON.stringify(hits)}`)
  console.log(`  videos=${JSON.stringify(await state(page))}`)
  await ctx.close()
}

// défilement jusqu'aux onglets, puis remontée, puis changement d'onglet
{
  const { ctx, page, hits } = await open(1440, 900)
  await wait(1500)
  await page.locator("video.object-cover").first().scrollIntoViewIfNeeded()
  await page.locator('[role="tablist"]').hover()
  await page.locator("video.object-cover").first().scrollIntoViewIfNeeded()
  await wait(2000)
  console.log(`scroll→tabs: videos=${JSON.stringify(await state(page))}`)
  await page.evaluate(() => scrollTo(0, 0))
  await wait(1500)
  console.log(`scroll→top: videos=${JSON.stringify(await state(page))}`)
  await page.locator("video.object-cover").first().scrollIntoViewIfNeeded()
  const tabs = page.locator('[role="tab"]')
  await tabs.nth(1).click()
  await page.locator('[role="tablist"]').hover()
  await page.locator("video.object-cover").last().scrollIntoViewIfNeeded()
  await wait(2500)
  console.log(`tab 2 click: videos=${JSON.stringify(await state(page))}`)
  console.log(`  hits=${JSON.stringify(hits)}`)
  await ctx.close()
}

// mouvement réduit : jamais de lecture
{
  const { ctx, page, hits } = await open(1440, 900, { reducedMotion: "reduce" })
  await wait(2000)
  await page.locator("video.object-cover").first().scrollIntoViewIfNeeded()
  await wait(2000)
  console.log(`reduced-motion: bytes=${sum(hits)} videos=${JSON.stringify(await state(page))}`)
  await ctx.close()
}

await browser.close()

import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"
const [path, w, h, wait] = [process.argv[2] ?? "/agentx", +process.argv[3] || 1440, +process.argv[4] || 900, +process.argv[5] || 6000]
const b = await chromium.launch({ args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] })
const ctx = await b.newContext({ viewport: { width: w, height: h } })
await ctx.addInitScript(() => { localStorage.setItem("seagle-theme","dark"); localStorage.setItem("i18nextLng","fr") })
const p = await ctx.newPage()
const rows = []
p.on("response", async (r) => {
  const u = new URL(r.url()); if (u.host !== "localhost:4173") return
  let len = +(r.headers()["content-length"] || 0)
  try { if (!len) len = (await r.body()).length } catch {}
  rows.push([u.pathname, r.status(), len, r.headers()["content-type"]])
})
await p.goto("http://localhost:4173" + path, { waitUntil: "load" })
await p.waitForTimeout(wait)
const vids = await p.evaluate(() => [...document.querySelectorAll("video")].map(v => ({ src: v.currentSrc.split("/").pop(), rs: v.readyState, paused: v.paused, preload: v.preload, buffered: v.buffered.length ? v.buffered.end(v.buffered.length-1) : 0, dur: v.duration })))
console.log(JSON.stringify({ path, w, h, vids }))
const by = {}; for (const [u,s,l,t] of rows) { const k = /\.(webm|mp4)$/.test(u) ? "video" : /\.js$/.test(u) ? "js" : /\.css$/.test(u) ? "css" : /\.(woff2?)$/.test(u) ? "font" : /\.(webp|png|jpg|svg)$/.test(u) ? "img" : "other"; by[k] = (by[k]||0)+l }
console.log(JSON.stringify(by))
for (const r of rows.filter(r => /\.(webm|mp4|webp)$/.test(r[0]) || (r[2] > 100000 || /\.js$/.test(r[0])))) console.log(r.join(" "))
console.log("total", rows.reduce((a,r)=>a+r[2],0), "n", rows.length)
await b.close()

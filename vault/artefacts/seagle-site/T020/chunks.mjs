import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"
const b = await chromium.launch()
const get = async p => { const pg = await b.newPage(); const s = new Set(); pg.on("request", r => r.url().endsWith(".js") && s.add(new URL(r.url()).pathname)); await pg.goto("http://localhost:4173"+p, { waitUntil: "networkidle" }); await pg.close(); return s }
const home = await get("/"), prod = await get(process.argv[2])
console.log([...prod].filter(x => !home.has(x)).join("\n"))
await b.close()

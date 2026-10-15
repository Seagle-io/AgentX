import fs from "fs"; import path from "path"
const D = process.argv[2]
const xml = fs.readFileSync(path.join(D,"sitemap.xml"),"utf8")
const urls = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(m=>m[1])
const S="https://seagle.io"
const locs = urls.map(u=>u.match(/<loc>(.*?)<\/loc>/)[1])
console.log("loc", locs.length, "uniq", new Set(locs).size)
const file = l => { const p = l.slice(S.length) || "/"; return p==="/" ? path.join(D,"index.html") : path.join(D,p,"index.html") }
const missing = locs.filter(l=>!fs.existsSync(file(l)))
console.log("missing files", missing)
const alt = new Map()
for (const u of urls) { const loc = u.match(/<loc>(.*?)<\/loc>/)[1]; alt.set(loc, [...u.matchAll(/hreflang="(.*?)" href="(.*?)"/g)].map(m=>[m[1],m[2]])) }
let nonrecip=[], absent=[], selfmissing=[]
for (const [loc, links] of alt) {
  if (!links.some(([h,href])=>href===loc && h!=="x-default")) selfmissing.push(loc)
  for (const [h,href] of links) {
    if (!alt.has(href)) { absent.push(`${loc} -> ${h} ${href}`); continue }
    if (!alt.get(href).some(([,b])=>b===loc)) nonrecip.push(`${loc} -> ${href}`)
  }
}
console.log("hreflang→absent", absent.length, absent.slice(0,5))
console.log("non-reciprocal", nonrecip.length, nonrecip.slice(0,5))
console.log("self missing", selfmissing.length, selfmissing.slice(0,5))
// html files vs sitemap hreflang agreement
let mism=[]
for (const [loc, links] of alt) {
  const html = fs.readFileSync(file(loc),"utf8")
  const hl = [...html.matchAll(/<link[^>]*rel="alternate"[^>]*hreflang[^>]*>/g)].map(m=>{const h=m[0].match(/hreflang="(.*?)"/)?.[1]; const r=m[0].match(/href="(.*?)"/)?.[1]; return h+" "+r}).sort()
  const sl = links.map(([h,r])=>h+" "+r).sort()
  if (JSON.stringify(hl)!==JSON.stringify(sl)) mism.push([loc, hl.length, sl.length])
  const canon = html.match(/<link[^>]*rel="canonical"[^>]*href="(.*?)"/)?.[1]
  if (canon!==loc) mism.push([loc,"canon",canon])
}
console.log("html≠sitemap", mism.length, mism.slice(0,5))

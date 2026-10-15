// DoD 4 : HTML prérendu (curl :4173) — lang, og:locale, canonical, hreflang, langue du texte ; + les 109
import { detect, B } from "./lib.mjs"
import fs from "fs"
const D = "/home/jdrac/Documents/Workspace/seagle-website/dist"
const xml = fs.readFileSync(D+"/sitemap.xml","utf8")
const pages = [...xml.matchAll(/<loc>https:\/\/seagle\.io(.*?)<\/loc>/g)].map(m=>m[1]||"/")
const OG = { fr:"fr_FR", en:"en_US", es:"es_ES", de:"de_DE", it:"it_IT" }
const loc = p => { const s = p.split("/")[1]; if (["es","de","it"].includes(s)) return s; return null }
const pick = ["/es","/it/services/data-analyse","/de/lab","/about","/contact","/de/products","/produits","/it/careers","/es/secure-pass","/de/services/seo-branding","/mona-lisa"]
let ko = []
for (const p of pages) {
  const r = await fetch(B+(p==="/"?"/":p+"/")); const h = await r.text()
  const lang = h.match(/<html[^>]*lang="(.*?)"/)?.[1]
  const og = h.match(/property="og:locale" content="(.*?)"/)?.[1]
  const canon = h.match(/rel="canonical" href="(.*?)"/)?.[1]
  const hl = [...h.matchAll(/hreflang="(.*?)"/g)].map(m=>m[1])
  const ogurl = h.match(/property="og:url" content="(.*?)"/)?.[1]
  const body = h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g," ").replace(/<head[\s\S]*?<\/head>/,"").replace(/<[^>]+>/g," ")
  const tl = detect(body)
  const exp = loc(p)
  const okL = exp ? lang===exp : ["fr","en"].includes(lang)
  const issues = []
  if (r.status!==200) issues.push("status "+r.status)
  if (!okL) issues.push("lang "+lang)
  if (og !== OG[lang]) issues.push("og "+og)
  if (canon !== "https://seagle.io"+(p==="/"?"/":p) && canon !== "https://seagle.io"+p) issues.push("canon "+canon)
  if (ogurl && ogurl !== canon) issues.push("og:url "+ogurl)
  if (tl !== lang) issues.push("text "+tl)
  if (hl.length < 5) issues.push("hl "+hl.length)
  if (pick.includes(p)) console.log(p, lang, og, canon, hl.join(","), "text="+tl)
  if (issues.length) ko.push(p+" "+issues.join(";"))
}
console.log("static", pages.length, "KO", ko.length); ko.forEach(x=>console.log(" ", x))

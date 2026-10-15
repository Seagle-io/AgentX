import { readFileSync } from "node:fs"
const D = "/home/jdrac/Documents/Workspace/seagle-website/dist/"
for (const f of process.argv.slice(2)) {
  const h = readFileSync(D + f, "utf8")
  const root = h.slice(h.indexOf('id="root"'))
  const body = root.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "")
  const h1 = [...body.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map(m => m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim())
  const text = body.replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/g, " ").replace(/\s+/g, " ")
  const keys = [...new Set(text.match(/\b[A-Z][A-Za-z]+\.[a-z][A-Za-z]+(\.[A-Za-z0-9]+)*\b/g) || [])].filter(k => !/seagle\.io|\.io$/.test(k))
  const fr = (text.match(/\b(nous|votre|vos|découvrir|pour|avec|des|les)\b/gi) || []).length
  console.log(f, "| h1=", JSON.stringify(h1), "| rawKeys=", keys.slice(0, 6).join(","), "| frWords=", fr, "| len=", text.length)
}

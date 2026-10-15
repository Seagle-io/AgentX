const B = "http://localhost:4173"
for (const p of process.argv.slice(2)) {
  const h = await (await fetch(B + p)).text()
  const all = [...h.matchAll(/<script([^>]*type="application\/ld\+json"[^>]*)>([\s\S]*?)<\/script>/g)]
  const out = all.map(m => {
    const id = (m[1].match(/id="([^"]+)"/) || [])[1] || "-"
    let t, ok
    try { const j = JSON.parse(m[2]); ok = "OK"; t = j["@type"] || (j["@graph"] || []).map(x => x["@type"]).join("+") } catch (e) { ok = "KO:" + e.message.slice(0, 40) }
    return `${id}:${ok}:${t}`
  })
  const canon = (h.match(/<link rel="canonical" href="([^"]+)"/) || [])[1]
  console.log(p, "| n=", all.length, "|", out.join(" ; "), "| canon=", canon)
}

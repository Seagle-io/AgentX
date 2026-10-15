/**
 * Garde-fou de build : refuse un dist/ qui appelle encore un serveur local
 * (VITE_CHAT_API_URL=http://localhost:3001 oublié dans le .env).
 *
 * Usage : node scripts/check-dist.mjs [dossier] [--warn]
 * dossier : dist par défaut. --warn : liste les fichiers sans échouer
 * (build local de prévisualisation).
 */

import { readdirSync, readFileSync } from "fs"
import { join, relative } from "path"

const args = process.argv.slice(2)
const warn = args.includes("--warn")
const dir = args.find(a => a !== "--warn") ?? "dist"

// Un port ou un chemin après l'hôte : react-router contient un
// `new URL("http://localhost")` nu qui n'appelle rien.
const LOCAL = /https?:\/\/(localhost|127\.0\.0\.1)[:/]/

const hits = readdirSync(dir, { recursive: true })
  .filter(f => /\.(js|html)$/.test(f))
  .map(f => join(dir, f))
  .filter(f => LOCAL.test(readFileSync(f, "utf-8")))

if (!hits.length) {
  console.log("dist OK")
} else {
  console.error(`${warn ? "⚠" : "✗"} ${hits.length} fichier(s) de ${dir} appellent localhost :`)
  for (const f of hits) console.error(`  ${relative(process.cwd(), f)}`)
  if (!warn) process.exit(1)
}

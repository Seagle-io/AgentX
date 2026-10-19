// Lint maison : `fetch(` n'est autorisé que dans src/api/<entité>/crud.ts.
// Biome ne sait pas restreindre un global → parcours des sources en Node.
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative, sep } from "node:path"

const root = new URL("../src", import.meta.url).pathname
const offenders = []

function walk(dir) {
	for (const name of readdirSync(dir)) {
		const path = join(dir, name)
		if (statSync(path).isDirectory()) {
			walk(path)
			continue
		}
		if (!/\.(ts|tsx)$/.test(name)) continue
		if (isCrud(path)) continue
		if (readFileSync(path, "utf8").includes("fetch(")) offenders.push(path)
	}
}

function isCrud(path) {
	const parts = relative(root, path).split(sep)
	return parts[0] === "api" && parts.at(-1) === "crud.ts"
}

walk(root)
if (offenders.length > 0) {
	console.error("fetch( hors src/api/*/crud.ts :")
	for (const path of offenders) console.error(`  ${relative(root, path)}`)
	process.exit(1)
}
console.log("check-fetch : OK")

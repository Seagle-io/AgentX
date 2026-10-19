import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { TacheCorps } from "@/console/component/AgentsPanel"
import "@/shared/lib/i18n/i18n"

const rendu = (pack: string, result: string | null) =>
	renderToStaticMarkup(createElement(TacheCorps, { pack, result }))

describe("TacheCorps", () => {
	it("rend le pack en Markdown sans frontmatter", () => {
		const html = rendu("---\nx: 1\n---\n## Titre", null)
		expect(html).toContain("<h2")
		expect(html).not.toContain("x: 1")
	})

	it("saute le h1 du pack, déjà titre de la fenêtre", () => {
		const html = rendu("---\nx: 1\n---\n# Titre\n## Sous", null)
		expect(html).not.toContain("<h1")
		expect(html).toContain("<h2")
	})

	it("rend le résultat en Markdown", () => {
		expect(rendu("# P", "## Livré")).toContain("<h2")
	})

	it("coupe les chemins de table après chaque « / »", () => {
		const html = rendu("| Chemin |\n|---|\n| a/b/c.ts |", null)
		expect(html.match(/<wbr/g)?.length).toBeGreaterThanOrEqual(2)
	})
})

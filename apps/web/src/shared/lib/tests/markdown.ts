import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import Markdown from "@/shared/lib/markdown/Markdown"
import { parseMarkdown } from "@/shared/lib/markdown/parse"
import Modal from "@/shared/ui/modal"

const rendu = (texte: string) =>
	renderToStaticMarkup(createElement(Markdown, { texte }))

describe("parseMarkdown", () => {
	it("titres h1/h2/h3/h6", () => {
		const blocs = parseMarkdown("# a\n## b\n### c\n###### d")
		expect(blocs.map((b) => (b.k === "heading" ? b.niveau : 0))).toEqual([
			1, 2, 3, 6,
		])
	})

	it("paragraphe multi-lignes joint", () => {
		const blocs = parseMarkdown("une\ndeux\n\ntrois")
		expect(blocs).toHaveLength(2)
		expect(rendu("une\ndeux")).toContain("une deux")
	})

	it("liste imbriquée par indentation", () => {
		const [l] = parseMarkdown("- a\n  - b\n  - c\n- d")
		expect(l.k === "list" && l.items).toHaveLength(2)
		if (l.k !== "list") throw new Error("liste attendue")
		expect(l.items[0].enfants).toHaveLength(1)
		expect(rendu("- a\n  - b")).toContain("<ul")
		expect(rendu("1. a\n2. b")).toContain("list-decimal")
	})

	it("cases cochée et non cochée", () => {
		const html = rendu("- [x] fait\n- [ ] à faire")
		expect(html).toContain("☑ fait")
		expect(html).toContain("☐ à faire")
	})

	it("tableau 2 colonnes × 2 lignes", () => {
		const [t] = parseMarkdown("| a | b |\n|---|---|\n| 1 | 2 |\n| 3 | 4 |")
		if (t.k !== "table") throw new Error("tableau attendu")
		expect(t.tete).toHaveLength(2)
		expect(t.lignes).toHaveLength(2)
		expect(rendu("| a | b |\n|---|---|\n| 1 | 2 |")).toContain("<td")
	})

	it("code clôturé : contenu verbatim, <b> en texte", () => {
		const html = rendu("```ts\nconst a = <b>x</b>\n# pas titre\n```")
		expect(html).toContain("&lt;b&gt;")
		expect(html).not.toContain("<b>")
		expect(html).toContain("# pas titre")
	})

	it("gras, italique, code inline", () => {
		const html = rendu("**g** et *it* et _it2_ et `c`")
		expect(html).toContain("<strong>g</strong>")
		expect(html).toContain("<em>it</em>")
		expect(html).toContain("<em>it2</em>")
		expect(html).toContain("<code")
	})

	it("lien http ⇒ <a", () => {
		const html = rendu("[x](https://a.b/c)")
		expect(html).toContain("<a")
		expect(html).toContain('rel="noopener noreferrer"')
	})

	it("lien javascript: ⇒ pas de <a", () => {
		const html = rendu("[x](javascript:alert(1))")
		expect(html).not.toContain("<a")
		expect(html).not.toContain("javascript")
	})

	it("wikilink et alias", () => {
		expect(rendu("voir [[T001]]")).toContain("T001</span>")
		const html = rendu("voir [[T001|alias]]")
		expect(html).toContain("alias</span>")
		expect(html).not.toContain("T001")
	})

	it("<script> hors code échappé", () => {
		const html = rendu("avant <script>alert(1)</script> après")
		expect(html).not.toContain("<script>")
		expect(html).toContain("&lt;script&gt;")
	})

	it("citation et règle", () => {
		const html = rendu("> cité\n> suite\n\n---\n\n***")
		expect(html).toContain("<blockquote")
		expect(html).toContain("cité suite")
		expect(html.match(/<hr/g)).toHaveLength(2)
	})

	it("règle ≠ liste ; frontmatter hors périmètre", () => {
		expect(parseMarkdown("***")).toEqual([{ k: "rule" }])
		expect(parseMarkdown("")).toEqual([])
	})

	it("tableau : wrapper défilant et en-tête collant", () => {
		const html = rendu("| a | b |\n|---|---|\n| 1 | 2 |")
		expect(html).toContain("max-h-[60vh] overflow-auto")
		expect(html).toContain("sticky top-0")
		expect(html).toContain("z-20")
	})

	it("tableau clos par une puce, même contenant |", () => {
		const blocs = parseMarkdown(
			"| a | b |\n|---|---|\n| 1 | 2 |\n- reste = x | y",
		)
		expect(blocs.map((b) => b.k)).toEqual(["table", "list"])
		if (blocs[0].k !== "table") throw new Error("tableau attendu")
		expect(blocs[0].lignes).toHaveLength(1)
	})

	it("Modal lg ⇒ max-w-[90rem], md ⇒ max-w-3xl", () => {
		const modal = (size?: "md" | "lg") =>
			renderToStaticMarkup(
				createElement(Modal, {
					open: false,
					onClose: () => {},
					title: "t",
					size,
					// biome-ignore lint/correctness/noChildrenProp: .ts sans JSX, children requis par le type
					children: null,
				}),
			)
		expect(modal("lg")).toContain("max-w-[90rem]")
		expect(modal("lg")).toContain("open:flex")
		expect(modal("lg")).not.toMatch(/class="[^"]*(?:^|[ "])flex[ "]/)
		expect(modal()).toContain("max-w-3xl")
	})

	it("extrait réel du cahier syndical", () => {
		const doc = [
			"## Options",
			"| option | Δ tokens chef | tokens ajoutés | sauts | risques | latence |",
			"|---|---|---|---|---|---|",
			"| A statu quo + passation à 150k | −77 % (tout, 74 passations) | 3×reprise | +0 | décision non écrite | 0 |",
			"- ∅ option où une secrétaire bat A ou D, même en borne optimiste (35 % < 69-84 %)",
		].join("\n")
		const blocs = parseMarkdown(doc)
		expect(blocs.map((b) => b.k)).toEqual(["heading", "table", "list"])
		const html = rendu(doc)
		expect(html).toContain("Δ tokens chef")
		expect(html).toContain("−77 % (tout, 74 passations)")
		expect(html).toContain("∅ option")
	})
})

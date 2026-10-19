// Markdown → arbre de blocs ; pur, aucun HTML n'est interprété
export type Inline =
	| { k: "text"; v: string }
	| { k: "strong" | "em" | "code" | "wiki"; v: string }
	| { k: "link"; v: string; href: string }

export type Item = { c: Inline[]; coche: boolean | null; enfants: Bloc[] }

export type Bloc =
	| { k: "heading"; niveau: number; c: Inline[] }
	| { k: "para"; c: Inline[] }
	| { k: "list"; ordonnee: boolean; items: Item[] }
	| { k: "table"; tete: Inline[][]; lignes: Inline[][][] }
	| { k: "code"; v: string }
	| { k: "quote"; c: Inline[] }
	| { k: "rule" }

const INLINE =
	/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]|\[([^\]]+)\]\(([^)\s]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*|(?<!\w)_([^_]+)_(?!\w)/g
const FENCE = /^\s*```/
const TITRE = /^(#{1,6})\s+(.*?)\s*#*\s*$/
const REGLE = /^\s*([-*])(\s*\1){2,}\s*$/
const ITEM = /^(\s*)([-*]|\d+\.)\s+(.*)$/
const SEP = /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/
const CASE = /^\[([ xX])\]\s+(.*)$/

export function parseInline(texte: string): Inline[] {
	const out: Inline[] = []
	let fin = 0
	const texteBrut = (jusque: number) => {
		if (jusque > fin) out.push({ k: "text", v: texte.slice(fin, jusque) })
	}
	for (const m of texte.matchAll(INLINE)) {
		texteBrut(m.index)
		if (m[1] !== undefined) out.push({ k: "wiki", v: m[2] ?? m[1] })
		else if (m[3] !== undefined) out.push({ k: "link", v: m[3], href: m[4] })
		else if (m[5] !== undefined) out.push({ k: "code", v: m[5] })
		else if (m[6] !== undefined) out.push({ k: "strong", v: m[6] })
		else out.push({ k: "em", v: m[7] ?? m[8] })
		fin = m.index + m[0].length
	}
	texteBrut(texte.length)
	return out
}

const cellules = (ligne: string) =>
	ligne
		.trim()
		.replace(/^\|/, "")
		.replace(/\|$/, "")
		.split("|")
		.map((c) => parseInline(c.trim()))

const indent = (ligne: string) => (ITEM.exec(ligne)?.[1] ?? "").length

// Liste à partir de `i` : items à l'indentation de base, plus profond ⇒ enfants du dernier item
function liste(lignes: string[], debut: number): [Bloc, number] {
	const base = indent(lignes[debut])
	const items: Item[] = []
	const ordonnee = /\d/.test(ITEM.exec(lignes[debut])?.[2] ?? "")
	let i = debut
	while (i < lignes.length) {
		const m = ITEM.exec(lignes[i])
		if (!m || REGLE.test(lignes[i]) || m[1].length < base) break
		if (m[1].length > base && items.length > 0) {
			const [sous, suite] = liste(lignes, i)
			items[items.length - 1].enfants.push(sous)
			i = suite
			continue
		}
		const cas = CASE.exec(m[3])
		items.push({
			c: parseInline(cas ? cas[2] : m[3]),
			coche: cas ? cas[1] !== " " : null,
			enfants: [],
		})
		i++
	}
	return [{ k: "list", ordonnee, items }, i]
}

const debutBloc = (l: string, suivante?: string) =>
	FENCE.test(l) ||
	TITRE.test(l) ||
	REGLE.test(l) ||
	ITEM.test(l) ||
	l.trimStart().startsWith(">") ||
	(l.includes("|") && suivante !== undefined && SEP.test(suivante))

export function parseMarkdown(texte: string): Bloc[] {
	const lignes = texte.replace(/\r\n?/g, "\n").replace(/\t/g, "  ").split("\n")
	const blocs: Bloc[] = []
	let i = 0
	while (i < lignes.length) {
		const l = lignes[i]
		const titre = TITRE.exec(l)
		if (l.trim() === "") i++
		else if (FENCE.test(l)) {
			const code: string[] = []
			for (i++; i < lignes.length && !FENCE.test(lignes[i]); i++)
				code.push(lignes[i])
			blocs.push({ k: "code", v: code.join("\n") })
			i++
		} else if (titre) {
			blocs.push({
				k: "heading",
				niveau: titre[1].length,
				c: parseInline(titre[2]),
			})
			i++
		} else if (REGLE.test(l)) {
			blocs.push({ k: "rule" })
			i++
		} else if (l.includes("|") && SEP.test(lignes[i + 1] ?? "x")) {
			const lignesTable: Inline[][][] = []
			for (
				i += 2;
				i < lignes.length &&
				lignes[i].includes("|") &&
				!ITEM.test(lignes[i]) &&
				!TITRE.test(lignes[i]);
				i++
			)
				lignesTable.push(cellules(lignes[i]))
			blocs.push({ k: "table", tete: cellules(l), lignes: lignesTable })
		} else if (l.trimStart().startsWith(">")) {
			const cite: string[] = []
			for (; i < lignes.length && lignes[i].trimStart().startsWith(">"); i++)
				cite.push(lignes[i].trimStart().replace(/^>\s?/, ""))
			blocs.push({ k: "quote", c: parseInline(cite.join(" ")) })
		} else if (ITEM.test(l)) {
			const [bloc, suite] = liste(lignes, i)
			blocs.push(bloc)
			i = suite
		} else {
			const para = [l.trim()]
			for (
				i++;
				i < lignes.length &&
				lignes[i].trim() !== "" &&
				!debutBloc(lignes[i], lignes[i + 1]);
				i++
			)
				para.push(lignes[i].trim())
			blocs.push({ k: "para", c: parseInline(para.join(" ")) })
		}
	}
	return blocs
}

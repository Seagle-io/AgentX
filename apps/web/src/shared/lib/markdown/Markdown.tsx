import type { ReactNode } from "react"
import {
	type Bloc,
	type Inline,
	type Item,
	parseMarkdown,
} from "@/shared/lib/markdown/parse"
import { cn } from "@/shared/lib/utils"
import Text from "@/shared/ui/text"

const HTTP = /^https?:\/\//i

// Éléments React seulement : React échappe tout, lien non http(s) ⇒ texte
function inline(c: Inline[]): ReactNode[] {
	return c.map((n, i) => {
		const cle = `${i}-${n.k}`
		if (n.k === "text") return n.v
		if (n.k === "strong") return <strong key={cle}>{n.v}</strong>
		if (n.k === "em") return <em key={cle}>{n.v}</em>
		if (n.k === "code")
			return (
				<Text key={cle} variant="mono" as="code">
					{n.v}
				</Text>
			)
		if (n.k === "wiki")
			return (
				<Text key={cle} variant="mono" as="span">
					{n.v}
				</Text>
			)
		if (n.k !== "link" || !HTTP.test(n.href)) return n.v
		return (
			<a
				key={cle}
				className="underline"
				href={n.href}
				target="_blank"
				rel="noopener noreferrer"
			>
				{n.v}
			</a>
		)
	})
}

const titres = { 1: "h1", 2: "h2" } as const

function item(it: Item, i: number): ReactNode {
	return (
		<li key={i}>
			{it.coche !== null && (it.coche ? "☑ " : "☐ ")}
			{inline(it.c)}
			{it.enfants.map(bloc)}
		</li>
	)
}

function bloc(b: Bloc, i: number): ReactNode {
	switch (b.k) {
		case "heading":
			return (
				<Text key={i} variant={titres[b.niveau as 1 | 2] ?? "h3"}>
					{inline(b.c)}
				</Text>
			)
		case "para":
			return <Text key={i}>{inline(b.c)}</Text>
		case "list": {
			const Balise = b.ordonnee ? "ol" : "ul"
			return (
				<Balise
					key={i}
					className={cn(
						"text-sm text-text pl-5",
						b.ordonnee ? "list-decimal" : "list-disc",
					)}
				>
					{b.items.map(item)}
				</Balise>
			)
		}
		case "table": {
			const cell = "border border-border-subtle px-2 py-1 text-left align-top"
			return (
				<div key={i} className="max-h-[60vh] overflow-auto">
					<table className="min-w-full border-collapse text-sm">
						<thead>
							<tr>
								{b.tete.map((c, j) => (
									<th
										// biome-ignore lint/suspicious/noArrayIndexKey: arbre statique, jamais réordonné
										key={`h${j}`}
										className={cn(
											cell,
											"sticky top-0 z-10 bg-surface",
											j === 0 && "left-0 z-20",
										)}
									>
										{inline(c)}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{b.lignes.map((l, j) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: arbre statique, jamais réordonné
								<tr key={`r${j}`}>
									{l.map((c, k) => (
										<td
											// biome-ignore lint/suspicious/noArrayIndexKey: arbre statique, jamais réordonné
											key={`c${k}`}
											// 1re colonne collée : le libellé de ligne reste visible au défilement x
											className={cn(
												cell,
												k === 0 && "sticky left-0 bg-surface",
											)}
										>
											{inline(c)}
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)
		}
		case "code":
			return (
				<pre
					key={i}
					className="overflow-x-auto rounded-control bg-bg p-3 font-mono text-xs"
				>
					{b.v}
				</pre>
			)
		case "quote":
			return (
				<blockquote
					key={i}
					className="border-l-2 border-border-subtle pl-3 text-text-muted"
				>
					{inline(b.c)}
				</blockquote>
			)
		case "rule":
			return <hr key={i} className="border-border-subtle" />
	}
}

export default function Markdown({
	texte,
	className,
}: {
	texte: string
	className?: string
}) {
	return (
		<div className={cn("flex flex-col gap-3", className)}>
			{parseMarkdown(texte).map(bloc)}
		</div>
	)
}

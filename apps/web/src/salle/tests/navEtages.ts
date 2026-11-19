import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { MemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"
import { stateKey } from "@/api/state/crud"
import { stateFixture } from "@/api/state/fixture"
import { type SalleState, SalleStateSchema } from "@/api/state/schema"
import NavEtages from "@/salle/component/NavEtages"
import "@/shared/lib/i18n/i18n"

const base = SalleStateSchema.parse(stateFixture)
const etage = (
	slug: string,
	num: number,
	compteurs: Record<string, number>,
) => ({
	...base.immeuble.etages[0],
	slug,
	num,
	titre: `Titre ${slug}`,
	compteurs,
})

const rendu = (etat: SalleState) => {
	const qc = new QueryClient()
	qc.setQueryData(stateKey(null), etat)
	return renderToStaticMarkup(
		createElement(
			QueryClientProvider,
			{ client: qc },
			createElement(MemoryRouter, null, createElement(NavEtages)),
		),
	)
}

describe("NavEtages", () => {
	const s = {
		...base,
		immeuble: {
			...base.immeuble,
			etages: [etage("a", 1, { bloque: 2 }), etage("b", 2, {})],
			sous_sol: [],
		},
		todo: [
			{ ...base.todo[0], etiquette: "VOTRE CHOIX", etage: "b", projet: "b" },
		],
	} as SalleState

	it("testid, lignes ≥ 44 px, tri décroissant", () => {
		const html = rendu(s)
		expect(html).toContain('data-testid="nav-etages"')
		expect(html).toContain("min-h-11")
		expect(html.indexOf("Titre b")).toBeLessThan(html.indexOf("Titre a"))
	})

	it("bloque ⇒ cadre error ; choix ⇒ cadre warning", () => {
		const html = rendu(s)
		expect(html).toContain("border-error")
		expect(html).toContain("border-warning")
	})

	it("pied : toutes les décisions, sous-sol", () => {
		const html = rendu(s)
		expect(html).toContain("Toutes les décisions")
		expect(html).toContain("Sous-sol · 0")
	})
})

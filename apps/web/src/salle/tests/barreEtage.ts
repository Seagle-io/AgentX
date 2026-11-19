import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { stateKey } from "@/api/state/crud"
import { stateFixture } from "@/api/state/fixture"
import { type SalleState, SalleStateSchema } from "@/api/state/schema"
import { BarreEtage } from "@/salle/component/BarreEtage"
import "@/shared/lib/i18n/i18n"

const base = SalleStateSchema.parse(stateFixture)
const effectif = {
	postes: { eclaireur: 4 } as Record<string, number>,
	total: 4,
	plafond_role: 4,
	plafond_etage: 18,
	erreur: "",
}

const avec = (eff: boolean): SalleState => ({
	...base,
	immeuble: {
		...base.immeuble,
		etages: base.immeuble.etages.map((e) =>
			e.slug === "salle-v2"
				? { ...e, branche: "main", effectif: eff ? effectif : undefined }
				: e,
		),
	},
})

const rendu = (etat: SalleState, slug: string) => {
	const qc = new QueryClient()
	qc.setQueryData(stateKey(slug), etat)
	return renderToStaticMarkup(
		createElement(
			QueryClientProvider,
			{ client: qc },
			createElement(BarreEtage, { slug }),
		),
	)
}

describe("BarreEtage", () => {
	it("titre, branche, terminal", () => {
		const html = rendu(avec(true), "salle-v2")
		expect(html).toContain('data-testid="barre-etage"')
		expect(html).toContain("É3 · Salle des agents v2")
		expect(html).toContain("⎇ main")
		expect(html).toContain("Terminal du chef")
	})

	it("effectif-ouvrir présent si effectif", () => {
		expect(rendu(avec(true), "salle-v2")).toContain(
			'data-testid="effectif-ouvrir"',
		)
	})

	it("sans effectif : pas de bouton", () => {
		expect(rendu(avec(false), "salle-v2")).not.toContain("effectif-ouvrir")
	})
})

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { stateKey } from "@/api/state/crud"
import { stateFixture } from "@/api/state/fixture"
import { type SalleState, SalleStateSchema } from "@/api/state/schema"
import EffectifPanel from "@/salle/component/EffectifPanel"
import "@/shared/lib/i18n/i18n"

const base = SalleStateSchema.parse(stateFixture)
const effectif = {
	postes: { eclaireur: 4 } as Record<string, number>,
	total: 4,
	plafond_role: 4,
	plafond_etage: 18,
	erreur: "",
}

// injecte `effectif` dans l'étage sélectionné
const avec = (eff: Partial<typeof effectif>): SalleState => ({
	...base,
	immeuble: base.immeuble && {
		...base.immeuble,
		etages: base.immeuble.etages.map((e) =>
			e.selection ? { ...e, effectif: { ...effectif, ...eff } } : e,
		),
	},
})

const rendu = (etat: SalleState) => {
	const qc = new QueryClient()
	qc.setQueryData(stateKey(null), etat)
	return renderToStaticMarkup(
		createElement(
			QueryClientProvider,
			{ client: qc },
			createElement(EffectifPanel),
		),
	)
}

// balise ouvrante du bouton portant ce testid
const bouton = (html: string, id: string) =>
	html.match(new RegExp(`<button[^>]*data-testid="${id}"[^>]*>`))?.[0] ?? ""

describe("EffectifPanel", () => {
	it("rôles affectables seuls, chef absent", () => {
		const html = rendu(avec({}))
		expect(html).toContain('data-testid="effectif-role-eclaireur"')
		expect(html).not.toContain('data-testid="effectif-role-chef"')
	})

	it("sans effectif : rien", () => {
		expect(rendu(base)).not.toContain("effectif-panel")
	})

	it("occ/n affiché", () => {
		const html = rendu(avec({}))
		expect(html).toMatch(/data-testid="effectif-n-eclaireur"[^>]*>0\/4</)
	})

	it("+ désactivé à plafond_role", () => {
		const html = rendu(avec({}))
		expect(bouton(html, "effectif-plus-eclaireur")).toContain('disabled=""')
		expect(bouton(html, "effectif-moins-eclaireur")).not.toContain(
			'disabled=""',
		)
	})

	it("− désactivé à n=0, + actif", () => {
		const html = rendu(avec({ postes: {}, total: 0 }))
		expect(bouton(html, "effectif-moins-eclaireur")).toContain('disabled=""')
		expect(bouton(html, "effectif-plus-eclaireur")).not.toContain('disabled=""')
	})

	it("erreur : bandeau et boutons désactivés", () => {
		const html = rendu(avec({ postes: {}, total: 0, erreur: "illisible" }))
		expect(html).toContain('data-testid="effectif-erreur"')
		expect(bouton(html, "effectif-plus-eclaireur")).toContain('disabled=""')
		expect(bouton(html, "effectif-moins-eclaireur")).toContain('disabled=""')
	})

	it("erreur : bandeau préfixé « Effectif indisponible »", () => {
		const html = rendu(avec({ postes: {}, total: 0, erreur: "illisible" }))
		expect(html).toContain("Effectif indisponible")
		expect(html).toContain("illisible")
	})
})

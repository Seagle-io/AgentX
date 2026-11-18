import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { stateKey } from "@/api/state/crud"
import { stateFixture } from "@/api/state/fixture"
import { type SalleState, SalleStateSchema } from "@/api/state/schema"
import SalleHeader from "@/salle/component/SalleHeader"
import "@/shared/lib/i18n/i18n"

const base = SalleStateSchema.parse(stateFixture)
const vault_maj = {
	iso: "2026-11-03T18:13:05",
	age_s: 180,
	chemin: "projets/x/decisions.md",
}

const rendu = (etat: SalleState) => {
	const qc = new QueryClient()
	qc.setQueryData(stateKey(null), etat)
	return renderToStaticMarkup(
		createElement(
			QueryClientProvider,
			{ client: qc },
			createElement(SalleHeader),
		),
	)
}

describe("SalleHeader", () => {
	it("vault_maj présent : testid et âge", () => {
		const html = rendu({ ...base, vault_maj })
		expect(html).toContain('data-testid="vault-maj"')
		expect(html).toContain("il y a 3 min")
		expect(html).toContain("projets/x/decisions.md")
	})

	it("vault_maj null : rien", () => {
		expect(rendu({ ...base, vault_maj: null })).not.toContain("vault-maj")
	})

	it("vault_synchro 180 s : âge", () => {
		const html = rendu({
			...base,
			vault_synchro: { iso: "2026-11-03T18:13:05", age_s: 180, client: true },
		})
		expect(html).toContain("synchro · il y a 3 min")
	})

	it("vault_synchro client faux : arrêtée", () => {
		const html = rendu({
			...base,
			vault_synchro: { iso: "2026-11-03T18:13:05", age_s: 180, client: false },
		})
		expect(html).toContain("synchro arrêtée")
	})
})

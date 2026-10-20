import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { stateKey } from "@/api/state/crud"
import { stateFixture } from "@/api/state/fixture"
import { type Compte, SalleStateSchema } from "@/api/state/schema"
import GestionComptes from "@/salle/component/GestionComptes"
import "@/shared/lib/i18n/i18n"

const base = SalleStateSchema.parse(stateFixture)
const compte = (nom: string, connecte: boolean): Compte => ({
	nom,
	dossier: `/c/${nom}`,
	connecte,
	login: `claude auth login ${nom}`,
})

const rendu = (comptes: Compte[], jeton: string | null = "jeton") => {
	const qc = new QueryClient()
	qc.setQueryData(stateKey(null), {
		...base,
		jeton,
		immeuble: {
			...base.immeuble,
			comptes,
			motifs: {
				cle: "[a-z0-9][a-z0-9-]{0,23}",
				compte: "[a-z0-9][a-z0-9-]{0,23}",
			},
		},
	})
	return renderToStaticMarkup(
		createElement(
			QueryClientProvider,
			{ client: qc },
			createElement(GestionComptes, { onFermer: () => {} }),
		),
	)
}

describe("GestionComptes", () => {
	it("compte connecté ⇒ « sylvain ✓ »", () => {
		expect(rendu([compte("sylvain", true)])).toContain("sylvain ✓")
	})
	it("compte déconnecté ⇒ bouton Connecter", () => {
		const html = rendu([compte("perso", false)])
		expect(html).toContain("perso")
		expect(html).toMatch(/<button[^>]*>Connecter<\/button>/)
	})
	it("compte connecté ⇒ 0 bouton Connecter", () => {
		expect(rendu([compte("sylvain", true)])).not.toContain(">Connecter<")
	})
	it("nom vide ⇒ Ajouter et connecter disabled avec title", () => {
		const bouton = rendu([compte("sylvain", true)]).match(
			/<button[^>]*>Ajouter et connecter<\/button>/,
		)?.[0]
		expect(bouton).toContain("disabled")
		expect(bouton).toMatch(/title="[^"]+"/)
	})
	it("jeton absent ⇒ Connecter disabled", () => {
		const bouton = rendu([compte("perso", false)], null).match(
			/<button[^>]*>Connecter<\/button>/,
		)?.[0]
		expect(bouton).toContain("disabled")
	})
	it("0 <select", () => {
		expect(rendu([compte("a", true), compte("b", false)])).not.toContain(
			"<select",
		)
	})
})

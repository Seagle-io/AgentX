import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { stateKey } from "@/api/state/crud"
import { stateFixture } from "@/api/state/fixture"
import { SalleStateSchema } from "@/api/state/schema"
import ConnexionCompte from "@/console/component/ConnexionCompte"
import "@/shared/lib/i18n/i18n"

// interactions (Envoyer, fin ⇒ etat, Annuler) : 0 jsdom, couvert par T195 Playwright
const rendu = () => {
	const qc = new QueryClient()
	qc.setQueryData(stateKey(null), SalleStateSchema.parse(stateFixture))
	return renderToStaticMarkup(
		createElement(
			QueryClientProvider,
			{ client: qc },
			createElement(ConnexionCompte, {
				compte: "perso",
				onFin: () => {},
				onFermer: () => {},
			}),
		),
	)
}

describe("ConnexionCompte", () => {
	it("état initial ⇒ testid connexion-compte", () => {
		expect(rendu()).toContain('data-testid="connexion-compte"')
	})
	it("sans URL ⇒ « En attente de l'URL… »", () => {
		expect(rendu()).toContain("En attente de l&#x27;URL…")
	})
	it("bouton « Annuler » rendu, Envoyer disabled (code vide)", () => {
		const html = rendu()
		expect(html).toContain("Annuler")
		expect(html.match(/<button[^>]*>Envoyer<\/button>/)?.[0]).toContain(
			"disabled",
		)
	})
})

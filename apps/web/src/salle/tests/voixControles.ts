import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { stateKey } from "@/api/state/crud"
import { stateFixture } from "@/api/state/fixture"
import { type SalleState, SalleStateSchema } from "@/api/state/schema"
import VoixControles from "@/salle/component/VoixControles"
import "@/shared/lib/i18n/i18n"

const base = SalleStateSchema.parse(stateFixture)
const voix = {
	mode: true,
	parle: true,
	en_cours: false,
	dictee: true,
	ecoute: false,
	passation_auto: false,
	journal: [],
}

const rendu = (etat: SalleState) => {
	const qc = new QueryClient()
	qc.setQueryData(stateKey(null), etat)
	return renderToStaticMarkup(
		createElement(
			QueryClientProvider,
			{ client: qc },
			createElement(VoixControles),
		),
	)
}

// balise ouvrante du bouton portant ce testid
const bouton = (html: string, id: string) =>
	html.match(new RegExp(`<button[^>]*data-testid="${id}"[^>]*>`))?.[0] ?? ""

describe("VoixControles", () => {
	it("voix null : rien", () => {
		expect(rendu({ ...base, voix: null })).not.toContain("voix-controles")
	})

	it("mode true : 🔊 et aria-pressed true", () => {
		const html = rendu({ ...base, voix })
		expect(html).toContain("🔊")
		expect(bouton(html, "voix-mode")).toContain('aria-pressed="true"')
	})

	it("parle false : mode et stop disabled", () => {
		const html = rendu({ ...base, voix: { ...voix, parle: false } })
		expect(bouton(html, "voix-mode")).toContain('disabled=""')
		expect(bouton(html, "voix-stop")).toContain('disabled=""')
	})

	it("dictee false : micro disabled, title sansDictee", () => {
		const html = rendu({ ...base, voix: { ...voix, dictee: false } })
		const micro = bouton(html, "voix-micro")
		expect(micro).toContain('disabled=""')
		expect(micro).toContain("dictee n&#x27;est pas lancé")
	})

	it("tout lancé : 3 boutons actifs", () => {
		const html = rendu({ ...base, voix })
		expect(html).not.toContain('disabled=""')
	})
})

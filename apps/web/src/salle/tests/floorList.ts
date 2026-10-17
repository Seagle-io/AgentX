import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { stateKey } from "@/api/state/crud"
import { stateFixture } from "@/api/state/fixture"
import { SalleStateSchema } from "@/api/state/schema"
import FloorList from "@/salle/component/FloorList"
import "@/shared/lib/i18n/i18n"

const etat = SalleStateSchema.parse(stateFixture)

const rendu = (compact: boolean) => {
	const qc = new QueryClient()
	// rendu serveur : zustand lit l'état initial (selectedFloor null) ⇒ clé défaut
	qc.setQueryData(stateKey(null), etat)
	return renderToStaticMarkup(
		createElement(
			QueryClientProvider,
			{ client: qc },
			createElement(FloorList, { onSelect: () => undefined, compact }),
		),
	)
}

describe("FloorList", () => {
	it("ligne chef en tête : session, à faire, urgent", () => {
		const html = rendu(false)
		expect(html).toContain("Chef")
		expect(html).toContain("en session")
		expect(html).toContain("À faire 68")
		expect(html.indexOf("Chef")).toBeLessThan(html.indexOf("É4"))
	})

	it("sous-sol replié : 1 bouton, titres cachés", () => {
		const html = rendu(false)
		expect(html).toContain('aria-expanded="false"')
		expect(html).toContain("▸ SOUS-SOL · 2")
		expect(html).not.toContain("Module Compta")
	})

	it("compact : ni todo, ni chef, ni sous-sol, courant marqué", () => {
		const html = rendu(true)
		expect(html).not.toContain("todo ")
		expect(html).not.toContain("Chef")
		expect(html).not.toContain("SOUS-SOL")
		expect(html).toContain('aria-current="true"')
	})
})

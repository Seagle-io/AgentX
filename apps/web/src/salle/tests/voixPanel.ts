import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { stateKey } from "@/api/state/crud"
import { stateFixture } from "@/api/state/fixture"
import { type SalleState, SalleStateSchema } from "@/api/state/schema"
import VoixPanel from "@/salle/component/VoixPanel"
import "@/shared/lib/i18n/i18n"

const base = SalleStateSchema.parse(stateFixture)
const voix = {
	mode: true,
	parle: false,
	en_cours: false,
	dictee: false,
	ecoute: false,
	passation_auto: false,
	journal: [
		{ t: "2026-10-16T01:06:51", texte: "premier" },
		{ t: "2026-10-16T01:07:02", texte: "second" },
	],
}

const rendu = (etat: SalleState) => {
	const qc = new QueryClient()
	qc.setQueryData(stateKey(null), etat)
	return renderToStaticMarkup(
		createElement(
			QueryClientProvider,
			{ client: qc },
			createElement(VoixPanel),
		),
	)
}

const bouton = (html: string, id: string) =>
	html.match(new RegExp(`<button[^>]*data-testid="${id}"[^>]*>`))?.[0]

describe("VoixPanel", () => {
	it("journal 2 entrées : 2 li, plus récent en tête, bouton actif", () => {
		const html = rendu({ ...base, voix: { ...voix, dictee: true } })
		expect(html).toContain('data-testid="voix-panel"')
		expect(html.match(/<li/g)).toHaveLength(2)
		expect(html.indexOf("second")).toBeLessThan(html.indexOf("premier"))
		expect(html).toContain("01:07")
		expect(html).not.toContain('disabled=""')
	})

	it("entrée d'un autre jour : préfixe jj/mm", () => {
		const html = rendu({ ...base, voix })
		expect(html).toContain("16/10 01:07")
	})

	it("entrée du jour (date locale) : pas de préfixe", () => {
		const d = new Date()
		const p = (n: number) => String(n).padStart(2, "0")
		const jour = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
		const html = rendu({
			...base,
			voix: {
				...voix,
				journal: [{ t: `${jour}T01:07:02`, texte: "aujourdhui" }],
			},
		})
		expect(html).toContain("01:07")
		expect(html).not.toContain(`${p(d.getDate())}/${p(d.getMonth() + 1)} 01:07`)
	})

	it("colonne heure : largeur fixe seulement hors du jour", () => {
		const d = new Date()
		const p = (n: number) => String(n).padStart(2, "0")
		const jour = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
		const du = (t: string) =>
			rendu({ ...base, voix: { ...voix, journal: [{ t, texte: "x" }] } })
		expect(du(`${jour}T01:07:02`)).not.toContain("w-[5.25rem]")
		expect(du("2026-10-16T01:07:02")).toContain("w-[5.25rem]")
	})

	it("voix null : rien", () => {
		expect(rendu({ ...base, voix: null })).toBe("")
	})

	it("journal vide : panneau visible, message, bouton disabled", () => {
		const html = rendu({ ...base, voix: { ...voix, journal: [] } })
		expect(html).toContain('data-testid="voix-panel"')
		expect(html).toContain("Aucun message")
		expect(html).toContain('disabled=""')
	})

	it("son actif : aria-pressed false, libellé Son activé", () => {
		const html = rendu({ ...base, voix })
		expect(bouton(html, "voix-son")).toContain('aria-pressed="false"')
		expect(html).toContain("Son activé")
	})

	it("son muet : aria-pressed true, libellé Son coupé", () => {
		const html = rendu({ ...base, voix: { ...voix, mode: false } })
		expect(bouton(html, "voix-son")).toContain('aria-pressed="true"')
		expect(html).toContain("Son coupé")
	})

	it("micro dictée absente : disabled et title", () => {
		const html = rendu({ ...base, voix })
		const micro = bouton(html, "voix-micro")
		expect(micro).toContain('disabled=""')
		expect(micro).toContain('title="Dictée non lancée"')
		expect(html).toContain("Micro coupé")
	})

	it("micro écoute : aria-pressed true, libellé Micro activé", () => {
		const html = rendu({
			...base,
			voix: { ...voix, dictee: true, ecoute: true },
		})
		const micro = bouton(html, "voix-micro")
		expect(micro).toContain('aria-pressed="true"')
		expect(micro).not.toContain('disabled=""')
		expect(html).toContain("Micro activé")
	})

	it("journal vide : boutons son et micro visibles", () => {
		const html = rendu({ ...base, voix: { ...voix, journal: [] } })
		expect(html).toContain('data-testid="voix-son"')
		expect(html).toContain('data-testid="voix-micro"')
	})
})

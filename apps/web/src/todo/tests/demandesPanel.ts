import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { stateKey } from "@/api/state/crud"
import { stateFixture } from "@/api/state/fixture"
import { SalleStateSchema } from "@/api/state/schema"
import i18n from "@/shared/lib/i18n/i18n"
import DemandesPanel, { DemandeLigne } from "@/todo/component/DemandesPanel"
import { courtDemande, selectDemandes } from "@/todo/script/demandes"

const etat = SalleStateSchema.parse(stateFixture)
const demande = (texte: string) => ({
	id: "D001",
	t: "2026-10-20T09:30:24",
	texte,
	taches: [],
})

const rendu = (demandes: ReturnType<typeof demande>[]) => {
	const qc = new QueryClient()
	qc.setQueryData(stateKey(null), {
		...etat,
		demandes,
		demandes_total: demandes.length,
	})
	return renderToStaticMarkup(
		createElement(
			QueryClientProvider,
			{ client: qc },
			createElement(DemandesPanel),
		),
	)
}

const ligne = (texte: string) =>
	renderToStaticMarkup(
		createElement(DemandeLigne, {
			demande: demande(texte),
			pending: false,
			onFermer: () => {},
		}),
	)

const desactive = (html: string, id: string) =>
	new RegExp(
		`<button[^>]*disabled=""[^>]*data-testid="${id}"|<button[^>]*data-testid="${id}"[^>]*disabled=""`,
	).test(html)

describe("DemandesPanel", () => {
	it("0 demande : rien", () => {
		expect(rendu([])).toBe("")
	})
	it("texte 250 : tronqué, title complet", () => {
		const texte = "a".repeat(250)
		const html = ligne(texte)
		expect(html).toContain(`title="${texte}"`)
		expect(html).toContain(`${"a".repeat(119)}…`)
	})
	it("Fermer actif", () => {
		expect(desactive(ligne("x"), "demande-fermer")).toBe(false)
	})
	it("hint absent du rendu, testids présents", () => {
		const html = rendu([demande("x")])
		expect(html).not.toContain(i18n.t("todo:demandes.hint"))
		for (const id of ["demandes-panel", "demande-fermer"])
			expect(html).toContain(`data-testid="${id}"`)
	})
	it("0 select, 0 lier", () => {
		const html = rendu([demande("x")])
		expect(html).not.toContain("<select")
		expect(html).not.toContain("demande-lier")
	})
	it("ligne : id · heure puis texte", () => {
		const html = ligne("bonjour")
		expect(html.indexOf("D001 · 09:30")).toBeGreaterThan(-1)
		expect(html.indexOf("D001 · 09:30")).toBeLessThan(html.indexOf("bonjour"))
	})
	it("erreur vide : « erreur inconnue »", () => {
		const html = renderToStaticMarkup(
			createElement(DemandeLigne, {
				demande: demande("x"),
				pending: false,
				onFermer: () => {},
				erreur: "",
			}),
		)
		expect(html).toContain("erreur inconnue")
	})
	it("state sans demandes : []", () => {
		const sans = Object.fromEntries(
			Object.entries(etat).filter(([k]) => !k.startsWith("demandes")),
		)
		const s = SalleStateSchema.parse(sans)
		expect(selectDemandes(s)).toEqual({ items: [], total: 0 })
	})
	it("courtDemande : 120 inchangé, 121 ⇒ 120", () => {
		expect(courtDemande("a".repeat(120))).toBe("a".repeat(120))
		expect(courtDemande("a".repeat(121))).toBe(`${"a".repeat(119)}…`)
		expect(courtDemande("a\n  b")).toBe("a b")
	})
})

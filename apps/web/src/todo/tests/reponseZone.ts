import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import "@/shared/lib/i18n/i18n"
import { ReponseZone } from "@/todo/component/ReponseZone"

const zone = (texte: string, extra: object = {}) =>
	renderToStaticMarkup(
		createElement(ReponseZone, {
			texte,
			onTexte: () => {},
			onEnvoyer: () => {},
			pending: false,
			message: null,
			...extra,
		}),
	)

const desactive = (html: string, id: string) =>
	new RegExp(
		`<button[^>]*disabled=""[^>]*data-testid="${id}"|<button[^>]*data-testid="${id}"[^>]*disabled=""`,
	).test(html)

describe("ReponseZone", () => {
	it("textarea choix-reponse, raccourci visible", () => {
		const html = zone("")
		expect(html).toContain("<textarea")
		expect(html).toContain('data-testid="choix-reponse"')
		expect(html).toContain("Ctrl+Entrée")
	})
	it("Envoyer désactivé si vide ou pending, actif sinon", () => {
		expect(desactive(zone(""), "choix-envoyer")).toBe(true)
		expect(desactive(zone("oui", { pending: true }), "choix-envoyer")).toBe(
			true,
		)
		expect(desactive(zone("oui"), "choix-envoyer")).toBe(false)
	})
	it("Passer seulement avec onPasser", () => {
		expect(zone("")).not.toContain("question-passer")
		expect(zone("", { onPasser: () => {} })).toContain(
			'data-testid="question-passer"',
		)
	})
	it("message rendu ; rows 4 par défaut", () => {
		expect(zone("", { message: "boum" })).toContain("boum")
		expect(zone("")).toContain('rows="4"')
		expect(zone("", { rows: 2 })).toContain('rows="2"')
	})
})

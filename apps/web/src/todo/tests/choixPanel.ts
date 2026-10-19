import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { stateKey } from "@/api/state/crud"
import { stateFixture } from "@/api/state/fixture"
import { SalleStateSchema } from "@/api/state/schema"
import "@/shared/lib/i18n/i18n"
import ChoixPanel, { ReponseZone } from "@/todo/component/ChoixPanel"
import { messageReponse, sansFrontmatter } from "@/todo/script/reponse"

const etat = SalleStateSchema.parse(stateFixture)

const rendu = (doc: string | null) => {
	const qc = new QueryClient()
	const todo =
		doc === null
			? []
			: [
					{
						prio: 0,
						etiquette: "VOTRE CHOIX",
						titre: "q",
						detail: "",
						cmd: "",
						exe: null,
						projet: "agentx",
						doc,
					},
				]
	qc.setQueryData(stateKey(null), { ...etat, todo })
	return renderToStaticMarkup(
		createElement(
			QueryClientProvider,
			{ client: qc },
			createElement(ChoixPanel),
		),
	)
}

// rendu statique : la fenêtre ne s'ouvre pas au clic, on rend son corps directement
const zone = (texte: string) =>
	renderToStaticMarkup(
		createElement(ReponseZone, {
			texte,
			onTexte: () => {},
			onEnvoyer: () => {},
			pending: false,
			message: null,
		}),
	)

describe("ChoixPanel", () => {
	it("item avec doc : bouton Voir", () => {
		expect(rendu("vault/x.md")).toContain('data-testid="choix-voir"')
	})
	it("item sans doc : pas de bouton", () => {
		expect(rendu("")).not.toContain("choix-voir")
	})
	it("0 choix : rien", () => {
		expect(rendu(null)).toBe("")
	})
	it("item : bouton Répondre, 0 champ avant clic", () => {
		const html = rendu("")
		expect(html).toContain('data-testid="choix-repondre"')
		expect(html).not.toMatch(
			/<button[^>]*disabled=""[^>]*data-testid="choix-repondre"|<button[^>]*data-testid="choix-repondre"[^>]*disabled=""/,
		)
		expect(html).not.toContain("choix-reponse")
	})
	it("fenêtre : zone de texte, Envoyer désactivé si vide", () => {
		const html = zone("")
		expect(html).toContain("<textarea")
		expect(html).toContain('data-testid="choix-reponse"')
		expect(html).toMatch(
			/<button[^>]*disabled=""[^>]*data-testid="choix-envoyer"|<button[^>]*data-testid="choix-envoyer"[^>]*disabled=""/,
		)
	})
	it("fenêtre : saisie « oui » ⇒ Envoyer actif", () => {
		expect(zone("oui")).not.toMatch(
			/<button[^>]*disabled=""[^>]*data-testid="choix-envoyer"|<button[^>]*data-testid="choix-envoyer"[^>]*disabled=""/,
		)
	})
	it("messageReponse : 1 ligne + Entrée", () => {
		expect(messageReponse("q ?", " oui ")).toBe("Réponse à « q ? » : oui")
	})
	it("messageReponse : multiligne aplatie", () => {
		expect(messageReponse("q ?", "ligne1\nligne2\n")).toBe(
			"Réponse à « q ? » : ligne1 / ligne2",
		)
	})
	it("sansFrontmatter : retire l'en-tête", () => {
		expect(sansFrontmatter("---\na: 1\n---\ncorps")).toBe("corps")
	})
	it("sansFrontmatter : sans en-tête, inchangé", () => {
		expect(sansFrontmatter("corps")).toBe("corps")
	})
})

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { MemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"
import { stateKey } from "@/api/state/crud"
import { stateFixture } from "@/api/state/fixture"
import { SalleStateSchema } from "@/api/state/schema"
import "@/shared/lib/i18n/i18n"
import TodoPanel from "@/todo/component/TodoPanel"

const etat = SalleStateSchema.parse(stateFixture)

const rendu = (etiquette: string, doc: string, detail = "") => {
	const qc = new QueryClient()
	const todo = [
		{
			prio: 0,
			etiquette,
			titre: "q",
			detail,
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
			createElement(MemoryRouter, null, createElement(TodoPanel)),
		),
	)
}

describe("TodoPanel", () => {
	it("item CHOIX : carte, zone de réponse, Envoyer désactivé", () => {
		const html = rendu("VOTRE CHOIX", "")
		expect(html).toContain('data-testid="todo-choix"')
		expect(html).toContain('data-testid="choix-reponse"')
		expect(html).toMatch(
			/<button[^>]*disabled=""[^>]*data-testid="choix-envoyer"|<button[^>]*data-testid="choix-envoyer"[^>]*disabled=""/,
		)
		expect(html).not.toContain("choix-voir")
	})
	it("item CHOIX : titre clampé 1 ligne, texte complet au survol", () => {
		const html = rendu("VOTRE CHOIX", "")
		expect(html).toContain("line-clamp-1")
		expect(html).toContain('title="q"')
	})
	it("item CHOIX : le détail générique n'est pas rendu", () => {
		expect(rendu("VOTRE CHOIX", "", "détail-générique")).not.toContain(
			"détail-générique",
		)
	})
	it("item non-CHOIX : rien de tout cela", () => {
		const html = rendu("À FAIRE", "")
		expect(html).not.toContain("todo-choix")
		expect(html).not.toContain("choix-reponse")
		expect(html).not.toContain("choix-envoyer")
	})
	it("item CHOIX avec doc : bouton Voir", () => {
		expect(rendu("VOTRE CHOIX", "vault/x.md")).toContain(
			'data-testid="choix-voir"',
		)
	})
	it("colonne : compte n / total, filtres étage et immeuble", () => {
		const html = rendu("À FAIRE", "")
		expect(html).toContain("<aside")
		expect(html).toContain("À faire")
		expect(html).toContain("étage</button>")
		expect(html).toContain("immeuble</button>")
		expect(html).toMatch(/1<span[^>]*> \/ [0-9]+<\/span>/)
	})
	it("item d'un autre étage : lien vers l'étage", () => {
		expect(rendu("À FAIRE", "")).toContain("Voir l&#x27;étage")
	})
})

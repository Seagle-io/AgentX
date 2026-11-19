import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { MemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"
import { stateKey } from "@/api/state/crud"
import { stateFixture } from "@/api/state/fixture"
import { SalleStateSchema, type TodoItem } from "@/api/state/schema"
import "@/shared/lib/i18n/i18n"
import BoiteDecisions from "@/todo/component/BoiteDecisions"

const base = SalleStateSchema.parse(stateFixture)

const choix = (i: number): TodoItem => ({
	prio: 0,
	etiquette: "VOTRE CHOIX",
	titre: `question ${i}`,
	detail: "",
	cmd: "",
	exe: null,
	projet: i % 2 ? "agentx" : "salle-v2",
	doc: i === 0 ? "vault/x.md" : "",
})

const rendu = (n: number, etage: string | null = null) => {
	const qc = new QueryClient()
	qc.setQueryData(stateKey(etage), {
		...base,
		todo: Array.from({ length: n }, (_, i) => choix(i)),
	})
	return renderToStaticMarkup(
		createElement(
			QueryClientProvider,
			{ client: qc },
			createElement(
				MemoryRouter,
				null,
				createElement(BoiteDecisions, { etage }),
			),
		),
	)
}

const compte = (html: string, motif: string) => html.split(motif).length - 1

describe("BoiteDecisions", () => {
	const html = rendu(37)
	it("37 choix ⇒ 37 cartes, 1 seul textarea", () => {
		expect(compte(html, 'data-testid="todo-choix"')).toBe(37)
		expect(compte(html, "<textarea")).toBe(1)
	})
	it("1re carte aria-expanded=true, 36 fermées", () => {
		expect(compte(html, 'aria-expanded="true"')).toBe(1)
		expect(compte(html, 'aria-expanded="false"')).toBe(36)
	})
	it("Passer, Envoyer : 1 seule fois (carte ouverte)", () => {
		expect(compte(html, 'data-testid="question-passer"')).toBe(1)
		expect(compte(html, 'data-testid="choix-envoyer"')).toBe(1)
	})
	it("méta étage + projet rendue", () => {
		expect(html).toContain("É4 · Outillage AgentX (rôles, salle) · agentx")
	})
	it("chips : Tous + étage, groupe par projet", () => {
		expect(html).toContain("<fieldset")
		expect(html).toContain("Tous 37")
		expect(html).toContain("Outillage AgentX (rôles, salle) · 18")
		expect(html).toContain("agentx · 18")
	})
	it("Voir seulement avec doc", () => {
		expect(compte(html, 'data-testid="choix-voir"')).toBe(1)
	})
	it("filtre étage : aria-pressed sur sa chip", () => {
		expect(rendu(37, "agentx")).toMatch(
			/aria-pressed="true"[^>]*>Outillage AgentX \(rôles, salle\) · 18/,
		)
	})
	it("0 choix ⇒ vide, 0 textarea", () => {
		const v = rendu(0)
		expect(v).toContain("Aucune décision en attente")
		expect(v).not.toContain("<textarea")
	})
})

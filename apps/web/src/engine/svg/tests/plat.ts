import { describe, expect, it } from "vitest"
import {
	immeubleGrand,
	niveauPlat,
	type ServeurPlat,
	salleSousSol,
	sousSolPlat,
} from "@/engine/svg/plat"

const agent = (role: string) => ({ role, couleur: "#ffffff", bloque: false })
const clos = (n: number) =>
	Array.from({ length: n }, (_, k) => ({
		titre: `p${k}`,
		statut: "clos",
		maj: "2026-10-01",
	}))

describe("engine/svg/plat", () => {
	it("esc d'un titre <b>", () => {
		const svg = sousSolPlat([{ titre: "<b>x</b>", statut: "clos", maj: "" }])
		expect(svg).not.toContain("<b>")
		expect(svg).toContain("&lt;b&gt;")
	})

	it("libellé de carton tronqué selon la largeur", () => {
		const svg = salleSousSol([
			{ titre: "agentx-immeuble-long", statut: "clos", maj: "" },
		])
		expect(svg).not.toContain("agentx-immeuble-long</text>")
		expect(svg).toContain("…</text>")
	})

	it("n LED = serveurs.length", () => {
		const serveurs: ServeurPlat[] = [
			{ nom: "a", etat: "ok", latence_ms: 3 },
			{ nom: "b", etat: "warn", latence_ms: null },
			{ nom: "c", etat: "ko", latence_ms: null },
		]
		const svg = niveauPlat({ serveurs })
		expect(svg.match(/r="1\.7"/g)).toHaveLength(3)
	})

	it("+N si agents > postes", () => {
		const agents = ["a", "b", "c", "d"].map(agent)
		expect(niveauPlat({ agents, postes: 2 })).toContain(">+2<")
		expect(niveauPlat({ agents, postes: 4 })).not.toContain(">+")
	})

	it("ids de dégradés suffixés par id", () => {
		const x = niveauPlat({ id: "-x", lum: "allume", agents: [agent("a")] })
		const y = niveauPlat({ id: "-y" })
		expect(x).toContain('id="pf-fen-x"')
		expect(x).toContain("url(#pf-cone-x)")
		expect(y).toContain('id="pf-fen-y"')
		expect(y).not.toContain("pf-fen-x")
	})

	it("sousSolPlat(12 clos) ⇒ 10 cartons", () => {
		expect(sousSolPlat(clos(12)).match(/<title>/g)).toHaveLength(10)
	})

	it("immeubleGrand sans étage ne lève pas", () => {
		const svg = immeubleGrand({
			etages: [],
			toit: { todo: 0, urgent: 0, chefsN: 1, contexte: "" },
			chef: "ok",
			clos: [],
		})
		expect(svg).toContain('data-etage="chef"')
		expect(svg).toContain('data-etage="sous-sol"')
	})
})

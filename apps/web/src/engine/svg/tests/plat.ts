import { describe, expect, it } from "vitest"
import {
	immeubleGrand,
	niveauPlat,
	type ServeurPlat,
	salleSousSol,
	sousSolPlat,
} from "@/engine/svg/plat"

const agent = (role: string) => ({ role, couleur: "#ffffff", bloque: false })
const clos = (n: number, pre = "p") =>
	Array.from({ length: n }, (_, k) => ({
		titre: `${pre}${k}`,
		statut: "clos",
		maj: "2026-10-01",
	}))
const salle = (cle: string, couleur: string, n: number) => ({
	cle,
	nom: cle,
	couleur,
	clos: clos(n, cle),
})

describe("engine/svg/plat", () => {
	it("esc d'un titre <b>", () => {
		const svg = sousSolPlat([
			{
				cle: "a",
				nom: "<i>n</i>",
				couleur: '"><b>',
				clos: [{ titre: "<b>x</b>", statut: "clos", maj: "" }],
			},
		])
		expect(svg).not.toContain("<b>")
		expect(svg).toContain("&lt;b&gt;")
		expect(svg).toContain("&lt;i&gt;n&lt;/i&gt; · &lt;b&gt;x&lt;/b&gt;")
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

	it("sousSolPlat(12 clos en 2 salles) ⇒ 10 cartons répartis", () => {
		const svg = sousSolPlat([
			salle("a", "#ff0000", 9),
			salle("b", "#00ff00", 3),
		])
		expect(svg.match(/<title>/g)).toHaveLength(10)
		expect(svg.match(/<title>a · /g)).toHaveLength(7)
		expect(svg.match(/<title>b · /g)).toHaveLength(3)
	})

	it("2 salles ⇒ 2 bandes de couleurs distinctes", () => {
		const svg = sousSolPlat([
			salle("a", "#ff0000", 2),
			salle("b", "#00ff00", 2),
		])
		const bandes =
			svg.match(/class="pf-bande"[^>]*fill="(#[0-9a-f]{6})"/g) ?? []
		expect(bandes).toHaveLength(2)
		expect(new Set(bandes.map((b) => b.slice(-9))).size).toBe(2)
	})

	it("couleur absente ⇒ bande #5e6a8c", () => {
		expect(sousSolPlat([salle("a", "", 1)])).toContain('fill="#5e6a8c"')
	})

	const quatre = [
		salle("a", "#ff0000", 6),
		salle("b", "#00ff00", 4),
		salle("c", "#0000ff", 4),
		salle("seagle", "#ffff00", 11),
	]
	const bandesDansCadre = (W: number) => {
		const bandes =
			sousSolPlat(quatre, W, 56).match(/class="pf-bande"[^>]*>/g) ?? []
		expect(bandes).toHaveLength(4)
		for (const b of bandes) {
			const x = Number(/ x="([\d.]+)"/.exec(b)?.[1])
			const w = Number(/ width="([\d.]+)"/.exec(b)?.[1])
			expect(x).toBeGreaterThanOrEqual(0)
			expect(x + w).toBeLessThanOrEqual(W)
		}
	}

	it("4 salles à W = 240 ⇒ bandes dans le cadre", () => bandesDansCadre(240))

	it("4 salles à W = 360 ⇒ bandes dans le cadre", () => bandesDansCadre(360))

	it("immeubleGrand : libellé SS court, archives en 2e ligne", () => {
		const svg = immeubleGrand({
			etages: [],
			toit: { todo: 0, urgent: 0, chefsN: 1, contexte: "" },
			chef: "ok",
			clos: quatre,
		})
		expect(svg).toContain("25 archives")
		expect(svg).toContain("4 projets")
		expect(svg).not.toContain("projets clos")
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

import { describe, expect, it } from "vitest"
import { stateFixture } from "@/api/state/fixture"
import {
	type Flux,
	type SalleState,
	SalleStateSchema,
	type Tache,
} from "@/api/state/schema"
import { propsSalle } from "@/engine/svg/meuble"
import { postesSalle, salleEtage, tableauPipeline } from "@/engine/svg/salle"
import { toSalleVue } from "@/salle/script/salleVue"

const etat = SalleStateSchema.parse(stateFixture)
const immeuble = etat.immeuble
const chef = etat.roles[0]
const role = (cle: string, nom = cle) => ({
	...etat.roles[1],
	cle,
	nom,
	affectable: true,
	actifs: 0,
})
const tache = (id: string, r: string, statut = "en-cours"): Tache => ({
	...etat.taches[0],
	id,
	role: r,
	statut,
})
const flux = (de: string, vers: string, etat: Flux["etat"]): Flux => ({
	de,
	vers,
	de_tid: "",
	vers_tid: "",
	quoi: "",
	objet: "pack",
	objet_nom: "",
	etat,
})
// étage sélectionné = seul étage ; chef vivant par défaut
const salle = (
	agents: { role: string; tid: string }[],
	taches: Tache[],
	extra: Partial<SalleState> = {},
): SalleState => ({
	...etat,
	roles: [chef, role("implementeur"), role("testeur"), role("scribe")],
	taches,
	immeuble: {
		...immeuble,
		toit: { ...immeuble.toit, chef: { vivant: true } },
		etages: [{ ...immeuble.etages[0], selection: true, agents }],
	},
	...extra,
})
const compte = (svg: string, motif: string) => svg.split(motif).length - 1
const TROIS = [
	{ role: "implementeur", tid: "T1" },
	{ role: "implementeur", tid: "T2" },
	{ role: "implementeur", tid: "T3" },
]
const TOUS = [
	{ role: "implementeur", tid: "T1" },
	{ role: "testeur", tid: "T4" },
	{ role: "scribe", tid: "T6" },
]
const TACHES = [
	tache("T1", "implementeur"),
	tache("T2", "implementeur", "bloque"),
	tache("T3", "implementeur"),
	tache("T4", "testeur", "a-faire"),
]

describe("toSalleVue", () => {
	it("desks = rôles avec ≥ 1 agent, chef si session vivante", () => {
		const s = salle([], TACHES)
		const mort = {
			...s,
			immeuble: s.immeuble && {
				...s.immeuble,
				toit: { ...s.immeuble.toit, chef: { vivant: false } },
			},
		}
		expect(toSalleVue(mort, null).desks).toEqual([])
		const vue = toSalleVue(
			salle([{ role: "implementeur", tid: "T1" }], TACHES),
			null,
		)
		expect(vue.desks.map((d) => d.cle)).toEqual(["chef", "implementeur"])
	})

	it("3 agents dont 1 bloqué ⇒ 3 fantômes, 1 aux yeux rouges", () => {
		const vue = toSalleVue(salle(TROIS, TACHES), null)
		const impl = vue.desks.find((d) => d.cle === "implementeur")
		expect(impl?.agents).toEqual([
			{ tid: "T1", bloque: false },
			{ tid: "T2", bloque: true },
			{ tid: "T3", bloque: false },
		])
		const svg = salleEtage(vue)
		// + 1 fantôme du chef
		expect(compte(svg, `class="mascotte"`)).toBe(4)
		expect(compte(svg, `class="v1-bloque"`)).toBe(1)
		expect(svg).toContain("implementeur ×3")
	})

	it("0 agent et chef mort ⇒ 0 fantôme", () => {
		const s = salle([], TACHES)
		const sans = salle([], TACHES, {
			immeuble: s.immeuble && {
				...s.immeuble,
				toit: { ...s.immeuble.toit, chef: { vivant: false } },
			},
		})
		expect(compte(salleEtage(toSalleVue(sans, null)), `class="mascotte"`)).toBe(
			0,
		)
	})

	it("sans étage ⇒ actifs du registre, aucun bloqué", () => {
		const s = salle([], TACHES, { immeuble: { ...immeuble, etages: [] } })
		s.roles = s.roles.map((r) =>
			r.cle === "testeur" ? { ...r, actifs: 2 } : r,
		)
		const vue = toSalleVue(s, null)
		expect(vue.desks.find((d) => d.cle === "testeur")?.agents).toEqual([
			{ tid: "", bloque: false },
			{ tid: "", bloque: false },
		])
		expect(vue.desks.find((d) => d.cle === "chef")?.agents).toHaveLength(1)
	})

	it("pipeline ⇒ LED du vault, fusée, lampe d'alerte, poubelle", () => {
		const s = salle([], [...TACHES, tache("T5", "testeur", "abandonne")], {
			pipeline: [
				{ k: "bloque", n: 1 },
				{ k: "en-cours", n: 2 },
				{ k: "fait", n: 2 },
			],
		})
		const svg = salleEtage(toSalleVue(s, null))
		expect(compte(svg, `fill="#22e07a" style`)).toBe(3)
		expect(svg).toContain("VAGUE EN COURS")
		expect(svg).toContain("BLOCAGE DÉTECTÉ")
		expect(svg).toContain("ABANDONNÉES 1")
		const calme = salleEtage(toSalleVue(salle([], TACHES), null))
		expect(calme).toContain("AUCUNE VAGUE")
		expect(calme).toContain("AUCUN BLOCAGE")
	})

	it("un fait de plus que le rendu précédent ⇒ flash du vault", () => {
		const s = salle([], TACHES, { pipeline: [{ k: "fait", n: 2 }] })
		expect(toSalleVue(s, null).pipeline.flash).toBe(false)
		expect(toSalleVue(s, null, 2).pipeline.flash).toBe(false)
		expect(toSalleVue(s, null, 1).pipeline.flash).toBe(true)
		expect(salleEtage(toSalleVue(s, null, 1))).toContain("vault-flash")
	})

	it("parStatut = pipeline du serveur ⇒ 6 barres, abandonne ignoré", () => {
		const pipeline = [
			{ k: "a-faire", n: 1 },
			{ k: "pret", n: 2 },
			{ k: "en-cours", n: 3 },
			{ k: "revue", n: 4 },
			{ k: "bloque", n: 5 },
			{ k: "fait", n: 6 },
			{ k: "abandonne", n: 7 },
		]
		const s = salle([], TACHES, { pipeline })
		const vue = toSalleVue(s, null)
		expect(vue.pipeline.parStatut).toEqual(pipeline)
		const { svg } = tableauPipeline("y0", vue.pipeline)
		expect(compte(svg, `<polygon points`)).toBe(1 + 6)
		expect(svg).not.toContain("ABAND")
	})
})

describe("toSalleVue : flux", () => {
	const fl = (agents: { role: string; tid: string }[], f: Flux[]) =>
		toSalleVue(salle(agents, TACHES, { flux: f }), null).flux.map(
			({ de, vers }) => ({ de, vers }),
		)

	it("actif implementeur→critique, 0 implémenteur ⇒ part du vault", () => {
		const s = salle([{ role: "critique", tid: "T93" }], TACHES, {
			roles: [chef, role("critique"), role("implementeur")],
			taches: [tache("T93", "critique"), tache("T91", "implementeur", "fait")],
			flux: [flux("implementeur", "critique", "actif")],
		})
		expect(
			toSalleVue(s, null).flux.map(({ de, vers }) => ({ de, vers })),
		).toEqual([{ de: "vault", vers: "critique" }])
	})

	it("actif vers un rôle sans agent ⇒ aucun arc", () => {
		expect(fl([], [flux("implementeur", "testeur", "actif")])).toEqual([])
	})

	it("bloque vers un agent bloqué ⇒ gardé, de recalculé", () => {
		expect(
			fl(
				[{ role: "testeur", tid: "T2" }],
				[flux("implementeur", "testeur", "bloque")],
			),
		).toEqual([{ de: "vault", vers: "testeur" }])
		expect(fl(TOUS, [flux("implementeur", "testeur", "bloque")])).toEqual([
			{ de: "implementeur", vers: "testeur" },
		])
	})
})

describe("salleEtage", () => {
	it("flux : 1 arc par couple de>vers, état max, vers scribe ⇒ part du vault, source inconnue ⇒ vault", () => {
		const s = salle(TOUS, [...TACHES, tache("T6", "scribe")], {
			flux: [
				flux("implementeur", "testeur", "attente"),
				flux("implementeur", "testeur", "actif"),
				flux("testeur", "scribe", "actif"),
				flux("inconnu", "testeur", "bloque"),
			],
		})
		const svg = salleEtage(toSalleVue(s, null), false)
		expect(compte(svg, `class="v1-arc-impulsion`)).toBe(2)
		expect(compte(svg, `class="v1-arc-bloque-b"`)).toBe(1)
		expect(compte(svg, "fleche-")).toBe(0)
		expect(compte(svg, "colis-bloque")).toBe(0)
	})

	it("4 flux (attente, livre, actif, bloque) ⇒ 2 arcs, colis animé sur l'actif seul (couche CSS)", () => {
		const s = salle(TOUS, [...TACHES, tache("T6", "scribe")], {
			flux: [
				flux("testeur", "implementeur", "attente"),
				flux("testeur", "scribe", "livre"),
				flux("implementeur", "testeur", "actif"),
				flux("scribe", "implementeur", "bloque"),
			],
		})
		const svg = salleEtage(toSalleVue(s, null))
		expect(compte(svg, `class="v1-arc-impulsion`)).toBe(1)
		expect(compte(svg, `class="v1-arc-bloque-b"`)).toBe(1)
		expect(compte(svg, "fleche-")).toBe(0)
		expect(compte(svg, "colis-bloque")).toBe(0)
	})

	it("relais bloqué ⇒ question à l'arrêt, rouge", () => {
		const s = salle(TOUS, TACHES, {
			flux: [flux("implementeur", "testeur", "bloque")],
		})
		const svg = salleEtage(toSalleVue(s, null))
		expect(compte(svg, `class="v1-arc-bloque-b"`)).toBe(1)
		expect(compte(svg, `class="v1-arc-impulsion`)).toBe(0)
		expect(compte(svg, "colis-bloque")).toBe(0)
	})

	it("props déterministes : même slug ⇒ même SVG", () => {
		const vue = toSalleVue(salle(TROIS, TACHES), null)
		expect(salleEtage(vue)).toBe(salleEtage(vue))
		const autre = { ...vue, props: { slug: "orthoworkspace-v2" } }
		expect(salleEtage(autre)).not.toBe(salleEtage(vue))
	})

	it("props : 3 bureaux ⇒ 4-5, 8 bureaux ⇒ 6-8, 0 recouvrement d'obstacle", () => {
		for (const slug of ["agentx", "salle-v2", "orthoworkspace-v2", "a", "bb"]) {
			const bureaux = (n: number) =>
				Array.from({ length: n }, (_, i): [number, number, number, number] => [
					300 + i * 10,
					200,
					350 + i * 10,
					260,
				])
			const obstacle: [number, number, number, number] = [480, 200, 560, 330]
			const trois = propsSalle(slug, bureaux(3), [obstacle], 12, 9)
			const huit = propsSalle(slug, bureaux(8), [obstacle], 12, 9)
			expect(trois.length).toBeGreaterThanOrEqual(4)
			expect(trois.length).toBeLessThanOrEqual(5)
			expect(huit.length).toBeGreaterThanOrEqual(6)
			expect(huit.length).toBeLessThanOrEqual(8)
			for (const { box } of [...trois, ...huit])
				expect(
					box[0] < obstacle[2] &&
						box[2] > obstacle[0] &&
						box[1] < obstacle[3] &&
						box[3] > obstacle[1],
				).toBe(false)
			expect(propsSalle(slug, bureaux(3), [obstacle], 12, 9)).toEqual(trois)
		}
	})

	it("noms échappés, ring sur le seul bureau survolé", () => {
		const s = salle([{ role: "pirate", tid: "T1" }], [tache("T1", "pirate")])
		s.roles = [chef, role("pirate", `<img src=x onerror="a()">`)]
		const svg = salleEtage(toSalleVue(s, "pirate"))
		expect(svg).not.toContain("<img")
		expect(svg).toContain("&lt;img src=x onerror=&quot;a()&quot;&gt;")
		expect(compte(svg, `class="desk-ring"`)).toBe(1)
		expect(svg).toMatch(
			/class="desk actif" data-desk="pirate">\s*<ellipse class="desk-ring"/,
		)
	})

	it("au-delà de 4 agents ⇒ 4 fantômes + N", () => {
		const six = Array.from({ length: 6 }, (_, k) => ({
			role: "testeur",
			tid: `X${k}`,
		}))
		const svg = salleEtage(toSalleVue(salle(six, TACHES), null))
		expect(compte(svg, `class="mascotte"`)).toBe(5)
		expect(svg).toContain(">+2</text>")
		expect(svg).toContain("testeur ×6")
	})

	it("postesSalle : chef [9.9, 0.7], 7 bureaux ⇒ 4 colonnes", () => {
		const desks = ["chef", "a", "b", "c", "d", "e", "f", "g"].map((cle) => ({
			cle,
			nom: cle,
			couleur: "#fff",
			agents: [],
		}))
		const p = Object.fromEntries(
			postesSalle(desks).map(({ d, p }) => [d.cle, p]),
		)
		expect(p.chef).toEqual([9.9, 0.7])
		expect(p.d).toEqual([1.2 + 3 * 2.25, 2])
		expect(p.e).toEqual([1.2, 4.2])
	})
})

import { describe, expect, it, vi } from "vitest"
import type { Etage, SalleState } from "@/api/state/schema"
import { equipe } from "@/engine/svg/fantome"
import { type Box, etiquette, iso, isoBox, union } from "@/engine/svg/iso"
import { propsSalle } from "@/engine/svg/meuble"
import { poubelle } from "@/engine/svg/objets"
import { postesSalle, salleEtage } from "@/engine/svg/salle"
import {
	fantomes,
	hauteurTour,
	largeurTour,
	type TourVue,
	tourImmeuble,
} from "@/engine/svg/tour"
import { toTourVue } from "@/salle/script/tour"
import { selectLastFloor, useSalleUi } from "@/shared/lib/store/salle"

type Immeuble = NonNullable<SalleState["immeuble"]>

const etage = (e: Partial<Etage>): Etage => ({
	slug: "x",
	titre: "X",
	statut: "ouvert",
	rang: 0,
	num: 1,
	activite: "",
	age_j: 0,
	dormant: false,
	compteurs: {},
	total: 0,
	agents: [],
	todo: 0,
	alerte: { niveau: "", texte: "" },
	selection: false,
	...e,
})

const immeuble = (etages: Etage[]): Immeuble => ({
	selection: { slug: "salle-v2", source: "defaut", refus: "" },
	epingle: "",
	toit: {
		chef: { vivant: true },
		todo: 40,
		urgent: 7,
		etages: etages.length,
		dormants: 0,
		alerte: { niveau: "", texte: "" },
	},
	etages,
	sous_sol: [{ slug: "vieux", titre: "Vieux <projet>" }].map((p) => ({
		...p,
		statut: "clos",
		source: "",
		maj: "",
		selectionnable: true,
	})),
	mesure_ms: 1,
})

const source = {
	immeuble: immeuble([
		etage({
			slug: "agentx",
			titre: "Outillage <AgentX> : rôles",
			rang: 1,
			num: 1,
			compteurs: { "en-cours": 0, bloque: 1 },
			alerte: { niveau: "urgent", texte: "T085 prête" },
		}),
		etage({
			slug: "salle-v2",
			titre: "Salle des agents v2",
			rang: 0,
			num: 2,
			compteurs: { "en-cours": 3, revue: 1 },
			agents: [
				{ role: "implementeur", tid: "T091" },
				{ role: "implementeur", tid: "T092" },
				{ role: "critique", tid: "T093" },
			],
			selection: true,
		}),
	]),
	roles: [
		{ cle: "implementeur", couleur: "#ff8a3d" },
		{ cle: "critique", couleur: "#e879f9" },
	],
	taches: [
		{ id: "T091", statut: "en-cours" },
		{ id: "T092", statut: "bloque" },
		{ id: "T093", statut: "en-cours" },
	],
	projet: { slug: "salle-v2" },
}

const lue = toTourVue(source)
if (!lue) throw new Error("vue attendue")
const vue: TourVue = lue
const svg = tourImmeuble(vue)
// SVG d'un étage : coupe `g.tour-niveau[data-slug]` jusqu'au niveau suivant
const coupe = (slug: string) =>
	svg
		.split(`class="tour-niveau`)
		.find((b) => b.includes(`data-slug="${slug}"`)) ?? ""

describe("toTourVue", () => {
	it("trie par rang (rang 0 en haut) et lit les 3 compteurs", () => {
		expect(vue.etages.map((e) => e.slug)).toEqual(["salle-v2", "agentx"])
		expect(vue.etages[0].compteurs).toEqual({ enCours: 3, revue: 1, bloque: 0 })
		expect(vue.etages[1].compteurs).toEqual({ enCours: 0, revue: 0, bloque: 1 })
	})

	it("3 agents de 2 rôles ⇒ 2 fantômes couleur rôle", () => {
		const f = fantomes(vue.etages[0].agents)
		expect(f.map((x) => [x.role, x.couleur])).toEqual([
			["implementeur", "#ff8a3d"],
			["critique", "#e879f9"],
		])
		expect(coupe("salle-v2").match(/data-role=/g)).toHaveLength(2)
	})

	it("1 agent bloqué ⇒ yeux rouges sur son rôle, au travail s'il en reste un", () => {
		const [impl, crit] = fantomes(vue.etages[0].agents)
		expect(impl).toMatchObject({ bloque: true, travail: true })
		expect(crit).toMatchObject({ bloque: false, travail: true })
		const c = coupe("salle-v2")
		expect(c.match(/class="v1-bloque"/g)).toHaveLength(1)
		expect(c).toContain(`fill="#ff3b5c"`)
	})

	it("bloqué hors étage courant : inconnu ⇒ false", () => {
		const autre = toTourVue({ ...source, projet: { slug: "agentx" } })
		expect(autre?.etages[0].agents.some((a) => a.bloque)).toBe(false)
	})

	it("0 agent ⇒ 0 fantôme ; alerte ⇒ gyro + ligne d'alerte", () => {
		expect(coupe("agentx")).not.toContain("data-role=")
		expect(svg.match(/class="tour-gyro"/g)).toHaveLength(1)
		expect(svg).toContain(`class="tour-al urgent"`)
	})

	it("lastFloor pose la sélection, même si le serveur en désigne une autre", () => {
		const v = toTourVue(source, "agentx")
		expect(v?.etages.map((e) => e.selection)).toEqual([false, true])
	})

	it("lastFloor inconnu ou nul ⇒ sélection serveur", () => {
		expect(
			toTourVue(source, "disparu")?.etages.map((e) => e.selection),
		).toEqual([true, false])
		expect(toTourVue(source)?.etages.map((e) => e.selection)).toEqual([
			true,
			false,
		])
	})

	it("showFloor mémorise lastFloor, showBuilding le garde", () => {
		const mem = new Map<string, string>()
		vi.stubGlobal("localStorage", {
			getItem: (k: string) => mem.get(k) ?? null,
			setItem: (k: string, v: string) => mem.set(k, v),
		})
		useSalleUi.getState().showFloor("agentx")
		useSalleUi.getState().showBuilding()
		expect(selectLastFloor(useSalleUi.getState())).toBe("agentx")
		expect(mem.get("agentx.lastFloor")).toBe("agentx")
		vi.unstubAllGlobals()
	})

	it("démo : immeuble null ⇒ null", () => {
		expect(toTourVue({ ...source, immeuble: null })).toBeNull()
	})
})

describe("sous-sol", () => {
	const clos = (titres: string[]) =>
		tourImmeuble({
			...vue,
			sousSol: titres.map((t, i) => ({ slug: `c${i}`, titre: t })),
		})

	it("3 projets clos ⇒ 3 cartons data-slug, titres échappés", () => {
		const t = clos(["A <b>", "B & C", "Titre très très long"])
		expect(t.match(/class="tour-carton" data-slug="c\d"/g)).toHaveLength(3)
		expect(t).toContain("<title>A &lt;b&gt;</title>")
		expect(t).toContain("<title>Titre très très long</title>")
		const cartons = t.match(/<g class="tour-carton"[\s\S]*?<\/g><\/g>/g) ?? []
		expect(cartons).toHaveLength(3)
		expect(cartons.join("")).not.toContain("</text>")
		expect(t).not.toContain("<b>")
	})

	it("0 clos ⇒ 0 carton, 0 texte de sous-sol", () => {
		const t = clos([])
		expect(t).not.toContain("tour-carton")
		expect(t).not.toContain("SOUS-SOL")
		expect(t).not.toContain("aucun")
	})
})

describe("tourImmeuble", () => {
	it("déterministe : 2 appels = même chaîne", () => {
		expect(tourImmeuble(vue)).toBe(svg)
	})

	it("échappe titres, alertes et sous-sol", () => {
		expect(svg).toContain("Outillage &lt;AgentX&gt;")
		expect(svg).toContain("Vieux &lt;projet&gt;")
		expect(svg).not.toContain("<AgentX>")
		expect(svg).not.toContain("<projet>")
	})

	it("viewBox à la hauteur du dessin, plaque chef, sélection, > 4 rôles ⇒ +N", () => {
		expect(svg).toContain(
			`viewBox="0 0 ${largeurTour()} ${hauteurTour(2)}" preserveAspectRatio="xMidYMid meet"`,
		)
		expect(svg).toContain("É3 · CHEF")
		expect(svg).toContain("todo 40 · 7 urgent")
		expect(svg).toContain(`aria-current="page"`)
		const six = ["a", "b", "c", "d", "e", "f"].map((role) => ({
			role,
			couleur: "#ffffff",
			bloque: false,
		}))
		const large = tourImmeuble({
			...vue,
			etages: [{ ...vue.etages[1], agents: six }],
		})
		expect(large.match(/data-role=/g)).toHaveLength(4)
		expect(large).toContain(">+2</text>")
	})
})

describe("décor stable (T121)", () => {
	const props = (v: TourVue, slug: string) =>
		coupeDe(tourImmeuble(v), slug).match(/<g class="tour-prop"[^>]*>/g) ?? []
	const coupeDe = (t: string, slug: string) =>
		t
			.split(`class="tour-niveau`)
			.find((b) => b.includes(`data-slug="${slug}"`)) ?? ""
	const avec = (n: number): TourVue => ({
		...vue,
		etages: vue.etages.map((e) => ({
			...e,
			agents: Array.from({ length: n }, (_, i) => ({
				role: `r${i}`,
				couleur: "#ffffff",
				bloque: false,
			})),
		})),
	})

	it("même slug, 0 vs 3 fantômes ⇒ mêmes props", () => {
		for (const slug of ["salle-v2", "agentx"]) {
			const zero = props(avec(0), slug).join("")
			expect(zero).not.toBe("")
			expect(props(avec(3), slug).join("")).toBe(zero)
			expect(props(avec(1), slug).join("")).toBe(zero)
		}
	})

	it("viewBox plus bas que l'ancien 480 fixe", () => {
		expect(hauteurTour(2)).toBeLessThan(480)
		expect(tourImmeuble(avec(0))).toContain(
			`viewBox="0 0 ${largeurTour()} ${hauteurTour(2)}"`,
		)
	})
})

describe("tour T1 (T130)", () => {
	const leds = (t: string) =>
		(t.match(/<circle[^>]*r="2.2"[^>]*>/g) ?? []).map((c) =>
			c.includes(`fill-opacity="1"`),
		)
	const chef = (vivant: boolean | null) => ({ ...vue, chef: { vivant } })

	it("viewBox 648 de large", () => {
		expect(largeurTour()).toBe(648)
	})

	it("plaques en colonne x ≥ 398, largeur 250, texte 11 px", () => {
		expect(svg).toMatch(/class="tour-plaque" x="398\.0" y="[\d.]+" width="250"/)
		expect(svg).toContain(`style="font-size:11px"`)
		expect(svg).toContain(`class="tour-renvoi"`)
		expect(svg.match(/class="tour-etage[^"]*" data-slug=/g)).toHaveLength(2)
	})

	it("LED du toit : vert = en session, rouge = absent, 0 = inconnu", () => {
		expect(leds(tourImmeuble(chef(true)))).toEqual([false, true])
		expect(leds(tourImmeuble(chef(false)))).toEqual([true, false])
		expect(leds(tourImmeuble(chef(null)))).toEqual([false, false])
	})

	it("toit : 0 animation, 0 nom de projet", () => {
		const toit = svg.match(/class="tour-toit"[\s\S]*?<\/g>/)?.[0]
		expect(toit).toBeTruthy()
		expect(toit).not.toMatch(/animation|<animate|<text/)
	})
})

const OBJETS_POUBELLE: [number, number] = [0.3, 8.5]

describe("décor de salle (T121)", () => {
	const noms = Array.from({ length: 11 }, (_, i) => `b${i}`)
	const desks = noms.map((cle) => ({
		cle,
		nom: cle,
		couleur: "#ff8a3d",
		agents: [{ tid: "T1", bloque: false }],
	}))
	// emprise d'un bureau comme `bureau()` de salle.ts : plateau, équipe d'1 agent, plaque
	const boite = ([gx, gy]: [number, number], nom: string): Box => {
		const [mx, my] = iso(gx + 0.75, gy + 1.5, 0)
		const [lx, ly] = iso(gx + 0.75, gy + 0.9, 1.09)
		return union(
			isoBox(gx, gy, 0, 1.5, 0.9, 1.09),
			equipe(mx, my, "#ff8a3d", 1).box,
			etiquette({ x: lx, y: ly, t: nom, c: "#fff", w: nom.length * 5.1 }).box,
		)
	}
	const postes = postesSalle(desks).map(({ d, p }) => boite(p, d.nom))
	const objets: Box[] = [
		isoBox(11.1, 4.3, 0, 0.9, 0.9, 4.6),
		isoBox(10.7, 6.4, 0, 0.6, 0.6, 1.5),
		isoBox(9.9, 0.7, 0, 1.5, 0.9, 1.5),
	]

	it("11 bureaux ⇒ 6 à 8 props", () => {
		for (const slug of ["salle-v2", "agentx"]) {
			const n = propsSalle(slug, postes, objets, 12, 9).length
			expect(n).toBeGreaterThanOrEqual(6)
			expect(n).toBeLessThanOrEqual(8)
		}
	})

	it("2 slugs ⇒ au plus 1 emplacement commun", () => {
		const emp = (slug: string) =>
			propsSalle(slug, postes, objets, 12, 9).map((p) => p.p.join(","))
		const a = emp("salle-v2")
		expect(
			emp("agentx").filter((p) => a.includes(p)).length,
		).toBeLessThanOrEqual(1)
	})

	it("bocal A2 hors pool", () => {
		for (const slug of ["a", "b", "c", "d", "e", "f", "g", "h"])
			for (const p of propsSalle(slug, postes, objets, 12, 9))
				expect(p.svg).not.toContain(`r="9.5" fill="url(#v1-eau)"`)
	})

	it("corbeille + libellé ABANDONNÉES à ≥ 30 px de tout bureau", () => {
		for (const [slug, n] of [
			["salle-v2", 11],
			["agentx", 9],
		] as const) {
			const ds = desks.slice(0, n)
			const vueSalle = {
				desks: ds,
				flux: [],
				pipeline: { bloque: 0, enCours: 0, faits: 0 },
				abandonnees: 29,
				props: { slug },
				hovered: null,
			}
			const svg = salleEtage(vueSalle)
			const m = svg.match(
				/<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"[^>]*\/><text[^>]*>ABANDONNÉES/,
			)
			expect(m).not.toBeNull()
			const [x, y, w, h] = (m ?? []).slice(1).map(Number)
			const c = poubelle(...OBJETS_POUBELLE, 29).box
			const o = union(c, [x, y, x + w, y + h])
			for (const b of postesSalle(ds).map(({ d, p }) => boite(p, d.nom))) {
				const dx = Math.max(b[0] - o[2], o[0] - b[2], 0)
				const dy = Math.max(b[1] - o[3], o[1] - b[3], 0)
				expect(Math.hypot(dx, dy)).toBeGreaterThanOrEqual(30)
			}
		}
	})
})

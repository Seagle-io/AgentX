import { describe, expect, it } from "vitest"
import type { SalleState } from "@/api/state/schema"
import {
	alerteCouleur,
	chefEtat,
	court,
	type EtagePlatVue,
	logoProjet,
	sallesSousSol,
	toImmeublePlat,
	versEtageGrand,
} from "@/salle/script/plat"

type EtageSrc = {
	slug: string
	rang: number
	dormant?: boolean
	agents?: string[]
	niveau?: string
	bloque?: number
	branche?: string | null
	porteurs?: string[]
	serveurs?: {
		nom: string
		env: string
		etat: "ok" | "warn" | "ko"
		latence_ms: number | null
		url: string | null
	}[]
}

const etat = (
	etages: EtageSrc[],
	opts: { vivant?: boolean | null; pct?: number } = {},
): SalleState =>
	({
		roles: [{ cle: "implementeur", couleur: "#123456" }],
		taches: [],
		projet: { slug: "x" },
		immeuble: {
			etages: etages.map((e, i) => ({
				slug: e.slug,
				titre: `Titre ${e.slug} : suite`,
				rang: e.rang,
				num: i + 1,
				dormant: e.dormant ?? false,
				compteurs: { bloque: e.bloque ?? 0 },
				agents: (e.agents ?? []).map((role, k) => ({ role, tid: `T${k}` })),
				alerte: { niveau: e.niveau ?? "", texte: "t" },
				selection: false,
				todo: 2,
				branche: e.branche,
				porteurs: e.porteurs,
				serveurs: e.serveurs,
			})),
			toit: { chef: { vivant: opts.vivant ?? null }, todo: 5, urgent: 1 },
			chefs: [{ cle: "defaut", contexte: opts.pct ? { pct: opts.pct } : null }],
			sous_sol: [{ slug: "z", titre: "Z", statut: "clos", maj: "m" }],
		},
	}) as unknown as SalleState

const vue = (e: Partial<EtagePlatVue>): EtagePlatVue => ({
	slug: "s",
	num: 1,
	titre: "S",
	court: "S",
	branche: "∅",
	porteurs: [],
	todo: 0,
	dormant: false,
	selection: false,
	lum: "vide",
	enCours: 0,
	revue: 0,
	bloque: 0,
	alerte: false,
	alerteNiveau: "",
	alerteTexte: "",
	logo: { lettres: "S", teinte: 0 },
	agents: [],
	agentsN: 0,
	serveurs: [],
	...e,
})

describe("salle/script/plat", () => {
	it("logoProjet : 2 mots, 1 mot, teinte stable", () => {
		expect(logoProjet("a", "Salle Premium").lettres).toBe("SP")
		expect(logoProjet("agentx", "agentx").lettres).toBe("AG")
		const t = logoProjet("geolens-viewer", "x").teinte
		expect(t).toBe(logoProjet("geolens-viewer", "y").teinte)
		expect(t).toBeGreaterThanOrEqual(0)
		expect(t).toBeLessThan(360)
	})

	it("court : coupe avant ' : ' puis tronque", () => {
		expect(court("Salle : suite")).toBe("Salle")
		expect(court("abcdefghij", 5)).toBe("abcd…")
		expect(court("abcde", 5)).toBe("abcde")
	})

	it("chefEtat true/false/null", () => {
		expect([true, false, null].map(chefEtat)).toEqual(["ok", "off", "ko"])
	})

	it("lum : dormant / agents / vide", () => {
		const v = toImmeublePlat(
			etat([
				{ slug: "a", rang: 0, dormant: true, agents: ["implementeur"] },
				{ slug: "b", rang: 1, agents: ["implementeur"] },
				{ slug: "c", rang: 2 },
			]),
			null,
			"defaut",
		)
		expect(v.etages.map((e) => e.lum)).toEqual(["eteint", "allume", "vide"])
		expect(v.agentsTotal).toBe(2)
	})

	it("alerte : niveau, bloque > 0 ; couleur", () => {
		const v = toImmeublePlat(
			etat([
				{ slug: "a", rang: 0, niveau: "urgent" },
				{ slug: "b", rang: 1, bloque: 2 },
				{ slug: "c", rang: 2 },
			]),
			null,
			"defaut",
		)
		expect(v.etages.map((e) => e.alerte)).toEqual([true, true, false])
		expect(alerteCouleur(v.etages[0])).toBe("#ffcc33")
		expect(alerteCouleur(v.etages[1])).toBe("#ff3b5c")
		expect(alerteCouleur(vue({ alerteNiveau: "choix" }))).toBe("#ff3b5c")
	})

	it("porteurs : absents ⇒ [] ; transmis tels quels", () => {
		const v = toImmeublePlat(
			etat([
				{ slug: "a", rang: 0 },
				{ slug: "b", rang: 1, porteurs: ["julien", "sylvain"] },
			]),
			null,
			"defaut",
		)
		const par = new Map(v.etages.map((e) => [e.slug, e.porteurs]))
		expect(par.get("a")).toEqual([])
		expect(par.get("b")).toEqual(["julien", "sylvain"])
	})

	it("contextePct null ou arrondi ; branche ∅ ; chefNum", () => {
		const sans = toImmeublePlat(etat([{ slug: "a", rang: 0 }]), null, "defaut")
		expect(sans.toit.contextePct).toBeNull()
		expect(sans.etages[0].branche).toBe("∅")
		expect(sans.toit.chefNum).toBe(2)
		const avec = toImmeublePlat(
			etat([{ slug: "a", rang: 0, branche: "main" }], { pct: 41.6 }),
			null,
			"defaut",
		)
		expect(avec.toit.contextePct).toBe(42)
		expect(avec.toit.chefsN).toBe(1)
		expect(avec.etages[0].branche).toBe("main")
	})

	it("ordre par rang ; versEtageGrand sans serveurs", () => {
		const v = toImmeublePlat(
			etat([
				{ slug: "b", rang: 1 },
				{ slug: "a", rang: 0 },
			]),
			"b",
			"defaut",
		)
		expect(v.etages.map((e) => e.slug)).toEqual(["a", "b"])
		expect(v.etages[1].selection).toBe(true)
		const g = versEtageGrand(v.etages[0])
		expect(g.serveurs).toEqual([])
		expect(g.logoCouleur).toMatch(/^oklch\(72% 0\.17 \d+\)$/)
	})

	it("sélection = slug de la route seul, jamais celle du serveur", () => {
		const s = etat([{ slug: "a", rang: 0 }])
		s.immeuble.etages[0].selection = true
		expect(toImmeublePlat(s, null, "defaut").etages[0].selection).toBe(false)
		expect(toImmeublePlat(s, "a", "defaut").etages[0].selection).toBe(true)
	})

	it("étage avec 2 serveurs ⇒ versEtageGrand(e).serveurs.length = 2", () => {
		const s = (nom: string) => ({
			nom,
			env: "prod",
			etat: "ok" as const,
			latence_ms: 5,
			url: null,
		})
		const v = toImmeublePlat(
			etat([{ slug: "a", rang: 0, serveurs: [s("api"), s("web")] }]),
			null,
			"defaut",
		)
		expect(versEtageGrand(v.etages[0]).serveurs.length).toBe(2)
	})

	const avecClos = (
		clos: { slug: string; produit?: string }[],
		etages: string[] = ["a", "b"],
	): SalleState => {
		const s = etat(etages.map((slug, rang) => ({ slug, rang })))
		s.immeuble.etages[0].produit = { couleur: "#abc" }
		s.immeuble.sous_sol = clos.map((c) => ({
			slug: c.slug,
			titre: c.slug.toUpperCase(),
			statut: "clos",
			source: "",
			maj: "m",
			selectionnable: false,
			produit: c.produit ?? "",
		}))
		return s
	}

	it("sallesSousSol : ordre des étages, sans produit en dernier", () => {
		const r = sallesSousSol(
			avecClos([
				{ slug: "x" },
				{ slug: "y", produit: "b" },
				{ slug: "z", produit: "a" },
			]),
		)
		expect(r.map((x) => x.cle)).toEqual(["a", "b", ""])
		expect(r[0].nom).toBe("Titre a : suite")
		expect(r[0].couleur).toBe("#abc")
		expect(r[2].nom).toBe("")
	})

	it("sallesSousSol : produit inconnu ⇒ salle sans projet ; vides omises", () => {
		const r = sallesSousSol(avecClos([{ slug: "x", produit: "inconnu" }]))
		expect(r.map((x) => x.cle)).toEqual([""])
		expect(r[0].clos).toHaveLength(1)
	})

	it("sallesSousSol : ordre interne conservé", () => {
		const r = sallesSousSol(
			avecClos([
				{ slug: "p", produit: "a" },
				{ slug: "q", produit: "a" },
			]),
		)
		expect(r[0].clos.map((c) => c.titre)).toEqual(["P", "Q"])
	})
})

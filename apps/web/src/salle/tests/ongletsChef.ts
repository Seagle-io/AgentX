import { describe, expect, it } from "vitest"
import {
	ajoutBloque,
	cleChefValide,
	nomChef,
	nomCompteValide,
	normaliserCle,
	ongletsDe,
	teinteChef,
} from "@/salle/script/ongletsChef"

describe("teinteChef", () => {
	it("cycle sur 4 teintes", () => {
		expect([0, 1, 2, 3, 4].map(teinteChef)).toEqual([
			"accent",
			"success",
			"warning",
			"error",
			"accent",
		])
	})
})

describe("nomChef", () => {
	it("libellé prioritaire", () => {
		expect(
			nomChef(
				{ cle: "defaut", libelle: "session-sylvain" },
				"defaut",
				"défaut",
			),
		).toBe("session-sylvain")
	})

	it("défaut sans libellé ⇒ traduit", () => {
		expect(nomChef({ cle: "defaut" }, "defaut", "défaut")).toBe("défaut")
	})

	it("autre clé ⇒ clé", () => {
		expect(nomChef({ cle: "x" }, "defaut", "défaut")).toBe("x")
	})
})

describe("ongletsDe", () => {
	const choix: { cle: string; libelle?: string }[] = [
		{ cle: "defaut" },
		{ cle: "alice" },
		{ cle: "bob" },
	]

	it("libellé du chef résolu", () => {
		const o = ongletsDe(
			[{ cle: "defaut", libelle: "session-sylvain" }, { cle: "alice" }],
			"defaut",
			"defaut",
			"défaut",
		)
		expect(o[0].libelle).toBe("session-sylvain")
	})

	it("libellés, teintes, actif", () => {
		expect(ongletsDe(choix, "alice", "defaut", "défaut")).toEqual([
			{ cle: "defaut", libelle: "défaut", teinte: "accent", actif: false },
			{ cle: "alice", libelle: "alice", teinte: "success", actif: true },
			{ cle: "bob", libelle: "bob", teinte: "warning", actif: false },
		])
	})

	it("actif inconnu ⇒ défaut", () => {
		const actifs = ongletsDe(choix, "zoe", "defaut", "défaut").filter(
			(o) => o.actif,
		)
		expect(actifs.map((o) => o.cle)).toEqual(["defaut"])
	})
})

describe("cleChefValide", () => {
	const MOTIF = "[a-z0-9][a-z0-9-]{0,23}"

	it("clés valides", () => {
		for (const c of ["bureau", "a", "a-1", "x".repeat(24)])
			expect(cleChefValide(c, MOTIF, "defaut")).toBe(true)
	})

	it("clés refusées", () => {
		for (const c of ["", "-a", "Bureau", "a_b", "x".repeat(25), "defaut"])
			expect(cleChefValide(c, MOTIF, "defaut")).toBe(false)
	})

	it("motif absent ⇒ true", () => {
		expect(cleChefValide("Bureau", undefined, "defaut")).toBe(true)
	})
})

describe("normaliserCle", () => {
	it("saisie libre ⇒ clé", () => {
		expect(normaliserCle("Sylvain", 24)).toBe("sylvain")
		expect(normaliserCle("Chef Front", 24)).toBe("chef-front")
		expect(normaliserCle("Élodie  B!", 24)).toBe("elodie-b")
		expect(normaliserCle("--x--", 24)).toBe("x")
		expect(normaliserCle(" ", 24)).toBe("")
		expect(normaliserCle("x".repeat(30), 24)).toHaveLength(24)
	})
	it("sans max : pas de troncature", () => {
		expect(normaliserCle("x".repeat(30))).toHaveLength(30)
	})
})

describe("nomCompteValide", () => {
	const MOTIF = "[a-z0-9][a-z0-9-]{0,23}"

	it("noms valides", () => {
		for (const n of ["pro", "a-1"]) expect(nomCompteValide(n, MOTIF)).toBe(true)
	})

	it("noms refusés", () => {
		for (const n of ["", "Bob", "a_b", "x".repeat(25)])
			expect(nomCompteValide(n, MOTIF)).toBe(false)
	})

	it("motif absent ⇒ non vide", () => {
		expect(nomCompteValide("", undefined)).toBe(false)
		expect(nomCompteValide("Bob", undefined)).toBe(true)
	})
})

describe("ajoutBloque", () => {
	const v = (cle: string, vivant: boolean | null) => ({ cle, vivant })

	it("plafond atteint", () => {
		const chefs = [v("a", true), v("b", true), v("c", true)]
		expect(ajoutBloque(chefs, 3, "defaut", "defaut")).toBe("plafond")
	})

	it("étage tenu", () => {
		expect(ajoutBloque([v("a", true)], 3, "bureau", "defaut")).toBe(
			"etage-tenu",
		)
	})

	it("libre", () => {
		expect(ajoutBloque([v("a", true)], 3, "defaut", "defaut")).toBeNull()
	})

	it("vivant null|false non comptés", () => {
		const chefs = [v("a", null), v("b", false), v("c", true)]
		expect(ajoutBloque(chefs, 2, "defaut", "defaut")).toBeNull()
	})
})

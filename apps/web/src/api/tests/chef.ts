import { describe, expect, it } from "vitest"
import { ImmeubleSchema } from "@/api/state/schema"
import { CHEF_DEFAUT, chefDe } from "@/api/term/chef"

const base = {
	selection: { slug: "a", source: "defaut", refus: "" },
	epingle: "",
	toit: {
		chef: { vivant: null },
		todo: 0,
		urgent: 0,
		etages: 0,
		dormants: 0,
		alerte: { niveau: "", texte: "" },
	},
	etages: [],
	sous_sol: [],
	mesure_ms: 0,
}
const chef = (cle: string, etages: string[]) => ({
	cle,
	defaut: false,
	vivant: true,
	etages,
	pid: 1,
	depuis: null,
})

describe("chefDe", () => {
	it("étage tenu ⇒ clé du tenant", () => {
		const im = ImmeubleSchema.parse({
			...base,
			chefs: [chef("c2", ["a", "b"])],
		})
		expect(chefDe(im, "b")).toBe("c2")
	})
	it("étage non tenu ⇒ défaut", () => {
		const im = ImmeubleSchema.parse({ ...base, chefs: [chef("c2", ["a"])] })
		expect(chefDe(im, "z")).toBe(CHEF_DEFAUT)
	})
	it("étage null ⇒ défaut", () => {
		const im = ImmeubleSchema.parse({ ...base, chefs: [chef("c2", ["a"])] })
		expect(chefDe(im, null)).toBe(CHEF_DEFAUT)
	})
	it("immeuble HEAD sans chefs ni comptes ⇒ défauts, parse sans erreur", () => {
		const im = ImmeubleSchema.parse(base)
		expect(im.chefs).toBeUndefined()
		expect(im.comptes).toBeUndefined()
		expect(im.toit.chef.cle).toBeUndefined()
		expect(chefDe(im, "a")).toBe(CHEF_DEFAUT)
	})
})

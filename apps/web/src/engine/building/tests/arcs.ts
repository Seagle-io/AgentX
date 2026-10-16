import { describe, expect, it } from "vitest"
import {
	ancre,
	arcsRelais,
	boiteBureau,
	compterDansBoites,
} from "@/engine/building/arcs"
import type { Pt } from "@/engine/building/iso"
import { POS_VAULT } from "@/engine/building/layout"
import type { FluxView } from "@/engine/building/types"

const flux = (de: string, vers: string, etat: FluxView["etat"]): FluxView => ({
	de,
	vers,
	etat,
	objet: "pack",
})
const postes: Record<string, Pt> = {
	a: [1, 2],
	b: [8, 2],
	c: [4.5, 2],
	scribe: [1, 6],
}

describe("arcsRelais", () => {
	it("1 arc par couple de>vers, état de rang max", () => {
		const arcs = arcsRelais(
			[
				flux("a", "b", "attente"),
				flux("a", "b", "actif"),
				flux("a", "b", "livre"),
				flux("b", "a", "bloque"),
			],
			postes,
		)
		expect(arcs).toHaveLength(2)
		expect(arcs.find((x) => x.cle === "a>b")?.etat).toBe("actif")
		expect(arcs.find((x) => x.cle === "b>a")?.etat).toBe("bloque")
	})
	it("vers scribe ⇒ départ du vault", () => {
		const [arc] = arcsRelais([flux("a", "scribe", "livre")], postes)
		expect(arc.a).toEqual(ancre(POS_VAULT))
		expect(arc.b).toEqual(ancre(postes.scribe))
	})
	it("rôle sans poste ⇒ ignoré", () => {
		expect(
			arcsRelais([flux("a", "zz", "actif"), flux("zz", "b", "actif")], postes),
		).toHaveLength(0)
	})
	it("milieu choisi évite la boîte tierce posée sur la droite a→b", () => {
		const [arc] = arcsRelais([flux("a", "b", "actif")], postes)
		const droit: Pt = [(arc.a[0] + arc.b[0]) / 2, (arc.a[1] + arc.b[1]) / 2]
		const boiteC = boiteBureau(postes.c)
		expect(compterDansBoites(arc.a, droit, arc.b, [boiteC])).toBeGreaterThan(0)
		expect(arc.m).not.toEqual(droit)
		expect(compterDansBoites(arc.a, arc.m, arc.b, [boiteC])).toBeLessThan(
			compterDansBoites(arc.a, droit, arc.b, [boiteC]),
		)
	})
})

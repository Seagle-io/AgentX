import { describe, expect, it } from "vitest"
import { contourPlateau, hitTest, type Layout } from "@/engine/building/hit"
import { iso } from "@/engine/building/iso"
import { postesSalle, tourLayout } from "@/engine/building/layout"
import type {
	BuildingScene,
	DeskView,
	FloorView,
} from "@/engine/building/types"

const desks: DeskView[] = [
	{ cle: "a", nom: "A", couleur: "rgb(10 20 30)", actifs: 1, actif: true },
	{ cle: "b", nom: "B", couleur: "rgb(10 20 30)", actifs: 0, actif: false },
]
const floors: FloorView[] = ["p0", "p1"].map((slug, i) => ({
	slug,
	titre: slug,
	num: i,
	dormant: false,
	selected: i === 0,
	agents: [],
	enCours: 0,
	alerte: "",
}))
const scene = (view: BuildingScene["view"]): BuildingScene => ({
	view,
	project: "x",
	floors,
	basement: [],
	roof: { chefAlive: true, todo: 0, urgent: 0, alerte: "" },
	desks,
	flux: [],
	pipeline: [],
	serie: { points: [], valeur: "" },
	abandoned: 0,
	hovered: null,
})
const tour = tourLayout(floors, [])
const layout: Layout = {
	postes: postesSalle(desks),
	floorPlates: tour.etages.map((e) => ({ slug: e.slug, ...e.plaque })),
}

describe("hitTest", () => {
	it("point sur le plateau ⇒ desk", () => {
		const [gx, gy] = layout.postes.b
		const [x, y] = iso(gx + 0.75, gy + 0.45, 1.02)
		expect(hitTest(scene("floor"), layout, x, y)).toEqual({
			kind: "desk",
			cle: "b",
		})
		expect(contourPlateau(gx, gy)).toHaveLength(6)
	})
	it("hors tout ⇒ null (étage et immeuble)", () => {
		expect(hitTest(scene("floor"), layout, 5, 5)).toBeNull()
		expect(hitTest(scene("building"), layout, 5, 5)).toBeNull()
	})
	it("plaque d'étage ⇒ floor", () => {
		const p = layout.floorPlates[1]
		expect(
			hitTest(scene("building"), layout, p.x + p.w / 2, p.y + p.h / 2),
		).toEqual({ kind: "floor", slug: "p1" })
	})
	it("vue immeuble ignore les plateaux", () => {
		const [gx, gy] = layout.postes.a
		const [x, y] = iso(gx + 0.75, gy + 0.45, 1.02)
		expect(hitTest(scene("building"), layout, x, y)).toBeNull()
	})
})

import { describe, expect, it } from "vitest"
import { dimensions, roleDuBureau, salleEtage } from "@/engine/svg/salle"

describe("dimensions (E2)", () => {
	it.each([
		[0, 7, 7.5],
		[1, 7, 7.5],
		[3, 11.4, 7.5],
		[6, 11.4, 7.7],
		[12, 13.6, 9.9],
		[18, 13.6, 14.3],
	])("n=%i ⇒ %f×%f", (n, NX, NY) => {
		const d = dimensions(n)
		expect([d.NX, d.NY]).toEqual([NX, NY])
	})

	it("COLS = 3 jusqu'à 6 bureaux, 4 au-delà", () => {
		expect(dimensions(6).COLS).toBe(3)
		expect(dimensions(7).COLS).toBe(4)
	})
})

describe("roleDuBureau", () => {
	it("coupe au #", () => {
		expect(roleDuBureau("testeur#2")).toBe("testeur")
		expect(roleDuBureau("chef")).toBe("chef")
	})
})

describe("salleEtage viewBox", () => {
	it("ajusté au sol + mur, largeur ×1,25", () => {
		const vue = {
			desks: [],
			flux: [],
			pipeline: { bloque: 0, enCours: 0, faits: 0 },
			abandonnees: 0,
			props: { slug: "x" },
			hovered: null,
		}
		const svg = salleEtage(vue)
		const m = svg.match(
			/viewBox="(-?\d+) (-?\d+) (\d+) (\d+)" width="([\d.]+)"/,
		)
		expect(m).not.toBeNull()
		expect(Number(m?.[5])).toBe(Number(m?.[3]) * 1.25)
		expect(svg).not.toContain("0 0 700 480")
	})
})

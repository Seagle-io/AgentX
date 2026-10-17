import { describe, expect, it } from "vitest"
import { HZ, isoT, type P3, T_NX, T_NY, T_S, TS } from "@/engine/svg/coupe"
import { mascotteBox } from "@/engine/svg/fantome"
import { bureauBox, propsNiveau } from "@/engine/svg/meuble"
import { type TourVue, tourImmeuble } from "@/engine/svg/tour"

const vue = (n: number): TourVue => ({
	etages: ["salle-v2", "agentx"].map((slug, i) => ({
		slug,
		titre: slug,
		num: i + 1,
		compteurs: { enCours: 0, revue: 0, bloque: 0 },
		alerte: { texte: "", niveau: "ok" } as never,
		agents: Array.from({ length: n }, (_, k) => ({
			role: `r${k}`,
			couleur: "#ffffff",
			bloque: false,
		})),
		selection: false,
		dormant: false,
	})),
	chef: { vivant: null },
	todo: 0,
	urgent: 0,
	sousSol: [],
})

const props = (t: string) => t.match(/<g class="tour-prop"[^>]*>/g) ?? []

describe("props de tour et fantômes (T136)", () => {
	it("0 vs 4 agents ⇒ même chaîne tour-prop", () => {
		const zero = props(tourImmeuble(vue(0))).join("")
		expect(zero).not.toBe("")
		expect(props(tourImmeuble(vue(4))).join("")).toBe(zero)
	})

	it("aucun prop sur la zone d'un fantôme des 4 slots", () => {
		const P: P3 = (x, y, z = 0) => isoT(x, y, z, 30, 80, T_S)
		const taille = 0.95
		const [x0, pas] = [2.2, 1.5]
		const xs = [0, 1, 2, 3].map((k) => x0 + k * pas)
		const zs = TS
		for (const slug of ["salle-v2", "agentx"]) {
			const { boxes } = propsNiveau(slug, P, x0, zs, taille, {
				occupes: xs.map((x) => bureauBox(P, x, zs, taille)),
				haut: HZ,
				nx: T_NX,
				ny: T_NY,
			})
			expect(boxes.length).toBeGreaterThan(0)
			for (const x of xs) {
				const [mx, my] = P(x - 0.12, 0.5, zs)
				const m = mascotteBox(mx, my + 2 * taille, taille)
				for (const b of boxes)
					expect(b[0] < m[2] && m[0] < b[2] && b[1] < m[3] && m[1] < b[3]).toBe(
						false,
					)
			}
		}
	})
})

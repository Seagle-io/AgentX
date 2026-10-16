// Hit-test en repère logique 700×480 (pur, sans ctx)

import { contourBoite, type Pt } from "@/engine/building/iso"
import type { BuildingScene } from "@/engine/building/types"

export type Hit =
	| { kind: "floor"; slug: string }
	| { kind: "desk"; cle: string }
	| null
export type Layout = {
	postes: Record<string, [number, number]>
	floorPlates: { slug: string; x: number; y: number; w: number; h: number }[]
}

// plateau du bureau : même boîte que room.ts
export const PLATEAU = { z: 0.95, w: 1.5, d: 0.9, h: 0.14 }

export function contourPlateau(gx: number, gy: number): Pt[] {
	return contourBoite(gx, gy, PLATEAU.z, PLATEAU.w, PLATEAU.d, PLATEAU.h)
}

// lancer de rayon (pair/impair)
export function dansPolygone([px, py]: Pt, poly: Pt[]): boolean {
	let dedans = false
	for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
		const [xi, yi] = poly[i]
		const [xj, yj] = poly[j]
		const coupe =
			yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi
		if (coupe) dedans = !dedans
	}
	return dedans
}

export function hitTest(
	scene: BuildingScene,
	layout: Layout,
	x: number,
	y: number,
): Hit {
	if (scene.view === "building") {
		const p = layout.floorPlates.find(
			(f) => x >= f.x && x <= f.x + f.w && y >= f.y && y <= f.y + f.h,
		)
		return p ? { kind: "floor", slug: p.slug } : null
	}
	// premier plan d'abord : x+y décroissant
	const desks = [...scene.desks]
		.map((d) => ({ cle: d.cle, p: layout.postes[d.cle] }))
		.filter((d): d is { cle: string; p: Pt } => d.p !== undefined)
		.sort((u, v) => v.p[0] + v.p[1] - (u.p[0] + u.p[1]))
	const touche = desks.find((d) =>
		dansPolygone([x, y], contourPlateau(d.p[0], d.p[1])),
	)
	return touche ? { kind: "desk", cle: touche.cle } : null
}

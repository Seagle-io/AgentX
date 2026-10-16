// mountBuilding : moteur canvas 2D, 0 DOM global (canvas et frame injectés)

import {
	type Animateur,
	creerAnimateur,
	DUREE_COLIS,
} from "@/engine/building/anim"
import { type Arc, arcsRelais } from "@/engine/building/arcs"
import { hitTest, type Layout } from "@/engine/building/hit"
import { meet } from "@/engine/building/iso"
import { postesSalle, type Tour, tourLayout } from "@/engine/building/layout"
import { dessinerSalle } from "@/engine/building/room"
import { dessinerTour } from "@/engine/building/tower"
import type {
	BuildingHandle,
	BuildingInput,
	BuildingScene,
} from "@/engine/building/types"

export type { Hit, Layout } from "@/engine/building/hit"
export type {
	BuildingHandle,
	BuildingInput,
	BuildingPalette,
	BuildingScene,
	DeskView,
	FloorView,
	FluxView,
	PaletteKey,
} from "@/engine/building/types"

// px CSS du canvas → repère logique 700×480 (même `meet` que le dessin)
export function toLogical(
	w: number,
	h: number,
	x: number,
	y: number,
): [number, number] {
	const { s, ox, oy } = meet(w, h)
	return [(x - ox) / s, (y - oy) / s]
}

type Etat = {
	canvas: HTMLCanvasElement
	ctx: CanvasRenderingContext2D
	input: BuildingInput
	w: number
	h: number
	dpr: number
	scene: BuildingScene | null
	cle: string
	layout: Layout
	tour: Tour | null
	arcs: Arc[]
	survol: string | null
	anim: Animateur
}

function dessiner(e: Etat) {
	const { ctx, canvas } = e
	ctx.setTransform(1, 0, 0, 1, 0, 0)
	ctx.fillStyle = e.input.palette.bg
	ctx.fillRect(0, 0, canvas.width, canvas.height)
	if (!e.scene) return
	const { s, ox, oy } = meet(e.w, e.h)
	ctx.setTransform(e.dpr * s, 0, 0, e.dpr * s, e.dpr * ox, e.dpr * oy)
	const a = e.anim.etat()
	if (e.scene.view === "floor")
		dessinerSalle(ctx, e.scene, e.layout, e.input.palette, e.arcs, a.colis)
	else if (e.tour) dessinerTour(ctx, e.scene, e.tour, e.input.palette, a.cabine)
}

// nouvelle scène : géométrie, arcs, animations à déclencher
function appliquer(e: Etat, scene: BuildingScene) {
	const avant = new Map(e.arcs.map((a) => [a.cle, a.etat]))
	e.scene = scene
	e.tour = tourLayout(scene.floors, scene.basement)
	e.layout = {
		postes: postesSalle(scene.desks),
		floorPlates: e.tour.etages.map((et) => ({ slug: et.slug, ...et.plaque })),
	}
	e.arcs = arcsRelais(scene.flux, e.layout.postes)
	if (scene.view === "floor") {
		for (const a of e.arcs) {
			if (avant.get(a.cle) === a.etat) continue
			if (a.etat === "actif" || a.etat === "livre")
				e.anim.colis(a.cle, DUREE_COLIS[a.etat])
		}
	}
	const sel = e.tour.etages.find(
		(et) => scene.floors.find((f) => f.slug === et.slug)?.selected,
	)
	if (sel) e.anim.cabine(sel.zBas)
	e.anim.demarrer()
}

function pointer(
	e: Etat,
	ev: { type: "move" | "click" | "leave"; x: number; y: number },
) {
	if (!e.scene) return
	const emettre = (cle: string | null) => {
		if (cle === e.survol) return
		e.survol = cle
		e.input.onHoverDesk(cle)
	}
	if (ev.type === "leave") {
		emettre(null)
		return
	}
	const [x, y] = toLogical(e.w, e.h, ev.x, ev.y)
	const hit = hitTest(e.scene, e.layout, x, y)
	if (ev.type === "move") emettre(hit?.kind === "desk" ? hit.cle : null)
	else if (hit?.kind === "floor") e.input.onSelectFloor(hit.slug)
}

export function mountBuilding(
	canvas: HTMLCanvasElement,
	input: BuildingInput,
): BuildingHandle {
	const ctx = canvas.getContext("2d")
	if (!ctx) throw new Error("canvas 2d indisponible")
	const e: Etat = {
		canvas,
		ctx,
		input,
		w: canvas.width,
		h: canvas.height,
		dpr: 1,
		scene: null,
		cle: "",
		layout: { postes: {}, floorPlates: [] },
		tour: null,
		arcs: [],
		survol: null,
		anim: creerAnimateur(input.frame, input.reducedMotion, () => dessiner(e)),
	}
	return {
		update(scene) {
			const cle = JSON.stringify(scene)
			if (cle === e.cle) return
			e.cle = cle
			appliquer(e, scene)
			dessiner(e)
		},
		resize(w, h, dpr) {
			e.w = w
			e.h = h
			e.dpr = dpr
			canvas.width = Math.round(w * dpr)
			canvas.height = Math.round(h * dpr)
			dessiner(e)
		},
		pointer: (ev) => pointer(e, ev),
		destroy() {
			e.anim.destroy()
			e.scene = null
			e.cle = ""
		},
	}
}

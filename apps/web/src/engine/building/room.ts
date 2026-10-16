// Vue étage : sol, murs, objets, bureaux, mascottes, arcs (ctx reçu, non testé)

import { type Arc, dessinerArcs } from "@/engine/building/arcs"
import { contourPlateau, type Layout, PLATEAU } from "@/engine/building/hit"
import {
	boite,
	iso,
	mascotte,
	ombrer,
	type Pt,
	polygone,
	texte,
} from "@/engine/building/iso"
import { MUR, NX, NY, OBJETS, type Objet } from "@/engine/building/layout"
import type {
	BuildingPalette,
	BuildingScene,
	DeskView,
	PaletteKey,
} from "@/engine/building/types"

const TAILLES = [1, 0.85, 0.72, 0.62]
const FORME_OBJET: Record<
	Objet["nom"],
	{ w: number; d: number; h: number; couleur: PaletteKey }
> = {
	vault: { w: 1, d: 1, h: 1.6, couleur: "muted" },
	fusee: { w: 0.5, d: 0.5, h: 2.2, couleur: "accent" },
	radar: { w: 0.8, d: 0.8, h: 0.5, couleur: "success" },
	poubelle: { w: 0.5, d: 0.5, h: 0.7, couleur: "border" },
	plante: { w: 0.45, d: 0.45, h: 0.9, couleur: "success" },
}

export function dessinerSalle(
	ctx: CanvasRenderingContext2D,
	scene: BuildingScene,
	layout: Layout,
	palette: BuildingPalette,
	arcs: Arc[],
	colis: Map<string, number>,
) {
	dessinerSol(ctx, palette)
	dessinerMurs(ctx, palette)
	// peintre : x+y croissant, objets et bureaux mêlés
	const elements: { ordre: number; dessiner(): void }[] = OBJETS.map((o) => ({
		ordre: o.x + o.y,
		dessiner: () => dessinerObjet(ctx, o, palette),
	}))
	for (const d of scene.desks) {
		const p = layout.postes[d.cle]
		if (!p) continue
		elements.push({
			ordre: p[0] + p[1],
			dessiner: () =>
				dessinerBureau(ctx, d, p, palette, scene.hovered === d.cle),
		})
	}
	elements.sort((u, v) => u.ordre - v.ordre)
	for (const e of elements) e.dessiner()
	dessinerArcs(ctx, arcs, palette, colis)
}

function dessinerSol(ctx: CanvasRenderingContext2D, palette: BuildingPalette) {
	polygone(
		ctx,
		[iso(0, 0), iso(NX, 0), iso(NX, NY), iso(0, NY)],
		palette.surface,
	)
	ctx.strokeStyle = palette.border
	ctx.lineWidth = 1
	ctx.globalAlpha = 0.6
	ctx.beginPath()
	for (let i = 0; i <= NX; i++) {
		ctx.moveTo(...iso(i, 0))
		ctx.lineTo(...iso(i, NY))
	}
	for (let j = 0; j <= NY; j++) {
		ctx.moveTo(...iso(0, j))
		ctx.lineTo(...iso(NX, j))
	}
	ctx.stroke()
	ctx.globalAlpha = 1
}

// 2 murs du fond : x=0 et y=0
function dessinerMurs(ctx: CanvasRenderingContext2D, palette: BuildingPalette) {
	polygone(
		ctx,
		[iso(0, 0, MUR), iso(0, NY, MUR), iso(0, NY), iso(0, 0)],
		ombrer(palette.panel, 0.85),
		palette.border,
	)
	polygone(
		ctx,
		[iso(0, 0, MUR), iso(NX, 0, MUR), iso(NX, 0), iso(0, 0)],
		palette.panel,
		palette.border,
	)
}

function dessinerObjet(
	ctx: CanvasRenderingContext2D,
	o: Objet,
	palette: BuildingPalette,
) {
	const f = FORME_OBJET[o.nom]
	boite(ctx, o.x - f.w / 2, o.y - f.d / 2, 0, f.w, f.d, f.h, palette[f.couleur])
}

function dessinerBureau(
	ctx: CanvasRenderingContext2D,
	d: DeskView,
	[gx, gy]: Pt,
	palette: BuildingPalette,
	surligne: boolean,
) {
	const pied = ombrer(d.couleur, 0.5)
	boite(ctx, gx + 0.08, gy + 0.6, 0, 0.12, 0.12, PLATEAU.z, pied)
	boite(ctx, gx + PLATEAU.w - 0.2, gy + 0.6, 0, 0.12, 0.12, PLATEAU.z, pied)
	boite(ctx, gx, gy, PLATEAU.z, PLATEAU.w, PLATEAU.d, PLATEAU.h, d.couleur)
	if (surligne) {
		ctx.lineWidth = 2
		polygone(ctx, contourPlateau(gx, gy), undefined, palette.accent)
	}
	dessinerEcran(ctx, iso(gx + 0.75, gy + 0.55, PLATEAU.z + PLATEAU.h), palette)
	// mascottes assises derrière le plateau, côté mur, dessinées après (devant en z)
	dessinerMascottes(ctx, d, iso(gx + 0.75, gy - 0.55, PLATEAU.z), palette)
	const [lx, ly] = iso(gx + 0.75, gy + 0.9, 0)
	texte(ctx, d.nom, lx, ly + 10, d.actif ? palette.text : palette.muted, 11)
}

// écran statique : 0 barre animée
function dessinerEcran(
	ctx: CanvasRenderingContext2D,
	[x, y]: Pt,
	palette: BuildingPalette,
) {
	ctx.fillStyle = palette.panel
	ctx.strokeStyle = palette.border
	ctx.lineWidth = 1
	ctx.fillRect(x - 12, y - 18, 24, 15)
	ctx.strokeRect(x - 12, y - 18, 24, 15)
	ctx.fillStyle = palette.muted
	ctx.fillRect(x - 8, y - 12, 16, 2)
}

function dessinerMascottes(
	ctx: CanvasRenderingContext2D,
	d: DeskView,
	[ax, ay]: Pt,
	palette: BuildingPalette,
) {
	const n = Math.min(Math.max(d.actifs, 1), 4)
	const t = TAILLES[n - 1]
	const pas = 23 * t * 0.75
	ctx.globalAlpha = d.actif ? 1 : 0.55
	for (let i = 0; i < n; i++)
		mascotte(ctx, ax + (i - (n - 1) / 2) * pas, ay, d.couleur, t, palette.bg)
	if (d.actifs > n)
		texte(
			ctx,
			`+${d.actifs - n}`,
			ax + (n / 2) * pas + 10,
			ay - 8,
			palette.text,
			11,
			"left",
			true,
		)
	ctx.globalAlpha = 1
}

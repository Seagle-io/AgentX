// Vue immeuble : sous-sol, étages, plaques, toit, cabine (ctx reçu, non testé)

import {
	boite,
	mascotte,
	type Proj,
	polygone,
	TH,
	TW,
	texte,
} from "@/engine/building/iso"
import {
	type Plaque,
	T_LW,
	T_LX,
	T_NX,
	T_NY,
	T_OX,
	T_S,
	type Tour,
} from "@/engine/building/layout"
import type {
	BuildingPalette,
	BuildingScene,
	FloorView,
} from "@/engine/building/types"

const MAX_MASCOTTES = 12

// même formule que iso, échelle T_S, origine (T_OX, sol), z en px
export function projTour(tour: Tour): Proj {
	return (x, y, z) => [
		T_OX + (x - y) * TW * T_S,
		tour.sol + (x + y) * TH * T_S - z,
	]
}

export function dessinerTour(
	ctx: CanvasRenderingContext2D,
	scene: BuildingScene,
	tour: Tour,
	palette: BuildingPalette,
	cabineZ: number | null,
) {
	const proj = projTour(tour)
	dessinerSousSol(ctx, scene.basement, tour, palette, proj)
	for (let i = tour.etages.length - 1; i >= 0; i--) {
		dessinerEtage(
			ctx,
			scene.floors[i],
			tour.etages[i].zBas,
			tour,
			palette,
			proj,
		)
		dessinerPlaque(ctx, scene.floors[i], tour.etages[i].plaque, palette)
	}
	dessinerToit(ctx, scene.roof, tour, palette, proj)
	if (cabineZ !== null && tour.etages.length > 0) {
		boite(
			ctx,
			T_NX + 0.2,
			0.1,
			cabineZ + 2,
			0.5,
			0.5,
			Math.max(8, tour.hF - 4),
			palette.accent,
			proj,
		)
	}
}

// plaques du sous-sol : projets clos
function dessinerSousSol(
	ctx: CanvasRenderingContext2D,
	basement: BuildingScene["basement"],
	tour: Tour,
	palette: BuildingPalette,
	proj: Proj,
) {
	for (let j = basement.length - 1; j >= 0; j--) {
		const p = tour.sousSol[j].plaque
		boite(
			ctx,
			0,
			0,
			tour.yRef - p.y - p.h,
			T_NX,
			T_NY,
			p.h,
			palette.border,
			proj,
		)
		ctx.fillStyle = palette.border
		ctx.fillRect(p.x, p.y, p.w, p.h)
		texte(
			ctx,
			basement[j].titre,
			p.x + 8,
			p.y + p.h / 2,
			palette.muted,
			Math.min(10, p.h),
			"left",
		)
	}
}

function dessinerEtage(
	ctx: CanvasRenderingContext2D,
	f: FloorView,
	zBas: number,
	tour: Tour,
	palette: BuildingPalette,
	proj: Proj,
) {
	boite(
		ctx,
		0,
		0,
		zBas,
		T_NX,
		T_NY,
		tour.hF,
		f.selected ? palette.panel : palette.surface,
		proj,
	)
	// lumière : dormant→border · agents→success · sinon surface
	const lum = f.dormant
		? palette.border
		: f.agents.length > 0
			? palette.success
			: palette.surface
	const z1 = zBas + tour.hF * 0.3
	const z2 = zBas + tour.hF * 0.72
	for (let x = 0.5; x + 0.6 <= T_NX; x += 1) {
		polygone(
			ctx,
			[
				proj(x, T_NY, z1),
				proj(x + 0.6, T_NY, z1),
				proj(x + 0.6, T_NY, z2),
				proj(x, T_NY, z2),
			],
			lum,
		)
	}
}

function dessinerPlaque(
	ctx: CanvasRenderingContext2D,
	f: FloorView,
	p: Plaque,
	palette: BuildingPalette,
) {
	ctx.fillStyle = palette.panel
	ctx.fillRect(p.x, p.y, p.w, p.h)
	ctx.strokeStyle = f.selected ? palette.accent : palette.border
	ctx.lineWidth = f.selected ? 2 : 1
	ctx.strokeRect(p.x, p.y, p.w, p.h)
	if (f.alerte !== "") {
		ctx.fillStyle = f.alerte === "bloque" ? palette.error : palette.warning
		ctx.beginPath()
		ctx.arc(p.x + 8, p.y + p.h / 2, 3, 0, Math.PI * 2)
		ctx.fill()
	}
	texte(
		ctx,
		`${f.num} ${f.titre}`,
		p.x + 16,
		p.y + p.h / 2,
		f.dormant ? palette.muted : palette.text,
		Math.min(13, p.h * 0.55),
		"left",
	)
	const n = Math.min(MAX_MASCOTTES, f.agents.length)
	const t = Math.min(0.6, (p.h / 25) * 0.8)
	const pas = 23 * t * 0.8
	const xr = p.x + p.w - 10
	for (let i = 0; i < n; i++)
		mascotte(ctx, xr - i * pas, p.y + p.h - 3, palette.accent, t, palette.bg)
	const plus = f.enCours - n
	if (plus > 0)
		texte(
			ctx,
			`+${plus}`,
			xr - n * pas - 4,
			p.y + p.h / 2,
			palette.text,
			10,
			"right",
			true,
		)
}

function dessinerToit(
	ctx: CanvasRenderingContext2D,
	roof: BuildingScene["roof"],
	tour: Tour,
	palette: BuildingPalette,
	proj: Proj,
) {
	boite(ctx, 0, 0, tour.toitZ, T_NX, T_NY, tour.toitH, palette.panel, proj)
	const [cx, cy] = proj(T_NX / 2, T_NY / 2, tour.toitZ + tour.toitH)
	ctx.fillStyle =
		roof.chefAlive === null
			? palette.muted
			: roof.chefAlive
				? palette.success
				: palette.error
	ctx.beginPath()
	ctx.arc(cx, cy, 5, 0, Math.PI * 2)
	ctx.fill()
	const y = tour.yRef - tour.toitZ - tour.toitH / 2
	texte(ctx, `${roof.todo}`, T_LX + 16, y, palette.text, 13, "left", true)
	if (roof.urgent > 0)
		texte(
			ctx,
			`${roof.urgent}`,
			T_LX + 56,
			y,
			palette.warning,
			13,
			"left",
			true,
		)
	if (roof.alerte !== "")
		texte(ctx, roof.alerte, T_LX + T_LW - 8, y, palette.error, 11, "right")
}

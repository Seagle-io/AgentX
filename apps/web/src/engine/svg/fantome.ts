// Fantôme v1 : mascotte billboard, frange b2,
// yeux rouges glow si bloqué ; équipe et bureau de la salle.
import {
	type Box,
	boite,
	COLOR_BLOCKED,
	type Drawn,
	etiquette,
	iso,
	union,
} from "@/engine/svg/iso"

const f2 = (n: number) => n.toFixed(2)

// Un pan de frange fermé, débordant de h·0,12 dans le corps (0 jour au repli).
const pan = (w: number, h: number, k: number) => {
	const x = w - k * w * 0.25
	return `M${f2(x)} ${f2(h * 0.74)} L${f2(x)} ${f2(h * 0.86)} q ${f2(-w * (k % 2 ? 0.12 : 0.13))} ${f2(h * 0.16)} ${f2(-w * 0.25)} 0 L${f2(x - w * 0.25)} ${f2(h * 0.74)} Z`
}

/**
 * Filtres des yeux non défaut, définis UNE fois par page (galerie :
 * SalleVivanteSection ; immeuble : `tourImmeuble`) : ids uniques, dark/light
 * les partagent. Pas de ×t : seuls les fantômes bloqués les utilisent.
 */
export const GLOW_DEFS = `<filter id="v1-glow-oeil" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><filter id="v1-halo-oeil" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation="2.2"/></filter>`

/** v1 mascotte en espace écran (billboard) ; bas en 4 franges */
export function mascotte(
	sx: number,
	sy: number,
	couleur: string,
	taille = 1,
	retard = 0,
	oeil = "#06070c",
) {
	const w = 23 * taille
	const h = 25 * taille
	const vif = oeil !== "#06070c"
	const yeux = [
		[w * 0.25, h * 0.4, w * 0.14, h * 0.19, w * 0.07],
		[w * 0.61, h * 0.4, w * 0.14, h * 0.19, w * 0.07],
	]
	const rect = (
		x: number,
		y: number,
		rw: number,
		rh: number,
		rx: number,
		extra: string,
	) =>
		`<rect class="eye" x="${x}" y="${y}" width="${rw}" height="${rh}" rx="${rx}" fill="${oeil}" ${extra} ${d}/>`
	const d = retard ? `style="animation-delay:${retard.toFixed(2)}s"` : ""
	const plein = `<path d="M0 ${h * 0.42} a ${w / 2} ${h * 0.45} 0 0 1 ${w} 0 L${w} ${h * 0.86}
               q ${-w * 0.13} ${h * 0.16} ${-w * 0.25} 0 q ${-w * 0.12} ${h * 0.16} ${-w * 0.25} 0
               q ${-w * 0.13} ${h * 0.16} ${-w * 0.25} 0 q ${-w * 0.12} ${h * 0.16} ${-w * 0.25} 0 Z"
            fill="${couleur}"/>`
	const franges = [0, 1, 2, 3]
		.map(
			(k) =>
				`<path class="v1-frange" d="${pan(w, h, k)}" fill="${couleur}" style="animation-delay:${f2(k * 0.3)}s"/>`,
		)
		.join("")
	return `<g transform="translate(${(sx - w / 2).toFixed(1)},${(sy - h).toFixed(1)})">
    <ellipse cx="${w / 2}" cy="${h + 3}" rx="${w * 0.44}" ry="${w * 0.17}" fill="#000" opacity=".45"/>
    <g class="mascotte" ${d}>
      ${plein}${franges}
      ${vif ? `<g class="v1-halo">${yeux.map(([x, y, rw, rh, rx]) => rect(x, y, rw, rh, rx, `filter="url(#v1-halo-oeil)"`)).join("")}</g><g class="v1-glow">` : ""}
      ${yeux.map(([x, y, rw, rh, rx]) => rect(x, y, rw, rh, rx, vif ? `filter="url(#v1-glow-oeil)"` : "")).join("")}
      ${vif ? "</g>" : ""}
    </g>
  </g>`
}
// bob = −3 px ; ombre sous les pieds.
export const mascotteBox = (sx: number, sy: number, taille = 1): Box => [
	sx - 11.5 * taille,
	sy - 25 * taille - 3,
	sx + 11.5 * taille,
	sy + 3 + 4 * taille,
]

/** v1 rangée d'instances d'un poste ; 0 agent ⇒ 0 fantôme ; `bloques` = indices immobiles aux yeux rouges ; `rendus` = indices atténués immobiles */
export function equipe(
	mx: number,
	my: number,
	couleur: string,
	agents: number,
	bloques: number[] = [],
	rendus: number[] = [],
) {
	const montre = Math.min(agents, 4)
	const t = [1, 0.85, 0.72, 0.62][Math.max(montre, 1) - 1]
	const gauche = mx - 11.5
	const pas = 23 * t * 0.75
	const xs = Array.from(
		{ length: montre },
		(_, k) => gauche + (23 * t) / 2 + k * pas,
	)
	const droite = montre ? xs[montre - 1] + (23 * t) / 2 : gauche + 23
	const un = (x: number, k: number) => {
		if (bloques.includes(k))
			return `<g class="v1-bloque">${mascotte(x, my + 7, couleur, t, k * 0.37, COLOR_BLOCKED)}</g>`
		if (rendus.includes(k))
			return `<g class="v1-rendu">${mascotte(x, my + 7, couleur, t, k * 0.37)}</g>`
		return mascotte(x, my + 7, couleur, t, k * 0.37)
	}
	const svg = montre
		? xs.map(un).join("") +
			(agents > montre
				? `<text x="${(droite + 4).toFixed(1)}" y="${(my + 4).toFixed(1)}"
             font-family="ui-monospace,monospace" font-size="8" fill="${couleur}">+${agents - montre}</text>`
				: "")
		: ""
	const box: Box = [gauche, my - 21, droite + 18, my + 14]
	return { svg, box, montre, gauche, droite }
}

/** T128 : S1 « atelier », S2 « studio » (galerie : l'humain choisit) */
export type VarianteSalle = "S1" | "S2"

const PLATEAU = 1.09 // dessus du plateau : plaque et emprise ne bougent pas
const ligneIso = (a: [number, number], b: [number, number], extra: string) =>
	`<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" ${extra}/>`

/** bureau seul (ombre, pieds, plateau) : S1 pieds + chant 3 px, S2 plateau 5 px sans pied */
export function meubleBureau(
	gx: number,
	gy: number,
	variante: VarianteSalle = "S1",
) {
	const [cx, cy] = iso(gx + 0.75, gy + 0.5, 0)
	if (variante === "S2") {
		const sol = [
			[gx + 0.06, gy + 0.06],
			[gx + 1.5, gy + 0.06],
			[gx + 1.5, gy + 0.9],
			[gx + 0.06, gy + 0.9],
		]
			.map(([x, y]) => iso(x, y, 0).map((n) => n.toFixed(1)))
			.join(" ")
		return `<polygon points="${sol}" fill="#000" opacity=".2"/>
    ${boite(gx, gy, PLATEAU - 0.25, 1.5, 0.9, 0.25, "#4a5675")}`
	}
	// ombre douce : 3 ellipses dégressives, 0 flou CSS
	const ombre = (
		[
			[43, 21, 0.05],
			[36, 17.5, 0.12],
			[28, 13.5, 0.25],
		] as const
	)
		.map(
			([rx, ry, a]) =>
				`<ellipse cx="${cx.toFixed(1)}" cy="${(cy + 17).toFixed(1)}" rx="${rx}" ry="${ry}" fill="#000" opacity="${a}"/>`,
		)
		.join("")
	// chant : arêtes avant du plateau éclairées
	const arete = `stroke="#8e9bbb" stroke-width=".8" stroke-opacity=".6" stroke-linecap="round"`
	const avant = iso(gx, gy + 0.9, PLATEAU)
	const coin = iso(gx + 1.5, gy + 0.9, PLATEAU)
	const fond = iso(gx + 1.5, gy, PLATEAU)
	return `${ombre}
    ${boite(gx + 0.08, gy + 0.08, 0, 0.1, 0.74, PLATEAU - 0.15, "#7d8bab")}
    ${boite(gx + 1.32, gy + 0.08, 0, 0.1, 0.74, PLATEAU - 0.15, "#7d8bab")}
    ${boite(gx, gy, PLATEAU - 0.15, 1.5, 0.9, 0.15, "#4f5b7a")}
    ${ligneIso(avant, coin, arete)}${ligneIso(coin, fond, arete)}`
}

/** v1 poste de travail complet, `actif` = classe posée par la v1 ; 0 chaise (humain) */
export function bureau(
	nom: string,
	gx: number,
	gy: number,
	couleur: string,
	agents = 0,
	actif = false,
	variante: VarianteSalle = "S1",
): Drawn {
	const [cx, cy] = iso(gx + 0.75, gy + 0.5, 0)
	const [mx, my] = iso(gx + 0.75, gy + 1.5, 0)
	const eq = equipe(mx, my, couleur, agents)
	const svg = `<g class="desk${actif ? " actif" : ""}">
    <ellipse class="desk-ring" cx="${cx.toFixed(1)}" cy="${(cy + 16).toFixed(1)}" rx="50" ry="25"
             fill="none" stroke="${couleur}" stroke-width="1.6"/>
    ${meubleBureau(gx, gy, variante)}
    ${eq.svg}
  </g>`
	const [lx, ly] = iso(gx + 0.75, gy + 0.9, 1.09)
	const titre = eq.montre > 1 ? `${nom} ×${agents}` : nom
	const plaque = etiquette({
		x: lx,
		y: ly,
		t: titre,
		c: couleur,
		w: titre.length * 5.1,
	})
	// anneau `ring` : scale(1.25) au pic
	const ring: Box = [cx - 62.5, cy + 16 - 31.25, cx + 62.5, cy + 16 + 31.25]
	return {
		svg: svg + plaque.svg,
		box: union(ring, eq.box, plaque.box),
	}
}

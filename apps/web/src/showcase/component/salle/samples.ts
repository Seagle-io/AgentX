// Catalogue des vignettes : un appel aux fonctions v1 par état ou variante.
// `fn` et `state` sont les noms v1 (non traduits) ; `box` = emprise ×1.
import { cabine, plaqueEtage, toit } from "@/engine/svg/coupe"
import { bureau, equipe, mascotte, mascotteBox } from "@/engine/svg/fantome"
import {
	type Box,
	COLOR_BLOCKED,
	type Drawn,
	ROLE_COLORS,
	union,
} from "@/engine/svg/iso"
import { tourMeublee } from "@/engine/svg/meuble"
import { rack } from "@/engine/svg/objets"
import {
	aquarium,
	bocal,
	cafe,
	cartons,
	etagere,
	extincteur,
	imprimante,
	lampe,
	lampeAlerte,
	plante1,
	plante2,
	plante3,
	tableau,
} from "@/engine/svg/props"
import { hauteurTour, largeurTour, tourImmeuble } from "@/engine/svg/tour"
import arcBActif from "@/showcase/component/salle/galerie/arc-b-actif"
import arcBBloque from "@/showcase/component/salle/galerie/arc-b-bloque"
import fusee1Active from "@/showcase/component/salle/galerie/fusee-1-active"
import fusee1Calme from "@/showcase/component/salle/galerie/fusee-1-calme"
import poubelleP1Pleine from "@/showcase/component/salle/galerie/poubelle-p1-pleine"
import poubelleP1Vide from "@/showcase/component/salle/galerie/poubelle-p1-vide"
import salleCalme from "@/showcase/component/salle/galerie/salle-calme"
import salleChargee from "@/showcase/component/salle/galerie/salle-chargee"
import salleS1 from "@/showcase/component/salle/galerie/salle-s1"
import tourT1 from "@/showcase/component/salle/galerie/tour-t1"

export type Sample = Drawn & {
	id: string
	group:
		| "ghost"
		| "desk"
		| "object"
		| "arcs"
		| "prop"
		| "signal"
		| "tower"
		| "salle"
	fn: string
	state: string
	tower?: boolean
}

const IMPL = "#ff8a3d"
const CHEF = "#3b82f6"

// 6 fantômes côte à côte, un par couleur de rôle.
const row = (wrap: (g: string) => string): Drawn => ({
	svg: wrap(
		ROLE_COLORS.map(([, c], i) => mascotte(i * 30, 30, c, 1, i * 0.37)).join(
			"",
		),
	),
	box: union(mascotteBox(0, 30), mascotteBox(150, 30)),
})

// Fantôme bloqué : yeux rouges clignotants + glow.
const blocked = (c: string): Drawn => ({
	svg: mascotte(0, 30, c, 1, 0, COLOR_BLOCKED),
	box: mascotteBox(0, 30),
})

const team = (n: number, bloques: number[] = []): Drawn => {
	const e = equipe(0, 30, IMPL, n, bloques)
	return { svg: `<g class="desk actif">${e.svg}</g>`, box: e.box }
}

const ghosts: Omit<Sample, "group">[] = [
	{
		id: "ghost-idle",
		fn: "mascotte",
		state: "idle · 6 rôles",
		...row((g) => g),
	},
	{
		id: "ghost-work-6",
		fn: "mascotte",
		state: "travail (.desk.actif) · 6 rôles",
		...row((g) => `<g class="desk actif">${g}</g>`),
	},
	{
		id: "ghost-blocked-cligne",
		fn: "mascotte",
		state: `bloque · yeux ${COLOR_BLOCKED} clignement`,
		...blocked(IMPL),
	},
	...[2, 3, 4, 6].map((n) => ({
		id: `ghost-x${n}`,
		fn: "bureau › équipe",
		state: `×${n}`,
		...team(n),
	})),
	...[2, 3, 4].map((n) => ({
		id: `team-${n}-1b`,
		fn: "bureau › équipe",
		state: `×${n} · 1 bloqué`,
		...team(n, [1]),
	})),
	{
		id: "team-3-2b",
		fn: "bureau › équipe",
		state: "×3 · 2 bloqués",
		...team(3, [0, 2]),
	},
	{
		id: "team-2-2b",
		fn: "bureau › équipe",
		state: "×2 · 2 bloqués",
		...team(2, [0, 1]),
	},
	{
		id: "ghost-travail",
		fn: "mascotte",
		state: "travail seul (.desk.actif) · frange",
		svg: `<g class="desk actif">${mascotte(0, 40, IMPL)}</g>`,
		box: mascotteBox(0, 40),
	},
]

const desks: Sample[] = [0, 1, 2, 4, 6].map((n) => ({
	id: `desk-${n}`,
	group: "desk",
	fn: "bureau",
	state: n ? `agents ${n} · actif` : "agents 0",
	...bureau("IMPLÉMENTEUR", 0, 0, IMPL, n, n > 0),
}))

const objects: Sample[] = [
	{ id: "rack-1", fn: "rack", state: "n 1", ...rack(0, 0, 1) },
	{ id: "rack-5", fn: "rack", state: "n 5", ...rack(0, 0, 5) },
	{ id: "rack-8", fn: "rack", state: "n 8", ...rack(0, 0, 8) },
	// T110 : fusée F1, 1 fichier par vignette
	fusee1Calme,
	fusee1Active,
	// T132 : corbeille P1 grillagée / P2 bac de tri, 1 fichier par vignette
	poubelleP1Vide,
	poubelleP1Pleine,
].map((s) => ({ ...s, group: "object" }) as Sample)

// T118 : arcs · échanges, impulsion
const arcs: Sample[] = [arcBActif, arcBBloque].map(
	(s) => ({ ...s, group: "arcs" }) as Sample,
)

// T084 : décor sans donnée.
const props: Sample[] = [
	{
		id: "prop-plante-1",
		fn: "plante1",
		state: "P1 · pot + 5 feuilles",
		...plante1(0, 0),
	},
	{
		id: "prop-plante-2",
		fn: "plante2",
		state: "P2 · monstera",
		...plante2(0, 0),
	},
	{
		id: "prop-plante-3",
		fn: "plante3",
		state: "P3 · cactus",
		...plante3(0, 0),
	},
	{ id: "prop-cafe", fn: "cafe", state: "vapeur 2 s", ...cafe(0, 0) },
	{ id: "prop-lampe", fn: "lampe", state: "sur pied", ...lampe(0, 0) },
	{ id: "prop-tableau", fn: "tableau", state: "3 traits", ...tableau(0, 0) },
	{ id: "prop-cartons", fn: "cartons", state: "pile 3", ...cartons(0, 0) },
	{ id: "prop-etagere", fn: "etagere", state: "2 niveaux", ...etagere(0, 0) },
	{ id: "prop-extincteur", fn: "extincteur", state: "—", ...extincteur(0, 0) },
	{ id: "prop-imprimante", fn: "imprimante", state: "—", ...imprimante(0, 0) },
	{
		id: "prop-aquarium",
		fn: "aquarium",
		state: "A1 · couvercle, verre, poisson 6 s, 3 bulles",
		...aquarium(0, 0),
	},
	{
		id: "prop-bocal",
		fn: "bocal",
		state: "A2 · bocal rond, 1 bulle",
		...bocal(0, 0),
	},
].map((s) => ({ ...s, group: "prop" }) as Sample)

// T100 : signal de blocage mural, gyrophare L1.
const signal: Sample[] = [
	{
		id: "signal-lampe-calme",
		fn: "lampeAlerte",
		state: "L1 · gyrophare mural · calme, dôme gris",
		...lampeAlerte(0, 0, false),
	},
	{
		id: "signal-lampe-alerte",
		fn: "lampeAlerte",
		state: "L1 · gyrophare mural · alerte, faisceau 2 s, lueur 1,8 s",
		...lampeAlerte(0, 0, true),
	},
].map((s) => ({ ...s, group: "signal" }) as Sample)

const tower: Sample[] = [
	{
		id: "cabine",
		fn: "construireTour › cabine",
		state: "statique",
		...cabine(false),
	},
	{
		id: "cabine-anim",
		fn: "construireTour › cabine",
		state: "va-et-vient",
		...cabine(true),
	},
	{
		id: "plaque",
		fn: "plaqueTour + tour-etage",
		state: "statique",
		...plaqueEtage(false),
	},
	{
		id: "plaque-sonne",
		fn: "plaqueTour + tour-etage",
		state: "sonne (boucle)",
		...plaqueEtage(true),
	},
	...(["ok", "off", "ko"] as const).map((k) => ({
		id: `toit-${k}`,
		fn: "directionTour + couverture",
		state: `chef ${k}`,
		...toit(k, CHEF),
	})),
	{
		id: "sous-sol",
		fn: "tourImmeuble › sousSol",
		state: "sous-sol · 3 cartons nus · titre au survol",
		svg: tourImmeuble({
			etages: [],
			chef: { vivant: true },
			todo: 0,
			urgent: 0,
			sousSol: [
				{ slug: "compta", titre: "Comptabilité" },
				{ slug: "previsions", titre: "Prévisions de trésorerie" },
				{ slug: "exercices", titre: "Exercices" },
			],
		}),
		box: [0, 0, largeurTour(), hauteurTour(0)],
	},
	tourT1,
	...(
		[
			["a", "salle-v2"],
			["b", "agentx"],
		] as const
	).map(([k, slug]) => {
		const { svg, box } = tourMeublee(slug)
		return {
			id: `tour-meublee-${k}`,
			fn: "tourMeublee + propsNiveau",
			state: `slug ${slug} · 1-3 props/niveau`,
			svg,
			box,
		}
	}),
].map((s) => ({ ...s, group: "tower", tower: true }) as Sample)

// T108 : étage complet composé par `salleEtage`, 1 fichier par vignette.
const salles: Sample[] = [salleCalme, salleChargee, salleS1].map(
	(s) => ({ ...s, group: "salle" }) as Sample,
)

export const SAMPLES: Sample[] = [
	...ghosts.map((s) => ({ ...s, group: "ghost" }) as Sample),
	...desks,
	...objects,
	...arcs,
	...props,
	...signal,
	...tower,
	...salles,
]

export const GROUPS = [
	"ghost",
	"desk",
	"object",
	"arcs",
	"prop",
	"signal",
	"tower",
	"salle",
] as const

// viewBox ×1 avec 6 px de marge : les animations débordent peu (bob −3 px).
export const viewBox = (b: Box) => {
	const m = 6
	return [b[0] - m, b[1] - m, b[2] - b[0] + 2 * m, b[3] - b[1] + 2 * m] as const
}

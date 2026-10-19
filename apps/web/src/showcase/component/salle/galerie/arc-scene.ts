// T118 : scène commune des 2 vignettes d'échange — implémenteur → critique, vault.
import { arcsRelais, type Poste } from "@/engine/svg/arcs"
import { bureau } from "@/engine/svg/fantome"
import { iso, union } from "@/engine/svg/iso"
import { rack } from "@/engine/svg/objets"

const VAULT: [number, number] = [9.6, 1.2]
const DESKS = [
	{ cle: "implementeur", nom: "IMPLÉMENTEUR", c: "#ff8a3d", gx: 1.2, gy: 2 },
	{ cle: "critique", nom: "CRITIQUE", c: "#ff4fd8", gx: 5.7, gy: 2 },
]

export function arcScene(etat: "actif" | "bloque") {
	const desks = DESKS.map((k) => ({
		k,
		...bureau(k.nom, k.gx, k.gy, k.c, 1),
	}))
	// accroches à ±30 px de l'équipe d'1 agent (salle.ts : équipe ±20 px)
	const postes = new Map<string, Poste>(
		desks.map(({ k, box }) => {
			const [mx, my] = iso(k.gx + 0.75, k.gy + 1.5, 0)
			const cotes: Poste["cotes"] = [
				[mx - 30, my - 3],
				[mx + 30, my - 3],
			]
			return [k.cle, { gx: k.gx, gy: k.gy, couleur: k.c, box, cotes }]
		}),
	)
	const flux = [{ de: "implementeur", vers: "critique", etat, objet: "diff" }]
	const arcs = arcsRelais(flux, postes, VAULT, true)
	const vault = rack(...VAULT, 3)
	return {
		svg: `${desks.map((d) => d.svg).join("")}${vault.svg}${arcs.chemins}`,
		box: union(...desks.map((d) => d.box), vault.box, ...arcs.boxes),
	}
}

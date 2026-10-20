import type { Chef } from "@/api/state/schema"
import type { Teinte } from "@/shared/ui/tabs"

export type { Teinte }

const TEINTES: Teinte[] = ["accent", "success", "warning", "error"]

// Teinte du chef par rang dans `choix` (≤ 4 entrées : chefs_max 3 + défaut)
export const teinteChef = (i: number): Teinte => TEINTES[i % TEINTES.length]

// Clé valide d'après le motif servi (state.json) ; motif absent ⇒ le serveur juge
export function cleChefValide(
	cle: string,
	motif: string | undefined,
	defaut: string,
): boolean {
	if (motif === undefined) return true
	return new RegExp(`^(?:${motif})$`).test(cle) && cle !== defaut
}

// Clé dérivée d'une saisie libre : minuscules, sans accents, [a-z0-9] sinon « - », tirets fusionnés et rognés, ≤ 24
export function normaliserCle(saisie: string): string {
	return saisie
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 24)
}

// Nom de compte valide d'après le motif servi ; motif absent ⇒ non vide, le serveur juge
export function nomCompteValide(
	nom: string,
	motif: string | undefined,
): boolean {
	if (motif === undefined) return nom !== ""
	return new RegExp(`^(?:${motif})$`).test(nom)
}

export type AjoutBloque = "plafond" | "etage-tenu" | null

// plafond de chefs vivants atteint, ou étage déjà tenu par un chef dédié
export function ajoutBloque(
	chefs: Pick<Chef, "cle" | "vivant">[],
	chefsMax: number,
	tenant: string,
	defaut: string,
): AjoutBloque {
	if (chefs.filter((c) => c.vivant === true).length >= chefsMax)
		return "plafond"
	return tenant !== defaut ? "etage-tenu" : null
}

// Nom affiché d'un chef : libellé, sinon défaut traduit, sinon clé
export function nomChef(
	c: Pick<Chef, "cle" | "libelle">,
	defaut: string,
	defautTraduit: string,
): string {
	return c.libelle ?? (c.cle === defaut ? defautTraduit : c.cle)
}

// Onglets : libellé = nomChef ;
// `actif` absent de `choix` ⇒ repli sur `defaut`
export function ongletsDe(
	choix: Pick<Chef, "cle" | "libelle">[],
	actif: string,
	defaut: string,
	defautTraduit: string,
): { cle: string; libelle: string; teinte: Teinte; actif: boolean }[] {
	const courant = choix.some((c) => c.cle === actif) ? actif : defaut
	return choix.map((c, i) => ({
		cle: c.cle,
		libelle: nomChef(c, defaut, defautTraduit),
		teinte: teinteChef(i),
		actif: c.cle === courant,
	}))
}

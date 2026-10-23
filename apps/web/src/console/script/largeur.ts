import { TERMINAL_LARGEUR } from "@/shared/lib/store/salle"

export const PAS_CLAVIER = 24

export function bornerLargeur(px: number): number {
	return Math.max(TERMINAL_LARGEUR.min, Math.min(px, TERMINAL_LARGEUR.max))
}

// tiroir collé à droite : glisser vers la gauche (x < x0) agrandit
export function largeurDepuisGlisse(l0: number, x0: number, x: number): number {
	return bornerLargeur(l0 + x0 - x)
}

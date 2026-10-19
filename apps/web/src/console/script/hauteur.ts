import { useState } from "react"

// hauteur du tiroir du chef déplié : bornes, pas clavier, mémoire par navigateur
export const HAUTEUR_MIN = 160
export const HAUTEUR_DEFAUT = 320
export const MARGE_HAUT = 120 // en-tête de page + marge gardés visibles
export const PAS_CLAVIER = 24
export const CLE_HAUTEUR = "agentx.termHauteur"

// plafond < MIN ⇒ MIN
export function borner(h: number, fenetre: number): number {
	return Math.max(HAUTEUR_MIN, Math.min(h, fenetre - MARGE_HAUT))
}

export function pasClavier(key: string): number {
	if (key === "ArrowUp") return PAS_CLAVIER
	if (key === "ArrowDown") return -PAS_CLAVIER
	return 0
}

// SSR-safe ; stockage absent ou jeté ⇒ défaut
export function lireHauteur(): number {
	try {
		const brut = globalThis.localStorage?.getItem(CLE_HAUTEUR)
		const h = Number(brut)
		return brut !== null && Number.isInteger(h) && h > 0 ? h : HAUTEUR_DEFAUT
	} catch {
		return HAUTEUR_DEFAUT
	}
}

export function ecrireHauteur(h: number): void {
	try {
		globalThis.localStorage?.setItem(CLE_HAUTEUR, String(h))
	} catch {
		// quota ou stockage refusé : la hauteur vit au moins dans l'état React
	}
}

export function useHauteurTiroir(): [number, (h: number) => void] {
	const [hauteur, setHauteur] = useState(lireHauteur)
	const regler = (h: number) => {
		const b = borner(Math.round(h), window.innerHeight)
		setHauteur(b)
		ecrireHauteur(b)
	}
	return [hauteur, regler]
}

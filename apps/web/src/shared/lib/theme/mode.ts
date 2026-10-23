import { DEFAULT_THEME_MODE } from "@/shared/lib/theme/colorThemes"

export const CLE_THEME = "agentx.theme"

type Mode = "dark" | "light"

// valeur stockée inconnue ou absente ⇒ mode par défaut
export const lireMode = (raw: string | null): Mode =>
	raw === "light" || raw === "dark"
		? raw
		: DEFAULT_THEME_MODE === "light"
			? "light"
			: "dark"

// seul setter de data-theme (index.html ne porte que le défaut avant hydratation)
export const appliquerMode = (
	m: Mode,
	el: HTMLElement = document.documentElement,
): void => {
	el.dataset.theme = m
}

export const basculerMode = (): Mode => {
	const m =
		document.documentElement.dataset.theme === "light" ? "dark" : "light"
	appliquerMode(m)
	try {
		globalThis.localStorage?.setItem(CLE_THEME, m)
	} catch {
		// stockage refusé : le mode vit au moins dans le DOM
	}
	return m
}

import { create } from "zustand"

// état UI partagé moteur ↔ React ; 0 donnée serveur (geolens 6)
export type SalleView = "building" | "floor" | "basement"
export type SalleUiState = {
	view: SalleView
	selectedFloor: string | null
	lastFloor: string | null // dernier étage ouvert, persistant (localStorage)
	hoveredDesk: string | null
	showFloor(slug: string): void // view 'floor', selectedFloor + lastFloor slug, hoveredDesk null
	showBuilding(): void // view 'building', selectedFloor null (lastFloor gardé), hoveredDesk null
	hoverDesk(cle: string | null): void
	terminalOuvert: boolean // tiroir du chef
	basculerTerminal(): void
	terminalLargeur: number // px, borné par TERMINAL_LARGEUR
	setTerminalLargeur(px: number): void
}

export const TERMINAL_LARGEUR = { min: 360, max: 900, defaut: 480 } as const

const CLE_DERNIER = "agentx.lastFloor"

// SSR-safe ; stockage indisponible ⇒ pas de mémoire
const lireDernier = (): string | null => {
	try {
		return globalThis.localStorage?.getItem(CLE_DERNIER) ?? null
	} catch {
		return null
	}
}

const ecrireDernier = (slug: string) => {
	try {
		globalThis.localStorage?.setItem(CLE_DERNIER, slug)
	} catch {
		// quota ou stockage refusé : la mémoire vit au moins dans le store
	}
}

export const useSalleUi = create<SalleUiState>()((set) => ({
	view: "building",
	selectedFloor: null,
	lastFloor: lireDernier(),
	hoveredDesk: null,
	showFloor: (slug) => {
		ecrireDernier(slug)
		set({
			view: "floor",
			selectedFloor: slug,
			lastFloor: slug,
			hoveredDesk: null,
		})
	},
	showBuilding: () =>
		set({ view: "building", selectedFloor: null, hoveredDesk: null }),
	hoverDesk: (cle) => set({ hoveredDesk: cle }),
	terminalOuvert: false,
	basculerTerminal: () => set((s) => ({ terminalOuvert: !s.terminalOuvert })),
	terminalLargeur: TERMINAL_LARGEUR.defaut,
	setTerminalLargeur: (px) =>
		set({
			terminalLargeur: Math.min(
				TERMINAL_LARGEUR.max,
				Math.max(TERMINAL_LARGEUR.min, px),
			),
		}),
}))

export const selectView = (s: SalleUiState) => s.view
export const selectFloor = (s: SalleUiState) => s.selectedFloor
export const selectLastFloor = (s: SalleUiState) => s.lastFloor
export const selectHoveredDesk = (s: SalleUiState) => s.hoveredDesk
export const selectTerminalOuvert = (s: SalleUiState) => s.terminalOuvert
export const selectTerminalLargeur = (s: SalleUiState) => s.terminalLargeur

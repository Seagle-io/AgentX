import { create } from "zustand"

// état UI partagé moteur ↔ React ; 0 donnée serveur (geolens 6)
export type SalleView = "building" | "floor"
export type SalleUiState = {
	view: SalleView
	selectedFloor: string | null
	lastFloor: string | null // dernier étage ouvert, persistant (localStorage)
	hoveredDesk: string | null
	showFloor(slug: string): void // view 'floor', selectedFloor + lastFloor slug, hoveredDesk null
	showBuilding(): void // view 'building', selectedFloor null (lastFloor gardé), hoveredDesk null
	hoverDesk(cle: string | null): void
}

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
}))

export const selectView = (s: SalleUiState) => s.view
export const selectFloor = (s: SalleUiState) => s.selectedFloor
export const selectLastFloor = (s: SalleUiState) => s.lastFloor
export const selectHoveredDesk = (s: SalleUiState) => s.hoveredDesk

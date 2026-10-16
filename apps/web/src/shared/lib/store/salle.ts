import { create } from "zustand"

// état UI partagé moteur ↔ React ; 0 donnée serveur (geolens 6)
export type SalleView = "building" | "floor"
export type SalleUiState = {
	view: SalleView
	selectedFloor: string | null
	hoveredDesk: string | null
	showFloor(slug: string): void // view 'floor', selectedFloor slug, hoveredDesk null
	showBuilding(): void // view 'building', selectedFloor null, hoveredDesk null
	hoverDesk(cle: string | null): void
}

export const useSalleUi = create<SalleUiState>()((set) => ({
	view: "building",
	selectedFloor: null,
	hoveredDesk: null,
	showFloor: (slug) =>
		set({ view: "floor", selectedFloor: slug, hoveredDesk: null }),
	showBuilding: () =>
		set({ view: "building", selectedFloor: null, hoveredDesk: null }),
	hoverDesk: (cle) => set({ hoveredDesk: cle }),
}))

export const selectView = (s: SalleUiState) => s.view
export const selectFloor = (s: SalleUiState) => s.selectedFloor
export const selectHoveredDesk = (s: SalleUiState) => s.hoveredDesk

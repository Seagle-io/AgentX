// contrat-front.md:127-150 — verbatim (quotes doubles = Biome)

export type PaletteKey =
	| "bg"
	| "panel"
	| "surface"
	| "border"
	| "text"
	| "muted"
	| "accent"
	| "success"
	| "warning"
	| "error"
export type BuildingPalette = Record<PaletteKey, string> // lu des tokens CSS par BuildingCanvas (getComputedStyle), 1×
export type BuildingInput = {
	onSelectFloor(slug: string): void // React ⇒ navigate(`/floor/${slug}`)
	onHoverDesk(cle: string | null): void // émis seulement sur changement
	reducedMotion: boolean // matchMedia lu côté React
	palette: BuildingPalette
	frame: { request(cb: (t: number) => void): number; cancel(id: number): void } // rAF injecté
}
export type BuildingHandle = {
	update(scene: BuildingScene): void // redessin si scène ≠ précédente (clé JSON)
	resize(w: number, h: number, dpr: number): void // redessin immédiat
	pointer(e: { type: "move" | "click" | "leave"; x: number; y: number }): void // coords CSS px du canvas
	destroy(): void // annule frame, libère
}
export type FloorView = {
	slug: string
	titre: string
	num: number
	dormant: boolean
	selected: boolean
	agents: { role: string; tid: string }[]
	enCours: number
	alerte: "" | "bloque" | "urgent"
}
export type DeskView = {
	cle: string
	nom: string
	couleur: string
	actifs: number
	actif: boolean
}
export type FluxView = {
	de: string
	vers: string
	etat: "attente" | "livre" | "actif" | "bloque"
	objet: string
}
export type BuildingScene = {
	view: "building" | "floor"
	project: string
	floors: FloorView[]
	basement: { slug: string; titre: string }[]
	roof: {
		chefAlive: boolean | null
		todo: number
		urgent: number
		alerte: string
	}
	desks: DeskView[] // affectable + chef ; vault = objet
	flux: FluxView[]
	pipeline: { k: string; n: number }[] // ordre serveur
	serie: { points: number[]; valeur: string }
	abandoned: number
	hovered: string | null
}

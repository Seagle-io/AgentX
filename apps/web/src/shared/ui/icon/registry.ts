// Chemins SVG, un `d` par nom, repère centré sur (0,0), rayon utile ≈ 6,5
// (viewBox `-8 -8 16 16` posé par `Icon`). Dessins au trait : `Icon` applique
// `stroke="currentColor"` et `fill="none"`, les 20 premiers sont recopiés des
// `GLYPHES` de la v1 (stroke 1,4) — leurs `rect` et `circle` sont
// convertis en sous-chemins (`M…h…v…Z`, deux arcs) pour tenir dans un seul `d`.
export const ICONS: Record<string, string> = {
	pack: "M-5-6.5h10v13h-10ZM-2.6-3h5.2M-2.6 0h5.2M-2.6 3h3.4",
	carte:
		"M0 6.4C-4.4 1-5.5-1.4-5.5-3.3a5.5 5.5 0 0 1 11 0C5.5-1.4 4.4 1 0 6.4ZM-1.9-3.3a1.9 1.9 0 1 0 3.8 0a1.9 1.9 0 1 0-3.8 0",
	contrat:
		"M-1.6-6.4q-2.8 0-2.8 2.8t-2.2 2.8q2.2 0 2.2 2.8t2.8 2.8M1.6-6.4q2.8 0 2.8 2.8t2.2 2.8q-2.2 0-2.2 2.8t-2.8 2.8",
	diff: "M-5-6.5h10v13h-10ZM-2.6-2.6h5.2M-2.6 2.6h5.2M0 0v5.2",
	defauts: "M0-6.6 6.4 5H-6.4ZM0-2.2v3.4M-1 3.3a1 1 0 1 0 2 0a1 1 0 1 0-2 0",
	notes:
		"M-5.2-6.2h6.6a2 2 0 0 1 2 2v10.4h-6.6a2 2 0 0 0-2 2ZM-2.6-2.6h4.4M-2.6 0.4h4.4",
	verdict: "M0-6.4v12.4M-3.6 6h7.2M-6-3.8h12M-6-3.8-8 1h4ZM6-3.8 4 1h4Z",
	revue: "M-5.6-1.2a4.4 4.4 0 1 0 8.8 0a4.4 4.4 0 1 0-8.8 0M2 2 6 6",
	tests: "M-2.2-6.4v4.6L-6.2 5.4h12.4L2.2-1.8v-4.6M-3.4-6.4h6.8M-4.4 2.2h8.8",
	maquette: "M-6.2-5.4h12.4v10.8h-12.4ZM-6.2-2.4h12.4M-1.6-2.4v7.8",
	audit:
		"M0-6.6 5.6-4.4v3.6C5.6 2.6 3.2 5.2 0 6.6-3.2 5.2-5.6 2.6-5.6-.8v-3.6ZM-2.4 0 -.6 1.8 2.6-1.6",
	build: "M0-6.4 5.6-3.2v6.4L0 6.4-5.6 3.2v-6.4ZM-5.6-3.2 0 0 5.6-3.2M0 0v6.4",
	resultat: "M-4.6-6.5h6l3.6 3.6v9.4h-9.6ZM1.4-6.5v3.6h3.6",
	question:
		"M-6.6 0a6.6 6.6 0 1 0 13.2 0a6.6 6.6 0 1 0-13.2 0M-2.1-1.9a2.1 2.1 0 1 1 2.1 2.6v1M-1 4a1 1 0 1 0 2 0a1 1 0 1 0-2 0",
	avis: "M0-6.4 2.8-3.6-2.8 2-5.6-.8ZM0-.8 5 4.2M-6.2 6.2h7",
	budget:
		"M-6.4 0a6.4 6.4 0 1 0 12.8 0a6.4 6.4 0 1 0-12.8 0M2.6-2.8a3.4 3.4 0 1 0 0 5.6M-3.6-.9h3.8M-3.6 1.1h3.8",
	specs:
		"M-5-5.2h10v11.8h-10ZM-2.2-5.2v-1.4h4.4v1.4M-3-1.4l.9.9 1.5-1.7M-3 2.6l.9.9 1.5-1.7M.8-1h2M.8 3h2",
	contenus:
		"M-6.2-2h2.6L3.4-5.8v11.6L-3.6 2h-2.6ZM-4.6 2.4-3.6 6M5.6-2.2a3.2 3.2 0 0 1 0 4.4",
	risques:
		"M-6.2 2.4a6.2 6.2 0 0 1 12.4 0M-4.4-2-3.4-1M0-3.8v1.4M4.4-2 3.4-1M0 2.4 3-1.6M-1.3 2.4a1.3 1.3 0 1 0 2.6 0a1.3 1.3 0 1 0-2.6 0",
	cahier:
		"M-4-6.4h9.6v12.8h-9.6ZM-6-3.6h3.6M-6 0h3.6M-6 3.6h3.6M-.4-2.6h3.4M-.4.6h3.4",
	// Icônes d'interface (dessinées ici, même repère et même trait)
	play: "M-4-6.4L6 0-4 6.4Z",
	copy: "M-6.4-6.4h8.8v8.8h-8.8ZM-2.4-2.4h8.8v8.8h-8.8Z",
	bell: "M-5.4 3.6h10.8l-1.6-2.2v-3a3.8 3.8 0 0 0-7.6 0v3ZM-1.6 5.6a1.6 1.6 0 0 0 3.2 0M0-6.6v1.2",
	"bell-off":
		"M-5.4 3.6h10.8l-1.6-2.2v-3a3.8 3.8 0 0 0-7.6 0v3ZM-1.6 5.6a1.6 1.6 0 0 0 3.2 0M-6.4-6.4 6.4 6.4",
	close: "M-5-5 5 5M5-5-5 5",
	chevron: "M-4.8-2.4 0 2.4 4.8-2.4",
}

export type IconName = keyof typeof ICONS

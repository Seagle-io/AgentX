// Ce qui transite sur un relais : 20 glyphes v1
// centrés sur (0,0), trait à la couleur de l'émetteur. Clé inconnue ⇒ `resultat`.

type Glyphe = (c: string) => string

const GLYPHES: Record<string, Glyphe> = {
	pack: (
		c,
	) => `<rect x="-5" y="-6.5" width="10" height="13" rx="1.5" fill="none" stroke="${c}" stroke-width="1.4"/>
    <path d="M-2.6 -3h5.2M-2.6 0h5.2M-2.6 3h3.4" stroke="${c}" stroke-width="1.3" stroke-linecap="round"/>`,
	carte: (
		c,
	) => `<path d="M0 6.4C-4.4 1-5.5-1.4-5.5-3.3a5.5 5.5 0 0 1 11 0C5.5-1.4 4.4 1 0 6.4Z"
      fill="none" stroke="${c}" stroke-width="1.4" stroke-linejoin="round"/>
    <circle cx="0" cy="-3.3" r="1.9" fill="${c}"/>`,
	contrat: (
		c,
	) => `<path d="M-1.6-6.4q-2.8 0-2.8 2.8t-2.2 2.8q2.2 0 2.2 2.8t2.8 2.8"
      fill="none" stroke="${c}" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M1.6-6.4q2.8 0 2.8 2.8t2.2 2.8q-2.2 0-2.2 2.8t-2.8 2.8"
      fill="none" stroke="${c}" stroke-width="1.4" stroke-linecap="round"/>`,
	diff: (
		c,
	) => `<rect x="-5" y="-6.5" width="10" height="13" rx="1.5" fill="none" stroke="${c}" stroke-width="1.4"/>
    <path d="M-2.6-2.6h5.2" stroke="${c}" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M-2.6 2.6h5.2M0 0v5.2" stroke="${c}" stroke-width="1.4" stroke-linecap="round"/>`,
	defauts: (
		c,
	) => `<path d="M0-6.6 6.4 5H-6.4Z" fill="none" stroke="${c}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M0-2.2v3.4" stroke="${c}" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="0" cy="3.3" r="1" fill="${c}"/>`,
	notes: (c) => `<path d="M-5.2-6.2h6.6a2 2 0 0 1 2 2v10.4h-6.6a2 2 0 0 0-2 2Z"
      fill="none" stroke="${c}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M-2.6-2.6h4.4M-2.6 0.4h4.4" stroke="${c}" stroke-width="1.2" stroke-linecap="round"/>`,
	verdict: (
		c,
	) => `<path d="M0-6.4v12.4M-3.6 6h7.2M-6-3.8h12" stroke="${c}" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M-6-3.8-8 1h4ZM6-3.8 4 1h4Z" fill="none" stroke="${c}" stroke-width="1.2" stroke-linejoin="round"/>`,
	revue: (
		c,
	) => `<circle cx="-1.2" cy="-1.2" r="4.4" fill="none" stroke="${c}" stroke-width="1.4"/>
    <path d="M2 2 6 6" stroke="${c}" stroke-width="1.7" stroke-linecap="round"/>`,
	tests: (c) => `<path d="M-2.2-6.4v4.6L-6.2 5.4h12.4L2.2-1.8v-4.6M-3.4-6.4h6.8"
      fill="none" stroke="${c}" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="M-4.4 2.2h8.8" stroke="${c}" stroke-width="1.2"/>`,
	maquette: (
		c,
	) => `<rect x="-6.2" y="-5.4" width="12.4" height="10.8" rx="1.5" fill="none" stroke="${c}" stroke-width="1.4"/>
    <path d="M-6.2-2.4h12.4M-1.6-2.4v7.8" stroke="${c}" stroke-width="1.2"/>`,
	audit: (
		c,
	) => `<path d="M0-6.6 5.6-4.4v3.6C5.6 2.6 3.2 5.2 0 6.6-3.2 5.2-5.6 2.6-5.6-.8v-3.6Z"
      fill="none" stroke="${c}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M-2.4 0 -.6 1.8 2.6-1.6" fill="none" stroke="${c}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`,
	build: (
		c,
	) => `<path d="M0-6.4 5.6-3.2v6.4L0 6.4-5.6 3.2v-6.4ZM-5.6-3.2 0 0 5.6-3.2M0 0v6.4"
      fill="none" stroke="${c}" stroke-width="1.3" stroke-linejoin="round"/>`,
	resultat: (
		c,
	) => `<path d="M-4.6-6.5h6l3.6 3.6v9.4h-9.6Z" fill="none" stroke="${c}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M1.4-6.5v3.6h3.6" fill="none" stroke="${c}" stroke-width="1.2"/>`,
	question: (
		c,
	) => `<circle r="6.6" fill="none" stroke="${c}" stroke-width="1.4"/>
    <path d="M-2.1-1.9a2.1 2.1 0 1 1 2.1 2.6v1" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="0" cy="4" r="1" fill="${c}"/>`,
	// rôles métier : juriste, tresorier, produit, marketing, rssi, syndicat
	avis: (
		c,
	) => `<path d="M0-6.4 2.8-3.6-2.8 2-5.6-.8Z" fill="none" stroke="${c}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M0-.8 5 4.2M-6.2 6.2h7" stroke="${c}" stroke-width="1.4" stroke-linecap="round"/>`,
	budget: (c) => `<circle r="6.4" fill="none" stroke="${c}" stroke-width="1.4"/>
    <path d="M2.6-2.8a3.4 3.4 0 1 0 0 5.6" fill="none" stroke="${c}" stroke-width="1.3" stroke-linecap="round"/>
    <path d="M-3.6-.9h3.8M-3.6 1.1h3.8" stroke="${c}" stroke-width="1.2" stroke-linecap="round"/>`,
	specs: (
		c,
	) => `<rect x="-5" y="-5.2" width="10" height="11.8" rx="1.5" fill="none" stroke="${c}" stroke-width="1.4"/>
    <path d="M-2.2-5.2v-1.4h4.4v1.4" fill="none" stroke="${c}" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M-3-1.4l.9.9 1.5-1.7M-3 2.6l.9.9 1.5-1.7M.8-1h2M.8 3h2" fill="none" stroke="${c}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>`,
	contenus: (
		c,
	) => `<path d="M-6.2-2h2.6L3.4-5.8v11.6L-3.6 2h-2.6Z" fill="none" stroke="${c}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M-4.6 2.4-3.6 6M5.6-2.2a3.2 3.2 0 0 1 0 4.4" fill="none" stroke="${c}" stroke-width="1.3" stroke-linecap="round"/>`,
	risques: (
		c,
	) => `<path d="M-6.2 2.4a6.2 6.2 0 0 1 12.4 0" fill="none" stroke="${c}" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M-4.4-2-3.4-1M0-3.8v1.4M4.4-2 3.4-1" stroke="${c}" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M0 2.4 3-1.6" stroke="${c}" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="0" cy="2.4" r="1.3" fill="${c}"/>`,
	cahier: (
		c,
	) => `<rect x="-4" y="-6.4" width="9.6" height="12.8" rx="1.2" fill="none" stroke="${c}" stroke-width="1.4"/>
    <path d="M-6-3.6h3.6M-6 0h3.6M-6 3.6h3.6" stroke="${c}" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M-.4-2.6h3.4M-.4.6h3.4" stroke="${c}" stroke-width="1.2" stroke-linecap="round"/>`,
}

/** v1 pastille transportable : fond sombre + glyphe, lisible sur le sol.
 *  v1 porte deux `opacity` (.92 puis .95) : le parseur HTML garde la première. */
export function pastille(cle: string, couleur: string, echelle = 1) {
	const g = (Object.hasOwn(GLYPHES, cle) ? GLYPHES[cle] : GLYPHES.resultat)(
		couleur,
	)
	return `<g transform="scale(${echelle})">
    <circle r="9.6" fill="#05070c" opacity=".92" stroke="${couleur}" stroke-width="1"/>
    ${g}</g>`
}

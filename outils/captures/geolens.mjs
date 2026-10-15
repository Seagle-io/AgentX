// Profil de capture Geolens (contrat seagle-pilotage §C6).
// Stack LOCALE seulement : jamais l'URL du serveur de test (refus dans capturer.mjs).
// Viewer : web/src/App.tsx:L53 `/projects/:id` ; les 7 vues (outils, packs) sont un état
// interne du viewer sans URL propre → route `null` : listées en --essai, sautées en capture.

export default {
	ecrans: {
		'coupe': null,
		'courbes': null,
		'mesure': null,
		'protections': null,
		'solaire': null,
		'surete': null,
		'zone': null,
	},
	viewer: '/projects/{GEOLENS_PROJET_ID}',
	baseLocaleSeulement: true,
	themes: [null],
	// Mesuré : vue-*.webp = 2400×1350 (×7) → viewport 1280×720, densité 1.875 (même parti que Kora).
	tailles: [
		{ suffixe: '2400', largeur: 1280, hauteur: 720, dpr: 1.875 },
	],
	nom: (theme, ecran, suffixe) => `vue-${ecran}.webp`,
	variables: ['GEOLENS_EMAIL', 'GEOLENS_MOT_DE_PASSE'],

	// Compte de démonstration seulement : GEOLENS_EMAIL / GEOLENS_MOT_DE_PASSE (App.tsx:L46 `/login`).
	async connexion(page, env) {
		for (const v of this.variables) if (!env[v]) throw new Error(`variable ${v} absente`)
		await page.goto(new URL('/login', env.CAPTURES_BASE).href, { waitUntil: 'networkidle' })
		await page.locator('input[type="email"], input[name="email"]').first().fill(env.GEOLENS_EMAIL)
		await page.locator('input[type="password"]').first().fill(env.GEOLENS_MOT_DE_PASSE)
		await Promise.all([
			page.waitForURL(u => !new URL(u).pathname.startsWith('/login'), { timeout: 20000 }),
			page.locator('button[type="submit"]').first().click(),
		])
	},

	async theme(page, t) {},
}

// Profil de capture Kora (contrat seagle-pilotage §C6).
// Routes : ortho-front/src/app/router.tsx + src/modules/*/routes.tsx.
// `{VAR}` dans une route = variable d'environnement (identifiant de démo), jamais en dur.
// Route `null` = introuvable dans le routeur : l'écran est listé en --essai, sauté en capture.

export default {
	ecrans: {
		'agenda': '/agenda',                                  // agenda/routes.tsx:L8
		'bilan': '/bilan',                                    // bilan/routes.tsx:L13
		'bilan-detail': '/bilan/{KORA_BILAN_ID}',             // bilan/routes.tsx:L19
		'bilan-trames': '/bilan/trames',                      // bilan/routes.tsx:L14
		'dashboard': '/dashboard',                            // dashboard/routes.tsx:L6
		'documents': '/documents',                            // patients/routes.tsx:L26
		'exercise-edit': '/exercises/{KORA_EXERCICE_ID}/edit', // exercises/routes.tsx:L18
		'exercises': '/exercises',                            // exercises/routes.tsx:L11
		'forum': '/forum',                                    // forum/routes.tsx:L29
		'my-day': '/my-day',                                  // my-day/routes.tsx:L6
		'patient-detail': '/patients/{KORA_PATIENT_ID}',      // patients/routes.tsx:L17
		'patient-suivi': null,                                // aucune route « suivi » dans le routeur
		'settings': '/settings',                              // settings/routes.tsx:L6
	},
	themes: ['dark', 'light'],
	// Mesuré : *-1280.webp = 1280×800, *-2400.webp = 2400×1500, même mise en page
	// (barre latérale 175 px → 328 px) → même viewport, densité 1.875.
	tailles: [
		{ suffixe: '1280', largeur: 1280, hauteur: 800, dpr: 1 },
		{ suffixe: '2400', largeur: 1280, hauteur: 800, dpr: 1.875 },
	],
	nom: (theme, ecran, suffixe) => `${theme}-${ecran}-${suffixe}.webp`,
	variables: ['KORA_EMAIL', 'KORA_MOT_DE_PASSE'],

	// Compte de démonstration seulement : KORA_EMAIL / KORA_MOT_DE_PASSE.
	async connexion(page, env) {
		for (const v of this.variables) if (!env[v]) throw new Error(`variable ${v} absente`)
		await page.goto(new URL('/login', env.CAPTURES_BASE).href, { waitUntil: 'networkidle' })
		await page.locator('input[type="email"], input[name="email"]').first().fill(env.KORA_EMAIL)
		await page.locator('input[type="password"]').first().fill(env.KORA_MOT_DE_PASSE)
		await Promise.all([
			page.waitForURL(u => !new URL(u).pathname.startsWith('/login'), { timeout: 20000 }),
			page.locator('button[type="submit"]').first().click(),
		])
	},

	// Thème : préférence système émulée + classe `dark` sur <html> (mécanisme NV).
	async theme(page, t) {
		await page.emulateMedia({ colorScheme: t })
		await page.addInitScript(th => {
			try { localStorage.setItem('theme', th) } catch {}
			document.addEventListener('DOMContentLoaded', () => {
				document.documentElement.classList.toggle('dark', th === 'dark')
				document.documentElement.classList.toggle('light', th === 'light')
			})
		}, t)
	},
}

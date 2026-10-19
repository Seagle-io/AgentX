// API simulée T017 (critique vague 2) : /exercises avec domaines, favoris, profil
const NN = n => String(n).padStart(2, '0')
const ex = (n, extra = {}) => ({
	id: `ex-${NN(n)}`, title: `Exercice ${NN(n)}`, format: 'PAIRSIMI', instructions: 'Consigne', cosmetics: {},
	createdAt: '2026-01-01T00:00:00Z', levels: [], visibility: 'cabinet', tags: ['lecture'], domains: [], ...extra,
})
export const LIST = [
	...Array.from({ length: 10 }, (_, i) => ex(i + 1, { domains: ['voix'] })),
	...Array.from({ length: 10 }, (_, i) => ex(i + 11, { domains: ['langageEcrit'] })),
	...Array.from({ length: 10 }, (_, i) => ex(i + 21, { domains: ['memoire', 'voix'] })),
	...Array.from({ length: 5 }, (_, i) => ex(i + 40, { visibility: 'private', tags: ['math'], domains: ['cognitionMathematique'] })),
	ex(45, { visibility: 'private', status: 'draft', domains: ['voix'] }),
]
const D = `alimentationDeglutition·Alimentation et Déglutition·cup·Oralité & déglutition|articulation·Articulation·mic·Langage oral|attention·Attention·eye·Fonctions exécutives|audition·Audition·head-signal·Audition|cognitionMathematique·Cognition mathématique·ruler·Cognition mathématique|communicationAlternative·Communication alternative (CAA)·users·Langage oral|comprehension·Compréhension·book·Langage oral|developpement·Développement·compass·Fonctions exécutives|fluence·Fluence·trending-up·Langage oral|fonctionsExecutives·Fonctions exécutives·brain·Fonctions exécutives|langageEcrit·Langage écrit·pencil·Langage écrit|memoire·Mémoire·brain·Fonctions exécutives|morphosyntaxe·Morphosyntaxe·quote·Langage oral|phonologie·Phonologie·mic·Langage oral|pragmatique·Pragmatique·users·Langage oral|prosodie·Prosodie·mic·Langage oral|semantique·Sémantique·quote·Langage oral|voix·Voix·mic·Langage oral`
export const DOMAINS = D.split('|').map((l, i) => {
	const [slug, label, icon, family] = l.split('·')
	return { id: `d-${slug}`, slug, label, icon, sortOrder: i + 1, isSystem: true, medicalPracticeId: null, family }
})
const ME = { id: 'u1', slug: 'test', name: 'Test Praticien', contactCode: 'X', email: 't@t.fr', role: null, isSuperAdmin: false, headline: '', location: '', bio: '', phone: null, adeli: null, avatarUrl: null, bannerUrl: null, linkedinUrl: null, specialties: [], preferences: {}, emailVerifiedAt: '2026-01-01T00:00:00Z', forumPseudo: null, forumPseudoSlug: null, access: { exercises: 'write', programmes: 'write', forum: 'write' } }
export const api = p => {
	if (p === '/api/auth/me') return { json: ME }
	if (p === '/api/auth/preferences') return { json: { guide_auto_off: '1' } }
	if (/^\/api\/exercises\/?$/.test(p)) return { json: LIST }
	if (p === '/api/favorites') return { json: { exerciseIds: ['ex-01', 'ex-02', 'ex-03', 'ex-41'], programmeIds: [] } }
	if (p === '/api/programmes') return { json: [] }
	if (p === '/api/domain') return { json: DOMAINS }
	if (p.startsWith('/api/')) return { status: 404, json: {} }
	if (p.startsWith('/stimuli/images/')) return { path: 'ferme.webp' }
}

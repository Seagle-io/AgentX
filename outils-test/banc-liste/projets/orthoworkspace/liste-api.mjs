// API simulée de la page Exercices (T270) : 30 « cabinet » lecture + 5 « private » math ; images → ferme.webp du banc-impression
const ex = (n, extra = {}) => ({
	id: `ex-${String(n).padStart(2, '0')}`, domains: [], format: 'PAIRSIMI', title: `Exercice ${String(n).padStart(2, '0')}`,
	instructions: 'Consigne', cosmetics: {}, createdAt: '2026-01-01T00:00:00Z', levels: [], visibility: 'cabinet', tags: ['lecture'], ...extra,
})
// 30 « cabinet » taguées lecture (dont banc-PAIRSIMI = Exercice 10, imprimable par le shim) + 5 « private » taguées math
export const LIST = [
	...Array.from({ length: 30 }, (_, i) => ex(i + 1, i + 1 === 10 ? { id: 'banc-PAIRSIMI' } : {})),
	...Array.from({ length: 5 }, (_, i) => ex(40 + i, { visibility: 'private', tags: ['math'] })),
]

export const api = p => {
	if (p.startsWith('/api/')) return /^\/api\/exercises\/?$/.test(p) ? { json: LIST } : { status: 404, json: {} }
	if (p.startsWith('/stimuli/images/')) return { path: 'ferme.webp' }
}

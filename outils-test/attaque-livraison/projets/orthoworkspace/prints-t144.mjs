// Cas SSR T144 : prints QCM, DIALBD, PHRIMG sur items limites — usage : node ../../ssr.mjs prints-t144.mjs
export const modules = {
	QCM: '/src/modules/exercises/formats/qcm/qcm.print.tsx',
	DIALBD: '/src/modules/exercises/formats/dialogue-bd/dialogue-bd.print.tsx',
	PHRIMG: '/src/modules/exercises/formats/phrase-images/phrase-images.print.tsx',
}
const ex = (items, metadata = {}) => ({ id: 'ex-1', title: 'T', instructions: 'i', items, metadata, params: {} })
const long = 'mot '.repeat(400).trim()
export const cases = {
	QCM: {
		vide: [],
		un: [{ id: 'a', question: 'Q ?', options: [{ text: 'x' }, { text: 'y' }], correct: [1] }],
		trente: Array.from({ length: 30 }, (_, i) => ({ id: 'q' + i, question: 'Q' + i, options: [{ text: 'a' }, { text: 'b' }], correct: [0] })),
		long: [{ id: 'a', question: long, options: [{ text: long }], correct: [0] }],
		motSansImage: [{ id: 'a', question: 'Q', stimulus: { word: { id: 'w1', word: 'zzz' }, show: 'image' }, options: [{ word: { id: 'w2', word: 'yyy' }, show: 'image' }, { text: 'b' }], correct: [0] }],
		correctNombre: [{ id: 'a', question: 'Q', options: [{ text: 'a' }, { text: 'b' }], correct: 1 }],
		sansOptions: [{ id: 'a', question: 'Q', correct: [0] }],
		sansCorrect: [{ id: 'a', question: 'Q', options: [{ text: 'a' }] }],
		listenOnlySansQuestion: [{ id: 'a', question: '', stimulus: { text: 'chat' }, listenOnly: true, options: [{ text: 'chat' }, { text: 'chien' }], correct: [0] }],
		nullItem: [null],
	},
	DIALBD: {
		vide: [],
		reponseVide: [{ id: 'a', lines: [], answer: '  ' }],
		un: [{ id: 'a', lines: [{ speaker: 'a', text: 'Salut' }], answer: 'Coucou', distractors: ['Non', 'Pomme'] }],
		trente: Array.from({ length: 30 }, (_, i) => ({ id: 'd' + i, lines: [{ speaker: 'a', text: 'L' + i }], answer: 'R' + i, distractors: ['x', 'y', 'z'] })),
		long: [{ id: 'a', lines: [{ speaker: 'a', text: long }], answer: long, distractors: [long + ' faux'] }],
		sansLignes: [{ id: 'a', answer: 'Oui' }],
		ligneSansTexte: [{ id: 'a', lines: [{ speaker: 'a' }], answer: 'Oui', distractors: ['Non'] }],
		speakerInconnu: [{ id: 'a', lines: [{ speaker: 'z', text: 'hé' }], answer: 'Oui', distractors: ['Non'] }],
		reponseNombre: [{ id: 'a', lines: [], answer: 3 }],
		doublonCasse: [{ id: 'a', lines: [], answer: 'Oui', distractors: ['oui', ' OUI ', 'Non'] }],
		sceneSansImage: [{ id: 'a', scene: { id: 'w', word: 'parc' }, lines: [{ speaker: 'b', text: 'x' }], answer: 'Oui', distractors: ['Non'] }],
		nullItem: [null],
	},
	PHRIMG: {
		vide: [],
		un: [{ id: 'a', sentence: 'S', cards: [{ text: 'a' }, { text: 'b' }], correct: 0 }],
		trente: Array.from({ length: 30 }, (_, i) => ({ id: 'p' + i, sentence: 'S' + i, cards: [{ text: 'a' }, { text: 'b' }, { text: 'c' }], correct: i % 3 })),
		long: [{ id: 'a', sentence: long, cards: [{ text: long }, { text: 'b' }], correct: 0 }],
		cinqCartesCorrect4: [{ id: 'a', sentence: 'S', cards: ['a', 'b', 'c', 'd', 'e'].map(t => ({ text: t })), correct: 4 }],
		ancienImages: [{ id: 'a', sentence: 'S', images: ['chat', 'chien'], correct: 1 }],
		motSansImage: [{ id: 'a', sentence: 'S', cards: [{ text: 'zzz', media: { id: 'w', word: 'zzz' } }, { text: 'b' }], correct: 0 }],
		correctHors: [{ id: 'a', sentence: 'S', cards: [{ text: 'a' }, { text: 'b' }], correct: 7 }],
		carteVide: [{ id: 'a', sentence: 'S', cards: [{ text: '' }, { text: 'b' }], correct: 0 }],
		nullItem: [null],
	},
}
export const props = (items, withAnswers) => ({ exercise: ex(items), withAnswers })
export const mesure = html => `li=${(html.match(/<li/g) || []).length} ✗=${(html.match(/✗/g) || []).length} empty=${/Aucune/.test(html)} len=${html.length}`

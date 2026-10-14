// Shim de @/api/exercises : vrai module, sauf getExercise / resolveLaunch.
// id `banc-<CODE>` → exercice construit depuis getFormatDef(CODE).demoItems ;
// format noMaterial → items [] et params {} : le PrintComponent applique ses défauts.
// window.__bancFixture[CODE] (shot.mjs --fixture) remplace demoItems : metadata → cosmetics, params → niveau, link:false → items tels quels.
// Mots de démo liés comme dans l'aperçu (loadDemoLinks → linkDemoItems), banque simulée :
// même vocabulaire, id UUID fixe + image enregistrée par mot → collectLinkedWordIds les voit, resolveMedia (resources-shim) les résout,
// et les rendus qui lisent l'image du mot sans résolution (wordImageUrl seul) l'ont aussi.
import type { ExerciseRecord } from '@/modules/exercises/exercises.types'
import { getFormatDef } from '@/modules/exercises/exercises.registry'
import { DEMO_RHYMES, DEMO_WORDS, linkDemoItems } from '@/modules/exercises/lib/demo-words'
import type { ResolvedLaunch } from '@/api/exercises.ts'
export * from '@/api/exercises.ts'

// Même vocabulaire que DEMO_VOCABULARY (demo-words.ts, non exporté).
const vocabulaire = [...new Set([...DEMO_WORDS, ...DEMO_RHYMES.flatMap(f => [f.word, ...f.rhymes, ...f.nonRhymes])])]
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const liens = new Map(vocabulaire.map((word, n) => [word.toLowerCase(), { id: uuid(n), word, image: `/stimuli/images/${word}.webp` }]))
export const bancWordById = new Map([...liens.values()].map(w => [w.id, w.word]))

type Fixture = { items: unknown[], metadata?: Record<string, unknown>, params?: Record<string, unknown>, title?: string, instructions?: string, link?: boolean }

export async function getExercise(id: string): Promise<ExerciseRecord> {
	const code = id.replace(/^banc-/, '')
	const def = getFormatDef(code)
	const fx = (window as unknown as { __bancFixture?: Record<string, Fixture> }).__bancFixture?.[code]
	if (!def || (!fx && !def.demoItems && !def.noMaterial)) throw new Error(`banc: ${code} sans demoItems`)
	const cosmetics = fx?.metadata ?? {}
	const params = fx?.params ?? {}
	const instructions = fx?.instructions ?? (typeof def.defaultInstructions === 'function' ? def.defaultInstructions({ ...cosmetics, ...params }) : def.defaultInstructions ?? '')
	const items = fx?.link === false ? fx.items : linkDemoItems(fx ? fx.items : def.demoItems ?? [], liens)
	return {
		id, domains: [], format: code, title: fx?.title ?? def.label, instructions, cosmetics, createdAt: '2026-01-01T00:00:00Z',
		levels: [{ id: 'banc-n1', position: 1, label: null, params, launchCount: null, instances: null, items: items as ExerciseRecord['levels'][number]['items'] }],
	}
}

// Rejet → repli « niveau entier » de ExercisePrint.
export async function resolveLaunch(): Promise<ResolvedLaunch> {
	throw new Error('banc: pas de resolveLaunch')
}

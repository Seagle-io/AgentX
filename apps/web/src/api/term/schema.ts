import { z } from "zod"

// Contrat dash.py `api/term/*` : tout est POST, flux SSE en lignes `data:` seules
const S = z.string()
const N = z.number()
const B = z.boolean()

export const TERM_IN_MAX = 60000 // au-delà : 400 `entree trop grosse`

export const TermSizeSchema = z.object({
	cols: N.int().positive(),
	rows: N.int().positive(),
})
export const TermInBodySchema = z.object({ data: S.max(TERM_IN_MAX) })

export const TermOpenSchema = z.object({ vivant: B, pos: N })
export const TermInSchema = z.object({ ok: B, mort: B.optional() })
export const TermOkSchema = z.object({ ok: B })
export const TermEtatSchema = z.object({ vivant: B, code: N.nullable() })

// Ordre du `union` : un objet strip accepte les clés en trop, le plus précis d'abord
export const TermEventSchema = z.union([
	z.object({ o: S, pos: N }),
	z.object({ fin: N, pos: N }),
	z.object({ mort: z.literal(true) }),
])

export type TermSize = z.infer<typeof TermSizeSchema>
export type TermOpen = z.infer<typeof TermOpenSchema>
export type TermIn = z.infer<typeof TermInSchema>
export type TermEtat = z.infer<typeof TermEtatSchema>
export type TermEvent = z.infer<typeof TermEventSchema>

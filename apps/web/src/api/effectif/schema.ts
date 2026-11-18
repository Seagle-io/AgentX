import { z } from "zod"
import { SlugSchema } from "@/api/state/schema"

export const EffectifActionSchema = z.enum(["recruter", "licencier"])
export const EffectifBodySchema = z.object({
	etage: SlugSchema,
	role: z.string().min(1),
})
export const EffectifReponseSchema = z.object({
	ok: z.literal(true),
	etage: z.string(),
	postes: z.record(z.string(), z.number()),
})
export type EffectifAction = z.infer<typeof EffectifActionSchema>
export type EffectifBody = z.infer<typeof EffectifBodySchema>
export type EffectifReponse = z.infer<typeof EffectifReponseSchema>

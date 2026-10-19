import { z } from "zod"

export const DocSchema = z.object({
	chemin: z.string(),
	texte: z.string(),
	tronque: z.boolean().optional(),
})
export type Doc = z.infer<typeof DocSchema>

import { z } from "zod"

const S = z.string()

// Ticket d'une tâche : en-tête de task.md + pack + rendu (null tant que absent)
export const TacheSchema = z.object({
	tid: S,
	projet: S,
	titre: S,
	role: S,
	statut: S,
	pack: S,
	result: S.nullable(),
})

export type Tache = z.infer<typeof TacheSchema>

import {
	type UseMutationResult,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query"
import { ApiError, stateKey } from "@/api/state/crud"
import type { SalleState } from "@/api/state/schema"
import { chefDe } from "@/api/term/chef"
import { sendTerm } from "@/api/term/crud"
import { messageReponse } from "@/api/term/message"
import type { TermIn } from "@/api/term/schema"

type RepondreVars = { titre: string; texte: string; etage?: string }

// Réponse humaine à une question « Vos choix » : message au terminal du chef
export function useRepondre(
	slug: string | null,
): UseMutationResult<TermIn, ApiError, RepondreVars> {
	const queryClient = useQueryClient()
	return useMutation<TermIn, ApiError, RepondreVars>({
		mutationFn: async ({ titre, texte, etage }) => {
			const state = queryClient.getQueryData<SalleState>(stateKey(slug))
			if (!state?.jeton) throw new ApiError("jeton", null, "")
			const chef = chefDe(state.immeuble, etage ?? slug)
			const r1 = await sendTerm(state.jeton, messageReponse(titre, texte), chef)
			if (!r1.ok) return r1
			// écrit rapide multi-caractères = collage : Entrée part séparément
			await new Promise((r) => setTimeout(r, 150))
			return sendTerm(state.jeton, "\r", chef)
		},
		onSettled: () => queryClient.invalidateQueries({ queryKey: ["state"] }),
	})
}

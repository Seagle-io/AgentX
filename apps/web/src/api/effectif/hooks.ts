import {
	type UseMutationResult,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query"
import { changerEffectif } from "@/api/effectif/crud"
import type {
	EffectifAction,
	EffectifBody,
	EffectifReponse,
} from "@/api/effectif/schema"
import { ApiError, stateKey } from "@/api/state/crud"
import type { SalleState } from "@/api/state/schema"

export function useEffectif(
	slug: string | null,
): UseMutationResult<
	EffectifReponse,
	ApiError,
	{ action: EffectifAction; body: EffectifBody }
> {
	const queryClient = useQueryClient()
	return useMutation<
		EffectifReponse,
		ApiError,
		{ action: EffectifAction; body: EffectifBody }
	>({
		mutationFn: ({ action, body }) => {
			const jeton = queryClient.getQueryData<SalleState>(stateKey(slug))?.jeton
			if (!jeton) throw new ApiError("jeton", null, "")
			return changerEffectif(action, body, jeton)
		},
		// 400 et 403 compris : relit l'état réel et le jeton
		onSettled: () => queryClient.invalidateQueries({ queryKey: ["state"] }),
	})
}

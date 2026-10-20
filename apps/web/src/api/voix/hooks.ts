import {
	type UseMutationResult,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query"
import { ApiError, stateKey } from "@/api/state/crud"
import type { SalleState } from "@/api/state/schema"
import {
	effacerVoix,
	microVoix,
	modeVoix,
	passationAuto,
	type Voix,
} from "@/api/voix/crud"

export function useEffacerVoix(
	slug: string | null,
): UseMutationResult<Voix, ApiError, void> {
	const queryClient = useQueryClient()
	return useMutation<Voix, ApiError, void>({
		mutationFn: () => {
			const jeton = queryClient.getQueryData<SalleState>(stateKey(slug))?.jeton
			if (!jeton) throw new ApiError("jeton", null, "")
			return effacerVoix(jeton)
		},
		// 403 compris : relit le jeton neuf
		onSettled: () => queryClient.invalidateQueries({ queryKey: ["state"] }),
	})
}

export function usePassationAuto(
	slug: string | null,
): UseMutationResult<Voix, ApiError, boolean> {
	const queryClient = useQueryClient()
	return useMutation<Voix, ApiError, boolean>({
		mutationFn: (on) => {
			const jeton = queryClient.getQueryData<SalleState>(stateKey(slug))?.jeton
			if (!jeton) throw new ApiError("jeton", null, "")
			return passationAuto(jeton, on)
		},
		onSettled: () => queryClient.invalidateQueries({ queryKey: ["state"] }),
	})
}

export function useModeVoix(
	slug: string | null,
): UseMutationResult<Voix, ApiError, boolean> {
	const queryClient = useQueryClient()
	return useMutation<Voix, ApiError, boolean>({
		mutationFn: (on) => {
			const jeton = queryClient.getQueryData<SalleState>(stateKey(slug))?.jeton
			if (!jeton) throw new ApiError("jeton", null, "")
			return modeVoix(jeton, on)
		},
		onSettled: () => queryClient.invalidateQueries({ queryKey: ["state"] }),
	})
}

export function useMicroVoix(
	slug: string | null,
): UseMutationResult<Voix, ApiError, boolean> {
	const queryClient = useQueryClient()
	return useMutation<Voix, ApiError, boolean>({
		mutationFn: (on) => {
			const jeton = queryClient.getQueryData<SalleState>(stateKey(slug))?.jeton
			if (!jeton) throw new ApiError("jeton", null, "")
			return microVoix(jeton, on)
		},
		// 400 dictée absente compris : relit l'état réel
		onSettled: () => queryClient.invalidateQueries({ queryKey: ["state"] }),
	})
}

import {
	keepPreviousData,
	type MutationState,
	type UseMutationResult,
	type UseQueryResult,
	useMutation,
	useMutationState,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query"
import { ApiError, fetchState, runCommand, stateKey } from "@/api/state/crud"
import type { RunBody, RunResult, SalleState } from "@/api/state/schema"

const BUILD_KEY = "agentx.build"

// Recharger quand un nouveau build est servi, hors saisie en cours
export function doitRecharger(
	precedent: string | null,
	courant: string | null,
	saisieEnCours: boolean,
): boolean {
	return (
		precedent !== null &&
		courant !== null &&
		courant !== precedent &&
		!saisieEnCours
	)
}

let premierBuild: string | null = null

function surveillerBuild(build: string | null | undefined): void {
	if (!build) return
	premierBuild ??= sessionStorage.getItem(BUILD_KEY) ?? build
	const actif = document.activeElement
	const saisie =
		actif instanceof HTMLInputElement || actif instanceof HTMLTextAreaElement
	if (doitRecharger(premierBuild, build, saisie)) {
		sessionStorage.setItem(BUILD_KEY, build)
		location.reload()
	}
}

export function useSalleState<T = SalleState>(
	slug: string | null,
	select?: (s: SalleState) => T,
): UseQueryResult<T, ApiError> {
	return useQuery<SalleState, ApiError, T>({
		queryKey: stateKey(slug),
		queryFn: async ({ signal }) => {
			const etat = await fetchState(slug, signal)
			surveillerBuild(etat.build)
			return etat
		},
		select,
		refetchInterval: 2000,
		refetchIntervalInBackground: false,
		staleTime: 1000,
		placeholderData: keepPreviousData,
		retry: 2,
	})
}

export type RunScope = "projet" | "agrege" // agrege = item todo, autre étage autorisé
type RunVars = { body: RunBody; scope: RunScope }
const RUN_KEY = ["run"]

export function useRunCommand(
	slug: string | null,
): UseMutationResult<RunResult, ApiError, RunVars> {
	const queryClient = useQueryClient()
	return useMutation<RunResult, ApiError, RunVars>({
		mutationKey: RUN_KEY,
		mutationFn: ({ body, scope }) => {
			const state = queryClient.getQueryData<SalleState>(stateKey(slug))
			if (!state?.jeton) throw new ApiError("jeton", null, "")
			if (
				scope === "projet" &&
				body.projet !== undefined &&
				body.projet !== state.projet.slug
			)
				throw new ApiError("refus", null, "etage-change")
			return runCommand(body, state.jeton)
		},
		// 403 compris : relit le jeton neuf
		onSettled: () => queryClient.invalidateQueries({ queryKey: ["state"] }),
	})
}

export type LastRun = {
	body: RunBody
	result?: RunResult
	error?: ApiError
	pending: boolean
}

// sortie partagée todo ↔ console, 0 store
export function useLastRun(): LastRun | null {
	const dernier = useMutationState({
		filters: { mutationKey: RUN_KEY },
		// le cache de mutations n'est pas typé par clé : seul cast du module
		select: (m) => m.state as MutationState<RunResult, ApiError, RunVars>,
	}).at(-1)
	if (!dernier?.variables) return null
	return {
		body: dernier.variables.body,
		result: dernier.data ?? undefined,
		error: dernier.error ?? undefined,
		pending: dernier.status === "pending",
	}
}

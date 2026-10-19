import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import type { ApiError } from "@/api/state/crud"
import { fetchTache } from "@/api/tache/crud"
import type { Tache } from "@/api/tache/schema"

export function useTache(
	slug: string | null,
	tid: string | null,
	enabled: boolean,
): UseQueryResult<Tache, ApiError> {
	return useQuery<Tache, ApiError>({
		queryKey: ["tache", slug, tid],
		queryFn: ({ signal }) => fetchTache(slug ?? "", tid ?? "", signal),
		enabled: enabled && slug !== null && tid !== null,
		staleTime: 10_000,
	})
}

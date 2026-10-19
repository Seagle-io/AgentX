import { type UseQueryResult, useQuery } from "@tanstack/react-query"
import { fetchDoc } from "@/api/doc/crud"
import type { Doc } from "@/api/doc/schema"
import type { ApiError } from "@/api/state/crud"

export function useDoc(
	chemin: string | null,
	enabled: boolean,
): UseQueryResult<Doc, ApiError> {
	return useQuery<Doc, ApiError>({
		queryKey: ["doc", chemin],
		queryFn: ({ signal }) => fetchDoc(chemin ?? "", signal),
		enabled: enabled && !!chemin,
		staleTime: 10_000,
	})
}

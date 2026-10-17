import { ApiError, appeler, echecHttp } from "@/api/state/crud"
import { type Tache, TacheSchema } from "@/api/tache/schema"

export async function fetchTache(
	slug: string,
	tid: string,
	signal?: AbortSignal,
): Promise<Tache> {
	const url = `api/tache?projet=${encodeURIComponent(slug)}&tid=${encodeURIComponent(tid)}`
	const { status, corps } = await appeler(url, { signal })
	if (status !== 200) throw echecHttp(status, corps)
	const tache = TacheSchema.safeParse(corps)
	if (!tache.success) throw new ApiError("schema", 200, tache.error.message)
	return tache.data
}

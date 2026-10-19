import { type Doc, DocSchema } from "@/api/doc/schema"
import { ApiError, appeler, echecHttp } from "@/api/state/crud"

export async function fetchDoc(
	chemin: string,
	signal?: AbortSignal,
): Promise<Doc> {
	const url = `api/doc?chemin=${encodeURIComponent(chemin)}`
	const { status, corps } = await appeler(url, { signal })
	if (status !== 200) throw echecHttp(status, corps)
	const doc = DocSchema.safeParse(corps)
	if (!doc.success) throw new ApiError("schema", 200, doc.error.message)
	return doc.data
}

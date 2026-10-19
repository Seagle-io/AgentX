import { z } from "zod"
import { ApiError, appeler, echecHttp } from "@/api/state/crud"
import { VoixSchema } from "@/api/state/schema"

export type Voix = z.infer<typeof VoixSchema>

const EffaceSchema = z.object({ ok: z.literal(true), voix: VoixSchema })

// vide le journal vocal du chef ; rend l'état voix neuf
export async function effacerVoix(token: string): Promise<Voix> {
	const { status, corps } = await appeler("api/voix/effacer", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-AgentX-Jeton": token,
		},
		body: JSON.stringify({}),
	})
	if (status !== 200) throw echecHttp(status, corps)
	const resultat = EffaceSchema.safeParse(corps)
	if (!resultat.success)
		throw new ApiError("schema", 200, resultat.error.message)
	return resultat.data.voix
}

// bascule la passation automatique du chef ; rend l'état voix neuf
export async function passationAuto(token: string, on: boolean): Promise<Voix> {
	const { status, corps } = await appeler("api/voix/passation", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-AgentX-Jeton": token,
		},
		body: JSON.stringify({ on }),
	})
	if (status !== 200) throw echecHttp(status, corps)
	const resultat = EffaceSchema.safeParse(corps)
	if (!resultat.success)
		throw new ApiError("schema", 200, resultat.error.message)
	return resultat.data.voix
}

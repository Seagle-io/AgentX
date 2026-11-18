import {
	type EffectifAction,
	type EffectifBody,
	EffectifBodySchema,
	type EffectifReponse,
	EffectifReponseSchema,
} from "@/api/effectif/schema"
import { ApiError, appeler, echecHttp } from "@/api/state/crud"

// recrute ou licencie un poste de rôle sur un étage ; 400 ⇒ `erreur` du corps
export async function changerEffectif(
	action: EffectifAction,
	body: EffectifBody,
	token: string,
): Promise<EffectifReponse> {
	const { status, corps } = await appeler(`api/effectif/${action}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-AgentX-Jeton": token,
		},
		body: JSON.stringify(EffectifBodySchema.parse(body)),
	})
	if (status !== 200) throw echecHttp(status, corps)
	const resultat = EffectifReponseSchema.safeParse(corps)
	if (!resultat.success)
		throw new ApiError("schema", 200, resultat.error.message)
	return resultat.data
}

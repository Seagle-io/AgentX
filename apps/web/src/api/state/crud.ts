import {
	ApiErreurSchema,
	type RunBody,
	RunBodySchema,
	type RunResult,
	RunResultSchema,
	type SalleState,
	SalleStateSchema,
	StateErreurSchema,
} from "@/api/state/schema"

// URLs relatives (base './') ; cache: 'no-store' ; aucun `as` sur une réponse
export type ApiErrorKind =
	| "jeton"
	| "refus"
	| "introuvable"
	| "serveur"
	| "delai"
	| "reseau"
	| "schema"

export class ApiError extends Error {
	constructor(
		readonly kind: ApiErrorKind,
		readonly status: number | null,
		message: string,
	) {
		super(message)
		this.name = "ApiError"
	}
}

type Reponse = { status: number; corps: unknown }

async function appeler(url: string, init: RequestInit): Promise<Reponse> {
	let reponse: Response
	try {
		reponse = await fetch(url, { ...init, cache: "no-store" })
	} catch (e) {
		if (e instanceof TypeError) throw new ApiError("reseau", null, e.message)
		throw e
	}
	let corps: unknown = null
	try {
		corps = await reponse.json()
	} catch {
		corps = null // corps non JSON ⇒ échec de schéma plus bas
	}
	return { status: reponse.status, corps }
}

export async function fetchState(
	slug: string | null,
	signal?: AbortSignal,
): Promise<SalleState> {
	const url = `state.json${slug ? `?projet=${encodeURIComponent(slug)}` : ""}`
	const { status, corps } = await appeler(url, { signal })
	if (status !== 200) throw echecHttp(status, corps)
	const erreur = StateErreurSchema.safeParse(corps)
	if (erreur.success) throw new ApiError("serveur", 200, erreur.data.erreur)
	const etat = SalleStateSchema.safeParse(corps)
	if (!etat.success) throw new ApiError("schema", 200, etat.error.message)
	return etat.data
}

function kindDeStatut(status: number): ApiErrorKind {
	switch (status) {
		case 400:
			return "refus"
		case 403:
			return "jeton"
		case 404:
			return "introuvable"
		case 408:
		case 504:
			return "delai"
		default:
			return "serveur"
	}
}

// Statut ≠ 200 : le message vient du corps `{erreur}` s'il est conforme
function echecHttp(status: number, corps: unknown): ApiError {
	const erreur = ApiErreurSchema.safeParse(corps)
	const message = erreur.success ? erreur.data.erreur : ""
	return new ApiError(kindDeStatut(status), status, message)
}

export async function runCommand(
	body: RunBody,
	token: string,
): Promise<RunResult> {
	const envoye = RunBodySchema.parse(body)
	const { status, corps } = await appeler("api/run", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-AgentX-Jeton": token,
		},
		body: JSON.stringify(envoye),
	})
	if (status !== 200) throw echecHttp(status, corps)
	const resultat = RunResultSchema.safeParse(corps)
	if (!resultat.success)
		throw new ApiError("schema", 200, resultat.error.message)
	return resultat.data
}

export const stateKey = (slug: string | null) =>
	["state", slug ?? "@defaut"] as const

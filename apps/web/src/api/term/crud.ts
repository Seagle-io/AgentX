import type { z } from "zod"
import { ApiError, kindDeStatut } from "@/api/state/crud"
import { ApiErreurSchema } from "@/api/state/schema"
import {
	type TermEtat,
	TermEtatSchema,
	type TermIn,
	TermInBodySchema,
	TermInSchema,
	TermOkSchema,
	type TermOpen,
	TermOpenSchema,
	TermSizeSchema,
} from "@/api/term/schema"

// Session chef (démon bin/terminal.py) : POST JSON + jeton, flux SSE
// `appeler` n'est pas exporté par api/state/crud : même forme ici
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
		corps = null // corps non JSON (404 HTML) ⇒ échec de schéma plus bas
	}
	return { status: reponse.status, corps }
}

async function poster<T>(
	route: string,
	token: string,
	body: unknown,
	schema: z.ZodType<T>,
): Promise<T> {
	const { status, corps } = await appeler(`api/term/${route}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-AgentX-Jeton": token,
		},
		body: JSON.stringify(body),
	})
	if (status !== 200) {
		const erreur = ApiErreurSchema.safeParse(corps)
		const message = erreur.success ? erreur.data.erreur : ""
		throw new ApiError(kindDeStatut(status), status, message)
	}
	const resultat = schema.safeParse(corps)
	if (!resultat.success)
		throw new ApiError("schema", 200, resultat.error.message)
	return resultat.data
}

// idempotent : rattache si la session est vivante, sinon lance `claude`
export function openTerm(
	token: string,
	cols: number,
	rows: number,
): Promise<TermOpen> {
	const taille = TermSizeSchema.parse({ cols, rows })
	return poster("open", token, taille, TermOpenSchema)
}

export function sendTerm(token: string, data: string): Promise<TermIn> {
	const envoye = TermInBodySchema.parse({ data })
	return poster("in", token, envoye, TermInSchema)
}

export async function resizeTerm(
	token: string,
	cols: number,
	rows: number,
): Promise<void> {
	const taille = TermSizeSchema.parse({ cols, rows })
	await poster("resize", token, taille, TermOkSchema)
}

// ferme la session chef pour de bon : l'appelant confirme avant
export async function stopTerm(token: string): Promise<void> {
	await poster("stop", token, {}, TermOkSchema)
}

export function etatTerm(token: string): Promise<TermEtat> {
	return poster("etat", token, {}, TermEtatSchema)
}

// messages `data:` à valider par TermEventSchema ; `: vivant` n'émet rien
export function openStream(token: string, depuis: number): EventSource {
	const q = `jeton=${encodeURIComponent(token)}&depuis=${Math.max(0, Math.trunc(depuis))}`
	return new EventSource(`api/term/stream?${q}`)
}

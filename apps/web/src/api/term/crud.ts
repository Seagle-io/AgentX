import { z } from "zod"
import { ApiError, kindDeStatut } from "@/api/state/crud"
import { ApiErreurSchema, type Chef, ChefSchema } from "@/api/state/schema"
import { CHEF_DEFAUT } from "@/api/term/chef"
import {
	type LoginEtat,
	LoginEtatSchema,
	type LoginOpen,
	LoginOpenSchema,
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
	url: string,
	token: string,
	body: unknown,
	schema: z.ZodType<T>,
): Promise<T> {
	const { status, corps } = await appeler(url, {
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

const routeTerm = (route: string, chef: string) =>
	`api/term/${route}?chef=${encodeURIComponent(chef)}`

// idempotent : rattache si la session est vivante, sinon lance `claude`
export function openTerm(
	token: string,
	cols: number,
	rows: number,
	chef: string = CHEF_DEFAUT,
	compte?: string,
): Promise<TermOpen> {
	const taille = TermSizeSchema.parse({ cols, rows })
	const url =
		routeTerm("open", chef) +
		(compte ? `&compte=${encodeURIComponent(compte)}` : "")
	return poster(url, token, taille, TermOpenSchema)
}

export function sendTerm(
	token: string,
	data: string,
	chef: string = CHEF_DEFAUT,
): Promise<TermIn> {
	const envoye = TermInBodySchema.parse({ data })
	return poster(routeTerm("in", chef), token, envoye, TermInSchema)
}

export async function resizeTerm(
	token: string,
	cols: number,
	rows: number,
	chef: string = CHEF_DEFAUT,
): Promise<void> {
	const taille = TermSizeSchema.parse({ cols, rows })
	await poster(routeTerm("resize", chef), token, taille, TermOkSchema)
}

// ferme la session chef pour de bon : l'appelant confirme avant
export async function stopTerm(
	token: string,
	chef: string = CHEF_DEFAUT,
): Promise<void> {
	await poster(routeTerm("stop", chef), token, {}, TermOkSchema)
}

export function etatTerm(
	token: string,
	chef: string = CHEF_DEFAUT,
): Promise<TermEtat> {
	return poster(routeTerm("etat", chef), token, {}, TermEtatSchema)
}

// messages `data:` à valider par TermEventSchema ; `: vivant` n'émet rien
export function openStream(
	token: string,
	depuis: number,
	chef: string = CHEF_DEFAUT,
): EventSource {
	const q = `jeton=${encodeURIComponent(token)}&depuis=${Math.max(0, Math.trunc(depuis))}&chef=${encodeURIComponent(chef)}`
	return new EventSource(`api/term/stream?${q}`)
}

const ChefsReponseSchema = z.object({ chefs: z.array(ChefSchema) })

// tenant d'un étage ⇒ autre chef ; 409 (plafond, compte, chef mort) : message serveur dans ApiError
export function reaffecter(
	token: string,
	etage: string,
	vers: string,
): Promise<{ chefs: Chef[] }> {
	return poster(
		"api/chef/reaffecter",
		token,
		{ etage, vers },
		ChefsReponseSchema,
	)
}

// chef dédié neuf sur l'étage ; 400/404/409 : message serveur dans ApiError
export function ouvrirChef(
	token: string,
	etage: string,
	cle: string,
	compte: string,
): Promise<{ chefs: Chef[] }> {
	return poster(
		"api/chef/ouvrir",
		token,
		{ etage, cle, compte },
		ChefsReponseSchema,
	)
}

const routeLogin = (action: string, compte: string) =>
	`api/login/${action}?compte=${encodeURIComponent(compte)}`

// 409 `compte-connecte` | `login-en-cours` : message serveur dans ApiError
export function openLogin(token: string, compte: string): Promise<LoginOpen> {
	return poster(routeLogin("open", compte), token, {}, LoginOpenSchema)
}

export function sendLogin(
	token: string,
	compte: string,
	data: string,
): Promise<TermIn> {
	const envoye = TermInBodySchema.parse({ data })
	return poster(routeLogin("in", compte), token, envoye, TermInSchema)
}

export async function stopLogin(token: string, compte: string): Promise<void> {
	await poster(routeLogin("stop", compte), token, {}, TermOkSchema)
}

export function etatLogin(token: string, compte: string): Promise<LoginEtat> {
	return poster(routeLogin("etat", compte), token, {}, LoginEtatSchema)
}

// mêmes messages `data:` que openStream (TermEventSchema)
export function openLoginStream(
	token: string,
	compte: string,
	depuis: number,
): EventSource {
	const q = `jeton=${encodeURIComponent(token)}&depuis=${Math.max(0, Math.trunc(depuis))}&compte=${encodeURIComponent(compte)}`
	return new EventSource(`api/login/stream?${q}`)
}

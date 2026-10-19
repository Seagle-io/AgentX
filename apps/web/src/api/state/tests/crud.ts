import { afterEach, describe, expect, it, vi } from "vitest"
import {
	ApiError,
	fetchState,
	kindDeStatut,
	runCommand,
	stateKey,
} from "@/api/state/crud"
import { stateFixture } from "@/api/state/fixture"

type Appel = { url: string; init: RequestInit | undefined }

// Remplace le réseau global ; renvoie les appels reçus
function reseau(reponse: Response | Error): Appel[] {
	const appels: Appel[] = []
	vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
		appels.push({ url, init })
		return reponse instanceof Error
			? Promise.reject(reponse)
			: Promise.resolve(reponse.clone()) // un corps lisible par appel
	})
	return appels
}

const json = (corps: unknown, status = 200) =>
	new Response(JSON.stringify(corps), { status })

async function erreurDe(p: Promise<unknown>): Promise<ApiError> {
	try {
		await p
	} catch (e) {
		if (e instanceof ApiError) return e
		throw e
	}
	throw new Error("aucune erreur levée")
}

const body = { action: "board", projet: "agentx" }

afterEach(() => vi.unstubAllGlobals())

describe("fetchState", () => {
	it("200 fixture → SalleState", async () => {
		const appels = reseau(json(stateFixture))
		const etat = await fetchState("salle-v2")
		expect(etat.projet.slug).toBe("salle-v2")
		expect(appels[0]?.init?.cache).toBe("no-store")
	})

	it("200 {erreur} → ApiError serveur", async () => {
		reseau(json({ erreur: "boum" }))
		const e = await erreurDe(fetchState(null))
		expect(e.kind).toBe("serveur")
		expect(e.status).toBe(200)
		expect(e.message).toBe("boum")
	})

	it("corps invalide → ApiError schema", async () => {
		reseau(json({ taches: [] }))
		const e = await erreurDe(fetchState(null))
		expect(e.kind).toBe("schema")
	})

	it("500 corps {} → ApiError serveur, pas schema", async () => {
		reseau(json({}, 500))
		const e = await erreurDe(fetchState(null))
		expect(e.kind).toBe("serveur")
		expect(e.status).toBe(500)
	})

	it("TypeError réseau → ApiError reseau", async () => {
		reseau(new TypeError("Failed to fetch"))
		const e = await erreurDe(fetchState(null))
		expect(e.kind).toBe("reseau")
		expect(e.status).toBeNull()
	})

	it("encode le slug dans l'URL, sans slug pas de query", async () => {
		const appels = reseau(json(stateFixture))
		await fetchState("a b")
		await fetchState(null)
		expect(appels[0]?.url).toBe("state.json?etage=a%20b")
		expect(appels[1]?.url).toBe("state.json")
	})
})

describe("runCommand", () => {
	it("200 → RunResult, POST api/run avec jeton et JSON", async () => {
		const resultat = { commande: "vx.py board", code: 0, out: "ok", err: "" }
		const appels = reseau(json(resultat))
		expect(await runCommand(body, "abc")).toEqual(resultat)
		const init = appels[0]?.init
		expect(appels[0]?.url).toBe("api/run")
		expect(init?.method).toBe("POST")
		expect(init?.cache).toBe("no-store")
		expect(init?.headers).toMatchObject({
			"Content-Type": "application/json",
			"X-AgentX-Jeton": "abc",
		})
		expect(init?.body).toBe(JSON.stringify(body))
	})

	it.each([
		[403, "jeton"],
		[400, "refus"],
		[404, "introuvable"],
		[504, "delai"],
		[500, "serveur"],
	])("%i → ApiError %s avec le message serveur", async (status, kind) => {
		reseau(json({ erreur: "detail" }, status))
		const e = await erreurDe(runCommand(body, "abc"))
		expect(e.kind).toBe(kind)
		expect(e.status).toBe(status)
		expect(e.message).toBe("detail")
	})

	it("corps 200 invalide → ApiError schema", async () => {
		reseau(json({ commande: 1 }))
		const e = await erreurDe(runCommand(body, "abc"))
		expect(e.kind).toBe("schema")
	})

	it("corps refusé par RunBodySchema → 0 appel réseau", async () => {
		const appels = reseau(json({}))
		await expect(runCommand({ action: "" }, "abc")).rejects.toThrow()
		expect(appels).toHaveLength(0)
	})
})

describe("stateKey", () => {
	it("slug ou @defaut", () => {
		expect(stateKey("agentx")).toEqual(["state", "agentx"])
		expect(stateKey(null)).toEqual(["state", "@defaut"])
	})
})

describe("kindDeStatut", () => {
	it("statut HTTP → famille d'erreur", () => {
		expect([400, 403, 404, 408, 504, 500].map((c) => kindDeStatut(c))).toEqual([
			"refus",
			"jeton",
			"introuvable",
			"delai",
			"delai",
			"serveur",
		])
	})
})

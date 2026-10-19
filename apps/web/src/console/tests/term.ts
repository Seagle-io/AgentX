import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ApiError, stateKey } from "@/api/state/crud"
import { stateFixture } from "@/api/state/fixture"
import { type SalleState, SalleStateSchema } from "@/api/state/schema"
import { openTerm, stopTerm } from "@/api/term/crud"
import type { TermIn } from "@/api/term/schema"
import Terminal from "@/console/component/Terminal"
import {
	COALESCE_DELAI,
	couperSync,
	decoder,
	modes,
	octets,
	RETRY_DELAI,
	SYNC_DELAI,
	type TermApi,
	TermSession,
	type TermStatut,
} from "@/console/script/term"

const ESC = "\x1b"
const b64 = (s: string) => btoa(s)
const sortie = (s: string, pos: number) => JSON.stringify({ o: b64(s), pos })
const texte = (d: Uint8Array | string) =>
	typeof d === "string" ? d : String.fromCharCode(...d)

type Flux = {
	token: string
	depuis: number
	recevoir: (data: string) => void
	erreur: () => void
	ferme: boolean
}

function monter(etat = { vivant: false, code: null }) {
	const flux: Flux[] = []
	const ecrit: string[] = []
	const statuts: TermStatut[] = []
	const port = {
		write: vi.fn((d: Uint8Array | string) => {
			ecrit.push(texte(d))
		}),
		reset: vi.fn(),
		repaint: vi.fn(),
	}
	const api = {
		open: vi.fn(async () => ({ vivant: true, pos: 0 })),
		send: vi.fn(async (): Promise<TermIn> => ({ ok: true })),
		resize: vi.fn(async () => {}),
		stop: vi.fn(async () => {}),
		etat: vi.fn(async () => etat),
		stream: vi.fn((token, depuis, recevoir, erreur) => {
			const f: Flux = { token, depuis, recevoir, erreur, ferme: false }
			flux.push(f)
			return () => {
				f.ferme = true
			}
		}),
	} satisfies TermApi
	const session = new TermSession({
		api,
		port,
		statut: (s) => statuts.push(s),
		erreur: (e) => {
			throw e
		},
	})
	return { session, api, port, flux, ecrit, statuts }
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
	vi.useRealTimers()
	vi.unstubAllGlobals()
})

describe("decoder", () => {
	it("décode la sortie base64 en chaîne binaire", () => {
		expect(decoder(sortie("salut", 5))).toEqual({ bin: "salut", pos: 5 })
		expect(texte(octets("\xff\x00a"))).toBe("\xff\x00a")
		expect(octets("\xff")[0]).toBe(255)
	})
	it("reconnaît mort et fin, ignore le reste", () => {
		expect(decoder('{"mort":true}')).toEqual({ mort: true })
		expect(decoder('{"fin":0,"pos":9}')).toEqual({ fin: 0, pos: 9 })
		expect(decoder("vivant")).toBeNull()
		expect(decoder('{"x":1}')).toBeNull()
	})
})

describe("modes et DEC 2026", () => {
	it("ne garde que l'état final des modes, sans 2026", () => {
		const t = `${ESC}[?1049h${ESC}[?2026h${ESC}[?1000;1006h a ${ESC}[?1000l`
		expect(modes(t)).toBe(`${ESC}[?1049h${ESC}[?1000l${ESC}[?1006h`)
	})
	it("retient une image ouverte et un marqueur coupé", () => {
		expect(couperSync(`a${ESC}[?2026hb`)).toEqual({
			ecrit: "a",
			retenu: `${ESC}[?2026hb`,
		})
		expect(couperSync(`a${ESC}[?2026hb${ESC}[?2026l`).retenu).toBe("")
		expect(couperSync(`a${ESC}[?20`)).toEqual({
			ecrit: "a",
			retenu: `${ESC}[?20`,
		})
	})
	it("écrit l'image retenue après 150 ms si jamais close", async () => {
		const m = monter()
		await m.session.jeton("j1")
		await m.session.lancer(80, 24)
		m.flux[0].recevoir(sortie(`x${ESC}[?2026hy`, 10))
		expect(m.ecrit).toEqual(["x"])
		vi.advanceTimersByTime(SYNC_DELAI)
		expect(m.ecrit).toEqual(["x", `${ESC}[?2026hy`])
	})
})

describe("TermSession", () => {
	it("rattache si open.pos > 4096 : reset, modes seuls, repaint", async () => {
		const m = monter()
		m.api.open.mockResolvedValueOnce({ vivant: true, pos: 9000 })
		await m.session.jeton("j1")
		await m.session.lancer(80, 24)
		expect(m.flux[0].depuis).toBe(0)
		m.flux[0].recevoir(sortie(`bouillie${ESC}[?1049h`, 9000))
		expect(m.port.reset).toHaveBeenCalledOnce()
		expect(m.ecrit).toEqual([`${ESC}[?1049h`])
		expect(m.port.repaint).toHaveBeenCalledOnce()
		m.flux[0].recevoir(sortie("suite", 9005))
		expect(m.ecrit.at(-1)).toBe("suite")
		expect(m.session.pos).toBe(9005)
	})
	it("page rechargée, session vivante : rattachement depuis 0", async () => {
		const m = monter({ vivant: true, code: null })
		await m.session.jeton("j1")
		expect(m.statuts).toEqual(["vivant"])
		expect(m.flux[0]).toMatchObject({ token: "j1", depuis: 0 })
		m.flux[0].recevoir(sortie("ancien", 50))
		expect(m.port.reset).toHaveBeenCalledOnce()
	})
	it("onerror ⇒ ferme et reprend à la position connue après 1,5 s", async () => {
		const m = monter()
		await m.session.jeton("j1")
		await m.session.lancer(80, 24)
		m.flux[0].recevoir(sortie("abc", 3))
		m.flux[0].erreur()
		expect(m.flux[0].ferme).toBe(true)
		vi.advanceTimersByTime(RETRY_DELAI - 1)
		expect(m.flux).toHaveLength(1)
		vi.advanceTimersByTime(1)
		expect(m.flux[1]).toMatchObject({ depuis: 3, ferme: false })
	})
	it("mort ⇒ arrêt, aucune reprise", async () => {
		const m = monter()
		await m.session.jeton("j1")
		await m.session.lancer(80, 24)
		m.flux[0].recevoir('{"mort":true}')
		expect(m.session.vivant).toBe(false)
		expect(m.statuts.at(-1)).toBe("mort")
		m.flux[0].erreur()
		vi.advanceTimersByTime(RETRY_DELAI * 2)
		expect(m.flux).toHaveLength(1)
	})
	it("fin ⇒ flux fermé, code transmis", async () => {
		const m = monter()
		await m.session.jeton("j1")
		await m.session.lancer(80, 24)
		m.flux[0].recevoir('{"fin":0,"pos":12}')
		expect(m.flux[0].ferme).toBe(true)
		expect(m.statuts.at(-1)).toBe("fin")
		expect(m.session.pos).toBe(12)
	})
	it("jeton neuf ⇒ flux rouvert avec lui, même position", async () => {
		const m = monter()
		await m.session.jeton("j1")
		await m.session.lancer(80, 24)
		m.flux[0].recevoir(sortie("abc", 3))
		await m.session.jeton("j1")
		expect(m.flux).toHaveLength(1)
		await m.session.jeton("j2")
		expect(m.flux[0].ferme).toBe(true)
		expect(m.flux[1]).toMatchObject({ token: "j2", depuis: 3 })
	})
	it("touches coalescées en un seul envoi (16 ms)", async () => {
		const m = monter()
		await m.session.jeton("j1")
		await m.session.lancer(80, 24)
		m.session.envoyer("ec")
		m.session.envoyer("ho\r")
		expect(m.api.send).not.toHaveBeenCalled()
		await vi.advanceTimersByTimeAsync(COALESCE_DELAI)
		expect(m.api.send).toHaveBeenCalledExactlyOnceWith("j1", "echo\r")
	})
	it("in renvoie mort ⇒ session marquée morte", async () => {
		const m = monter()
		m.api.send.mockResolvedValueOnce({ ok: false, mort: true })
		await m.session.jeton("j1")
		await m.session.lancer(80, 24)
		m.session.envoyer("a")
		await vi.advanceTimersByTimeAsync(COALESCE_DELAI)
		expect(m.session.vivant).toBe(false)
		expect(m.flux[0].ferme).toBe(true)
	})
	it("keep-alive et session absente : rien n'est écrit ni envoyé", async () => {
		const m = monter()
		await m.session.jeton("j1")
		expect(m.statuts).toEqual(["absent"])
		expect(m.flux).toHaveLength(0)
		m.session.envoyer("x")
		await vi.advanceTimersByTimeAsync(COALESCE_DELAI)
		expect(m.api.send).not.toHaveBeenCalled()
	})
})

describe("stopTerm (mock, jamais la vraie session)", () => {
	it("POST api/term/stop avec le jeton", async () => {
		const fetch = vi.fn(async () => Response.json({ ok: true }))
		vi.stubGlobal("fetch", fetch)
		await stopTerm("jt")
		expect(fetch).toHaveBeenCalledOnce()
		const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
		expect(url).toBe("api/term/stop?chef=defaut")
		expect(init.method).toBe("POST")
		expect(init.headers).toMatchObject({ "X-AgentX-Jeton": "jt" })
	})
	it("403 ⇒ ApiError jeton", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => Response.json({ erreur: "jeton" }, { status: 403 })),
		)
		await expect(stopTerm("jt")).rejects.toMatchObject({ kind: "jeton" })
		await expect(stopTerm("jt")).rejects.toBeInstanceOf(ApiError)
	})
})

describe("?chef= et &compte=", () => {
	it("open : chef et compte encodés dans l'url, défaut sans chef", async () => {
		const fetch = vi.fn(async () => Response.json({ vivant: true, pos: 0 }))
		vi.stubGlobal("fetch", fetch)
		await openTerm("jt", 80, 24)
		await openTerm("jt", 80, 24, "c 2", "perso")
		const urls = fetch.mock.calls.map((c) => (c as unknown as [string])[0])
		expect(urls).toEqual([
			"api/term/open?chef=defaut",
			"api/term/open?chef=c%202&compte=perso",
		])
	})
})

describe("case passation auto", () => {
	const base = SalleStateSchema.parse(stateFixture)
	const voix = {
		mode: true,
		parle: false,
		en_cours: false,
		dictee: false,
		ecoute: false,
		passation_auto: true,
		journal: [],
	}
	const rendu = (etat: SalleState) => {
		const qc = new QueryClient()
		qc.setQueryData(stateKey(null), etat)
		return renderToStaticMarkup(
			createElement(
				QueryClientProvider,
				{ client: qc },
				createElement(Terminal, { chef: "defaut" }),
			),
		)
	}
	const input = (html: string) => html.match(/<input[^>]*>/)?.[0] ?? ""

	it("voix.passation_auto ⇒ case cochée", () => {
		const html = rendu({ ...base, voix })
		expect(html).toContain('data-testid="passation-auto"')
		expect(input(html)).toContain("checked")
		expect(input(html)).toContain("accent-accent")
		expect(html).toContain("min-h-6")
		expect(input(html)).not.toContain("disabled")
	})
	it("voix null ⇒ case disabled", () => {
		expect(input(rendu({ ...base, voix: null }))).toContain("disabled")
	})
})

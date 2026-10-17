import {
	TERM_IN_MAX,
	type TermEtat,
	TermEventSchema,
	type TermIn,
	type TermOpen,
} from "@/api/term/schema"

// Session terminal chef, sans xterm ni réseau : fidèle à la v1
const ESC = "\x1b"
const SYNC_DEBUT = `${ESC}[?2026h`
const SYNC_FIN = `${ESC}[?2026l`
const MODE = new RegExp(`${ESC}\\[\\?([\\d;]+)([hl])`, "g")

export const SYNC_DELAI = 150 // image DEC 2026 jamais close : écrite quand même
export const RETRY_DELAI = 1500
export const COALESCE_DELAI = 16
export const RATTACHE_SEUIL = 4096 // open.pos au-delà : on ne rejoue pas l'historique

// `bin` : chaîne binaire (1 caractère = 1 octet), comme `atob`
export type TermMessage =
	| { bin: string; pos: number }
	| { fin: number; pos: number }
	| { mort: true }

// une ligne `data:` du flux ; null = ignorée (non JSON, forme inconnue)
export function decoder(data: string): TermMessage | null {
	let brut: unknown
	try {
		brut = JSON.parse(data)
	} catch {
		return null
	}
	const ev = TermEventSchema.safeParse(brut)
	if (!ev.success) return null
	if ("o" in ev.data) return { bin: atob(ev.data.o), pos: ev.data.pos }
	return ev.data
}

export function octets(bin: string): Uint8Array {
	const sortie = new Uint8Array(bin.length)
	for (let i = 0; i < bin.length; i++) sortie[i] = bin.charCodeAt(i)
	return sortie
}

/* Claude Code dessine par différences : rejouer l'historique à une autre
   taille donne de la bouillie. En rattachement on ne garde que l'état final
   des modes (écran alternatif, souris, collage…). */
export function modes(texte: string): string {
	const etat = new Map<string, string>()
	for (const m of texte.matchAll(MODE))
		for (const n of m[1].split(";")) if (n !== "2026") etat.set(n, m[2])
	return [...etat].map(([n, v]) => `${ESC}[?${n}${v}`).join("")
}

// DEC 2026 : on retient l'image ouverte (ou un marqueur coupé) jusqu'à sa fin
export function couperSync(txt: string): { ecrit: string; retenu: string } {
	let coupe = txt.length
	const debut = txt.lastIndexOf(SYNC_DEBUT)
	if (debut > txt.lastIndexOf(SYNC_FIN)) coupe = debut
	else {
		const k = txt.lastIndexOf(ESC)
		if (
			k >= 0 &&
			txt.length - k < SYNC_DEBUT.length &&
			SYNC_DEBUT.startsWith(txt.slice(k))
		)
			coupe = k
	}
	return { ecrit: txt.slice(0, coupe), retenu: txt.slice(coupe) }
}

export type TermStatut = "vivant" | "absent" | "mort" | "fin"

export type TermApi = {
	open(token: string, cols: number, rows: number): Promise<TermOpen>
	send(token: string, data: string): Promise<TermIn>
	resize(token: string, cols: number, rows: number): Promise<void>
	stop(token: string): Promise<void>
	etat(token: string): Promise<TermEtat>
	// ouvre le flux ; rend la fonction qui le ferme
	stream(
		token: string,
		depuis: number,
		recevoir: (data: string) => void,
		erreur: () => void,
	): () => void
}

export type TermPort = {
	write(data: Uint8Array | string): void
	reset(): void
	repaint(): void // taille réelle forcée (resize −1 ligne puis réelle)
}

export type TermDeps = {
	api: TermApi
	port: TermPort
	statut(s: TermStatut, code?: number): void
	erreur(e: unknown): void // échec d'un envoi de touches
}

export class TermSession {
	vivant = false
	pos = 0
	dernierJeton: string | null = null
	private readonly deps: TermDeps
	private fermer: (() => void) | null = null
	private premier = false // rattachement : 1er bloc ⇒ reset + modes
	private retenu = ""
	private minuteurSync: ReturnType<typeof setTimeout> | undefined
	private minuteurFlux: ReturnType<typeof setTimeout> | undefined
	private file = ""
	private envoi = false
	private detruit = false

	constructor(deps: TermDeps) {
		this.deps = deps
	}

	// à chaque tick de state.json : le jeton change à chaque relance de dash.py
	async jeton(j: string): Promise<void> {
		if (j === this.dernierJeton) return
		const premier = this.dernierJeton === null
		this.dernierJeton = j
		if (premier) await this.reprendre()
		else if (this.vivant) this.ecouter(this.premier)
	}

	// ▶ : open est idempotent, session vivante ⇒ rattachement
	async lancer(cols: number, rows: number): Promise<void> {
		const jeton = this.dernierJeton
		if (jeton === null) return
		const r = await this.deps.api.open(jeton, cols, rows)
		this.vivant = r.vivant
		this.deps.statut(r.vivant ? "vivant" : "absent")
		const rattacher = r.pos > RATTACHE_SEUIL
		// pos < connue : session neuve, son tampon repart de 0
		if (rattacher || r.pos < this.pos) this.pos = 0
		this.ecouter(rattacher)
	}

	async redimensionner(cols: number, rows: number): Promise<void> {
		if (!this.vivant || this.dernierJeton === null) return
		await this.deps.api.resize(this.dernierJeton, cols, rows)
	}

	async arreter(): Promise<void> {
		if (this.dernierJeton === null) return
		await this.deps.api.stop(this.dernierJeton)
	}

	// touches dans l'ordre : une requête en vol, le reste s'accumule
	envoyer(data: string): void {
		if (!this.vivant) return
		this.file += data
		if (this.envoi) return
		this.envoi = true
		setTimeout(() => {
			this.vider().catch((e: unknown) => this.deps.erreur(e))
		}, COALESCE_DELAI)
	}

	detruire(): void {
		this.detruit = true
		this.fermerFlux()
		clearTimeout(this.minuteurSync)
		this.file = ""
	}

	private async reprendre(): Promise<void> {
		if (this.dernierJeton === null) return
		const e = await this.deps.api.etat(this.dernierJeton)
		if (!e.vivant) {
			this.deps.statut("absent")
			return
		}
		this.pos = 0
		this.vivant = true
		this.deps.statut("vivant")
		this.ecouter(true)
	}

	private async vider(): Promise<void> {
		try {
			while (this.file && this.dernierJeton !== null) {
				const bloc = this.file.slice(0, TERM_IN_MAX)
				this.file = this.file.slice(bloc.length)
				const r = await this.deps.api.send(this.dernierJeton, bloc)
				if (r.mort) {
					this.mourir()
					break
				}
			}
		} finally {
			this.envoi = false
		}
	}

	private ecouter(rattacher: boolean): void {
		this.fermerFlux()
		if (this.detruit || this.dernierJeton === null) return
		this.premier = rattacher
		this.fermer = this.deps.api.stream(
			this.dernierJeton,
			this.pos,
			(data) => this.recevoir(data),
			() => this.surErreur(),
		)
	}

	// reprise depuis la position connue ; fermé tout de suite pour couper la
	// reconnexion native d'EventSource (elle repartirait de l'ancien `depuis`)
	private surErreur(): void {
		this.fermerFlux()
		if (!this.vivant || this.detruit) return
		this.minuteurFlux = setTimeout(
			() => this.ecouter(this.premier),
			RETRY_DELAI,
		)
	}

	private fermerFlux(): void {
		clearTimeout(this.minuteurFlux)
		this.fermer?.()
		this.fermer = null
	}

	private recevoir(data: string): void {
		const m = decoder(data)
		if (m === null) return
		if ("mort" in m) {
			this.mourir()
			return
		}
		if ("bin" in m) this.sortie(m.bin)
		else if (this.premier) {
			this.premier = false
			this.deps.port.repaint()
		}
		this.pos = m.pos
		if ("fin" in m) {
			this.vivant = false
			this.fermerFlux()
			this.deps.statut("fin", m.fin)
		}
	}

	private sortie(bin: string): void {
		if (!this.premier) {
			this.ecrire(bin)
			return
		}
		this.premier = false
		clearTimeout(this.minuteurSync)
		this.retenu = ""
		this.deps.port.reset()
		this.deps.port.write(modes(bin))
		this.deps.port.repaint()
	}

	private ecrire(bin: string): void {
		const { ecrit, retenu } = couperSync(this.retenu + bin)
		this.retenu = retenu
		if (ecrit) this.deps.port.write(octets(ecrit))
		clearTimeout(this.minuteurSync)
		if (!retenu) return
		this.minuteurSync = setTimeout(() => {
			const r = this.retenu
			this.retenu = ""
			this.deps.port.write(octets(r))
		}, SYNC_DELAI)
	}

	// session absente côté démon : flux fermé, ▶ pour en rouvrir une
	private mourir(): void {
		this.vivant = false
		this.file = ""
		this.pos = 0
		this.fermerFlux()
		this.deps.statut("mort")
	}
}

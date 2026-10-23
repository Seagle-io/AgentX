import type { FitAddon } from "@xterm/addon-fit"
import type { ITheme, Terminal as XTerm } from "@xterm/xterm"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { ApiError } from "@/api/state/crud"
import { useSalleState } from "@/api/state/hooks"
import { CHEF_DEFAUT } from "@/api/term/chef"
import {
	etatTerm,
	openStream,
	openTerm,
	resizeTerm,
	sendTerm,
	stopTerm,
} from "@/api/term/crud"
import { usePassationAuto } from "@/api/voix/hooks"
import {
	type TermApi,
	TermSession,
	type TermStatut,
} from "@/console/script/term"
import { cn } from "@/shared/lib/utils"
import Button from "@/shared/ui/button"
import Panel from "@/shared/ui/panel"

// Tiroir de la session chef (v1) ; xterm en chunk dynamique
type Mode = "replie" | "deplie" | "plein"
type Vue = {
	term: XTerm
	fit: FitAddon
	session: TermSession
	repaint: () => void
}
type Rappels = {
	statut: (s: TermStatut, code?: number) => void
	erreur: (e: unknown) => void
	visible: () => boolean
}

// replié = hauteur 0 : xterm reste monté, mais n'est jamais ajusté (1 ligne
// envoyée au pty du chef sinon) ; déplié : remplit la hauteur du tiroir
const hauteurs: Record<Mode, string> = {
	replie: "h-0",
	deplie: "min-h-0 flex-1",
	plein: "min-h-0 flex-1",
}

function brancherFlux(
	chef: string,
	...[token, depuis, recevoir, erreur]: Parameters<TermApi["stream"]>
) {
	const src = openStream(token, depuis, chef)
	src.onmessage = (ev: MessageEvent<unknown>) => {
		if (typeof ev.data === "string") recevoir(ev.data)
	}
	src.onerror = () => erreur()
	return () => src.close()
}

// compte lu à l'ouverture : fiche du chef, jamais pour un chef déjà vivant
function creerApi(chef: string, compte: () => string | undefined): TermApi {
	return {
		open: (token, cols, rows) => openTerm(token, cols, rows, chef, compte()),
		send: (token, data) => sendTerm(token, data, chef),
		resize: (token, cols, rows) => resizeTerm(token, cols, rows, chef),
		stop: (token) => stopTerm(token, chef),
		etat: (token) => etatTerm(token, chef),
		stream: (...a) => brancherFlux(chef, ...a),
	}
}

// tokens CSS lus sur l'hôte (le [data-theme] le plus proche) : relus à chaque bascule de thème
function lireTheme(el: HTMLElement): ITheme {
	const css = getComputedStyle(el)
	const v = (nom: string) => css.getPropertyValue(nom).trim()
	return {
		background: v("--color-bg"),
		foreground: v("--color-text"),
		cursor: v("--color-accent"),
		cursorAccent: v("--color-bg"),
		selectionBackground: v("--color-accent-bg"),
	}
}

function creerVue(
	el: HTMLElement,
	Xterm: typeof XTerm,
	Fit: typeof FitAddon,
	r: Rappels,
	api: TermApi,
): Vue {
	const police = getComputedStyle(document.documentElement)
		.getPropertyValue("--font-mono")
		.trim()
	const term = new Xterm({
		cursorBlink: true,
		fontFamily: police || "monospace",
		fontSize: 13,
		lineHeight: 1.2,
		scrollback: 5000,
		allowProposedApi: true,
		theme: lireTheme(el),
	})
	const fit = new Fit()
	term.loadAddon(fit)
	term.open(el)
	// SIGWINCH seulement si la taille change : on passe par une ligne de moins
	const repaint = () => {
		if (!r.visible()) return
		fit.fit()
		const { cols, rows } = term
		session
			.redimensionner(cols, Math.max(5, rows - 1))
			.then(() => new Promise((ok) => setTimeout(ok, 180)))
			.then(() => session.redimensionner(cols, rows))
			.catch(r.erreur)
	}
	const session = new TermSession({
		api,
		port: { write: (d) => term.write(d), reset: () => term.reset(), repaint },
		statut: r.statut,
		erreur: r.erreur,
	})
	term.onData((d) => session.envoyer(d))
	term.onResize(({ cols, rows }) => {
		session.redimensionner(cols, rows).catch(r.erreur)
	})
	brancherTouches(term, session)
	return { term, fit, session, repaint }
}

type Touche = "saut" | "copier" | "coller"

// Maj+Entrée = saut de ligne ; Ctrl+C avec sélection = copie ; Ctrl(+Maj)+V = collage.
// Sinon xterm traduit Ctrl+C/V en ^C/^V et annule le copier-coller natif
export function toucheTerm(
	ev: Pick<
		KeyboardEvent,
		"key" | "shiftKey" | "ctrlKey" | "altKey" | "metaKey"
	>,
	selection: boolean,
): Touche | null {
	if (ev.altKey || ev.metaKey) return null
	if (ev.key === "Enter") return ev.shiftKey && !ev.ctrlKey ? "saut" : null
	if (!ev.ctrlKey) return null
	const k = ev.key.toLowerCase()
	if (k === "v") return "coller"
	return k === "c" && selection ? "copier" : null
}

function brancherTouches(term: XTerm, session: TermSession) {
	term.attachCustomKeyEventHandler((ev) => {
		const touche = toucheTerm(ev, term.hasSelection())
		if (!touche) return true
		if (ev.type !== "keydown") return false
		// Claude Code lit ESC+\r (Alt+Entrée) ; coller : événement paste natif, xterm l'envoie
		if (touche === "saut") session.envoyer("\x1b\r")
		if (touche === "copier")
			void navigator.clipboard.writeText(term.getSelection())
		return false
	})
	// suivi souris actif (modes 1000-1006) : la molette part en séquences SGR
	term.attachCustomWheelEventHandler((ev) => {
		const el = term.element
		// Maj+molette : défilement local du scrollback, même avec suivi souris
		if (ev.shiftKey) return true
		if (!session.vivant || !el || term.modes.mouseTrackingMode === "none")
			return true
		const b = el.getBoundingClientRect()
		const col = Math.max(
			1,
			Math.min(
				term.cols,
				Math.floor((ev.clientX - b.left) / (b.width / term.cols)) + 1,
			),
		)
		const row = Math.max(
			1,
			Math.min(
				term.rows,
				Math.floor((ev.clientY - b.top) / (b.height / term.rows)) + 1,
			),
		)
		const crans = Math.max(1, Math.min(5, Math.round(Math.abs(ev.deltaY) / 50)))
		const code = ev.deltaY < 0 ? 64 : 65
		session.envoyer(`\x1b[<${code};${col};${row}M`.repeat(crans))
		ev.preventDefault()
		return false
	})
}

// xterm monté 1× ; rappels lus par ref (t, mode) pour ne jamais le remonter
function useXterm(
	hote: React.RefObject<HTMLDivElement | null>,
	rappels: React.RefObject<Rappels>,
	api: TermApi,
): Vue | null {
	const [vue, setVue] = useState<Vue | null>(null)
	useEffect(() => {
		const el = hote.current
		if (!el) return
		let annule = false
		let monte: Vue | null = null
		const r: Rappels = {
			statut: (s, code) => rappels.current.statut(s, code),
			erreur: (e) => rappels.current.erreur(e),
			visible: () => rappels.current.visible(),
		}
		const theme = new MutationObserver(() => {
			if (monte) monte.term.options.theme = lireTheme(el)
		})
		theme.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["data-theme", "data-color-theme"],
		})
		const taille = new ResizeObserver(() => {
			if (monte && r.visible()) monte.fit.fit()
		})
		taille.observe(el)
		void Promise.all([
			import("@xterm/xterm"),
			import("@xterm/addon-fit"),
			import("@xterm/xterm/css/xterm.css"),
		]).then(([x, f]) => {
			if (annule) return
			monte = creerVue(el, x.Terminal, f.FitAddon, r, api)
			setVue(monte)
		})
		return () => {
			annule = true
			theme.disconnect()
			taille.disconnect()
			monte?.session.detruire()
			monte?.term.dispose()
		}
	}, [hote, rappels, api])
	return vue
}

type Etat = { s: TermStatut | null; code?: number; erreur?: ApiError }

// `actif` faux : monté mais caché (session et flux gardés ouverts)
export default function Terminal({
	chef,
	actif = true,
}: {
	chef: string
	actif?: boolean
}) {
	const { t } = useTranslation()
	const { data: jeton } = useSalleState(null, (s) => s.jeton)
	const { data: immeuble } = useSalleState(null, (s) => s.immeuble)
	const { data: voix } = useSalleState(null, (s) => s.voix)
	const passation = usePassationAuto(null)
	const compte = useRef<string | undefined>(undefined)
	const [api] = useState(() => creerApi(chef, () => compte.current))
	const info = immeuble?.chefs?.find((c) => c.cle === chef)
	// compte de lancement = fiche du chef, relu à chaque rendu (creerApi monté 1×)
	compte.current = info?.compte ?? undefined
	const nomCompte = info?.compte ?? CHEF_DEFAUT
	const nom = info?.libelle ?? (chef !== CHEF_DEFAUT ? chef : null)
	const [mode, setMode] = useState<Mode>("replie")
	const [etat, setEtat] = useState<Etat>({ s: null })
	const hote = useRef<HTMLDivElement>(null)
	const rappels = useRef<Rappels>({
		statut: () => {},
		erreur: () => {},
		visible: () => false,
	})
	rappels.current = {
		statut: (s, code) => setEtat({ s, code }),
		erreur: (e) => {
			if (!(e instanceof ApiError)) throw e
			setEtat((p) => ({ ...p, erreur: e }))
		},
		visible: () => actif && mode !== "replie",
	}
	const vue = useXterm(hote, rappels, api)
	const signaler = (e: unknown) => rappels.current.erreur(e)

	useEffect(() => {
		if (vue && jeton) vue.session.jeton(jeton).catch(signaler)
	})

	useEffect(() => {
		if (!vue) return
		if (etat.s === "mort")
			vue.term.writeln(`\r\n\x1b[31m${t("console:term.perdue")}\x1b[0m`)
		if (etat.s === "fin")
			vue.term.writeln(`\r\n\x1b[2m${t("console:term.quitte")}\x1b[0m`)
	}, [vue, etat.s, t])

	// déplié et affiché : taille réelle (hôte caché = 0 px), rattachement repeint, focus
	useEffect(() => {
		if (!vue || !actif || mode === "replie") return
		const id = setTimeout(() => {
			vue.fit.fit()
			vue.repaint()
			vue.term.focus()
		}, 50)
		return () => clearTimeout(id)
	}, [vue, mode, actif])

	useEchapPlein(mode, hote, () => setMode("deplie"))

	const lancer = () => {
		if (!vue) return
		if (mode === "replie") setMode("deplie")
		vue.session.lancer(vue.term.cols, vue.term.rows).catch(signaler)
		vue.term.focus()
	}
	const arreter = () => {
		if (!vue || !window.confirm(t("console:term.confirmStop"))) return
		vue.session.arreter().catch(signaler)
	}

	return (
		<Panel
			padding="none"
			hidden={!actif}
			aria-label={t("console:term.label")}
			className={cn(
				"flex min-h-0 flex-col overflow-hidden",
				mode === "deplie" && "flex-1",
				mode === "plein" && "fixed inset-0 z-50 rounded-none",
			)}
		>
			<div className="flex min-w-0 flex-wrap items-center gap-2 px-3 py-1.5">
				<Button
					variant="ghost"
					size="sm"
					aria-expanded={mode !== "replie"}
					onClick={() => setMode(mode === "replie" ? "deplie" : "replie")}
					title={t(
						mode === "replie" ? "console:term.expand" : "console:term.collapse",
					)}
				>
					<span className="font-heading text-text">
						{t("console:term.title")}
						{nom
							? ` · ${nom} · ${nomCompte}`
							: nomCompte !== CHEF_DEFAUT
								? ` · ${nomCompte}`
								: ""}
					</span>
					<span
						className={etat.s === "vivant" ? "text-success" : "text-text-muted"}
					>
						{etat.s === "fin"
							? t("console:term.fin", { code: etat.code })
							: t(
									`console:term.${etat.s === "vivant" || etat.s === "mort" ? etat.s : "absent"}`,
								)}
					</span>
				</Button>
				<label
					data-testid="passation-auto"
					className="ml-2 inline-flex min-h-6 items-center gap-1 py-1 text-xs"
					title={t("console:term.passationAutoAide")}
				>
					<input
						type="checkbox"
						aria-label={t("console:term.passationAuto")}
						className="h-4 w-4 accent-accent"
						checked={voix?.passation_auto ?? false}
						disabled={!voix || passation.isPending}
						onChange={(e) => passation.mutate(e.target.checked)}
					/>{" "}
					{t("console:term.passationAuto")}
				</label>
				{etat.erreur && (
					<span className="text-error text-xs" title={etat.erreur.message}>
						{t(`console:error.${etat.erreur.kind}`)}
					</span>
				)}
				<div className="ml-auto flex gap-1">
					<Button
						variant="outline"
						size="sm"
						disabled={!vue || !jeton}
						onClick={lancer}
					>
						{t("console:term.start")}
					</Button>
					<Button
						variant="ghost"
						size="sm"
						disabled={!vue || etat.s !== "vivant"}
						onClick={arreter}
					>
						{t("console:term.stop")}
					</Button>
					<Button
						variant="ghost"
						size="sm"
						aria-pressed={mode === "plein"}
						onClick={() => setMode(mode === "plein" ? "deplie" : "plein")}
					>
						{t(
							mode === "plein" ? "console:term.exitFull" : "console:term.full",
						)}
					</Button>
				</div>
			</div>
			<div
				ref={hote}
				className={cn(
					"min-w-0 overflow-hidden bg-bg",
					mode !== "replie" && "pl-2 pb-2",
					hauteurs[mode],
				)}
			/>
		</Panel>
	)
}

// plein écran : Échap hors du terminal le quitte, sans atteindre la garde de
// route (T044) ; terminal focalisé ⇒ Échap part à Claude Code
function useEchapPlein(
	mode: Mode,
	hote: React.RefObject<HTMLDivElement | null>,
	quitter: () => void,
) {
	const quitterRef = useRef(quitter)
	quitterRef.current = quitter
	useEffect(() => {
		if (mode !== "plein") return
		const onKey = (e: KeyboardEvent) => {
			if (e.key !== "Escape") return
			if (e.target instanceof Node && hote.current?.contains(e.target)) return
			e.stopPropagation()
			quitterRef.current()
		}
		window.addEventListener("keydown", onKey, true)
		return () => window.removeEventListener("keydown", onKey, true)
	}, [mode, hote])
}

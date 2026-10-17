import type { FitAddon } from "@xterm/addon-fit"
import type { ITheme, Terminal as XTerm } from "@xterm/xterm"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { ApiError } from "@/api/state/crud"
import { useSalleState } from "@/api/state/hooks"
import {
	etatTerm,
	openStream,
	openTerm,
	resizeTerm,
	sendTerm,
	stopTerm,
} from "@/api/term/crud"
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
// envoyée au pty du chef sinon)
const hauteurs: Record<Mode, string> = {
	replie: "h-0",
	deplie: "h-80",
	plein: "min-h-0 flex-1",
}

function brancherFlux(
	...[token, depuis, recevoir, erreur]: Parameters<TermApi["stream"]>
) {
	const src = openStream(token, depuis)
	src.onmessage = (ev: MessageEvent<unknown>) => {
		if (typeof ev.data === "string") recevoir(ev.data)
	}
	src.onerror = () => erreur()
	return () => src.close()
}

const api: TermApi = {
	open: openTerm,
	send: sendTerm,
	resize: resizeTerm,
	stop: stopTerm,
	etat: etatTerm,
	stream: brancherFlux,
}

// tokens CSS lus sur <html> : relus à chaque bascule de thème
function lireTheme(): ITheme {
	const css = getComputedStyle(document.documentElement)
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
		theme: lireTheme(),
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

function brancherTouches(term: XTerm, session: TermSession) {
	// Maj+Entrée = saut de ligne : Claude Code lit ESC+\r (Alt+Entrée)
	term.attachCustomKeyEventHandler((ev) => {
		if (
			ev.key !== "Enter" ||
			!ev.shiftKey ||
			ev.ctrlKey ||
			ev.altKey ||
			ev.metaKey
		)
			return true
		if (ev.type === "keydown") session.envoyer("\x1b\r")
		return false
	})
	// suivi souris actif (modes 1000-1006) : la molette part en séquences SGR
	term.attachCustomWheelEventHandler((ev) => {
		const el = term.element
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
			if (monte) monte.term.options.theme = lireTheme()
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
			monte = creerVue(el, x.Terminal, f.FitAddon, r)
			setVue(monte)
		})
		return () => {
			annule = true
			theme.disconnect()
			taille.disconnect()
			monte?.session.detruire()
			monte?.term.dispose()
		}
	}, [hote, rappels])
	return vue
}

type Etat = { s: TermStatut | null; code?: number; erreur?: ApiError }

export default function Terminal() {
	const { t } = useTranslation()
	const { data: jeton } = useSalleState(null, (s) => s.jeton)
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
		visible: () => mode !== "replie",
	}
	const vue = useXterm(hote, rappels)
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

	// déplié : taille réelle, rattachement repeint, focus
	useEffect(() => {
		if (!vue || mode === "replie") return
		const id = setTimeout(() => {
			vue.repaint()
			vue.term.focus()
		}, 50)
		return () => clearTimeout(id)
	}, [vue, mode])

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
			aria-label={t("console:term.label")}
			className={cn(
				"flex flex-col overflow-hidden",
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
				{etat.erreur && (
					<span className="text-error text-xs">
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
					mode !== "replie" && "px-2 pb-2",
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

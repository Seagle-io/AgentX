import type { FitAddon } from "@xterm/addon-fit"
import type { ITheme, Terminal as XTerm } from "@xterm/xterm"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { ApiError } from "@/api/state/crud"
import { useSalleState } from "@/api/state/hooks"
import type { Compte } from "@/api/state/schema"
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
import Poignee from "@/console/component/Poignee"
import {
	HAUTEUR_MIN,
	MARGE_HAUT,
	useHauteurTiroir,
} from "@/console/script/hauteur"
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
// déplié : hauteur en px réglée par la poignée (style)
const hauteurs: Record<Exclude<Mode, "deplie">, string> = {
	replie: "h-0",
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

// compte lu à l'ouverture : choisi avant ▶, jamais pour un chef déjà vivant
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

export default function Terminal({ chef }: { chef: string }) {
	const { t } = useTranslation()
	const { data: jeton } = useSalleState(null, (s) => s.jeton)
	const { data: immeuble } = useSalleState(null, (s) => s.immeuble)
	const { data: voix } = useSalleState(null, (s) => s.voix)
	const passation = usePassationAuto(null)
	const compte = useRef<string | undefined>(undefined)
	const [api] = useState(() => creerApi(chef, () => compte.current))
	const [choix, setChoix] = useState(false)
	const info = immeuble?.chefs?.find((c) => c.cle === chef)
	const comptes = immeuble?.comptes ?? []
	const nomCompte = compte.current ?? info?.compte ?? CHEF_DEFAUT
	const [mode, setMode] = useState<Mode>("replie")
	const [etat, setEtat] = useState<Etat>({ s: null })
	const [hauteur, regler] = useHauteurTiroir()
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

	// chef non vivant ∧ comptes déclarés ⇒ choix du compte avant ouverture
	const demander = () => {
		if (info?.vivant !== true && comptes.length > 0) setChoix(true)
		else lancer()
	}
	const lancer = () => {
		if (!vue) return
		setChoix(false)
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
			{mode === "deplie" && (
				<Poignee
					hauteur={hauteur}
					max={Math.max(HAUTEUR_MIN, window.innerHeight - MARGE_HAUT)}
					onChange={regler}
				/>
			)}
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
						{chef !== CHEF_DEFAUT && ` · ${chef}`}
						{nomCompte !== CHEF_DEFAUT && ` · ${nomCompte}`}
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
						onClick={demander}
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
			{choix && (
				<ChoixCompte
					comptes={comptes}
					onChoisir={(nom) => {
						compte.current = nom
						lancer()
					}}
					onAnnuler={() => setChoix(false)}
				/>
			)}
			<div
				ref={hote}
				className={cn(
					"min-w-0 overflow-hidden bg-bg",
					mode !== "replie" && "pl-2 pb-2",
					mode !== "deplie" && hauteurs[mode],
				)}
				style={mode === "deplie" ? { height: hauteur } : undefined}
			/>
		</Panel>
	)
}

// connectés seuls sélectionnables ; `login` se copie, jamais exécuté
function ChoixCompte({
	comptes,
	onChoisir,
	onAnnuler,
}: {
	comptes: Compte[]
	onChoisir: (nom: string) => void
	onAnnuler: () => void
}) {
	const { t } = useTranslation()
	const connectes = comptes.filter((c) => c.connecte)
	const [nom, setNom] = useState(
		connectes.find((c) => c.nom === CHEF_DEFAUT)?.nom ??
			connectes[0]?.nom ??
			"",
	)
	const libelle = t("console:term.compte")
	return (
		<div className="flex min-w-0 flex-wrap items-center gap-2 px-3 py-1.5">
			<span className="text-text-muted text-xs">{libelle}</span>
			<select
				className="rounded-control border border-border-subtle bg-surface px-2 py-1 text-sm"
				aria-label={libelle}
				value={nom}
				onChange={(e) => setNom(e.target.value)}
			>
				{comptes.map((c) => (
					<option key={c.nom} value={c.nom} disabled={!c.connecte}>
						{c.nom}
					</option>
				))}
			</select>
			<Button
				variant="outline"
				size="sm"
				disabled={nom === ""}
				onClick={() => onChoisir(nom)}
			>
				{t("console:term.start")}
			</Button>
			<Button variant="ghost" size="sm" onClick={onAnnuler}>
				{t("console:cancel")}
			</Button>
			{comptes
				.filter((c) => !c.connecte)
				.map((c) => (
					<span
						key={c.nom}
						className="flex items-center gap-1 text-text-muted text-xs"
					>
						{c.nom}
						<Button
							variant="ghost"
							size="sm"
							title={c.login}
							onClick={() => navigator.clipboard.writeText(c.login)}
						>
							{t("console:term.copierLogin")}
						</Button>
					</span>
				))}
		</div>
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

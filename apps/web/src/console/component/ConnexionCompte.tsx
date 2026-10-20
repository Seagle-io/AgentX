import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useSalleState } from "@/api/state/hooks"
import {
	etatLogin,
	openLoginStream,
	sendLogin,
	stopLogin,
} from "@/api/term/crud"
import {
	LOGIN_DELAI_S,
	type LoginIssue,
	TermEventSchema,
} from "@/api/term/schema"
import {
	decoderB64,
	dernieresLignes,
	extraireUrl,
	nettoyer,
} from "@/console/script/login"
import Button from "@/shared/ui/button"

const CAP = 65536 // sortie gardée : 64 Ko
const DELAI_ENTREE = 300 // le code puis `\r` séparé (decisions 2026-10-20)

type Props = {
	compte: string
	onFin: (issue: LoginIssue) => void
	onFermer: () => void
}

// flux depuis 0 ; `fin|mort` ⇒ issue lue par etatLogin ; cleanup = close()
function useSortie(compte: string, token: string | undefined, fin: () => void) {
	const [texte, setTexte] = useState("")
	const finRef = useRef(fin)
	finRef.current = fin
	useEffect(() => {
		if (!token) return
		const dec = new TextDecoder()
		const src = openLoginStream(token, compte, 0)
		src.onmessage = (ev: MessageEvent<unknown>) => {
			if (typeof ev.data !== "string") return
			let brut: unknown
			try {
				brut = JSON.parse(ev.data)
			} catch {
				return
			}
			const m = TermEventSchema.safeParse(brut)
			if (!m.success) return
			if ("o" in m.data) {
				const bloc = decoderB64(m.data.o, dec)
				setTexte((p) => (p + bloc).slice(-CAP))
				return
			}
			src.close()
			finRef.current()
		}
		return () => src.close()
	}, [compte, token])
	return texte
}

export default function ConnexionCompte({ compte, onFin, onFermer }: Props) {
	const { t } = useTranslation()
	const { data: jeton } = useSalleState(null, (s) => s.jeton)
	const [issue, setIssue] = useState<{
		i: LoginIssue
		code: number | null
	} | null>(null)
	const [code, setCode] = useState("")
	const [reste, setReste] = useState(LOGIN_DELAI_S)
	const [erreur, setErreur] = useState("")
	const texte = useSortie(compte, jeton, () => {
		if (!jeton) return
		etatLogin(jeton, compte)
			.then((e) => {
				const i = e.issue ?? "echec"
				setIssue({ i, code: e.code })
				onFin(i)
			})
			.catch((e: unknown) => setErreur(e instanceof Error ? e.message : ""))
	})
	const propre = nettoyer(texte)
	const url = extraireUrl(texte)

	useEffect(() => {
		if (issue) return
		const id = setInterval(() => setReste((r) => Math.max(0, r - 1)), 1000)
		return () => clearInterval(id)
	}, [issue])

	const envoyer = () => {
		if (!jeton || code === "") return
		sendLogin(jeton, compte, code)
			.then(() => new Promise((ok) => setTimeout(ok, DELAI_ENTREE)))
			.then(() => sendLogin(jeton, compte, "\r"))
			.then(() => setCode(""))
			.catch((e: unknown) => setErreur(e instanceof Error ? e.message : ""))
	}
	const annuler = () => {
		if (!jeton) return
		stopLogin(jeton, compte).catch((e: unknown) =>
			setErreur(e instanceof Error ? e.message : ""),
		)
	}

	return (
		<div
			data-testid="connexion-compte"
			className="flex min-w-0 flex-col gap-2 px-3 py-1.5 text-sm"
		>
			{issue ? (
				<div className="flex flex-wrap items-center gap-2">
					<span
						data-testid="connexion-issue"
						className={issue.i === "connecte" ? "text-success" : "text-error"}
					>
						{t(`console:login.issue.${issue.i}`, { compte, code: issue.code })}
					</span>
					{issue.i !== "connecte" && (
						<Button variant="outline" size="sm" onClick={() => onFermer()}>
							{t("console:login.reessayer")}
						</Button>
					)}
					<Button variant="ghost" size="sm" onClick={onFermer}>
						{t("console:cancel")}
					</Button>
				</div>
			) : (
				<>
					<div className="flex flex-wrap items-center gap-2">
						{url ? (
							<>
								<a
									className="text-accent underline"
									href={url}
									target="_blank"
									rel="noreferrer"
								>
									{t("console:login.lien")}
								</a>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => navigator.clipboard.writeText(url)}
								>
									{t("console:login.copierLien")}
								</Button>
							</>
						) : (
							<span className="text-text-muted">
								{t("console:login.attente")}
							</span>
						)}
						<span className="text-text-muted text-xs">
							{t("console:login.reste", { s: reste })}
						</span>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<input
							className="rounded-control border border-border-subtle bg-surface px-2 py-1 text-sm"
							aria-label={t("console:login.code")}
							placeholder={t("console:login.code")}
							value={code}
							onChange={(e) => setCode(e.target.value)}
						/>
						<Button
							variant="outline"
							size="sm"
							disabled={code === "" || !jeton}
							onClick={envoyer}
						>
							{t("console:login.envoyer")}
						</Button>
						<Button variant="ghost" size="sm" onClick={annuler}>
							{t("console:login.annuler")}
						</Button>
					</div>
				</>
			)}
			{erreur && <span className="text-error text-xs">{erreur}</span>}
			<details>
				<summary className="cursor-pointer text-text-muted text-xs">
					{t("console:login.sortie")}
				</summary>
				<pre className="max-h-40 max-w-full overflow-auto whitespace-pre-wrap text-xs">
					{dernieresLignes(propre)}
				</pre>
			</details>
		</div>
	)
}

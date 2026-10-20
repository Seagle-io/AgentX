import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ApiError } from "@/api/state/crud"
import { useSalleState } from "@/api/state/hooks"
import { openLogin } from "@/api/term/crud"
import ConnexionCompte from "@/console/component/ConnexionCompte"
import { nomCompteValide } from "@/salle/script/ongletsChef"
import Button from "@/shared/ui/button"
import Input from "@/shared/ui/input"

// Comptes Claude : connecter un compte déclaré, ou en ajouter un (nom jugé par le motif servi)
export default function GestionComptes({ onFermer }: { onFermer: () => void }) {
	const { t } = useTranslation()
	const queryClient = useQueryClient()
	const { data: jeton } = useSalleState(null, (s) => s.jeton)
	const { data: immeuble } = useSalleState(null, (s) => s.immeuble)
	const comptes = immeuble?.comptes ?? []
	const [nouveau, setNouveau] = useState("")
	const [enCours, setEnCours] = useState<string | null>(null)
	const [refus, setRefus] = useState("")
	const ok = nomCompteValide(nouveau, immeuble?.motifs?.compte)

	// openLogin au clic, jamais en effet : StrictMode ⇒ 2 appels ⇒ login-en-cours
	const connecter = (cible: string) => {
		if (!jeton) return
		setRefus("")
		openLogin(jeton, cible)
			.then(() => setEnCours(cible))
			.catch((e: unknown) => {
				if (!(e instanceof ApiError)) throw e
				setRefus(e.message)
			})
	}

	if (enCours)
		return (
			<ConnexionCompte
				compte={enCours}
				onFin={() =>
					void queryClient.invalidateQueries({ queryKey: ["state"] })
				}
				onFermer={() => setEnCours(null)}
			/>
		)

	return (
		<div className="flex min-w-0 flex-wrap items-center gap-2 text-xs">
			{comptes.map((c) =>
				c.connecte ? (
					<span
						key={c.nom}
						data-testid="compte-connecte"
						className="text-success"
					>
						{t("salle:compteConnecte", { nom: c.nom })}
					</span>
				) : (
					<span key={c.nom} className="flex items-center gap-1">
						<span className="text-text-muted">{c.nom}</span>
						<Button
							variant="ghost"
							size="sm"
							disabled={!jeton}
							onClick={() => connecter(c.nom)}
						>
							{t("console:login.connecter")}
						</Button>
					</span>
				),
			)}
			<Input
				inputSize="sm"
				className="w-auto max-w-[14rem]"
				variant={nouveau && !ok ? "error" : "default"}
				aria-label={t("console:login.nom")}
				placeholder={t("console:login.nom")}
				maxLength={24}
				value={nouveau}
				onChange={(e) => setNouveau(e.target.value)}
			/>
			<Button
				variant="outline"
				size="sm"
				disabled={!jeton || !ok}
				title={!ok ? t("console:login.nomRequis") : undefined}
				onClick={() => connecter(nouveau)}
			>
				{t("console:login.ajouter")}
			</Button>
			<Button variant="ghost" size="sm" onClick={onFermer}>
				{t("salle:comptesFermer")}
			</Button>
			{refus && (
				<span data-testid="connexion-refus" className="text-error text-xs">
					{refus}
				</span>
			)}
		</div>
	)
}

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useSalleState } from "@/api/state/hooks"
import { CHEF_DEFAUT } from "@/api/term/chef"
import { ouvrirChef } from "@/api/term/crud"
import { cleChefValide, normaliserCle } from "@/salle/script/ongletsChef"
import Button from "@/shared/ui/button"
import Input from "@/shared/ui/input"

// Ouvre un chef dédié sur l'étage ; clé jugée par le motif servi, refus serveur affiché
export default function AjoutChef({
	slug,
	onFermer,
}: {
	slug: string
	onFermer: () => void
}) {
	const { t } = useTranslation()
	const queryClient = useQueryClient()
	const { data: jeton } = useSalleState(null, (s) => s.jeton)
	const { data: immeuble } = useSalleState(null, (s) => s.immeuble)
	const comptes = immeuble?.comptes
		? immeuble.comptes.filter((c) => c.connecte).map((c) => c.nom)
		: [CHEF_DEFAUT]
	const [saisie, setSaisie] = useState("")
	const cle = normaliserCle(saisie)
	const [compte, setCompte] = useState(
		comptes.includes(CHEF_DEFAUT) ? CHEF_DEFAUT : (comptes[0] ?? ""),
	)
	const valide =
		cle === "" || cleChefValide(cle, immeuble?.motifs?.cle, CHEF_DEFAUT)
	const m = useMutation({
		mutationFn: () => ouvrirChef(jeton ?? "", slug, cle, compte),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ["state"] })
			onFermer()
		},
	})
	const motif = !jeton
		? "chefJeton"
		: !valide
			? "chefCleInvalide"
			: compte === ""
				? "chefCompteAucun"
				: null

	return (
		<div className="flex min-w-0 flex-wrap items-center gap-2 text-xs">
			<Input
				inputSize="sm"
				variant={!valide ? "error" : "default"}
				aria-label={t("salle:chefCle")}
				placeholder={slug}
				maxLength={24}
				value={saisie}
				onChange={(e) => setSaisie(e.target.value)}
			/>
			{cle !== "" && cle !== saisie && (
				<span data-testid="ajout-chef-cle" className="text-xs opacity-70">
					→ {cle}
				</span>
			)}
			<select
				className="rounded-control border border-border-subtle bg-surface px-2 py-1 text-sm"
				aria-label={t("salle:chefCompte")}
				value={compte}
				onChange={(e) => setCompte(e.target.value)}
			>
				{comptes.map((nom) => (
					<option key={nom} value={nom}>
						{nom}
					</option>
				))}
			</select>
			<Button
				variant="outline"
				size="sm"
				disabled={motif !== null || m.isPending}
				title={motif ? t(`salle:${motif}`) : undefined}
				onClick={() => m.mutate()}
			>
				{t("salle:chefOuvrir")}
			</Button>
			<Button variant="ghost" size="sm" onClick={onFermer}>
				{t("salle:chefAnnuler")}
			</Button>
			{m.error && (
				<span data-testid="ajout-chef-refus" className="text-error text-xs">
					{m.error.message}
				</span>
			)}
		</div>
	)
}

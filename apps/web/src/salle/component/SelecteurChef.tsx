import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useSalleState } from "@/api/state/hooks"
import { CHEF_DEFAUT, chefDe } from "@/api/term/chef"
import { reaffecter } from "@/api/term/crud"
import AjoutChef from "@/salle/component/AjoutChef"
import GestionComptes from "@/salle/component/GestionComptes"
import { ajoutBloque, ongletsDe } from "@/salle/script/ongletsChef"
import Badge from "@/shared/ui/badge"
import Button from "@/shared/ui/button"
import Tabs from "@/shared/ui/tabs"

type Panneau = "ajout" | "comptes" | null

// Chef de l'étage affiché (chefs vivants + défaut) ⇒ réaffectation ; 409 : message serveur
export default function SelecteurChef({
	slug,
	chefActif,
	onChoisir,
}: {
	slug: string | null
	chefActif?: string
	onChoisir?: (cle: string) => void
}) {
	const { t } = useTranslation()
	const queryClient = useQueryClient()
	const { data: jeton } = useSalleState(null, (s) => s.jeton)
	const { data: immeuble } = useSalleState(null, (s) => s.immeuble)
	const vers = useMutation({
		mutationFn: (cle: string) => reaffecter(jeton ?? "", slug ?? "", cle),
		onSettled: () => queryClient.invalidateQueries({ queryKey: ["state"] }),
	})
	const [panneau, setPanneau] = useState<Panneau>(null)
	const basculer = (p: Exclude<Panneau, null>) =>
		setPanneau((v) => (v === p ? null : p))
	const chefs = immeuble?.chefs
	if (!immeuble || !chefs?.length) return null
	const max = immeuble.chefs_max ?? 3
	const actif = slug ? chefDe(immeuble, slug) : (chefActif ?? CHEF_DEFAUT)
	const bloque = ajoutBloque(chefs, max, actif, CHEF_DEFAUT)
	const choix = chefs.filter((c) => c.vivant === true || c.defaut)
	const items = ongletsDe(choix, actif, CHEF_DEFAUT, t("salle:chefDefaut"))
	return (
		<div className="flex min-w-0 flex-col gap-1 pb-1 text-xs">
			<div className="flex min-w-0 flex-wrap items-center gap-2">
				<Tabs
					label={t("salle:chef")}
					items={items.map((o) => ({
						cle: o.cle,
						libelle: o.libelle,
						teinte: o.teinte,
					}))}
					actif={items.find((o) => o.actif)?.cle ?? CHEF_DEFAUT}
					disabled={!jeton || vers.isPending}
					onSelect={(cle) => (slug ? vers.mutate(cle) : onChoisir?.(cle))}
				/>
				{choix.map((c) =>
					c.contexte ? (
						<Badge
							key={c.cle}
							data-testid="chef-contexte"
							data-chef={c.cle}
							size="sm"
							className="hidden sm:inline-flex"
							variant={c.contexte.alerte ? "warning" : "neutral"}
							title={t("salle:chefContexte", {
								n: c.contexte.tokens,
								m: c.contexte.fenetre ?? "?",
							})}
						>
							{Math.round(c.contexte.tokens / 1000)}k ·{" "}
							{Math.round(c.contexte.pct)}%
						</Badge>
					) : null,
				)}
				{slug && (
					<Button
						variant="ghost"
						size="sm"
						className="text-accent aria-expanded:bg-surface aria-expanded:text-text"
						aria-expanded={panneau === "ajout"}
						aria-label={t("salle:chefAjouterTitre")}
						disabled={!jeton || bloque !== null}
						title={
							!jeton
								? t("salle:chefJeton")
								: bloque === "plafond"
									? t("salle:chefPlafond", { max })
									: bloque
										? t("salle:chefTenu")
										: t("salle:chefAjouterTitre")
						}
						onClick={() => basculer("ajout")}
					>
						{t("salle:chefAjouter")}
					</Button>
				)}
				<Button
					variant="ghost"
					size="sm"
					className="aria-expanded:bg-surface aria-expanded:text-text"
					aria-expanded={panneau === "comptes"}
					disabled={!jeton}
					title={!jeton ? t("salle:chefJeton") : t("salle:comptesTitre")}
					onClick={() => basculer("comptes")}
				>
					{t("salle:comptes")}
				</Button>
				{vers.error && <span className="text-error">{vers.error.message}</span>}
			</div>
			{panneau === "ajout" && slug && (
				<AjoutChef slug={slug} onFermer={() => setPanneau(null)} />
			)}
			{panneau === "comptes" && (
				<GestionComptes onFermer={() => setPanneau(null)} />
			)}
		</div>
	)
}

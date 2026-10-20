import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Outlet } from "react-router"
import { useSalleState } from "@/api/state/hooks"
import { CHEF_DEFAUT, chefDe } from "@/api/term/chef"
import { reaffecter } from "@/api/term/crud"
import Terminal from "@/console/component/Terminal"
import AjoutChef from "@/salle/component/AjoutChef"
import GestionComptes from "@/salle/component/GestionComptes"
import SalleHeader from "@/salle/component/SalleHeader"
import { ajoutBloque, ongletsDe } from "@/salle/script/ongletsChef"
import { useFloorKeys, useFloorRoute } from "@/salle/script/route"
import { selectFloor, selectView, useSalleUi } from "@/shared/lib/store/salle"
import { cn } from "@/shared/lib/utils"
import StateError from "@/shared/page/component/StateError"
import Button from "@/shared/ui/button"
import Panel from "@/shared/ui/panel"
import Tabs from "@/shared/ui/tabs"
import Text from "@/shared/ui/text"
import TodoPanel from "@/todo/component/TodoPanel"

type Panneau = "ajout" | "comptes" | null

// Chef de l'étage affiché (chefs vivants + défaut) ⇒ réaffectation ; 409 : message serveur
function SelecteurChef({
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
				{slug && (
					<Button
						variant="ghost"
						size="sm"
						className="text-accent"
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

// Gabarit de la salle : route = source, store = miroir (useFloorRoute 1× ici)
export default function SalleLayout() {
	const { t } = useTranslation()
	const refus = useFloorRoute()
	useFloorKeys()
	const slug = useSalleUi(selectFloor)
	const view = useSalleUi(selectView)
	const q = useSalleState(slug)
	const { refetch: retry } = q
	const [chefImmeuble, setChefImmeuble] = useState(CHEF_DEFAUT)
	const chef =
		view === "floor" && q.data ? chefDe(q.data.immeuble, slug) : chefImmeuble

	let content: React.ReactNode
	if (q.isError) {
		content = <StateError error={q.error} onRetry={() => void retry()} />
	} else if (q.isPending && !q.data) {
		content = <Text variant="muted">{t("global:loading")}</Text>
	} else {
		content = <Outlet />
	}

	return (
		<div className="min-h-screen bg-bg text-text">
			<SalleHeader />
			<div
				className={cn(
					"grid min-w-0 gap-4 p-4 pb-24 lg:pb-4",
					view === "floor" && "lg:grid-cols-[minmax(0,1fr)_22rem]",
				)}
			>
				<main className="min-w-0">
					{refus !== "" && (
						<Panel variant="alert">
							<Text variant="body">{t("salle:refus")}</Text>
						</Panel>
					)}
					{content}
				</main>
				{/* immeuble : la page possède sa todo (à droite de la tour) */}
				{view === "floor" && (
					<aside className="min-w-0 lg:sticky lg:top-4 lg:self-start">
						<TodoPanel />
					</aside>
				)}
			</div>
			{/* tiroir du chef : collé au bas de l'écran, toutes vues */}
			<div className="sticky bottom-0 z-40 bg-bg px-4">
				{view === "floor" && slug ? (
					<SelecteurChef slug={slug} />
				) : (
					<SelecteurChef
						slug={null}
						chefActif={chefImmeuble}
						onChoisir={setChefImmeuble}
					/>
				)}
				<Terminal key={chef} chef={chef} />
			</div>
		</div>
	)
}

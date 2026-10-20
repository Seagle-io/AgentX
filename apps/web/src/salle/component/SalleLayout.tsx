import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Outlet } from "react-router"
import { useSalleState } from "@/api/state/hooks"
import { CHEF_DEFAUT, chefDe } from "@/api/term/chef"
import { reaffecter } from "@/api/term/crud"
import Terminal from "@/console/component/Terminal"
import SalleHeader from "@/salle/component/SalleHeader"
import { useFloorKeys, useFloorRoute } from "@/salle/script/route"
import { selectFloor, selectView, useSalleUi } from "@/shared/lib/store/salle"
import { cn } from "@/shared/lib/utils"
import StateError from "@/shared/page/component/StateError"
import Panel from "@/shared/ui/panel"
import Text from "@/shared/ui/text"
import TodoPanel from "@/todo/component/TodoPanel"

// Chef de l'étage affiché (chefs vivants + défaut) ⇒ réaffectation ; 409 : message serveur
function SelecteurChef({ slug }: { slug: string }) {
	const { t } = useTranslation()
	const queryClient = useQueryClient()
	const { data: jeton } = useSalleState(null, (s) => s.jeton)
	const { data: immeuble } = useSalleState(null, (s) => s.immeuble)
	const vers = useMutation({
		mutationFn: (cle: string) => reaffecter(jeton ?? "", slug, cle),
		onSettled: () => queryClient.invalidateQueries({ queryKey: ["state"] }),
	})
	const chefs = immeuble?.chefs
	if (!immeuble || !chefs?.length) return null
	const libelle = t("salle:chef")
	const choix = chefs.filter((c) => c.vivant === true || c.defaut)
	return (
		<div className="flex min-w-0 items-center gap-2 pb-1 text-xs">
			<span className="text-text-muted">{libelle}</span>
			<select
				className="rounded-control border border-border-subtle bg-surface px-2 py-1"
				aria-label={libelle}
				value={chefDe(immeuble, slug)}
				disabled={!jeton || vers.isPending}
				onChange={(e) => vers.mutate(e.target.value)}
			>
				{choix.map((c) => (
					<option key={c.cle} value={c.cle}>
						{c.cle}
					</option>
				))}
			</select>
			{vers.error && <span className="text-error">{vers.error.message}</span>}
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
	const chef =
		view === "floor" && q.data ? chefDe(q.data.immeuble, slug) : CHEF_DEFAUT

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
				{view === "floor" && slug && <SelecteurChef slug={slug} />}
				<Terminal key={chef} chef={chef} />
			</div>
		</div>
	)
}

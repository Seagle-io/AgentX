import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Outlet } from "react-router"
import { useSalleState } from "@/api/state/hooks"
import { CHEF_DEFAUT, chefDe } from "@/api/term/chef"
import TiroirChef from "@/console/component/TiroirChef"
import ImmeublePlat from "@/salle/component/ImmeublePlat"
import SalleHeader from "@/salle/component/SalleHeader"
import { majVisites } from "@/salle/script/ongletsChef"
import { useFloorKeys, useFloorRoute } from "@/salle/script/route"
import { selectFloor, selectView, useSalleUi } from "@/shared/lib/store/salle"
import StateError from "@/shared/page/component/StateError"
import Panel from "@/shared/ui/panel"
import Text from "@/shared/ui/text"
import TodoPanel from "@/todo/component/TodoPanel"

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
	const connus = (q.data?.immeuble.chefs ?? []).map((c) => c.cle)
	const [visites, setVisites] = useState([chef])
	// terminaux gardés montés : 1 par chef visité, seul l'actif affiché
	const suivant = majVisites(visites, chef, connus)
	if (suivant.join("\n") !== visites.join("\n")) setVisites(suivant)

	let content: React.ReactNode
	if (q.isError) {
		content = <StateError error={q.error} onRetry={() => void retry()} />
	} else if (q.isPending && !q.data) {
		content = <Text variant="muted">{t("global:loading")}</Text>
	} else {
		content = <Outlet />
	}

	return (
		<div className="grid h-dvh grid-rows-[48px_minmax(0,1fr)] overflow-hidden bg-bg text-text">
			<SalleHeader />
			<div className="relative grid min-h-0 min-w-[1360px] grid-cols-[440px_minmax(0,1fr)_330px]">
				<ImmeublePlat />
				<main className="grid min-h-0 min-w-0 grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)] overflow-x-hidden [&>*]:min-w-0 overflow-y-auto">
					{refus !== "" && (
						<Panel variant="alert">
							<Text variant="body">{t("salle:refus")}</Text>
						</Panel>
					)}
					{content}
				</main>
				<TodoPanel />
				<TiroirChef
					chef={chef}
					visites={visites}
					slug={view === "floor" ? slug : null}
					onChoisir={setChefImmeuble}
					chefImmeuble={chefImmeuble}
				/>
			</div>
		</div>
	)
}

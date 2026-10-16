import { useTranslation } from "react-i18next"
import { Outlet } from "react-router"
import { useSalleState } from "@/api/state/hooks"
import SalleHeader from "@/salle/component/SalleHeader"
import { useFloorKeys, useFloorRoute } from "@/salle/script/route"
import { selectFloor, useSalleUi } from "@/shared/lib/store/salle"
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
	const q = useSalleState(slug)
	const { refetch: retry } = q

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
			<div className="grid min-w-0 gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
				<main className="min-w-0">
					{refus !== "" && (
						<Panel variant="alert">
							<Text variant="body">{t("salle:refus")}</Text>
						</Panel>
					)}
					{content}
				</main>
				<aside className="min-w-0">
					<TodoPanel />
				</aside>
			</div>
		</div>
	)
}

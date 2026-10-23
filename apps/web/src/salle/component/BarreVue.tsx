import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { useSalleState } from "@/api/state/hooks"
import {
	selectLastFloor,
	selectView,
	useSalleUi,
} from "@/shared/lib/store/salle"
import { cn } from "@/shared/lib/utils"

type BarreVueProps = { children?: ReactNode }

export const BarreVue = ({ children }: BarreVueProps) => {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const view = useSalleUi(selectView)
	const lastFloor = useSalleUi(selectLastFloor)
	const premier = useSalleState(null, (s) => s.immeuble.etages[0]?.slug).data
	const cible = lastFloor ?? premier

	const routes: Record<string, string> = {
		floor: cible ? `/floor/${cible}` : "/",
		building: "/",
		basement: "/sous-sol",
	}

	const items = [
		{ cle: "floor", libelle: t("salle:floor") },
		{ cle: "building", libelle: t("salle:vueMulti") },
		{ cle: "basement", libelle: t("salle:basement") },
	]

	return (
		<div className="flex items-center gap-2">
			<div
				role="tablist"
				aria-label={t("salle:title")}
				className="flex shrink-0 gap-0.5 rounded-md bg-surface-2 p-0.5"
			>
				{items.map(({ cle, libelle }) => (
					<button
						key={cle}
						type="button"
						role="tab"
						aria-selected={cle === view}
						tabIndex={cle === view ? 0 : -1}
						className={cn(
							"h-[22px] cursor-pointer rounded px-2 text-[11px] font-semibold",
							cle === view ? "bg-panel text-text" : "text-text-muted",
						)}
						onClick={() => cle !== view && navigate(routes[cle] ?? "/")}
					>
						{libelle}
					</button>
				))}
			</div>
			{children}
		</div>
	)
}

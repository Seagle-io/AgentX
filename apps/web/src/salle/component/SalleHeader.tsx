import { useTranslation } from "react-i18next"
import { useSalleState } from "@/api/state/hooks"
import { selectFloor, selectView, useSalleUi } from "@/shared/lib/store/salle"
import Badge from "@/shared/ui/badge"
import Button from "@/shared/ui/button"
import Text from "@/shared/ui/text"

// En-tête : titre du projet, horloge (horodate du polling, 0 timer), ticker
export default function SalleHeader() {
	const { t } = useTranslation()
	const view = useSalleUi(selectView)
	const slug = useSalleUi(selectFloor)
	const { data } = useSalleState(slug, (s) => ({
		projet: s.projet,
		demo: s.demo,
		horodate: s.horodate,
		ticker: s.ticker,
	}))
	const demo = data?.demo ?? true

	return (
		<header className="flex flex-col gap-2 border-b border-border px-4 py-3">
			<div className="flex flex-wrap items-center gap-3">
				<Text variant="h1" className="line-clamp-2 min-w-0 text-xl sm:text-2xl">
					{demo ? t("global:appName") : data?.projet.titre}
				</Text>
				{demo ? (
					<Badge variant="warning">{t("salle:demo")}</Badge>
				) : (
					<Badge variant="neutral" size="sm">
						{data?.projet.slug}
					</Badge>
				)}
				{view === "floor" && (
					<Button variant="link" size="sm" href="#/">
						{t("salle:building")}
					</Button>
				)}
				<Text variant="mono" className="ml-auto">
					{data?.horodate ?? ""}
				</Text>
			</div>
			<p className="truncate font-mono text-xs text-text-muted">
				{data?.ticker ?? ""}
			</p>
		</header>
	)
}

import { useTranslation } from "react-i18next"
import { useSalleState } from "@/api/state/hooks"
import { selectFloor, useSalleUi } from "@/shared/lib/store/salle"
import Badge from "@/shared/ui/badge"
import Text from "@/shared/ui/text"

type FloorListProps = { onSelect(slug: string): void }

const FloorList = ({ onSelect }: FloorListProps) => {
	const { t } = useTranslation("salle")
	const slug = useSalleUi(selectFloor)
	const { data: immeuble } = useSalleState(slug, (s) => s.immeuble)

	if (immeuble === undefined) return null
	if (immeuble === null) return <Text variant="muted">{t("demo")}</Text>

	return (
		<nav aria-label={t("building")} className="flex flex-col gap-3">
			{immeuble.etages.length === 0 ? (
				<Text variant="muted">{t("floors.empty")}</Text>
			) : (
				<ul className="flex flex-col gap-1">
					{immeuble.etages.map((e) => {
						const n = e.compteurs["en-cours"] ?? 0
						return (
							<li key={e.slug}>
								<button
									type="button"
									aria-current={e.selection ? "true" : undefined}
									onClick={() => onSelect(e.slug)}
									className="flex w-full items-center gap-2 rounded-control px-2 py-1 text-left hover:bg-surface aria-[current]:bg-surface"
								>
									<Text variant="mono" as="span">
										{e.num}
									</Text>
									<Text variant={e.dormant ? "muted" : "body"} as="span">
										{e.titre}
									</Text>
									{n > 0 && (
										<Badge variant="accent">{t("floors.enCours", { n })}</Badge>
									)}
									{e.alerte.niveau === "bloque" && (
										<Badge variant="error">{e.alerte.texte}</Badge>
									)}
									{e.alerte.niveau === "urgent" && (
										<Badge variant="warning">{e.alerte.texte}</Badge>
									)}
								</button>
							</li>
						)
					})}
				</ul>
			)}
			<Text variant="h3">{t("basement")}</Text>
			{immeuble.sous_sol.map((p) => (
				<Text key={p.slug} variant="muted">
					{p.titre}
				</Text>
			))}
		</nav>
	)
}

export default FloorList

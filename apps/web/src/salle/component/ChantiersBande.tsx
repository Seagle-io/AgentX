import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { useSalleState } from "@/api/state/hooks"
import { chantiersEtage } from "@/salle/script/chantiers"
import { cn } from "@/shared/lib/utils"

const PUCE =
	"inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border px-2 text-[11px]"

export default function ChantiersBande({ slug }: { slug: string | null }) {
	const { t } = useTranslation("salle")
	const { data } = useSalleState(slug, (s) =>
		slug ? chantiersEtage(s, slug) : null,
	)
	if (!slug || !data || (data.ouverts.length === 0 && data.archives === 0)) {
		return null
	}
	return (
		<nav
			data-testid="chantiers-bande"
			aria-label={t("chantiersTitre")}
			className="flex h-9 max-h-14 min-w-0 shrink-0 items-center gap-1.5 overflow-x-auto"
		>
			<span className="shrink-0 text-[11px] text-text-muted">
				{t("chantiersTitre")}
			</span>
			{data.ouverts.map((c) => (
				<span
					key={c.slug}
					title={c.titre}
					aria-current={c.actif ? "true" : undefined}
					className={cn(
						PUCE,
						c.actif
							? "border-cyan-400 text-text"
							: "border-border-subtle text-text-muted",
					)}
				>
					{c.court}
					{c.encours > 0 && <span>{c.encours}▶</span>}
					{c.revue > 0 && <span>{c.revue}●</span>}
					{c.bloque > 0 && <span>{c.bloque}✖</span>}
				</span>
			))}
			{data.archives > 0 && (
				<Link
					to={`/sous-sol#${slug}`}
					className={cn(PUCE, "border-border-subtle text-text-muted")}
				>
					{t("chantiersArchives", { n: data.archives })}
				</Link>
			)}
		</nav>
	)
}

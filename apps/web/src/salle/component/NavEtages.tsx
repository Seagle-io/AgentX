import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { useSalleState } from "@/api/state/hooks"
import { vueNav } from "@/salle/script/activite"
import { selectFloor, selectView, useSalleUi } from "@/shared/lib/store/salle"
import { cn } from "@/shared/lib/utils"

export type NavEtagesProps = { className?: string }

const LIGNE =
	"flex min-h-11 w-full cursor-pointer items-center gap-2 border border-transparent px-2 py-1 text-left hover:bg-surface aria-[current=true]:border-accent aria-[current=true]:bg-accent-bg"

const Pied = ({
	actif,
	onClick,
	children,
}: {
	actif: boolean
	onClick: () => void
	children: string
}) => (
	<button
		type="button"
		aria-current={actif ? "true" : undefined}
		onClick={onClick}
		className={cn(LIGNE, "font-mono text-xs")}
	>
		{children}
	</button>
)

// Colonne gauche : un étage par ligne (num décroissant), compteurs, accès boîte et sous-sol
export default function NavEtages({ className }: NavEtagesProps) {
	const { t } = useTranslation("salle")
	const navigate = useNavigate()
	const slug = useSalleUi(selectFloor)
	const view = useSalleUi(selectView)
	const { data: vue } = useSalleState(slug, (s) =>
		vueNav(s, view === "floor" ? slug : null),
	)
	if (!vue) return null
	return (
		<nav
			aria-label={t("nav.label")}
			data-testid="nav-etages"
			className={cn("flex flex-col gap-1 overflow-y-auto p-3", className)}
		>
			<span className="px-1 py-2 font-mono text-[11px] font-[450] uppercase tracking-[0.12em] text-text-muted">
				{t("nav.label")}
			</span>
			{vue.etages.map((e) => (
				<button
					key={e.slug}
					type="button"
					aria-current={e.selection ? "true" : undefined}
					onClick={() => navigate(e.selection ? "/" : `/floor/${e.slug}`)}
					className={cn(LIGNE, "grid grid-cols-[28px_minmax(0,1fr)_auto]")}
				>
					<span className="font-mono text-xs font-bold text-accent">
						{t("floors.num", { n: e.num })}
					</span>
					<span className="min-w-0">
						<span className="block truncate font-semibold">{e.titre}</span>
						<span className="block truncate font-mono text-xs text-text-muted">
							{t("nav.sous", { c: e.enCours, r: e.revue, b: e.bloque })}
						</span>
					</span>
					{(e.bloque > 0 || e.choix > 0) && (
						<span
							title={e.bloque > 0 ? t("nav.bloquees") : t("nav.choix")}
							className={cn(
								"min-w-6 border px-1.5 py-0.5 text-center font-mono text-xs font-semibold",
								e.bloque > 0
									? "border-error text-error"
									: "border-warning text-warning",
							)}
						>
							{e.bloque > 0 ? e.bloque : e.choix}
						</span>
					)}
				</button>
			))}
			<div className="mt-auto flex flex-col gap-1 border-t border-border-subtle pt-3">
				<Pied actif={view === "building"} onClick={() => navigate("/")}>
					{t("nav.toutes")}
				</Pied>
				<Pied actif={view === "basement"} onClick={() => navigate("/sous-sol")}>
					{t("sousSolN", { n: vue.clos })}
				</Pied>
			</div>
		</nav>
	)
}

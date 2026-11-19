import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useSalleState } from "@/api/state/hooks"
import VignetteImmeuble from "@/salle/component/VignetteImmeuble"
import VoixPanel from "@/salle/component/VoixPanel"
import { vueActivite } from "@/salle/script/activite"
import { selectFloor, selectView, useSalleUi } from "@/shared/lib/store/salle"
import { cn } from "@/shared/lib/utils"

export type ColonneActiviteProps = { className?: string }

const POINT = { ok: "bg-success", warn: "bg-warning", ko: "bg-error" }

const Section = ({
	titre,
	children,
}: {
	titre: string
	children: React.ReactNode
}) => (
	<section className="flex flex-col gap-2">
		<h3 className="font-mono text-[11px] font-[450] uppercase tracking-[0.12em] text-text-muted">
			{titre}
		</h3>
		{children}
	</section>
)

const Vide = ({ texte }: { texte: string }) => (
	<span className="font-mono text-xs text-text-muted">{texte}</span>
)

// Colonne droite : immeuble en vignette, agents vivants, sondes, derniers rendus, journal vocal
export default function ColonneActivite({ className }: ColonneActiviteProps) {
	const { t } = useTranslation("salle")
	const slug = useSalleUi(selectFloor)
	const view = useSalleUi(selectView)
	const [voixOuvert, setVoixOuvert] = useState(false)
	const { data: vue } = useSalleState(slug, vueActivite)
	if (!vue) return null
	return (
		<aside
			aria-label={t("activite.label")}
			data-testid="colonne-activite"
			className={cn(
				"flex flex-col gap-4 overflow-y-auto border-l border-border bg-bg-panel p-3",
				className,
			)}
		>
			<VignetteImmeuble slug={view === "floor" ? slug : null} />
			<Section titre={t("activite.agents")}>
				{vue.vivants.length === 0 && <Vide texte={t("activite.aucun")} />}
				<ul className="m-0 flex list-none flex-col gap-1 p-0">
					{vue.vivants.map((a) => (
						<li
							key={a.tid}
							className="flex items-center gap-2 font-mono text-xs"
						>
							<span
								aria-hidden="true"
								className="size-2 shrink-0 rounded-full"
								style={{ background: a.couleur }}
							/>
							<span>{a.role}</span>
							<span className="text-text-muted">{a.tid}</span>
							{a.etageNum !== null && (
								<span className="ml-auto text-accent">
									{t("floors.num", { n: a.etageNum })}
								</span>
							)}
						</li>
					))}
				</ul>
			</Section>
			<Section titre={t("activite.sondes")}>
				{vue.sondes.length === 0 && <Vide texte={t("activite.sansSource")} />}
				<ul className="m-0 flex list-none flex-col gap-1 p-0">
					{vue.sondes.map((s) => (
						<li
							key={s.nom}
							className="flex items-center gap-2 font-mono text-xs"
						>
							<span
								aria-hidden="true"
								className={cn("size-2 shrink-0 rounded-full", POINT[s.etat])}
							/>
							<span>{s.nom}</span>
							<span className="truncate text-text-muted">{s.detail}</span>
						</li>
					))}
				</ul>
			</Section>
			<Section titre={t("activite.rendus")}>
				{vue.rendus.length === 0 && <Vide texte={t("activite.aucun")} />}
				<ul className="m-0 flex list-none flex-col gap-1 p-0">
					{vue.rendus.map((r) => (
						<li key={r.id} className="font-mono text-xs">
							<span className="text-text-muted">{r.t}</span> {r.role} {r.tid} →{" "}
							{r.statut}
						</li>
					))}
				</ul>
			</Section>
			{vue.voix > 0 && (
				<section>
					<button
						type="button"
						aria-expanded={voixOuvert}
						onClick={() => setVoixOuvert((o) => !o)}
						className="min-h-8 cursor-pointer border border-border px-2 text-left font-mono text-xs hover:bg-surface"
					>
						{t("activite.voix", { n: vue.voix })}
					</button>
					{voixOuvert && <VoixPanel />}
				</section>
			)}
		</aside>
	)
}

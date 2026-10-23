import { useTranslation } from "react-i18next"
import type { Clos } from "@/engine/svg/plat"

const Archives = ({ clos }: { clos: Clos[] }) => {
	const { t } = useTranslation("salle")
	return (
		<section className="min-w-0 overflow-hidden rounded-lg border border-border bg-panel">
			<h2 className="m-0 border-border-subtle border-b px-3 py-2 font-semibold text-muted text-xs uppercase tracking-wide">
				{t("projetsClos")}
			</h2>
			{clos.length === 0 ? (
				<p className="m-0 px-3 py-2 text-muted text-xs">{t("vide")}</p>
			) : (
				<ul className="m-0 flex list-none flex-col px-1.5 py-1">
					{clos.map((p) => (
						<li
							key={`${p.titre}-${p.maj}`}
							className="grid h-7 grid-cols-[5rem_minmax(0,1fr)_auto] items-center gap-2.5 rounded px-1.5 text-xs hover:bg-surface"
						>
							<code className="text-muted">{p.maj}</code>
							<span className="truncate">{p.titre}</span>
							<span className="text-muted uppercase">{p.statut}</span>
						</li>
					))}
				</ul>
			)}
		</section>
	)
}

export default Archives

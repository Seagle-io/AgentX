import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useSalleState } from "@/api/state/hooks"
import { PF_CSS, salleSousSol } from "@/engine/svg/plat"
import { V1_CSS } from "@/engine/svg/style"
import Archives from "@/salle/component/Archives"
import { BarreVue } from "@/salle/component/BarreVue"
import { toImmeublePlat } from "@/salle/script/plat"

export default function BasementPage() {
	const { t } = useTranslation("salle")
	const { data: clos = [] } = useSalleState(
		null,
		(s) => toImmeublePlat(s, null, "").clos,
	)
	const cle = JSON.stringify(clos)
	const html = useMemo(() => salleSousSol(JSON.parse(cle)), [cle])
	return (
		<div className="grid min-h-0 min-w-0 content-start gap-3">
			<BarreVue>
				<span className="text-muted text-xs">
					{t("ssSous", { n: clos.length })}
				</span>
			</BarreVue>
			<section
				aria-label={t("archives")}
				className="relative h-[24rem] min-w-0 overflow-hidden rounded-lg border border-border-subtle bg-surface"
			>
				<style>{V1_CSS + PF_CSS}</style>
				<div
					className="absolute inset-0"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: SVG de `salleSousSol`, textes passés par `esc`
					dangerouslySetInnerHTML={{ __html: html }}
				/>
			</section>
			<Archives clos={clos} />
		</div>
	)
}

import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useSalleState } from "@/api/state/hooks"
import { PF_CSS, salleSousSol } from "@/engine/svg/plat"
import { V1_CSS } from "@/engine/svg/style"
import Archives from "@/salle/component/Archives"
import { toImmeublePlat } from "@/salle/script/plat"
import Text from "@/shared/ui/text"

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
			<div className="flex flex-wrap items-baseline gap-3">
				<Text variant="h2">{t("ssTitre")}</Text>
				<Text variant="caption">{t("ssSous", { n: clos.length })}</Text>
			</div>
			<section
				aria-label={t("archives")}
				className="relative h-[24rem] min-w-0 overflow-hidden rounded-none border border-border-subtle bg-surface"
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

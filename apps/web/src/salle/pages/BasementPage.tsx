import { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useLocation } from "react-router"
import { useSalleState } from "@/api/state/hooks"
import { PF_CSS, salleSousSol } from "@/engine/svg/plat"
import { V1_CSS } from "@/engine/svg/style"
import Archives from "@/salle/component/Archives"
import { type SalleSousSol, sallesSousSol } from "@/salle/script/plat"
import Text from "@/shared/ui/text"

function SalleProjet({ salle }: { salle: SalleSousSol }) {
	const { t } = useTranslation("salle")
	const nom = salle.nom || t("ssSansProjet")
	const html = useMemo(() => salleSousSol(salle.clos, 720, 260), [salle.clos])
	return (
		<section
			id={salle.cle || "sans-projet"}
			aria-label={nom}
			className="grid min-w-0 gap-2"
		>
			<h2 className="flex items-center gap-2 text-sm">
				{salle.couleur && (
					<span
						className="size-2.5 rounded-full"
						style={{ background: salle.couleur }}
					/>
				)}
				{t("ssSalle", { nom, n: salle.clos.length })}
			</h2>
			<div className="relative h-[16rem] min-w-0 overflow-hidden rounded-none border border-border-subtle bg-surface">
				<style>{V1_CSS + PF_CSS}</style>
				<div
					className="absolute inset-0"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: SVG de `salleSousSol`, textes passés par `esc`
					dangerouslySetInnerHTML={{ __html: html }}
				/>
			</div>
			<Archives clos={salle.clos} />
		</section>
	)
}

export default function BasementPage() {
	const { t } = useTranslation("salle")
	const { data: salles = [] } = useSalleState(null, sallesSousSol)
	const cle = JSON.stringify(salles)
	const stables = useMemo<SalleSousSol[]>(() => JSON.parse(cle), [cle])
	const { hash } = useLocation()
	useEffect(() => {
		if (hash && stables.length)
			document.getElementById(hash.slice(1))?.scrollIntoView({ block: "start" })
	}, [hash, stables.length])
	const total = stables.reduce((n, s) => n + s.clos.length, 0)
	return (
		<div className="grid min-h-0 min-w-0 content-start gap-3">
			<div className="flex flex-wrap items-baseline gap-3">
				<Text variant="h2">{t("ssTitre")}</Text>
				<Text variant="caption">{t("ssSous", { n: total })}</Text>
			</div>
			{stables.map((s) => (
				<SalleProjet key={s.cle} salle={s} />
			))}
		</div>
	)
}

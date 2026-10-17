import { useTranslation } from "react-i18next"
import type { Estimation } from "@/api/state/schema"
import Badge, { type BadgeVariant } from "@/shared/ui/badge"
import Text from "@/shared/ui/text"

type EtageEstimationProps = { estimation?: Estimation }

// 98,7 → "1 h 39" ; 45 → "45 min"
export const formatDuree = (min: number): string => {
	const total = Math.round(min)
	if (total < 60) return `${total} min`
	return `${Math.floor(total / 60)} h ${String(total % 60).padStart(2, "0")}`
}

export const etatReste = (e: Estimation): "rien" | "indisponible" | "duree" => {
	if (e.ouvertes === 0) return "rien"
	return e.reste_min === null || e.fiabilite === "∅" ? "indisponible" : "duree"
}

// "6 implementeur × 12,5 min · 3 verificateur × 7,8 min"
export const detailRoles = (e: Estimation): string =>
	Object.entries(e.par_role)
		.filter(([, r]) => r.moy_min !== null && r.ouvertes > 0)
		.map(([role, r]) => {
			const moy = String(Math.round((r.moy_min ?? 0) * 10) / 10).replace(
				".",
				",",
			)
			return `${r.ouvertes} ${role} × ${moy} min`
		})
		.join(" · ")

const variants: Record<"haute" | "moyenne" | "basse", BadgeVariant> = {
	haute: "success",
	moyenne: "warning",
	basse: "neutral",
}

const EtageEstimation = ({ estimation }: EtageEstimationProps) => {
	const { t } = useTranslation("salle")
	if (estimation === undefined) return null
	const etat = etatReste(estimation)
	const detail = detailRoles(estimation)
	const fiab = estimation.fiabilite

	return (
		<div className="flex flex-wrap items-center gap-2" title={detail}>
			<Text variant="body" as="span">
				{etat === "rien" && t("estimation.rien")}
				{etat === "indisponible" && t("estimation.indisponible")}
				{etat === "duree" &&
					t("estimation.reste", {
						duree: formatDuree(estimation.reste_min ?? 0),
					})}
			</Text>
			{etat === "duree" && fiab !== "∅" && (
				<Badge variant={variants[fiab]}>
					{t(`estimation.fiabilite.${fiab}`)}
				</Badge>
			)}
			{etat === "duree" && detail !== "" && (
				<Text variant="muted" as="span">
					{detail}
				</Text>
			)}
		</div>
	)
}

export default EtageEstimation

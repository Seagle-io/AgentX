import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { useSalleState } from "@/api/state/hooks"
import { immeubleGrand, PF_CSS } from "@/engine/svg/plat"
import { V1_CSS } from "@/engine/svg/style"
import { selectTerminalOuvert, useSalleUi } from "@/shared/lib/store/salle"

// Zone visée : `g[data-etage]` = slug | "chef" | "sous-sol"
const cibleEtage = (t: EventTarget) =>
	t instanceof Element
		? t.closest("[data-etage]")?.getAttribute("data-etage")
		: undefined

import { toImmeublePlat, versEtageGrand } from "@/salle/script/plat"

const ImmeubleGrand = () => {
	const { t } = useTranslation("salle")
	const navigate = useNavigate()
	const terminalOuvert = useSalleUi(selectTerminalOuvert)
	const basculerTerminal = useSalleUi((s) => s.basculerTerminal)
	const { data: vue } = useSalleState(null, (s) =>
		toImmeublePlat(s, null, s.immeuble.chefs?.find((c) => c.defaut)?.cle ?? ""),
	)
	// SVG reconstruit seulement si la vue change : animations non relancées
	const cle = vue
		? JSON.stringify({
				etages: vue.etages.map(versEtageGrand),
				toit: {
					todo: vue.toit.todo,
					urgent: vue.toit.urgent,
					chefsN: vue.toit.chefsN,
					contexte:
						vue.toit.contextePct === null
							? ""
							: t("contexte", { pct: vue.toit.contextePct }),
				},
				chef: vue.toit.chef,
				clos: vue.clos,
			})
		: ""
	const html = useMemo(() => (cle ? immeubleGrand(JSON.parse(cle)) : ""), [cle])

	if (!vue) return null

	const aller = (cible: string | null | undefined) => {
		if (!cible) return
		if (cible === "chef") {
			if (!terminalOuvert) basculerTerminal()
		} else navigate(cible === "sous-sol" ? "/sous-sol" : `/floor/${cible}`)
	}
	return (
		<section
			aria-label={t("building")}
			className="relative min-h-0 min-w-0 overflow-hidden rounded-lg border border-border-subtle bg-surface"
		>
			<style>{V1_CSS + PF_CSS}</style>
			{/* biome-ignore lint/a11y/noStaticElementInteractions: délégation sur [data-etage] du SVG */}
			<div
				className="absolute inset-0"
				onClick={(e) => aller(cibleEtage(e.target))}
				onKeyDown={(e) => {
					if (e.key === "Enter") aller(cibleEtage(e.target))
				}}
				// biome-ignore lint/security/noDangerouslySetInnerHtml: SVG de `immeubleGrand`, textes passés par `esc`
				dangerouslySetInnerHTML={{ __html: html }}
			/>
		</section>
	)
}

export default ImmeubleGrand

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { GLOW_DEFS } from "@/engine/svg/fantome"
import { V1_CSS } from "@/engine/svg/style"
import Button from "@/shared/ui/button"
import Text from "@/shared/ui/text"
import { GROUPS, SAMPLES } from "@/showcase/component/salle/samples"
import { useValidated } from "@/showcase/component/salle/useValidated"
import Vignette from "@/showcase/component/salle/Vignette"

type CopyState = "idle" | "copied" | "failed"

// Galerie de validation des éléments vivants de la salle v1, avant GIF.
const SalleVivanteSection = () => {
	const { t } = useTranslation("showcase")
	const { ids, toggle } = useValidated()
	const [copy, setCopy] = useState<CopyState>("idle")

	const copyList = () => {
		const list = SAMPLES.filter((s) => ids.includes(s.id)).map((s) => s.id)
		Promise.resolve()
			.then(() => navigator.clipboard.writeText(list.join("\n")))
			.then(() => setCopy("copied"))
			.catch(() => setCopy("failed"))
	}

	return (
		<section
			id="salle-vivante"
			aria-labelledby="salle-vivante-title"
			className="w-full max-w-4xl"
		>
			<style>{V1_CSS}</style>
			{/* defs partagés des yeux vifs : 0×0 (≠ display:none, filtres inertes) */}
			<svg
				width="0"
				height="0"
				className="absolute"
				aria-hidden="true"
				focusable="false"
			>
				<defs
					// biome-ignore lint/security/noDangerouslySetInnerHtml: filtres constants
					dangerouslySetInnerHTML={{ __html: GLOW_DEFS }}
				/>
			</svg>
			<Text id="salle-vivante-title" className="mb-2" variant="h2">
				{t("sections.salle-vivante")}
			</Text>
			<Text variant="muted" className="mb-4">
				{t("salle.intro")}
			</Text>
			<div className="mb-6 flex flex-wrap items-center gap-3">
				<Button variant="outline" size="sm" onClick={copyList}>
					{t("salle.copy", { n: ids.length })}
				</Button>
				<Text as="span" variant="muted" role="status">
					{copy === "idle" ? "" : t(`salle.${copy}`)}
				</Text>
			</div>
			<div className="flex flex-col gap-8">
				{GROUPS.map((g) => (
					<div key={g} className="flex flex-col gap-3">
						<Text variant="h3">{t(`salle.groups.${g}`)}</Text>
						{SAMPLES.filter((s) => s.group === g).map((s) => (
							<Vignette
								key={s.id}
								sample={s}
								validated={ids.includes(s.id)}
								onToggle={toggle}
							/>
						))}
					</div>
				))}
			</div>
		</section>
	)
}

export default SalleVivanteSection

import { useTranslation } from "react-i18next"
import Panel from "@/shared/ui/panel"
import Text from "@/shared/ui/text"

const VARIANTS = ["default", "subtle", "alert"] as const
const PADDINGS = ["none", "sm", "default"] as const

const PanelSection = () => {
	const { t } = useTranslation("showcase")
	return (
		<section
			id="panel"
			aria-labelledby="panel-title"
			className="w-full max-w-4xl"
		>
			<Text id="panel-title" className="mb-4" variant="h2">
				{t("sections.panel")}
			</Text>
			<div className="grid gap-8 lg:grid-cols-3">
				{VARIANTS.map((variant) => (
					<div key={variant} className="flex flex-col gap-3">
						<Text variant="caption">variant={variant}</Text>
						{PADDINGS.map((padding) => (
							<Panel key={padding} variant={variant} padding={padding}>
								<Text variant="mono">padding={padding}</Text>
							</Panel>
						))}
					</div>
				))}
			</div>
		</section>
	)
}

export default PanelSection

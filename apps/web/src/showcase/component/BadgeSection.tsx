import { useTranslation } from "react-i18next"
import Badge from "@/shared/ui/badge"
import Text from "@/shared/ui/text"

const VARIANTS = ["neutral", "accent", "success", "warning", "error"] as const
const SIZES = ["sm", "default"] as const

const BadgeSection = () => {
	const { t } = useTranslation("showcase")
	return (
		<section
			id="badge"
			aria-labelledby="badge-title"
			className="w-full max-w-4xl"
		>
			<Text id="badge-title" className="mb-4" variant="h2">
				{t("sections.badge")}
			</Text>
			<div className="grid gap-8 lg:grid-cols-2">
				{SIZES.map((size) => (
					<div key={size} className="flex flex-col gap-3">
						<Text variant="caption">size={size}</Text>
						<div className="flex flex-wrap items-center gap-3">
							{VARIANTS.map((variant) => (
								<Badge key={variant} variant={variant} size={size}>
									{variant}
								</Badge>
							))}
						</div>
					</div>
				))}
				<div className="flex flex-col gap-3">
					<Text variant="caption">pulse</Text>
					<div className="flex flex-wrap items-center gap-3">
						<Badge variant="accent" pulse>
							pulse
						</Badge>
					</div>
				</div>
			</div>
		</section>
	)
}

export default BadgeSection

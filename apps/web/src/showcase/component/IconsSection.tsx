import { useTranslation } from "react-i18next"
import Icon, { ICONS } from "@/shared/ui/icon"
import Text from "@/shared/ui/text"

const SIZES = ["sm", "md", "lg"] as const
const NAMES = Object.keys(ICONS)

const IconsSection = () => {
	const { t } = useTranslation("showcase")
	return (
		<section
			id="icons"
			aria-labelledby="icons-title"
			className="w-full max-w-4xl"
		>
			<Text id="icons-title" className="mb-4" variant="h2">
				{t("sections.icons")}
			</Text>
			<div className="flex flex-col gap-6">
				<div className="flex flex-wrap items-end gap-6">
					{SIZES.map((size) => (
						<div key={size} className="flex flex-col items-center gap-2">
							<Icon name="pack" size={size} />
							<Text variant="caption">{size}</Text>
						</div>
					))}
					<div className="flex flex-col items-center gap-2">
						<Icon name="inconnu" title={t("icons.unknown")} />
						<Text variant="caption">inconnu</Text>
					</div>
				</div>
				<div className="grid grid-cols-4 gap-4 sm:grid-cols-6 lg:grid-cols-9">
					{NAMES.map((name) => (
						<div key={name} className="flex flex-col items-center gap-2">
							<Icon name={name} />
							<Text variant="caption">{name}</Text>
						</div>
					))}
				</div>
			</div>
		</section>
	)
}

export default IconsSection

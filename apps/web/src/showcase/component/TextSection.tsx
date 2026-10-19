import { useTranslation } from "react-i18next"
import Text from "@/shared/ui/text"

const VARIANTS = ["h1", "h2", "h3", "body", "muted", "mono", "caption"] as const

const TextSection = () => {
	const { t } = useTranslation("showcase")
	return (
		<section
			id="text"
			aria-labelledby="text-title"
			className="w-full max-w-4xl"
		>
			<Text id="text-title" className="mb-4" variant="h2">
				{t("sections.text")}
			</Text>
			<div className="grid gap-8 lg:grid-cols-2">
				<div className="flex flex-col gap-3">
					<Text variant="caption">variant</Text>
					{VARIANTS.map((variant) => (
						<Text key={variant} variant={variant}>
							{variant}
						</Text>
					))}
				</div>
				<div className="flex flex-col gap-3">
					<Text variant="caption">as</Text>
					<Text variant="h3" as="div">
						h3 as=div
					</Text>
					<Text variant="body" as="span">
						body as=span
					</Text>
					<Text variant="mono" as="p">
						mono as=p
					</Text>
				</div>
			</div>
		</section>
	)
}

export default TextSection

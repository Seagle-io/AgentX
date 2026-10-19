import { useTranslation } from "react-i18next"
import Input from "@/shared/ui/input"
import Text from "@/shared/ui/text"

const VARIANTS = ["default", "error"] as const
const SIZES = ["sm", "default"] as const

const InputSection = () => {
	const { t } = useTranslation("showcase")
	return (
		<section
			id="input"
			aria-labelledby="input-title"
			className="w-full max-w-4xl"
		>
			<Text id="input-title" className="mb-4" variant="h2">
				{t("sections.input")}
			</Text>
			<div className="grid gap-8 lg:grid-cols-2">
				{VARIANTS.map((variant) => (
					<div key={variant} className="flex flex-col gap-3">
						<Text variant="caption">variant={variant}</Text>
						{SIZES.map((inputSize) => (
							<Input
								key={inputSize}
								variant={variant}
								inputSize={inputSize}
								aria-label={`${variant} ${inputSize}`}
								defaultValue={`inputSize=${inputSize}`}
							/>
						))}
					</div>
				))}
				<div className="flex flex-col gap-3">
					<Text variant="caption">disabled / placeholder / maxLength</Text>
					<Input disabled aria-label="disabled" defaultValue="disabled" />
					<Input aria-label="placeholder" placeholder="placeholder" />
					<Input
						aria-label="maxLength"
						maxLength={8}
						placeholder="maxLength=8"
					/>
				</div>
			</div>
		</section>
	)
}

export default InputSection

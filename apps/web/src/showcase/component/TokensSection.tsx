import { useTranslation } from "react-i18next"
import Text from "@/shared/ui/text"

// Classes complètes en littéral : Tailwind lit les sources statiquement, une
// classe construite (`bg-${token}`) ne serait jamais générée.
const SWATCHES = [
	"bg-bg",
	"bg-bg-glow",
	"bg-bg-panel",
	"bg-surface",
	"bg-border",
	"bg-border-subtle",
	"bg-text",
	"bg-text-muted",
	"bg-accent",
	"bg-accent-hover",
	"bg-accent-bg",
	"bg-accent-on",
	"bg-accent-solid",
	"bg-accent-solid-hover",
	"bg-warning",
	"bg-warning-solid",
	"bg-warning-solid-hover",
	"bg-warning-on",
	"bg-error",
	"bg-success",
] as const

const TokensSection = () => {
	const { t } = useTranslation("showcase")
	return (
		<section
			id="tokens"
			aria-labelledby="tokens-title"
			className="w-full max-w-4xl"
		>
			<Text id="tokens-title" className="mb-4" variant="h2">
				{t("sections.tokens")}
			</Text>
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
				{SWATCHES.map((swatch) => (
					<div key={swatch} className="flex items-center gap-3">
						<div
							className={`h-10 w-10 shrink-0 rounded-control border border-border ${swatch}`}
						/>
						<Text variant="mono">{swatch.slice("bg-".length)}</Text>
					</div>
				))}
			</div>
		</section>
	)
}

export default TokensSection

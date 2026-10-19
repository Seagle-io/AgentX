import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import Button from "@/shared/ui/button"
import Icon from "@/shared/ui/icon"
import Text from "@/shared/ui/text"

const VARIANTS = [
	"primary",
	"secondary",
	"destructive",
	"warning",
	"outline",
	"ghost",
	"link",
] as const

const SIZES = ["sm", "default", "lg"] as const

// Légende = nom de la prop du kit, donnée de démonstration.
const Group = ({ label, children }: { label: string; children: ReactNode }) => (
	<div className="flex flex-col gap-3">
		<Text variant="caption">{label}</Text>
		<div className="flex flex-wrap items-center gap-3">{children}</div>
	</div>
)

const ButtonsSection = () => {
	const { t } = useTranslation("showcase")
	return (
		<section
			id="buttons"
			aria-labelledby="buttons-title"
			className="w-full max-w-4xl"
		>
			<Text id="buttons-title" className="mb-4" variant="h2">
				{t("sections.buttons")}
			</Text>
			<div className="grid gap-8 lg:grid-cols-2">
				<Group label="variant">
					{VARIANTS.map((variant) => (
						<Button key={variant} variant={variant}>
							{variant}
						</Button>
					))}
				</Group>
				<Group label="size">
					{SIZES.map((size) => (
						<Button key={size} size={size}>
							{size}
						</Button>
					))}
					<Button size="icon" aria-label="icon">
						<Icon name="play" />
					</Button>
				</Group>
				<Group label="disabled">
					<Button disabled>disabled</Button>
					<Button variant="secondary" disabled>
						disabled
					</Button>
					<Button variant="outline" disabled>
						disabled
					</Button>
				</Group>
				<Group label="href / icon">
					<Button href="#/showcase" variant="link">
						href
					</Button>
					<Button variant="secondary">
						<Icon name="copy" size="sm" />
						icon
					</Button>
				</Group>
			</div>
		</section>
	)
}

export default ButtonsSection

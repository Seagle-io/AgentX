import { useTranslation } from "react-i18next"
import Button from "@/shared/ui/button"
import Text from "@/shared/ui/text"
import BadgeSection from "@/showcase/component/BadgeSection"
import ButtonsSection from "@/showcase/component/ButtonsSection"
import GaugeSection from "@/showcase/component/GaugeSection"
import IconsSection from "@/showcase/component/IconsSection"
import InputSection from "@/showcase/component/InputSection"
import PanelSection from "@/showcase/component/PanelSection"
import SalleVivanteSection from "@/showcase/component/SalleVivanteSection"
import TextSection from "@/showcase/component/TextSection"
import TokensSection from "@/showcase/component/TokensSection"

// Ordre du sommaire = ordre d'empilement des sections.
const SECTIONS = [
	"buttons",
	"text",
	"badge",
	"panel",
	"gauge",
	"input",
	"icons",
	"tokens",
	"salle-vivante",
] as const

// `scrollIntoView` et non `href="#id"` : le routeur est en mode hash, une
// ancre changerait de route au lieu de défiler.
const scrollTo = (id: string) =>
	document
		.getElementById(id)
		?.scrollIntoView({ behavior: "smooth", block: "start" })

export const ShowcasePage = () => {
	const { t } = useTranslation("showcase")
	return (
		<main className="m-5 flex flex-col items-center gap-8">
			<Text variant="h1">{t("title")}</Text>
			<nav
				aria-label={t("toc")}
				className="flex w-full max-w-4xl flex-wrap justify-center gap-2"
			>
				{SECTIONS.map((id) => (
					<Button
						key={id}
						variant="link"
						size="sm"
						onClick={() => scrollTo(id)}
					>
						{t(`sections.${id}`)}
					</Button>
				))}
			</nav>
			<ButtonsSection />
			<TextSection />
			<BadgeSection />
			<PanelSection />
			<GaugeSection />
			<InputSection />
			<IconsSection />
			<TokensSection />
			<SalleVivanteSection />
		</main>
	)
}

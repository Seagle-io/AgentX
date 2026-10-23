import { useTranslation } from "react-i18next"
import { useSalleState } from "@/api/state/hooks"
import VoixControles from "@/salle/component/VoixControles"
import {
	selectFloor,
	selectTerminalOuvert,
	useSalleUi,
} from "@/shared/lib/store/salle"
import { basculerMode } from "@/shared/lib/theme/mode"
import { cn } from "@/shared/lib/utils"
import Button from "@/shared/ui/button"

// Fantôme AgentX : dégradé et traits sur les tokens, `currentColor` pour l'ombre
const Logo = () => (
	<svg
		viewBox="0 0 32 32"
		width="30"
		height="30"
		aria-hidden="true"
		className="animate-bounce text-stage"
	>
		<defs>
			<linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stopColor="var(--color-accent)" />
				<stop offset="1" stopColor="var(--color-accent-solid)" />
			</linearGradient>
		</defs>
		<ellipse
			cx="16"
			cy="29.5"
			rx="9"
			ry="1.8"
			fill="currentColor"
			opacity=".35"
		/>
		<path
			d="M5 15.5a11 11 0 0 1 22 0V26q-1.9 2.3-3.7 0-1.8 2.3-3.6 0-1.9 2.3-3.7 0-1.8 2.3-3.6 0-1.9 2.3-3.7 0-1.8 2.3-3.7 0Z"
			fill="url(#lg)"
		/>
		<path
			d="M9 14.5a7 7 0 0 1 10-5"
			fill="none"
			stroke="currentColor"
			strokeOpacity=".35"
			strokeWidth="1.6"
			strokeLinecap="round"
		/>
		<rect
			x="10.5"
			y="13"
			width="3.6"
			height="5.4"
			rx="1.6"
			fill="currentColor"
		/>
		<rect
			x="17.9"
			y="13"
			width="3.6"
			height="5.4"
			rx="1.6"
			fill="currentColor"
		/>
		<rect
			x="11.6"
			y="14"
			width="1.2"
			height="1.6"
			rx=".5"
			className="fill-cyan"
		/>
		<rect
			x="19"
			y="14"
			width="1.2"
			height="1.6"
			rx=".5"
			className="fill-cyan"
		/>
	</svg>
)

const Soleil = () => (
	<svg
		viewBox="0 0 16 16"
		width="15"
		height="15"
		aria-hidden="true"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.4"
		strokeLinecap="round"
	>
		<circle cx="8" cy="8" r="3" />
		<path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" />
	</svg>
)

// En-tête 48 px : marque, ticker, voix, thème, horodate (polling), Chef
export default function SalleHeader() {
	const { t } = useTranslation()
	const slug = useSalleUi(selectFloor)
	const ouvert = useSalleUi(selectTerminalOuvert)
	const basculer = useSalleUi((s) => s.basculerTerminal)
	const { data } = useSalleState(slug, (s) => ({
		horodate: s.horodate,
		ticker: s.ticker,
		chefVivant: s.immeuble.toit.chef.vivant,
	}))

	return (
		<header className="flex min-w-0 items-center gap-3 border-b border-border bg-bg-panel pr-3.5 pl-3">
			<span className="inline-flex shrink-0 items-center gap-2">
				<Logo />
				<span className="flex flex-col leading-3.5">
					<span className="text-sm font-bold tracking-tight">
						{t("salle:marque")}
					</span>
					<span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
						{t("salle:title")}
					</span>
				</span>
			</span>
			<span className="h-5 w-px bg-border" />
			<span className="min-w-0 flex-1 truncate font-mono text-[11px] text-text-muted">
				{data?.ticker ?? ""}
			</span>
			<VoixControles />
			<Button
				variant="ghost"
				size="icon"
				className="border border-border text-text-muted"
				title={t("salle:theme")}
				aria-label={t("salle:theme")}
				onClick={basculerMode}
			>
				<Soleil />
			</Button>
			<code className="font-mono text-xs tabular-nums">
				{data?.horodate ?? ""}
			</code>
			<Button
				variant="ghost"
				size="sm"
				className="border border-border aria-expanded:bg-surface"
				aria-expanded={ouvert}
				title={t("salle:terminalTitre")}
				onClick={basculer}
			>
				<span
					aria-hidden="true"
					className={cn(
						"size-2 rounded-full",
						data?.chefVivant === true && "bg-success",
						data?.chefVivant === false && "bg-text-muted",
						data?.chefVivant == null && "bg-error",
					)}
				/>
				{t("salle:chef")}
			</Button>
		</header>
	)
}

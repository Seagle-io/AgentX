import { useTranslation } from "react-i18next"
import { useSalleState } from "@/api/state/hooks"
import VoixControles from "@/salle/component/VoixControles"
import { ageVault } from "@/salle/script/ageVault"
import {
	selectFloor,
	selectTerminalOuvert,
	useSalleUi,
} from "@/shared/lib/store/salle"
import { basculerMode } from "@/shared/lib/theme/mode"
import { cn } from "@/shared/lib/utils"
import Button from "@/shared/ui/button"

// Fantôme AgentX : aplat accent, traits sur les tokens, `currentColor` pour l'ombre
const Logo = () => (
	<svg
		viewBox="0 0 32 32"
		width="30"
		height="30"
		aria-hidden="true"
		className="animate-bounce text-stage"
	>
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
			fill="var(--color-accent)"
		/>
		<path
			d="M9 14.5a7 7 0 0 1 10-5"
			fill="none"
			stroke="currentColor"
			strokeOpacity=".35"
			strokeWidth="1.6"
			strokeLinecap="round"
		/>
		<rect x="10.5" y="13" width="3.6" height="5.4" fill="currentColor" />
		<rect x="17.9" y="13" width="3.6" height="5.4" fill="currentColor" />
		<rect x="11.6" y="14" width="1.2" height="1.6" className="fill-cyan" />
		<rect x="19" y="14" width="1.2" height="1.6" className="fill-cyan" />
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
		personne: s.personne ?? "",
		vaultMaj: s.vault_maj ?? null,
		vaultSynchro: s.vault_synchro ?? null,
	}))

	return (
		<header className="flex min-w-0 items-center gap-3 border-b border-border bg-bg pr-3.5 pl-3 max-[900px]:flex-wrap max-[900px]:gap-2 max-[900px]:py-1.5">
			<span className="inline-flex shrink-0 items-center gap-2">
				<Logo />
				<span className="flex flex-col leading-3.5">
					<h1 className="font-heading text-sm font-semibold tracking-[-0.045em] [font-stretch:112%]">
						{t("salle:marque")}
					</h1>
					<span className="font-mono text-[11px] font-[450] uppercase tracking-[0.12em] text-text-muted">
						{t("salle:title")}
					</span>
				</span>
			</span>
			<span className="h-5 w-px bg-border max-[900px]:hidden" />
			<span className="min-w-0 flex-1 truncate max-[900px]:hidden font-mono text-[11px] font-[450] uppercase tracking-[0.12em] text-text-muted">
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
			{data?.personne && (
				<span
					className="shrink-0 max-[900px]:hidden font-mono text-[11px] font-[450] uppercase tracking-[0.12em] text-text-muted"
					title={t("salle:personne")}
				>
					@{data.personne}
				</span>
			)}
			{data?.vaultMaj && (
				<span
					data-testid="vault-maj"
					className="shrink-0 max-[900px]:hidden font-mono text-[11px] font-[450] uppercase tracking-[0.12em] text-text-muted"
					title={t("salle:vaultMaj.titre", {
						chemin: data.vaultMaj.chemin,
						iso: data.vaultMaj.iso,
					})}
				>
					{t(`salle:vaultMaj.${ageVault(data.vaultMaj.age_s).cle}`, {
						n: ageVault(data.vaultMaj.age_s).n,
					})}
				</span>
			)}
			{data?.vaultSynchro && (
				<span
					data-testid="vault-synchro"
					className={`shrink-0 max-[900px]:hidden font-mono text-[11px] font-[450] uppercase tracking-[0.12em] ${data.vaultSynchro.client ? "text-text-muted" : "text-warning"}`}
					title={t("salle:vaultSynchro.titre", { iso: data.vaultSynchro.iso })}
				>
					{data.vaultSynchro.client
						? t(`salle:vaultSynchro.${ageVault(data.vaultSynchro.age_s).cle}`, {
								n: ageVault(data.vaultSynchro.age_s).n,
							})
						: t("salle:vaultSynchro.arret")}
				</span>
			)}
			<code className="max-[900px]:hidden font-mono text-xs tabular-nums">
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

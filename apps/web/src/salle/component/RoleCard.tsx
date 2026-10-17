import { useTranslation } from "react-i18next"
import type { Role } from "@/api/state/schema"
import Badge from "@/shared/ui/badge"
import Gauge, { type GaugeTone } from "@/shared/ui/gauge"
import Panel from "@/shared/ui/panel"
import Text from "@/shared/ui/text"

type RoleCardProps = {
	role: Role
	hovered: boolean
	// Décidé par Deck : budget ≤ 8 cartes pulsées
	pulse: boolean
	onHover(cle: string | null): void
}

const tone = (role: Role): GaugeTone =>
	role.actif ? "accent" : role.jauge >= 1 ? "success" : "muted"

const RoleCard = ({ role, hovered, pulse, onHover }: RoleCardProps) => {
	const { t } = useTranslation("salle")
	const tag =
		role.cle === "chef"
			? t("tags.pilote")
			: role.cle === "vault"
				? t("tags.sante")
				: role.actifs === 1
					? t("tags.agent")
					: role.actifs > 1
						? t("tags.agents", { n: role.actifs })
						: null

	return (
		<Panel
			padding="sm"
			className={hovered ? "ring-2 ring-accent" : undefined}
			onMouseEnter={() => onHover(role.cle)}
			onMouseLeave={() => onHover(null)}
		>
			<div className="flex items-center gap-2">
				<span
					aria-hidden="true"
					className="inline-block size-2.5 shrink-0 rounded-full"
					// donnée serveur (roles.json), pas une couleur codée
					style={{ backgroundColor: role.couleur }}
				/>
				<Text
					variant="h3"
					as="span"
					title={role.nom}
					className="min-w-0 grow truncate"
				>
					{role.nom}
				</Text>
				{tag !== null && (
					<Badge variant="accent" size="sm" pulse={pulse} className="shrink-0">
						{tag}
					</Badge>
				)}
			</div>
			<Text variant="muted">{role.sous}</Text>
			<Gauge
				value={role.jauge}
				label={role.label}
				tone={tone(role)}
				className="my-2"
			/>
			<div className="flex flex-wrap items-baseline gap-x-2">
				<Text variant="mono" as="span">
					{role.valeur}
				</Text>
				<Text variant="caption" as="span">
					{role.etat}
				</Text>
			</div>
		</Panel>
	)
}

export default RoleCard

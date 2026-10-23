import { useSalleState } from "@/api/state/hooks"
import { roleDuBureau } from "@/engine/svg/salle"
import RoleCard from "@/salle/component/RoleCard"
import { deckRoles } from "@/salle/script/deck"
import {
	selectFloor,
	selectHoveredDesk,
	useSalleUi,
} from "@/shared/lib/store/salle"
import Panel from "@/shared/ui/panel"
import Text from "@/shared/ui/text"

// Budget animations (decisions.md#2026-10-16) : 8 cartes pulsées au plus
const PULSE_MAX = 8

const Deck = () => {
	const slug = useSalleUi(selectFloor)
	const hoveredDesk = useSalleUi(selectHoveredDesk)
	const onHover = useSalleUi((s) => s.hoverDesk)
	const { data: roles = [] } = useSalleState(slug, (s) =>
		deckRoles(
			s.roles,
			s.immeuble?.etages.find((e) => e.selection)?.effectif?.postes ?? {},
		),
	)
	const { data: registre = "" } = useSalleState(slug, (s) => s.registre_erreur)
	const pulse = new Set(
		roles
			.filter((r) => r.actif)
			.slice(0, PULSE_MAX)
			.map((r) => r.cle),
	)

	return (
		<div className="absolute bottom-2 left-2 z-10 flex max-h-[60%] w-[min(28rem,70%)] flex-col gap-3 overflow-y-auto rounded-control border border-border bg-bg-panel p-2">
			{registre !== "" && (
				<Panel variant="alert">
					<Text>{registre}</Text>
				</Panel>
			)}
			<div className="grid gap-2 grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]">
				{roles.map((role) => (
					<RoleCard
						key={role.cle}
						role={role}
						hovered={
							hoveredDesk !== null && role.cle === roleDuBureau(hoveredDesk)
						}
						pulse={pulse.has(role.cle)}
						onHover={onHover}
					/>
				))}
			</div>
		</div>
	)
}

export default Deck

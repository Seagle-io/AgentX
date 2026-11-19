import { useTranslation } from "react-i18next"
import { useRunCommand, useSalleState } from "@/api/state/hooks"
import type { Demande } from "@/api/state/schema"
import { selectFloor, useSalleUi } from "@/shared/lib/store/salle"
import Badge from "@/shared/ui/badge"
import Button from "@/shared/ui/button"
import Text from "@/shared/ui/text"
import { courtDemande, selectDemandes } from "@/todo/script/demandes"

export type DemandeLigneProps = {
	demande: Demande
	pending: boolean
	onFermer: () => void
	erreur?: string
}

export function DemandeLigne({
	demande,
	pending,
	onFermer,
	erreur,
}: DemandeLigneProps) {
	const { t } = useTranslation("todo")
	return (
		<li className="flex min-w-0 items-center gap-2 px-2 py-1">
			<Text variant="caption" className="shrink-0">
				{demande.id} · {demande.t.slice(11, 16)}
			</Text>
			<span
				className="min-w-0 flex-1 truncate"
				title={
					demande.taches.length
						? `${demande.texte} · ${t("demandes.servie")} ${demande.taches.join(", ")}`
						: demande.texte
				}
			>
				{courtDemande(demande.texte)}
			</span>
			{erreur !== undefined && (
				<Text
					variant="caption"
					className="min-w-0 truncate text-error"
					role="alert"
				>
					{t("demandes.erreur")} {erreur || t("demandes.erreurInconnue")}
				</Text>
			)}
			<Button
				size="sm"
				variant="ghost"
				className="h-8 shrink-0 px-2 text-[11px]"
				data-testid="demande-fermer"
				disabled={pending}
				onClick={onFermer}
			>
				{t("demandes.fermer")}
			</Button>
		</li>
	)
}

// Demandes ouvertes de l'humain : une ligne chacune, fermer ; rien à 0 demande
export default function DemandesPanel() {
	const { t } = useTranslation("todo")
	const slug = useSalleUi(selectFloor)
	const { data } = useSalleState(slug, selectDemandes)
	const run = useRunCommand(slug)
	const items = data?.items ?? []
	const total = data?.total ?? 0
	if (items.length === 0) return null
	const echec =
		run.error?.message ||
		(run.data && run.data.code !== 0
			? run.data.err || `code ${run.data.code}`
			: run.isError
				? ""
				: undefined)
	return (
		<section data-testid="demandes-panel" className="mt-2">
			<Text
				variant="h3"
				className="px-2 font-mono text-[11px] font-[450] uppercase tracking-[0.12em] text-text-dim"
			>
				{t("demandes.title")}{" "}
				<Badge variant="error" size="sm">
					{total}
				</Badge>
			</Text>
			<ol
				aria-label={t("demandes.listLabel")}
				className="mt-1 flex min-w-0 flex-col divide-y divide-border-subtle overflow-hidden"
			>
				{items.map((demande) => (
					<DemandeLigne
						key={demande.id}
						demande={demande}
						pending={run.isPending}
						erreur={
							run.variables?.body.demande === demande.id ? echec : undefined
						}
						onFermer={() =>
							run.mutate({
								body: { action: "demande-fermer", demande: demande.id },
								scope: "agrege",
							})
						}
					/>
				))}
			</ol>
			{total > items.length && (
				<Text variant="muted">
					{t("demandes.plus", { n: total - items.length })}
				</Text>
			)}
		</section>
	)
}

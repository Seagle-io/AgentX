import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useSalleState } from "@/api/state/hooks"
import type { SalleState } from "@/api/state/schema"
import { useTache } from "@/api/tache/hooks"
import Markdown from "@/shared/lib/markdown/Markdown"
import { selectFloor, useSalleUi } from "@/shared/lib/store/salle"
import Badge from "@/shared/ui/badge"
import Button from "@/shared/ui/button"
import Modal from "@/shared/ui/modal"
import Panel from "@/shared/ui/panel"
import Text from "@/shared/ui/text"
import { sansFrontmatter } from "@/todo/script/reponse"

type Etat = "bloque" | "travail" | "inactif" | "arrete"

// pastille d'état
const TONS: Record<Etat, string> = {
	bloque: "bg-error",
	travail: "bg-success",
	inactif: "bg-warning",
	arrete: "bg-border",
}
const RANG = Object.keys(TONS) // bloqués, vivants, arrêtés

const PAR_ETAT: Record<string, Etat> = {
	blocked: "bloque",
	working: "travail",
	idle: "inactif",
}

export const selectAgents = (slug: string | null) => (s: SalleState) => {
	const etage = s.immeuble?.etages.find((e) => e.slug === slug)
	const modeles = new Map(etage?.agents.map((a) => [a.tid, a.modele]))
	return {
		projet: s.immeuble?.selection.projet,
		roles: new Map(s.roles.map((r) => [r.cle, r])),
		agents: s.agents
			.filter((a) => (a.etage ?? a.projet) === slug)
			.map((a) => ({
				...a,
				statut: PAR_ETAT[a.etat] ?? (a.vivant ? "inactif" : "arrete"),
				modele: modeles.get(a.tid),
			}))
			.sort((a, b) => RANG.indexOf(a.statut) - RANG.indexOf(b.statut)),
	}
}

// le h1 du pack est déjà le titre de la fenêtre
const sansTitre = (t: string): string => t.replace(/^# [^\n]*\n?/, "")

export function TacheCorps({
	pack,
	result,
}: {
	pack: string
	result: string | null
}) {
	const { t } = useTranslation("console")
	return (
		<>
			<Text variant="h3">{t("agents.pack")}</Text>
			<Markdown texte={sansTitre(sansFrontmatter(pack))} />
			{result !== null && (
				<>
					<Text variant="h3">{t("agents.rendu")}</Text>
					<Markdown texte={sansTitre(sansFrontmatter(result))} />
				</>
			)}
		</>
	)
}

// Ticket en lecture seule : pack puis rendu, en Markdown
const TacheModal = ({
	projet,
	tid,
	onClose,
}: {
	projet: string | null
	tid: string | null
	onClose: () => void
}) => {
	const { t } = useTranslation("console")
	const { t: tg } = useTranslation("global")
	const { data, error, isPending } = useTache(projet, tid, tid !== null)
	return (
		<Modal
			open={tid !== null}
			onClose={onClose}
			size="lg"
			title={data ? `${data.tid} · ${data.titre}` : (tid ?? "")}
		>
			{isPending && !error && <Text variant="caption">{tg("loading")}</Text>}
			{error && (
				<Text variant="caption">
					{t("agents.erreur", { kind: error.kind })}
				</Text>
			)}
			{data && (
				<div className="flex flex-col gap-3">
					<div className="mb-2 flex gap-2 border-b border-border pb-2">
						<Badge size="sm">{data.role}</Badge>
						<Badge size="sm">{data.statut}</Badge>
					</div>
					<TacheCorps pack={data.pack} result={data.result} />
				</div>
			)}
		</Modal>
	)
}

const AgentsPanel = () => {
	const { t } = useTranslation("console")
	const slug = useSalleUi(selectFloor)
	const { data } = useSalleState(slug, selectAgents(slug))
	const agents = data?.agents ?? []
	const [ouvert, setOuvert] = useState<{
		tid: string
		projet: string | null
	} | null>(null)
	return (
		<Panel
			padding="sm"
			className="flex min-w-0 flex-col gap-1.5 overflow-hidden"
		>
			<div className="flex justify-between">
				<Text variant="h3">{t("agents.titre")}</Text>
				<Text variant="mono" as="span">
					{t("agentsOuverts", {
						n: agents.filter((a) => a.vivant === true).length,
					})}
				</Text>
			</div>
			{agents.length === 0 && (
				<Text variant="caption">{t("agents.aucun")}</Text>
			)}
			<ul className="flex min-h-0 flex-col overflow-auto">
				{agents.map((a) => (
					<li
						key={`${a.tid}-${a.id}`}
						title={[a.id, a.modele].filter(Boolean).join(" · ") || undefined}
						className="grid h-[27px] shrink-0 grid-cols-[8px_minmax(0,1fr)_34px_8px_24px] items-center gap-1.5 border-t border-border-subtle"
					>
						<span
							aria-hidden
							className="size-2 rounded-full"
							style={{ background: data?.roles.get(a.role)?.couleur }}
						/>
						<Text variant="body" className="truncate">
							{data?.roles.get(a.role)?.nom ?? a.role}
						</Text>
						<Text variant="mono">{a.tid}</Text>
						<span
							role="img"
							aria-label={t(`agents.${a.statut}`)}
							title={t(`agents.${a.statut}`)}
							className={`size-2 rounded-full ${TONS[a.statut]}`}
						/>
						<Button
							variant="ghost"
							size="sm"
							className="h-[22px] w-6 px-0"
							aria-label={t("agents.voir")}
							title={t("agents.voir")}
							onClick={() =>
								setOuvert({
									tid: a.tid,
									projet: a.projet ?? data?.projet ?? null,
								})
							}
						>
							↗
						</Button>
					</li>
				))}
			</ul>
			<TacheModal
				projet={ouvert?.projet ?? null}
				tid={ouvert?.tid ?? null}
				onClose={() => setOuvert(null)}
			/>
		</Panel>
	)
}

export default AgentsPanel

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useSalleState } from "@/api/state/hooks"
import type { Etage, SalleState } from "@/api/state/schema"
import { selectFloor, useSalleUi } from "@/shared/lib/store/salle"
import { cn } from "@/shared/lib/utils"
import Badge from "@/shared/ui/badge"
import Text from "@/shared/ui/text"

type FloorListProps = { onSelect(slug: string): void; compact?: boolean }

const PASTILLES = 8 // au-delà : « +N » (parité v1)
const TITRE_MAX = 40

// Titre court v1 : avant « : », ≤ 40 car.
const court = (titre: string) => {
	const t = titre.split(" : ")[0]
	return t.length > TITRE_MAX ? `${t.slice(0, TITRE_MAX - 1)}…` : t
}

const ALERTE: Record<string, "error" | "warning"> = {
	bloque: "error",
	choix: "error",
	urgent: "warning",
}

type LigneProps = {
	e: Etage
	couleur(role: string): string | undefined
	compact: boolean
}

// Mobile : carte 2 lignes (identité / état) ; md : 1 ligne v1 ≤ 56 px
const Ligne = ({ e, couleur, compact }: LigneProps) => {
	const { t } = useTranslation("salle")
	const c = (k: string) => e.compteurs[k] ?? 0
	const alerte = ALERTE[e.alerte.niveau]
	const reste = e.agents.length - PASTILLES
	return (
		<>
			<span className="flex min-w-0 basis-full items-baseline gap-2 md:basis-auto md:shrink-0">
				<Text variant="mono" as="span" className="shrink-0">
					{t("floors.num", { n: e.num })}
				</Text>
				<Text
					variant={e.dormant ? "muted" : "body"}
					as="span"
					className="min-w-0 truncate font-medium"
				>
					{court(e.titre)}
				</Text>
				{!compact && (
					<Text variant="mono" as="span" className="shrink-0 text-text-muted">
						{t("floors.branche", { b: e.branche ?? "∅" })}
					</Text>
				)}
			</span>
			<span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 md:flex-nowrap">
				{e.agents.length > 0 && (
					<span className="flex shrink-0 items-center gap-1">
						{e.agents.slice(0, PASTILLES).map((a) => (
							<span
								key={a.tid}
								role="img"
								aria-label={`${a.role} · ${a.tid}`}
								title={`${a.role} · ${a.tid}`}
								className="size-2.5 rounded-full bg-text-muted"
								style={{ backgroundColor: couleur(a.role) }}
							/>
						))}
						{reste > 0 && (
							<Text variant="mono" as="span" className="text-text-muted">
								{t("floors.plus", { n: reste })}
							</Text>
						)}
					</span>
				)}
				<Text variant="mono" as="span" className="shrink-0 text-text-muted">
					{t("floors.enCours", { n: c("en-cours") })} ·{" "}
					{t("floors.revue", { n: c("revue") })} ·{" "}
					<span className={cn(c("bloque") > 0 && "text-error")}>
						{t("floors.bloque", { n: c("bloque") })}
					</span>
				</Text>
				{!compact && (
					<Text variant="mono" as="span" className="shrink-0 text-text-muted">
						{t("floors.todo", { n: e.todo })}
					</Text>
				)}
				{!compact && alerte && e.alerte.texte && (
					<Badge
						variant={alerte}
						size="sm"
						title={e.alerte.texte}
						className="h-auto min-w-0 whitespace-normal py-0.5 md:truncate md:whitespace-nowrap"
					>
						{e.alerte.texte}
					</Badge>
				)}
			</span>
		</>
	)
}

type Immeuble = SalleState["immeuble"]
type Toit = Immeuble["toit"]
type SousSol = Immeuble["sous_sol"][number]

const PASTILLE_CHEF = {
	true: "bg-success",
	false: "bg-text-muted",
	null: "bg-error",
}

// Ligne chef v1 : « CHEF ● en session · À faire n · Urgent k », non cliquable
const LigneChef = ({ toit }: { toit: Toit }) => {
	const { t } = useTranslation("salle")
	const { vivant } = toit.chef
	return (
		<Text
			variant="mono"
			as="div"
			className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 px-3 py-1 text-text-muted"
		>
			<span className="font-medium text-text">{t("roof.chef")}</span>
			<span className="flex items-center gap-1.5">
				<span
					aria-hidden
					className={cn("size-2.5 rounded-full", PASTILLE_CHEF[`${vivant}`])}
				/>
				{vivant === true ? t("roof.session") : t("roof.absent")}
			</span>
			<span>
				{t("roof.todo")} {toit.todo}
			</span>
			<span className={cn(toit.urgent > 0 && "text-error")}>
				{t("roof.urgent")} {toit.urgent}
			</span>
		</Text>
	)
}

// Sous-sol v1 : 1 ligne repliée, titres complets au clic
const SousSol = ({ projets }: { projets: SousSol[] }) => {
	const { t } = useTranslation("salle")
	const [ouvert, setOuvert] = useState(false)
	if (projets.length === 0) return null
	return (
		<div className="flex min-w-0 flex-col gap-1 px-3">
			<button
				type="button"
				aria-expanded={ouvert}
				onClick={() => setOuvert((o) => !o)}
				className="self-start text-left"
			>
				<Text variant="caption" as="span">
					{t(ouvert ? "basementOpen" : "basementN", { n: projets.length })}
				</Text>
			</button>
			{ouvert && (
				<ul className="flex flex-col gap-0.5">
					{projets.map((p) => (
						<li key={p.slug} className="text-xs text-text-muted">
							{p.titre}
						</li>
					))}
				</ul>
			)}
		</div>
	)
}

const FloorList = ({ onSelect, compact = false }: FloorListProps) => {
	const { t } = useTranslation("salle")
	const slug = useSalleUi(selectFloor)
	const { data: immeuble } = useSalleState(slug, (s) => s.immeuble)
	const { data: roles } = useSalleState(slug, (s) => s.roles)

	if (immeuble === undefined) return null
	const couleur = (role: string) => roles?.find((r) => r.cle === role)?.couleur

	return (
		<nav aria-label={t("building")} className="flex min-w-0 flex-col gap-2">
			{!compact && <LigneChef toit={immeuble.toit} />}
			{immeuble.etages.length === 0 ? (
				<Text variant="muted">{t("floors.empty")}</Text>
			) : (
				<ul className="flex flex-col gap-1">
					{immeuble.etages.map((e) => (
						<li key={e.slug}>
							<button
								type="button"
								aria-current={e.selection ? "true" : undefined}
								onClick={() => onSelect(e.slug)}
								className="flex w-full min-w-0 flex-wrap items-center gap-x-4 gap-y-1 rounded-control border border-border-subtle px-3 py-2 text-left hover:bg-surface aria-[current]:bg-surface md:flex-nowrap md:border-transparent md:py-1"
							>
								<Ligne e={e} couleur={couleur} compact={compact} />
							</button>
						</li>
					))}
				</ul>
			)}
			{!compact && <SousSol projets={immeuble.sous_sol} />}
		</nav>
	)
}

export default FloorList

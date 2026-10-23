import { type CSSProperties, type ReactNode, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { useSalleState } from "@/api/state/hooks"
import { niveauPlat, PF_CSS, sousSolPlat } from "@/engine/svg/plat"
import { V1_CSS } from "@/engine/svg/style"
import {
	type EtagePlatVue,
	type ImmeublePlatVue,
	toImmeublePlat,
} from "@/salle/script/plat"
import { selectFloor, selectView, useSalleUi } from "@/shared/lib/store/salle"
import { cn } from "@/shared/lib/utils"

const W = 240
const H = 96

// Rangée : rail 36 px (numéro, repères) · dessin SVG · plaque 186 px
type RangeeProps = {
	rail: ReactNode
	svg: string
	children: ReactNode
	className?: string
}

const Rangee = ({ rail, svg, children, className }: RangeeProps) => (
	<div
		className={cn(
			"grid min-h-0 grid-cols-[36px_minmax(0,1fr)] overflow-hidden border border-border bg-stage text-left",
			className,
		)}
	>
		<div className="relative flex flex-col items-center justify-center gap-1.5 border-r border-stage-line bg-stage-rail">
			{rail}
		</div>
		<div className="grid min-h-0 grid-cols-[minmax(0,1fr)_186px]">
			<div
				className="min-h-0 [&>svg]:h-full [&>svg]:w-full"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: SVG de `niveauPlat`/`sousSolPlat`, textes passés par `esc`
				dangerouslySetInnerHTML={{ __html: svg }}
			/>
			<div className="flex min-w-0 flex-col justify-center gap-1 border-l border-stage-line px-2.5 py-1.5">
				{children}
			</div>
		</div>
	</div>
)

const Compte = ({
	n,
	libelle,
	ton,
}: {
	n: number
	libelle: string
	ton: string
}) => (
	<span className={cn("whitespace-nowrap", n > 0 ? ton : "text-stage-text")}>
		{n} <span className="font-normal text-stage-text">{libelle}</span>
	</span>
)

const rouge = (e: EtagePlatVue) =>
	e.bloque > 0 || e.alerteNiveau === "bloque" || e.alerteNiveau === "choix"

const PlaqueEtage = ({ e }: { e: EtagePlatVue }) => {
	const { t } = useTranslation("salle")
	return (
		<>
			<span
				className="flex min-w-0 items-center gap-1.5"
				style={{ "--logo-h": e.logo.teinte } as CSSProperties}
			>
				<span
					aria-hidden="true"
					className="inline-flex size-[22px] shrink-0 items-center justify-center rounded-md border border-[oklch(72%_.17_var(--logo-h)/.4)] bg-[oklch(72%_.17_var(--logo-h)/.15)] font-mono text-[9.5px] font-bold text-[color:oklch(72%_.17_var(--logo-h))]"
				>
					{e.logo.lettres}
				</span>
				<span className="line-clamp-2 text-xs font-semibold leading-[15px] text-stage-text">
					{e.court}
				</span>
			</span>
			<span className="truncate font-mono text-[10px] text-stage-text">
				{t("floors.branche", { b: e.branche })} · {t("todoN", { n: e.todo })}
			</span>
			<span className="flex flex-wrap gap-x-2 font-mono text-[10.5px] font-semibold">
				<Compte n={e.enCours} libelle={t("enCours")} ton="text-cyan" />
				<Compte n={e.revue} libelle={t("revue")} ton="text-stage-warning" />
				<Compte n={e.bloque} libelle={t("bloque")} ton="text-stage-error" />
			</span>
			{e.serveurs.length > 0 && (
				<span className="flex flex-wrap gap-1">
					{e.serveurs.map((v) => (
						<span
							key={v.nom}
							className="inline-flex h-4 items-center gap-1 whitespace-nowrap rounded-full border border-stage-line bg-stage-rail px-1.5 font-mono text-[9.5px] text-stage-text"
						>
							<span
								className={cn(
									"size-[5px] rounded-full",
									v.etat === "ok" && "bg-success",
									v.etat === "warn" && "bg-warning",
									v.etat === "ko" && "bg-error",
								)}
							/>
							{v.nom}
							{v.latence_ms !== null && (
								<span className="text-stage-text">{v.latence_ms}ms</span>
							)}
						</span>
					))}
				</span>
			)}
			{e.alerte && e.alerteTexte !== "" && (
				<span
					className={cn(
						"line-clamp-2 text-[10.5px] leading-[13px]",
						rouge(e) ? "text-stage-error" : "text-stage-warning",
					)}
				>
					{e.alerteTexte}
				</span>
			)}
		</>
	)
}

type Dessins = { chef: string; etages: Record<string, string>; ss: string }

const BoutonEtage = ({
	e,
	svg,
	onAller,
}: {
	e: EtagePlatVue
	svg: string
	onAller: () => void
}) => {
	const { t } = useTranslation("salle")
	return (
		<button
			type="button"
			aria-current={e.selection ? "true" : undefined}
			title={e.titre}
			onClick={onAller}
			className="min-h-0 text-left hover:[&>div]:border-cyan/60"
		>
			<Rangee
				svg={svg}
				className={cn(
					"h-full w-full rounded-sm",
					e.selection && "border-cyan/60 shadow-[0_0_14px_var(--color-cyan)]",
				)}
				rail={
					<>
						<span className="font-mono text-[11px] font-bold text-stage-accent">
							{t("floors.num", { n: e.num })}
						</span>
						{e.selection && (
							<span className="h-[18px] w-3.5 rounded-sm border border-cyan bg-stage-line" />
						)}
						{e.alerte && (
							<span
								className={cn(
									"absolute top-[5px] right-[5px] size-[7px] animate-pulse rounded-full",
									rouge(e) ? "bg-error" : "bg-warning",
								)}
							/>
						)}
					</>
				}
			>
				<PlaqueEtage e={e} />
			</Rangee>
		</button>
	)
}

const RangeeChef = ({ vue, svg }: { vue: ImmeublePlatVue; svg: string }) => {
	const { t } = useTranslation("salle")
	const { toit } = vue
	return (
		<Rangee
			svg={svg}
			className="rounded-t-lg rounded-b-sm"
			rail={
				<>
					<span className="font-mono text-[10px] font-bold text-stage-accent">
						{t("floors.num", { n: toit.chefNum })}
					</span>
					<span
						className={cn(
							"size-[7px] rounded-full",
							toit.chef === "ok" && "bg-success",
							toit.chef === "off" && "bg-text-muted",
							toit.chef === "ko" && "bg-error",
						)}
					/>
				</>
			}
		>
			<span className="text-xs font-bold tracking-wide text-stage-accent">
				{t("roof.chef").toUpperCase()}{" "}
				<span className="font-medium text-stage-success">
					{toit.chef === "ok"
						? `● ${t("roof.session")}`
						: toit.chef === "off"
							? t("chefHors")
							: t("chefInjoignable")}
				</span>
			</span>
			<span className="font-mono text-[10.5px] text-stage-text">
				{t("todoN", { n: toit.todo })} ·{" "}
				<span className="text-stage-error">
					{t("urgentN", { n: toit.urgent })}
				</span>
			</span>
			<span className="font-mono text-[10.5px] text-stage-text">
				{t("chefsN", { n: toit.chefsN })}
				{toit.contextePct !== null &&
					` · ${t("contexte", { pct: toit.contextePct })}`}
			</span>
		</Rangee>
	)
}

const dessiner = (vue: ImmeublePlatVue): Dessins => ({
	chef: niveauPlat({
		chef: vue.toit.chef,
		lum: vue.toit.chef === "ok" ? "allume" : "eteint",
		W,
		H,
		id: "-ip-chef",
	}),
	etages: Object.fromEntries(
		vue.etages.map((e) => [
			e.slug,
			niveauPlat({
				agents: e.agents,
				lum: e.lum,
				selection: e.selection,
				serveurs: e.serveurs,
				W,
				H,
				id: `-ip-${e.slug}`,
			}),
		]),
	),
	ss: sousSolPlat(vue.clos, W, H),
})

// Immeuble à plat : colonne gauche, 1 rangée par niveau, clic ⇒ route
const ImmeublePlat = () => {
	const { t } = useTranslation("salle")
	const navigate = useNavigate()
	const slug = useSalleUi(selectFloor)
	const view = useSalleUi(selectView)
	const { data: vue } = useSalleState(slug, (s) =>
		toImmeublePlat(
			s,
			view === "floor" ? slug : null,
			s.immeuble.chefs?.find((c) => c.defaut)?.cle ?? "",
		),
	)
	// SVG reconstruits seulement si le dessin change : animations non relancées
	const cle = vue
		? JSON.stringify({
				chef: vue.toit.chef,
				etages: vue.etages.map((e) => [
					e.slug,
					e.agents,
					e.lum,
					e.selection,
					e.serveurs,
				]),
				clos: vue.clos,
			})
		: ""
	// biome-ignore lint/correctness/useExhaustiveDependencies: `cle` résume `vue` pour le dessin
	const dessins = useMemo(() => (vue ? dessiner(vue) : null), [cle])
	if (!vue || !dessins) return null
	const { toit } = vue
	const n = vue.etages.length
	return (
		<aside
			aria-label={t("building")}
			className="grid min-h-0 min-w-0 grid-rows-[40px_minmax(0,1fr)] border-r border-border bg-bg-panel"
		>
			<style>{V1_CSS + PF_CSS}</style>
			<div className="flex items-center gap-2.5 border-b border-border-subtle px-3.5 text-xs">
				<span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
					{t("building")}
				</span>
				<span className="ml-auto flex items-center gap-2.5 font-mono text-[11px] text-text-muted">
					<span>{t("etagesN", { n: toit.etages })}</span>
					<span>{t("todoN", { n: toit.todo })}</span>
					<span className="text-stage-error">
						{t("urgentN", { n: toit.urgent })}
					</span>
				</span>
			</div>
			<div
				style={{ "--n": n } as CSSProperties}
				className="grid min-h-0 grid-rows-[72px_repeat(var(--n),minmax(64px,1fr))_56px] gap-[3px] overflow-y-auto px-3 pt-2.5 pb-3"
			>
				<RangeeChef vue={vue} svg={dessins.chef} />
				{vue.etages.map((e) => (
					<BoutonEtage
						key={e.slug}
						e={e}
						svg={dessins.etages[e.slug]}
						onAller={() => navigate(`/floor/${e.slug}`)}
					/>
				))}
				<button
					type="button"
					aria-current={view === "basement" ? "true" : undefined}
					onClick={() => navigate("/sous-sol")}
					className="min-h-0 text-left hover:[&>div]:border-cyan/60"
				>
					<Rangee
						svg={dessins.ss}
						className="h-full w-full rounded-t-sm rounded-b-lg"
						rail={
							<span className="font-mono text-[10px] font-bold text-stage-text">
								SS
							</span>
						}
					>
						<span className="text-[10.5px] font-semibold uppercase tracking-wide text-stage-text">
							{t("sousSolN", { n: vue.clos.length })}
						</span>
						<span className="text-[10.5px] text-stage-text">
							{t("sousSolSous")}
						</span>
					</Rangee>
				</button>
			</div>
		</aside>
	)
}

export default ImmeublePlat

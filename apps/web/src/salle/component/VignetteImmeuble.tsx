import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useSalleState } from "@/api/state/hooks"
import { niveauPlat, PF_CSS, sousSolPlat } from "@/engine/svg/plat"
import { V1_CSS } from "@/engine/svg/style"
import {
	type ImmeublePlatVue,
	type SalleSousSol,
	sallesSousSol,
	toImmeublePlat,
} from "@/salle/script/plat"

export type VignetteImmeubleProps = { slug: string | null }

const W = 288
const H = 48

const dessiner = (
	vue: ImmeublePlatVue & { salles: SalleSousSol[] },
): string[] => [
	niveauPlat({
		chef: vue.toit.chef,
		lum: vue.toit.chef === "ok" ? "allume" : "eteint",
		W,
		H,
		id: "-vg-chef",
	}),
	...vue.etages.map((e) =>
		niveauPlat({
			agents: e.agents,
			lum: e.lum,
			selection: e.selection,
			serveurs: e.serveurs,
			W,
			H,
			id: `-vg-${e.slug}`,
		}),
	),
	sousSolPlat(vue.salles, W, 32),
]

// Immeuble en vignette (moteur plat) : pile verticale, non interactive
export default function VignetteImmeuble({ slug }: VignetteImmeubleProps) {
	const { t } = useTranslation("salle")
	const { data: vue } = useSalleState(slug, (s) => ({
		...toImmeublePlat(
			s,
			slug,
			s.immeuble.chefs?.find((c) => c.defaut)?.cle ?? "",
		),
		salles: sallesSousSol(s),
	}))
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
				salles: vue.salles,
			})
		: ""
	// biome-ignore lint/correctness/useExhaustiveDependencies: `cle` résume `vue` pour le dessin
	const dessins = useMemo(() => (vue ? dessiner(vue) : null), [cle])
	if (!vue || !dessins) return null
	const n = vue.etages.reduce((a, e) => a + e.agentsN, 0)
	return (
		<figure
			data-testid="vignette-immeuble"
			className="m-0 w-72 border border-border bg-stage"
		>
			<style>{V1_CSS + PF_CSS}</style>
			{/* 1 bloc par niveau : chaque SVG de `niveauPlat` remplit son bloc (100 % × 100 %) */}
			<div role="img" aria-label={t("activite.vignette", { n })}>
				{dessins.map((svg, i) => (
					<div
						key={svg.slice(0, 160)}
						style={{ height: i === dessins.length - 1 ? 32 : H }}
						className="border-b border-stage-line last:border-b-0 [&>svg]:h-full [&>svg]:w-full"
						// biome-ignore lint/security/noDangerouslySetInnerHtml: SVG de `niveauPlat`/`sousSolPlat`, textes passés par `esc`
						dangerouslySetInnerHTML={{ __html: svg }}
					/>
				))}
			</div>
		</figure>
	)
}

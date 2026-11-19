import { useTranslation } from "react-i18next"
import { useEffectif } from "@/api/effectif/hooks"
import { useSalleState } from "@/api/state/hooks"
import { selectFloor, useSalleUi } from "@/shared/lib/store/salle"
import Button from "@/shared/ui/button"

// postes d'un étage : un rôle affectable par ligne, − / + sous les plafonds du serveur
export default function EffectifPanel() {
	const { t } = useTranslation("salle")
	const slug = useSalleUi(selectFloor)
	const { data: etage } = useSalleState(slug, (s) =>
		s.immeuble?.etages.find((e) => e.selection),
	)
	const { data: roles = [] } = useSalleState(slug, (s) =>
		s.roles.filter((r) => r.affectable),
	)
	const mutation = useEffectif(slug)
	const eff = etage?.effectif
	if (!etage || !eff) return null

	const bloque = eff.erreur !== ""
	const enVol = mutation.isPending
	const message = eff.erreur || mutation.error?.message || ""
	const changer = (action: "recruter" | "licencier", role: string) =>
		mutation.mutate({ action, body: { etage: etage.slug, role } })

	return (
		<div data-testid="effectif-panel" className="flex flex-col gap-2">
			{message !== "" && (
				<p
					data-testid="effectif-erreur"
					role="alert"
					className="rounded-none border border-error px-3 py-2 text-sm text-error"
				>
					{t("effectif.erreur")} : {message}
				</p>
			)}
			<ul className="flex flex-col divide-y divide-border-subtle">
				{roles.map((r) => {
					const n = eff.postes[r.cle] ?? 0
					const occ = etage.agents.filter((a) => a.role === r.cle).length
					const plein = n >= eff.plafond_role || eff.total >= eff.plafond_etage
					return (
						<li
							key={r.cle}
							data-testid={`effectif-role-${r.cle}`}
							className="flex items-center gap-2 py-1.5"
						>
							<span
								aria-hidden="true"
								className="size-2.5 shrink-0 rounded-full"
								style={{ background: r.couleur }}
							/>
							<span className="min-w-0 flex-1 truncate text-sm">{r.nom}</span>
							<span
								data-testid={`effectif-n-${r.cle}`}
								className="text-sm tabular-nums"
							>
								{`${occ}/${n}`}
							</span>
							<Button
								size="icon"
								variant="outline"
								data-testid={`effectif-moins-${r.cle}`}
								aria-label={`${t("effectif.licencier")} ${r.nom}`}
								title={t("effectif.licencier")}
								disabled={bloque || enVol || n === 0}
								onClick={() => changer("licencier", r.cle)}
							>
								−
							</Button>
							<Button
								size="icon"
								variant="outline"
								data-testid={`effectif-plus-${r.cle}`}
								aria-label={`${t("effectif.recruter")} ${r.nom}`}
								title={plein ? t("effectif.plein") : t("effectif.recruter")}
								disabled={bloque || enVol || plein}
								onClick={() => changer("recruter", r.cle)}
							>
								+
							</Button>
						</li>
					)
				})}
			</ul>
		</div>
	)
}

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useSalleState } from "@/api/state/hooks"
import EffectifPanel from "@/salle/component/EffectifPanel"
import EtageEstimation from "@/salle/component/EtageEstimation"
import { useSalleUi } from "@/shared/lib/store/salle"
import Button from "@/shared/ui/button"
import Modal from "@/shared/ui/modal"
import Text from "@/shared/ui/text"

type BarreEtageProps = { slug: string }

export const BarreEtage = ({ slug }: BarreEtageProps) => {
	const { t } = useTranslation("salle")
	const [ouvert, setOuvert] = useState(false)
	const basculerTerminal = useSalleUi((s) => s.basculerTerminal)
	const { data } = useSalleState(slug, (s) => ({
		e: s.immeuble.etages.find((x) => x.slug === slug),
		projet: s.projet,
	}))
	const effectif = data?.e?.effectif
	return (
		<div
			data-testid="barre-etage"
			className="flex min-w-0 flex-wrap items-center gap-2"
		>
			{data?.e && (
				<Text variant="h2">
					{t("etage.titre", { n: data.e.num, titre: data.e.titre })}
				</Text>
			)}
			{data?.e?.branche && (
				<Text variant="caption">
					{t("floors.branche", { b: data.e.branche })}
				</Text>
			)}
			<EtageEstimation estimation={data?.projet?.estimation} />
			{effectif && (
				<>
					<Button
						size="sm"
						variant="outline"
						data-testid="effectif-ouvrir"
						title={t("effectif.ouvrir")}
						onClick={() => setOuvert(true)}
					>
						{t("effectif.bouton", {
							n: effectif.total,
							max: effectif.plafond_etage,
						})}
					</Button>
					<Modal
						open={ouvert}
						onClose={() => setOuvert(false)}
						title={t("effectif.titre")}
					>
						<EffectifPanel />
					</Modal>
				</>
			)}
			<Button size="sm" variant="outline" onClick={basculerTerminal}>
				{t("terminalTitre")}
			</Button>
		</div>
	)
}

export default BarreEtage

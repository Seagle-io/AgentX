import { useTranslation } from "react-i18next"
import { useSalleState } from "@/api/state/hooks"
import { useVoixAction } from "@/api/voix/hooks"
import { selectFloor, useSalleUi } from "@/shared/lib/store/salle"
import Button from "@/shared/ui/button"
import Text from "@/shared/ui/text"

// Mode vocal, taire, micro : visibles sur toutes les pages, absents si l'état voix est null
export default function VoixControles() {
	const { t } = useTranslation("salle")
	const slug = useSalleUi(selectFloor)
	const { data: voix } = useSalleState(slug, (s) => s.voix)
	const { mutate, isPending, error } = useVoixAction(slug)
	if (!voix) return null
	return (
		// biome-ignore lint/a11y/useSemanticElements: div exigé par le contrat (fieldset impose bordure et styles natifs)
		<div
			className="ml-auto flex items-center gap-1"
			data-testid="voix-controles"
			role="group"
			aria-label={t("voix.controles")}
		>
			<Button
				variant="ghost"
				size="sm"
				data-testid="voix-mode"
				aria-label={t("voix.mode")}
				aria-pressed={voix.mode}
				disabled={!voix.parle || isPending}
				title={
					!voix.parle
						? t("voix.sansParle")
						: voix.mode
							? t("voix.modeOn")
							: t("voix.modeOff")
				}
				onClick={() => mutate({ action: "mode", on: !voix.mode })}
			>
				{voix.mode ? "🔊" : "🔇"}
			</Button>
			<Button
				variant="ghost"
				size="sm"
				data-testid="voix-stop"
				aria-label={t("voix.stop")}
				disabled={!voix.parle || isPending}
				title={!voix.parle ? t("voix.sansParle") : t("voix.stop")}
				onClick={() => mutate({ action: "stop" })}
			>
				■
			</Button>
			<Button
				variant="ghost"
				size="sm"
				data-testid="voix-micro"
				aria-label={t("voix.micro")}
				aria-pressed={voix.ecoute}
				disabled={!voix.dictee || isPending}
				title={
					!voix.dictee
						? t("voix.sansDictee")
						: voix.ecoute
							? t("voix.microOn")
							: t("voix.microOff")
				}
				onClick={() => mutate({ action: "micro", on: !voix.ecoute })}
			>
				🎙️
			</Button>
			{error && (
				<Text variant="mono" className="text-error">
					{error.message}
				</Text>
			)}
		</div>
	)
}

import { useTranslation } from "react-i18next"
import { useSalleState } from "@/api/state/hooks"
import { useEffacerVoix, useMicroVoix, useModeVoix } from "@/api/voix/hooks"
import { selectFloor, useSalleUi } from "@/shared/lib/store/salle"
import Badge from "@/shared/ui/badge"
import Button from "@/shared/ui/button"
import Panel from "@/shared/ui/panel"
import Text from "@/shared/ui/text"

// Ce que le chef a dit en <voix>, du plus récent au plus ancien ; Effacer vide le journal
export default function VoixPanel() {
	const { t } = useTranslation("salle")
	const slug = useSalleUi(selectFloor)
	const { data: voix } = useSalleState(slug, (s) => s.voix)
	const effacer = useEffacerVoix(slug)
	const son = useModeVoix(slug)
	const micro = useMicroVoix(slug)
	if (!voix) return null
	const n = voix.journal.length
	const d = new Date()
	const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
	return (
		<Panel variant="subtle" data-testid="voix-panel">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<Text variant="h3">
					{t("voix.title")}{" "}
					<Badge variant="neutral" size="sm">
						{n}
					</Badge>
				</Text>
				<div className="flex flex-nowrap gap-2 whitespace-nowrap">
					<Button
						size="sm"
						className="h-7"
						variant={voix.mode ? "outline" : "secondary"}
						data-testid="voix-son"
						aria-pressed={!voix.mode}
						onClick={() => son.mutate(!voix.mode)}
						disabled={son.isPending}
					>
						{voix.mode ? t("voix.sonActif") : t("voix.sonCoupe")}
					</Button>
					<Button
						size="sm"
						className="h-7"
						variant={voix.ecoute ? "secondary" : "outline"}
						data-testid="voix-micro"
						aria-pressed={voix.ecoute}
						title={voix.dictee ? undefined : t("voix.dicteeAbsente")}
						onClick={() => micro.mutate(!voix.ecoute)}
						disabled={!voix.dictee || micro.isPending}
					>
						{voix.ecoute ? t("voix.microActif") : t("voix.microCoupe")}
					</Button>
					<Button
						size="sm"
						className="h-7"
						variant="outline"
						onClick={() => effacer.mutate()}
						disabled={n === 0 || effacer.isPending}
					>
						{t("voix.clear")}
					</Button>
				</div>
			</div>
			{n === 0 ? (
				<Text variant="muted">{t("voix.empty")}</Text>
			) : (
				<ol
					aria-label={t("voix.listLabel")}
					className="mt-2 flex max-h-[40vh] flex-col gap-3 overflow-y-auto text-sm"
				>
					{voix.journal
						.map((m) => (
							<li
								key={`${m.t}:${m.texte}`}
								className="flex items-baseline gap-3"
							>
								<Text
									variant="caption"
									as="span"
									className={
										m.t.slice(0, 10) !== today
											? "w-[5.25rem] shrink-0 whitespace-nowrap tabular-nums"
											: "shrink-0 whitespace-nowrap tabular-nums"
									}
								>
									{m.t.slice(0, 10) === today
										? ""
										: `${m.t.slice(8, 10)}/${m.t.slice(5, 7)} `}
									{m.t.slice(11, 16)}
								</Text>
								<span className="line-clamp-3 break-words">{m.texte}</span>
							</li>
						))
						.reverse()}
				</ol>
			)}
		</Panel>
	)
}

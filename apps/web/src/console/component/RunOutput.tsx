import { useTranslation } from "react-i18next"
import { useLastRun } from "@/api/state/hooks"
import Badge from "@/shared/ui/badge"
import Text from "@/shared/ui/text"

// dernière commande, partagée todo ↔ console via le cache de mutations (0 store)
const RunOutput = () => {
	const { t } = useTranslation("console")
	const last = useLastRun()
	if (last === null) return <Text variant="muted">{t("noRun")}</Text>
	const { body, result, error, pending } = last
	return (
		<div className="flex flex-col gap-1">
			<Text variant="mono">$ {result?.commande ?? body.action}</Text>
			{pending && <Text variant="muted">{t("running")}</Text>}
			{result && (
				<>
					{result.out && (
						<pre className="font-mono text-xs whitespace-pre-wrap">
							{result.out}
						</pre>
					)}
					{result.err && (
						<pre className="font-mono text-xs whitespace-pre-wrap text-error">
							{result.err}
						</pre>
					)}
					<Text variant="caption">{t("code", { code: result.code })}</Text>
				</>
			)}
			{error && (
				<div className="flex items-center gap-2">
					<Badge variant="error">{error.kind}</Badge>
					<Text variant="caption">{t(`error.${error.kind}`)}</Text>
				</div>
			)}
		</div>
	)
}

export default RunOutput

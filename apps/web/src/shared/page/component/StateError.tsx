import { useTranslation } from "react-i18next"
import type { ApiError } from "@/api/state/crud"
import Button from "@/shared/ui/button"
import Panel from "@/shared/ui/panel"
import Text from "@/shared/ui/text"

type Props = { error: ApiError; onRetry(): void }

// État d'erreur API : libellé par kind, message brut, bouton réessayer
export default function StateError({ error, onRetry }: Props) {
	const { t } = useTranslation()
	return (
		<Panel variant="alert">
			<Text variant="h3">{t(`global:error.${error.kind}`)}</Text>
			{error.message !== "" && <Text variant="muted">{error.message}</Text>}
			<Button variant="secondary" size="sm" onClick={onRetry}>
				{t("global:retry")}
			</Button>
		</Panel>
	)
}

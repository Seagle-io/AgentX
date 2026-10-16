import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import fr from "@/shared/lib/i18n/local/fr"
export const defaultNS = "global"
const resources = { fr: fr }
void i18n.use(initReactI18next).init({
	resources,
	fallbackLng: "fr",
	lng: "fr",
	defaultNS,
	interpolation: { escapeValue: false },
})
export default i18n

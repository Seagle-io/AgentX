---
tache: T022
statut: fait
verdict: DÉFAUTS
tags: [orthopro, verification, widgets]
---
## Vérifié comment
- `npm run test:unit` → `tests 316 · pass 316 · fail 0` (sonde incluse)
- `npm run typecheck; echo $?` → `TC_EXIT=0`
- `npx eslint` 11 fichiers WL → `ESLINT_EXIT=0`, 0 ligne
- sonde `node --test widget-state.probe.test.ts` → `PROBE n=42 ok=42 · pass 1 fail 0` (4×2 + 16×2 + `[]`×2 ; chaque combo aussi inversée + `Object.freeze` ; `empty` jamais sans tout `isSuccess` ; `{isError,isSuccess}` → error ; `{isLoading,isSuccess}` → ready)
- `rm` sonde ; `git status --short widget/ | grep probe` → ∅ ; 13 entrées = état initial (11 M, 2 ??)
- `rg -n "QueryLike|widgetState" widget --glob '!widget-state*'` → 7 imports `from '../widget-state'` + 7 appels ; 0 définition locale
- `rg -n "<Text" <7>` → `onboarding-widget.tsx:62-63` seulement — état « tout fait », hors L/E/V, toléré
- `rg -n enabled <7>` → `tomorrow-widget.tsx:42` seul
- onboarding : `onboarding.util.ts:43-44` filtre `done === true` ; test `onboarding.util.test.ts:21-25` (null → `{done:0,total:6}`) ; `—` rendu `onboarding-widget.tsx:74`
## Tableau widgets
| widget | requêtes→widgetState | refetch | empty gardé | enabled:false |
|---|---|---|---|---|
| quick-reply | practitioners, patients L28 — **thread ∅** | L29 (2/2) | L47 | n/a — thread `enabled:!!id` hors état |
| kora-news | topics L27 | L41 | L44 | n/a |
| onboarding | cabinet, google, exercises L35 | L36 (3/3) | n/a — isEmpty=false | n/a |
| free-slots | settings, availability, appointments L46/L55 | L47 (3/3) | L66 | n/a |
| week-grid | settings, availability, appointments L37/L53 | L38 (3/3) | n/a — voulu L52 | n/a |
| tomorrow | settings (+appointments si activée) L47/L54 | L48 (= queries) | L72 | exclue L47 OK |
| useful-links | links L38 | L50 | L53 | n/a |
## Défauts
1. `quick-reply/quick-reply-widget.tsx:27-28,50-53` — `thread` (useInfiniteQuery messages) rendu mais absent de `widgetState` ; seul `thread.isLoading` lu, `isError` jamais
   - scénario : conversations 200, `getMessages` 500 → state `ready` → `MessageThread loading=false messages=[]` → `message-thread.tsx:194` affiche « Aucun message pour l'instant. » : faux vide, 0 erreur, 0 Réessayer
   - repro : DevTools bloquer `GET /messaging/conversations/<id>/messages*` → recharger dashboard
   - contrainte : thread `enabled:!!conversationId` (`use-conversation-messages.ts:31`) → l'ajouter seulement si `conversation` (I1, motif tomorrow L47)
## Écarts
- lecture hors WL: `src/modules/messaging/hooks/use-conversation-messages.ts` — forme/`enabled` de `thread` (défaut 1)
- lecture hors WL: `onboarding/onboarding.util.test.ts` (rg) — DoD exige « citer test + ligne »
- lecture hors WL: `src/modules/messaging/components/message-thread.tsx` (rg) — rendu thread en erreur
## Pour la suite
- tomorrow L47 : `settingsQuery` passé même si `nextWorkingDay=false` (inutile au rendu) → settings 500 masque des RDV chargés ; sur-inclusion, NV en UI
- TanStack v5 : refetch d'arrière-plan en échec → `isError` + `isSuccess=false` avec data → données remplacées par l'erreur ; quick-reply : `invalidateQueries(['messaging','conversations'])` L71 après envoi, un échec démonte le composer — NV
- useful-links : erreur `dashboard-links` masque aussi `DEFAULT_LINKS` statiques (L37, L54) — choix produit à trancher
- refetch depuis `error` : statut reste `error` pendant le fetch → 0 retour visuel au clic Réessayer (7 widgets)
## Retour sur le pack
- Manquait: `onboarding.util.test.ts` (DoD l'exige) ; signature `useConversationMessages` (requête de rendu de quick-reply) ; « 8 + 64 cas » faux : 2 requêtes × 4 états × 2 isEmpty = 32
- Inutile: `widget-card.tsx` en entier — la signature `WidgetNote` collée suffisait

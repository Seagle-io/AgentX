---
tache: T002
statut: fait
---
## Livré
- widget/ — 42 dossiers + types.ts + widget-card.tsx inventoriés
- types.ts:1-98 — contrat = pack + `WidgetCard` props, voir ci-dessous
- widget-card.tsx:20-63 — WidgetCard / WidgetFooterLink / WidgetNote (états)
- 16 dossiers sans `*.test.ts` ; 10 dossiers hors WidgetCard ; 3 dupes date/heure

Contrat verbatim (reste de types.ts, absent du pack) :
```
export type WidgetContext = { …; hasModule: (key: string) => boolean; onCustomize: () => void }
export type WidgetConfig = Record<string, unknown>
export type WidgetInstance = { config: WidgetConfig; setConfig: (patch: WidgetConfig) => void }
export type DashboardWidget = { id: string; label: string; description: string; icon: IconType; emoji?: string;
  category?: WidgetCategory; grid: WidgetGrid; requires?: string; optional?: boolean;
  render: (ctx, instance) => ReactNode; settings?: (ctx, instance) => ReactNode }
// WidgetNote({ tone?: 'muted'|'error', children })  — états vide/chargement/erreur
```

## Inventaire
Légende : données = ctx (ctx.data/props) | Q(api) useQuery propre | loc (local/statique). L/E/V : O = géré, N = absent, - = sans objet, ~ = NV (heuristique rg). test = fichier(s) ; settings = fichier/∅.
dossier | fichiers | données | L | E | V | test | settings
---|---|---|---|---|---|---|---
achievements | 4 | Q(forum-achievements) | O | O | O | util | ∅
activity | 8 | ctx.days + Q(agenda.listAppointments) année | O* | O* | ~ | axis, heatmap | ∅ (*année seule)
admin-time | 5 | Q(agenda) | O | O | O | util | settings.tsx
age-calculator | 4 | loc | - | - | O | util | ∅
birthdays | 4 | Q(patients.listPatients) | O | O | O | util | ∅
calculator | 4 | loc | - | - | - | util | ∅
clock | 2 | loc + useReminders(shared) | - | toast | - | NON | ∅
contact-code | 2 | loc (code + QR) | - | O(qr) | O | NON | ∅
daily-anecdote | 4 | Q(dashboard-daily) | O | O | N | NON (config sans test) | settings.tsx
daily-game | 3 | loc (catalog) | - | - | - | catalog | ∅
daily-quote | 3 | Q(dashboard-daily) | O | O | N | NON | ∅
feedback | 3 | mutation feedback | - | O | - | util | ∅
forecast | 2 | ctx.data.billingForecast | - | - | O | NON | ∅
forum | 2 | ctx.data.latestAnnouncement/trendingTopics | - | - | O | NON | ∅
forum-notifications | 4 | Q(forum-notifications) ×2 + 2 mutations | O | O | O | util | ∅
free-slots | 4 | Q(agenda) ×3 | O | O* | O | util | ∅ (*settings/availability sans E)
greeting | 4 | ctx.todaySlots + firstName | - | - | O | util | ∅
kora-news | 4 | ctx.data.latestAnnouncement + Q(forum.listTopics) | N | O | O | util | ∅
kpi | 2 | ctx.data | - | - | - | NON | ∅
licence | 4 | Q(licences) + Q(billing) | O | O | O | util | ∅
mascot | 2 | loc | - | - | - | NON | ∅
month-calendar | 4 | loc (hasModule) | - | - | - | util | ∅
next-appointment | 4 | Q(agenda) | O | O | O | util | ∅
onboarding | 4 | ctx.data + Q(cabinet, google-calendar, exercises) | N | N | O | util | ∅
patient-search | 4 | Q(patients) | O | O | O | util | ∅
pomodoro | 4 | loc (localStorage, AudioContext) | - | - | - | NON | settings.tsx
quick-reply | 2 | Q(messaging) ×3 + mutations | O | N | O | NON | ∅
recent-documents | 4 | Q(patient-documents) | O | O | O | util | ∅
revenue | 6 | Q(invoices) + ctx.displayEuros | O | O | N~ | util | settings.tsx
shortcuts | 5 | loc (catalog) + hasModule/navigate | - | - | O | NON | settings.tsx
storage | 2 | Q(licences) | O | O | O | NON | ∅
today | 4 | Q(agenda) + 2 mutations | O | O | O | rail.util seul | ∅
tomorrow | 5 | Q(agenda) ×3 | O | O* | O | util | settings.tsx
tongue-twister | 5 | Q(dashboard-tongue-twister) | O | O | N | NON | settings.tsx
transmissions | 4 | Q(invoices) | O | O | N~ | util | ∅
unpaid-invoices | 4 | Q(invoices) + ctx.displayEuros | O | O | O | util | ∅
unread-messages | 4 | Q(messaging) ×2 | O | O | O | util | ∅
useful-links | 5 | Q(dashboard-layout.listDashboardLinks) + catalog | N (défaut []) | N | O~ | NON | settings.tsx
weather | 3 | Q(dashboard.getDashboardWeather) | O | O | O (sans adresse) | codes | ∅
week-grid | 4 | Q(agenda) ×3 | O | O* | O | util | ∅
word-of-day | 2 | Q(dashboard-daily) | O | O | N | NON | ∅
worklists | 2 | ctx.data (hasModule) | - | - | O (9 branches) | NON | ∅

## Top 10
- quick-reply — erreur de chargement affichée « Aucune conversation à reprendre » — H — quick-reply/quick-reply-widget.tsx:22-38
- onboarding — 3 queries sans loading/erreur ; étapes `null` indistinctes — M — onboarding/onboarding-widget.tsx:27-29
- kora-news — pas de loading ; « Aucune annonce » pendant chargement — M — kora-news/kora-news-widget.tsx:18-35
- clock — 261 l., 0 test, rappels + erreurs en `.catch(()=>{})` silencieux — H — clock/clock-widget.tsx:177-193
- today — plus gros widget (266 l.), mutations, aucun test du widget — M — today/today-widget.tsx:59-75
- free-slots/week-grid/tomorrow — queries settings/availability sans état erreur — M — free-slots/free-slots-widget.tsx:37-38
- activity — query année séparée, shell propre, 2 dossiers-fichiers non WidgetCard — M — activity/activity-year.tsx:32
- worklists — 149 l., 0 test, 9 branches vides, shell propre — M — worklists/dashboard-worklists.tsx:52
- useful-links — 0 test, query sans loading/erreur, config/catalog non testés — M — useful-links/useful-links.tsx:31
- 10 dossiers hors WidgetCard (shell copié) : weather, clock, activity, today, forecast, forum, greeting, kpi, mascot, worklists — M — weather/weather-widget.tsx:77 ; forecast/previsionnel-card.tsx:21 ; mascot/mascot.tsx:28
- (B) `key={i}` : month-calendar/month-calendar.tsx:52 ; word-of-day/word-of-day-widget.tsx:31 ; daily-anecdote/daily-anecdote-widget.tsx:31

## Non couvert
Exports du `*.util.ts` absents de leur `*.test.ts` (fonctions) :
- activity/heatmap.util.ts:heatmapStart
- age-calculator/age.util.ts:formatDays
- free-slots/free-slots.util.ts:workRanges
- month-calendar/calendar.util.ts:localIso
- revenue/revenue.util.ts:dateKey
- week-grid/week-grid.util.ts:fills
Constantes non citées dans le test : admin-time.util.ts:MIN_MINUTES_PER_SESSION, MAX_MINUTES_PER_SESSION ; recent-documents.util.ts:RECENT_DOCUMENTS_MAX ; revenue.util.ts:REVENUE_PERIODS
Fichiers util/config/catalog sans fichier test : daily-anecdote.config.ts, pomodoro.config.ts, revenue.config.ts, shortcuts.catalog.ts, shortcuts.config.ts, tongue-twister.config.ts, useful-links.catalog.ts, useful-links.config.ts
Dossiers sans aucun test (16) : clock contact-code daily-anecdote daily-quote forecast forum kpi mascot pomodoro quick-reply shortcuts storage tongue-twister useful-links word-of-day worklists

## Duplication
- date courte `fr-FR {day,month:'short'}` ×4 — worklists/dashboard-worklists.tsx:73, unpaid-invoices/unpaid-invoices-widget.tsx:15, recent-documents/recent-documents-widget.tsx:13, forum/dashboard-forum.tsx:15
- heure `hh:mm` ×5 redéfinie — today/today-widget.tsx:23, tomorrow/tomorrow-widget.tsx:18, next-appointment/next-appointment-widget.tsx:18, free-slots/free-slots-widget.tsx:21, greeting/dashboard-greeting.util.ts:21 (+ variante `XhMM` next-appointment.util.ts:28)
- date longue `{weekday:'long',day,month:'long'}` ×5 — clock/clock-widget.tsx:221, today/today-widget.tsx:118, greeting/dashboard-greeting.tsx:11, tomorrow/tomorrow.util.ts:22, month-calendar/month-calendar.tsx:61
- `.replace(/^./, c => c.toUpperCase())` — next-appointment/next-appointment.util.ts:46, tomorrow/tomorrow.util.ts:22
- query `['invoices']` listInvoices ×3 — revenue/revenue-widget.tsx:35, transmissions/transmissions-widget.tsx:33, unpaid-invoices/unpaid-invoices-widget.tsx:25 (cache partagé OK)
- queries `['agenda-settings']`+`['agenda-availability']` ×3 — free-slots/free-slots-widget.tsx:37-38, week-grid/week-grid-widget.tsx:27-28, tomorrow/tomorrow-widget.tsx:30
- query `['patients']` ×2 — birthdays/birthdays-widget.tsx:37, patient-search/patient-search-widget.tsx:19
- `['messaging','conversations',…]` ×2 — quick-reply/quick-reply-widget.tsx:22-23, unread-messages/unread-messages-widget.tsx:24-25
- pluriel `s` inline `${n > 1 ? 's' : ''}` — kpi/index.tsx, unpaid-invoices-widget.tsx:46, revenue-widget.tsx:73, activity-year.tsx:19
- euros : un seul formateur `ctx.displayEuros` (revenue, unpaid, kpi, forecast) ; ∅ `Intl.NumberFormat` dans widget/ — pas de dupe
- 2 façons d'état : `WidgetNote` (27 dossiers) vs `Spinner` + `<Text>` ad hoc (today, weather, activity-year, storage, quick-reply)

## Vérifié comment
- `ls widget/ | wc -l` → 44 (42 dossiers + types.ts + widget-card.tsx)
- sans test : boucle `ls $d | rg -q '\.test\.ts$'` → 16 dossiers listés ci-dessus
- `rg -n "useQuery\(|fetch\(|api/" --glob '!*.test.ts' widget/` → 0 `fetch(` ; tous fetch via `useQuery` + `@/api/*` (coordonnées tableau ; détail lignes : revenue-widget.tsx:35, transmissions-widget.tsx:33, unpaid-invoices-widget.tsx:25, today-widget.tsx:59/79, weather-widget.tsx:69, activity-year.tsx:32, onboarding-widget.tsx:27-29, licence-widget.tsx:22-23, free-slots-widget.tsx:37-39, tomorrow-widget.tsx:30-34, week-grid-widget.tsx:27-29, forum-notifications-widget.tsx:21-22, unread-messages-widget.tsx:24-25, quick-reply-widget.tsx:22-23, kora-news-widget.tsx:18, recent-documents-widget.tsx:25, admin-time-widget.tsx:24, achievements-widget.tsx:17, birthdays-widget.tsx:37, patient-search-widget.tsx:19, storage-widget.tsx:18, next-appointment-widget.tsx:32, tongue-twister-widget.tsx:29, daily-anecdote-widget.tsx:17, daily-quote-widget.tsx:12, word-of-day-widget.tsx:13, useful-links.tsx:31)
- util non couverts : boucle `rg -o "export (function|const) \w+"` vs `rg -q "\b$f\b" test` → liste « Non couvert » (heuristique : nom absent du test, ≠ preuve de non-couverture)
- colonnes L/E/V : `rg -c -i "loading|error|empty…"` → heuristique ; cellules `~` NV, lecture intégrale seulement des widgets WL
- `node --test 'src/modules/dashboard/components/widget/**/*.test.ts'` (v22.22.1) → `# tests 27 # pass 0 # fail 27` ERR_UNKNOWN_FILE_EXTENSION ".ts" — NV : runner KO en env, tests non exécutés
- non lus intégralement : 30 dossiers hors WL (scan rg seul)

## Écarts
- lecture hors WL: ∅ (scan rg autorisé uniquement)
- WL non ouverts un par un : clock-widget, dashboard-forum, activity-widget, revenue-widget — scan rg ; états déduits, NV
- colonnes L/E/V de 30 dossiers hors WL : heuristique rg, NV
- DoD 2 : sortie brute remplacée par la liste (boucle)
- `node --test` KO : NV exécution

## Pour la suite
- Widgets sans test (16) : clock contact-code daily-anecdote daily-quote forecast forum kpi mascot pomodoro quick-reply shortcuts storage tongue-twister useful-links word-of-day worklists ; tests = `node:test`, `*.util.test.ts` à côté de `*.util.ts` ; extraire la logique du `.tsx` vers un util avant de tester.
- Priorité qualité états : quick-reply (erreur masquée en vide) > onboarding > kora-news (loading) > free-slots/week-grid/tomorrow (queries settings sans erreur) ; utiliser `WidgetNote` de `widget-card.tsx`, pas de `<Text>` ad hoc.
- 10 dossiers hors `WidgetCard` (weather clock activity today forecast forum greeting kpi mascot worklists) : shell copié ; migrer = whitelist ≤ 12, 1 tâche par 3-4 dossiers.
- Factoriser formatage hors widgets : date courte ×4, hh:mm ×5, date longue ×5 (coordonnées § Duplication) → un module `widget/format.ts` (nouveau fichier) + tests.
- Piège : `node --test` échoue en env (ERR_UNKNOWN_FILE_EXTENSION, node 22.22.1) ; l'implémenteur doit vérifier le runner (`npm run test:unit`) avant de promettre des tests.
## Retour sur le pack
- Manquait: commande de test fonctionnelle (flag TS) ; liste des écrans/pages qui consomment `widget/` ; critère « état » défini (WidgetNote vs Spinner)
- Inutile: dashboard-forum, clock-widget en WL, non nécessaires à l'inventaire

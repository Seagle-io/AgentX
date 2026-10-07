---
tache: T026
statut: fait
---
## Livré
W = /home/jdrac/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget
- W/daily-anecdote/daily-anecdote.util.ts:1-15 — `shownAnecdotes(data, mode)` : one/all, pick hors liste → []
- W/daily-anecdote/daily-anecdote.util.test.ts:1-46 — 6 tests (shownAnecdotes ×5, anecdoteMode ×1/4 asserts)
- W/daily-anecdote/daily-anecdote-widget.tsx:7,18 — import util ; L18 → `shownAnecdotes(data, mode)`
- W/contact-code/contact-code.util.ts:1-15 — `QR_OPTIONS`, `qrAlt(code)`, `copyToast(copied)`
- W/contact-code/contact-code.util.test.ts:1-30 — 4 tests
- W/contact-code/contact-code-widget.tsx:10,28,37-38,46 — consomme util, JSX identique
- W/word-of-day/word-of-day-widget.tsx:30-31 — `key={i}` → `key={d.text}`
- W/useful-links/useful-links.catalog.test.ts:1-34 — 4 tests (ids uniques, https, résolution hiddenDefaults → DEFAULT_LINKS)
- daily-quote : 0 logique — daily-quote-widget.tsx:12 useQuery, L18-23 rendu pur `data.text`/`data.author` ; daily-credit.tsx:8-17 rendu pur `source.*`. util ∅, test ∅
- word-of-day : 0 logique — word-of-day-widget.tsx:13 useQuery, L19-38 rendu pur `data.*`. util ∅, test ∅
- daily-anecdote « sélection du jour / bascule à minuit » : inexistante côté client — `pick` vient du serveur (src/api/dashboard-daily.ts:30-36 `DailyAnecdotes.pick`). Testé : déterminisme même pick.
## Vérifié comment
rg -n "from '.*\.tsx'|dashboard-widgets|from 'react'" daily-anecdote.util.ts contact-code.util.ts → ∅ (exit 1)
node --test <3 tests WL> → ℹ tests 14 / pass 14 / fail 0
npm run test:unit → ℹ tests 354 / pass 353 / fail 1 (pomodoro.util.test.ts, hors WL, voir Écarts)
npm run typecheck → exit 0, 0 erreur
npx eslint <8 fichiers WL touchés> → exit 0, 0 hit
## Écarts
- lecture hors WL: W/useful-links/useful-links.config.ts — DoD « résolution config » exige `hiddenDefaults`
- lecture hors WL: src/api/dashboard-daily.ts:28-36 — type `DailyAnecdotes` requis par le test (champ `day`)
- lecture hors WL: W/achievements/achievements.util.test.ts:1-20 — imiter style tests voisins
- test:unit fail 1 HORS WL : pomodoro.util.test.ts → `ERR_MODULE_NOT_FOUND pomodoro.config` depuis pomodoro.util.ts (import sans `.ts`). Préexistant/concurrent, non corrigé.
- DoD 1 « bascule à minuit » non testable : aucune logique Date côté client (pick serveur)
## Pour la suite
- pomodoro.util.ts import `./pomodoro.config` sans suffixe `.ts` → casse `npm run test:unit` (fail 1) ; tâche pomodoro à corriger
- word-of-day `key={d.text}` : définitions dupliquées (même texte) → warning React ; alternative `key={`${i}-${d.text}`}` si observé
- DoD « bascule à minuit » daily-anecdote : logique serveur, pas client — pack basé sur hypothèse fausse
## Retour sur le pack
- Manquait: type `DailyAnecdotes` (champ `day`) ; `useful-links.config.ts` en WL (L) ; précision « pick serveur, pas de Date client »
- Inutile: contrat `now: Date` (aucune fonction horaire dans ce lot)

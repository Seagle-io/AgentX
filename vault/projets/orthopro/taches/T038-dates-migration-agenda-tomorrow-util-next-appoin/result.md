---
tache: T038
statut: fait
---
## Livré
- tomorrow/tomorrow.util.ts:4-6,23 — import relatif ; `capitalize(longDate(day))`
- tomorrow/tomorrow.util.test.ts:25-27 — +1 cas date fixe « Mercredi 7 octobre »
- next-appointment/next-appointment-widget.tsx:10,54 — `timeLabel` supprimé → `hhmm`
- next-appointment/next-appointment.util.ts:4-6,47 — `capitalize` lib ; XhMM L29 et {day,month:long} L48 conservés
- next-appointment/next-appointment.util.test.ts:42-44 — +1 cas « Jeudi à 15h30 »
- greeting/dashboard-greeting.tsx:6,38 — `todayLong` supprimé → `longDate(now)`
- greeting/dashboard-greeting.util.ts:4-6 — `hhmm` local supprimé → lib
- greeting/dashboard-greeting.util.test.ts:27-29 — +1 cas « 09:05 »
- month-calendar/month-calendar.tsx:6,8,53,62 — `longDate` ; WEEKDAYS noms complets, `key={d}`, rendu `d[0].toUpperCase()`

## Vérifié comment
```
rg -n "toLocaleDateString|toLocaleTimeString|padStart\(2" <6 fichiers>
next-appointment.util.ts:29 time XhMM (conservé)
next-appointment.util.ts:44 Dans X h MM (conservé, hors contrat)
next-appointment.util.ts:47 toLocaleDateString weekday:long (conservé, hors contrat)
next-appointment.util.ts:48 {day,month:long} (conservé)
month-calendar.tsx:19 title {month:long,year:numeric} (hors contrat, préexistant)
npm run test:unit → tests 398 pass 398 fail 0
npm run typecheck → tsc ×3 sortie vide, exit 0
npx eslint <9 fichiers WL> → sortie vide, exit 0
```

## Écarts
- lecture hors WL : ∅
- DoD 5 : 3 hits de plus que prévu, tous préexistants et hors contrat (L44 minutes, L47 weekday seul, month-calendar L19 titre mois) — non remplaçables par la lib
- DoD 4 `key` : en-tête statique sans date ISO → clé = nom du jour (unique), pas l'index
- greeting.tsx : date du jour prise sur `now` (useMinute) au lieu de `new Date()` — même valeur, bascule à minuit sans reload

## Pour la suite
- month-calendar.tsx:19 titre `{month:long, year:numeric}` → candidat `monthYear` lib si T014 l'ajoute
- next-appointment.util.ts:47 `{weekday:long}` seul → candidat `weekday` lib
- git status : 20+ fichiers modifiés hors WL (T039/T040 en cours) — non touchés

## Retour sur le pack
- Manquait : liste exhaustive des hits attendus au rg (L44, L47 weekday, month-calendar L19 absents)
- Inutile : ∅

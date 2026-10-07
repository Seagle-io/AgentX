---
tache: T014
statut: fait
verdict: OK
---
## Vérifié comment
- `npm run test:unit` → `ℹ tests 334 · ℹ pass 334 · ℹ fail 0`
- `npx eslint src/shared/lib/format/` → ∅ sortie, exit=0
- `rg -n "^import" src/shared/lib/format/date.ts` → ∅, exit=1
- `TZ=X node --test date.test.ts` X∈{UTC,America/New_York,Pacific/Auckland} → `pass 14 fail 0` ×3
- sonde `date.probe.test.ts` 24 dates (31/12→1/1, DST 29/03 01:59/02:30/03:00, DST 25/10 01:59/02:30/03:00 + 00:30Z/01:30Z, 1er de chaque mois, 29/02/2024, 00:00, 23:59) : shortDate/longDate ≡ toLocaleDateString, hhmm ≡ padStart et ≡ toLocaleTimeString 2-digit, ISO ≡ Date
- `TZ=X node --test date.probe.test.ts` X∈{local Paris,Europe/Paris,UTC,America/New_York,Pacific/Auckland} → `pass 4 fail 0` ×5
- hhmm(0/59/60/1439) → `00:00 00:59 01:00 23:59`
- capitalize('')→`''` · capitalize('éa')→`Éa` · plural(0|1|2,'séance')→`séance séance séances` · plural(2,'cheval','chevaux')→`chevaux`
- piège UTC `'2026-10-05'` : Paris → `5 oct.` / `lundi 5 octobre` / hhmm `02:00` ; New_York → `4 oct.` / `dimanche 4 octobre` / `20:00` ; `'2026-10-05T00:30'` (sans Z) → local, `5 oct.` `00:30` partout
- `git status --short src/shared/lib/format` (sonde supprimée) → `?? src/shared/lib/format/` ; ls → `date.test.ts date.ts`
## Défauts
- ∅
## Écarts
- ∅ lecture hors WL ; `rg` widget = commande prescrite par DoD (sorties lues, fichiers non ouverts)
- note : `TZ=` vide ≠ local → Node = UTC ; runs Paris refaits avec `TZ=Europe/Paris`
## Pour la suite
- divergences appelants (info vague 3) : `day:'2-digit'` → `05 oct.` ≠ shortDate `5 oct.` à worklists/dashboard-worklists.tsx:73, recent-documents/recent-documents-widget.tsx:13, unpaid-invoices/unpaid-invoices-widget.tsx:15 ; forum/dashboard-forum.tsx:15 ≡ shortDate
- next-appointment.util.ts:28 `time` = `9h05` (H non paddé, `h`) ≠ hhmm ; L46 weekday seul + capitalize inline ; L47 `{day:'numeric',month:'long'}` ≠ short/long → besoin d'un format absent du contrat
- ≡ hhmm : today-widget.tsx:23, tomorrow-widget.tsx:20, next-appointment-widget.tsx:18, greeting.util.ts:22, free-slots-widget.tsx:22 ; ≡ longDate : today-widget.tsx:118, clock.util.ts:32, greeting.tsx:11, month-calendar.tsx:61, tomorrow.util.ts:22 (+capitalize)
- hors domaine non gardé (0 appelant aujourd'hui) : hhmm(-1)→`-1:-1`, hhmm(1440)→`24:00`, hhmm(9.5)→`00:9.5`, hhmm(NaN)/date invalide→`NaN:NaN`, shortDate('xx')→`Invalid Date` ; plural(1.5)→pluriel, plural(-2)→singulier
- migration d'un appelant à chaîne `AAAA-MM-JJ` sans heure : passer `${iso}T12:00:00`, sinon veille en TZ<0
## Retour sur le pack
- Manquait: `TZ=` vide = UTC sous Node (préciser `TZ=Europe/Paris`) ; « 4 formats » non listés explicitement
- Inutile: ∅

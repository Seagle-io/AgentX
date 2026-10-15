---
tache: T003
statut: fait
---
## Livré
Légende : larg.min = plus petite largeur (160/240/320/480) sans scroll-x ni troncature hors en-tête (titres ellipsis exclus) ; H = hauteur naturelle px (en-tête ~53-57 + corps) ; Δ = H@240 − T002 ; état = rendu sur compte démo.
widget | larg.min | H@240 | H@320 | H@480 | Δ T002 | état
---|---|---|---|---|---|---
achievements | 240 | 195 | 195 | 195 | 0 | données (0/13)
activity | 320 | 281 | 264 | 247 | -62 | données
admin-time | 320 | 87 | 87 | 87 | -47 | données
age-calculator | 240 | 258 | 188 | 188 | 0 | statique
bilans | 160 | 63 | 63 | 63 | 0 | vide
birthdays | 160 | 102 | 102 | 102 | -16 | données (1)
calculator | 160 | 178 | 178 | 178 | 0 | statique
clock | 160 | 113 | 113 | 125 | 0 | données
daily-anecdote | 160 | 182 | 182 | 182 | 0 | statique
daily-game | 320 | 89 | 89 | 89 | 0 | statique
daily-quote | 160 | 121 | 121 | 121 | 0 | statique
feedback | 320 | 214 | 214 | 214 | 0 | statique
forecast | 160 | 123 | 103 | 103 | 0 | vide (aucun tarif)
forum | 480 | 19 NV | 19 NV | 19 NV | -4 | données
forum-notifications | 160 | 127 | 127 | 127 | 0 | vide
free-slots | 240 | 295 | 242 | 242 | +80 | données (5)
greeting | 160 | 92 | 92 | 76 | 0 | données
kora-news | 160 | 127 | 127 | 127 | 0 | vide
kpi-billing | 160 | 84 | 84 | 84 | 0 | vide (0 €)
kpi-noshows | 240 | 84 | 84 | 84 | 0 | données (0)
kpi-patients | 160 | 84 | 84 | 84 | 0 | données (8)
kpi-sessions | 160 | 84 | 84 | 84 | 0 | données (51)
lapins | 160 | 63 | 63 | 63 | 0 | vide
licence | >480 | 197 | 197 | 197 | 0 | données ; "w-[30%] max-w-24 truncate" tronqué partout
mascot | 160 | 146 | 146 | 146 | 0 | image
month-calendar | 160 | 232 | 232 | 232 | 0 | statique (76 lignes)
next-appointment | 160 | 87 | 87 | 87 | -47 | données (demain 9h00)
onboarding | 160 | 158 | 158 | 158 | 0 | erreur "checklist non chargée"
patient-search | 160 | 165 | 165 | 165 | 0 | statique
pomodoro | 160 | 145 | 145 | 145 | 0 | statique
reprendre | 160 | 63 | 63 | 63 | 0 | vide
shortcuts | 240 | 169 | 124 | 124 | 0 | statique
storage | 160 | 280 | 183 | 167 | +64 | données (33,4/30 Mo, 111 %)
today | 480 | 131 | 131 | 131 | -46 | données (1 absence, 0 restant)
tomorrow | 320 | 247 | 247 | 247 | +100 | données (4 RDV)
tongue-twister | 160 | 130 | 130 | 130 | 0 | statique
useful-links | 320 | 406 | 406 | 406 | 0 | statique
weather | 160 | 98 | 98 | 78 | 0 | vide (adresse cabinet absente)
week-grid | 320 | 128 | 128 | 128 | 0 | données
word-of-day | 480 | 209 | 209 | 209 | 0 | statique
(40 widgets rendus + 7 absents = 47 ids du harnais ; H@160 + brut : $S/mesure2/out.json)

ABSENTS (7, inchangés) : contact-code quick-reply recent-documents revenue transmissions unpaid-invoices unread-messages
- contact-code, quick-reply, unread-messages : index.tsx `requires: 'messaging', optional: true`
- recent-documents : `requires: 'documents', optional: true`
- revenue, transmissions, unpaid-invoices : `optional: true, requires: 'billing'`
- → absents = module messaging/documents/billing non actif sur le compte (inférence depuis requires ; NV côté licence du compte)
- non mesurés (non rendus) ; pas de contournement

PNG : $S/mesure2/png/<widget>.png = largeur mini (40 fichiers ; ">480" → 480) ; + {weather,today,activity,week-grid,forum}-{240,320,480}.png
Harnais : $S/mesure2/run.mjs (+ ids.txt, out.json)
Disposition finale du compte : 1 onglet "Accueil" (id cd995441-7ec9-41e8-8267-a2eb0b2aca22), cells [].
## Vérifié comment
node run.mjs → PUT 200 saved ; 40 cases dans _present (40 mesurées + 7 absents = 47 ids)
ls png | wc -l → 55
curl PUT {tabs:[{name:"Accueil",cells:[]}]} → {"saved":true,"tabs":[{"id":"cd995441-…","name":"Accueil","color":null,"cells":[]}]}
curl GET layout → même JSON (1 onglet vide)
rg "id: '(…)'" -A8 widget/ → requires: messaging|documents|billing ci-dessus
Méthode = T002 ; modifs : troncature hors en-tête (hdrTrunc séparé), PNG à chaque W puis tri
NV : forum H (corps hors flux, H=19 faux ; PNG forum-320 ≈ 1 ligne de topic + pager) 
## Écarts
- lecture hors WL : ∅
- DoD 6 : PUT {tabs:[]} refusé (400, T002) → 1 onglet "Accueil" vide posé, OK
- DoD 3 : cause des 7 absents = inférence requires/optional ; licence du compte non lue (hors WL)
- forum : hauteur non mesurable avec ce harnais
- min "lisible" : titres tronqués d'en-tête exclus ; 10 widgets ont hdrTrunc à 160 (bilans, birthdays, clock, daily-anecdote, daily-quote, forecast, greeting, lapins, …)
## Pour la suite
- Avec données : 40 widgets mesurés, Δ H@240 : +100 tomorrow, +80 free-slots, +64 storage ; −62 activity, −47 admin-time/next-appointment, −46 today, −16 birthdays ; 31 inchangés.
- larg.min (hors titre) : 160 → 24 widgets ; 240 → 5 (achievements, age-calculator, free-slots, kpi-noshows, shortcuts) ; 320 → 7 (activity, admin-time, daily-game, feedback, tomorrow, useful-links, week-grid) ; 480 → 3 (forum, today, word-of-day) ; licence >480.
- Hauteurs naturelles @240 : 63–406 ; max useful-links 406, free-slots 295, storage 280, activity 281, age-calculator 258 ; kpi-* 84.
- 7 widgets facturation/messagerie/documents absents : requires billing|messaging|documents ; à prévoir une hauteur issue de leurs grid {h,minH} (revenue h6/minH5, unpaid h8, transmissions h7, quick-reply h12, unread h7, contact-code h6, recent-docs h8) — modules de grille hors tableau.
- Pièges : forum H non mesurable ; today/storage/tomorrow/free-slots varient avec le volume de données (H non bornée) ; onboarding en erreur ; weather vide ; compte final = onglet "Accueil" vide.
## Retour sur le pack
- Manquait: règle de « lisible » (titres exclus ? — ambiguïté résolue en excluant l'en-tête) ; état de licence du compte ; méthode pour forum (corps hors flux) ; hauteur de case en cellules de grille (h:10 ≠ px)
- Inutile: ∅

# Outils de test

Génériques ; ce qui est propre à un projet vit dans `banc-impression/projets/<slug>.json` (front, alias, route…) et dans `projets/<slug>/` de chaque outil. Sorties volatiles : `/tmp/banc-sorties/`. Installation : `banc-impression/install.sh` (lien `node_modules`, utilisé par tous).

| Outil | Rôle | Entrée → sortie |
|---|---|---|
| [banc-impression](banc-impression/LISEZMOI.md) | rendu `/print` réel → PDF + PNG, serveur Vite partagé | `CODE…` + `--fixture` → `<CODE>-enonce/corrige.pdf/png`, `CODE pages=N errs=[]` |
| [banc-impression/fixtures](banc-impression/fixtures/orthoworkspace/INDEX.md) | données limites par format | `fixtures/<slug>/<CODE>/<nom>.json` |
| [attaque-livraison](attaque-livraison/LISEZMOI.md) | SSR de composants sur cas limites ; alias `@/` pour `node --test` | `cas.mjs` → 1 ligne par cas + JSON HTML |
| [mesure-geometrie](mesure-geometrie/LISEZMOI.md) | géométrie des points/planches imprimés (mm) | `CODE` + fixture → JSON → anomalies |
| [mesure-traits](mesure-traits/LISEZMOI.md) | traits horizontaux d'un PNG | PNG → `y x0 x1 mm` |
| [mesure-couleur](mesure-couleur/LISEZMOI.md) | pixels couleur (saturation) | PNG… → `pix_couleur=N` |
| [banc-liste](banc-liste/LISEZMOI.md) | front buildé servi sans serveur, API simulée, scénario | `dist` + `api.mjs` + scénario → captures + états |
| [mesure-tokens](mesure-tokens/LISEZMOI.md) | sortie + contexte relu des transcripts, par catégorie d'outil | `--depuis/--jusqu/--format` → tableaux md ou json |

## invariants-salle
- Quand : après chaque build du front de la salle, avant toute critique visuelle.
- Comment : `make invariants` (salle 7777 vivante requise ; 0 serveur lancé) → `OK I… | KO I… : détail`, `n OK / m KO`, rc = m (2 = salle injoignable).
- Invariants : I1 dialogs fermés `display:none` · I2 dialog ouvert sans défilement, x ≥ 16 à 390 · I3 pas de débordement horizontal · I4 carte VOTRE CHOIX visible sans défiler · I5 voix-panel rowGap ≥ 12 · I6 xterm-viewport `auto` · I7 `/api/term/in` intercepté · I8 immeuble sans choix-panel.
- Cas sans élément à mesurer : `OK … [∅ … (non applicable)]`.
- Captures des KO : `.sorties/invariants/<horodatage>/`.
- Ajouter un invariant : 1 fonction dans `INVARIANTS` de `invariants-salle/invariants.mjs` + 1 ligne ici.

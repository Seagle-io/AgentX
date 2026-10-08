#!/usr/bin/env bash
# Écrit les context packs réels des tâches T001 à T005.
set -e
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
P=vault/projets/recherche-floue/taches

sortie() {
cat <<EOF

## Format de sortie
Écris \`result.md\` à côté de ce pack, avec exactement ces sections :
\`\`\`markdown
---
tache: $1
statut: fait | bloque
---
## Livré
## Vérifié comment
## Écarts
## Pour la suite
## Retour sur le pack
\`\`\`
EOF
}

# ─────────────────────────────────────────────────────────── T001
cat > $P/T001-*/context.md <<'EOF'
---
pack: T001
projet: recherche-floue
role: eclaireur
cree: 2026-10-04
---

# Pack T001 — Cartographier la recherche actuelle

## Mission
Dresser la carte du chemin de recherche existant : qui reçoit la requête, qui
interroge le catalogue, où se décide le classement. Rendre des coordonnées, pas
du code recopié.

## Definition of Done
- [ ] le chemin requête → résultat est décrit en ≤ 8 lignes, avec `fichier:ligne`
- [ ] les signatures publiques du module de recherche sont recopiées
- [ ] les tests existants sont listés avec ce qu'ils couvrent réellement
- [ ] les absences confirmées sont dites (« aucun test sur les accents »)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `api/recherche.ts` | L | point d'entrée, 40 lignes |
| `data/catalogue.ts` | L | chargement du catalogue en mémoire |
| `api/recherche.test.ts` | L | ce qui est couvert aujourd'hui |

## Contrats
Aucun à respecter : ta sortie *est* le contrat pour T003.

## Décisions actées
- Pas de service externe — tranché au cadrage, ne cherche pas d'intégration.
- L'API publique `/api/recherche` ne change pas de forme.

## Hors périmètre
- Proposer un algorithme : c'est le travail de l'architecte en T003.
- Juger la qualité du code existant.
- Toucher au moindre fichier.

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Bash en lecture seule
- Si bloqué : statut `bloque`, pose **une** question précise, arrête-toi.
EOF
sortie T001 >> $P/T001-*/context.md

# ─────────────────────────────────────────────────────────── T002
cat > $P/T002-*/context.md <<'EOF'
---
pack: T002
projet: recherche-floue
role: eclaireur
cree: 2026-10-04
---

# Pack T002 — Relever le volume et la forme du catalogue

## Mission
Mesurer ce sur quoi l'index va tourner : nombre d'articles, longueur des titres,
caractères réellement présents, poids mémoire. Des chiffres, pas des impressions.

## Definition of Done
- [ ] nombre d'articles et poids mémoire du catalogue chargé, mesurés
- [ ] distribution des longueurs de titre (min, médiane, p95, max)
- [ ] inventaire des caractères hors `[a-z0-9 ]` réellement rencontrés
- [ ] estimation du nombre de trigrammes distincts
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `data/catalogue.ts` | L | structure et chargement |
| `data/catalogue.seed.json` | L | le jeu de données réel |
| `scripts/stats.ts` | L | s'il existe déjà, le réutiliser |

## Contrats
Rends tes mesures sous cette forme, elle sera recopiée telle quelle dans T003 :
```
articles: N
titre_len: min/med/p95/max
charset_hors_ascii: [...]
trigrammes_distincts: ~N
memoire_catalogue_mo: N
```

## Décisions actées
- Le catalogue est supposé tenir en mémoire — ta mesure confirme ou casse cette
  hypothèse. Si elle la casse, dis-le en tête de `## Pour la suite`.

## Hors périmètre
- Optimiser quoi que ce soit.
- Proposer une structure d'index.

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Bash en lecture seule
- Si bloqué : statut `bloque`, pose **une** question précise, arrête-toi.
EOF
sortie T002 >> $P/T002-*/context.md

# ─────────────────────────────────────────────────────────── T003
cat > $P/T003-*/context.md <<'EOF'
---
pack: T003
projet: recherche-floue
role: architecte
cree: 2026-10-04
---

# Pack T003 — Trancher l'algorithme et le seuil

## Mission
Choisir la structure d'index et le seuil de tolérance, puis produire le contrat
que deux implémenteurs travaillant en parallèle devront respecter sans se parler.

## Definition of Done
- [ ] une recommandation unique, assumée, avec la contrainte qui décide nommée
- [ ] deux options comparées dont « le faire bêtement », coût à un an inclus
- [ ] le contrat d'index est complet : types, erreurs, invariants, exemple d'appel
- [ ] le point de non-retour est nommé
- [ ] la décision est ajoutée en append à `decisions.md`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/recherche-floue/decisions.md` | E | ta décision, en append |
| `api/recherche.ts` | L | la forme que l'API impose |
| `data/catalogue.ts` | L | la structure des articles |

## Contrats
Mesures du catalogue remontées par T002, à prendre pour acquises :
```
articles: 50 000
titre_len: 8 / 34 / 72 / 180
charset_hors_ascii: [é è ê à ç ô ü œ]
trigrammes_distincts: ~41 000
memoire_catalogue_mo: 47
```
Budget imposé : p95 < 80 ms, index reconstructible à froid en < 10 s.

## Décisions actées
- Pas de service externe, pas de dépendance lourde — tranché au cadrage.
- `/api/recherche` garde sa forme actuelle.

## Hors périmètre
- Écrire du code de production : tu produis des signatures, pas une implémentation.
- Le classement commercial.

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write, Edit
- Si bloqué : statut `bloque`, pose **une** question précise, arrête-toi.
EOF
sortie T003 >> $P/T003-*/context.md

# ─────────────────────────────────────────────────────────── T004
cat > $P/T004-*/context.md <<'EOF'
---
pack: T004
projet: recherche-floue
role: implementeur
cree: 2026-10-04
---

# Pack T004 — Index trigramme en mémoire

## Mission
Construire l'index trigramme inversé et la fonction de candidats, dans
`search/index.ts`. Ne touche pas à l'API : c'est T005, en parallèle de toi.

## Definition of Base
Remplacé par la section ci-dessous.

## Definition of Done
- [ ] `construireIndex()` indexe 50 000 titres en moins de 10 s
- [ ] `candidats()` renvoie au plus 200 identifiants, triés par nombre de trigrammes communs
- [ ] les accents sont normalisés avant découpe (`é` et `e` donnent le même trigramme)
- [ ] un titre plus court que 3 caractères est indexé entier, sans planter
- [ ] `npm test -- search/index` passe, sortie collée dans `result.md`
- [ ] `git diff --stat` ne touche que les fichiers marqués E

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `search/index.ts` | E | le cœur du changement, fichier à créer |
| `search/index.test.ts` | E | les cas de la DoD |
| `search/normaliser.ts` | E | normalisation des accents |
| `data/catalogue.ts` | L | type `Article`, recopié ci-dessous |

## Contrats
Figé par l'architecte en T003. Respecte-le au caractère près : T005 code contre.
```ts
export type Article = { id: string; titre: string }

export type IndexTrigramme = {
  parTrigramme: Map<string, Set<string>>   // trigramme -> ids
  taille: number
}

export function construireIndex(articles: Article[]): IndexTrigramme
export function candidats(idx: IndexTrigramme, requete: string, max?: number): string[]
// max par défaut : 200. Requête vide -> tableau vide, jamais d'exception.
```

## Décisions actées
- Index trigramme en mémoire, pas de Levenshtein sur tout le catalogue — le temps
  est la contrainte qui décide (voir `decisions.md`, 2026-10-04).
- Levenshtein n'est appliqué qu'aux candidats, et c'est le travail de T005.

## Hors périmètre
- `api/recherche.ts` — c'est T005, vous écririez dans le même fichier.
- Le classement final et le scoring commercial.
- Toute dépendance npm nouvelle.

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, `Bash(npm test:*)`, `Bash(git diff:*)`
- Si bloqué : statut `bloque`, pose **une** question précise, arrête-toi.
EOF
sortie T004 >> $P/T004-*/context.md

# ─────────────────────────────────────────────────────────── T005
cat > $P/T005-*/context.md <<'EOF'
---
pack: T005
projet: recherche-floue
role: implementeur
cree: 2026-10-04
---

# Pack T005 — Brancher l'API de recherche

## Mission
Faire passer `/api/recherche` par l'index trigramme puis reclasser les candidats
par distance de Levenshtein. Ne crée pas l'index : c'est T004, en parallèle de toi.

## Definition of Done
- [ ] `/api/recherche?q=chausure` renvoie « chaussure » en première position
- [ ] une requête exacte garde exactement ses résultats d'avant (non-régression)
- [ ] une requête vide renvoie `[]` avec un 200, pas une erreur
- [ ] p95 mesurée sous 80 ms sur le catalogue complet, chiffre collé dans `result.md`
- [ ] `npm test -- recherche` passe, sortie collée dans `result.md`

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `api/recherche.ts` | E | le handler, lignes 12-48 |
| `api/recherche.test.ts` | E | non-régression + nouveaux cas |
| `search/distance.ts` | E | Levenshtein borné, fichier à créer |

## Contrats
`search/index.ts` est écrit par T004 **en parallèle**. Il n'existe peut-être pas
encore sur le disque : code contre cette signature, ne l'ouvre pas, ne l'écris pas.
```ts
export function construireIndex(articles: Article[]): IndexTrigramme
export function candidats(idx: IndexTrigramme, requete: string, max?: number): string[]
// requête vide -> [] ; jamais d'exception
```
Forme de réponse de l'API, inchangée :
```ts
type Reponse = { resultats: { id: string; titre: string; score: number }[] }
```

## Décisions actées
- Levenshtein uniquement sur les candidats renvoyés par l'index — jamais sur le
  catalogue entier (`decisions.md`, 2026-10-04).
- Distance maximale acceptée : 2. Au-delà, l'article est écarté.

## Hors périmètre
- `search/index.ts` et `search/normaliser.ts` — propriété de T004.
- Le cache de réponses.
- La pagination.

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, `Bash(npm test:*)`, `Bash(git diff:*)`
- Si bloqué : statut `bloque`, pose **une** question précise, arrête-toi.
EOF
sortie T005 >> $P/T005-*/context.md

echo "packs écrits"
for t in T001 T002 T003 T004 T005; do
  python3 bin/vx.py pack-lint $t --projet recherche-floue 2>&1 | grep -E "^(pack|  OK|  x)" | head -4
done

#!/usr/bin/env bash
# Packs de la vague 4 (vérificateurs). Le pack T007 dérive de T006.
set -e
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
P=vault/projets/recherche-floue/taches

cat > "$(ls -d $P/T006-*/)context.md" <<'EOF'
---
pack: T006
projet: recherche-floue
role: verificateur
cree: 2026-10-04
---

# Pack T006 — Casser l'index trigramme

## Mission
Tenter de faire tomber l'index livré en T004. Reproduis d'abord ses affirmations,
puis attaque. Tu n'as pas le droit de réparer : tu constates.

## Definition of Done
- [ ] chaque ligne du `## Vérifié comment` de T004 est relancée par toi
- [ ] chaque case de la DoD de T004 est cochée avec sa preuve, ou déclarée fausse
- [ ] les bords sont attaqués : requête vide, 1 caractère, 200 caractères, accents, unicode
- [ ] verdict explicite en tête : CONFORME / DÉFAUTS / NON VÉRIFIABLE
- [ ] chaque défaut a une commande de reproduction

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/recherche-floue/taches/T004-index-trigramme-en-memoire/result.md` | L | ce qu'il prétend |
| `search/index.ts` | L | le livrable |
| `search/normaliser.ts` | L | le pliage d'accents |
| `search/index.test.ts` | L | ce qui est déjà couvert |

## Contrats
Le contrat que T004 devait respecter :
```ts
export function construireIndex(articles: Article[]): IndexTrigramme
export function candidats(idx: IndexTrigramme, requete: string, max?: number): string[]
// max par défaut 200 ; requête vide -> [] ; jamais d'exception
```

## Décisions actées
- Les titres de moins de 3 caractères sont indexés entiers sous une clé `\x00` —
  signalé par T004, à vérifier, pas à rediscuter.

## Hors périmètre
- Corriger quoi que ce soit.
- `api/recherche.ts` — c'est T007.
- Les remarques de style.

## Budget
- Lectures hors whitelist : **5 maximum** (marge pour un contre-exemple), à journaliser.
- Outils autorisés : Read, Grep, Glob, `Bash(npm test:*)`
- Si bloqué : statut `bloque`, pose **une** question précise, arrête-toi.

## Format de sortie
Écris `result.md` avec les sections : `## Livré`, `## Vérifié comment`,
`## Écarts`, `## Pour la suite`, `## Retour sur le pack`.
EOF

python3 - <<'PY'
import pathlib
base = pathlib.Path('vault/projets/recherche-floue/taches')
src = next(base.glob('T006-*/context.md')).read_text(encoding='utf-8')
src = (src.replace('pack: T006', 'pack: T007')
          .replace("# Pack T006 — Casser l'index trigramme",
                   "# Pack T007 — Attaquer l'API sur les bords")
          .replace("l'index livré en T004", "l'API livrée en T005")
          .replace('T004', 'T005')
          .replace('T005-index-trigramme-en-memoire', 'T005-brancher-l-api-de-recherche')
          .replace('`search/index.ts` | L | le livrable', '`api/recherche.ts` | L | le livrable')
          .replace("`search/normaliser.ts` | L | le pliage d'accents",
                   '`search/distance.ts` | L | Levenshtein borné')
          .replace('`search/index.test.ts`', '`api/recherche.test.ts`')
          .replace("- `api/recherche.ts` — c'est T007.", "- `search/index.ts` — c'était T006.")
          .replace("""export function construireIndex(articles: Article[]): IndexTrigramme
export function candidats(idx: IndexTrigramme, requete: string, max?: number): string[]
// max par défaut 200 ; requête vide -> [] ; jamais d'exception""",
                   """type Reponse = { resultats: { id: string; titre: string; score: number }[] }
// requête vide -> 200 avec [] ; distance max acceptée : 2 ; p95 < 80 ms""")
          .replace("""- Les titres de moins de 3 caractères sont indexés entiers sous une clé `\\x00` —
  signalé par T005, à vérifier, pas à rediscuter.""",
                   """- Départage à score égal : nombre de trigrammes communs — tranché par le chef
  après le blocage de T005, à vérifier."""))
(next(base.glob('T007-*')) / 'context.md').write_text(src, encoding='utf-8')
PY

python3 bin/vx.py pack-lint T006 --projet recherche-floue | tail -1
python3 bin/vx.py pack-lint T007 --projet recherche-floue | tail -1

---
pack: T008
projet: seagle-pilotage
role: evaluateur
cree: 2026-10-16
---

# Pack T008 — Evaluer T004

> Seule source de vérité de l'agent T008. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Juger l'outil de captures livré par T004 (`outils/captures/{capturer,kora,geolens}.mjs`) contre la DoD de SON pack, preuves re-exécutées → `verdict: retenir | virer` dans `result.md`.

## Definition of Done
- [ ] chaque case DoD de `vault/projets/seagle-pilotage/taches/T004-l6-captures-capturer-mjs-profils-kora-et-geolens/context.md` recopiée dans `## DoD`, cochée `[x]` seulement avec `commande → sortie brute` re-exécutée par toi
- [ ] `--essai` kora et geolens re-joués ; `diff` avec les listings réels → ∅ (collé) ; routes déclarées confrontées à `ortho-front/src/app/router.tsx` (≥ 5 écrans vérifiés, `patient-suivi` à `null` jugé)
- [ ] sécurité : `--base` non local (`http://192.0.2.1/`, `https://exemple.fr`, `http://localhost.evil.com`) → refus ; aucun identifiant en dur (`rg -n -i "password|mot_de_passe|@.*\.(fr|com)" outils/captures/` → seulement des noms de variables)
- [ ] 0 écriture hors `--sortie` : `git -C <d> status --porcelain` avant == après (5 dépôts)
- [ ] tailles : dpr 1.875 confronté aux dimensions réelles des fichiers 2400 (PIL, ≥ 3 fichiers)
- [ ] écarts déclarés (env.md sans compte de démo, Playwright absent côté Geolens, routes geolens à `null`) jugés : bloquent-ils la DoD ou relèvent-ils de la suite ?
- [ ] 1 case `[ ]` ⇒ `verdict: virer` + `## Motif` 1 ligne ≤ 200 car., sans crochets ni saut ; sinon `retenir` et Motif `∅`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/seagle-pilotage/taches/T004-l6-captures-capturer-mjs-profils-kora-et-geolens/context.md` | L | DoD de référence |
| `vault/projets/seagle-pilotage/taches/T004-l6-captures-capturer-mjs-profils-kora-et-geolens/result.md` | L | affirmations à réfuter |
| `outils/captures/` | L | livrable |
| `produits.json` | L | registre |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/app/router.tsx` | L | routes Kora |
| `~/Documents/Workspace/seagle-website/public/kora/` | L | listing, tailles |
| `~/Documents/Workspace/Geolens-website/public/images/logiciel/` | L | listing, tailles |
| `.cache/eval-T008/` | E | essais |

## Contrats
Format imposé (`.claude/agents/evaluateur.md`) :
```markdown
---
tache: T008
projet: seagle-pilotage
statut: fait | bloque
evalue: T004
verdict: retenir | virer
---
## Verdict
## DoD
## Motif
## Vérifié comment
## Écarts
## Pour la suite
## Retour sur le pack
```

## Décisions actées
- ce lot ne fait AUCUNE vraie capture : produit non lancé = normal, pas un défaut
- tu ne lances ni `virer` ni `retenir` ; NV vaut `[ ]` ; tu ne corriges rien

## Hors périmètre
- lancer Kora, Geolens ou un site ; installer un paquet ; modifier un fichier hors `.cache/eval-T008/` et ton `result.md`

## Environnement
- node v22 ; Playwright dans `~/Documents/Workspace/seagle-website/node_modules` ; `garde_bash` refuse push/migrations

## Budget
- Lectures hors whitelist : **5 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (`result.md`, `.cache/eval-T008/`), `Bash(node:*)`, `Bash(python3:*)`, `Bash(ls:*)`, `Bash(rg:*)`, `Bash(diff:*)`, `Bash(git -C:*)` (lecture), `Bash(mkdir:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack (`vault/projets/seagle-pilotage/taches/T008-evaluer-t004/result.md`), dense, ≤ 80 lignes, sections exactes de « Contrats ».

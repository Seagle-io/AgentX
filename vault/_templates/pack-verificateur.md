---
pack: {{ID}}
projet: {{PROJET}}
role: verificateur
cree: {{DATE}}
---

# Pack {{ID}} — Vérifier {{TID_VERIFIE}}

> Seule source de vérité de l'agent {{ID}}. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.
> Pack type vérificateur : WL hors-pack 70 % (moy 1,71) sans ce gabarit.

## Mission
Tenter de casser {{TID_VERIFIE}} (`chemin`) ; verdict `CONFORME` | `DÉFAUTS` | `NON VÉRIFIABLE`, chaque défaut = entrée → sortie fausse + repro.

## Definition of Done
- [ ] chaque ligne de `## Vérifié comment` de {{TID_VERIFIE}} relancée : commande → sortie brute collée
- [ ] chaque case DoD de {{TID_VERIFIE}} : preuve ou échec
- [ ] bords attaqués : vide, absent, 0, négatif, très grand, unicode, double appel, erreur réseau
- [ ] verdict explicite en tête de `## Livré` ; défauts du plus grave au plus bénin, `fichier:ligne` + repro
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
WL obligatoire : `result.md` de la tâche vérifiée + helpers de test/seed + scripts de banc. Tous en L (rôle sans édition, hors `result.md` du pack).
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/projets/{{PROJET}}/taches/{{TID_VERIFIE}}-…/result.md` | L | affirmations à réfuter |
| `TODO-PACK` (fichiers E de {{TID_VERIFIE}}) | L | cible |
| `TODO-PACK` (helpers test/seed, makeTestApp…) | L | fabriquer les cas |
| `TODO-PACK` (scripts de banc) | L | rejouer les runs de référence |

## Contrats
Signatures, formats, clés de seed et comptes de test consommés par la cible : RECOPIÉS verbatim. Sinon `∅`.
```
…
```

## Décisions actées
- TODO-PACK — raison ≤ 8 mots

## Hors périmètre
- aucune correction : constat reproductible uniquement
- TODO-PACK

## Environnement
Paramètres exacts des runs de référence (BASE, port, env, comptes seed) : TODO-PACK.
Salle active : interception `/api/term/*` OBLIGATOIRE dans tout script Playwright (la page POST seule `/api/term/open` ; rien ne doit atteindre le démon) : TODO-PACK ou ∅.
Statuts requis pour chaque action testée (retenir/virer exigent `revue`, pas `pret`) et état absent du vrai vault (dormant, urgent) : injecter dans le banc.
Cible modifiée par un autre lot en parallèle : instantané `.cache/snap-<T>/` fourni par le chef ; DoD de mesure = Δ, pas valeurs absolues.
Lecture libre, hors budget : `rg`, `wc`, `diff`, `sed -n`, `git diff|status|show`, `python3 -c`.
Banc jetable pour toute mutation d'état partagé (`.cache/banc-<T>`). Serveur lancé : kill par pid, port libre vérifié en fin.
Compte de tests de base : relevé sur HEAD au dispatch.

## Budget
- Lectures hors whitelist : **5 maximum**, journalisées dans `## Écarts` (lectures `rg`/`sed -n`/`git` listées ci-dessus exclues).
- Outils autorisés : Read, Grep, Write (result.md), Bash(rg:*), Bash(wc:*), Bash(diff:*), Bash(sed -n:*), Bash(git diff:*), Bash(git status:*), Bash(git show:*), Bash(python3 -c:*), + commandes exactes des runs de référence
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes (détail long → note à part liée `[[slug]]`) :

```markdown
---
tache: {{ID}}
projet: {{PROJET}}
statut: fait | bloque
---
## Livré
- verdict: CONFORME | DÉFAUTS | NON VÉRIFIABLE
- D1 `fichier:ligne` — entrée → sortie fausse ; repro: `commande`
- essayé (si CONFORME): liste des attaques
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack (défauts à recopier en Contrats de la remplaçante)
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```

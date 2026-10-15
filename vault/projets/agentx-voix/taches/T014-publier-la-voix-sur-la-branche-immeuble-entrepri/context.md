---
pack: T014
projet: agentx-voix
role: devops
cree: 2026-10-16
---

# Pack T014 — Publier la voix sur la branche immeuble-entreprise (code + guide, sans fuite)

> Seule source de vérité de l'agent T014. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Reporter la VOIX d'AgentX (scripts `parle`, `dictee`, hook, serveur `voix.py`, annonces de la sonnerie, routes `/api/voix/*` et console vocale de la salle, guide `docs/INSTALL-voix.md`) du dépôt de travail vers la branche publique `immeuble-entreprise` (worktree `.cache/agentx-pub`, dépôt PUBLIC Seagle-io/AgentX) — UNIQUEMENT la voix, rien d'autre, 0 donnée privée — et prouver que tout tourne ; 1 commit local. Pas de push.

## Definition of Done
- [ ] fichiers neufs copiés tels quels : `bin/parle`, `bin/dictee`, `bin/parle_hook.py`, `bin/voix.py`, `docs/INSTALL-voix.md` (exécutables : `chmod +x` parle, dictee, parle_hook.py)
- [ ] fichiers modifiés des 2 côtés → `git merge-file` (ours = branche publique, base = `45e9fbc:<f>` du dépôt de travail, theirs = HEAD `b7ab7c1:<f>`), puis ne GARDER que les hunks VOIX : `bin/dash.py` (`import voix`, `state.voix`, `_voix`, route `/api/voix/*`), `bin/sonnerie.py` (`voix.annoncer`), `dash/dash.js` + `dash/dash.css` + `dash/index.html` (console vocale `#voix`, `rendreVoix`, `brancherVoix`, `.voix-*`), `CLAUDE.md` (puce Voix) ; hunks NON voix (garde de dispatch T036, registre `produits`, `_todo` « prête mais aucun agent », cache par événements) → EXCLUS ; tableau fichier → hunks gardés / exclus collé
- [ ] 0 `<<<<<<<|>>>>>>>` ; `rg -n -i "orthopro|geolens|ortho_test|seagle-site|192\.168\.|/home/[a-z]+|jdrac|julien@" ` sur les fichiers du diff `origin/immeuble-entreprise..HEAD` → chaque occurrence listée et justifiée, 0 donnée client, 0 chemin personnel ; `produits.json`, `bin/produits.py`, `bin/publier.py`, `outils/`, `vault/projets|syndicat|connaissances|artefacts|archive` ABSENTS du diff
- [ ] ça tourne dans une copie du worktree (`.cache/banc-voix-T014`) : `python3 -m py_compile bin/*.py` rc 0 ; `ast.parse` de `bin/parle`, `bin/dictee` ; `node --check dash/dash.js` rc 0 ; `python3 bin/test_garde_bash.py` 0 échec ; salle `--port 7824 --no-open` avec `AGENTX_VOIX_DIR` jetable → `state.json` contient `voix` (6 clés) ET `immeuble` ; Playwright : carte `#voix` visible avec un journal de test, tour visible, 0 erreur console ; kill → 000
- [ ] 1 commit local dans le worktree, message français + `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>` ; `git -C .cache/agentx-pub log --oneline -2` collé ; `git status --short` → ∅
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `.cache/agentx-pub/` | E | worktree de publication (branche immeuble-entreprise) |
| `.cache/banc-voix-T014/` | E | copie de test |
| `bin/` | L | version travail (`git show b7ab7c1:<f>`, base `45e9fbc:<f>`) |
| `dash/` | L | version travail |
| `docs/INSTALL-voix.md` | L | guide |
| `CLAUDE.md` | L | puce Voix |
| `vault/projets/agentx-entreprise/taches/T034-publication-fusionner-le-travail-dans-seagle-io-/result.md` | L | méthode de la 1re publication (merge-file, pièges) |

## Contrats
Dépôt de travail : `/home/jdrac/Documents/Workspace/AgentX` ; base de la 1re publication = `45e9fbc` ; HEAD voix = `b7ab7c1`. Worktree : `.cache/agentx-pub` (branche `immeuble-entreprise`, dernier commit `9bb1315`, déjà poussé sur origin).
```
B=45e9fbc ; T=b7ab7c1 ; P=.cache/agentx-pub
git show $B:<f> > base ; git show $T:<f> > travail ; git merge-file -L public -L base -L travail $P/<f> base travail
```
Puis retirer à la main (Edit) les hunks non voix. Voix = tout ce qui cite `voix`, `parle`, `dictee`, `#voix`, `.voix-`, `/api/voix`.

## Décisions actées
- demande humaine 2026-10-16 : « il va falloir que tu pushes les modifications de la voix » — l'humain pousse lui-même (garde_bash refuse le push à toute session)
- dépôt PUBLIC : le moindre doute de fuite = exclure le fichier et le dire
- seagle-pilotage (produits, publier, captures) et garde de dispatch : PAS dans ce lot

## Hors périmètre
- `git push`, remote, PR ; la branche `main` de `~/Documents/AgentX`
- modifier le dépôt de travail

## Environnement
- `garde_bash` refuse `git branch -D`, `reset`, `checkout --`, `clean`, `stash`, push : merge-file / copie / Edit seulement
- Playwright : `~/Documents/Workspace/seagle-website/node_modules/playwright` (1.62.0), `import` par chemin absolu ; `/api/term/*` et `/api/run` interceptés
- jamais faire parler la machine (`AGENTX_VOIX_DIR` jetable, stub notify-send `.cache/T002/stub`)

## Budget
- Lectures hors whitelist : **5 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write (`.cache/agentx-pub/`, `.cache/banc-voix-T014/`), Grep, `Bash(git -C .cache/agentx-pub:*)`, `Bash(git show:*)`, `Bash(git merge-file:*)`, `Bash(python3:*)`, `Bash(node:*)`, `Bash(cp:*)`, `Bash(mkdir:*)`, `Bash(chmod:*)`, `Bash(rg:*)`, `Bash(grep:*)`, `Bash(diff:*)`, `Bash(curl:*)`, `Bash(kill:*)`, `Bash(rm -rf .cache/banc-voix-T014)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes de corps, sections exactes :

```markdown
---
tache: T014
projet: agentx-voix
statut: revue | bloque
---
## Livré
- chemin — copié | hunks voix gardés (n) / exclus (n)
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes : commande de push exacte pour l'humain
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```

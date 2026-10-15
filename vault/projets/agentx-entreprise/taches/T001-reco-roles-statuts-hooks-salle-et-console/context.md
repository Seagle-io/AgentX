---
pack: T001
projet: agentx-entreprise
role: eclaireur
cree: 2026-10-15
---

# Pack T001 — Reco : rôles, statuts, hooks, salle et console

> Seule source de vérité de l'agent T001. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Cartographier tout point d'AgentX qui fige la liste des rôles, des statuts de tâche, et la console de la salle → coordonnées `chemin:L` dans `result.md`, 0 modif.

## Definition of Done
- [ ] Liste exhaustive des endroits où les 5 rôles sont codés en dur (`rg -n "eclaireur|verificateur" bin dash .claude` → chaque hit classé : liste de rôles / couleur-silhouette / texte)
- [ ] `STATUTS`, `STATUT_OUVERT` de `bin/vx.py` recopiés verbatim + tout autre fichier qui énumère les statuts
- [ ] Commandes `vx.py` : nom → fonction `chemin:L` ; signature de `journaliser`, `cmd_tache`, `cmd_set`, `cmd_integrer`, `cmd_pack_lint`
- [ ] `bin/garde_dispatch.py` : règle exacte d'acceptation (rôles, regex sur prompt, statuts admis) recopiée
- [ ] `bin/sonnerie.py` : format d'une ligne de `run/evenements.jsonl` recopié
- [ ] `bin/dash.py` : liste des routes HTTP (méthode, chemin, fonction:L), liste blanche des commandes, calcul de `todo` (fonction:L), routes terminal
- [ ] `bin/terminal.py` : API publique (classes/fonctions + signatures)
- [ ] `dash/index.html` + `dash/dash.js` + `dash/dash.css` : panneau console (`#term`, `#console-out`) → fonctions JS qui le pilotent `chemin:L`, ses limites constatées (taille, fit, reconnexion, saisie) ; autres panneaux et leur fonction de rendu `chemin:L`
- [ ] `.claude/agents/implementeur.md` : frontmatter recopié verbatim (champs supportés : `tools`, `model`, autres)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `bin/vx.py` | L | rôles, statuts, commandes CLI |
| `bin/dash.py` | L | serveur salle, routes, todo |
| `bin/garde_dispatch.py` | L | garde Agent |
| `bin/sonnerie.py` | L | événements SubagentStop |
| `bin/terminal.py` | L | session chef pty |
| `dash/index.html` | L | structure des panneaux |
| `dash/dash.js` | L | rendu, console xterm |
| `dash/dash.css` | L | couleurs par rôle |
| `.claude/settings.json` | L | hooks déclarés |
| `.claude/agents/implementeur.md` | L | format d'un agent |
| `.claude/skills/chef-de-projet/SKILL.md` | L | tableau des rôles L9-L20 |
| `vault/projets/agentx-entreprise/taches/T001-reco-roles-statuts-hooks-salle-et-console/result.md` | E | livrable |

## Contrats
∅ — reco pure.

## Décisions actées
- Lecture seule — l'éclaireur ne modifie rien.
- Coordonnées, jamais de dump > 15 lignes de code.

## Hors périmètre
- Proposer un design — l'architecte tranchera.
- Lire `vault/` hors ce dossier de tâche.
- Lancer la salle ou un navigateur.

## Environnement
- Python 3 stdlib, 0 dépendance ; `rg` dispo.
- Salle sur http://127.0.0.1:7777 possiblement active : ne pas l'arrêter. `curl -s 127.0.0.1:7777/...` en GET autorisé pour confirmer une route.
- Arbre de travail sale (fichiers M non commités) : lire l'état disque, pas HEAD.

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, `Bash(rg:*)`, `Bash(wc:*)`, `Bash(curl -s:*)`
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 120 lignes (dérogation reco), sections exactes :

```markdown
---
tache: T001
statut: fait | bloque
---
## Livré
- chemin:L — fait (≤ 8 mots), groupé par : Rôles · Statuts · CLI · Gardes/hooks · Serveur · Console · Panneaux · Agents
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 15 lignes, contrats recopiés verbatim collables dans un pack (STATUTS, routes, format évènement, frontmatter agent).
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```

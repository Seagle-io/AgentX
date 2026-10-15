---
pack: T003
projet: agentx-entreprise
role: implementeur
cree: 2026-10-15
---

# Pack T003 — Installer les skills officiels frontend-design et webapp-testing

> Seule source de vérité de l'agent T003. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Copier `skills/frontend-design` et `skills/webapp-testing` du dépôt `https://github.com/anthropics/skills` dans `.claude/skills/`, après lecture intégrale, avec traçabilité (SHA, licence) dans `.claude/skills/SOURCES.md`.

## Definition of Done
- [ ] `git clone --depth 1 https://github.com/anthropics/skills .cache/anthropic-skills` → SHA relevé (`git -C .cache/anthropic-skills rev-parse HEAD`)
- [ ] chaque fichier des 2 dossiers lu en entier AVANT copie ; tout appel réseau / écriture hors cwd / `rm` dans les scripts → listé dans `## Écarts`, copie quand même si inoffensif, sinon `bloque`
- [ ] `.claude/skills/frontend-design/SKILL.md` et `.claude/skills/webapp-testing/SKILL.md` existent ; `head -4` → `name:` = nom du dossier
- [ ] licence de chaque skill lue (fichier LICENSE du dossier ou racine) → nom de licence noté dans SOURCES.md ; licence non libre ⇒ `bloque`
- [ ] `.claude/skills/SOURCES.md` : 1 ligne/skill `nom · dépôt · chemin · SHA · licence · date 2026-10-15`
- [ ] `git status --short .claude/skills` → seuls les 2 dossiers + SOURCES.md ajoutés ; `chef-de-projet/` intact
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `.cache/anthropic-skills/` | E | clone jetable (gitignoré) |
| `.claude/skills/frontend-design/` | E | à créer, copie |
| `.claude/skills/webapp-testing/` | E | à créer, copie |
| `.claude/skills/SOURCES.md` | E | à créer, traçabilité |

## Contrats
Format attendu d'un skill Claude Code :
```
.claude/skills/<nom>/SKILL.md
---
name: <nom>
description: <quand l'utiliser>
---
<corps> (+ fichiers annexes : scripts/, references/, LICENSE.txt)
```

## Décisions actées
- copie verbatim, 0 modification du contenu — traçable vs amont
- pas de sous-module git — système zéro dépendance
- scripts annexes copiés, jamais exécutés ici

## Hors périmètre
- Installer d'autres skills que ces 2
- Exécuter les scripts (`with_server.py` etc.), installer playwright/pip
- Modifier `.claude/agents/*` ou `.claude/settings.json`

## Environnement
- `.cache/` est gitignoré ; dépôt amont public, réseau dispo
- si le clone échoue (réseau) → `bloque` avec la sortie exacte
- dossier amont inexistant sous ce nom → `ls .cache/anthropic-skills/skills` collé, prendre l'équivalent exact s'il n'y a qu'un candidat évident, sinon `bloque`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Write, `Bash(git clone:*)`, `Bash(git -C:*)`, `Bash(cp -r:*)`, `Bash(ls:*)`, `Bash(head:*)`, `Bash(find:*)`, `Bash(git status:*)`
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T003
statut: fait | bloque
---
## Livré
- chemin — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | script à risque: chemin:L — quoi
## Pour la suite
- ≤ 5 lignes : description exacte (frontmatter) de chaque skill, dépendances runtime (python, playwright…)
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```

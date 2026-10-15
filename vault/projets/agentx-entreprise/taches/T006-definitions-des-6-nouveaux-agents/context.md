---
pack: T006
projet: agentx-entreprise
role: scribe
cree: 2026-10-15
---

# Pack T006 — Définitions des 6 nouveaux agents

> Seule source de vérité de l'agent T006. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Créer 6 définitions de subagent `.claude/agents/{evaluateur,relecteur,testeur,designer,securite,devops}.md` sur le modèle des 4 agents L, avec les fiches de poste de « Contrats ».

## Definition of Done
- [ ] 6 fichiers créés ; `head -6` de chacun → frontmatter exact de « Contrats » (name, description, tools, model, skills si listé)
- [ ] chaque corps reprend des agents L : section « Langage (dense) » verbatim, « Discipline de contexte » adaptée au rôle, « Sortie » (result.md, sections du pack)
- [ ] chaque corps porte la fiche de poste de « Contrats » (mission, interdits, format spécifique)
- [ ] `evaluateur.md` impose le format de result.md de « Contrats » verbatim (frontmatter `evalue`, `verdict` ; sections `## Grille DoD`, `## Motif`, `## Correctifs du pack`)
- [ ] rôles sans Edit (evaluateur, relecteur, securite) : phrase « délibérément privé de l'outil d'édition » comme `verificateur.md`
- [ ] `rg -c "^name: " .claude/agents/*.md` → 11 fichiers, 1 chacun
- [ ] 4 agents L intacts : `git diff --stat -- .claude/agents/{eclaireur,architecte,implementeur,verificateur}.md` → vide
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `.claude/agents/evaluateur.md` | E | à créer |
| `.claude/agents/relecteur.md` | E | à créer |
| `.claude/agents/testeur.md` | E | à créer |
| `.claude/agents/designer.md` | E | à créer |
| `.claude/agents/securite.md` | E | à créer |
| `.claude/agents/devops.md` | E | à créer |
| `.claude/agents/verificateur.md` | L | modèle rôle sans édition |
| `.claude/agents/implementeur.md` | L | modèle rôle producteur |
| `.claude/agents/eclaireur.md` | L | modèle restitution |
| `.claude/agents/architecte.md` | L | modèle rôle Web |

## Contrats
Frontmatters (verbatim, `description` = texte donné) :
```
evaluateur  · tools: Read, Grep, Glob, Bash, Write · model: opus
  description: Juge un livrable contre la Definition of Done de SON pack et prononce « retenu » ou « vire ». À utiliser après toute tâche producteur (implementeur, testeur, designer, devops) passée en revue. Ne corrige rien ; son motif sert à corriger le pack du remplaçant.
relecteur   · tools: Read, Grep, Glob, Bash, Write · model: sonnet
  description: Revue de code d'un diff fermé — lisibilité, duplication, conventions du dépôt, code mort, taille. Distinct du vérificateur (qui tente de casser). Rend des constats localisés et un verdict APPROUVE ou CHANGEMENTS.
testeur     · tools: Read, Edit, Write, Grep, Glob, Bash · model: inherit · skills: [webapp-testing]
  description: Écrit les tests et specs e2e d'un comportement contractualisé, dans sa whitelist de fichiers de test. Prouve chaque test (rouge sur le défaut ou vert sur le livrable, sortie collée). Ne touche jamais au code de production.
designer    · tools: Read, Edit, Write, Grep, Glob, Bash, WebFetch · model: inherit · skills: [frontend-design]
  description: Conçoit et réalise l'interface — structure, hiérarchie, tokens, accessibilité, responsive — dans un périmètre de fichiers UI fermé. Réutilise le kit existant avant d'inventer. Rend captures ou mesures, pas d'adjectifs.
securite    · tools: Read, Grep, Glob, Bash, Write, WebSearch, WebFetch · model: opus
  description: Audite un périmètre pour la sécurité — authz, injection, XSS, CSP, secrets, dépendances, en-têtes. Ne corrige rien : chaque constat a une gravité, une coordonnée et une reproduction.
devops      · tools: Read, Edit, Write, Grep, Glob, Bash · model: inherit
  description: Build, scripts, conteneurs, CI et environnements dans un périmètre fermé. Ne pousse jamais, ne migre jamais, ne détruit aucun volume : passe la tâche en bloque avec la commande exacte pour l'humain.
```
`skills:` en YAML liste : `skills:\n  - webapp-testing`.

Fiches de poste (à développer en dense dans chaque corps) :
```
evaluateur : lit son pack + pack ÉVALUÉ (context.md) + result.md évalué + `git diff -- <E du pack évalué>`
  chaque case DoD évaluée → OK | KO | NV avec preuve `commande → sortie`
  retenu ⇔ toutes OK ; vire si ≥1 KO, NV non justifié, diff hors E, test affirmé sans sortie collée
  ne lance pas `vx virer`/`retenir` (le chef le fait) ; 0 édition du livrable
relecteur : constats `chemin:L — défaut — correctif ≤ 8 mots`, gravité bloquant|mineur ; verdict APPROUVE si 0 bloquant
testeur : n'écrit que fichiers de test de la WL ; chaque test : nom → ce qu'il prouve ; sortie runner collée
designer : kit UI existant d'abord ; contraste AA, focus visible, ≤ 320 px sans scroll horizontal ; preuve = capture ou mesure
securite : constats `gravité(critique|haute|moyenne|basse) · chemin:L · vecteur · repro` ; 0 exploitation contre un serveur réel ; lecture seule BDD
devops : interdits hook (push, migrations, prune, volume rm, down -v) → `bloque` + commande ; nettoie seulement ce qu'il a créé, par nom
```
Format result.md de l'évaluateur (verbatim dans `evaluateur.md`) :
```markdown
---
tache: T0xx
statut: fait
evalue: T0yy
verdict: retenu | vire
---
## Grille DoD
- [OK|KO|NV] <case DoD recopiée> — commande → sortie (1 ligne)
## Motif
1 ligne ≤ 300 car. — vide si retenu ; repris tel quel par `vx virer --motif`
## Correctifs du pack
- ce que le pack du remplaçant doit gagner (contrat manquant, DoD floue…) | ∅
## Vérifié comment
commande → sortie brute
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```

## Décisions actées
- producteurs (implementeur, testeur, designer, devops) livrent en `revue` ; seul le chef passe `fait` après verdict retenu — mentionner dans leur « Sortie »
- frontmatter `statut:` du result.md d'un producteur = `fait | bloque` (inchangé) ; c'est le chef qui pose `revue` côté task.md
- tout agent : jamais `git push`, migrations, `git stash/checkout --/reset/clean` — arbre partagé

## Hors périmètre
- Modifier les 4 agents L ni `scribe.md`
- Créer des skills, toucher settings.json, bin/, vault hors ce dossier

## Environnement
- Claude Code charge `.claude/agents/*.md` au démarrage de session
- `rg`, `head`, `git diff` dispo

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Write, Edit, `Bash(rg:*)`, `Bash(head:*)`, `Bash(git diff:*)`, `Bash(wc:*)`
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T006
statut: fait | bloque
---
## Livré
- chemin — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```

---
pack: T039
projet: agentx-entreprise
role: syndicat
cree: 2026-10-16
---

# Pack T039 — Syndicat : quel agent consomme le plus, optimiser le coût en tokens

> Seule source de vérité de l'agent T039. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Mesurer, à partir des transcripts réels de Claude Code, la consommation de tokens de chaque agent (par rôle, modèle, projet, tâche, et du chef lui-même), trouver où part le coût, et rendre des revendications chiffrées pour le réduire sans perdre en qualité (renvois, évaluations).

## Definition of Done
- [ ] script `.cache/syndicat-T039/tokens.py` (lecture seule) qui parcourt les transcripts de sous-agents (305 fichiers) et de sessions du chef (cf. Contrats) ; par sous-agent : `agentType` + `description` (meta.json), TID + projet (1er message), modèle (`message.model`), somme de `input_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens`, `output_tokens`, nb d'appels outils, durée (1er → dernier `timestamp`) ; sortie CSV `.cache/syndicat-T039/agents.csv` ; erreurs de lecture comptées, jamais bloquantes
- [ ] `vault/syndicat/2026-10-16-tokens.md` (Obsidian, `tags: [syndicat]`) : `## Méthode` (sources, formule) · `## Par rôle` (total, médiane, p90 par tâche ; part du total) · `## Par modèle` (opus / sonnet / hérité) · `## Top 15 tâches` (projet/TID, rôle, tokens, pourquoi) · `## Le chef` (consommation de la session chef vs agents, part du cache) · `## Renvois` (coût d'une chaîne renvoyée : ex. T026→T030→T032, seagle T005→…→T019) · `## Revendications` · `## Sans donnée`
- [ ] « tokens » = 4 colonnes séparées + 1 total pondéré `input + cache_creation×1.25 + cache_read×0.1 + output×5` (unités relatives, pas de prix en euros inventé) ; formule écrite dans `## Méthode`
- [ ] 5 à 10 revendications, chacune : constat chiffré · source (ligne CSV / chemin) · correction (modèle par rôle, taille de pack, lectures hors WL, évaluateurs qui refont tout, bancs reconstruits à chaque tâche, `--modele opus` systématique au 2e renvoi, longueur des result.md, contexte chef) · gain estimé (tokens) · risque qualité
- [ ] confronter au cahier du 2026-10-15 (R10 : « modèle et budget non mesurés ») : ce qui est maintenant mesurable
- [ ] 0 contenu de conversation recopié (prompts, code, secrets) : seulement des nombres, des TID, des rôles ; 0 édition hors livrable, CSV et `result.md`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `vault/syndicat/2026-10-16-tokens.md` | E | livrable (neuf) |
| `.cache/syndicat-T039/` | E | script, CSV |
| `~/.claude/projects/-home-jdrac-Documents-Workspace-AgentX/*/subagents/agent-*.jsonl` | L | transcripts des sous-agents (via script seulement) |
| `~/.claude/projects/-home-jdrac-Documents-Workspace-AgentX/*/subagents/agent-*.meta.json` | L | `agentType`, `description` |
| `~/.claude/projects/-home-jdrac-Documents-Workspace-AgentX/*.jsonl` | L | sessions du chef (usage seulement, via script) |
| `vault/syndicat/2026-10-15-tous.md` | L | cahier précédent (R10) |
| `vault/projets/*/journal.md` | L | renvois (rejete, remplace) |

## Contrats
Formes constatées par le chef :
```
subagents/agent-<id>.meta.json : {"agentType":"evaluateur","description":"T013 évaluer la porte de publication","toolUseId":…,"spawnDepth":1,"requestShape":"background",…}
subagents/agent-<id>.jsonl, 1re ligne : {"isSidechain":true,"agentId":…,"type":"user","message":{"role":"user","content":"T013 · projet seagle-pilotage\npack: vault/projets/…"},"timestamp":"2026-10-15T22:15:41.730Z",…}
lignes assistant : message.usage = {input_tokens, cache_creation_input_tokens, cache_read_input_tokens, output_tokens, …} ; message.model
sessions chef : ~/.claude/projects/-home-jdrac-Documents-Workspace-AgentX/<session>.jsonl (même forme, isSidechain absent/false) ; dossier total 331 Mo, 305 transcripts de sous-agents
```
Attention : un même message assistant peut apparaître sur plusieurs lignes (streaming) — dédoublonner par `message.id` avant de sommer.

## Décisions actées
- demande humaine 2026-10-16 : « une étude faite par le syndicat pour évaluer quel agent consomme le plus ; chercher à optimiser le coût en tokens »
- tu proposes, le chef décide ; 0 donnée inventée ; prix réels en euros hors périmètre (unités relatives)
- lecture seule absolue des transcripts ; jamais recopier leur contenu

## Hors périmètre
- modifier des agents, packs, gabarits, `roles.json` ; les transcripts d'autres dossiers de projets Claude

## Environnement
- Python 3 stdlib ; lire les .jsonl en flux (ligne par ligne), 331 Mo au total
- `rg -I` ; `garde_bash` refuse push/migrations

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write (livrable, `.cache/syndicat-T039/`, result.md), `Bash(python3:*)`, `Bash(ls:*)`, `Bash(wc:*)`, `Bash(rg:*)`, `Bash(mkdir:*)`
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes de corps, sections exactes :

```markdown
---
tache: T039
projet: agentx-entreprise
statut: fait | bloque
---
## Livré
- vault/syndicat/2026-10-16-tokens.md — n agents mesurés, n revendications
## Vérifié comment
commande → sortie brute (totaux par rôle et modèle)
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes : les 3 économies les plus fortes, recopiables dans un pack
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```

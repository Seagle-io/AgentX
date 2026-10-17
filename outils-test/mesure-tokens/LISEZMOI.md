# mesure-tokens

Coût de sortie **et de relecture du contexte** des transcripts Claude Code, par catégorie d'outil. Stdlib, agrégats seulement.

```
python3 -I outils-test/mesure-tokens/mesure.py [--depuis AAAA-MM-JJ] [--jusqu AAAA-MM-JJ|AAAA-MM-JJTHH:MM] [--format md|json] [--dossier <transcripts>]
```
Défaut `--dossier` : `~/.claude/projects/-home-sylvain-Documents-AgentX`. Bornes = `timestamp` du message (UTC), `--jusqu` jour inclus. Sortie déterministe.

## Colonnes
- session : chef si 1er message `user` ≠ `Txxx · projet`, sinon agent
- contexte (par appel API, `message.id` distinct) = `input_tokens` + `cache_read_input_tokens` + `cache_creation_input_tokens`
- sortie = `output_tokens`, par ligne du transcript
- appels = `tool_use` ; sortie et contexte d'un message répartis à parts égales entre ses `tool_use` ; sans outil → `texte/sans outil`
- catégories : `texte/sans outil`, `vx tenue` (sous-commande ∈ TENUE), `pack` (Write/Edit `context.md`), `vault autre`, `code/lecture`, `dispatch/Agent`, `vx autre`
- t5 : classe d'une écriture chef sur pack selon l'état de la session (1re écriture · avant lint · après `pack-lint` vert · après `dispatch`)

## Limites
- réflexion non séparable (non exposée) ; parts égales entre `tool_use`
- sous-commande `vx` = 1er motif `vx.py|agentx <mot>` de la commande : bruit possible (`false`, `bin`)
- t5 : état par session ; un pack écrit dans une session antérieure compte « 1re écriture » (Write) ou « avant lint » (Edit) ; contrat/décisions « après dispatch » = un dispatch du projet a eu lieu dans la session
- sessions agent : seules celles de ce dossier ; ne compte que les messages dans la borne

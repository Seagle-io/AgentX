---
tache: T004
statut: fait
---
## Livré
- .claude/skills/langage-dense/SKILL.md — 10 règles, abréviations, plafonds, exemple
- .claude/skills/conventions-geolens/SKILL.md — Outillage·Sécurité·Serveur test·Banc·Interdits
- Interdits : 3 règles « Contrats » verbatim + 2 rappels sourcés
- chaque règle suffixée `[[note]]` source
- notes vault : 0 créée (HP)
## Vérifié comment
wc -l .claude/skills/langage-dense/SKILL.md .claude/skills/conventions-geolens/SKILL.md → 55 / 91 / 146 total (≤ 120 chacun OK)
Bash heredoc contenant « git push » refusé par garde_bash → rewrite via Write
## Écarts
- ∅
## Pour la suite
- langage-dense : « Langage inter-agents « dense » AgentX (0 prose, lignes-faits, coordonnées, abréviations, plafonds). Charger avant d'écrire un pack, un result.md, un prompt de dispatch, une note ou une entrée decisions.md. »
- conventions-geolens : « Conventions, commandes, pièges et interdits des dépôts Geolens (geolens-web : api Fastify, web viewer 3D, serveur de test). Charger pour toute tâche touchant un dépôt Geolens ou son serveur de test. »
- NV : pas d'écriture dans `.claude/agents/*` (HP)
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
- Piège: garde_bash scanne tout le texte de la commande (heredoc inclus) → prescrire Write pour contenus citant « git push »

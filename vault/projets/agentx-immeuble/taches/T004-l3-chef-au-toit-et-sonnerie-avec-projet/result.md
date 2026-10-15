---
tache: T004
statut: revue
---
## Livré
- bin/terminal.py:24-52 — consigne chef au toit, §C6 verbatim
- bin/terminal.py:22-23 — commentaire conservé
- bin/sonnerie.py:31-34 — RE_PROJET, RE_CHEMIN, RE_ROLE_T, RE_STAT_T
- bin/sonnerie.py:45-64 — projet_de 4 règles, exception → ""
- bin/sonnerie.py:81,91 — tid_str ; ev["projet"] en dernière clé
## Vérifié comment
python3 -m py_compile bin/terminal.py bin/sonnerie.py → rc=0
rg -c 'projet courant' bin/terminal.py → (aucune sortie) rc=1
contrat.md L160-188 == terminal.py L24-52 (python, liste de lignes) → verbatim True
git diff -U0 bin/terminal.py | rg '^@@' → @@ -25 +25,2 @@ · @@ -27,3 +28,3 @@ · @@ -30,0 +32,3 @@ · @@ -48 +52 @@
DoD L3 #2 projet_de('---\ntache: T001\nprojet: agentx-immeuble\nstatut: fait\n---','T001','eclaireur') → agentx-immeuble
DoD L3 #3 → '' ''
règle 3 projet_de('rien','T002','architecte') → '' — candidats 9, role architecte 4 (dashboard-direct, agentx-entreprise, agentx-immeuble, geolens-charge-3d), en-cours 0 → ambigu
règle 3 projet_de('rien','T004','implementeur') → 'agentx-immeuble'
règle 2 projet_de('voir vault/projets/zz-nope/taches/ puis vault/projets/agentx-immeuble/taches/T004','','x') → 'agentx-immeuble'
DoD L3 #4 main(), EVENEMENTS=.cache/T004/evenements.jsonl, stdin SubagentStop architecte T002 →
  1 ligne, 8 clés ['id','t','quoi','role','tid','statut','verdict','projet']
  {"id": "3c8fe7bbae7bc352", "t": "17:28:34", "quoi": "agent-fini", "role": "architecte", "tid": "T002", "statut": "fait", "verdict": "", "projet": ""}
main(), EVENEMENTS=.cache/T004/evenements2.jsonl, implementeur T004 + chemin taches/ →
  1 8 · {"id": "5ce9ef44b3a6bb38", "t": "17:28:43", "quoi": "agent-fini", "role": "implementeur", "tid": "T004", "statut": "revue", "verdict": "", "projet": "agentx-immeuble"}
wc -c run/evenements.jsonl → avant 8865 · après 8865
git diff --stat -- bin/ → bin/sonnerie.py | 30 +++++- · bin/terminal.py | 14 +++-- · 2 files changed, 38 insertions(+), 6 deletions(-)
## Écarts
- ∅
## Pour la suite
- result.md gabarit sans `projet:` → règle 1 inopérante ; ajouter `projet:` au frontmatter result.md ([[LANGAGE]]/gabarit)
- TID dupliqués entre projets (T002 : 4 architectes) → règle 3 souvent "" ; règle 2 dépend d'un chemin `.../taches/` dans les 1000 1ers caractères
- session chef vivante garde l'ancienne consigne jusqu'à ■ arrêter / ▶ lancer (humain)
- .cache/T004/evenements*.jsonl jetables
## Retour sur le pack
- Manquait: ∅ | Inutile: bin/agentx (L, non ouvert)

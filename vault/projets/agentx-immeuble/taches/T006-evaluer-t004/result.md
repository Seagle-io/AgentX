---
tache: T006
statut: fait
evalue: T004
verdict: retenir
---
## Verdict
retenir — 9/9 cases DoD T004 re-prouvées
## DoD
- [x] terminal.py CONSIGNE_CHEF + PROGRAMME = §C6 verbatim ; commentaire :22-23 ; hunks dans :20-52 — `python3 .cache/eval-T006/verbatim.py → contrat L160-188: 29 lignes ; terminal L24-52 · lignes identiques: True · CONSIGNE_CHEF ==: True PROGRAMME ==: True · commentaire L22-23: ['# La session est le CHEF DE PROJET …', "# se présente comme tel, …/projet."]` · `git diff -U0 bin/terminal.py | rg '^@@' → @@ -25 +25,2 @@ · @@ -27,3 +28,3 @@ · @@ -30,0 +32,3 @@ · @@ -48 +52 @@`
- [x] `rg -c 'projet courant' bin/terminal.py` aucune sortie, code 1 — `rg -c … ; echo rc=$? → rc=1` (0 ligne)
- [x] sonnerie.py RE_PROJET/RE_CHEMIN/RE_ROLE_T/RE_STAT_T + projet_de 4 règles, ne lève jamais ; main ev["projet"], ordre §C5 — `git diff bin/sonnerie.py → 4 regex = §C5 L138-141 verbatim ; projet_de L45-64 try/except → "" ; L91 "projet" dernière clé` · `projet_de.py → exceptions: 0 / 19`
- [x] 3 commandes DoD L3 contrat.md:341-344 — `rg … → rc=1` · `projet_de('---\ntache: T001\nprojet: agentx-immeuble…','T001','eclaireur') → agentx-immeuble` · `projet_de('rien','','eclaireur'), projet_de('projet: inexistant-zz','T999','eclaireur') → '' ''` · main() → voir case 6
- [x] règle 3 prouvée, décompte candidats — `projet_de.py → T002 candidats 9 architecte 4 ['dashboard-direct', 'agentx-entreprise', 'agentx-immeuble', 'geolens-charge-3d'] en-cours 0 · r3 ambigu T002 architecte -> ''` (= déclaré T004)
- [x] main() sur EVENEMENTS redirigé, 1 ligne JSON/appel, 8 clés, projet présent ; réel inchangé — `main_ev.py → lignes: 2 (2 appels AgentX + 1 general-purpose muet) · 8 ['id','t','quoi','role','tid','statut','verdict','projet'] ×2 · ordre == §C5: True · run/evenements.jsonl avant 9009 après 9009`
- [x] `python3 -m py_compile bin/terminal.py bin/sonnerie.py` rc 0 — `→ rc=0`
- [x] `git diff --stat -- bin/` → terminal.py, sonnerie.py seuls — `git diff --stat -- bin/terminal.py bin/sonnerie.py → sonnerie.py | 30 +++++- · terminal.py | 14 +++-- · 2 files, 38+, 6-` ; `bin/dash.py | 202` présent à l'éval = T003 parallèle, hors évaluation (pack T006 L21)
- [x] result.md T004 selon « Format de sortie » — `wc → 37 lignes ≤ 60 ; sections Livré/Vérifié comment/Écarts/Pour la suite(4 ≤ 5)/Retour sur le pack ; statut: revue`
## Motif
∅
## Vérifié comment
python3 .cache/eval-T006/verbatim.py → lignes identiques: True · CONSIGNE_CHEF ==: True PROGRAMME ==: True · 'projet courant': 0 · ligne suivante 'TAMPON_MAX = 256 * 1024'
python3 .cache/eval-T006/projet_de.py → 19 cas, exceptions: 0 / 19 :
  r1 frontmatter -> 'agentx-immeuble' · r1 slug inexistant -> '' · r1 'projet: ../x' -> ''
  r2 'zz-nope puis agentx-immeuble' -> 'agentx-immeuble' · r2 'vault/projets/../taches/' -> ''
  r3 ambigu T002 architecte -> '' · r4 rien -> ''
  hostile tete None / tid None / role None / bytes / int(123,456,789) -> '' ×5
  hostile 1 Mo + 'projet: agentx-immeuble' -> 'agentx-immeuble'
  hostile tid '../x' / '../../../..' / '**' / '[' / 'T0\x0002' -> '' ×5
python3 .cache/eval-T006/r3.py →
  univoque T043 verificateur [('orthopro','fait')] -> 'orthopro'
  multi 1 en-cours T003 implementeur 4 candidats, 1 en-cours agentx-immeuble -> 'agentx-immeuble'
  multi ambigu T009 implementeur 7 candidats, 0 en-cours -> ''
python3 .cache/eval-T006/main_ev.py → {"id": "77ae2161614d8a05", "t": "17:30:19", "quoi": "agent-fini", "role": "implementeur", "tid": "T004", "statut": "revue", "verdict": "", "projet": ""} · {"id": "0c7d85c79e561237", …, "role": "architecte", "tid": "T002", "statut": "fait", "verdict": "", "projet": ""}
wc -c run/evenements.jsonl → 9009 avant · 9009 après
## Écarts
- écart constaté ≠ défaut : T004 L19 `projet_de('rien','T004','implementeur') → 'agentx-immeuble'` → re-joué `''` — T004 passé en-cours→revue, 3 implementeur T004 (orthopro, dashboard-direct, agentx-immeuble), 0 en-cours ; conforme §C5 règle 3
## Pour la suite
- règle 3 dépend de `statut: en-cours` au moment du hook : si le chef bascule le statut avant SubagentStop → `projet: ""`
- result.md réel sans `projet:` ni chemin `taches/` dans 1000 car. → `projet` vide fréquent (main_ev : 2/2 vides) ; ajouter `projet:` au gabarit result.md
- `projet_de` glob avec `tid` brut : main le borne par RE_TID `T\d{3}` ; appel direct hostile → '' (0 exception)
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅

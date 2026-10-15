---
tache: T005
statut: fait
---
## Livré
- .claude/skills/conventions-seagle/SKILL.md — 70 l., 5 sections, règles + [[note]]
- .claude/skills/conventions-orthopro/SKILL.md — 50 l., 5 sections, bloc Contrats verbatim
## Vérifié comment
wc -l conventions-seagle/SKILL.md conventions-orthopro/SKILL.md → 70 / 50 / 120 total
Bloc « Contrats » : 2 lignes Interdits + ligne Dépôts recopiées verbatim (relecture visuelle, NV par diff)
## Écarts
- lecture hors WL: ∅
- 1re tentative Bash (heredoc) refusée par garde_bash : texte « git push » dans le contenu → refait via Write
- notes classées d'après contenu : autosave-debounce-historique + rgl-v2 + playwright-getbyrole = OrthoPro ; playwright-getbyrole cité aussi côté Seagle (E2E) — générique
- Dépôts : Contrats dit branche `Ultime` ; ortho-front-outillage dit `master` → conflit conservé, NV
## Pour la suite
- seagle : « Conventions, pièges et commandes du site Seagle (seagle-website : Vite, prérendu, i18n 5 langues, a11y, e2e). À charger pour toute tâche sur le site Seagle. »
- orthopro : « Conventions, outillage et interdits OrthoPro (ortho-back NestJS, ortho-front Vite, dashboard grille RGL, e2e Playwright). À charger pour toute tâche OrthoPro ortho-back/ortho-front. »
- ortho-back : ∅ note source → skill couvre surtout ortho-front
- trancher branche `Ultime` vs `master` (ortho-front)
## Retour sur le pack
- Manquait: branche réelle ortho-front (Ultime vs master) ; note ortho-back ; avertissement hook sur « git push » dans heredoc | Inutile: ∅

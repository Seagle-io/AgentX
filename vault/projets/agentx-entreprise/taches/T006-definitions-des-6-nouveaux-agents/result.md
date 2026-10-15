---
tache: T006
statut: fait
---
## Livré
- .claude/agents/evaluateur.md — format result.md verbatim, privé d'édition
- .claude/agents/relecteur.md — constats localisés, APPROUVE|CHANGEMENTS, sans Edit
- .claude/agents/testeur.md — tests seuls, preuve, skill webapp-testing
- .claude/agents/designer.md — kit d'abord, AA/320 px, skill frontend-design
- .claude/agents/securite.md — constats gravité·chemin·vecteur·repro, sans Edit
- .claude/agents/devops.md — interdits hook → bloque + commande exacte
## Vérifié comment
- `rg -c "^name: " .claude/agents/*.md` → 11 fichiers, tous `:1`
- `git diff --stat -- .claude/agents/{eclaireur,architecte,implementeur,verificateur}.md` → (vide)
- `rg -c "délibérément privé de l'outil d'édition" .claude/agents/` → verificateur, securite, relecteur, evaluateur : 1 chacun
- `head -8` testeur/designer → `skills:` + `  - webapp-testing` / `  - frontend-design`
- frontmatters name/description/tools/model recopiés du pack ; relecture `head -6` NV (écriture directe)
## Écarts
- ∅
## Pour la suite
- agents chargés au démarrage de session : relancer Claude Code avant dispatch
- `description` evaluateur/relecteur/etc. non testées en dispatch réel
- evaluateur.md : format result.md ≠ « Format de sortie » générique (sans `## Livré`/`## Pour la suite`) — conforme au pack
## Retour sur le pack
- Manquait: budget de lectures hors WL des 5 autres rôles (choisi 3, 5 pour securite) ; formulation de la phrase « privé d'édition » pour relecteur/securite
- Inutile: ∅

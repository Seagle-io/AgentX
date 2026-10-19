---
projet: {{PROJET}}
maj: {{DATE}}
tags: [env]
---

# Environnement — {{PROJET}}

## Dépôts et branches
## Lancer, tester, linter
## Comptes et données de test
## Versions
## Ports, URL, fuseau
- occupés : `ss -ltn` à blanc en tête de DoD, coller la sortie
- plage réservée : port = 4000 + n° de tâche (T013 → 4013) ; `--strictPort` ; jamais le port d'un autre
## Processus
- arrêt par pid seul (`kill <pid>` du pid lancé) ; `pkill`/`killall` interdits
- shell `fish` : `$!` ≠ bash → lancer via `bash -c '... & echo $!'`
## Rouge d'avance
## Interdits
## Voie de repli (classifieur refuse)
- `cp` → Write ; `md5sum` → `python3 -c "import hashlib,sys;print(hashlib.md5(open(sys.argv[1],'rb').read()).hexdigest())" <f>`
## Bancs et scripts de référence

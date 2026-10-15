---
name: outils-test
description: Outils réutilisables de celui qui casse — banc d'impression (rendu /print réel → PDF/PNG), fixtures de données limites, SSR de composants, mesures géométrie/traits/couleur, banc de page sans serveur. À charger d'office par le vérificateur et le critique avant d'écrire le moindre script de test.
---

# Outils de test (`/home/sylvain/Documents/AgentX/outils-test/`)

Génériques, réutilisables d'un projet à l'autre. Ce qui est propre à un projet vit dans
`<outil>/projets/<slug>…` ; projet choisi par `--projet <slug>` | env `BANC_PROJET` |
l'unique `projets/*.json`. Sorties : `--out` relatif → `<racine>/.sorties/<out>` (disque, gitignoré ; env `BANC_SORTIES`) ;
convention `--out <projet-vault>/<TID>/<nom>` (slug de `vault/projets/<slug>`, ≠ `--projet` du banc ; ex. `--out exercices/T412/apres` : vault `exercices`, banc `--projet orthoworkspace`) ; purge 48 h sans écriture ou TID clos. PNG recadrés, jamais `.pgm`.
Lancer les bancs depuis `<racine>/outils-test/…`, jamais une copie dans tmp.

**Règle : on n'écrit pas un banc, on s'en sert.** Un outil manque ou ne suffit pas →
copie-le dans ton dossier de sortie, adapte, et signale-le dans `## Retour sur le pack`.
Ne modifie jamais `outils-test/` toi-même.

## Banc d'impression — rendu `/print` réel
```
B=/home/sylvain/Documents/AgentX/outils-test/banc-impression
node $B/shot.mjs --out <projet-vault>/<TID>/run CODE…                       # demoItems
node $B/shot.mjs --out <projet-vault>/<TID>/run --fixture CODE/<nom> CODE   # fixture du banc
node $B/shot.mjs --out <projet-vault>/<TID>/run --fixture /chemin/fx.json CODE
node $B/shot.mjs --out <projet-vault>/<TID>/run --all-print                  # tous les formats imprimables
```
- stdout `CODE pages=N errs=[...]` ; sortie `<CODE>-enonce|corrige.pdf`, `-p<N>.png` (110 dpi), `<CODE>-ecran-1440.png`
- `--out` relatif → `.sorties/<out>` (`<projet-vault>/<TID>/<nom>`) ; 1 serveur Vite partagé (5200) pour tous, `--port` ignoré ; tu ne lances aucun serveur
- fixture : `{ "CODE": { "items": [...], "link"?: false, "metadata"?: {}, "params"?: {}, "title"?: "…" } }` ; fixtures existantes : `$B/fixtures/<slug>/INDEX.md` (lis l'index, pas les 400 fichiers) ; fixture neuve → dans ton `<dir>`
- détail : `$B/LISEZMOI.md`

## Attaque de livraison — sans navigateur
```
A=/home/sylvain/Documents/AgentX/outils-test/attaque-livraison
node --import $A/alias.mjs --test x.test.ts      # tests node avec alias @/ du front
node $A/ssr.mjs cas.mjs [sortie.json]            # SSR composants × cas × énoncé/corrigé
```

## Mesures
```
M=/home/sylvain/Documents/AgentX/outils-test
node $M/mesure-geometrie/g2.mjs <port libre ≠ 5200> <fx.json|-> CODE [corrige] > o.json   # planches/points en mm
python3 $M/mesure-geometrie/an.py o.json      # traits < 2 mm d'un nœud, chevauchements, hors cadre
python3 $M/mesure-traits/lines.py p.png [dpi] # traits horizontaux : y x0 x1 mm
python3 $M/mesure-couleur/sat.py p.png…       # pix_couleur=N (N&B : 0 attendu)
```
Mesure > œil : un défaut s'écrit avec un nombre (mm, pt, px, nb de pixels).

## Banc de page — front buildé, API simulée, sans serveur
```
node /home/sylvain/Documents/AgentX/outils-test/banc-liste/banc.mjs --dist <dist> --api <api.mjs> --out <préfixe> [--scenario <scenario.mjs>] [--chemin /exercises]
```

## Interdits
- lire `node_modules/` (exécution seule) ; lancer/arrêter un serveur de dev ; `rm` hors de ton dossier de sortie
- identifiants réels dans un fichier, une fixture ou un result

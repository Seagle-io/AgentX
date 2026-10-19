---
pack: {{ID}}
projet: {{PROJET}}
role: critique
cree: {{DATE}}
---

# Pack {{ID}} — {{TITRE}}

> Seule source de vérité de l'agent {{ID}}. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.
> Pack type critique : le chef écrit Mission, DoD spécifiques, WL, Contrats ; le reste est constant.

## Mission
Juger le rendu de TODO-PACK (TID) en captures et mesures ; constats seulement, 0 correction.
Vue : <URL> · <sélecteur racine> — OBLIGATOIRE, nommer la vue que l'humain regarde (sinon capture hors sujet) :
| Lieu | URL · sélecteur |
|---|---|
| immeuble (0 todo, 0 choix) | `#/` |
| étage · panneau « Vos choix » (`ChoixPanel`) | `#/floor/<slug>` · `[data-testid=choix-panel]` |
| barre « À faire » = « la barre Vos choix » de l'humain (`TodoPanel`) | `#/floor/<slug>` · colonne droite, `[data-testid=todo-choix]` |
| tiroir terminal | `.xterm` |

## Definition of Done
- [ ] captures par viewport 390 / 768 / 1024 / 1440 (+ états : replié, ouvert, survol, vide, erreur : TODO-PACK), chemins `.sorties/` collés
- [ ] chaque capture LUE image par image, observation 1 ligne par image
- [ ] ratios de contraste calculés (formule collée) : texte ≥ 4,5:1, bordures/contrôles ≥ 3:1
- [ ] mesures DOM : `scrollWidth ≤ innerWidth`, `boundingBox` cibles ≥ 40×40 px, troncatures (`scrollWidth` vs `clientWidth`)
- [ ] chaque défaut antérieur de la cible : RÉSOLU | KO (capture + mesure)
- [ ] défauts classés `bloquant|majeur|mineur|antérieur`, du plus grave au plus bénin, capture + mesure
- [ ] verdict en tête de `## Livré` ; 0 correction
- [ ] toute DoD numérique suivie de `— HEAD : <valeur>` (mesure sur HEAD au dispatch) : TODO-PACK
- [ ] `result.md` rempli selon « Format de sortie »

## Variante ciblée
- quand : contre-critique après correctif d'une critique complète (syndicat T097 rev. 7 : ciblée T056 433k vs complète méd 712k)
- modèle sonnet ; banc et scénario du run précédent en L (0 réécriture)
- DoD : liste `Dn` reprise du résultat précédent ; par `Dn` : `RÉSOLU|KO` + 1 capture ; régressions nommées (vue touchée seulement)
- 0 balayage 4 viewports hors `Dn` ; le chef lance `make invariants` après build

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `TODO-PACK` (sources du rendu) | L | comprendre |
| `TODO-PACK` (scénario banc / script) | E | captures |
| `TODO-PACK` (result.md de la cible) | L | défauts antérieurs |

## Contrats
Signatures, formats, clés : RECOPIÉS verbatim + `chemin:L` (jamais « voir fichier »). Type ou fichier absent de la WL ⇒ le chef l'ajoute. Sinon `∅`.
```
TODO-PACK (sélecteurs, viewports, jeton/compte de test, routes interceptées)
```

## Décisions actées
- TODO-PACK — raison ≤ 8 mots

## Hors périmètre
- logique, tests, corriger, modifier api/scénarios d'origine/banc/dist/sources
- hors zone critiquée
- TODO-PACK

## Environnement
- service: <nom> → <url> — à activer si le pack en dépend : TODO-PACK ou ∅
- serveur fourni par le chef (`./bin/agentx env up <svc>`) ; agent : n'en lance aucun ; injoignable ⇒ `bloque`
- racine / `cd` / versions exactes des runs de référence : TODO-PACK
- banc (skill `outils-test`) : 1 Chromium, fermé en fin ; interception `/api/term/*` et `api/run` obligatoire ; serveurs de l'humain jamais touchés
- dist / build jugé : `ls -la --time-style=full-iso` ≥ dernier édit ; sinon `bloque`
- `garde_bash` refuse : `vite` sans `build`, `npm run dev`, git push, migrations, serveurs de dev
- Outils refusés : `sed -i`, git modifiant l'arbre, `rm -r`, `npm run format`
- 0 écriture `/tmp` ⇒ `.sorties/{{PROJET}}/{{ID}}/` ; `python3 -I` pour tout script lisant des données téléchargées

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read (images), Grep, Glob, Write (scénario + result.md), Bash(node:*, python3 -c:*, rg:*, ls:*, kill de ses PID)
- Arbre partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`, jamais `rm` hors ton dossier.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack — **écrit avec l'outil Write** (un rendu seulement affiché est perdu) — dense, ≤ 50 lignes, sections exactes :

```markdown
---
tache: {{ID}}
projet: {{PROJET}}
statut: fait | bloque
verdict: OK | DÉFAUTS
---
## Livré
- verdict: OK | DÉFAUTS
- D1 [bloquant|majeur|mineur|antérieur] `capture` — constat + mesure
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD non cochée: n — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```

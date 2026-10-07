---
pack: T009
projet: recherche-floue
role: scribe
cree: 2026-10-04
---

# Pack T009 — Capitaliser la recherche floue

> CONTRAT : ce fichier est **la seule source de vérité** de l'agent qui exécute
> T009. S'il doit ouvrir autre chose que la whitelist ci-dessous, le pack est
> raté. Tout ce qui est écrit ici est déjà digéré : pas de « va lire le brief ».

## Mission
<!-- A REMPLIR : 1 à 3 phrases. Un verbe d'action, un livrable, un critère.
     Mauvais : « améliorer l'authentification ».
     Bon : « Ajouter un refresh de token dans `auth/session.ts` pour que
     la session survive à un redémarrage serveur, sans toucher au login. » -->

## Definition of Done
<!-- A REMPLIR : checklist binaire, vérifiable par un tiers sans contexte.
     Chaque ligne doit pouvoir être cochée par une commande ou une lecture. -->
- [ ] …
- [ ] …
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
<!-- A REMPLIR : whitelist exhaustive, max 12 entrées, chemins en `backticks`.
     Précise la plage de lignes quand le fichier est gros, et le droit :
     (L) lecture seule, (E) écriture autorisée. -->
| Chemin | Droit | Pourquoi |
|---|---|---|
| `…` | E | … |
| `…` | L | … |

## Contrats
<!-- A REMPLIR : les signatures / schémas / formats que l'agent doit respecter,
     RECOPIÉS ICI (pas référencés). C'est ce qui évite d'ouvrir 5 fichiers
     pour deviner une interface. Mets « aucun » si sans objet. -->
```
…
```

## Décisions actées
<!-- A REMPLIR : une ligne par décision déjà prise qui contraint cette tâche.
     Format : « <décision> — parce que <raison en 8 mots> ». Pas de débat ici :
     c'est tranché. Lien vers decisions.md si l'agent a besoin du détail. -->
- …

## Hors périmètre
<!-- A REMPLIR : ce que l'agent NE doit PAS faire, même si ça le démange.
     C'est la section qui empêche le scope creep et les diffs de 800 lignes. -->
- …

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : <!-- A REMPLIR : ex. Read, Edit, Bash(pytest:*) -->
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
Écris `result.md` à côté de ce pack, avec exactement ces sections :

```markdown
---
tache: T009
statut: fait | bloque
---
## Livré
(ce qui existe maintenant et n'existait pas — chemins:lignes)

## Vérifié comment
(commande lancée + sortie réelle, ou « non vérifié » — ne jamais prétendre)

## Écarts
(lectures hors whitelist, libertés prises, DoD non cochée et pourquoi)

## Pour la suite
(≤ 5 lignes : ce que le prochain agent doit savoir. C'est tout ce qui
 remontera au chef de projet.)

## Retour sur le pack
- Manquait : …
- Inutile : …
```

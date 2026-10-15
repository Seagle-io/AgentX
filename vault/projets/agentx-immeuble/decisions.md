# Decisions — AgentX immeuble : un étage par projet

Une decision = un bloc. Jamais de reecriture, on ajoute.

## 2026-10-15 — immeuble : 1 state.json, résumé par étage en cache, étage détaillé par ?projet=
- **Contexte** : poll 2 s ; construire_etat 0.07 s × 8 étages = 0.56 s > budget 300 ms (brief) → 1 seul détail par poll.
- **Choix** : `state.json` = global + `immeuble` (résumé par étage, cache `_bloc_projet` par signature mtime_ns/taille) + détail de l'étage `?projet=` ; page persiste l'étage en hash `#/<slug>`, défaut épingle puis activité ; todo agrégée étiquetée `projet`, plafond 40 ; événements gagnent `projet` (frontmatter → chemin → TID+rôle unique) ; sonde rouge = toit ; dormance 7 j ; contrat [[contrat]] (T002).
- **Écarté** : A recalcul complet ×N (0.56 s à 8, ×N JSON) ; C route `/immeuble.json` séparée (2 boucles, coupe ≠ étage au même tic) ; localStorage (non partageable, global aux onglets).
- **Conséquence** : coupe + étage cohérents à chaque tic, coût ≈ constant en N ; toute logique par étage passe par `_bloc_projet` ; `_todo` perd `personnel` (RH émis 1 fois, au toit).
- **À revoir si** : médiane chaude > 300 ms à 8 étages ; besoin d'afficher 2 étages détaillés ensemble ; supervision.json gagne un lien sonde→projet (alerte sonde par étage) ; result.md gagne `projet:` en frontmatter (règle 1 sonnerie suffit).

## 2026-10-15 — après éval T007 (L1 retenu)

- **Décision** : §C1 prime sur §C7 L230 — un projet clos sélectionné par `?projet=` est détaillé mais n'est jamais un étage (`blocs` = ouverts seuls).
- **Décision** : `_doctor_rapide` lit les blocs en cache (MAY de §C7 devenu MUST : sinon context.md relus à chaque poll).
- **Décision** (2026-10-15, humain) : vue d'ensemble animée de l'immeuble entier — supersède le hors-périmètre « immeuble 3D » ; vue IMMEUBLE par défaut sans hash, ÉTAGE sur `#/slug` (T011).
- **Décision** (2026-10-15, après T012) : une action lancée depuis la todo agrégée du toit peut viser un autre étage que celui affiché (l'item porte son étiquette d'étage) ; toute action est refusée pendant une bascule d'étage (`IMMEUBLE.transit`) ; les actions des lignes de tâche visent toujours l'étage affiché.

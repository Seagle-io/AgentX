---
pack: T004
projet: refresh-session
role: implementeur
cree: 2026-10-04
---

# Pack T004 — Rafraîchir le token avant expiration

> Pack de référence. Il n'est pas dispatchable (ses chemins sont fictifs) : il est
> là pour montrer la densité attendue. Remarque ce qu'il ne contient **pas** :
> aucun « va voir le brief », aucun fichier à explorer, aucun débat de conception.
> Tout est tranché, recopié, borné, en langage dense. ~85 lignes pour une tâche réelle.

## Mission
Refresh du token dans `auth/session.ts` si `exp` < 60 s → session survit à un
redémarrage serveur. `auth/login.ts` intact.

## Definition of Done
- [ ] `getValidToken()` renvoie un token dont `exp` est à plus de 60 s, en
      rafraîchissant si besoin
- [ ] Deux appels concurrents à `getValidToken()` déclenchent **un seul** appel
      réseau (déduplication par promesse partagée)
- [ ] Un échec de refresh propage `SessionExpiredError` sans boucler
- [ ] `npm test -- session` passe, sortie collée dans `result.md`
- [ ] `git diff --stat` ne touche que les fichiers marqués E ci-dessous
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `auth/session.ts` | E | le cœur du changement, `getValidToken` ligne 40-78 |
| `auth/errors.ts` | E | y ajouter `SessionExpiredError` (suit le modèle ligne 12) |
| `auth/session.test.ts` | E | les 3 cas de la DoD |
| `auth/client.ts` | L | `postRefresh()` existe déjà, signature ci-dessous |
| `auth/types.ts` | L | `Session`, `TokenPair` |

## Contrats
Recopiés : n'ouvre aucun fichier pour les retrouver.

```ts
// auth/client.ts:88 — déjà implémenté, ne pas modifier
export function postRefresh(refreshToken: string): Promise<TokenPair>
// jette HttpError (status 401 si refresh révoqué) ; AUCUNE retentative interne

// auth/types.ts:15
export type TokenPair = { access: string; refresh: string; exp: number } // exp = epoch secondes

// à produire, signature imposée
export function getValidToken(s: Session): Promise<string>
```

## Décisions actées
- Le refresh token reste en mémoire, pas en `localStorage` — surface XSS
  (voir `decisions.md`, 2026-10-02).
- Marge de 60 s avant expiration — décalage d'horloge client observé en prod.
- Déduplication par promesse partagée, pas par mutex — ADR 2026-10-03.

## Hors périmètre
- Le chemin de login et l'écran de connexion.
- La rotation du refresh token côté serveur (autre équipe, T011).
- Le typage de `auth/legacy.ts` — c'est une horreur connue, on n'y touche pas.
- Toute nouvelle dépendance npm.

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write, `Bash(npm test:*)`, `Bash(git diff:*)`
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T004
statut: fait | bloque
---
## Livré
- chemin:L1-L2 — fait (≤ 8 mots)
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```

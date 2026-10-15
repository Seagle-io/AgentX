---
pack: T058
projet: geolens-viewer
role: implementeur
cree: 2026-10-08
---

# Pack T058 — D15-texte : politique de confidentialité alignée sur le système réel

> Seule source de vérité de l'agent T058. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Remplacer dans `web/src/pages/Confidentialite.tsx` les 5 passages listés par les textes verbatim ci-dessous (destinataires, durées, droits, sécurité, date de mise à jour), pour que la page ne promette plus que ce que le système fait après les lots D15 ; 0 autre modification. G = /home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online.

## Definition of Done
- [ ] P1-P5 remplacés à l'identique du contrat (JSX valide, mêmes balises `<b>`, `<li>`, `<td>` que l'existant)
- [ ] `rg -n "DPA|Transactional Email|réseau|privilèges minimaux" web/src/pages/Confidentialite.tsx` → ∅ (sortie collée)
- [ ] `npm --prefix web run typecheck` → exit 0 ; `npm --prefix web run lint` → 0 erreur sur ce fichier ; `npm --prefix web test` → verts — sorties collées
- [ ] `git -C G diff --stat -- web/src/pages/Confidentialite.tsx` collé : 1 fichier
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/Geolens/geolens-web-feat-viewer-online/web/src/pages/Confidentialite.tsx` | E | 141 l ; :21, :85-127 |

## Contrats
P1 — :21 date
```
ACTUEL : dernière mise à jour : 28 juin 2026
CIBLE  : dernière mise à jour : 8 octobre 2026
```
P2 — :91-92 (2 `<li>` de « 4. Destinataires »)
```jsx
<li><b>Scaleway SAS</b> (hébergement, stockage, base de données) — données hébergées <b>en France</b>.</li>
<li><b>Prestataire d'envoi d'e-mails</b> (invitations, réinitialisation de mot de passe) — Union européenne.</li>
```
P3 — :105-107 (3 `<tr>` du tableau « 6. Durées de conservation »)
```jsx
<tr><td>Compte utilisateur</td><td>Supprimé automatiquement après <b>3 ans sans connexion</b> (ou sur demande)</td></tr>
<tr><td>Livrables projet</td><td>Fin du contrat <b>+ 1 an</b>, puis suppression (sauf demande de suppression anticipée)</td></tr>
<tr><td>Journaux de connexion / audit (dont adresse IP et navigateur)</td><td><b>12 mois</b>, puis suppression automatique</td></tr>
```
P4 — « 7. Vos droits » : garder le `<p>` existant (:111-117) tel quel, AJOUTER juste après :
```jsx
<p>
  Vous pouvez <b>télécharger une copie de vos données</b> (format JSON, droits d'accès et de
  portabilité) depuis la page <b>Mon compte</b>. Les autres droits (dont la rectification)
  s'exercent par e-mail à l'adresse ci-dessus. La <b>limitation</b> se traduit par la
  désactivation du compte. Lors de l'<b>effacement</b> d'un compte, les journaux d'audit qui le
  concernent sont pseudonymisés.
</p>
```
P5 — « 8. Sécurité » : remplacer le `<p>` :121-126 par
```jsx
<p>
  Mesures techniques et organisationnelles (art. 32 RGPD) : <b>chiffrement en transit
  (HTTPS)</b> et <b>au repos</b> (assuré par l'hébergeur), connexion à la base de données
  <b> chiffrée (TLS)</b>, <b>mots de passe hachés</b> (argon2id), <b>contrôle d'accès par
  rôle</b>, <b>sauvegardes automatiques</b> de la base de données.
</p>
```

## Décisions actées
- texte = état réel après D15 — decisions.md D15/D17 ; DPA, réseau privé retirés tant que non vérifiés (console)
- au repos + sauvegardes conservés : promis par l'hébergeur managé, vérification console = humain
- 0 changement de structure de la page

## Hors périmètre
- CGU.tsx, autres pages, styles ; LEGAL_DOCS_VERSION (server.ts, autre lot)
- push, remote, PR, commit — D5 ; git stash/checkout/reset/clean

## Environnement
- node v22.22.1 ; web/node_modules ; `npm --prefix web run typecheck` ; `npm --prefix web run lint` (1 warning préexistant Admin.tsx:389, hors fichier) ; vitest env node
- G sous git ; un autre agent écrit api/ en parallèle

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Bash(npm --prefix web run typecheck, npm --prefix web run lint, npm --prefix web test, git diff, rg)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean` — d'autres agents écrivent en même temps.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T058
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

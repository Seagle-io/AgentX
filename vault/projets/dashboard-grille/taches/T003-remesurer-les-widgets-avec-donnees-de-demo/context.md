---
pack: T003
projet: dashboard-grille
role: eclaireur
cree: 2026-10-08
---

# Pack T003 — Remesurer les widgets avec données de démo

> Seule source de vérité de l'agent T003. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Rejouer le harnais de mesure T002 (`$S/mesure/run.mjs`) sur le compte de test qui porte maintenant les données de démo (8 patients, 132 consultations, 8 factures) → hauteurs naturelles réelles à 240/320/480 px et largeur mini lisible, pour les 49 widgets ; expliquer les 7 absents.

## Definition of Done
- [ ] `run.mjs` réutilisé (copie `$S/mesure2/`), même méthode : largeur forcée 160/240/320/480, hauteur naturelle par dichotomie (corps en `container-type:size`), troncature hors ellipsis volontaire de titre
- [ ] ids de cellule en UUID ; `y` ≤ 500 ; cases `h:10`
- [ ] 7 widgets absents en T002 (contact-code, quick-reply, recent-documents, revenue, transmissions, unpaid-invoices, unread-messages) : cause pour chacun (rg `requires:` / `optional:` dans leur `index.tsx` + module de licence manquant ?) ; mesurés s'ils apparaissent
- [ ] tableau final : `widget | larg. min px | haut. @240 | @320 | @480 | Δ vs T002 | état (données / vide / erreur)`
- [ ] 1 PNG par widget à sa largeur mini + `weather`, `today`, `activity`, `week-grid`, `forum` à 240/320/480 dans `$S/mesure2/png/`
- [ ] fin : disposition du compte de test = 1 onglet « Accueil » vide (le PUT `{tabs:[]}` est refusé : poser 1 onglet sans cellule)
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/d4a2126e-085a-48b3-92aa-2bb44b582a4a/scratchpad/mesure/` | L | harnais T002, out.json |
| `/tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/d4a2126e-085a-48b3-92aa-2bb44b582a4a/scratchpad/mesure2/` | E | nouvelle mesure |
| `/tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/d4a2126e-085a-48b3-92aa-2bb44b582a4a/scratchpad/orthopro-session.json` | L | `auth_token` du compte de test — jamais affiché |
| `vault/projets/dashboard-grille/taches/T002-mesurer-le-contenu-reel-de-chaque-widget-au-navi/result.md` | L | mesures à vide, pour le Δ |
| `~/Documents/Workspace/OrthoPro/ortho-front/src/modules/dashboard/components/widget/` | L | rg `id: '`, `requires:`, `optional:` seulement |

## Contrats
```
DOM réel (T002) : div.react-grid-item[data-testid=dash-cell][data-widget] > div.overflow-auto > section.h-full > [en-tête 57 px, div.flex-1 corps]
PUT /api/dashboard/layout { tabs: [{ id: uuid, name, color: null, cells: [{ id: uuid, widget, x, y, w, h, config: {} }] }] } — ≥ 1 onglet, y ≤ 500
front http://localhost:5173 · session : localStorage 'auth_token' sur cette origine avant goto('/dashboard')
```
`$S` = `/tmp/claude-1000/-home-jdrac-Documents-Workspace-AgentX/d4a2126e-085a-48b3-92aa-2bb44b582a4a/scratchpad`

## Décisions actées
- compte de test seul ; données de démo posées par le chef (seed `DEMO_PRACTITIONER_EMAIL`) — ne pas relancer de seed
- viewport 1440×900, zoom 100 %

## Hors périmètre
- Écrire dans ortho-front/ortho-back ; proposer des tailles en modules ; lancer un seed, une migration, un serveur.

## Environnement
- front :5173 et back :3000 tournent (master) — ne pas relancer
- Chrome système `/usr/bin/google-chrome` ; `playwright` depuis `~/Documents/Workspace/OrthoPro/ortho-front/node_modules` ; node 24 `~/.nvm/versions/node/v24.15.0/bin`
- messagerie non configurée en local (clé absente) : `unread-messages`/`quick-reply` peuvent être en erreur → noter, ne pas contourner

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Write ($S/mesure2), `Bash(node:*)`, `Bash(curl -s:*)`, `Bash(rg:*)`, `Bash(ls:*)`, `Bash(cp:*)`
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 120 lignes, sections exactes :

```markdown
---
tache: T003
statut: fait | bloque
---
## Livré
- tableau des mesures (1 ligne par widget) ; chemins des PNG
## Vérifié comment
commande → sortie brute (extrait) | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison | DoD n non cochée — raison
## Pour la suite
- ≤ 5 lignes, collables dans un pack. Seule section lue par le chef.
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```

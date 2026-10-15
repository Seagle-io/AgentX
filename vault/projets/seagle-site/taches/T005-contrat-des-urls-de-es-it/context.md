---
pack: T005
projet: seagle-site
role: architecte
cree: 2026-10-14
---

# Pack T005 — Contrat des URLs /de /es /it

> Seule source de vérité de l'agent T005. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Trancher le schéma d'URL de/es/it et écrire le contrat (routes, détection de langue par l'URL, prérendu, hreflang, sitemap, canonical, og:locale) découpé en 2-3 tâches d'implémentation de ≤ 12 fichiers chacune, sans changer une seule URL fr/en existante.

## Definition of Done
- [ ] contrainte qui décide nommée en 1 ligne
- [ ] 2-3 options comparées (dont « le faire bêtement ») : coût maintenant / dans un an / ce qu'elle interdit — dont préfixe `/de/` + slugs anglais vs slugs traduits
- [ ] recommandation unique ; point de non-retour nommé
- [ ] contrat verbatim dans `## Livré` : type `Locale` élargi, forme de `routes`, signature de `getLocalizedPath` (**inchangée** : 97 appels / 26 fichiers), `langFromPath(pathname)`, règle de `useLanguageRedirect` (URL → langue, sans boucle), `useHreflang` 5 langues + x-default, sitemap, canonical (`usePageMeta`), `<html lang>` et `og:locale` par page
- [ ] source unique des routes pour `routes.ts`, `prerender.mjs` et `vite.config.js` (aujourd'hui 3 listes à la main) : format + chemin du fichier
- [ ] interaction avec le chargement des langues à la demande (contrat T006 ci-dessous) : qui attend quoi au prérendu d'une URL `/de/…`
- [ ] 12 liens internes en dur (dont 4 `/lab`) et `IMMERSIVE` (`header.tsx:150`) : règle
- [ ] découpage : 2-3 tâches, chacune = WL ≤ 12 chemins E/L + DoD vérifiable ; aucun fichier E dans 2 tâches de la même vague
- [ ] décision ajoutée en append à `decisions.md`
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `/home/jdrac/Documents/Workspace/AgentX/vault/projets/seagle-site/taches/T002-carte-i18n-prerendu-hreflang-json-ld-et-lab/result.md` | L | carte T002 complète (routage, prérendu, hreflang, liens en dur) |
| `~/Documents/Workspace/seagle-website/src/lib/routes.ts` | L | 37 l., 21 clés fr/en |
| `~/Documents/Workspace/seagle-website/src/lib/i18n.ts` | L | init langue (sera modifié par T006, voir Contrats) |
| `~/Documents/Workspace/seagle-website/src/hooks/useLanguageRedirect.ts` | L | URL→langue, binaire fr/en |
| `~/Documents/Workspace/seagle-website/src/hooks/useHreflang.ts` | L | fr/en/x-default |
| `~/Documents/Workspace/seagle-website/src/hooks/usePageMeta.ts` | L | canonical, og:url |
| `~/Documents/Workspace/seagle-website/prerender.mjs` | L | ROUTES L23-59, langue forcée L93-96 |
| `~/Documents/Workspace/seagle-website/vite.config.js` | L | sitemap L15-85 |
| `~/Documents/Workspace/seagle-website/src/components/ToogleLanguage.tsx` | L | sélecteur |
| `~/Documents/Workspace/seagle-website/src/components/Header/header.tsx` | L | IMMERSIVE L150, liens |
| `~/Documents/Workspace/seagle-website/src/App.tsx` | L | déclaration des routes |
| `~/Documents/Workspace/AgentX/vault/projets/seagle-site/decisions.md` | E | append seulement |

## Contrats
T006 (en cours, même vague) livre dans `src/lib/i18n.ts` :
```ts
export const SUPPORTED_LANGUAGES = ['fr', 'en', 'es', 'de', 'it'] as const
export type SupportedLang = typeof SUPPORTED_LANGUAGES[number]
/** Résolue quand la langue initiale et le repli fr sont chargés. */
export const i18nReady: Promise<unknown>
// backend i18next inline : changeLanguage(l) charge ./local/<l> puis bascule
// langue initiale : localStorage i18nextLng → navigator → 'fr' ; main.tsx rend après i18nReady
```
`getLocalizedPath` actuel (routes.ts:31) :
```ts
export const getLocalizedPath = (lang: string | undefined, key: RouteKey) => {
	const locale: Locale = lang?.startsWith("en") ? "en" : "fr"
	return routes[key][locale]
}
```
Hébergement : nginx sur VPS (rsync de `dist/`), config non lisible → chaque URL doit exister en fichier prérendu `dist/<route>/index.html`.
T009 (/lab) est suspendue : prévoir la clé `lab` dans le contrat sans en dépendre.

## Décisions actées
- de/es/it reçoivent une URL propre, prérendue, hreflang — décision humain 2026-10-14
- URLs fr/en existantes inchangées — déjà indexées
- textes de/es/it déjà traduits dans `src/lib/local/` — 0 nouvelle traduction de page
- 0 nouvelle dépendance
- visuels ASCII intouchables (`src/components/ui/ascii-*`, `*.data.ts`, `src/components/kit/Ascii*`) — décision humain 2026-10-14
- design intouchable : kit `src/components/kit/`, ∅ néon/halo/grille/blur décoratif ; Mona Sans + JetBrains Mono
- nouvelle clé i18n → 5 langues (`src/lib/local/{fr,en,de,es,it}/`) ; textes existants non réécrits

## Hors périmètre
- écrire du code de production
- traductions de slugs si l'option retenue n'en a pas besoin
- JSON-LD, Lab, bundle, a11y

## Environnement
- dépôt `~/Documents/Workspace/seagle-website`, Vite 7.3.6, react-router 7, i18next 25 ; prérendu Playwright sur :4173 (`prerender.mjs`)
- aucun build, aucun lancement : lecture seule hors `decisions.md` et `result.md`

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Grep, Glob, Write/Edit sur `result.md` et `decisions.md` (append)
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 120 lignes (contrat inclus), sections exactes :

```markdown
---
tache: T005
statut: fait | bloque
---
## Livré
- contrat en bloc de code verbatim ; découpage en tâches (titre, WL, DoD)
## Vérifié comment
commande → sortie brute | NV — raison
## Écarts
- ∅ | lecture hors WL: chemin — raison
## Pour la suite
- ≤ 5 lignes : le choix et l'interdit qui en découle
## Retour sur le pack
- Manquait: ∅ | Inutile: ∅
```

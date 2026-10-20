# shared/ui

Kit fermé, modèle `button.tsx` : union par axe + `Record` de classes, `base`, `cn(base, …, className)`, props natives répandues, tokens d'`index.css` seulement, 0 chaîne visible, entrée inconnue ⇒ rendu de secours. Export défaut par fichier.

| Composant | Fichier | Props propres | Balise |
|---|---|---|---|
| `Button` | `button.tsx` | `variant` primary·secondary·destructive·warning·outline·ghost·link · `size` sm·default·lg·icon · `href` ⇒ `<a>` | `button` / `a` |
| `Text` | `text.tsx` | `variant` h1·h2·h3·body·muted·mono·caption · `as` p·span·div·code | selon variante |
| `Badge` | `badge.tsx` | `variant` neutral·accent·success·warning·error · `size` sm·default · `pulse` (seule animation infinie, ≤ 8 à l'écran) | `span` |
| `Panel` | `panel.tsx` | `variant` default·subtle·alert · `padding` none·sm·default | `section` |
| `Gauge` | `gauge.tsx` | `value` 0..1 clampé (NaN ⇒ 0) · `tone` accent·success·warning·error·muted · `orientation` horizontal·vertical · `label` (aria) | `div[role=meter]` |
| `Input` | `input.tsx` | `variant` default·error · `inputSize` sm·default (`size` natif intact) | `input` |
| `Icon` | `icon/` | `name` (clé `ICONS`, inconnu ⇒ `resultat`) · `size` sm·md·lg · `title` ⇒ annoncé, sinon `aria-hidden` | `svg` |
| `Modal` | `modal.tsx` | `open` · `onClose` · `title` (annoncé, reçoit le focus) · `children` | `dialog` |
| `Tabs` | `tabs.tsx` | `label` (tablist) · `items` {cle, libelle, teinte accent·success·warning·error} · `actif` · `onSelect` · `disabled` | `div[role=tablist]` > `button[role=tab]` |

Règles : 0 couleur brute (`#…`, `red-500`…) · 0 `animate-` hors `Badge pulse` · désactivé visible sans `pointer-events-none` · commentaire en français sur chaque choix non évident · pas de test unitaire (tsc + lint + critique visuelle).

S'appuie sur : shared/lib/utils

← [[../README.md]]

---
pack: T007
projet: seagle-site
role: implementeur
cree: 2026-10-14
---

# Pack T007 — Vidéos AgentX lancées à l'arrivée à l'écran

> Seule source de vérité de l'agent T007. Ouvrir hors WL = pack raté.
> Dense ([[LANGAGE]]) : lignes-faits, coordonnées, contrats verbatim, 0 prose.

## Mission
Dans `src/pages/AgentX/index.tsx`, `RoomVideo` ne télécharge rien tant qu'elle n'approche pas de l'écran, joue quand visible, se met en pause hors écran → 0 octet webm/mp4 au chargement de /agentx si aucune vidéo n'est visible.

## Definition of Done
- [ ] `RoomVideo` (L34-58) : `preload="none"`, pas d'`autoPlay` statique ; `IntersectionObserver` (rootMargin `0px`, cf. décision) → `play()` à l'entrée, `pause()` à la sortie
- [ ] reduced-motion : jamais `play()` (poster seul) — comportement actuel conservé
- [ ] mesure Playwright sur ton preview (`/agentx`, écoute `response` .webm/.mp4, 4 s sans défiler) : 390×844 → 0 o vidéo ; 1440×900 → octets notés + la vidéo hero est-elle visible au chargement (`getBoundingClientRect`) ? Si visible : chargement légitime, le dire
- [ ] défilement jusqu'à la section onglets (L125-140) : la vidéo se lance (`video.paused === false` après 2 s) ; remontée : la vidéo hors écran est en pause
- [ ] onglets : changer d'onglet charge la nouvelle vidéo et la lance (pas de régression du `key={name}`)
- [ ] `npx tsc --noEmit -p .` → 0 erreur ; `git diff --stat -- src/pages/AgentX/index.tsx` → seule RoomVideo touchée
- [ ] `result.md` rempli selon « Format de sortie »

## Fichiers autorisés
| Chemin | Droit | Pourquoi |
|---|---|---|
| `~/Documents/Workspace/seagle-website/src/pages/AgentX/index.tsx` | E | L34-58 RoomVideo seulement ; usages L136 (onglets), L235 (hero) |
| `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T007/` | E | script de mesure, build |

## Contrats
Composant actuel (à modifier, signature conservée) :
```tsx
const RoomVideo = ({ name, label, className }: { name: string; label: string; className?: string }) => {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) ref.current?.pause()
  }, [])
  return (
    <video ref={ref} key={name} className={className ?? "block w-full h-auto"} autoPlay muted loop playsInline preload="metadata"
      poster={`/shots/agentx/${name}-poster.webp`} aria-label={label} width={1280} height={800}>
      <source src={`/shots/agentx/${name}.webm`} type="video/webm" />
      <source src={`/shots/agentx/${name}.mp4`} type="video/mp4" />
    </video>
  )
}
```
Mesure de T001 (avant) : /agentx télécharge `room.webm` 855 225 o au chargement, à 1440×900 ET 390×844 ; 2 `<video>` même source (hero L235, onglet L136).

## Décisions actées
- poster conservé comme image fixe — déjà en place
- rootMargin `0px` : hero mobile 72 px sous le pli ne doit pas charger ; le poster couvre l attente — chef 2026-10-14 (réponse BLQ T007)
- `play()` peut rejeter (politique autoplay) : `.catch(() => {})` toléré, c'est le seul garde-fou admis
- visuels ASCII intouchables (`src/components/ui/ascii-*`, `*.data.ts`, `src/components/kit/Ascii*`) — décision humain 2026-10-14
- design intouchable : kit `src/components/kit/`, ∅ néon/halo/grille/blur décoratif ; Mona Sans + JetBrains Mono
- nouvelle clé i18n → 5 langues (`src/lib/local/{fr,en,de,es,it}/`) ; textes existants non réécrits

## Hors périmètre
- réencoder/compresser les vidéos, toucher `public/shots/`
- le reste de la page AgentX (animations motion, CountUp, textes)
- JSON-LD de la page (L~171)

## Environnement
- dépôt `~/Documents/Workspace/seagle-website` : React 18.3, Vite 7.3.6, react-router 7, i18next 25 + react-i18next 16, Tailwind 4, motion 12 ; TS strict, `npx tsc --noEmit -p .` → 0 erreur sur HEAD
- arbre partagé : 6 autres agents écrivent en même temps dans d'autres fichiers ; leurs diffs peuvent apparaître dans ton build — ne pas les corriger, les signaler
- **jamais `npm run build`** : il écrit `dist/` (servi sur :4173 par un preview partagé) et `prerender.mjs` exige le port 4173 libre
- ton build : `npx vite build --outDir ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T007/dist --emptyOutDir` (le plugin sitemap écrit aussi `dist/sitemap.xml` : sans effet, laisser)
- ton preview : `npx vite preview --outDir ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T007/dist --port 4402 --strictPort` en arrière-plan ; l'arrêter à la fin (kill du pid lancé, par pid)
- Playwright 1.62 lib : `import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"` ; WebGL : `args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]` ; scripts dans `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T007/`
- thème/langue : `addInitScript` → `localStorage.setItem("seagle-theme","dark")`, `localStorage.setItem("i18nextLng","fr")`
- prérendu (`prerender.mjs`) non exécutable par toi → vérif HTML prérendu = `NV — prérendu réservé au chef`
- DoD périmètre : `git -C ~/Documents/Workspace/seagle-website diff --stat -- <chemins E>`, jamais diff global ; aucun commit (l'humain commite)

## Budget
- Lectures hors whitelist : **3 maximum**, et seulement si bloquant (à journaliser dans `## Écarts`).
- Outils autorisés : Read, Edit, Write (fichiers E uniquement), Grep, Glob, Bash (`npx tsc`, `npx vite build/preview` comme ci-dessus, `node` sur scripts de `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T007/`, `rg`, `ls`, `wc`, `gzip`, `git diff`)
- Arbre de travail partagé : jamais `git stash`, `git checkout --`, `git reset`, `git clean`, `git commit` — d'autres agents écrivent en même temps.
- Machine partagée : ne tuer que les processus que tu as lancés (par pid) ; ne supprimer que ce que la tâche a créé.
- Si bloqué : statut `bloque`, pose **une** question précise dans `result.md`, arrête-toi. Ne devine pas.

## Format de sortie
`result.md` à côté de ce pack, dense, ≤ 60 lignes, sections exactes :

```markdown
---
tache: T007
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

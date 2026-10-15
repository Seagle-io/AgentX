---
tache: T026
statut: fait
---
## Livré
- src/style.css:L111-114 — reduce : `[class*="animate-"]{animation:none}` (spin, float inclus)
- src/components/ui/mega-menu.tsx:L67-73 — `keydown` document actif si `openMenu` ; Échap ferme
- src/pages/Booking/index.tsx:L156-157 — état `backTo` = créneau quitté
- src/pages/Booking/index.tsx:L329 — « Changer de créneau » → `setBackTo(slot)`
- src/pages/Booking/index.tsx:L334 — `autoFocus` champ Nom
- src/pages/Booking/index.tsx:L371 — `autoFocus={s === backTo}` sur créneau
- src/components/Header/header.tsx:L257-261 — tiroir `max-h-[calc(100dvh-4rem)] overflow-y-auto` + `data-lenis-prevent`
## Vérifié comment
`npx tsc --noEmit -p .` → `tsc=0`
build cwd=T026 (`vite build <dépôt> --outDir T026/dist --emptyOutDir`) → `✓ built in 5.26s` `Sitemap généré — 109 pages` ; `md5sum dist/sitemap.xml` avant=après `85876b40…`
`RM=reduce,no-preference EXTRA=<109 loc> node T026/motion-extra.mjs` → `reduce total css infinies 0` · `reduce / … marquee=fixe` · `no-preference /services/security-audit {"css":["spin","pulse","pulse"]}` (×4 langues) · `no-preference / … marquee=bouge` · `no-preference total css infinies 56`
`node T026/hover-esc.mjs` → `survol: true liens 8 focus BODY` · `Échap (souris toujours dessus, focus body): false liens 0`
`node T026/focus-slot.mjs` → `après Entrée: INPUT[Nom]` · `Tab suivants: INPUT[E-mail] → TEXTAREA[…] → BUTTON[CONFIRMER…]` · `après 'Changer de créneau': BUTTON[10:00]`
`node T026/drawer.mjs` → `/ {"top":64,"bottom":519,"client":454,"scroll":454,… "Langue : Françai:455-485","DÉMARRER UN PROJ:446-494"}` (idem /de)
`node T026/drawer-hit.mjs` → 390x844 langue hit true · CTA hit true · `{"client":454,"scroll":454,"ov":"auto"}` · clic CTA → /contact ; 390x500 `{"client":435,"scroll":454,"ov":"auto"}` hits true, clic → /contact
`BASE=:4426 node T012/audit.mjs kbd` → diff `jq -S` vs T020/kbd-final.json : ∅
`BASE=:4426 node T012/audit.mjs extra` → vs T020/extra-final.json : `drawer.hauteurOuvert 384 → -1` (sonde `.max-h-96`, classe retirée) ; canvas_reduce ∅ diff ; canvas_no-preference `/solutions/kora [false,true] → [false,false]` (= T012 après, capture instable, canvas non touchés)
preview :4426 pid 3068371 tué → `ss -ltn | grep -c 4426` → 0
HTML prérendu : NV — prérendu réservé au chef
## Écarts
- ∅ lecture hors WL
- DoD non-régression : `audit.mjs extra` drawer.hauteurOuvert = -1 — sélecteur `.max-h-96` de la sonde T012, plus présent (hauteur réelle 454 via drawer.mjs)
- `git diff --stat` des 4 fichiers inclut les diffs non commités antérieurs (T012/T013) : 98+/41- ; mes lignes = ci-dessus
## Pour la suite
- audit T012 extra : sonde tiroir `#mobile-drawer` au lieu de `.max-h-96`
- reduce : toute classe `animate-*` coupée, y compris futures non infinies (one-shot) — choix voulu
- mega-menu : clavier ouvert puis souris passe et sort → fermé (onMouseLeave), focus reste sur déclencheur — préexistant
- Booking : `autoFocus` Nom ouvre le clavier mobile au choix d'un créneau
- scripts T026 : motion-extra/hover-esc/focus-slot/drawer (port 4426), drawer-hit.mjs
## Retour sur le pack
- Manquait: sonde T012 extra dépend de `.max-h-96` (classe modifiée par la tâche) | Inutile: ∅

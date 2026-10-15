---
tache: T003
statut: fait
---
## Livré
Script : `~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T003/audit.mjs` (sections : `struct|contrast|motion|kbd|forms|extra`, sans arg = tout) · sorties `*.json` même dossier.
Défauts (format pack). 15 pages = `/ /solutions/kora /secure-pass /agentx /leef-editor /global-seo /produits /services/{ai-integration,infrastructure,seo-branding} /a-propos /contact /carrieres /rendez-vous /book`.
### G1
- [G1] toutes (desktop) — sous-menus Services/Solutions/Outils/Entreprise hover seul ; Entrée/Espace → 0 lien visible (souris → 8) — src/components/ui/mega-menu.tsx:77-78,98-110 (∅ onFocus/onKeyDown/aria-expanded/aria-haspopup) — non-ASCII
- [G1] /rendez-vous — champs nom/e-mail/notes : 0 label, 0 aria-label, placeholder seul — src/pages/Booking/index.tsx:329-331 — non-ASCII
- [G1] /rendez-vous — grille jours/créneaux : boutons sans nom (31 `button` "1".."31", aria-label null), ∅ aria-pressed, ∅ role=grid — src/pages/Booking/index.tsx:66-69,~270-290 — non-ASCII
- [G1] toutes (mobile <lg) — tiroir fermé : 7 liens restent focusables (max-h-0 + overflow-hidden, pas display:none/inert) → focus invisible — src/components/Header/header.tsx:242-262 — non-ASCII
### G2
- [G2] toutes — ∅ lien d'évitement (15/15 pages) ; index.html:~85 `#root` sans skip, `<main>` sans id — src/components/Header/layout.tsx:31 — non-ASCII
- [G2] toutes — erreurs de formulaire non annoncées : `<p class=text-red-500>` sans role=alert/aria-live ; 0 `[aria-live|role=alert|role=status]` sur /contact et /rendez-vous — src/pages/Booking/index.tsx:335,343 ; src/pages/Contact/index.tsx:215-220 — non-ASCII
- [G2] mobile — burger : ∅ aria-expanded/aria-controls ; Échap ne ferme pas (hauteur 384→384) — src/components/Header/header.tsx:230-235 — non-ASCII
- [G2] toutes — sélecteur langue : Échap ne ferme pas (aria-expanded reste true) ; bouton nommé "FR" seul — src/components/ToogleLanguage.tsx:50-55 — non-ASCII
- [G2] toutes (15/15), 2 thèmes — texte `--th-text-lo` (11-12px) 2.51:1 clair / 3.01:1 sombre (<4.5) : label-mono, pied de page, "Voir le service", n° "01/02", ⌘R — src/style.css:17 (sombre), 52 (clair) ; classe `text-lo`/`.label-mono.text-lo` — non-ASCII
- [G2] 3 pages (secure-pass, agentx, leef-editor), 2 thèmes — `--th-text-faint` 1.64:1 clair / 1.66-1.77:1 sombre : "01", "Démonstration illustrative…" — src/style.css:18 (sombre), 53 (clair) ; classe `text-faint` — non-ASCII
- [G2] 15 pages, thème clair — `--th-text-md` 4.2-4.34:1 (<4.5) à 14-18px : nav "Services", `p.text-sm.text-md`, "À propos", hero p.text-lg — src/style.css:51 ; sombre OK (0.55 → >4.5 sur #000) — non-ASCII
- [G2] /contact, /rendez-vous — placeholder `text-faint` sur champs (1.64:1 clair) = seul libellé côté Booking — src/pages/Contact/index.tsx:129 ; src/pages/Booking/index.tsx:224 — non-ASCII
- [G2] clair — couleurs d'accent 11px sur fond clair : jaune 1.28-1.69, vert 1.71/2.53, bleu 2.43-2.66, orange 2.48, cyan 2.49-2.68, rose 3.05, rouge 3.34, violet 3.77 ; rose #ec4899 sur fond rose 1.55-2.02 — /services/{ai-integration,infrastructure,seo-branding}, /secure-pass, / ("export") : sélecteurs `p.label-mono` coloré inline — src/pages/ServiceDetail/index.tsx (NV ligne exacte) — non-ASCII
- [G2] toutes — animations CSS infinies non gatées reduced-motion : marquee 50s (/) ; pulse `lucide-circle-dot` (/) ; bounce `↓` (/solutions/kora) ; bounce chevron (/leef-editor) ; pulse point (/services/infrastructure) — src/style.css:100-101 ; src/components/ui/marquee.tsx:28 ; src/pages/Kora/index.tsx:412 ; src/pages/LeefEditor (chevron bounce) — non-ASCII
- [G2] /contact, /rendez-vous — champs : `outline-none`, seul indicateur = bordure basse 1px `focus:border-hi` (outline calculé none, box-shadow none) — src/pages/Contact/index.tsx:129 ; src/pages/Booking/index.tsx:224 ; aussi `input#sp-demo` /secure-pass:103 — non-ASCII
### G3
- [G3] /services/* (3) — 2 `<nav>` sans aria-label — NV source — non-ASCII
- [G3] 13/15 pages — canvas ASCII (AsciiField) sans aria-hidden/label : 1-2 `canvas` non masqués par page — src/components/kit/AsciiField.tsx:321 — ASCII (relevé seul, intouchable)
- [G3] /secure-pass:103 — `<label for=sp-demo>` OK mais ∅ contour focus (cf. G2) — non-ASCII
- [G3] ChatBot : composant jamais monté (aucun import hors lui-même) — src/components/ChatBot/index.tsx:18 ; chat inatteignable = ∅ à auditer — non-ASCII
### Faux positifs à ne pas corriger (contraste)
- ratios 1.0-1.3 : `.on-figures` / `force-dark` / texte blanc sur tableau ASCII ou image (Seagle 52px, "Vos", `text-transparent` Kora:~89px) → le calcul ignore canvas/images : NV, hors défaut. Marque ASCII, ne rien proposer.
## OK (par contrôle)
- clavier `/` : Tab parcourt 42 arrêts distincts, atteint pied de page, boucle sans piège ; OK
- thème : bouton `aria-label="Toggle theme"` activable Entrée/Espace → OK (header.tsx:210-215,223-228)
- langue : Entrée ouvre, Tab → items (4), clic change ; Échap KO (cf. G2)
- focus visible : 15 pages, 0 contrôle sans outline sauf champs ci-dessus (10-118 arrêts/page)
- `<main>` 1/page (layout.tsx:31), `<nav>` ≥1, h1=1/page, `lang` suit la langue (App.tsx:85 ; fr→en vérifié ; /book = en)
- `alt` : 0 `<img>` sans attribut alt ; 1-8 `alt=""` décoratifs/page ; 0 lien/bouton sans nom
- /contact : 4 champs avec `<label>` enveloppant (labels=1 chacun) ; honeypot `aria-hidden` OK ; soumission vide → focus sur `name`, validation native (5 :invalid)
- reduced-motion : 0 canvas 2D qui change (hash pixel, 15 pages) ; vidéos kora/agentx/produits/ai-integration `paused`; Lenis coupé (layout.tsx:17) ; AsciiField/Curtain/kora-logo/ascii-* statiques → ASCII OK
- ASCII animé reduced-motion : ∅ ; écart capture écran /agentx (canvas dither) NV, hash pixel stable
## Vérifié comment
- `node audit.mjs struct|contrast|motion|kbd|forms|extra` → 6 JSON écrits, exit 0 (T003/*.json) ; run complet sans arg non relancé d'un bloc (NV, durée)
- contraste : script ratio WCAG 2.x, fond effectif composé par ancêtres, ignore image/canvas (flag `img`) → 147 combos <seuil agrégés
- `rg ChatBot` hors composant → ∅ import (chat non monté)
## Écarts
- lecture hors WL: src/components/ui/mega-menu.tsx — seul lieu du menu ; src/App.tsx:85 (lang) ; src/pages/Kora, ServiceDetail, Home (rg seulement)
- DoD chat : ∅ composant monté, non testable
- DoD « lien Tab sans focus visible » : un faux piège (adjacent CTA identiques) corrigé en test `extra`
- lignes src ServiceDetail/Booking grille/LeefEditor chevron : NV exactes
## Pour la suite
- Corriger d'abord (V2) : mega-menu.tsx accessible au clavier (bouton aria-expanded + Entrée/Échap + onFocus) ; labels/aria-label sur Booking:329-331 + noms des boutons jour/créneau (66-69) ; tiroir mobile `inert`/`hidden` quand fermé + aria-expanded + Échap (header.tsx:230-262) ; Échap sur ToogleLanguage.tsx:50.
- Contrastes : relever `--th-text-lo/faint/md` en clair (style.css:51-53) et `lo/faint` sombre (17-18) ; gros volume (15 pages) ; ASCII intouchable, ne pas toucher `.on-figures`/`force-dark`.
- Ajouter skip link + `id="main"` (layout.tsx:31) ; `role=alert` sur erreurs Booking:335,343 et Contact:215 ; gater marquee/pulse/bounce par `motion-safe:` ou @media reduced (style.css:100).
- Re-mesure : `node ~/Documents/Workspace/AgentX/vault/artefacts/seagle-site/T003/audit.mjs <section>` après correctifs.
## Retour sur le pack
- Manquait: fichier mega-menu.tsx et App.tsx en WL ; chemin ServiceDetail pour les couleurs d'accent
- Inutile: ThemeContext, ChatBot/ (non monté)

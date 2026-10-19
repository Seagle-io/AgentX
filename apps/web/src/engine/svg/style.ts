// Règles et keyframes de la v1, recopiées valeur pour
// valeur. Portée `.v1-scene` (SVG d'une vignette ou de l'immeuble) : 0 fuite
// sur l'app. Keyframes préfixées `v1-` : `spin`/`pulse` existent dans
// Tailwind, un homonyme les écraserait tant que la scène est montée.
// Injectée 1× par page par un `<style>`.
export const V1_CSS = `
.v1-scene{--accent:#3b82f6;--green:#22e07a;--violet:#a855f7;--red:#ff3b5c;--blue:#3b82f6;--yellow:#ffcc33;--cyan:#2de2e6;
  --line-2:#262c3e;--text:#c9d2e2;--dimmer:#3d465c;
  --mono:ui-monospace,"SF Mono","JetBrains Mono","Fira Code",Menlo,Consolas,monospace}
/* v1 */
.v1-scene .desk-ring{opacity:0;transform-origin:center;transition:opacity .4s}
.v1-scene .desk.actif .desk-ring{opacity:1;animation:v1-ring 2s ease-out infinite}
@keyframes v1-ring{0%{opacity:.7;transform:scale(.72)}100%{opacity:0;transform:scale(1.25)}}
.v1-scene .mascotte{transform-box:fill-box;transform-origin:center}
.v1-scene .desk.actif .mascotte{animation:v1-bob 2.8s ease-in-out infinite}
.v1-scene .desk.actif .mascotte .eye,.v1-tour .tour-agent .eye,.v1-tour .tour-chef.ok .eye{animation:v1-blink 5.2s infinite}
.v1-scene .eye{transform-box:fill-box;transform-origin:center}
.v1-scene .desk.actif .v1-bloque .mascotte,.v1-scene .desk.actif .v1-bloque .v1-frange{animation:none}
/* T105 : halo fixe ; seul le glow des yeux bloqués pulse (2 s) */
.v1-scene .v1-halo{opacity:.55}
.v1-scene .v1-bloque .v1-glow{opacity:1;animation:v1-glow 2s ease-in-out infinite}
@keyframes v1-glow{0%,100%{opacity:.75}50%{opacity:1}}
@keyframes v1-spin{to{transform:rotate(360deg)}}
/* T109 : leds du vault en balayage (0,3 s chacune, cycle 2,4 s) ; vault-flash si un fait de plus */
.v1-scene .led{opacity:.35;animation:v1-led 2.4s linear infinite}
@keyframes v1-led{0%{opacity:1}12.5%,100%{opacity:.35}}
.v1-scene .vault-flash{animation:v1-vault-flash .6s ease-out}
@keyframes v1-vault-flash{0%{filter:brightness(2.2)}100%{filter:brightness(1)}}
/* T105 : vapeur ; T113 : poisson (6 s aller-retour, demi-tour en miroir) et bulles (--d, --h, délai) rétablis */
.v1-scene .fumee{animation:v1-fumee 2.2s ease-in-out infinite}
@keyframes v1-fumee{0%,100%{opacity:.25;transform:translateY(0)}50%{opacity:.8;transform:translateY(-5px)}}
.v1-scene .v1-nage{transform-box:fill-box;transform-origin:center;animation:v1-nage 6s linear infinite;animation-delay:calc(var(--p) * -6s)}
@keyframes v1-nage{0%{transform:translateX(calc(var(--a) * -1)) scaleX(1)}49.9%{transform:translateX(var(--a)) scaleX(1)}50%{transform:translateX(var(--a)) scaleX(-1)}99.9%{transform:translateX(calc(var(--a) * -1)) scaleX(-1)}100%{transform:translateX(calc(var(--a) * -1)) scaleX(1)}}
.v1-scene .v1-bulle{opacity:0;animation:v1-bulle var(--d) ease-in infinite}
@keyframes v1-bulle{0%{opacity:0;transform:translateY(0)}20%{opacity:.8}100%{opacity:0;transform:translateY(var(--h))}}
/* T110 : fusée F1 active — flamme 2 tons 0,4 s, tremblement 2 px */
.v1-scene .v1-flamme{transform-box:fill-box;transform-origin:50% 0;animation:v1-flamme .4s ease-in-out infinite}
@keyframes v1-flamme{0%,100%{transform:scaleY(1);opacity:1}50%{transform:scaleY(.6);opacity:.8}}
.v1-scene .v1-tremble{animation:v1-tremble .12s steps(2) infinite}
@keyframes v1-tremble{0%{transform:translateX(-1px)}100%{transform:translateX(1px)}}
/* v1 */
@keyframes v1-blink{0%,94%,100%{transform:scaleY(1)}96%,98%{transform:scaleY(.12)}}
@keyframes v1-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
/* v1 */
@keyframes v1-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.7)}}
/* v1 — #tour → .v1-tour */
.v1-tour text{font-family:var(--mono);font-size:10px;fill:var(--text)}
.v1-tour .tour-plaque{fill:#05070c;fill-opacity:.82;stroke:var(--line-2);stroke-width:.8}
.v1-tour .tour-num{fill:var(--cyan);font-weight:700}
.v1-tour .tour-c rect{fill:none;stroke:currentColor;stroke-width:.8}
.v1-tour .tour-c text{fill:currentColor;font-size:9px;font-variant-numeric:tabular-nums}
.v1-tour .tour-c.en{color:var(--blue)}
.v1-tour .tour-c.rv{color:var(--violet)}
.v1-tour .tour-c.bl{color:var(--red)}
.v1-tour .tour-c.nul{color:#7c8aa6}
.v1-tour .tour-c.nul rect{stroke-opacity:.4}
.v1-tour .tour-renvoi{stroke:var(--line-2);stroke-width:.8;stroke-dasharray:2 3}
.v1-tour .tour-cadre{fill:transparent;stroke:transparent;stroke-width:1.6;stroke-linejoin:round}
.v1-tour .tour-etage.sonne .tour-cadre{animation:v1-tourSonne 2.5s ease-out var(--retard,0s)}
@keyframes v1-tourSonne{0%,40%,80%{fill:rgba(34,224,122,.22);stroke:var(--green)}20%,60%,100%{fill:transparent}}
.v1-tour .tour-coupe{fill:none;stroke:var(--dimmer);stroke-width:1.4;stroke-linejoin:round}
.v1-tour .tour-led{fill:none;stroke:var(--cyan);stroke-opacity:.6;stroke-width:1.2;stroke-linecap:round}
.v1-tour .tour-niv-direction .tour-led{stroke:var(--c);stroke-opacity:1}
.v1-tour .tn-vide{opacity:.7}
.v1-tour .tn-eteint{opacity:.45}
.v1-tour .tour-agent .mascotte{animation:v1-bob 2.8s ease-in-out infinite}
.v1-tour .tour-faisceau{transform-origin:0 0;animation:v1-spin 1.2s linear infinite}
.v1-tour .tour-gyro-halo{transform-box:fill-box;transform-origin:center;animation:v1-pulse 1.2s ease-in-out infinite}
.v1-tour .tour-chef.ok .mascotte{animation:v1-bob 2.8s ease-in-out infinite}
.v1-tour .tour-chef.off .eye{animation:none;transform:scaleY(.15)}
.v1-tour .tour-cabine{transition:transform .9s cubic-bezier(.65,0,.35,1)}
/* vitrine seule (≠ v1) : sonnerie rejouée en boucle, cabine en va-et-vient
   (courbe et durée de la transition v1, 2 étages = 2 × 56 px) */
.v1-tour .tour-etage.sonne.v1-boucle .tour-cadre{animation-iteration-count:infinite}
.v1-tour .v1-cabine-anim{animation:v1-cabine 4s cubic-bezier(.65,0,.35,1) infinite}
@keyframes v1-cabine{0%,25%{transform:translateY(-4px)}47.5%,75%{transform:translateY(-116px)}97.5%,100%{transform:translateY(-4px)}}
/* vitrine seule (≠ v1) : frange du bas (4 pans déphasés) tant que le fantôme bouge (bob) */
.v1-scene .desk.actif .v1-frange,.v1-tour .tour-agent .v1-frange,.v1-tour .tour-chef.ok .v1-frange{animation:v1-frange 1.2s ease-in-out infinite}
@keyframes v1-frange{0%,100%{transform:translateY(0)}50%{transform:translateY(1px)}}
/* immeuble v2 (T091) : plaque chef, alerte d'étage, sélection, focus clavier */
.v1-tour .tour-dim{fill:#7c8aa6}
.v1-tour .tour-etat.ok{fill:var(--green)}
.v1-tour .tour-etat.off,.v1-tour .tour-etat.ko{fill:#7c8aa6}
.v1-tour .tour-al{font-size:9px;fill:var(--yellow)}
.v1-tour .tour-al.bloque{fill:var(--red)}
.v1-tour .tour-al.choix{fill:var(--red)}
.v1-tour .tour-plus{font-size:8px;fill:#7c8aa6}
.v1-tour [data-slug]{cursor:pointer}
/* T110 : carton du sous-sol nu, titre en <title> seulement */
.v1-tour .tour-carton{cursor:default}
.v1-tour .tour-etage{outline:none}
.v1-tour .tour-etage.sel .tour-plaque{stroke:var(--cyan)}
.v1-tour .tour-etage:hover .tour-cadre,.v1-tour .tour-etage:focus-visible .tour-cadre{stroke:var(--cyan)}
.v1-tour .tour-etage:focus-visible .tour-plaque{stroke:var(--cyan);stroke-width:1.6}
/* T100 : signal de blocage mural — faisceau 2 s, lueur 1,8 s */
.v1-scene .v1-faisceau{transform-origin:0 0;animation:v1-spin 2s linear infinite}
.v1-scene .v1-lueur{animation:v1-lueur 1.8s ease-in-out infinite}
@keyframes v1-lueur{0%,100%{opacity:.18}50%{opacity:.35}}
/* T118 : échanges (arcs.ts), 0 flèche */
/* impulsion : dessin 1,2 s ease-out, tenue 0,4 s, extinction 0,6 s, cycle 2,6 s ; glyphe 0,4 s à l'arrivée */
.v1-scene .v1-arc-impulsion .v1-arc-dessin{animation:v1-arc-dessin 2.6s infinite}
@keyframes v1-arc-dessin{0%{stroke-dashoffset:var(--l);opacity:1;animation-timing-function:ease-out}46.2%,61.5%{stroke-dashoffset:0;opacity:1}84.6%,100%{stroke-dashoffset:0;opacity:0}}
.v1-scene .v1-arc-impulsion .v1-arc-glyphe{opacity:0;animation:v1-arc-glyphe 2.6s infinite}
@keyframes v1-arc-glyphe{0%,44%{opacity:0}48%,60%{opacity:1}64%,100%{opacity:0}}
/* bloqué : le trait se rembobine cible → source, revient, clignote 2× */
.v1-scene .v1-arc-bloque-b path{animation:v1-arc-rembobine 2.6s ease-in-out infinite}
@keyframes v1-arc-rembobine{0%{stroke-dashoffset:0;opacity:1}35%{stroke-dashoffset:var(--l);opacity:1}40%{stroke-dashoffset:var(--l);opacity:0}45%{stroke-dashoffset:0;opacity:0}52%,72%,90%,100%{opacity:1}62%,82%{opacity:.2}}
/* mouvement réduit : trait + point fixe aux ¾ */
.v1-scene .v1-arc-rm{display:none}
@media (prefers-reduced-motion:reduce){.v1-scene .v1-arc-rm{display:inline}}
@media (prefers-reduced-motion:reduce){.v1-scene *{animation:none!important;transition-duration:.01ms!important}}
`

/* AgentX · salle des agents — rendu + animation. Aucune dépendance. */

const COULEURS = {
  accent:'#3b82f6', green:'#22e07a', violet:'#a855f7', red:'#ff3b5c',
  blue:'#3b82f6', yellow:'#ffcc33', orange:'#ff8a3d', cyan:'#2de2e6'
};
const COULEUR_ROLE = {
  chef:'#3b82f6', eclaireur:'#22e07a', architecte:'#a855f7', verificateur:'#ff3b5c',
  implementeur:'#ff8a3d', scribe:'#ffcc33', vault:'#2de2e6'
};
const COULEUR_STATUT = {
  'a-faire':'#5d6880', 'pret':'#2de2e6', 'en-cours':'#3b82f6',
  'revue':'#a855f7', 'bloque':'#ff3b5c', 'fait':'#22e07a'
};

const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* mémorise les valeurs affichées pour ne flasher que ce qui bouge */
const precedent = new Map();
function poser(node, valeur, cle){
  if (!node) return;
  const k = cle || node.dataset.k || Math.random();
  const v = String(valeur);
  if (precedent.get(k) !== undefined && precedent.get(k) !== v){
    node.classList.remove('flash');
    void node.offsetWidth;            // force le redémarrage de l'animation
    node.classList.add('flash');
  }
  precedent.set(k, v);
  if (node.textContent !== v) node.textContent = v;
}

/* ══════════════════════════════════════════════════════════════════════
   CARTES DE RÔLES + PIPELINE
   ══════════════════════════════════════════════════════════════════════ */
function rendreDeck(s){
  const deck = $('#deck');
  if (!deck.childElementCount){
    deck.innerHTML = s.roles.map(r => `
      <article class="card" id="card-${r.cle}" style="--c:${COULEUR_ROLE[r.cle]}">
        <div class="card-top">
          <div class="card-face"><i></i><i></i></div>
          <div class="card-id">
            <div class="card-nom">${esc(r.nom)}</div>
            <div class="card-sous">${esc(r.sous)}</div>
          </div>
          <div class="card-tag" data-f="tag"></div>
        </div>
        <div class="card-mesure">
          <span class="card-label" data-f="label"></span>
          <span class="card-val" data-f="valeur"></span>
        </div>
        <div class="jauge"><i data-f="jauge"></i></div>
        <div class="card-note" data-f="note"></div>
        <div class="card-etat"><span class="dot"></span><span data-f="etat"></span><span class="caret"></span></div>
      </article>`).join('') + `
      <div class="pipe" id="pipe">
        <div class="pipe-head"><b>LA PIPELINE</b><span>LE PACK FILTRE</span></div>
        <div class="pipe-bars" id="pipe-bars"></div>
      </div>`;
  }
  for (const r of s.roles){
    const c = $('#card-' + r.cle);
    if (!c) continue;
    c.classList.toggle('actif', !!r.actif);
    // « PILOTE » n'est jamais pluriel : le chef est seul par construction.
    const tag = r.cle === 'chef' ? 'PILOTE'
              : r.cle === 'vault' ? 'SANTÉ'
              : (r.actifs > 1 ? `×${r.actifs} AGENTS` : 'AGENT');
    poser($('[data-f="tag"]', c), tag, r.cle+':t');
    poser($('[data-f="label"]', c), r.label, r.cle+':l');
    poser($('[data-f="valeur"]', c), r.valeur, r.cle+':v');
    poser($('[data-f="note"]', c), r.note, r.cle+':n');
    poser($('[data-f="etat"]', c), r.etat, r.cle+':e');
    $('[data-f="jauge"]', c).style.width = Math.round(r.jauge * 100) + '%';
  }

  const max = Math.max(1, ...s.pipeline.map(p => p.n));
  const bars = $('#pipe-bars');
  if (bars.childElementCount !== s.pipeline.length){
    bars.innerHTML = s.pipeline.map(p => `
      <div class="pb" style="--c:${COULEUR_STATUT[p.k] || '#5d6880'}">
        <span class="pb-n" data-k="${p.k}">0</span>
        <span class="pb-bar" data-b="${p.k}" style="height:3px"></span>
        <span class="pb-k">${esc(p.k)}</span>
      </div>`).join('');
  }
  for (const p of s.pipeline){
    poser($(`.pb-n[data-k="${p.k}"]`, bars), p.n, 'pipe:'+p.k);
    $(`.pb-bar[data-b="${p.k}"]`, bars).style.height = Math.max(3, (p.n / max) * 46) + 'px';
  }
}

/* ══════════════════════════════════════════════════════════════════════
   LA SALLE — isométrie 2:1 construite en SVG
   ══════════════════════════════════════════════════════════════════════ */
const TW = 32, TH = 16, ZH = 20, OX = 300, OY = 120;
const iso = (x, y, z=0) => [OX + (x - y) * TW, OY + (x + y) * TH - z * ZH];
const pts = arr => arr.map(p => iso(...p).map(n => n.toFixed(1)).join(',')).join(' ');
const ombrer = (hex, f) => {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * f), g = Math.round(((n >> 8) & 255) * f), b = Math.round((n & 255) * f);
  return `rgb(${r},${g},${b})`;
};

/** boîte isométrique : face du dessus + deux faces visibles */
function boite(x, y, z, w, d, h, couleur, extra=''){
  const t = `stroke="#07090f" stroke-width=".7" stroke-linejoin="round"`;
  return `
    <polygon points="${pts([[x,y+d,z],[x+w,y+d,z],[x+w,y+d,z+h],[x,y+d,z+h]])}" fill="${ombrer(couleur,.60)}" ${t} ${extra}/>
    <polygon points="${pts([[x+w,y,z],[x+w,y+d,z],[x+w,y+d,z+h],[x+w,y,z+h]])}" fill="${ombrer(couleur,.42)}" ${t} ${extra}/>
    <polygon points="${pts([[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]])}" fill="${couleur}" ${t} ${extra}/>`;
}

/** canapé + table basse : remplit l'avant de la salle */
function salon(gx, gy){
  const W = 2.0;
  const [tx, ty] = iso(gx + .95, gy + 1.6, .32);
  return {svg:`<g>
    ${boite(gx, gy, 0, W, .9, .38, '#2b3348')}
    ${boite(gx, gy, .38, W, .3, .46, '#343d55')}
    ${boite(gx - .06, gy - .06, 0, .26, 1.0, .72, '#232a3c')}
    ${boite(gx + W - .2, gy - .06, 0, .26, 1.0, .72, '#232a3c')}
    ${boite(gx + .5, gy + 1.3, 0, 1.0, .7, .3, '#1f2634')}
    <ellipse cx="${tx.toFixed(1)}" cy="${(ty - 3).toFixed(1)}" rx="8" ry="4" fill="#2de2e6" opacity=".4"/>
  </g>`};
}

/** mascotte en espace écran (billboard)
 *  Le translate reste sur le <g> extérieur : l'animation CSS « bob » pose un
 *  transform sur .mascotte, et un transform CSS écrase l'attribut SVG. */
function mascotte(sx, sy, couleur, taille=1, retard=0){
  const w = 23 * taille, h = 25 * taille;
  const d = retard ? `style="animation-delay:${retard.toFixed(2)}s"` : '';
  return `<g transform="translate(${(sx - w/2).toFixed(1)},${(sy - h).toFixed(1)})">
    <ellipse cx="${w/2}" cy="${h + 3}" rx="${w*.44}" ry="${w*.17}" fill="#000" opacity=".45"/>
    <g class="mascotte" ${d}>
      <path d="M0 ${h*.42} a ${w/2} ${h*.45} 0 0 1 ${w} 0 L${w} ${h*.86}
               q ${-w*.13} ${h*.16} ${-w*.25} 0 q ${-w*.12} ${h*.16} ${-w*.25} 0
               q ${-w*.13} ${h*.16} ${-w*.25} 0 q ${-w*.12} ${h*.16} ${-w*.25} 0 Z"
            fill="${couleur}"/>
      <rect class="eye" x="${w*.25}" y="${h*.40}" width="${w*.14}" height="${h*.19}" rx="${w*.07}" fill="#06070c" ${d}/>
      <rect class="eye" x="${w*.61}" y="${h*.40}" width="${w*.14}" height="${h*.19}" rx="${w*.07}" fill="#06070c" ${d}/>
    </g>
  </g>`;
}

/** poste de travail complet — renvoie le décor + l'étiquette à poser en dernier
 *
 *  `agents` = nombre d'instances du rôle qui travaillent en ce moment. Un poste
 *  peut en porter plusieurs (deux implémenteurs sur des fichiers disjoints),
 *  sauf le chef : il n'est pas un rôle de tâche, il reste toujours seul. */
function bureau(cle, nom, gx, gy, couleur, agents = 0){
  const [cx, cy] = iso(gx + .75, gy + .5, 0);
  const [mx, my] = iso(gx + .75, gy + 1.5, 0);
  const [ex, ey] = iso(gx + .75, gy + .3, 1.07);   // bas de l'écran, sur le plateau

  const barres = Array.from({length:8}, (_,i) => {
    const x = ex - 17 + i * 4.6;
    return `<rect class="bar-anim" x="${x.toFixed(1)}" y="${(ey - 29).toFixed(1)}" width="3.2"
             height="20" rx="1" fill="${couleur}" opacity=".92"
             style="animation-delay:${(i*.11).toFixed(2)}s"/>`;
  }).join('');

  // Une silhouette par instance, alignées horizontalement : un décalage
  // (+o, −o) en grille se traduit par un pur déplacement latéral à l'écran.
  const montre = Math.min(Math.max(agents, 1), 4);
  const equipe = Array.from({length: montre}, (_, k) => {
    const o = (k - (montre - 1) / 2) * .38;
    const [px, py] = iso(gx + .75 + o, gy + 1.5 - o, 0);
    return mascotte(px, py + 7, couleur, 1, k * .37);
  }).join('') + (agents > montre
    ? `<text x="${(mx + 34).toFixed(1)}" y="${(my + 4).toFixed(1)}"
             font-family="ui-monospace,monospace" font-size="8" fill="${couleur}">+${agents - montre}</text>`
    : '');

  const svg = `<g class="desk" id="desk-${cle}">
    <ellipse class="desk-ring" cx="${cx.toFixed(1)}" cy="${(cy + 16).toFixed(1)}" rx="50" ry="25"
             fill="none" stroke="${couleur}" stroke-width="1.6"/>
    <ellipse cx="${cx.toFixed(1)}" cy="${(cy + 17).toFixed(1)}" rx="43" ry="21" fill="#000" opacity=".4"/>
    ${boite(gx + .04, gy + .05, 0, .1, .8, .95, '#171c29')}
    ${boite(gx + 1.36, gy + .05, 0, .1, .8, .95, '#171c29')}
    ${boite(gx, gy, .95, 1.5, .9, .14, '#3a4460')}
    ${boite(gx + .45, gy + 1.0, 0, .62, .5, .34, '#242c3e')}
    ${boite(gx + .45, gy + 1.38, .34, .62, .12, .42, '#2b3448')}
    <rect x="${(ex - 3).toFixed(1)}" y="${(ey - 6).toFixed(1)}" width="6" height="6" fill="#39415a"/>
    <rect x="${(ex - 23).toFixed(1)}" y="${(ey - 35).toFixed(1)}" width="46" height="30" rx="2.5"
          fill="#080b12" stroke="${ombrer(couleur,.75)}" stroke-width="1.3"/>
    <g class="screen-glow">${barres}</g>
    ${equipe}
  </g>`;

  // Plaque posée sur le bord avant du plateau : elle reste dans l'emprise du
  // bureau, donc elle ne peut jamais tomber sur le poste d'à côté.
  const [lx, ly] = iso(gx + .75, gy + .9, 1.09);
  const titre = montre > 1 ? `${nom} ×${agents}` : nom;
  return {svg, label:{x:lx, y:ly, t:titre, c:couleur, w:titre.length * 5.1}};
}

function plante(gx, gy){
  const [x, y] = iso(gx, gy, 0);
  return `<g>
    <ellipse cx="${x}" cy="${y}" rx="11" ry="5.5" fill="#000" opacity=".3"/>
    <path d="M${x-7} ${y-2} L${x-5} ${y-13} L${x+5} ${y-13} L${x+7} ${y-2} Z" fill="#2a3042"/>
    <path d="M${x} ${y-13} q -13 -8 -9 -20 q 9 3 9 20Z" fill="#1f8a52"/>
    <path d="M${x} ${y-13} q 13 -9 10 -22 q -10 4 -10 22Z" fill="#26a862"/>
    <path d="M${x} ${y-13} q 2 -14 -1 -22 q -6 10 1 22Z" fill="#1a7a47"/>
  </g>`;
}

function rack(gx, gy, n){
  const [x, y] = iso(gx + .45, gy + .9, 0);
  const leds = Array.from({length:8}, (_,i) => `
    <rect class="led" x="${(x-15).toFixed(1)}" y="${(y-88+i*10).toFixed(1)}" width="26" height="5" rx="1"
          fill="${i < n ? '#22e07a' : '#1c2030'}" style="animation-delay:${(i*.18).toFixed(2)}s"/>`).join('');
  return {svg:`<g>${boite(gx, gy, 0, .9, .9, 4.6, '#171b27')}${leds}</g>`,
          label:{x, y:y + 17, t:'VAULT', c:'#7c8aa6', w:28}};
}

function radar(gx, gy, alerte){
  const [x, y] = iso(gx + .4, gy + .8, 0);
  const c = alerte ? '#ff3b5c' : '#2de2e6';
  return {svg:`<g>
    ${boite(gx, gy, 0, .8, .8, .4, '#1a1e2b')}
    <g transform="translate(${x.toFixed(1)},${(y - 34).toFixed(1)})">
      <ellipse cx="0" cy="0" rx="21" ry="10" fill="#0c1018" stroke="#2a3042" stroke-width="1.4"/>
      <ellipse cx="0" cy="0" rx="12" ry="6" fill="none" stroke="#2a3042" stroke-width="1.1"/>
      <g class="radar-sweep"><path d="M0 0 L21 -4 L21 4 Z" fill="${c}" opacity=".5"/></g>
      <circle cx="0" cy="0" r="2.8" fill="${c}"/>
      ${alerte ? `<circle cx="0" cy="0" r="6" fill="none" stroke="${c}" stroke-width="1.2">
        <animate attributeName="r" values="6;24;6" dur="1.8s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values=".9;0;.9" dur="1.8s" repeatCount="indefinite"/></circle>` : ''}
    </g></g>`,
    label:{x, y:y + 17, t:alerte ? 'BLOCAGE DÉTECTÉ' : 'RADAR BLOCAGES', c, w:alerte ? 80 : 74}};
}

function fusee(gx, gy, actif){
  const [x, y] = iso(gx + .5, gy + 1, 0);
  const c = actif ? '#ff8a3d' : '#2a3042';
  return {svg:`<g>
    ${boite(gx, gy, 0, 1, 1, .3, '#1a1e2b')}
    <g transform="translate(${x.toFixed(1)},${(y - 22).toFixed(1)})">
      <path d="M0 -36 q 9 14 9 27 l -18 0 q 0 -13 9 -27Z" fill="#e8eefc"/>
      <path d="M-9 -9 l -6 11 l 6 0Z M9 -9 l 6 11 l -6 0Z" fill="${c}"/>
      <circle cx="0" cy="-20" r="3.6" fill="#2de2e6"/>
      ${actif ? `<path class="fumee" d="M-4 3 q 4 10 4 13 q 0 -3 4 -13Z" fill="#ff8a3d"/>` : ''}
    </g></g>`,
    label:{x, y:y + 15, t:actif ? 'VAGUE EN COURS' : 'AUCUNE VAGUE', c:actif ? '#ff8a3d' : '#5d6880', w:74}};
}

function poubelle(gx, gy, n){
  const [x, y] = iso(gx + .4, gy + .8, 0);
  return {svg:`<g>${boite(gx, gy, 0, .85, .85, 1.1, '#171b27')}
    ${boite(gx - .05, gy - .05, 1.1, .95, .95, .08, '#242b3c')}</g>`,
    label:{x, y:y + 15, t:`ABANDONNÉES ${n}`, c:'#5d6880', w:68}};
}

/* emplacement de chaque poste : sert aux bureaux ET aux arcs de relais */
const POSTES = {
  chef:        [9.9, 0.7],
  eclaireur:   [1.2, 2.2],
  architecte:  [4.4, 2.2],
  verificateur:[7.6, 2.2],
  implementeur:[2.6, 5.8],
  scribe:      [5.8, 5.8],
};
const RANG_ETAT = {attente:0, livre:1, actif:2, bloque:3};
const COULEUR_ETAT = {attente:'#39415a', livre:'#2de2e6', actif:'#22e07a', bloque:'#ff3b5c'};

/* ── ce qui transite sur un relais ───────────────────────────────────────
   Dessiné centré sur (0,0) pour pouvoir être posé sur un chemin ou dans une
   puce. Le trait prend la couleur de l'émetteur. */
const GLYPHES = {
  pack: c => `<rect x="-5" y="-6.5" width="10" height="13" rx="1.5" fill="none" stroke="${c}" stroke-width="1.4"/>
    <path d="M-2.6 -3h5.2M-2.6 0h5.2M-2.6 3h3.4" stroke="${c}" stroke-width="1.3" stroke-linecap="round"/>`,
  carte: c => `<path d="M0 6.4C-4.4 1-5.5-1.4-5.5-3.3a5.5 5.5 0 0 1 11 0C5.5-1.4 4.4 1 0 6.4Z"
      fill="none" stroke="${c}" stroke-width="1.4" stroke-linejoin="round"/>
    <circle cx="0" cy="-3.3" r="1.9" fill="${c}"/>`,
  contrat: c => `<path d="M-1.6-6.4q-2.8 0-2.8 2.8t-2.2 2.8q2.2 0 2.2 2.8t2.8 2.8"
      fill="none" stroke="${c}" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M1.6-6.4q2.8 0 2.8 2.8t2.2 2.8q-2.2 0-2.2 2.8t-2.8 2.8"
      fill="none" stroke="${c}" stroke-width="1.4" stroke-linecap="round"/>`,
  diff: c => `<rect x="-5" y="-6.5" width="10" height="13" rx="1.5" fill="none" stroke="${c}" stroke-width="1.4"/>
    <path d="M-2.6-2.6h5.2" stroke="${c}" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M-2.6 2.6h5.2M0 0v5.2" stroke="${c}" stroke-width="1.4" stroke-linecap="round"/>`,
  defauts: c => `<path d="M0-6.6 6.4 5H-6.4Z" fill="none" stroke="${c}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M0-2.2v3.4" stroke="${c}" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="0" cy="3.3" r="1" fill="${c}"/>`,
  notes: c => `<path d="M-5.2-6.2h6.6a2 2 0 0 1 2 2v10.4h-6.6a2 2 0 0 0-2 2Z"
      fill="none" stroke="${c}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M-2.6-2.6h4.4M-2.6 0.4h4.4" stroke="${c}" stroke-width="1.2" stroke-linecap="round"/>`,
  resultat: c => `<path d="M-4.6-6.5h6l3.6 3.6v9.4h-9.6Z" fill="none" stroke="${c}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M1.4-6.5v3.6h3.6" fill="none" stroke="${c}" stroke-width="1.2"/>`,
  question: c => `<circle r="6.6" fill="none" stroke="${c}" stroke-width="1.4"/>
    <path d="M-2.1-1.9a2.1 2.1 0 1 1 2.1 2.6v1" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="0" cy="4" r="1" fill="${c}"/>`,
};

/** pastille transportable : fond sombre + glyphe, pour rester lisible sur le sol */
function pastille(cle, couleur, echelle = 1){
  const g = (GLYPHES[cle] || GLYPHES.resultat)(couleur);
  return `<g transform="scale(${echelle})">
    <circle r="9.6" fill="#05070c" opacity=".92" stroke="${couleur}" stroke-width="1" opacity=".95"/>
    ${g}</g>`;
}

/** même glyphe, en HTML inline (puces de la bande des relais) */
function glypheInline(cle, couleur, taille = 13){
  return `<svg viewBox="-9 -9 18 18" width="${taille}" height="${taille}" aria-hidden="true"
    style="flex:none;vertical-align:-2px">${(GLYPHES[cle] || GLYPHES.resultat)(couleur)}</svg>`;
}

/** arcs de relais : une courbe par couple de rôles qui se passent le travail */
function arcsRelais(flux){
  const fort = new Map();
  for (const f of flux || []){
    if (!POSTES[f.de] || !POSTES[f.vers] || f.de === f.vers) continue;
    const k = `${f.de}>${f.vers}`;
    if (!fort.has(k) || RANG_ETAT[f.etat] > RANG_ETAT[fort.get(k).etat]) fort.set(k, f);
  }
  const anim = !window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  const chemins = [...fort.values()].map(f => {
    const [agx, agy] = POSTES[f.de], [bgx, bgy] = POSTES[f.vers];
    const [ax, ay] = iso(agx + .75, agy + 1.45, 0);
    const [bx, by] = iso(bgx + .75, bgy + 1.45, 0);
    const mx = (ax + bx) / 2, my = (ay + by) / 2 - 42 - Math.abs(bx - ax) * .14;
    const d = `M${ax.toFixed(1)},${ay.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${bx.toFixed(1)},${by.toFixed(1)}`;
    const c = f.etat === 'bloque' ? COULEUR_ETAT.bloque : COULEUR_ROLE[f.de];
    const vif = f.etat === 'actif' || f.etat === 'bloque';

    // Ce qui voyage sur le fil : coordonnées, contrat, livrable, défauts…
    // Rien ne circule tant que l'amont n'a pas livré ; un relais bloqué porte
    // une question à l'arrêt, pas un colis.
    const bloque = f.etat === 'bloque';
    const colis = bloque
      ? (() => {               // point milieu de la quadratique, à t = 0.5
          const qx = .25*ax + .5*mx + .25*bx, qy = .25*ay + .5*my + .25*by;
          return `<g transform="translate(${qx.toFixed(1)},${qy.toFixed(1)})" class="colis-bloque">
            ${pastille('question', COULEUR_ETAT.bloque, .95)}</g>`;
        })()
      : (anim && f.etat !== 'attente'
          ? `<g><animateMotion dur="${f.etat === 'actif' ? 2.4 : 4.2}s"
                 repeatCount="indefinite" path="${d}"/>
               ${pastille(f.objet, c, f.etat === 'actif' ? .95 : .8)}</g>`
          : '');

    return `<g opacity="${f.etat === 'attente' ? .3 : f.etat === 'livre' ? .7 : .95}">
      <path d="${d}" fill="none" stroke="${c}" stroke-width="${vif ? 1.9 : 1.3}"
            stroke-linecap="round" marker-end="url(#fleche-${f.de})"
            class="${anim && f.etat !== 'attente' ? 'arc-flow' : ''}"
            ${f.etat === 'attente' ? 'stroke-dasharray="3 6"' : ''}/>
      ${colis}
    </g>`;
  }).join('');

  const marqueurs = Object.entries(COULEUR_ROLE).map(([k, c]) => `
    <marker id="fleche-${k}" viewBox="0 0 7 7" refX="6" refY="3.5" markerWidth="5" markerHeight="5"
            orient="auto-start-reverse"><path d="M0,0 L7,3.5 L0,7 Z" fill="${c}"/></marker>`).join('');

  return {chemins, marqueurs};
}

function construireSalle(s){
  const actifs = new Set(s.roles.filter(r => r.actif).map(r => r.cle));
  // combien d'instances tiennent chaque poste en ce moment
  const agents = Object.fromEntries(s.roles.map(r => [r.cle, r.actifs || 0]));
  const bloque = s.pipeline.find(p => p.k === 'bloque')?.n > 0;
  const enCours = s.pipeline.find(p => p.k === 'en-cours')?.n > 0;
  const abandon = s.taches.filter(t => t.statut === 'abandonne').length;
  const faits   = s.pipeline.find(p => p.k === 'fait')?.n || 0;

  const NX = 12, NY = 9, MUR = 5;

  /* sol + quadrillage */
  let sol = `<polygon points="${pts([[0,0],[NX,0],[NX,NY],[0,NY]])}" fill="#0b0e15"/>`;
  for (let i = 0; i <= NX; i++)
    sol += `<line x1="${iso(i,0)[0].toFixed(1)}" y1="${iso(i,0)[1].toFixed(1)}" x2="${iso(i,NY)[0].toFixed(1)}" y2="${iso(i,NY)[1].toFixed(1)}" stroke="#161b2a" stroke-width=".9"/>`;
  for (let i = 0; i <= NY; i++)
    sol += `<line x1="${iso(0,i)[0].toFixed(1)}" y1="${iso(0,i)[1].toFixed(1)}" x2="${iso(NX,i)[0].toFixed(1)}" y2="${iso(NX,i)[1].toFixed(1)}" stroke="#161b2a" stroke-width=".9"/>`;

  /* murs du fond */
  const murs = `
    <polygon points="${pts([[0,0,0],[0,NY,0],[0,NY,MUR],[0,0,MUR]])}" fill="#0d1017"/>
    <polygon points="${pts([[0,0,0],[NX,0,0],[NX,0,MUR],[0,0,MUR]])}" fill="#11141f"/>
    <polyline points="${pts([[0,0,MUR],[0,NY,MUR]])}" fill="none" stroke="#1c2233" stroke-width="1.2"/>
    <polyline points="${pts([[0,0,MUR],[NX,0,MUR]])}" fill="none" stroke="#1c2233" stroke-width="1.2"/>`;

  /* grand écran du fond : la courbe d'avancement */
  const serie = s.serie.points.length > 1 ? s.serie.points : [0, 0];
  const maxP = Math.max(1, ...serie), n = serie.length;
  const courbe = serie.map((v, i) =>
    iso(2.6 + (i/(n-1)) * 6.8, 0, 2.9 + (v/maxP) * 1.3).map(a => a.toFixed(1)).join(',')).join(' ');
  const ecran = `
    <polygon points="${pts([[2.2,0,2.4],[9.8,0,2.4],[9.8,0,4.7],[2.2,0,4.7]])}" fill="#060910" stroke="#222a3c" stroke-width="1.4"/>
    <g class="screen-glow">
      <polyline points="${pts([[2.6,0,2.9],[9.4,0,2.9]])}" fill="none" stroke="#1b2233" stroke-dasharray="4 4"/>
      <polyline points="${courbe}" fill="none" stroke="#22e07a" stroke-width="2" stroke-linejoin="round"/>
    </g>
    <text x="${iso(6,0,4.42)[0].toFixed(1)}" y="${iso(6,0,4.42)[1].toFixed(1)}" text-anchor="middle"
          font-family="ui-monospace,monospace" font-size="9" letter-spacing="2" fill="#2de2e6">
      ${esc((s.projet.slug || '').toUpperCase())} · ${esc(s.serie.valeur)} LIVRÉES</text>`;

  /* tableau mural gauche : la pipeline */
  const maxPipe = Math.max(1, ...s.pipeline.map(p => p.n));
  const tableau = `
    <polygon points="${pts([[0,1.4,2.4],[0,7.4,2.4],[0,7.4,4.5],[0,1.4,4.5]])}" fill="#060910" stroke="#222a3c" stroke-width="1.4"/>
    ${s.pipeline.map((p, i) => {
      const y0 = 1.85 + i * .93, h = .25 + (p.n / maxPipe) * 1.5;
      return `<polygon points="${pts([[0,y0,2.7],[0,y0+.62,2.7],[0,y0+.62,2.7+h],[0,y0,2.7+h]])}"
               fill="${COULEUR_STATUT[p.k]}" opacity=".85"/>`;
    }).join('')}
    <text x="${iso(0,4.4,4.2)[0].toFixed(1)}" y="${iso(0,4.4,4.2)[1].toFixed(1)}" text-anchor="middle"
          font-family="ui-monospace,monospace" font-size="8.5" letter-spacing="2" fill="#3b82f6">PIPELINE</text>`;

  /* objets au sol : dessinés de l'arrière vers l'avant */
  const props = [
    {p:POSTES.chef,         o: bureau('chef', 'CHEF', ...POSTES.chef, COULEUR_ROLE.chef, 1)},
    {p:[11.6,1.4], o: {svg: plante(11.6, 1.4)}},
    {p:[0.3, 3.2], o: {svg: plante(0.3, 3.2)}},
    {p:POSTES.eclaireur,    o: bureau('eclaireur', 'ÉCLAIREUR', ...POSTES.eclaireur, COULEUR_ROLE.eclaireur, agents.eclaireur)},
    {p:POSTES.architecte,   o: bureau('architecte', 'ARCHITECTE', ...POSTES.architecte, COULEUR_ROLE.architecte, agents.architecte)},
    {p:POSTES.verificateur, o: bureau('verificateur', 'VÉRIFICATEUR', ...POSTES.verificateur, COULEUR_ROLE.verificateur, agents.verificateur)},
    {p:[11.1,4.3], o: rack(11.1, 4.3, Math.min(8, Math.max(1, faits + 1)))},
    {p:[0.3, 6.0], o: poubelle(0.3, 6.0, abandon)},
    {p:POSTES.implementeur, o: bureau('implementeur', 'IMPLÉMENTEUR', ...POSTES.implementeur, COULEUR_ROLE.implementeur, agents.implementeur)},
    {p:POSTES.scribe,       o: bureau('scribe', 'SCRIBE', ...POSTES.scribe, COULEUR_ROLE.scribe, agents.scribe)},
    {p:[9.8, 6.6], o: fusee(9.8, 6.6, enCours)},
    {p:[7.9, 7.6], o: radar(7.9, 7.6, bloque)},
    {p:[1.4, 8.0], o: salon(1.4, 8.0)},
    {p:[5.0, 8.6], o: {svg: plante(5.0, 8.6)}},
    {p:[7.0, 8.5], o: {svg: plante(7.0, 8.5)}},
  ].sort((a, b) => (a.p[0] + a.p[1]) - (b.p[0] + b.p[1]));

  const objets = props.map(x => x.o.svg).join('');

  /* étiquettes posées en dernier : rien ne doit jamais les recouvrir */
  const etiquettes = props.filter(x => x.o.label).map(({o:{label:l}}) => `
    <g>
      <rect x="${(l.x - l.w/2 - 5).toFixed(1)}" y="${(l.y - 8).toFixed(1)}"
            width="${(l.w + 10).toFixed(1)}" height="11" rx="2" fill="#05070c" opacity=".82"/>
      <text x="${l.x.toFixed(1)}" y="${l.y.toFixed(1)}" text-anchor="middle"
            font-family="ui-monospace,monospace" font-size="7.5" letter-spacing="1"
            fill="${l.c}">${esc(l.t)}</text>
    </g>`).join('');

  const relais = arcsRelais(s.flux);

  $('#room').innerHTML = `
    <defs>
      <radialGradient id="halo" cx="46%" cy="34%" r="66%">
        <stop offset="0%" stop-color="#1c2538" stop-opacity=".9"/>
        <stop offset="100%" stop-color="#04050a" stop-opacity="0"/>
      </radialGradient>
      ${relais.marqueurs}
    </defs>
    <rect x="0" y="0" width="700" height="480" fill="url(#halo)"/>
    ${sol}${murs}${ecran}${tableau}${objets}${relais.chemins}${etiquettes}`;

  $$('#room .desk').forEach(d => {
    d.classList.toggle('actif', actifs.has(d.id.replace('desk-','')));
  });
}

/* ══════════════════════════════════════════════════════════════════════
   COURBE D'AVANCEMENT
   ══════════════════════════════════════════════════════════════════════ */
function rendreCourbe(s){
  const p = s.serie.points.length > 1 ? s.serie.points : [0, 0];
  const b = s.serie.barres.length ? s.serie.barres : p.map(()=>1);
  const n = p.length, max = Math.max(1, ...p), W = 1000, H = 200, hautCourbe = 128;
  const X = i => (i / (n - 1)) * (W - 180) + 8;
  const Y = v => hautCourbe - (v / max) * (hautCourbe - 22);

  const ligne = p.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  const aire  = `8,${hautCourbe} ${ligne} ${X(n-1).toFixed(1)},${hautCourbe}`;
  const barres = b.map((v, i) => {
    const h = v === 2 ? 34 : v === -1 ? 26 : 12;
    const c = v === 2 ? '#22e07a' : v === -1 ? '#ff3b5c' : '#1d2233';
    const w = Math.max(3, (W - 190) / n - 3);
    return `<rect x="${X(i).toFixed(1)}" y="${(H - h).toFixed(1)}" width="${w.toFixed(1)}"
             height="${h}" rx="1" fill="${c}" opacity="${v===1?'.55':'.9'}"/>`;
  }).join('');

  const dernier = [X(n-1), Y(p[n-1])];
  $('#chart').innerHTML = `
    <defs>
      <linearGradient id="gAire" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#22e07a" stop-opacity=".30"/>
        <stop offset="100%" stop-color="#22e07a" stop-opacity="0"/>
      </linearGradient>
    </defs>
    ${[0,.5,1].map(f=>`<line x1="8" y1="${(22+f*(hautCourbe-22)).toFixed(1)}" x2="${W-172}"
        y2="${(22+f*(hautCourbe-22)).toFixed(1)}" stroke="#151a28" stroke-width="1" stroke-dasharray="4 5"/>`).join('')}
    <polygon points="${aire}" fill="url(#gAire)"/>
    <polyline class="trace" points="${ligne}" fill="none" stroke="#22e07a" stroke-width="2.2"
              stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${dernier[0].toFixed(1)}" cy="${dernier[1].toFixed(1)}" r="4.5" fill="#22e07a"/>
    <circle cx="${dernier[0].toFixed(1)}" cy="${dernier[1].toFixed(1)}" r="4.5" fill="none"
            stroke="#22e07a" stroke-width="1.5" opacity=".6">
      <animate attributeName="r" values="4.5;13;4.5" dur="2.2s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values=".6;0;.6" dur="2.2s" repeatCount="indefinite"/>
    </circle>
    ${barres}`;

  const trace = $('.trace', $('#chart'));
  if (trace && !window.matchMedia('(prefers-reduced-motion:reduce)').matches){
    const L = trace.getTotalLength();
    trace.style.strokeDasharray = L;
    trace.style.strokeDashoffset = L;
    trace.animate([{strokeDashoffset:L},{strokeDashoffset:0}],
                  {duration:1100, easing:'cubic-bezier(.22,1,.36,1)', fill:'forwards'});
  }

  poser($('#chart-val'), s.serie.valeur, 'c:v');
  poser($('#chart-sub'), s.serie.sub || s.serie.sous || '', 'c:s');
  poser($('#chart-titre'), s.serie.titre, 'c:t');
  poser($('#chart-meta'), `${s.projet.slug} · ${s.projet.statut}`, 'c:m');
}

/* ══════════════════════════════════════════════════════════════════════
   TÂCHES · JOURNAL · SEUILS
   ══════════════════════════════════════════════════════════════════════ */
function rendreTaches(s){
  $('#tasks').innerHTML = s.taches.map(t => `
    <div class="trow ${t.statut === 'en-cours' ? 'encours' : ''} ${t.statut === 'bloque' ? 'bloque' : ''}">
      <span class="tid">${esc(t.id)}</span>
      <span class="ttitre">${esc(t.titre)}${t.verdict ? ` <b style="color:${t.verdict.startsWith('CONF')?'#22e07a':'#ff3b5c'}">· ${esc(t.verdict)}</b>` : ''}</span>
      <span class="trole" style="color:${COULEUR_ROLE[t.role] || '#5d6880'}">${esc(t.role)}</span>
      <span class="tnum">${t.tokens || '—'}</span>
      <span class="tnum">${t.fichiers || '—'}</span>
      <span class="badge ${t.lint === 'PASS' ? 'pass' : t.lint === 'FAIL' ? 'fail' : 'none'}">${esc(t.lint)}</span>
    </div>`).join('');
  poser($('#tasks-meta'), `${s.taches.length} TÂCHES · ${s.taches.filter(t=>t.lint==='FAIL').length} PACK REFUSÉ`, 'tm');
  $('#journal').innerHTML = (s.journal || []).map(l => `<div>${esc(l)}</div>`).join('');
}

/* ══════════════════════════════════════════════════════════════════════
   TODO DU CHEF · RELAIS
   ══════════════════════════════════════════════════════════════════════ */
const COULEUR_PRIO = {1:'#ff3b5c', 2:'#ffcc33', 3:'#2de2e6', 4:'#5d6880'};

function rendreTodo(s){
  const items = s.todo || [];
  poser($('#todo-count'), items.length, 'todo:n');
  if (!items.length){
    $('#todo').innerHTML = `<div class="todo-vide">rien à faire côté chef.<br>
      tout est packé, dispatché et intégré.</div>`;
    return;
  }
  $('#todo').innerHTML = items.map((t, i) => `
    <div class="ti p${t.prio}" style="--c:${COULEUR_PRIO[t.prio] || '#5d6880'}">
      <div class="ti-top">
        <span class="ti-case"></span>
        <span class="ti-titre">${esc(t.titre)}</span>
        <span class="ti-tag">${esc(t.etiquette)}</span>
      </div>
      <div class="ti-detail">${esc(t.detail)}</div>
      ${t.cmd ? `<code class="ti-cmd">${esc(t.cmd)}</code>` : ''}
      ${t.cmd ? `<div class="ti-actions">
        ${t.exe ? `<button class="ti-act run" data-exe="${i}">▶ lancer</button>` : ''}
        <button class="ti-act" data-copie="${i}">⧉ copier</button>
      </div>` : ''}
    </div>`).join('');
}

const NOM_ETAT = {attente:'en attente', livre:'livré', actif:'en cours', bloque:'bloqué'};

function rendreFlux(s){
  const f = s.flux || [];
  if (!f.length){
    $('#flux').innerHTML = `<span class="flux-vide">aucun relais — les tâches sont toutes indépendantes</span>`;
    return;
  }
  const ordre = {bloque:0, actif:1, livre:2, attente:3};
  $('#flux').innerHTML = [...f].sort((a, b) => ordre[a.etat] - ordre[b.etat]).map(r => `
    <div class="fx ${r.etat}" style="--e:${COULEUR_ETAT[r.etat]}" title="${esc(r.quoi)}">
      <span class="fx-role" style="--c:${COULEUR_ROLE[r.de] || '#5d6880'}">${esc(r.de)}</span>
      <span class="fx-tid">${esc(r.de_tid)}</span>
      <span class="fx-objet" title="objet transmis : ${esc(r.objet_nom || '')}">
        ${glypheInline(r.objet, COULEUR_ROLE[r.de] || '#5d6880')}
        <b>${esc(r.objet_nom || '')}</b>
      </span>
      <span class="fx-arrow">→</span>
      <span class="fx-role" style="--c:${COULEUR_ROLE[r.vers] || '#5d6880'}">${esc(r.vers)}</span>
      <span class="fx-tid">${esc(r.vers_tid)}</span>
      <span class="fx-etat">${NOM_ETAT[r.etat]}</span>
    </div>`).join('');
}

function rendreSeuils(s){
  const z = s.seuils;
  if (z.vide || (!z.hard.length && !z.soft.length)){
    $('#seuils').innerHTML = `<div class="seuils-vide">aucun pack à mesurer — crée une tâche puis écris son context.md</div>`;
  } else {
    const groupe = (titre, note, lignes) => `
      <div class="sgroup">
        <div class="sgroup-t"><b>${titre}</b> = { <span style="color:#5d6880"># ${note}</span></div>
        ${lignes.map(l => `
          <div class="srow ${l.ok ? 'ok' : 'ko'}">
            <span class="sn">${esc(l.nom)}</span>
            <span class="ss">${esc(l.seuil)}</span>
            <span class="sv">${esc(l.valeur)}</span>
            <span class="sk">${l.ok ? '✓' : '✗'}</span>
          </div>`).join('')}
        <div class="sgroup-t">}</div>
      </div>`;
    $('#seuils').innerHTML =
      groupe('DUR', 'refuse le dispatch, sans discussion', z.hard) +
      groupe('SOUPLE', 'signale, laisse passer', z.soft);
  }

  $('#pm-row').innerHTML = s.pipeline.map((p, i) =>
    `${i ? '<span class="pm-arrow">→</span>' : ''}
     <span class="pm-step" style="--c:${COULEUR_STATUT[p.k]}">${esc(p.k)} <b>${p.n}</b></span>`).join('');
}

/* ══════════════════════════════════════════════════════════════════════
   SUPERVISION — prod, erreurs, télémétrie, retours
   Aucun chiffre n'est inventé ici : tout vient des sources déclarées dans
   supervision.json. Sans source, on le dit, on ne remplit pas le vide.
   ══════════════════════════════════════════════════════════════════════ */
const EXEMPLE_SUP = `{
  "service": "mon-app",
  "version": "1.4.2",
  "sondes": [
    {"nom": "api",    "url": "http://127.0.0.1:3000/health", "attendu": 200},
    {"nom": "worker", "fichier": "run/worker.alive", "frais_s": 120}
  ],
  "erreurs":    "logs/erreurs.jsonl",
  "telemetrie": "logs/telemetrie.json",
  "retours":    "logs/retours.jsonl"
}`;

function courbelette(valeurs, couleur, l = 120, h = 26){
  if (!valeurs || valeurs.length < 2) return '';
  const min = Math.min(...valeurs), max = Math.max(...valeurs), amp = max - min || 1;
  const p = valeurs.map((v, i) =>
    `${(i / (valeurs.length - 1) * l).toFixed(1)},${(h - 2 - (v - min) / amp * (h - 5)).toFixed(1)}`).join(' ');
  return `<svg viewBox="0 0 ${l} ${h}" width="${l}" height="${h}" preserveAspectRatio="none">
    <polyline points="${p}" fill="none" stroke="${couleur}" stroke-width="1.6"
      stroke-linejoin="round" stroke-linecap="round"/></svg>`;
}

function sourceOuRien(bloc, quoi){
  if (!bloc || bloc.source === null || bloc.source === undefined)
    return `<div class="sup-rien">aucune source <b>${quoi}</b> déclarée</div>`;
  if (bloc.absent) return `<div class="sup-rien">fichier introuvable : <code>${esc(bloc.source)}</code></div>`;
  if (bloc.illisible) return `<div class="sup-rien ko">illisible : ${esc(bloc.illisible)}</div>`;
  return null;
}

function rendreSupervision(s){
  const sup = s.supervision;
  const hote = $('#supervision');
  if (!sup) { hote.innerHTML = ''; return; }

  if (!sup.configure){
    hote.innerHTML = `<div class="panel sup-pleine">
      <div class="panel-head">
        <span class="panel-title">SUPERVISION · PROD</span>
        <span class="panel-meta">AUCUNE SOURCE DÉCLARÉE</span>
      </div>
      <div class="sup-vide">
        ${sup.erreur ? `<div class="sup-rien ko">${esc(sup.erreur)}</div>` : ''}
        <p>Santé de la prod, erreurs, télémétrie et retours utilisateurs se
        branchent sur <b>tes</b> sources. Crée <code>${esc(sup.fichier)}</code>
        à la racine du dépôt :</p>
        <pre>${esc(EXEMPLE_SUP)}</pre>
        <p class="sup-note">Tant qu'il n'existe pas, ces panneaux restent vides —
        ils n'afficheront jamais de chiffres simulés.</p>
      </div></div>`;
    return;
  }

  const e = sup.erreurs || {}, t = sup.telemetrie || {}, r = sup.retours || {};
  const vOk = sup.verdict === 'ok';

  const pSante = `<div class="panel sup">
    <div class="panel-head">
      <span class="panel-title">SANTÉ PROD</span>
      <span class="panel-meta">${esc(sup.service)} · ${esc(sup.version)}</span>
    </div>
    <div class="sup-corps">
      <div class="sup-verdict ${vOk ? 'ok' : 'ko'}">
        <span class="sup-pastille"></span>${vOk ? 'OPÉRATIONNEL' : `${sup.ko} SONDE(S) AU ROUGE`}
      </div>
      ${sup.sondes.length ? sup.sondes.map(x => `
        <div class="sonde ${x.etat}">
          <span class="sonde-dot"></span>
          <span class="sonde-nom">${esc(x.nom)}</span>
          <span class="sonde-detail">${esc(x.detail || '')}</span>
          <span class="sonde-ms">${x.ms != null ? x.ms + ' ms' : ''}</span>
        </div>`).join('') : `<div class="sup-rien">aucune sonde déclarée</div>`}
    </div></div>`;

  const vide = sourceOuRien(e, 'erreurs');
  const pErreurs = `<div class="panel sup">
    <div class="panel-head">
      <span class="panel-title">ERREURS</span>
      <span class="panel-meta">${e.fenetre_h ? e.fenetre_h + ' DERNIÈRES HEURES' : ''}</span>
    </div>
    <div class="sup-corps">${vide || `
      <div class="sup-chiffres">
        <div><b class="${e.total ? 'ko' : 'ok'}">${e.total}</b><span>sur ${e.fenetre_h} h</span></div>
        <div><b>${e.par_heure}</b><span>par heure</span></div>
        ${Object.entries(e.niveaux || {}).slice(0,2).map(([k,v]) =>
          `<div><b>${v}</b><span>${esc(k)}</span></div>`).join('')}
      </div>
      ${(e.top || []).length ? `<div class="sup-liste">${e.top.map(x => `
        <div class="err">
          <span class="err-n">×${x.n}</span>
          <span class="err-msg" title="${esc(x.message)}">${esc(x.message)}</span>
          <span class="err-ou">${esc(x.ou)}</span>
        </div>`).join('')}</div>` : `<div class="sup-rien">aucune erreur sur la fenêtre</div>`}
      ${e.lignes_abimees ? `<div class="sup-note">${e.lignes_abimees} ligne(s) illisible(s) ignorée(s)</div>` : ''}
    `}</div></div>`;

  const videT = sourceOuRien(t, 'télémétrie');
  const pTele = `<div class="panel sup">
    <div class="panel-head">
      <span class="panel-title">TÉLÉMÉTRIE</span>
      <span class="panel-meta">${esc(t.maj || '')}</span>
    </div>
    <div class="sup-corps">${videT || `
      <div class="sup-tuiles">${(t.metriques || []).map(m => `
        <div class="tuile">
          <span class="tuile-n">${esc(m.valeur)}<i>${esc(m.unite || '')}</i></span>
          <span class="tuile-l">${esc(m.nom || '')}</span>
          ${m.delta ? `<span class="tuile-d ${String(m.delta).startsWith('-') ? 'bas' : 'haut'}">${esc(m.delta)}</span>` : ''}
        </div>`).join('') || '<div class="sup-rien">aucune métrique</div>'}
      </div>
      ${Object.entries(t.series || {}).map(([nom, vals]) => `
        <div class="serie"><span>${esc(nom)}</span>${courbelette(vals, '#2de2e6')}</div>`).join('')}
    `}</div></div>`;

  const videR = sourceOuRien(r, 'retours');
  const maxD = Math.max(1, ...Object.values(r.distribution || {1:0}));
  const pRetours = `<div class="panel sup">
    <div class="panel-head">
      <span class="panel-title">RETOURS UTILISATEURS</span>
      <span class="panel-meta">${r.total != null ? r.total + ' SUR 7 JOURS' : ''}</span>
    </div>
    <div class="sup-corps">${videR || `
      <div class="sup-note-globale">
        <b class="${r.moyenne >= 3.5 ? 'ok' : r.moyenne != null ? 'ko' : ''}">${r.moyenne ?? '—'}</b>
        <span>/ 5 sur ${r.notes} note(s)${r.mecontents ? ` · ${r.mecontents} mécontent(s)` : ''}</span>
      </div>
      <div class="distrib">${[5,4,3,2,1].map(n => `
        <div class="dline"><span>${n}★</span>
          <i style="width:${(r.distribution[n] / maxD * 100).toFixed(0)}%"></i>
          <b>${r.distribution[n]}</b></div>`).join('')}
      </div>
      <div class="sup-liste">${(r.derniers || []).map(x => `
        <div class="avis">
          <span class="avis-note n${x.note}">${x.note ?? '—'}★</span>
          <span class="avis-txt" title="${esc(x.texte)}">${esc(x.texte)}</span>
          <span class="avis-qui">${esc(x.qui)}</span>
        </div>`).join('') || '<div class="sup-rien">aucun retour</div>'}
      </div>
    `}</div></div>`;

  const dep = sup.depots || [];
  const pDepots = `<div class="panel sup">
    <div class="panel-head">
      <span class="panel-title">DÉPÔTS</span>
      <span class="panel-meta">${dep.length ? dep.length + ' DÉCLARÉ(S) · GIT RÉEL' : 'AUCUNE SOURCE'}</span>
    </div>
    <div class="sup-corps">${dep.length ? dep.map(x => `
      <div class="depot ${x.etat}">
        <span class="sonde-dot"></span>
        <span class="depot-nom">${esc(x.nom)}</span>
        <span class="depot-branche">${esc(x.branche || '')}</span>
        <span class="depot-chiffres">${x.detail ? esc(x.detail) :
          `${x.modifies ? `<b class="warn">${x.modifies} modifié(s)</b>` : '<b class="ok">propre</b>'}
           · ↑${esc(String(x.avance))} ↓${esc(String(x.retard))}`}</span>
        <span class="depot-dernier" title="${esc(x.dernier || '')}">${esc(x.dernier || '')}</span>
      </div>`).join('') : `<div class="sup-rien">déclare <code>"depots": ["~/chemin"]</code> dans supervision.json</div>`}
    </div></div>`;

  hote.innerHTML = pSante + pDepots + pErreurs + pTele + pRetours;
}

/* ══════════════════════════════════════════════════════════════════════
   BOUCLE
   ══════════════════════════════════════════════════════════════════════ */
let salleFaite = false, signatureSalle = '';

function rendre(s){
  rendreDeck(s);

  // La salle se reconstruit quand les relais changent — sinon on se contente
  // de rallumer les bureaux, bien moins cher.
  // Reconstruire aussi quand le nombre d'agents par poste change : c'est ce qui
  // fait apparaître ou disparaître une silhouette.
  const sig = JSON.stringify([(s.flux || []).map(f => [f.de, f.vers, f.etat]),
                              s.roles.map(r => r.actifs || 0)]);
  if (!salleFaite || sig !== signatureSalle){
    construireSalle(s);
    salleFaite = true;
    signatureSalle = sig;
  } else {
    const actifs = new Set(s.roles.filter(r => r.actif).map(r => r.cle));
    $$('#room .desk').forEach(d => d.classList.toggle('actif', actifs.has(d.id.replace('desk-',''))));
  }
  rendreCourbe(s);
  rendreTaches(s);
  rendreSeuils(s);
  rendreTodo(s);
  rendreFlux(s);
  rendreSupervision(s);
  peuplerConsole(s);

  poser($('#hud-time'), s.heure, 'h');
  poser($('#projet-nom'), s.projet.titre, 'pn');
  poser($('#projet-slug'), s.projet.slug, 'ps');
  poser($('#projet-statut'), s.projet.statut, 'pst');
  poser($('#projet-obj'), s.projet.objectif, 'po');
  poser($('#projet-depot'), s.projet.depot || 'non déclaré — champ « depot: » du brief', 'pd');
  document.title = `AgentX · ${s.projet.titre}`;

  const tk = $('#ticker');
  if (tk.textContent.trim() !== s.ticker){
    tk.textContent = s.ticker + '          ·          ';
  }

  let flag = $('.demo-flag');
  if (s.demo && !flag){
    flag = document.createElement('div');
    flag.className = 'demo-flag';
    flag.innerHTML = 'MODE <b>DÉMO</b> — vault vide, données simulées';
    document.body.appendChild(flag);
  } else if (!s.demo && flag) flag.remove();
}

let echecs = 0, ETAT = null;

async function charger(){
  const r = await fetch('state.json?' + Date.now(), {cache:'no-store'});
  const s = await r.json();
  if (s.erreur) throw new Error(s.erreur);
  ETAT = s;
  rendre(s);
  return s;
}

async function boucle(){
  try{ await charger(); echecs = 0; }
  catch(e){ if (++echecs === 3) console.warn('dash: vault injoignable', e); }
  setTimeout(boucle, 2000);
}

/* ══════════════════════════════════════════════════════════════════════
   CONSOLE — n'envoie jamais une chaîne de commande, seulement une action
   nommée + ses paramètres. C'est le serveur qui décide si elle est permise.
   ══════════════════════════════════════════════════════════════════════ */
const sortie = () => $('#console-out');

function ecrire(html, etat){
  sortie().hidden = !html;
  sortie().innerHTML = html;
  sortie().scrollTop = 0;
  const e = $('#console-etat');
  e.textContent = etat || '';
  e.className = 'console-etat ' + (etat === 'ok' ? 'ok' : etat ? 'ko' : '');
}

async function lancer(req, bouton){
  if (!ETAT?.jeton){ ecrire('état pas encore chargé.', 'erreur'); return; }
  if (bouton) bouton.disabled = true;
  ecrire('…', '');
  try{
    const r = await fetch('api/run', {
      method:'POST',
      headers:{'Content-Type':'application/json', 'X-AgentX-Jeton': ETAT.jeton},
      body: JSON.stringify(req)
    });
    const d = await r.json();
    if (d.erreur){
      ecrire(`<span class="ko">refusé — ${esc(d.erreur)}</span>`, 'refusé');
    } else {
      const k = d.code === 0 ? 'ok' : 'ko';
      ecrire(`<span class="cmd">$ ${esc(d.commande)}</span>\n`
           + (d.out ? esc(d.out) : '')
           + (d.err ? `<span class="ko">${esc(d.err)}</span>` : '')
           + `\n<span class="${k}">— code ${d.code}</span>`,
        d.code === 0 ? 'ok' : `code ${d.code}`);
    }
    await charger();          // la salle suit sans attendre le prochain tic
  }catch(e){
    ecrire(`<span class="ko">injoignable — ${esc(e.message)}</span>`, 'erreur');
  }finally{
    if (bouton) bouton.disabled = false;
  }
}

async function copier(texte, bouton){
  try{ await navigator.clipboard.writeText(texte); }
  catch{                                   // repli si le presse-papier est refusé
    const z = document.createElement('textarea');
    z.value = texte; document.body.appendChild(z); z.select();
    document.execCommand('copy'); z.remove();
  }
  if (bouton){
    const avant = bouton.textContent;
    bouton.textContent = '✓ copié';
    bouton.classList.add('fait');
    setTimeout(() => { bouton.textContent = avant; bouton.classList.remove('fait'); }, 1400);
  }
}

function peuplerConsole(s){
  const tid = $('#c-tid'), st = $('#c-statut');
  if (!tid || !st) return;
  const sigT = s.taches.map(t => t.id + t.statut).join();
  if (tid.dataset.sig !== sigT){
    tid.dataset.sig = sigT;
    const garde = tid.value;
    tid.innerHTML = s.taches.map(t =>
      `<option value="${t.id}">${esc(t.id)} · ${esc(t.titre.slice(0, 34))} [${esc(t.statut)}]</option>`).join('');
    if (garde && s.taches.some(t => t.id === garde)) tid.value = garde;
  }
  if (!st.childElementCount && s.statuts){
    st.innerHTML = s.statuts.map(x => `<option value="${x}">${esc(x)}</option>`).join('');
    st.value = 'fait';
  }
}

function brancherConsole(){
  $$('.cbtn[data-lire]').forEach(b =>
    b.onclick = () => lancer({action: b.dataset.lire, projet: ETAT?.projet?.slug}, b));

  if ($('#c-set')) $('#c-set').onclick = e => lancer({
    action:'set', tid: $('#c-tid').value, statut: $('#c-statut').value,
    projet: ETAT?.projet?.slug
  }, e.currentTarget);

  if ($('#c-lint')) $('#c-lint').onclick = e => lancer({
    action:'pack-lint', tid: $('#c-tid').value, projet: ETAT?.projet?.slug
  }, e.currentTarget);

  $('#todo').addEventListener('click', e => {
    const run = e.target.closest('[data-exe]'), cp = e.target.closest('[data-copie]');
    if (run)  lancer(ETAT.todo[+run.dataset.exe].exe, run);
    if (cp)   copier(ETAT.todo[+cp.dataset.copie].cmd, cp);
  });
}

/* ── terminal Claude Code ──────────────────────────────────────────────
   xterm.js côté page, pseudo-terminal côté serveur. Le serveur ne lance
   qu'un seul programme, `claude` dans la racine d'AgentX ; la page ne fait
   que lui transmettre les touches et afficher ce qu'il répond.
   ══════════════════════════════════════════════════════════════════════ */
const TERMINAL = {term:null, fit:null, pos:0, src:null, vivant:false};

function termEtat(txt, k){
  const e = $('#term-etat'); e.textContent = txt; e.className = 'term-etat ' + (k || '');
}

async function termPost(route, charge){
  if (!ETAT?.jeton) return null;
  try{
    const r = await fetch('api/term/' + route, {
      method:'POST',
      headers:{'Content-Type':'application/json', 'X-AgentX-Jeton': ETAT.jeton},
      body: JSON.stringify(charge || {})
    });
    return await r.json();
  }catch(e){ termEtat('injoignable', 'ko'); return null; }
}

/* les touches partent dans l'ordre : une requête en vol, le reste s'accumule */
const FILE = {tampon:'', envoi:false};
async function termEnvoyer(data){
  FILE.tampon += data;
  if (FILE.envoi) return;
  FILE.envoi = true;
  try{
    while (FILE.tampon){
      const bloc = FILE.tampon; FILE.tampon = '';
      const r = await termPost('in', {data: bloc});
      if (r?.mort){ termMort(); break; }
    }
  } finally { FILE.envoi = false; }
}

function termMort(){
  if (!TERMINAL.vivant) return;
  TERMINAL.vivant = false; FILE.tampon = '';
  if (TERMINAL.src) TERMINAL.src.close();
  termEtat('session perdue — relance', 'ko');
  TERMINAL.term.write('\r\n\x1b[31m— session perdue (salle relancée). réouverture…\x1b[0m\r\n');
  TERMINAL.pos = 0;
  setTimeout(termLancer, 800);
}

function termEcouter(){
  if (TERMINAL.src) TERMINAL.src.close();
  const src = new EventSource(`api/term/stream?jeton=${encodeURIComponent(ETAT.jeton)}&depuis=${TERMINAL.pos}`);
  TERMINAL.src = src;
  src.onmessage = ev => {
    const d = JSON.parse(ev.data);
    if (d.mort){ termMort(); return; }
    if (d.o){
      const bin = atob(d.o), octets = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) octets[i] = bin.charCodeAt(i);
      TERMINAL.term.write(octets);
    }
    if (d.pos != null) TERMINAL.pos = d.pos;
    if (d.fin != null){
      TERMINAL.vivant = false;
      termEtat(`terminé · code ${d.fin}`, d.fin === 0 ? '' : 'ko');
      TERMINAL.term.write('\r\n\x1b[2m— le chef de projet a quitté la salle. ▶ lancer pour le rappeler.\x1b[0m\r\n');
      src.close();
    }
  };
  src.onerror = () => {               // reprise automatique, depuis la position connue
    if (TERMINAL.vivant) setTimeout(termEcouter, 1500);
  };
}

async function termLancer(){
  const t = TERMINAL.term;
  TERMINAL.fit.fit();
  const r = await termPost('open', {cols: t.cols, rows: t.rows});
  if (!r || r.erreur){ termEtat(r?.erreur || 'erreur', 'ko'); return; }
  TERMINAL.vivant = r.vivant;
  termEtat(r.vivant ? 'en session' : 'arrêté', r.vivant ? 'ok' : '');
  termEcouter();
  t.focus();
}

function brancherTerminal(){
  const conteneur = $('#term');
  if (!conteneur || !window.Terminal) return;
  const term = new Terminal({
    cursorBlink:true, fontFamily:getComputedStyle(document.body).getPropertyValue('--mono') || 'monospace',
    fontSize:13, lineHeight:1.2, scrollback:5000, allowProposedApi:true,
    theme:{background:'#070810', foreground:'#c9d2e2', cursor:'#3b82f6',
           selectionBackground:'rgba(59,130,246,.35)', black:'#0a0b10', brightBlack:'#5d6880'}
  });
  const fit = new (window.FitAddon?.FitAddon || window.FitAddon)();
  term.loadAddon(fit);
  term.open(conteneur);
  fit.fit();
  TERMINAL.term = term; TERMINAL.fit = fit;
  term.writeln('\x1b[2mle chef de projet arrive…\x1b[0m');

  term.onData(data => { if (TERMINAL.vivant) termEnvoyer(data); else termLancer(); });

  /* Claude Code active le suivi souris (modes 1000-1006) et dessine son propre
     viewport : la molette doit lui parvenir en séquences SGR, sinon rien ne
     défile pendant une tâche. Sans suivi souris, xterm garde son défilement. */
  term.attachCustomWheelEventHandler(ev => {
    if (!TERMINAL.vivant || term.modes.mouseTrackingMode === 'none') return true;
    const r = term.element.getBoundingClientRect();
    const col = Math.max(1, Math.min(term.cols, Math.floor((ev.clientX - r.left) / (r.width / term.cols)) + 1));
    const row = Math.max(1, Math.min(term.rows, Math.floor((ev.clientY - r.top) / (r.height / term.rows)) + 1));
    const crans = Math.max(1, Math.min(5, Math.round(Math.abs(ev.deltaY) / 50)));
    const code = ev.deltaY < 0 ? 64 : 65;
    termEnvoyer(`\x1b[<${code};${col};${row}M`.repeat(crans));
    ev.preventDefault();
    return false;
  });

  /* plein écran : le terminal prend toute la fenêtre, Échap ou le bouton pour sortir */
  const panneau = conteneur.closest('.term-panel');
  const basculer = () => { panneau.classList.toggle('plein'); setTimeout(() => { fit.fit(); term.focus(); }, 50); };
  $('#term-full').onclick = basculer;
  addEventListener('keydown', e => { if (e.key === 'Escape' && panneau.classList.contains('plein') && document.activeElement?.className !== 'xterm-helper-textarea') basculer(); });
  term.onResize(({cols, rows}) => { if (TERMINAL.vivant) termPost('resize', {cols, rows}); });
  let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => fit.fit(), 150); });

  $('#term-start').onclick = termLancer;
  $('#term-stop').onclick = async () => { await termPost('stop'); };

  /* une session déjà ouverte côté serveur (page rechargée) : on la reprend */
  const reprise = setInterval(async () => {
    if (!ETAT?.jeton) return;
    clearInterval(reprise);
    const e = await termPost('etat');
    if (e?.vivant){ TERMINAL.pos = 0; TERMINAL.vivant = true; termEtat('en session', 'ok'); termEcouter(); term.focus(); }
    else termLancer();                 // sinon on ouvre la session tout de suite
  }, 300);
}

brancherConsole();
brancherTerminal();
boucle();

/* la courbe se redessine proprement au redimensionnement */
let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { salleFaite = false; }, 200); });

/* AgentX · salle des agents — rendu + animation. Aucune dépendance. */

const COULEURS = {
  accent:'#3b82f6', green:'#22e07a', violet:'#a855f7', red:'#ff3b5c',
  blue:'#3b82f6', yellow:'#ffcc33', orange:'#ff8a3d', cyan:'#2de2e6'
};
/* rempli par majRegistre depuis s.roles (roles.json) : aucune couleur en dur.
   Registres sans prototype : un rôle `constructor` lu du vault n'y trouve rien. */
const COULEUR_ROLE = {__proto__: null};
const COULEUR_STATUT = {__proto__: null,
  'a-faire':'#5d6880', 'pret':'#2de2e6', 'en-cours':'#3b82f6',
  'revue':'#a855f7', 'bloque':'#ff3b5c', 'fait':'#22e07a',
  'rejete':'#9f1239', 'abandonne':'#3a4460'
};

function majRegistre(s){
  for (const k of Object.keys(COULEUR_ROLE)) delete COULEUR_ROLE[k];
  for (const r of s.roles) COULEUR_ROLE[r.cle] = r.couleur;
}

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
  // Le registre peut changer (roles.json) : on rebâtit les cartes quand
  // la liste des rôles ou leurs couleurs bougent.
  const registre = s.roles.map(r => r.cle + r.couleur).join(',');
  if (deck.dataset.registre !== registre){
    deck.dataset.registre = registre;
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
  let erreur = $('.deck-erreur:not(.deck-erreur-produits)', deck);
  if (s.registre_erreur){
    if (!erreur){
      erreur = document.createElement('div');
      erreur.className = 'deck-erreur';
      deck.prepend(erreur);
    }
    erreur.textContent = 'roles.json invalide : ' + s.registre_erreur;
  } else if (erreur) erreur.remove();
  let erreurP = $('.deck-erreur-produits', deck);
  if (s.produits_erreur){
    if (!erreurP){
      erreurP = document.createElement('div');
      erreurP.className = 'deck-erreur deck-erreur-produits';
      deck.prepend(erreurP);
    }
    erreurP.textContent = 'produits.json invalide : ' + s.produits_erreur;
  } else if (erreurP) erreurP.remove();
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
    $('[data-f="note"]', c).title = r.note;          // tronquée à l'écran
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

  // Une silhouette par instance : au-delà d'une, la rangée part du bord gauche
  // du poste, rétrécit et se serre (un quart de recouvrement, les yeux restent
  // visibles) pour tenir dans l'emprise du bureau quel que soit N.
  const montre = Math.min(Math.max(agents, 1), 4);
  const t = [1, .85, .72, .62][montre - 1];
  const gauche = mx - 11.5, pas = 23 * t * .75;
  const xs = Array.from({length: montre}, (_, k) => gauche + 23 * t / 2 + k * pas);
  const droite = xs[montre - 1] + 23 * t / 2;
  const equipe = xs.map((x, k) => mascotte(x, my + 7, couleur, t, k * .37)).join('')
    + (agents > montre
      ? `<text x="${(droite + 4).toFixed(1)}" y="${(my + 4).toFixed(1)}"
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
  const lw = titre.length * 5.1;
  // emprise (bureau + fantômes + plaque) et points d'accroche des relais, de
  // part et d'autre de la rangée : ni puce ni flèche sur un visage
  const poste = {
    cle,
    box: [Math.min(gauche, lx - lw/2 - 5), ey - 35, Math.max(iso(gx + 1.5, gy, 0)[0], droite + 16), my + 14],
    cotes: [[gauche - 20, my - 3], [droite + 20, my - 3]],
  };
  return {svg, poste, label:{x:lx, y:ly, t:titre, c:couleur, w:lw}};
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

/* emplacement de chaque poste : sert aux bureaux ET aux arcs de relais.
   Recalculé dans construireSalle depuis s.roles : chef fixe au fond, rôles
   affectables rangés ligne par ligne dans l'ordre du registre. */
let POSTES = {__proto__: null};
function postesSalle(roles){
  const aff = roles.filter(r => r.affectable);
  const n = aff.length;
  const COLS = n <= 6 ? 3 : 4, X0 = 1.2, PAS_X = 2.25, Y0 = 2.0;
  const rows = Math.ceil(n / COLS);
  const PAS_Y = rows > 1 ? Math.min(2.2, 4.4 / (rows - 1)) : 0;
  const postes = {__proto__: null, chef: [9.9, 0.7]};
  aff.forEach((r, i) => {
    postes[r.cle] = [X0 + (i % COLS) * PAS_X, Y0 + Math.floor(i / COLS) * PAS_Y];
  });
  return postes;
}
/* une seule source pour les objets au sol */
const OBJETS = {
  vault:    [11.1, 4.3],
  fusee:    [10.7, 6.4],
  radar:    [10.7, 7.9],
  poubelle: [0.3, 6.0],
  plantes:  [[11.6, 1.4], [0.3, 3.2], [5.0, 8.6], [7.0, 8.5]],
};
const RANG_ETAT = {attente:0, livre:1, actif:2, bloque:3};
const COULEUR_ETAT = {attente:'#39415a', livre:'#2de2e6', actif:'#22e07a', bloque:'#ff3b5c'};

/* ── ce qui transite sur un relais ───────────────────────────────────────
   Dessiné centré sur (0,0) pour pouvoir être posé sur un chemin ou dans une
   puce. Le trait prend la couleur de l'émetteur. */
const GLYPHES = {__proto__: null,
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
  verdict: c => `<path d="M0-6.4v12.4M-3.6 6h7.2M-6-3.8h12" stroke="${c}" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M-6-3.8-8 1h4ZM6-3.8 4 1h4Z" fill="none" stroke="${c}" stroke-width="1.2" stroke-linejoin="round"/>`,
  revue: c => `<circle cx="-1.2" cy="-1.2" r="4.4" fill="none" stroke="${c}" stroke-width="1.4"/>
    <path d="M2 2 6 6" stroke="${c}" stroke-width="1.7" stroke-linecap="round"/>`,
  tests: c => `<path d="M-2.2-6.4v4.6L-6.2 5.4h12.4L2.2-1.8v-4.6M-3.4-6.4h6.8"
      fill="none" stroke="${c}" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="M-4.4 2.2h8.8" stroke="${c}" stroke-width="1.2"/>`,
  maquette: c => `<rect x="-6.2" y="-5.4" width="12.4" height="10.8" rx="1.5" fill="none" stroke="${c}" stroke-width="1.4"/>
    <path d="M-6.2-2.4h12.4M-1.6-2.4v7.8" stroke="${c}" stroke-width="1.2"/>`,
  audit: c => `<path d="M0-6.6 5.6-4.4v3.6C5.6 2.6 3.2 5.2 0 6.6-3.2 5.2-5.6 2.6-5.6-.8v-3.6Z"
      fill="none" stroke="${c}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M-2.4 0 -.6 1.8 2.6-1.6" fill="none" stroke="${c}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  build: c => `<path d="M0-6.4 5.6-3.2v6.4L0 6.4-5.6 3.2v-6.4ZM-5.6-3.2 0 0 5.6-3.2M0 0v6.4"
      fill="none" stroke="${c}" stroke-width="1.3" stroke-linejoin="round"/>`,
  resultat: c => `<path d="M-4.6-6.5h6l3.6 3.6v9.4h-9.6Z" fill="none" stroke="${c}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M1.4-6.5v3.6h3.6" fill="none" stroke="${c}" stroke-width="1.2"/>`,
  question: c => `<circle r="6.6" fill="none" stroke="${c}" stroke-width="1.4"/>
    <path d="M-2.1-1.9a2.1 2.1 0 1 1 2.1 2.6v1" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="0" cy="4" r="1" fill="${c}"/>`,
  // rôles métier : juriste, tresorier, produit, marketing, rssi, syndicat
  avis: c => `<path d="M0-6.4 2.8-3.6-2.8 2-5.6-.8Z" fill="none" stroke="${c}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M0-.8 5 4.2M-6.2 6.2h7" stroke="${c}" stroke-width="1.4" stroke-linecap="round"/>`,
  budget: c => `<circle r="6.4" fill="none" stroke="${c}" stroke-width="1.4"/>
    <path d="M2.6-2.8a3.4 3.4 0 1 0 0 5.6" fill="none" stroke="${c}" stroke-width="1.3" stroke-linecap="round"/>
    <path d="M-3.6-.9h3.8M-3.6 1.1h3.8" stroke="${c}" stroke-width="1.2" stroke-linecap="round"/>`,
  specs: c => `<rect x="-5" y="-5.2" width="10" height="11.8" rx="1.5" fill="none" stroke="${c}" stroke-width="1.4"/>
    <path d="M-2.2-5.2v-1.4h4.4v1.4" fill="none" stroke="${c}" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M-3-1.4l.9.9 1.5-1.7M-3 2.6l.9.9 1.5-1.7M.8-1h2M.8 3h2" fill="none" stroke="${c}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  contenus: c => `<path d="M-6.2-2h2.6L3.4-5.8v11.6L-3.6 2h-2.6Z" fill="none" stroke="${c}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M-4.6 2.4-3.6 6M5.6-2.2a3.2 3.2 0 0 1 0 4.4" fill="none" stroke="${c}" stroke-width="1.3" stroke-linecap="round"/>`,
  risques: c => `<path d="M-6.2 2.4a6.2 6.2 0 0 1 12.4 0" fill="none" stroke="${c}" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M-4.4-2-3.4-1M0-3.8v1.4M4.4-2 3.4-1" stroke="${c}" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M0 2.4 3-1.6" stroke="${c}" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="0" cy="2.4" r="1.3" fill="${c}"/>`,
  cahier: c => `<rect x="-4" y="-6.4" width="9.6" height="12.8" rx="1.2" fill="none" stroke="${c}" stroke-width="1.4"/>
    <path d="M-6-3.6h3.6M-6 0h3.6M-6 3.6h3.6" stroke="${c}" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M-.4-2.6h3.4M-.4.6h3.4" stroke="${c}" stroke-width="1.2" stroke-linecap="round"/>`,
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

/** arcs de relais : une courbe par couple de rôles qui se passent le travail
 *  `postes` = emprise et accroches de chaque bureau, telles que dessinées */
function arcsRelais(flux, postes){
  // Tout relais vers le scribe part du vault : un seul arc au lieu de cinq
  // qui traverseraient la salle.
  const VAULT = iso(OBJETS.vault[0] + .45, OBJETS.vault[1] + .9, 0);
  const centre = r => r === 'vault' ? VAULT : iso(POSTES[r][0] + .75, POSTES[r][1] + 1.5, 0);
  // accroche du côté de l'autre bout (à gauche si à l'aplomb)
  const ancre = (r, autre) => r === 'vault' ? VAULT
    : postes[r].cotes[centre(autre)[0] > centre(r)[0] ? 1 : 0];
  const fort = new Map();
  for (const f0 of flux || []){
    // rôle inconnu, boucle sur soi, vault vers un autre que le scribe : rien
    if (!(POSTES[f0.de] || (f0.de === 'vault' && f0.vers === 'scribe'))
        || !POSTES[f0.vers] || f0.de === f0.vers) continue;
    const f = f0.vers === 'scribe' ? {...f0, de:'vault'} : f0;
    const k = `${f.de}>${f.vers}`;
    if (!fort.has(k) || RANG_ETAT[f.etat] > RANG_ETAT[fort.get(k).etat]) fort.set(k, f);
  }
  const anim = !window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  const COULEUR = {...COULEUR_ROLE, vault:'#7c8aa6'};

  // nombre de points de la quadratique tombant dans un bureau tiers
  const traverse = (f, ax, ay, mx, my, bx, by) => {
    let n = 0;
    for (const [r, {box:[x1, y1, x2, y2]}] of Object.entries(postes)){
      if (r === f.de || r === f.vers) continue;
      for (let i = 0; i <= 100; i++){
        const t = i / 100, u = 1 - t;
        const x = u*u*ax + 2*u*t*mx + t*t*bx, y = u*u*ay + 2*u*t*my + t*t*by;
        if (x > x1 && x < x2 && y > y1 && y < y2) n++;
      }
    }
    return n;
  };

  const chemins = [...fort.values()].map(f => {
    const [ax, ay] = ancre(f.de, f.vers);
    const [bx, by] = ancre(f.vers, f.de);
    // bombé vers le haut par défaut ; sinon le premier tracé qui contourne
    // tous les bureaux tiers (droit, vers le bas, latéral, plus ample)
    const cx = (ax + bx) / 2, cy = (ay + by) / 2, h = 42 + Math.abs(bx - ax) * .14;
    const essais = [[0, -h], [0, 0], [0, h], [h, 0], [-h, 0], [0, -2*h], [0, 2*h], [2*h, 0], [-2*h, 0]]
      .map(([dx, dy]) => [cx + dx, cy + dy]);
    const n = essais.map(([mx, my]) => traverse(f, ax, ay, mx, my, bx, by));
    const [mx, my] = essais[n.indexOf(Math.min(...n))];
    const d = `M${ax.toFixed(1)},${ay.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${bx.toFixed(1)},${by.toFixed(1)}`;
    const c = f.etat === 'bloque' ? COULEUR_ETAT.bloque : COULEUR[f.de];
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

  const marqueurs = Object.entries(COULEUR).map(([k, c]) => `
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

  /* grand écran du fond : la courbe d'avancement, plafonnée 9 u sous le titre
     (titre incliné comme le mur, sinon la courbe le traverse) */
  const serie = s.serie.points.length > 1 ? s.serie.points : [0, 0];
  const maxP = Math.max(1, ...serie), n = serie.length;
  const courbe = serie.map((v, i) =>
    iso(2.6 + (i/(n-1)) * 6.8, 0, 2.9 + (v/maxP) * 1.0).map(a => a.toFixed(1)).join(',')).join(' ');
  const ecran = `
    <polygon points="${pts([[2.2,0,2.4],[9.8,0,2.4],[9.8,0,4.7],[2.2,0,4.7]])}" fill="#060910" stroke="#222a3c" stroke-width="1.4"/>
    <g class="screen-glow">
      <polyline points="${pts([[2.6,0,2.9],[9.4,0,2.9]])}" fill="none" stroke="#1b2233" stroke-dasharray="4 4"/>
      <polyline points="${courbe}" fill="none" stroke="#22e07a" stroke-width="2" stroke-linejoin="round"/>
    </g>
    <text transform="translate(${iso(6,0,4.36).map(a => a.toFixed(1)).join(',')}) skewY(26.565)" text-anchor="middle"
          font-family="ui-monospace,monospace" font-size="9" letter-spacing="2" fill="#2de2e6">
      ${esc((s.projet.slug || '').toUpperCase())} · ${esc(s.serie.valeur)} LIVRÉES</text>`;

  /* tableau mural gauche : la pipeline */
  const maxPipe = Math.max(1, ...s.pipeline.map(p => p.n));
  const pas = 5.4 / s.pipeline.length, larg = pas * .67;
  const tableau = `
    <polygon points="${pts([[0,1.4,2.4],[0,7.4,2.4],[0,7.4,4.5],[0,1.4,4.5]])}" fill="#060910" stroke="#222a3c" stroke-width="1.4"/>
    ${s.pipeline.map((p, i) => {
      const y0 = 1.7 + i * pas, h = .25 + (p.n / maxPipe) * 1.5;
      return `<polygon points="${pts([[0,y0,2.7],[0,y0+larg,2.7],[0,y0+larg,2.7+h],[0,y0,2.7+h]])}"
               fill="${COULEUR_STATUT[p.k] || '#5d6880'}" opacity=".85"/>`;
    }).join('')}
    <text x="${iso(0,4.4,4.2)[0].toFixed(1)}" y="${iso(0,4.4,4.2)[1].toFixed(1)}" text-anchor="middle"
          font-family="ui-monospace,monospace" font-size="8.5" letter-spacing="2" fill="#3b82f6">PIPELINE</text>`;

  /* objets au sol : dessinés de l'arrière vers l'avant */
  /* un bureau par rôle affectable + celui du chef, toujours seul */
  POSTES = postesSalle(s.roles);
  const bureaux = s.roles.filter(r => POSTES[r.cle]).map(r => ({p:POSTES[r.cle],
    o: bureau(r.cle, r.nom, ...POSTES[r.cle], COULEUR_ROLE[r.cle], r.cle === 'chef' ? 1 : agents[r.cle])}));
  const props = [
    ...bureaux,
    ...OBJETS.plantes.map(p => ({p, o: {svg: plante(...p)}})),
    {p:OBJETS.vault,        o: rack(...OBJETS.vault, Math.min(8, Math.max(1, faits + 1)))},
    {p:OBJETS.poubelle,     o: poubelle(...OBJETS.poubelle, abandon)},
    {p:OBJETS.fusee,        o: fusee(...OBJETS.fusee, enCours)},
    {p:OBJETS.radar,        o: radar(...OBJETS.radar, bloque)},
  ].sort((a, b) => (a.p[0] + a.p[1]) - (b.p[0] + b.p[1]));

  const objets = props.map(x => x.o.svg).join('');

  /* étiquettes posées en dernier, sur fond plein : rien ne doit jamais les
     recouvrir, pas même une puce de relais qui passe dessous */
  const etiquettes = props.filter(x => x.o.label).map(({o:{label:l}}) => `
    <g>
      <rect x="${(l.x - l.w/2 - 5).toFixed(1)}" y="${(l.y - 8).toFixed(1)}"
            width="${(l.w + 10).toFixed(1)}" height="11" rx="2" fill="#05070c"/>
      <text x="${l.x.toFixed(1)}" y="${l.y.toFixed(1)}" text-anchor="middle"
            font-family="ui-monospace,monospace" font-size="7.5" letter-spacing="1"
            fill="${l.c}">${esc(l.t)}</text>
    </g>`).join('');

  const relais = arcsRelais(s.flux, Object.fromEntries(props.filter(x => x.o.poste).map(x => [x.o.poste.cle, x.o.poste])));

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
    ${window.matchMedia('(prefers-reduced-motion:reduce)').matches ? '' : `<circle cx="${dernier[0].toFixed(1)}" cy="${dernier[1].toFixed(1)}" r="4.5" fill="none"
            stroke="#22e07a" stroke-width="1.5" opacity=".6">
      <animate attributeName="r" values="4.5;13;4.5" dur="2.2s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values=".6;0;.6" dur="2.2s" repeatCount="indefinite"/>
    </circle>`}
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
   PERSONNEL · RH — dossier calculé par bin/rh.py, affiché tel quel
   ══════════════════════════════════════════════════════════════════════ */
function tableRH(titre, lignes){
  const tete = [titre, 'TÂCHES', 'LIVRÉES', 'RETENUES', 'VIRÉES', 'RENVOI'];
  return `<tr>${tete.map(t => `<th>${t}</th>`).join('')}</tr>` + lignes.map(l => {
    const t = l.taux_renvoi, connu = Number.isFinite(t);   // null, undefined → — , jamais NaN
    return `<tr><td class="rh-cle">${esc(l.cle)}</td><td>${l.taches}</td><td>${l.livrees}</td>
      <td>${l.retenues}</td><td>${l.virees}</td>
      <td class="${connu && t >= .5 ? 'ko' : ''}">${connu ? Math.round(100 * t) + ' %' : '—'}</td></tr>`;
  }).join('');
}

function rendreRH(s){
  const p = s.personnel || {};
  poser($('#rh-meta'), p.projets === undefined ? '' : `${p.projets} projet(s) · ${p.archives} archive(s)`, 'rh:m');
  if (!p.taches){
    $('#rh-roles').innerHTML = `<tr><td class="rh-vide">aucune tâche livrée</td></tr>`;
    $('#rh-modeles').innerHTML = '';
    return;
  }
  $('#rh-roles').innerHTML = tableRH('RÔLE', p.roles);
  $('#rh-modeles').innerHTML = tableRH('MODÈLE', p.modeles);
}

/* ══════════════════════════════════════════════════════════════════════
   TÂCHES · JOURNAL · SEUILS
   ══════════════════════════════════════════════════════════════════════ */
function rendreTaches(s){
  if (SAISIE.tid !== null) return;        // un motif est en cours de saisie : on ne l'efface pas
  $('#tasks').innerHTML = s.taches.map(t => `
    <div class="trow ${t.statut === 'en-cours' ? 'encours' : ''} ${t.statut === 'bloque' ? 'bloque' : ''} ${t.statut === 'rejete' ? 'rejete' : ''}" data-tid="${esc(t.id)}">
      <span class="tid">${esc(t.id)}</span>
      <span class="ttitre">${esc(t.titre)}${t.verdict ? ` <b style="color:${t.verdict.startsWith('CONF')?'#22e07a':'#ff3b5c'}">· ${esc(t.verdict)}</b>` : ''}</span>
      <span class="trole" style="color:${COULEUR_ROLE[t.role] || '#5d6880'}">${esc(t.role)}</span>
      <span class="tnum">${t.tokens || '—'}</span>
      <span class="tnum">${t.fichiers || '—'}</span>
      <span class="badge ${t.lint === 'PASS' ? 'pass' : t.lint === 'FAIL' ? 'fail' : 'none'}">${esc(t.lint)}</span>
      <span class="tact">${(t.actions || []).map(a =>
        `<button class="tbtn" data-act="${esc(a.k)}" data-tid="${esc(t.id)}">${esc(a.libelle)}</button>`).join('')}</span>
    </div>`).join('');
  poser($('#tasks-meta'), `${s.taches.length} TÂCHES · ${s.taches.filter(t=>t.lint==='FAIL').length} PACK REFUSÉ`, 'tm');
  $('#journal').innerHTML = (s.journal || []).map(l => `<div>${esc(l)}</div>`).join('');
}

/* ══════════════════════════════════════════════════════════════════════
   TODO DU CHEF · RELAIS
   ══════════════════════════════════════════════════════════════════════ */
const COULEUR_PRIO = {1:'#ff3b5c', 2:'#ffcc33', 3:'#2de2e6', 4:'#7f8aa3'};

/* étage d'un item : titre avant « : » ; projet "" = chef, dernier étage (RH, supervision) */
function etiquetteEtage(s, cle, projet){
  if (!s.immeuble) return '';                  // démo : aucun étage, aucune étiquette
  if (!cle) return `<span class="ti-etage chef">chef</span>`;
  const p = s.immeuble.etages.find(x => x.slug === cle);
  const titre = p ? p.titre : cle;
  return `<button class="ti-etage" data-etage="${esc(cle)}" data-projet="${esc(projet)}" title="aller à l'étage ${esc(titre)}">${esc(titre.split(' : ')[0])}</button>`;
}

function rendreTodo(s){
  const items = s.todo || [];
  poser($('#todo-count'), s.todo_total ?? items.length, 'todo:n');
  if (!items.length){
    $('#todo').innerHTML = `<div class="todo-vide">rien à faire côté chef.<br>
      tout est packé, dispatché et intégré.</div>`;
    return;
  }
  $('#todo').innerHTML = items.map((t, i) => `
    <div class="ti p${t.prio}" style="--c:${COULEUR_PRIO[t.prio] || '#7f8aa3'}">
      <div class="ti-top">
        <span class="ti-case"></span>
        <span class="ti-titre">${esc(t.titre)}</span>
        <span class="ti-tag">${esc(t.etiquette)}</span>
      </div>
      <div class="ti-detail">${etiquetteEtage(s, t.etage || '', t.projet || '')}${esc(t.detail)}</div>
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
     <span class="pm-step" style="--c:${COULEUR_STATUT[p.k] || '#5d6880'}">${esc(p.k)} <b>${p.n}</b></span>`).join('');
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
   SONNERIE — un petit son quand un agent a terminé
   Les événements viennent du hook `bin/sonnerie.py` (SubagentStop), lus dans
   state.json : la page ne devine jamais qu'un agent a rendu, elle l'apprend.
   Le son se coupe d'un clic sur la cloche ; le choix tient entre deux visites.
   ══════════════════════════════════════════════════════════════════════ */
const SON = {ctx:null, vu:null, actif:true};
try{ SON.actif = localStorage.getItem('agentx:son') !== '0'; }catch{}

/* une note courte, enveloppe douce : on signale, on ne sursaute pas */
function bip(ctx, freq, debut, duree, gain){
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'triangle';
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, debut);
  g.gain.linearRampToValueAtTime(gain, debut + .012);
  g.gain.exponentialRampToValueAtTime(.0001, debut + duree);
  o.connect(g).connect(ctx.destination);
  o.start(debut);
  o.stop(debut + duree + .03);
}

function sonner(quoi){
  if (!SON.actif) return;
  try{
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    SON.ctx = SON.ctx || new AC();
    if (SON.ctx.state === 'suspended') SON.ctx.resume();
    const t = SON.ctx.currentTime + .02;
    if (quoi === 'agent-bloque'){        // deux notes qui descendent : ça coince
      bip(SON.ctx, 523, t, .15, .07);
      bip(SON.ctx, 392, t + .15, .26, .07);
    } else {                             // deux notes qui montent : c'est livré
      bip(SON.ctx, 784, t, .11, .055);
      bip(SON.ctx, 1175, t + .1, .2, .05);
    }
  }catch{}                               // pas d'audio : la salle marche quand même
}

function annoncer(evs){
  const zone = $('#toasts');
  if (!zone) return;
  for (const e of evs.slice(-3)){
    const d = document.createElement('div');
    d.className = 'toast' + (e.quoi === 'agent-bloque' ? ' ko' : '');
    d.innerHTML = `<b>${esc(e.role || 'agent')}</b>
      ${e.quoi === 'agent-bloque' ? 'bloqué' : 'a terminé'}
      <span>${esc([e.projet, e.tid, e.t, e.verdict && `verdict : ${e.verdict}`].filter(Boolean).join(' · '))}</span>`;
    zone.appendChild(d);
    setTimeout(() => d.remove(), 7000);
  }
}

/* Un seul bip par tic, même si trois agents ont rendu dans la même vague :
   trois bips superposés ne disent rien de plus qu'un. Le bandeau, lui, les
   nomme tous. */
function sonnerie(s){
  const evs = s.evenements || [];
  const dernier = evs.length ? evs[evs.length - 1].id : '';   // '' : aucun événement au chargement
  if (SON.vu === null){ SON.vu = dernier; return; }   // page fraîche : pas de rejeu
  if (dernier === SON.vu) return;
  const i = evs.findIndex(e => e.id === SON.vu);
  const neufs = SON.vu === '' ? evs : i === -1 ? evs.slice(-1) : evs.slice(i + 1);
  SON.vu = dernier;
  sonner(neufs.some(e => e.quoi === 'agent-bloque') ? 'agent-bloque' : 'agent-fini');
  annoncer(neufs);
  sonnerEtages(neufs);
}

function majBoutonSon(){
  const b = $('#son-btn');
  if (!b) return;
  b.textContent = SON.actif ? '🔔' : '🔕';
  b.classList.toggle('off', !SON.actif);
  b.setAttribute('aria-pressed', String(SON.actif));
  b.title = SON.actif ? 'son activé — un bip quand un agent a terminé'
                      : 'son coupé — les annonces restent visibles';
}

function brancherSon(){
  const b = $('#son-btn');
  if (!b) return;
  majBoutonSon();
  b.onclick = () => {
    SON.actif = !SON.actif;
    try{ localStorage.setItem('agentx:son', SON.actif ? '1' : '0'); }catch{}
    majBoutonSon();
    if (SON.actif) sonner('agent-fini');       // on entend ce qu'on vient d'activer
  };
  // Le navigateur garde l'audio suspendu jusqu'au premier geste : on le réveille
  // au premier clic ou à la première touche, sinon le premier bip est muet.
  const reveiller = () => {
    if (SON.ctx?.state === 'suspended') SON.ctx.resume();
    removeEventListener('pointerdown', reveiller);
    removeEventListener('keydown', reveiller);
  };
  addEventListener('pointerdown', reveiller);
  addEventListener('keydown', reveiller);
}

/* ══════════════════════════════════════════════════════════════════════
   CONSOLE VOCALE — les phrases que le chef a dites à voix haute (journal du
   hook voix, lu par le serveur), et les trois commandes : mode vocal, silence,
   micro. Hauteur fixe : 30 phrases défilent dedans, la page ne grandit pas.
   `state.voix` absent (vieux serveur, démo) : la carte reste cachée.
   ══════════════════════════════════════════════════════════════════════ */
const VOIX = {vu: null, envoi: false, erreur: '', jusqua: 0, minuteur: 0};

const heureVoix = t => /T(\d\d:\d\d)/.exec(String(t ?? ''))?.[1] || '--:--';

function majBoutonsVoix(v){
  const mode = $('#voix-mode'), stop = $('#voix-stop'), micro = $('#voix-micro');
  const sansParle = 'parle n\'est pas lancé — lance bin/parle';
  mode.textContent = v.mode ? '🔊' : '🔇';
  mode.setAttribute('aria-pressed', String(!!v.mode));
  mode.disabled = !v.parle || VOIX.envoi;
  mode.title = !v.parle ? sansParle : v.mode
    ? 'mode vocal activé — le chef et les annonces d\'agents parlent ; clic pour couper'
    : 'mode vocal coupé — clic pour faire parler le chef et les annonces d\'agents';
  stop.disabled = !v.parle || VOIX.envoi;
  stop.title = !v.parle ? sansParle : 'faire taire la phrase en cours';
  micro.setAttribute('aria-pressed', String(!!v.ecoute));
  micro.disabled = !v.dictee || VOIX.envoi;
  micro.title = !v.dictee ? 'dictee n\'est pas lancé — lance bin/dictee'
    : v.ecoute ? 'micro ouvert — clic pour le fermer' : 'micro fermé — clic pour dicter au terminal';
}

function majPiedVoix(v){
  const pied = $('#voix-etat');
  const erreur = VOIX.erreur && Date.now() < VOIX.jusqua;
  const txt = erreur ? VOIX.erreur
    : !v.parle ? 'parle n\'est pas lancé'
    : (v.mode ? 'mode vocal activé' : 'mode vocal coupé') + (v.ecoute ? ' · micro ouvert' : '');
  pied.textContent = txt;
  pied.title = txt;
  pied.classList.toggle('ko', !!erreur);
}

function rendreVoix(s){
  const carte = $('#voix'), v = s.voix;
  if (!carte) return;
  carte.hidden = !v || typeof v !== 'object';
  if (carte.hidden) return;
  carte.classList.toggle('en-cours', !!v.en_cours);
  majBoutonsVoix(v);
  majPiedVoix(v);
  const j = Array.isArray(v.journal) ? v.journal : [];
  const liste = $('#voix-journal');
  liste.innerHTML = j.length
    ? j.slice().reverse().map(e => `<li class="voix-l"><time datetime="${esc(e.t)}">${esc(heureVoix(e.t))}</time><span>${esc(e.texte)}</span></li>`).join('')
    : '<li class="voix-vide">rien dit pour l\'instant</li>';
  const der = j.length ? JSON.stringify([j[j.length - 1].t, j[j.length - 1].texte]) : '';
  if (VOIX.vu !== null && der && der !== VOIX.vu){      // page fraîche : pas d'illumination
    const l = liste.firstElementChild;
    liste.scrollTop = 0;
    l.classList.add('neuf');
    clearTimeout(VOIX.minuteur);
    VOIX.minuteur = setTimeout(() => l.classList.remove('neuf'), 2000);
  }
  VOIX.vu = der;
}

async function voixPost(action, charge){
  if (!ETAT?.jeton || !ETAT.voix || VOIX.envoi) return;
  VOIX.envoi = true;
  majBoutonsVoix(ETAT.voix);
  try{
    const r = await fetch('api/voix/' + action, {
      method:'POST',
      headers:{'Content-Type':'application/json', 'X-AgentX-Jeton': ETAT.jeton},
      body: JSON.stringify(charge)
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || d.erreur){ VOIX.erreur = d.erreur || `erreur ${r.status}`; VOIX.jusqua = Date.now() + 10000; }
    else { VOIX.erreur = ''; if (d.voix) Object.assign(ETAT.voix, d.voix); }
  }catch(e){
    VOIX.erreur = 'injoignable — ' + e.message; VOIX.jusqua = Date.now() + 10000;
  }finally{
    VOIX.envoi = false;
    if (ETAT.voix){ majBoutonsVoix(ETAT.voix); majPiedVoix(ETAT.voix); $('#voix').classList.toggle('en-cours', !!ETAT.voix.en_cours); }
  }
}

function brancherVoix(){
  $('#voix-mode').onclick = () => voixPost('mode', {on: !ETAT?.voix?.mode});
  $('#voix-stop').onclick = () => voixPost('stop', {});
  $('#voix-micro').onclick = async () => {
    await voixPost('micro', {on: !ETAT?.voix?.ecoute});
    TERMINAL.term?.focus();             // on dicte au chef : le clavier revient au terminal
  };
}

/* ══════════════════════════════════════════════════════════════════════
   IMMEUBLE — chef au dernier étage, un étage par projet ouvert, sous-sol replié.
   Le serveur décide de tout (ordre, dormance, alertes) ; la page affiche
   et ne retient que l'étage demandé, dans le hash `#/<slug>`.
   ══════════════════════════════════════════════════════════════════════ */
const IMMEUBLE = {slug: null, projet: null, transit: false}; // étage (clé produit) et projet demandés par la page (hash) ; null = défaut serveur
                                               // transit : bascule demandée, réponse pas encore rendue
const RE_SLUG_PAGE = /^[a-z0-9][a-z0-9-]{0,47}$/;

function etageDemande(){
  const m = /^#\/([^/]+)(?:\/([^/]+))?$/.exec(location.hash);
  const rien = {etage: null, projet: null};
  if (!m) return rien;
  let etage = '', projet = null;
  try{
    etage = decodeURIComponent(m[1]).toLowerCase();                           // #/Beta = #/beta
    if (m[2] !== undefined) projet = decodeURIComponent(m[2]).toLowerCase();
  }catch{ return rien; }
  if (!RE_SLUG_PAGE.test(etage)) return rien;
  return {etage, projet: projet !== null && RE_SLUG_PAGE.test(projet) ? projet : null};
}

function allerEtage(cle, projet = null){
  if (cle === IMMEUBLE.slug && projet === IMMEUBLE.projet) charger().catch(e => console.warn('dash: étage', e));
  else location.hash = '#/' + cle + (projet ? '/' + projet : '');   // hashchange → surHash
}

function surHash(){
  ({etage: IMMEUBLE.slug, projet: IMMEUBLE.projet} = etageDemande());
  IMMEUBLE.transit = true;
  $('#tasks').inert = true;                    // lignes de l'ancien étage : inertes jusqu'à la réponse
  if (SAISIE.tid !== null) fermerSaisie();
  $('#sortie').hidden = true;
  majVue();
  charger().catch(e => console.warn('dash: étage', e));
}

const ETAT_CHEF = v => v === true ? ['en session', 'ok'] : v === false ? ['arrêté', 'off'] : ['injoignable', 'ko'];

/* branche(s) de travail d'un étage : un libellé si toutes égales, sinon « nom b · nom b » ; [] → null */
function brancheEtage(e){
  const d = e.depots || [];
  if (!d.length) return null;
  const b = x => x.etat === 'ok' ? x.branche : '?';
  const txt = d.every(x => b(x) === b(d[0])) ? b(d[0]) : d.map(x => `${x.nom} ${b(x)}`).join(' · ');
  return {txt, ecart: d.some(x => x.ecart),
          title: d.map(x => `${x.nom} · ${b(x)}${x.publication ? ` (publication ${x.publication})` : ''}`).join('\n')};
}

function rendreImmeuble(s){
  const nav = $('#immeuble'), im = s.immeuble;
  if (!im){ nav.hidden = true; return; }
  nav.hidden = false;
  // une réécriture recrée les <li> : le focus clavier suit l'étage, pas le nœud
  const focal = document.activeElement?.closest?.('#immeuble [data-slug]')?.dataset.slug;

  const t = im.toit, [chef, k] = ETAT_CHEF(t.chef?.vivant);   // im.toit : clé serveur, le chef y vit
  const dir = $('#im-direction');
  dir.className = 'im-direction' + (t.alerte.niveau === 'sonde' ? ' al-sonde' : '');
  dir.style.setProperty('--c', COULEUR_ROLE.chef || COULEURS.accent);
  dir.title = 'ouvrir le terminal du chef';
  dir.setAttribute('aria-label', `Dernier étage, chef de projet, ${chef}`);
  dir.innerHTML = `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M4 41 H44 M10 28 H38 M14 28 V41 M34 28 V41"/><path d="M17 23 V10 H31 V23 Z"/></svg>
    <b>É${im.etages.length + 1} · CHEF</b><span class="im-chef ${k}">${chef}</span>
    <span class="im-direction-todo">todo ${t.todo} · ${t.urgent} urgent</span>
    <span class="im-direction-alerte">${esc(t.alerte.texte)}</span>`;

  const cpt = (c, cle, cl, nom) => `<b class="${cl}${c[cle] ? '' : ' nul'}" title="${nom}">${c[cle]}</b>`;
  $('#im-etages').innerHTML = im.etages.map(e => {
    const cls = ['im-etage', e.selection && 'sel', e.dormant && 'dormant', !e.selectionnable && 'archive',
                 e.alerte.niveau && 'al-' + e.alerte.niveau].filter(Boolean).join(' ');
    const agents = e.agents.map(a =>
      `<i class="im-agent" style="--c:${COULEUR_ROLE[a.role] || '#5d6880'}" title="${esc(a.role)} · ${esc(a.tid)}"></i>`).join('')
      + (e.agents.length > 4 ? `<span class="im-plus">+${e.agents.length - 4}</span>` : '');
    const acces = e.selectionnable ? ` data-slug="${esc(e.slug)}" tabindex="0" role="button"` : '';
    const br = brancheEtage(e);
    return `<li class="${cls}"${acces}${e.selection ? ' aria-current="page"' : ''}
        style="--c:${esc(e.produit?.couleur || '')}"
        title="${e.selectionnable ? `${esc(e.slug)} · ${esc(e.statut)} · activité ${esc(e.activite)}` : 'aucun projet'}">
      <span class="im-num">É${e.num}</span>
      <span class="im-nom">${esc(e.titre)}${br ? ` <span class="im-branche${br.ecart ? ' ecart' : ''}" title="${esc(br.title)}">⎇ ${esc(br.txt)}</span>` : ''}</span>
      <span class="im-agents">${agents}</span>
      <span class="im-cpt">${cpt(e.compteurs, 'en-cours', 'c-encours', 'en cours')}${cpt(e.compteurs, 'revue', 'c-revue', 'revue')}${cpt(e.compteurs, 'bloque', 'c-bloque', 'bloqué')}</span>
      <span class="im-todo${e.todo ? '' : ' nul'}" title="todo du chef">${e.todo}</span>
      <span class="im-alerte" title="${esc(e.alerte.texte)}">${esc(e.alerte.texte)}</span>
    </li>`;
  }).join('');

  const titre = `SOUS-SOL · ${im.sous_sol.length}`;
  if ($('#im-sous-sol-titre').textContent !== titre) $('#im-sous-sol-titre').textContent = titre;
  $('#im-sous-sol-liste').innerHTML = im.sous_sol.map(p => {
    const corps = `<span class="im-num"></span><span class="im-nom">${esc(p.titre)}</span>
      <span class="im-ss-meta">${esc(p.statut)} · ${esc(p.maj)}</span>`;
    return p.selectionnable
      ? `<li data-slug="${esc(p.produit || p.slug)}" data-projet="${esc(p.slug)}" tabindex="0" role="button" class="${p.slug === im.selection.projet ? 'sel' : ''}"
           ${p.slug === im.selection.projet ? 'aria-current="page"' : ''} title="${esc(p.slug)}">${corps}</li>`
      : `<li class="archive" title="archive : lecture dans le vault seulement">${corps}</li>`;
  }).join('');

  if (focal && !document.activeElement?.closest?.('#immeuble [data-slug]'))
    $(`#immeuble [data-slug="${CSS.escape(focal)}"]`)?.focus({preventScroll: true});
}

function sonnerEtages(evs){
  const slugs = new Set(evs.map(e => e.etage || e.projet).filter(Boolean));
  for (const slug of slugs){
    TOUR.sonnent.set(slug, Date.now() + 2500);  // la tour redessinée pendant 2.5 s garde la lueur
    const cle = CSS.escape(slug);
    for (const li of $$(`#im-etages .im-etage[data-slug="${cle}"], #tour-etages .tour-etage[data-slug="${cle}"]`)){
      li.classList.remove('sonne');
      void li.getBoundingClientRect();         // relance la pulsation si l'étage sonnait déjà
      li.classList.add('sonne');
      li.style.removeProperty('--retard');
      setTimeout(() => li.classList.remove('sonne'), 2500);
    }
  }
}

function brancherImmeuble(){
  const nav = $('#immeuble');
  const clic = e => {
    const li = e.target.closest('[data-slug]');
    if (li) allerEtage(li.dataset.slug, li.dataset.projet || null);
  };
  $('#im-etages').addEventListener('click', clic);
  $('#im-sous-sol-liste').addEventListener('click', clic);
  $('#im-direction').addEventListener('click', () => basculerTiroir(true));
  nav.addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;      // Alt+↑/↓ : raccourci global
    const li = e.target.closest('[data-slug]');
    if (!li) return;
    if (e.key === 'Enter' || e.key === ' '){
      e.preventDefault();
      allerEtage(li.dataset.slug, li.dataset.projet || null);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown'){
      e.preventDefault();
      const visibles = $$('[data-slug]', nav).filter(x => x.offsetParent !== null);
      visibles[visibles.indexOf(li) + (e.key === 'ArrowDown' ? 1 : -1)]?.focus();
    }
  });
  addEventListener('hashchange', surHash);
}

/* ══════════════════════════════════════════════════════════════════════
   LA TOUR — vue d'ensemble : l'immeuble en coupe iso, un open space par
   étage, le chef au dernier étage, les projets clos en cartons au sous-sol.
   Ne lit que s.immeuble : une mascotte = une tâche en cours réelle.
   Plan de coupe = façade avant (y = T_NY) ; la terre y est hachurée.
   ══════════════════════════════════════════════════════════════════════ */
const TOUR = {sig: '', centres: {}, sonnent: new Map()};
const T_NX = 7, T_NY = .7, T_S = .9;           // emprise d'un étage (unités iso), échelle
const T_LX = 380, T_LW = 310;                  // colonne des plaques (unités du viewBox)
const isoT = (x, y, z, ox, oy, s) => [ox + (x - y) * TW * s, oy + (x + y) * TH * s - z * ZH * s];
const polyT = (P, arr) => arr.map(p => P(...p).map(n => n.toFixed(1)).join(',')).join(' ');

/** boîte iso 3 faces dans une projection donnée (≠ boite, liée à iso de #room) */
function boiteT(P, x, y, z, w, d, h, couleur){
  const t = `stroke="#07090f" stroke-width=".6" stroke-linejoin="round"`;
  return `<polygon points="${polyT(P, [[x,y+d,z],[x+w,y+d,z],[x+w,y+d,z+h],[x,y+d,z+h]])}" fill="${ombrer(couleur,.60)}" ${t}/>
    <polygon points="${polyT(P, [[x+w,y,z],[x+w,y+d,z],[x+w,y+d,z+h],[x+w,y,z+h]])}" fill="${ombrer(couleur,.42)}" ${t}/>
    <polygon points="${polyT(P, [[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]])}" fill="${couleur}" ${t}/>`;
}

/* coupe par points de code : jamais un emoji tranché en surrogate isolé */
const courtT = (t, n) => { const c = Array.from(t); return c.length > n ? c.slice(0, n - 1).join('') + '…' : t; };
const LUMIERE = {allume: ['#242d42', '#1a2131'], vide: ['#11151f', '#0e1119'], eteint: ['#0b0d13', '#090b10']};

/** un poste : bureau, écran animé s'il est occupé ; la mascotte se pose à part, devant */
function posteTour(P, x, zs, taille, c, occupe, k){
  const hDesk = 9 * taille / (ZH * T_S);
  const [ex, ey] = P(x, .14, zs + hDesk), [lx, ly] = P(x - .12, .5, zs);
  const w = 14 * taille, h = 9 * taille;
  return (occupe ? `<ellipse cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" rx="${(13 * taille).toFixed(1)}" ry="${(4.5 * taille).toFixed(1)}" fill="${c}" opacity=".3"/>` : '')
    + boiteT(P, x - .2, .06, zs, .4, .2, hDesk, occupe ? '#3a4460' : '#262d40')
    + `<rect x="${(ex - w/2).toFixed(1)}" y="${(ey - h - 1).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="1"
            fill="#080b12" stroke="${occupe ? ombrer(c, .75) : '#1c2233'}" stroke-width=".8"/>`
    + (occupe ? `<rect class="tour-ecran" x="${(ex - w/2 + 1.5).toFixed(1)}" y="${(ey - h + .5).toFixed(1)}" width="${(w - 3).toFixed(1)}"
            height="${(h - 3).toFixed(1)}" fill="${c}" style="animation-delay:${(-k * .37).toFixed(2)}s"/>` : '');
}

/** coque d'un niveau : dalle, sol, murs, `dedans` (mobilier), façade vitrée, piliers, bandeau lumineux */
function coqueTour(P, z0, hz, ts, lum, dedans){
  const [sol, mur] = LUMIERE[lum];
  const zs = z0 + ts, haut = z0 + hz;
  const facade = `<polygon points="${polyT(P, [[T_NX,0,zs],[T_NX,T_NY,zs],[T_NX,T_NY,haut],[T_NX,0,haut]])}"
      fill="#2de2e6" fill-opacity="${lum === 'allume' ? .07 : lum === 'vide' ? .03 : 0}" stroke="#1c2233" stroke-width=".8"/>`;
  const piliers = boiteT(P, 0, T_NY - .1, zs, .1, .1, hz - ts, '#232a3c') + boiteT(P, T_NX - .1, T_NY - .1, zs, .1, .1, hz - ts, '#232a3c');
  return `${boiteT(P, 0, 0, z0, T_NX, T_NY, ts, '#3a4460')}
    <polygon points="${polyT(P, [[0,0,zs],[T_NX,0,zs],[T_NX,T_NY,zs],[0,T_NY,zs]])}" fill="${sol}"/>
    <polyline class="tour-coupe" points="${polyT(P, [[0,T_NY,zs],[T_NX,T_NY,zs],[T_NX,0,zs]])}"/>
    <polygon points="${polyT(P, [[0,0,zs],[T_NX,0,zs],[T_NX,0,haut],[0,0,haut]])}" fill="${mur}"/>
    <polygon points="${polyT(P, [[0,0,zs],[0,T_NY,zs],[0,T_NY,haut],[0,0,haut]])}" fill="${ombrer(mur, .8)}"/>
    ${dedans}${facade}${piliers}
    ${lum === 'allume' ? `<polyline class="tour-led" points="${polyT(P, [[0,T_NY,haut - .05],[T_NX,T_NY,haut - .05],[T_NX,0,haut - .05]])}"/>` : ''}`;
}

/** un open space : dalle, murs, bureaux, une mascotte par agent réel */
function niveauTour(P, e, z0, hz, ts){
  const lum = e.dormant ? 'eteint' : e.agents.length ? 'allume' : 'vide';
  const montres = e.agents.slice(0, 12);
  const plus = Math.max(0, (e.compteurs['en-cours'] || 0) - montres.length);
  const D = Math.max(6, montres.length), pas = (T_NX - .9) / (D - 1);
  const hF = hz * ZH * T_S;
  const taille = Math.min(.95, pas * TW * T_S / 26, (hF - 8) / 34);
  const zs = z0 + ts;

  let postes = '', agents = '';
  for (let k = 0; k < D; k++){
    const x = .45 + k * pas, a = montres[k];
    const c = a ? (COULEUR_ROLE[a.role] || '#5d6880') : '';
    postes += posteTour(P, x, zs, taille, c, !!a, k);
    if (a){
      const [mx, my] = P(x - .12, .5, zs);           // décalée : l'écran reste visible à sa droite
      agents += `<g class="tour-agent" data-role="${esc(a.role)}" data-tid="${esc(a.tid)}">${mascotte(mx, my + 2 * taille, c, taille, k * .31)}</g>`;
    }
  }
  if (plus){                                     // au-delà de 12 : sur la façade, hors des bureaux
    const [px, py] = P(T_NX, T_NY, zs);
    agents += `<text class="tour-plus" x="${(px + 5).toFixed(1)}" y="${(py - 8).toFixed(1)}">+${plus}</text>`;
  }

  let gyro = '';
  if (e.alerte.niveau){
    const [gx, gy] = P(T_NX, T_NY / 2, z0 + hz * .5);
    const c = e.alerte.niveau === 'bloque' ? COULEURS.red : COULEURS.yellow;
    gyro = `<g class="tour-gyro" transform="translate(${(gx + 8).toFixed(1)},${gy.toFixed(1)})">
      <circle class="tour-gyro-halo" r="6" fill="${c}" opacity=".25"/>
      <g class="tour-faisceau"><path d="M0 0 L12 -3 L12 3 Z" fill="${c}" opacity=".55"/></g>
      <circle r="2.4" fill="${c}"/></g>`;
  }

  return `<g class="tour-niveau tn-${lum}" data-slug="${esc(e.slug)}">
    ${coqueTour(P, z0, hz, ts, lum, postes + agents)}
    ${gyro}
  </g>`;
}

/** étage de direction, au-dessus des projets : le bureau du chef, bandeau à sa couleur.
 *  vivant true → au travail · false → assoupi, lumière coupée · null → injoignable, grisé */
function directionTour(P, t, z0, hz, ts){
  const [, k] = ETAT_CHEF(t.chef?.vivant);
  const lum = k === 'ok' ? 'allume' : k === 'off' ? 'eteint' : 'vide';
  const c = k === 'ko' ? '#5d6880' : (COULEUR_ROLE.chef || COULEURS.accent);
  const zs = z0 + ts, x = T_NX * .45;
  const taille = Math.min(.95, (hz * ZH * T_S - 8) / 34);
  const [mx, my] = P(x - .12, .5, zs);
  return `<g class="tour-niv-direction tn-${lum}" style="--c:${c}">
    ${coqueTour(P, z0, hz, ts, lum, posteTour(P, x, zs, taille, c, k === 'ok', 0)
      + `<g class="tour-chef ${k}">${mascotte(mx, my + 2 * taille, c, taille)}</g>`)}
  </g>`;
}

/** plaque de la colonne de droite : le tableau des étages du hall */
function renvoiTour(x, y1, y2){
  return `<polyline class="tour-renvoi" points="${x.toFixed(1)},${y1.toFixed(1)} ${T_LX - 10},${y2.toFixed(1)} ${T_LX},${y2.toFixed(1)}" fill="none"/>`;
}

function plaqueTour(y, h){
  return `<rect class="tour-plaque" x="${T_LX}" y="${(y - h / 2).toFixed(1)}" width="${T_LW}" height="${h}" rx="2"/>`;
}

function construireTour(im){
  const et = [...im.etages].sort((a, b) => a.rang - b.rang);    // rang 0 en haut, sous la direction
  const n = et.length;
  const hF = Math.min(56, 300 / (n + 1));                       // n étages + la direction ; > 8 : compressés
  const compresse = n > 8;
  const U = ZH * T_S, hz = hF / U, ts = .22, hb = 32 / U, couvH = .3;
  const pente = (T_NX + T_NY) * TH * T_S;
  const zd = n * hz, haut = zd + hz;                            // zd : sol de la direction ; haut : sous la couverture
  const total = pente + (haut + couvH) * U + hb * U + 6;
  const ox = 150, oy = (480 - total) / 2 + (haut + couvH) * U;  // oy : sol (z = 0) au coin arrière
  const P = (x, y, z = 0) => isoT(x, y, z, ox, oy, T_S);
  const xs = [-.72, -.08], ys = [T_NY + .05, T_NY + .69];        // gaine d'ascenseur, collée au coin avant gauche

  /* sous-sol : coupe dans la terre, cartons repliés */
  const zb = -hb;
  const ss = im.sous_sol.length, cartons = Math.min(ss, 10);
  let fond = `<rect width="700" height="480" fill="url(#tour-halo)"/>`
    + `<polygon points="${polyT(P, [[xs[0],ys[0],zb],[xs[1],ys[0],zb],[xs[1],ys[0],haut + couvH + .4],[xs[0],ys[0],haut + couvH + .4]])}" fill="#2de2e6" fill-opacity=".04"/>`
    + `<polygon points="${polyT(P, [[xs[0],ys[0],zb],[xs[0],ys[1],zb],[xs[0],ys[1],haut + couvH + .4],[xs[0],ys[0],haut + couvH + .4]])}" fill="#2de2e6" fill-opacity=".03"/>`
    + `<polygon points="${polyT(P, [[-1.2,T_NY,0],[0,T_NY,0],[0,T_NY,zb],[T_NX,T_NY,zb],[T_NX,T_NY,0],[T_NX + 1,T_NY,0],[T_NX + 1,T_NY,zb - .8],[-1.2,T_NY,zb - .8]])}"
        fill="url(#tour-hachure)"/>`
    + boiteT(P, 0, 0, zb, T_NX, T_NY, ts, '#0e1119')
    + `<polygon points="${polyT(P, [[0,0,zb + ts],[T_NX,0,zb + ts],[T_NX,0,0],[0,0,0]])}" fill="#0b0d13"/>`
    + Array.from({length: cartons}, (_, k) =>
        boiteT(P, .35 + k * .62, .12, zb + ts, .44, .36, .34, '#343d55')).join('')
    + (ss > cartons ? (() => { const [px, py] = P(T_NX - .1, .5, zb + ts);
        return `<text class="tour-plus" x="${px.toFixed(1)}" y="${py.toFixed(1)}" text-anchor="end">+${ss - cartons}</text>`; })() : '')
    + `<polyline points="${polyT(P, [[-1.2,T_NY,0],[T_NX + 1,T_NY,0]])}" fill="none" stroke="#262c3e" stroke-width="1.4"/>`;

  /* étages, du bas vers le haut : la dalle du dessus recouvre le haut de celui d'en dessous */
  const z0 = r => (n - 1 - r) * hz;
  const niveaux = [...et].reverse().map(e => niveauTour(P, e, z0(e.rang), hz, ts)).join('');

  /* dernier étage : la direction, le chef à son bureau ; au-dessus, la couverture seule */
  const salleChef = directionTour(P, im.toit, zd, hz, ts);
  const couverture = boiteT(P, 0, 0, haut, T_NX, T_NY, couvH, '#232a3c');

  /* gaine vitrée : montants avant, repères d'étage */
  const zh = haut + couvH + .4;
  const avant = [[xs[1], ys[1]], [xs[0], ys[1]], [xs[1], ys[0]]].map(([x, y]) =>
      `<polyline points="${polyT(P, [[x,y,zb],[x,y,zh]])}" fill="none" stroke="#2a3042" stroke-width="1"/>`).join('')
    + `<polygon points="${polyT(P, [[xs[0],ys[0],zh],[xs[1],ys[0],zh],[xs[1],ys[1],zh],[xs[0],ys[1],zh]])}" fill="#1f2634" stroke="#2a3042" stroke-width=".8"/>`
    + [...et.map(e => z0(e.rang)), zd].map(z => `<polyline points="${polyT(P, [[xs[0],ys[1],z + ts],[xs[1],ys[1],z + ts],[xs[1],ys[0],z + ts]])}"
        fill="none" stroke="#1c2233" stroke-width=".8"/>`).join('');

  /* cabine : dessinée au rez-de-chaussée, translatée vers l'étage sélectionné (transition CSS) */
  const sel = et.find(e => e.selection);
  const cible = sel ? z0(sel.rang) + ts : zb + ts;
  const cab = boiteT(P, xs[0] + .06, ys[0] + .06, 0, .52, .52, Math.min(hz - ts - .1, 1.5), '#2b3448')
    + `<polygon points="${polyT(P, [[xs[0] + .14,ys[1] - .06,.12],[xs[1] - .1,ys[1] - .06,.12],[xs[1] - .1,ys[1] - .06,Math.min(hz - ts - .1, 1.5) - .12],[xs[0] + .14,ys[1] - .06,Math.min(hz - ts - .1, 1.5) - .12]])}"
        fill="#2de2e6" fill-opacity="${sel ? .55 : .15}"/>`;

  /* plaques : direction, étages, sous-sol — positions bornées pour ne jamais se chevaucher */
  const ancre = r => P(T_NX, T_NY / 2, z0(r) + hz / 2);
  const ys0 = et.map(e => ancre(e.rang)[1]);
  const hautPlaque = e => (!compresse && e.alerte.texte) ? 30 : 18;
  const ySS = Math.max(P(T_NX, T_NY / 2, zb / 2)[1], (ys0[n - 1] ?? oy) + Math.max(hF / 2 + 9, 22));
  const NUL = v => v ? '' : ' nul';
  const [sx, sy] = P(T_NX, T_NY / 2, zb / 2);
  const plaques = `
    ${renvoiTour(sx + 14, sy, ySS)}${plaqueTour(ySS, 18)}
    <text class="tour-lbl" x="${T_LX + 8}" y="${(ySS + 3.5).toFixed(1)}"><tspan class="tour-num">SOUS-SOL · ${ss}</tspan><tspan class="tour-dim" dx="10">${ss ? 'clos et archivés' : 'vide'}</tspan></text>`;

  /* plaque du chef : même tableau, ouvre son terminal */
  const t = im.toit, [chefTxt, k] = ETAT_CHEF(t.chef?.vivant), cChef = COULEUR_ROLE.chef || COULEURS.accent;
  const [dx, yDir] = P(T_NX, T_NY / 2, zd + hz / 2);
  const plaqueChef = `<g class="tour-direction" tabindex="0" role="button" style="--c:${cChef}"
      aria-label="${esc(`Dernier étage, chef de projet, ${chefTxt}, todo ${t.todo}, ${t.urgent} urgent`)}">
    <polygon class="tour-cadre" points="${polyT(P, [[0,T_NY,zd],[T_NX,T_NY,zd],[T_NX,0,zd],[T_NX,0,haut],[T_NX,T_NY,haut],[0,T_NY,haut]])}"/>
    ${renvoiTour(dx + 14, yDir, yDir)}${plaqueTour(yDir, 18)}
    <text class="tour-lbl" x="${T_LX + 8}" y="${(yDir + 3.5).toFixed(1)}"><tspan fill="${cChef}">É${n + 1} · CHEF</tspan><tspan class="tour-etat ${k}" dx="10">● ${chefTxt}</tspan><tspan class="tour-dim" dx="10">todo ${t.todo} · ${t.urgent} urgent</tspan></text>
    ${t.alerte.niveau === 'sonde' ? `<text class="tour-al bloque" x="${T_LX + T_LW}" y="${(yDir - 13).toFixed(1)}" text-anchor="end">${esc(courtT(t.alerte.texte, 48))}</text>` : ''}
  </g>`;

  TOUR.centres = {};
  const zones = et.map((e, i) => {
    const zb0 = z0(e.rang), zt = zb0 + hz, y = ys0[i], [gx] = ancre(e.rang);
    const bande = polyT(P, [[0,T_NY,zb0],[T_NX,T_NY,zb0],[T_NX,0,zb0],[T_NX,0,zt],[T_NX,T_NY,zt],[0,T_NY,zt]]);
    const [bx, by] = P(T_NX / 2, T_NY, zb0 + hz / 2);
    TOUR.centres[e.slug] = [bx / 7, by / 4.8];                    // % du viewBox 700×480 : origine du zoom
    const c = e.compteurs, hp = hautPlaque(e);
    const br = brancheEtage(e);
    const titre = courtT(e.titre.split(' : ')[0], 30) + (br ? ` · ⎇ ${courtT(br.txt, 24)}` : '');
    const cpt = [['en-cours', 'en'], ['revue', 'rv'], ['bloque', 'bl']].map(([cle, cl], j) => {
      const x = T_LX + T_LW - 6 - (3 - j) * 24;
      return `<g class="tour-c ${cl}${NUL(c[cle])}"><rect x="${x}" y="${(y - hp / 2 + 3).toFixed(1)}" width="22" height="12" rx="2"/>
        <text x="${x + 11}" y="${(y - hp / 2 + 12).toFixed(1)}" text-anchor="middle">${c[cle]}</text></g>`;
    }).join('');
    const reste = TOUR.sonnent.get(e.slug) - Date.now();
    const cls = ['tour-etage', e.selection && 'sel', e.dormant && 'dormant', !e.selectionnable && 'archive', e.alerte.niveau && 'al-' + e.alerte.niveau,
                 reste > 0 && 'sonne'].filter(Boolean).join(' ');
    const label = `Étage ${e.num}, ${e.titre}, ${c['en-cours']} en cours, ${c.bloque} bloqués`;
    const acces = e.selectionnable ? ` data-slug="${esc(e.slug)}" tabindex="0" role="button"` : '';
    return `<g class="${cls}"${acces} aria-label="${esc(label)}"${e.selection ? ' aria-current="page"' : ''}
        style="--c:${esc(e.produit?.couleur || '')}${reste > 0 ? `;--retard:${((reste - 2500) / 1000).toFixed(2)}s` : ''}">
      <polygon class="tour-cadre" points="${bande}"/>
      ${renvoiTour(gx + 14, y, y)}
      ${plaqueTour(y, hp)}
      <text class="tour-lbl" x="${T_LX + 8}" y="${(y - hp / 2 + 12.5).toFixed(1)}"><tspan class="tour-num">É${e.num}</tspan> · ${esc(titre)}</text>
      ${cpt}
      ${hp > 18 ? `<text class="tour-al ${e.alerte.niveau}" x="${T_LX + 8}" y="${(y + 10).toFixed(1)}">${esc(courtT(e.alerte.texte, 48))}</text>` : ''}
    </g>`;
  }).join('');

  $('#tour').classList.toggle('compresse', compresse);
  $('#tour-decor').innerHTML = fond + niveaux + salleChef + couverture;
  $('#tour-cabine > g').innerHTML = cab;
  $('#tour-cabine').style.transform = `translateY(${(-cible * U).toFixed(1)}px)`;
  $('#tour-avant').innerHTML = avant + plaques;
  $('#tour-etages').innerHTML = plaqueChef + zones;
  for (const [slug, fin] of TOUR.sonnent){      // lueur reprise au vol : retirée à son terme
    if (fin <= Date.now()){ TOUR.sonnent.delete(slug); continue; }
    const g = $(`#tour-etages .tour-etage[data-slug="${CSS.escape(slug)}"]`);
    if (g) setTimeout(() => g.classList.remove('sonne'), fin - Date.now());
  }
}

/* #pa-label : étage affiché ; puces : projets de l'étage, .actif = projet détaillé */
function rendrePuces(s){
  const e = s.immeuble?.etages.find(x => x.selection);
  poser($('#pa-label'), e ? 'ÉTAGE ' + e.titre : 'ÉTAGE', 'pl');
  const projets = e?.projets || [];
  const sig = JSON.stringify([e?.slug, projets]);
  const box = $('#pa-projets');
  if (box.dataset.sig === sig) return;
  box.dataset.sig = sig;
  box.hidden = projets.length < 2;
  box.innerHTML = projets.map(p =>
    `<button class="pa-puce${p.actif ? ' actif' : ''}" data-projet="${esc(p.slug)}"${p.actif ? ' aria-current="true"' : ''}
      title="${esc(p.titre)} · ${esc(p.statut)}">${esc(p.slug)}</button>`).join('');
}

/* re-rendu seulement si ce que la tour montre a changé */
function rendreTour(s){
  const im = s.immeuble;
  if (!im) return;
  const sig = JSON.stringify([
    im.etages.map(e => [e.slug, e.rang, e.num, e.titre, e.dormant, e.selection, e.alerte, e.selectionnable,
                        e.produit?.couleur, e.projets.length, e.depots?.map(d => [d.nom, d.branche, d.ecart]),
                        e.agents.map(a => [a.role, a.tid, COULEUR_ROLE[a.role]]),
                        ['en-cours', 'revue', 'bloque'].map(k => e.compteurs[k])]),
    im.sous_sol.length, im.toit.chef?.vivant, im.toit.todo, im.toit.urgent, im.toit.alerte, COULEUR_ROLE.chef]);
  if (sig === TOUR.sig) return;
  // une réécriture recrée les plaques : le focus clavier suit l'étage (ou le chef), pas le nœud
  const focal = document.activeElement?.closest?.('#tour-etages > [tabindex]');
  const cle = focal && (focal.dataset.slug ? `[data-slug="${CSS.escape(focal.dataset.slug)}"]` : '.tour-direction');
  try{ construireTour(im); }
  catch(e){ console.error('dash: tour non rendue, nouvel essai au prochain relevé', e); return; }
  TOUR.sig = sig;                               // posée après un rendu réussi : un échec retente
  if (cle && !document.activeElement?.closest?.('#tour-etages > [tabindex]'))
    $(`#tour-etages > ${cle}`)?.focus({preventScroll: true});
}

/* vue IMMEUBLE (hash vide ou `#/`) ↔ vue ÉTAGE (`#/<slug>`) ; démo : étage seul */
function majVue(){
  const wrap = $('.room-wrap'), avecTour = !!ETAT?.immeuble, maison = $('#vers-immeuble');
  const vue = avecTour && etageDemande().etage === null ? 'immeuble' : 'etage';
  const focal = document.activeElement;         // lu avant que ⌂ ou la tour ne deviennent inatteignables
  maison.hidden = !(avecTour && vue === 'etage');
  wrap.classList.toggle('transit', IMMEUBLE.transit);       // l'ancien étage ne s'affiche pas pendant la bascule
  if (wrap.dataset.vue === vue) return;
  const c = TOUR.centres[etageDemande().etage];
  if (c){ wrap.style.setProperty('--zx', c[0].toFixed(1) + '%'); wrap.style.setProperty('--zy', c[1].toFixed(1) + '%'); }
  const quitte = wrap.dataset.vue === 'etage' && ETAT?.projet?.slug;
  wrap.dataset.vue = vue;
  $('#tour').inert = vue !== 'immeuble';
  // le focus clavier ne tombe jamais sur BODY : tour → ⌂, ⌂ → plaque de l'étage quitté
  if (vue === 'etage' && focal?.closest?.('#tour')) maison.focus({preventScroll: true});
  else if (vue === 'immeuble' && quitte && (focal === maison || focal === document.body))
    ($(`#tour-etages [data-slug="${CSS.escape(quitte)}"]`) || $('#tour-etages [data-slug]'))?.focus({preventScroll: true});
}

function brancherTour(){
  $('#pa-projets').addEventListener('click', e => {
    const b = e.target.closest('[data-projet]');
    const cle = ETAT?.immeuble?.etages.find(x => x.selection)?.slug;
    if (b && cle) allerEtage(cle, b.dataset.projet);
  });
  const tour = $('#tour');
  tour.addEventListener('click', e => {
    if (e.target.closest('.tour-direction')){ basculerTiroir(true); return; }
    const g = e.target.closest('[data-slug]');
    if (g) allerEtage(g.dataset.slug);
  });
  tour.addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const g = e.target.closest('#tour-etages > [tabindex]');   // la direction puis les étages
    if (!g) return;
    if (e.key === 'Enter' || e.key === ' '){
      e.preventDefault();
      if (g.dataset.slug) allerEtage(g.dataset.slug);
      else basculerTiroir(true);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown'){
      e.preventDefault();
      const tous = $$('#tour-etages > [tabindex]');
      tous[tous.indexOf(g) + (e.key === 'ArrowDown' ? 1 : -1)]?.focus();
    }
  });
  $('#vers-immeuble').addEventListener('click', () => { location.hash = '#/'; });
}

/* ══════════════════════════════════════════════════════════════════════
   BOUCLE
   ══════════════════════════════════════════════════════════════════════ */
let salleFaite = false, signatureSalle = '';

function rendre(s){
  majRegistre(s);
  rendreDeck(s);
  rendreImmeuble(s);
  rendreTour(s);
  majVue();

  // La salle se reconstruit quand les relais changent — sinon on se contente
  // de rallumer les bureaux, bien moins cher.
  // Reconstruire aussi quand le nombre d'agents par poste change : c'est ce qui
  // fait apparaître ou disparaître une silhouette.
  const sig = JSON.stringify([s.projet.slug,
                              (s.flux || []).map(f => [f.de, f.vers, f.etat]),
                              s.roles.map(r => r.actifs || 0),
                              s.roles.map(r => r.cle + r.couleur)]);
  if (!salleFaite || sig !== signatureSalle){
    construireSalle(s);
    salleFaite = true;
    signatureSalle = sig;
  } else {
    const actifs = new Set(s.roles.filter(r => r.actif).map(r => r.cle));
    $$('#room .desk').forEach(d => d.classList.toggle('actif', actifs.has(d.id.replace('desk-',''))));
  }
  rendreCourbe(s);
  rendreRH(s);
  rendreTaches(s);
  rendreSeuils(s);
  rendreTodo(s);
  rendreFlux(s);
  rendreSupervision(s);
  sonnerie(s);
  rendreVoix(s);

  poser($('#hud-time'), s.heure, 'h');
  rendrePuces(s);
  poser($('#projet-nom'), s.projet.titre, 'pn');
  poser($('#projet-slug'), s.projet.slug, 'ps');
  poser($('#projet-statut'), s.projet.statut, 'pst');
  const obj = (s.projet.objectif || '').trim();
  poser($('#projet-obj'), obj === '—' ? '' : obj, 'po');
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

/* Les panneaux sont réécrits toutes les 2 s : même à l'identique, innerHTML
   recrée les éléments et relance leurs animations (pulsations, clignements),
   ce qui faisait clignoter la page. Pendant un rendu, on saute l'écriture si
   l'élément a déjà reçu exactement ce HTML. */
const HTML_POSE = new WeakMap();
let RENDU_EN_COURS = false;
{
  const ih = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
  Object.defineProperty(Element.prototype, 'innerHTML', {
    configurable: true, enumerable: ih.enumerable,
    get(){ return ih.get.call(this); },
    set(v){
      if (RENDU_EN_COURS && HTML_POSE.get(this) === v) return;
      HTML_POSE.set(this, v);
      ih.set.call(this, v);
    }
  });
}

async function charger(){
  const {slug: etage, projet} = IMMEUBLE;
  const r = await fetch('state.json?' + (etage ? 'etage=' + encodeURIComponent(etage) + '&' : '')
                        + (projet ? 'projet=' + encodeURIComponent(projet) + '&' : '')
                        + 't=' + Date.now(), {cache:'no-store'});
  const s = await r.json();
  if (IMMEUBLE.slug !== etage || IMMEUBLE.projet !== projet) return s;   // réponse périmée : l'étage a changé pendant le fetch
  if (s.erreur) throw new Error(s.erreur);
  const sel = s.immeuble?.selection;
  if (sel?.refus){                              // slug inconnu : le serveur a choisi, le hash s'efface
    history.replaceState(null, '', location.pathname + location.search);
    IMMEUBLE.slug = null; IMMEUBLE.projet = null;
  } else if (etage && sel && (sel.slug !== etage || sel.projet !== projet)){
    // `#/<cle>` ou ancien `#/<projet>` résolu par le serveur : hash complété, sans hashchange
    IMMEUBLE.slug = sel.slug; IMMEUBLE.projet = sel.projet;
    history.replaceState(null, '', `#/${sel.slug}/${sel.projet}`);
  }
  if (s.projet?.slug !== ETAT?.projet?.slug){ SAISIE.tid = null; SAISIE.k = null; }   // autre étage : la saisie meurt
  ETAT = s;
  IMMEUBLE.transit = false;
  $('#tasks').inert = false;
  RENDU_EN_COURS = true;
  try{ rendre(s); } finally { RENDU_EN_COURS = false; }
  return s;
}

async function boucle(){
  try{ await charger(); echecs = 0; }
  catch(e){ if (++echecs === 3) console.warn('dash: vault injoignable', e); }
  setTimeout(boucle, 2000);
}

/* ══════════════════════════════════════════════════════════════════════
   POSTE DE PILOTAGE — n'envoie jamais une chaîne de commande, seulement une
   action nommée + ses paramètres. C'est le serveur qui décide si elle est
   permise, et c'est lui qui dit, tâche par tâche, quelles actions proposer.
   ══════════════════════════════════════════════════════════════════════ */
async function pilote(req, bouton, agrege = false){
  const ecran = $('#sortie'), voyant = $('#sortie-etat');
  const ecrire = (html, etat) => {
    ecran.hidden = !html;
    ecran.innerHTML = html;
    ecran.scrollTop = 0;
    voyant.textContent = etat || '';
    voyant.className = 'sortie-etat ' + (etat === 'ok' ? 'ok' : etat ? 'ko' : '');
  };
  if (!ETAT?.jeton){ ecrire('état pas encore chargé.', 'erreur'); return; }
  // une action part vers l'étage affiché et confirmé, jamais vers un étage en bascule ;
  // agrege : item de la todo agrégée, qui porte lui-même le projet qu'il vise
  const affiche = ETAT.projet?.slug;
  if (IMMEUBLE.transit || (IMMEUBLE.projet !== null && IMMEUBLE.projet !== affiche)){
    ecrire(`<span class="ko">refusé — étage en bascule, rien n'est parti.</span>`, 'refusé'); return;
  }
  if (!agrege && req.projet !== undefined && req.projet !== affiche){
    ecrire(`<span class="ko">refusé — action pour ${esc(req.projet)}, étage affiché ${esc(affiche)}.</span>`, 'refusé'); return;
  }
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
    ecran.scrollIntoView({block:'nearest'});
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

function brancherTodo(){
  $('#todo').addEventListener('click', e => {
    const run = e.target.closest('[data-exe]'), cp = e.target.closest('[data-copie]');
    const etage = e.target.closest('[data-etage]');
    if (etage) allerEtage(etage.dataset.etage, etage.dataset.projet || null);
    if (run)  pilote(ETAT.todo[+run.dataset.exe].exe, run, true);
    if (cp)   copier(ETAT.todo[+cp.dataset.copie].cmd, cp);
  });
}

/* actions par tâche : le serveur les fournit (taches[].actions), la page
   ne fait que les afficher et les déclencher */
function brancherTaches(){
  $('#tasks').addEventListener('click', e => {
    const b = e.target.closest('[data-act][data-tid]');
    if (b) actionTache(b.dataset.tid, b.dataset.act, b);
  });
  $$('#pilote-barre [data-lire]').forEach(b =>
    b.onclick = () => pilote({action: b.dataset.lire, projet: ETAT?.projet?.slug}, b));
}

function actionTache(tid, k, bouton){
  const a = ETAT.taches.find(t => t.id === tid).actions.find(x => x.k === k);
  if (a.saisie) ouvrirSaisie(tid, k);
  else if (a.exe) pilote(a.exe, bouton);
  else copier(a.cmd, bouton);
}

/* saisie du motif dans la ligne même : jamais de boîte modale, qui fige la page */
const SAISIE = {tid: null, k: null};

function ouvrirSaisie(tid, k){
  if (SAISIE.tid !== null) fermerSaisie();
  const a = ETAT.taches.find(t => t.id === tid).actions.find(x => x.k === k);
  SAISIE.tid = tid; SAISIE.k = k;
  $(`#tasks .trow[data-tid="${tid}"] .tact`).innerHTML =
    `<input id="saisie-motif" maxlength="200" autocomplete="off" spellcheck="false" placeholder="motif — Entrée">
     <button class="tbtn" id="saisie-ok">✓</button><button class="tbtn" id="saisie-non">✕</button>`;
  const champ = $('#saisie-motif');
  champ.value = a.exe.motif || '';
  const envoyer = () => {
    const motif = champ.value.trim();
    if (!motif || motif.length > 200){ champ.classList.add('ko'); champ.focus(); return; }
    pilote({...a.exe, motif});
    fermerSaisie();
  };
  champ.oninput = () => champ.classList.remove('ko');
  champ.onkeydown = e => { if (e.key === 'Enter'){ e.preventDefault(); envoyer(); } };
  $('#saisie-ok').onclick = envoyer;
  $('#saisie-non').onclick = fermerSaisie;
  champ.focus();
}

/* rendreTaches hors rendu : l'écriture est forcée, la ligne retrouve ses boutons */
function fermerSaisie(){
  SAISIE.tid = null; SAISIE.k = null;
  if (ETAT) rendreTaches(ETAT);
}

/* ── palette Ctrl/⌘K : tout ce que la page sait lancer ou copier ─────── */
const PALETTE = {ouverte: false, sel: 0, entrees: [], saisie: null};

function entreesPalette(s){
  const slug = s.projet.slug;
  const globales = ['board', 'ready', 'doctor', 'index', 'personnel', 'integrer'].map(k =>
    ({titre: k, sous: `projet ${slug}`, exe: {action: k, projet: slug}, cmd: '', saisie: ''}));
  const parTache = s.taches.flatMap(t => (t.actions || []).map(a =>
    ({titre: `${t.id} · ${a.libelle}`, sous: t.titre, exe: a.exe, cmd: a.cmd, saisie: a.saisie})));
  const im = s.immeuble;
  const etages = im ? [...im.etages.filter(e => e.selectionnable), ...im.sous_sol.filter(p => p.selectionnable)].map(e => ({
    titre: `⇅ étage ${e.titre}`,
    sous: `${e.slug} · ${e.compteurs?.['en-cours'] ?? 0} en cours · ${e.compteurs?.bloque ?? 0} bloqué`,
    exe: null, cmd: '', saisie: '', aller: e.produit || e.slug, allerProjet: e.produit ? e.slug : null})) : [];
  const copie = s.taches.some(t => t.statut === 'pret')
    ? [{titre: `/dispatch ${slug}`, sous: 'copier — à lancer dans le terminal', exe: null, cmd: `/dispatch ${slug}`, saisie: ''}]
    : [];
  return [...globales, ...etages, ...parTache, ...copie];
}

function filtrerPalette(q){
  const plat = x => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const n = plat(q.trim());
  PALETTE.entrees = entreesPalette(ETAT).filter(e => plat(e.titre + ' ' + e.sous).includes(n));
  PALETTE.sel = 0;
  $('#palette-liste').innerHTML = PALETTE.entrees.map((e, i) => `
    <li data-i="${i}" class="${i ? '' : 'sel'}"><b>${esc(e.titre)}</b><span>${esc(e.sous)}</span>
      <i>${e.aller ? 'aller' : e.saisie ? 'motif' : e.exe ? 'lancer' : 'copier'}</i></li>`).join('')
    || `<li class="vide">aucune entrée</li>`;
}

function ouvrirPalette(){
  if (!ETAT) return;
  const q = $('#palette-q');
  PALETTE.ouverte = true; PALETTE.saisie = null;
  q.value = ''; q.placeholder = 'action, tâche, commande…'; q.removeAttribute('maxlength'); q.classList.remove('ko');
  $('#palette').hidden = false;
  filtrerPalette('');
  q.focus();
}

function fermerPalette(){
  PALETTE.ouverte = false; PALETTE.saisie = null;
  $('#palette').hidden = true;
}

/* une entrée à motif ne part pas : le champ de recherche devient la saisie */
function executerEntree(e, bouton){
  if (e.aller){ fermerPalette(); allerEtage(e.aller, e.allerProjet); return; }
  if (e.saisie){
    const q = $('#palette-q');
    PALETTE.saisie = e;
    q.value = e.exe.motif || ''; q.maxLength = 200; q.placeholder = 'motif du renvoi — Entrée';
    $('#palette-liste').innerHTML = `<li class="sel"><b>${esc(e.titre)}</b><span>${esc(e.sous)}</span><i>motif</i></li>`;
    q.focus();
    return;
  }
  if (e.exe){ fermerPalette(); pilote(e.exe); }
  else copier(e.cmd, bouton).then(() => setTimeout(fermerPalette, 600));
}

function brancherPalette(){
  const q = $('#palette-q'), liste = $('#palette-liste');
  q.addEventListener('input', () => {
    if (PALETTE.saisie) q.classList.remove('ko'); else filtrerPalette(q.value);
  });
  q.addEventListener('keydown', e => {
    if (e.key === 'Enter'){
      e.preventDefault();
      if (PALETTE.saisie){
        const motif = q.value.trim();
        if (!motif || motif.length > 200){ q.classList.add('ko'); return; }
        const exe = PALETTE.saisie.exe;
        fermerPalette();
        pilote({...exe, motif});
      } else if (PALETTE.entrees.length){
        executerEntree(PALETTE.entrees[PALETTE.sel], $$('li', liste)[PALETTE.sel]);
      }
    } else if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !PALETTE.saisie && PALETTE.entrees.length){
      e.preventDefault();
      const n = PALETTE.entrees.length;
      PALETTE.sel = (PALETTE.sel + (e.key === 'ArrowDown' ? 1 : n - 1)) % n;
      const lis = $$('li', liste);
      lis.forEach((li, i) => li.classList.toggle('sel', i === PALETTE.sel));
      lis[PALETTE.sel].scrollIntoView({block: 'nearest'});
    }
  });
  liste.addEventListener('click', e => {
    const li = e.target.closest('li[data-i]');
    if (li && !PALETTE.saisie) executerEntree(PALETTE.entrees[+li.dataset.i], li);
  });
  addEventListener('pointerdown', e => {
    if (PALETTE.ouverte && !e.target.closest('#palette')) fermerPalette();
  });

  /* raccourcis, en capture : passent avant xterm et le plein écran */
  addEventListener('keydown', e => {
    // dans xterm, Ctrl+K et Échap appartiennent à claude (Échap l'interrompt)
    const dansXterm = document.activeElement?.className === 'xterm-helper-textarea';
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && !dansXterm){
      e.preventDefault();
      if (PALETTE.ouverte) fermerPalette(); else ouvrirPalette();
    } else if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown') && !dansXterm
               && !PALETTE.ouverte && ETAT?.immeuble?.etages.length){
      // étage voisin de la sélection, bornes saturées ; depuis le sous-sol, ↑ = dernier étage
      e.preventDefault();
      const et = [...ETAT.immeuble.etages].sort((a, b) => a.rang - b.rang);
      // depuis l'étage demandé : deux Alt+↓ avant la 1re réponse descendent de deux
      const cour = IMMEUBLE.slug ?? et.find(x => x.selection)?.slug;
      const i = et.findIndex(x => x.slug === cour), haut = e.key === 'ArrowUp';
      const j = i === -1 ? (haut ? et.length - 1 : -1) : Math.max(0, Math.min(et.length - 1, i + (haut ? -1 : 1)));
      if (j !== -1 && j !== i) allerEtage(et[j].slug);
    } else if (e.ctrlKey && (e.key === '`' || e.code === 'Backquote')){
      e.preventDefault(); e.stopPropagation();
      basculerTiroir();
    } else if (e.key === 'Escape' && !dansXterm && (PALETTE.ouverte || SAISIE.tid !== null)){
      e.preventDefault(); e.stopPropagation();
      if (PALETTE.ouverte) fermerPalette(); else fermerSaisie();
    } else if (e.key === 'Escape' && !dansXterm && !$('#vers-immeuble').hidden && !$('.term-panel.plein')){
      // vue étage : Échap = ⌂, après palette, saisie et plein écran du terminal
      e.preventDefault();
      location.hash = '#/';
    }
  }, true);
}

/* ── tiroir : le terminal dort en bas de page, un bandeau visible.
   transform et jamais display:none — xterm garderait 0 colonne ─────── */
function basculerTiroir(ouvrir){
  const ouvert = $('#tiroir').classList.toggle('ouvert', ouvrir);
  try{ localStorage.setItem('agentx:tiroir', ouvert ? '1' : '0'); }catch{}
  $('#tiroir-btn').textContent = ouvert ? '▾ terminal' : '▴ terminal';
  setTimeout(() => { TERMINAL.fit?.fit(); if (ouvert) TERMINAL.term?.focus(); }, 50);
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

/* Claude Code dessine en plein écran par différences : rejouer l'historique
   à une autre taille (ou tronqué) donne de la bouillie. En rattachement on
   n'en garde que l'état final des modes (écran alternatif, souris, collage…),
   on aligne la taille du pty sur la page et on force un redessin complet. */
function termModes(texte){
  const modes = new Map();
  for (const m of texte.matchAll(/\x1b\[\?([\d;]+)([hl])/g))
    for (const n of m[1].split(';')) if (n !== '2026') modes.set(n, m[2]);
  return [...modes].map(([n, v]) => `\x1b[?${n}${v}`).join('');
}

function termRepeindre(){
  const t = TERMINAL.term;
  TERMINAL.fit.fit();
  const {cols, rows} = t;
  // SIGWINCH seulement si la taille change : on passe par une ligne de moins
  termPost('resize', {cols, rows: Math.max(5, rows - 1)})
    .then(() => new Promise(ok => setTimeout(ok, 180)))
    .then(() => termPost('resize', {cols, rows}));
}

/* Sortie synchronisée (DEC 2026) : Claude Code encadre chaque image de
   ?2026h … ?2026l. Le xterm embarqué ignore ce mode et peignait des images à
   moitié dessinées (clignotement) : on retient l'image jusqu'à sa fin, puis on
   l'écrit d'un bloc — xterm analyse un bloc entier avant de repeindre. */
const SYNC = {retenu:'', minuteur:0};
const SYNC_DEBUT = '\x1b[?2026h', SYNC_FIN = '\x1b[?2026l';

function termEcrireOctets(bin){
  const octets = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) octets[i] = bin.charCodeAt(i);
  TERMINAL.term.write(octets);
}

function termEcrire(bin){
  const txt = SYNC.retenu + bin;
  let coupe = txt.length;
  if (txt.lastIndexOf(SYNC_DEBUT) > txt.lastIndexOf(SYNC_FIN)) coupe = txt.lastIndexOf(SYNC_DEBUT);
  else {                               // marqueur coupé entre deux blocs
    const k = txt.lastIndexOf('\x1b');
    if (k >= 0 && txt.length - k < SYNC_DEBUT.length && SYNC_DEBUT.startsWith(txt.slice(k))) coupe = k;
  }
  SYNC.retenu = txt.slice(coupe);
  if (coupe) termEcrireOctets(txt.slice(0, coupe));
  clearTimeout(SYNC.minuteur);
  if (SYNC.retenu)                     // image jamais close : on ne la garde pas indéfiniment
    SYNC.minuteur = setTimeout(() => { const r = SYNC.retenu; SYNC.retenu = ''; termEcrireOctets(r); }, 150);
}

function termEcouter(rattacher){
  if (TERMINAL.src) TERMINAL.src.close();
  const src = new EventSource(`api/term/stream?jeton=${encodeURIComponent(ETAT.jeton)}&depuis=${TERMINAL.pos}`);
  TERMINAL.src = src;
  let premier = !!rattacher;
  src.onmessage = ev => {
    const d = JSON.parse(ev.data);
    if (d.mort){ termMort(); return; }
    if (d.o){
      const bin = atob(d.o);
      if (premier){
        premier = false;
        clearTimeout(SYNC.minuteur); SYNC.retenu = '';
        TERMINAL.term.reset();
        TERMINAL.term.write(termModes(bin));
        termRepeindre();
      } else termEcrire(bin);
    } else if (premier && d.pos != null){ premier = false; termRepeindre(); }
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
  // session déjà ouverte (open est idempotent) : on s'y rattache sans rejouer
  const rattacher = (r.pos || 0) > 4096;
  if (rattacher) TERMINAL.pos = 0;
  termEcouter(rattacher);
  t.focus();
}

function brancherTerminal(){
  $('#tiroir-btn').onclick = () => basculerTiroir();
  let tiroir = '0';
  try{ tiroir = localStorage.getItem('agentx:tiroir') || '0'; }catch{}
  basculerTiroir(tiroir === '1');

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

  /* Maj+Entrée = retour à la ligne : xterm enverrait un simple \r (envoi).
     Claude Code lit ESC+\r (Alt+Entrée) comme un saut de ligne. */
  term.attachCustomKeyEventHandler(ev => {
    if (ev.key !== 'Enter' || !ev.shiftKey || ev.ctrlKey || ev.altKey || ev.metaKey) return true;
    if (ev.type === 'keydown' && TERMINAL.vivant) termEnvoyer('\x1b\r');
    return false;
  });

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
    if (e?.vivant){ TERMINAL.pos = 0; TERMINAL.vivant = true; termEtat('en session', 'ok'); termEcouter(true); term.focus(); }
    else termLancer();                 // sinon on ouvre la session tout de suite
  }, 300);
}

({etage: IMMEUBLE.slug, projet: IMMEUBLE.projet} = etageDemande()); brancherImmeuble(); brancherTour();
brancherTodo(); brancherTaches(); brancherPalette(); brancherTerminal(); brancherSon(); brancherVoix(); boucle();

/* la courbe se redessine proprement au redimensionnement */
let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { salleFaite = false; }, 200); });

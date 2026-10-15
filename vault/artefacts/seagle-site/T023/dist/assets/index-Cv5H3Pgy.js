import{q as m,r as h,Z as _,D as P,y as I,v as R,j as e,H as q,c as x,z as X,A as w,m as S,u as L,L as D,g as O}from"./index-sYrxi1OL.js";import{P as B}from"./package-BHAMLrZN.js";import{C as g}from"./chevron-right-q6qNpH-V.js";import{C as M}from"./check-kSLqpwu8.js";const z=[["path",{d:"M12 7v14",key:"1akyts"}],["path",{d:"M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z",key:"ruj8y"}]],G=m("book-open",z);const K=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]],C=m("circle-alert",K);const V=[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]],U=m("copy",V);const H=[["path",{d:"M15 3h6v6",key:"1q9fwt"}],["path",{d:"M10 14 21 3",key:"gplh6r"}],["path",{d:"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",key:"a6xqqp"}]],F=m("external-link",H);const Z=[["line",{x1:"4",x2:"20",y1:"9",y2:"9",key:"4lhtct"}],["line",{x1:"4",x2:"20",y1:"15",y2:"15",key:"vyu0kd"}],["line",{x1:"10",x2:"8",y1:"3",y2:"21",key:"1ggp8o"}],["line",{x1:"16",x2:"14",y1:"3",y2:"21",key:"weycgp"}]],$=m("hash",Z);const W=[["path",{d:"M12 19h8",key:"baeox8"}],["path",{d:"m4 17 6-6-6-6",key:"1yngyt"}]],Y=m("terminal",W);const J=[["path",{d:"M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2",key:"q3hayz"}],["path",{d:"m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06",key:"1go1hn"}],["path",{d:"m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8",key:"qlwsc0"}]],Q=m("webhook",J),u=[{id:"getting-started",label:"Démarrage",icon:_,accent:"text-teal-400",items:[{id:"introduction",label:"Introduction"},{id:"quickstart",label:"Démarrage rapide"},{id:"auth",label:"Authentification"}]},{id:"atlas",label:"Atlas Agent",icon:P,accent:"text-violet-400",items:[{id:"atlas-overview",label:"Vue d'ensemble"},{id:"atlas-api",label:"API Reference"},{id:"atlas-examples",label:"Exemples"}]},{id:"nexus",label:"Nexus Analytics",icon:I,accent:"text-emerald-400",items:[{id:"nexus-overview",label:"Vue d'ensemble"},{id:"nexus-api",label:"API Reference"}]},{id:"sentinel",label:"Sentinel",icon:R,accent:"text-orange-400",items:[{id:"sentinel-overview",label:"Vue d'ensemble"},{id:"sentinel-rules",label:"Règles & alertes"}]},{id:"webhooks",label:"Webhooks",icon:Q,accent:"text-pink-400",items:[{id:"webhooks-setup",label:"Configuration"},{id:"webhooks-events",label:"Événements"}]},{id:"sdks",label:"SDKs",icon:B,accent:"text-sky-400",items:[{id:"sdk-js",label:"JavaScript / TypeScript"},{id:"sdk-python",label:"Python"}]}];function n({code:s,language:i="bash"}){const[r,p]=h.useState(!1),c=()=>{navigator.clipboard.writeText(s),p(!0),setTimeout(()=>p(!1),1800)};return e.jsxs("div",{className:"relative group rounded-xl overflow-hidden border border-rim bg-overlay my-4",children:[e.jsxs("div",{className:"flex items-center justify-between px-4 py-2.5 border-b border-rim bg-overlay-md",children:[e.jsx("span",{className:"text-[11px] font-mono text-lo uppercase tracking-wider",children:i}),e.jsxs("button",{onClick:c,className:"flex items-center gap-1.5 text-[11px] text-lo hover:text-md transition-colors",children:[r?e.jsx(M,{className:"w-3.5 h-3.5 text-teal-400"}):e.jsx(U,{className:"w-3.5 h-3.5"}),r?"Copié":"Copier"]})]}),e.jsx("pre",{className:"p-4 overflow-x-auto text-sm font-mono leading-relaxed text-hi scrollbar-thin",children:e.jsx("code",{children:s})})]})}function ee({method:s}){const i={GET:"bg-emerald-500/10 text-emerald-400 border-emerald-500/20",POST:"bg-teal-500/10   text-teal-400   border-teal-500/20",PUT:"bg-sky-500/10    text-sky-400    border-sky-500/20",PATCH:"bg-amber-500/10  text-amber-400  border-amber-500/20",DELETE:"bg-red-500/10    text-red-400    border-red-500/20"};return e.jsx("span",{className:x("inline-block px-2 py-0.5 rounded text-[11px] font-bold font-mono border",i[s]),children:s})}function d({method:s,path:i,description:r}){return e.jsxs("div",{className:"flex items-start gap-3 py-3 border-b border-rim last:border-0",children:[e.jsx(ee,{method:s}),e.jsxs("div",{className:"min-w-0",children:[e.jsx("code",{className:"text-sm font-mono text-hi",children:i}),e.jsx("p",{className:"text-xs text-md mt-0.5",children:r})]})]})}function a({title:s,children:i}){return e.jsxs("div",{className:"mb-10",children:[e.jsxs("h3",{className:"flex items-center gap-2 text-base font-semibold text-hi mb-4",children:[e.jsx($,{className:"w-4 h-4 text-faint"}),s]}),i]})}function b({type:s="info",children:i}){const r={info:"border-sky-500/30    bg-sky-500/[0.06]    text-sky-300",warning:"border-amber-500/30  bg-amber-500/[0.06]  text-amber-300",tip:"border-teal-500/30   bg-teal-500/[0.06]   text-teal-300"},c={info:C,warning:C,tip:_}[s];return e.jsxs("div",{className:x("flex gap-3 p-4 rounded-xl border my-4 text-sm leading-relaxed",r[s]),children:[e.jsx(c,{className:"w-4 h-4 mt-0.5 shrink-0"}),e.jsx("div",{children:i})]})}function se({children:s}){const{i18n:i}=L();return e.jsx(D,{to:O(i.language,"contact"),className:"text-teal-400 hover:underline",children:s})}const te={introduction:e.jsxs("div",{children:[e.jsx("h2",{className:"text-2xl font-bold text-hi mb-2",children:"Introduction"}),e.jsx("p",{className:"text-md text-sm mb-8",children:"Bienvenue dans la documentation officielle de la plateforme Seagle."}),e.jsxs(a,{title:"Qu'est-ce que Seagle ?",children:[e.jsx("p",{className:"text-md text-sm leading-relaxed mb-3",children:"Seagle est une plateforme unifiée d'intelligence artificielle et d'automatisation. Elle expose une API REST qui vous permet d'interagir avec nos différents produits : agents IA, dashboards analytiques, monitoring proactif depuis n'importe quelle application."}),e.jsxs("p",{className:"text-md text-sm leading-relaxed",children:["Tous les appels sont authentifiés via une ",e.jsx("strong",{className:"text-hi",children:"API Key"})," ou un token",e.jsx("strong",{className:"text-hi",children:" OAuth 2.0"}),", passé dans le header ",e.jsx("code",{className:"text-teal-400 bg-teal-500/10 px-1 rounded",children:"Authorization"}),"."]})]}),e.jsxs(a,{title:"Base URL",children:[e.jsx(n,{code:"https://api.seagle.io/v1",language:"text"}),e.jsxs(b,{type:"info",children:["Toutes les réponses sont encodées en ",e.jsx("strong",{children:"JSON"}),". Les erreurs suivent le format RFC 9110."]})]}),e.jsx(a,{title:"Versionning",children:e.jsxs("p",{className:"text-md text-sm leading-relaxed",children:["L'API est versionnée via le segment ",e.jsx("code",{className:"text-teal-400 bg-teal-500/10 px-1 rounded",children:"/v1"})," dans l'URL. Les changements non-rétrocompatibles donneront lieu à un incrément de version avec une période de dépréciation de 6 mois."]})})]}),quickstart:e.jsxs("div",{children:[e.jsx("h2",{className:"text-2xl font-bold text-hi mb-2",children:"Démarrage rapide"}),e.jsx("p",{className:"text-md text-sm mb-8",children:"Faites votre premier appel API en moins de 5 minutes."}),e.jsxs(a,{title:"1 — Créez votre API Key",children:[e.jsxs("p",{className:"text-md text-sm leading-relaxed mb-3",children:["Rendez-vous dans votre ",e.jsx(se,{children:"espace client"})," → Paramètres → API Keys → Générer une clé."]}),e.jsx(b,{type:"warning",children:"Conservez votre clé en lieu sûr. Elle ne sera affichée qu'une seule fois et ne doit jamais être exposée côté client."})]}),e.jsxs(a,{title:"2 — Installez le SDK",children:[e.jsx(n,{code:"npm install @seagle/sdk",language:"bash"}),e.jsx(n,{code:"pip install seagle-sdk",language:"bash"})]}),e.jsx(a,{title:"3 — Premier appel",children:e.jsx(n,{code:`import { Seagle } from '@seagle/sdk'

const client = new Seagle({ apiKey: process.env.SEAGLE_API_KEY })

// Envoyer un message à Atlas Agent
const response = await client.atlas.chat({
  message: "Résume les ventes du mois dernier",
  context: { userId: "usr_abc123" },
})

console.log(response.reply)
// → "En mars 2026, vos ventes ont atteint 142 k€, soit +18 % vs février..."`,language:"typescript"})}),e.jsx(a,{title:"Réponse attendue",children:e.jsx(n,{code:`{
  "id": "msg_01XYZ",
  "reply": "En mars 2026, vos ventes ont atteint 142 k€...",
  "model": "atlas-2.1",
  "usage": {
    "prompt_tokens": 48,
    "completion_tokens": 112,
    "total_tokens": 160
  },
  "latency_ms": 820
}`,language:"json"})})]}),auth:e.jsxs("div",{children:[e.jsx("h2",{className:"text-2xl font-bold text-hi mb-2",children:"Authentification"}),e.jsx("p",{className:"text-md text-sm mb-8",children:"Deux méthodes sont supportées : API Key et OAuth 2.0."}),e.jsxs(a,{title:"API Key",children:[e.jsxs("p",{className:"text-md text-sm leading-relaxed mb-3",children:["Passez votre clé dans le header ",e.jsx("code",{className:"text-teal-400 bg-teal-500/10 px-1 rounded",children:"Authorization"})," avec le préfixe ",e.jsx("code",{className:"text-teal-400 bg-teal-500/10 px-1 rounded",children:"Bearer"}),"."]}),e.jsx(n,{code:`curl https://api.seagle.io/v1/atlas/chat \\
  -H "Authorization: Bearer sk_live_XXXXXXXXXXXXXXXX" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Bonjour Atlas"}'`,language:"bash"})]}),e.jsxs(a,{title:"OAuth 2.0 — Client Credentials",children:[e.jsx(n,{code:`# Obtenir un access_token
curl -X POST https://auth.seagle.io/oauth/token \\
  -d "grant_type=client_credentials" \\
  -d "client_id=YOUR_CLIENT_ID" \\
  -d "client_secret=YOUR_CLIENT_SECRET" \\
  -d "scope=atlas:read atlas:write nexus:read"`,language:"bash"}),e.jsx(n,{code:`{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5c...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "atlas:read atlas:write nexus:read"
}`,language:"json"})]}),e.jsx(a,{title:"Scopes disponibles",children:e.jsx("div",{className:"rounded-xl border border-rim overflow-hidden text-sm",children:[["atlas:read","Lecture des conversations et historique"],["atlas:write","Envoi de messages et création d'agents"],["nexus:read","Accès aux dashboards et métriques"],["nexus:write","Création et modification de dashboards"],["sentinel:read","Lecture des alertes et statuts"],["webhooks","Gestion des webhooks"]].map(([s,i],r)=>e.jsxs("div",{className:x("flex items-start gap-4 px-4 py-3",r%2===0?"bg-overlay":""),children:[e.jsx("code",{className:"text-teal-400 font-mono text-xs shrink-0 mt-0.5",children:s}),e.jsx("span",{className:"text-md text-xs",children:i})]},s))})})]}),"atlas-overview":e.jsxs("div",{children:[e.jsx("h2",{className:"text-2xl font-bold text-hi mb-2",children:"Atlas Agent"}),e.jsx("p",{className:"text-md text-sm mb-8",children:"Votre assistant IA conversationnel et d'automatisation."}),e.jsx(a,{title:"Fonctionnalités",children:e.jsx("div",{className:"grid sm:grid-cols-2 gap-3",children:[{icon:"💬",label:"Chat multi-tours",desc:"Conversations contextuelles avec mémoire"},{icon:"⚙️",label:"Outils & actions",desc:"Appel de fonctions externes (CRM, DB, API)"},{icon:"📎",label:"Fichiers & documents",desc:"Analyse de PDF, CSV, images"},{icon:"🔁",label:"Workflows automatisés",desc:"Déclencheurs planifiés ou événementiels"}].map(s=>e.jsxs("div",{className:"rounded-xl border border-rim bg-overlay p-4",children:[e.jsx("span",{className:"text-xl",children:s.icon}),e.jsx("p",{className:"font-medium text-hi text-sm mt-2",children:s.label}),e.jsx("p",{className:"text-xs text-md mt-1",children:s.desc})]},s.label))})}),e.jsx(a,{title:"Modèles disponibles",children:e.jsx("div",{className:"rounded-xl border border-rim overflow-hidden text-sm",children:[["atlas-2.1","Dernier modèle : recommandé","128k tokens"],["atlas-2.0","Stable : production","64k tokens"],["atlas-mini-1.2","Rapide & économique","32k tokens"]].map(([s,i,r])=>e.jsxs("div",{className:"flex items-center justify-between px-4 py-3 border-b border-rim last:border-0",children:[e.jsxs("div",{children:[e.jsx("code",{className:"text-violet-400 font-mono text-xs",children:s}),e.jsx("p",{className:"text-md text-xs mt-0.5",children:i})]}),e.jsx("span",{className:"text-[11px] text-lo bg-overlay border border-rim rounded px-2 py-0.5",children:r})]},s))})})]}),"atlas-api":e.jsxs("div",{children:[e.jsx("h2",{className:"text-2xl font-bold text-hi mb-2",children:"Atlas : API Reference"}),e.jsx("p",{className:"text-md text-sm mb-8",children:"Endpoints REST pour interagir avec Atlas Agent."}),e.jsx(a,{title:"Endpoints",children:e.jsxs("div",{className:"rounded-xl border border-rim bg-overlay px-4",children:[e.jsx(d,{method:"POST",path:"/atlas/chat",description:"Envoyer un message et obtenir une réponse"}),e.jsx(d,{method:"GET",path:"/atlas/conversations",description:"Lister les conversations"}),e.jsx(d,{method:"GET",path:"/atlas/conversations/:id",description:"Récupérer une conversation"}),e.jsx(d,{method:"DELETE",path:"/atlas/conversations/:id",description:"Supprimer une conversation"}),e.jsx(d,{method:"POST",path:"/atlas/agents",description:"Créer un agent personnalisé"}),e.jsx(d,{method:"GET",path:"/atlas/agents",description:"Lister vos agents"})]})}),e.jsxs(a,{title:"POST /atlas/chat",children:[e.jsx("p",{className:"text-md text-sm mb-3",children:"Corps de la requête :"}),e.jsx(n,{code:`{
  "message": "string",          // requis : message de l'utilisateur
  "conversation_id": "string",  // optionnel : pour continuer une conversation
  "agent_id": "string",         // optionnel : utiliser un agent custom
  "model": "atlas-2.1",          // optionnel : défaut : atlas-2.1
  "stream": false,              // optionnel : streaming SSE
  "context": {                  // optionnel : données contextuelles
    "userId": "string",
    "metadata": {}
  }
}`,language:"json"}),e.jsx("p",{className:"text-md text-sm mb-3",children:"Réponse :"}),e.jsx(n,{code:`{
  "id": "msg_01ABC",
  "conversation_id": "conv_XYZ",
  "reply": "string",
  "model": "atlas-2.1",
  "finish_reason": "stop",
  "usage": {
    "prompt_tokens": 48,
    "completion_tokens": 112,
    "total_tokens": 160
  },
  "created_at": "2026-04-17T10:30:00Z"
}`,language:"json"})]})]}),"atlas-examples":e.jsxs("div",{children:[e.jsx("h2",{className:"text-2xl font-bold text-hi mb-2",children:"Atlas : Exemples"}),e.jsx("p",{className:"text-md text-sm mb-8",children:"Cas d'usage courants avec du code prêt à l'emploi."}),e.jsx(a,{title:"Streaming (SSE)",children:e.jsx(n,{code:`const response = await client.atlas.chat({
  message: "Rédige un email de relance client",
  stream: true,
})

for await (const chunk of response) {
  process.stdout.write(chunk.delta)
}`,language:"typescript"})}),e.jsx(a,{title:"Agent avec outils (tools)",children:e.jsx(n,{code:`const agent = await client.atlas.createAgent({
  name: "Sales Assistant",
  instructions: "Tu es un assistant commercial. Tu analyses les données CRM.",
  tools: [
    {
      name: "get_crm_data",
      description: "Récupère les données CRM d'un client",
      parameters: {
        type: "object",
        properties: {
          client_id: { type: "string" }
        },
        required: ["client_id"]
      }
    }
  ]
})

console.log(agent.id) // agent_01XYZ`,language:"typescript"})}),e.jsx(a,{title:"Python",children:e.jsx(n,{code:`import seagle

client = seagle.Client(api_key="sk_live_XXX")

response = client.atlas.chat(
    message="Quels sont mes leads chauds ce mois-ci ?",
    model="atlas-2.1"
)

print(response.reply)`,language:"python"})})]}),"nexus-overview":e.jsxs("div",{children:[e.jsx("h2",{className:"text-2xl font-bold text-hi mb-2",children:"Nexus Analytics"}),e.jsx("p",{className:"text-md text-sm mb-8",children:"Dashboards dynamiques et métriques en temps réel."}),e.jsx(a,{title:"Concepts clés",children:e.jsx("div",{className:"space-y-3",children:[{term:"Workspace",def:"Espace de travail isolé contenant vos dashboards et sources de données."},{term:"Dashboard",def:"Ensemble de widgets visuels connectés à une ou plusieurs sources."},{term:"Source",def:"Connexion vers une base de données, une API ou un fichier CSV."},{term:"Widget",def:"Composant visuel : graphique, KPI, tableau, carte..."},{term:"Alert",def:"Règle qui déclenche une notification quand une métrique dépasse un seuil."}].map(({term:s,def:i})=>e.jsxs("div",{className:"flex gap-3 text-sm",children:[e.jsx("code",{className:"text-emerald-400 font-mono shrink-0 mt-0.5 text-xs",children:s}),e.jsx("span",{className:"text-md",children:i})]},s))})}),e.jsx(a,{title:"Sources supportées",children:e.jsx("div",{className:"flex flex-wrap gap-2",children:["PostgreSQL","MySQL","MongoDB","BigQuery","Snowflake","REST API","CSV / Parquet","Google Sheets"].map(s=>e.jsx("span",{className:"px-3 py-1 rounded-full text-xs border border-rim bg-overlay text-md",children:s},s))})})]}),"nexus-api":e.jsxs("div",{children:[e.jsx("h2",{className:"text-2xl font-bold text-hi mb-2",children:"Nexus : API Reference"}),e.jsx("p",{className:"text-md text-sm mb-8",children:"Gérez dashboards et métriques via l'API."}),e.jsx(a,{title:"Endpoints",children:e.jsxs("div",{className:"rounded-xl border border-rim bg-overlay px-4",children:[e.jsx(d,{method:"GET",path:"/nexus/dashboards",description:"Lister vos dashboards"}),e.jsx(d,{method:"POST",path:"/nexus/dashboards",description:"Créer un dashboard"}),e.jsx(d,{method:"GET",path:"/nexus/dashboards/:id",description:"Récupérer un dashboard"}),e.jsx(d,{method:"PATCH",path:"/nexus/dashboards/:id",description:"Modifier un dashboard"}),e.jsx(d,{method:"GET",path:"/nexus/dashboards/:id/metrics",description:"Récupérer les métriques en temps réel"}),e.jsx(d,{method:"POST",path:"/nexus/sources",description:"Connecter une source de données"})]})}),e.jsxs(a,{title:"Récupérer des métriques",children:[e.jsx(n,{code:`GET /nexus/dashboards/dash_01ABC/metrics?
  from=2026-04-01T00:00:00Z&
  to=2026-04-17T23:59:59Z&
  granularity=day`,language:"text"}),e.jsx(n,{code:`{
  "dashboard_id": "dash_01ABC",
  "granularity": "day",
  "series": [
    {
      "name": "Chiffre d'affaires",
      "unit": "EUR",
      "data": [
        { "timestamp": "2026-04-01", "value": 12480 },
        { "timestamp": "2026-04-02", "value": 9320 }
      ]
    }
  ]
}`,language:"json"})]})]}),"sentinel-overview":e.jsxs("div",{children:[e.jsx("h2",{className:"text-2xl font-bold text-hi mb-2",children:"Sentinel"}),e.jsx("p",{className:"text-md text-sm mb-8",children:"Surveillance proactive de vos applications et infrastructure."}),e.jsxs(a,{title:"Fonctionnement",children:[e.jsx("p",{className:"text-md text-sm leading-relaxed mb-4",children:"Sentinel surveille en continu vos endpoints, bases de données et services. Dès qu'une anomalie est détectée, il déclenche une alerte via webhook, email ou Slack."}),e.jsxs(b,{type:"tip",children:["Sentinel peut aussi être utilisé en mode ",e.jsx("strong",{children:"agent autonome"})," : il tente de corriger automatiquement les incidents connus (redémarrage de service, vidage de cache, rollback...)."]})]}),e.jsx(a,{title:"Types de checks disponibles",children:e.jsx("div",{className:"grid sm:grid-cols-2 gap-3",children:[{name:"HTTP / HTTPS",desc:"Uptime, latence, contenu de la réponse"},{name:"TCP / UDP",desc:"Disponibilité d'un port réseau"},{name:"SSL Certificate",desc:"Expiration, validité, chaîne de confiance"},{name:"Cronjob",desc:"Heartbeat : détecte les tâches planifiées manquées"},{name:"Base de données",desc:"Latence de requête, connexions actives"},{name:"Métrique custom",desc:"Seuils sur n'importe quelle métrique Nexus"}].map(s=>e.jsxs("div",{className:"rounded-xl border border-rim bg-overlay p-3",children:[e.jsx("p",{className:"text-sm font-medium text-hi",children:s.name}),e.jsx("p",{className:"text-xs text-md mt-1",children:s.desc})]},s.name))})})]}),"sentinel-rules":e.jsxs("div",{children:[e.jsx("h2",{className:"text-2xl font-bold text-hi mb-2",children:"Règles & alertes"}),e.jsx("p",{className:"text-md text-sm mb-8",children:"Configurez vos seuils d'alerte via API."}),e.jsx(a,{title:"Créer une règle",children:e.jsx(n,{code:`POST /sentinel/rules

{
  "name": "API Latence critique",
  "check_type": "http",
  "target": "https://api.monapp.io/health",
  "interval_seconds": 30,
  "conditions": [
    { "metric": "response_time_ms", "operator": "gt", "threshold": 2000 },
    { "metric": "status_code",      "operator": "ne", "threshold": 200 }
  ],
  "notifications": {
    "channels": ["webhook", "email"],
    "webhook_url": "https://monapp.io/alerts",
    "email": "ops@monapp.io"
  }
}`,language:"json"})})]}),"webhooks-setup":e.jsxs("div",{children:[e.jsx("h2",{className:"text-2xl font-bold text-hi mb-2",children:"Webhooks : Configuration"}),e.jsx("p",{className:"text-md text-sm mb-8",children:"Recevez des événements en temps réel sur votre endpoint."}),e.jsx(a,{title:"Enregistrer un endpoint",children:e.jsx(n,{code:`POST /webhooks

{
  "url": "https://monapp.io/hooks/seagle",
  "events": ["atlas.message.completed", "sentinel.alert.triggered", "nexus.metric.threshold"],
  "secret": "whsec_XXXXXXXX"  // pour la vérification de signature
}`,language:"json"})}),e.jsxs(a,{title:"Vérifier la signature",children:[e.jsx(n,{code:`import crypto from 'crypto'

function verifySignature(payload: string, signature: string, secret: string) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(\`sha256=\${expected}\`)
  )
}`,language:"typescript"}),e.jsx(b,{type:"warning",children:"Toujours vérifier la signature avant de traiter un événement webhook pour prévenir les attaques par rejeu."})]})]}),"webhooks-events":e.jsxs("div",{children:[e.jsx("h2",{className:"text-2xl font-bold text-hi mb-2",children:"Événements webhook"}),e.jsx("p",{className:"text-md text-sm mb-8",children:"Liste complète des événements pouvant être écoutés."}),e.jsx(a,{title:"Catalogue d'événements",children:e.jsx("div",{className:"rounded-xl border border-rim overflow-hidden text-sm",children:[["atlas.message.completed","violet","Message Atlas traité"],["atlas.agent.created","violet","Nouvel agent créé"],["nexus.metric.threshold","emerald","Seuil de métrique dépassé"],["nexus.dashboard.shared","emerald","Dashboard partagé"],["sentinel.alert.triggered","orange","Alerte Sentinel déclenchée"],["sentinel.alert.resolved","orange","Alerte résolue"],["billing.invoice.paid","teal","Facture payée"],["billing.subscription.canceled","red","Abonnement annulé"]].map(([s,i,r])=>e.jsxs("div",{className:"flex items-center justify-between px-4 py-3 border-b border-rim last:border-0 hover:bg-overlay transition-colors",children:[e.jsx("code",{className:`text-${i}-400 font-mono text-xs`,children:s}),e.jsx("span",{className:"text-md text-xs",children:r})]},s))})})]}),"sdk-js":e.jsxs("div",{children:[e.jsx("h2",{className:"text-2xl font-bold text-hi mb-2",children:"SDK JavaScript / TypeScript"}),e.jsx("p",{className:"text-md text-sm mb-8",children:"Client officiel pour Node.js, Deno et les navigateurs modernes."}),e.jsxs(a,{title:"Installation",children:[e.jsx(n,{code:"npm install @seagle/sdk",language:"bash"}),e.jsx(n,{code:"yarn add @seagle/sdk",language:"bash"}),e.jsx(n,{code:"pnpm add @seagle/sdk",language:"bash"})]}),e.jsx(a,{title:"Initialisation",children:e.jsx(n,{code:`import { Seagle } from '@seagle/sdk'

const client = new Seagle({
  apiKey: process.env.SEAGLE_API_KEY,
  // optionnel
  baseURL: 'https://api.seagle.io/v1',
  timeout: 30_000,
  maxRetries: 3,
})`,language:"typescript"})}),e.jsx(a,{title:"TypeScript — types exportés",children:e.jsx(n,{code:`import type {
  ChatMessage,
  ChatResponse,
  Agent,
  Dashboard,
  SentinelRule,
  WebhookEvent,
} from '@seagle/sdk'`,language:"typescript"})})]}),"sdk-python":e.jsxs("div",{children:[e.jsx("h2",{className:"text-2xl font-bold text-hi mb-2",children:"SDK Python"}),e.jsx("p",{className:"text-md text-sm mb-8",children:"Client officiel pour Python 3.9+. Compatible asyncio."}),e.jsxs(a,{title:"Installation",children:[e.jsx(n,{code:"pip install seagle-sdk",language:"bash"}),e.jsx(n,{code:"poetry add seagle-sdk",language:"bash"})]}),e.jsx(a,{title:"Utilisation synchrone",children:e.jsx(n,{code:`import seagle

client = seagle.Client(api_key="sk_live_XXX")

response = client.atlas.chat(message="Bonjour !")
print(response.reply)`,language:"python"})}),e.jsx(a,{title:"Utilisation async",children:e.jsx(n,{code:`import asyncio
import seagle

async def main():
    client = seagle.AsyncClient(api_key="sk_live_XXX")
    response = await client.atlas.chat(message="Bonjour !")
    print(response.reply)

asyncio.run(main())`,language:"python"})})]})};function re(){const[s,i]=h.useState("introduction"),[r,p]=h.useState(new Set(["getting-started"])),[c,A]=h.useState(""),[y,j]=h.useState(!1),N=h.useRef(null),T=t=>p(l=>{const o=new Set(l);return o.has(t)?o.delete(t):o.add(t),o}),v=t=>{i(t),j(!1),N.current?.scrollTo({top:0,behavior:"smooth"})},f=u.find(t=>t.items.some(l=>l.id===s)),k=f?.items.find(t=>t.id===s),E=c.trim()?u.map(t=>({...t,items:t.items.filter(l=>l.label.toLowerCase().includes(c.toLowerCase())||t.label.toLowerCase().includes(c.toLowerCase()))})).filter(t=>t.items.length>0):u;return e.jsxs("div",{className:"flex bg-page text-hi min-h-screen pt-16",children:[e.jsxs("aside",{className:x("fixed inset-y-0 left-0 z-40 w-64 pt-16 bg-page border-r border-rim flex flex-col","transform transition-transform duration-300 lg:translate-x-0",y?"translate-x-0":"-translate-x-full lg:translate-x-0"),children:[e.jsx("div",{className:"px-4 py-4 border-b border-rim",children:e.jsxs("div",{className:"flex items-center gap-2 px-3 py-2 rounded-lg bg-overlay border border-rim",children:[e.jsx(q,{className:"w-3.5 h-3.5 text-lo shrink-0"}),e.jsx("input",{value:c,onChange:t=>A(t.target.value),placeholder:"Rechercher...",className:"flex-1 bg-transparent text-xs text-hi placeholder:text-lo outline-none"})]})}),e.jsx("nav",{className:"flex-1 overflow-y-auto py-4 px-3 space-y-0.5",children:E.map(t=>e.jsxs("div",{children:[e.jsxs("button",{onClick:()=>T(t.id),className:"flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-semibold text-lo hover:text-md hover:bg-overlay transition-colors uppercase tracking-wider",children:[e.jsxs("span",{className:"flex items-center gap-2",children:[e.jsx(t.icon,{className:x("w-3.5 h-3.5",t.accent)}),t.label]}),e.jsx(X,{className:x("w-3 h-3 transition-transform",r.has(t.id)?"rotate-0":"-rotate-90")})]}),e.jsx(w,{initial:!1,children:r.has(t.id)&&e.jsx(S.div,{initial:{height:0,opacity:0},animate:{height:"auto",opacity:1},exit:{height:0,opacity:0},transition:{duration:.2},className:"overflow-hidden ml-3 border-l border-rim pl-3 mt-0.5 mb-1 space-y-0.5",children:t.items.map(l=>e.jsx("button",{onClick:()=>v(l.id),className:x("w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors",s===l.id?"bg-teal-500/10 text-teal-400 font-medium":"text-md hover:text-hi hover:bg-overlay"),children:l.label},l.id))})})]},t.id))}),e.jsx("div",{className:"px-4 py-4 border-t border-rim",children:e.jsxs("a",{href:"https://status.seagle.io",target:"_blank",rel:"noopener noreferrer",className:"flex items-center gap-2 text-xs text-lo hover:text-md transition-colors",children:[e.jsx("span",{className:"w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"}),"Tous les systèmes opérationnels",e.jsx(F,{className:"w-3 h-3 ml-auto"})]})})]}),y&&e.jsx("div",{className:"fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden",onClick:()=>j(!1)}),e.jsxs("main",{className:"flex-1 lg:pl-64 min-w-0",children:[e.jsxs("div",{className:"sticky top-16 z-20 flex items-center gap-3 px-6 py-3 bg-page/90 backdrop-blur-xl border-b border-rim",children:[e.jsx("button",{onClick:()=>j(t=>!t),className:"lg:hidden p-1.5 rounded-lg bg-overlay text-md hover:text-hi transition-colors",children:e.jsx(G,{className:"w-4 h-4"})}),e.jsxs("nav",{className:"flex items-center gap-1.5 text-xs text-lo min-w-0",children:[e.jsx("span",{children:"Docs"}),f&&e.jsxs(e.Fragment,{children:[e.jsx(g,{className:"w-3 h-3 shrink-0"}),e.jsx("span",{children:f.label})]}),k&&e.jsxs(e.Fragment,{children:[e.jsx(g,{className:"w-3 h-3 shrink-0"}),e.jsx("span",{className:"text-md truncate",children:k.label})]})]}),e.jsx("div",{className:"ml-auto flex items-center gap-3",children:e.jsxs("a",{href:"mailto:dev@seagle.io",className:"hidden sm:flex items-center gap-1.5 text-xs text-lo hover:text-md transition-colors",children:[e.jsx(Y,{className:"w-3.5 h-3.5"}),"dev@seagle.io"]})})]}),e.jsxs("div",{ref:N,className:"px-6 sm:px-10 py-10 max-w-3xl",children:[e.jsx(w,{mode:"wait",children:e.jsx(S.div,{initial:{opacity:0,y:12},animate:{opacity:1,y:0},exit:{opacity:0,y:-8},transition:{duration:.2},children:te[s]??e.jsx("div",{className:"text-md text-sm",children:"Section en cours de rédaction…"})},s)}),e.jsxs("div",{className:"mt-16 pt-8 border-t border-rim flex items-center justify-between",children:[e.jsxs("button",{onClick:()=>{const t=u.flatMap(o=>o.items),l=t.findIndex(o=>o.id===s);l>0&&v(t[l-1].id)},className:"flex items-center gap-2 text-xs text-md hover:text-hi transition-colors",children:[e.jsx(g,{className:"w-3.5 h-3.5 rotate-180"}),"Précédent"]}),e.jsxs("button",{onClick:()=>{const t=u.flatMap(o=>o.items),l=t.findIndex(o=>o.id===s);l<t.length-1&&v(t[l+1].id)},className:"flex items-center gap-2 text-xs text-md hover:text-hi transition-colors",children:["Suivant",e.jsx(g,{className:"w-3.5 h-3.5"})]})]})]})]})]})}export{re as default};

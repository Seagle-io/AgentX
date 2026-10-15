// src/lib/site-routes.json
var site_routes_default = {
  locales: ["fr", "en", "es", "de", "it"],
  prefixed: ["es", "de", "it"],
  default: "fr",
  og: { fr: "fr_FR", en: "en_US", es: "es_ES", de: "de_DE", it: "it_IT" },
  routes: {
    home: { fr: "/", en: "/", index: true, changefreq: "weekly", priority: 1 },
    services: { fr: "/services", en: "/services", index: false },
    products: { fr: "/produits", en: "/products", index: true, changefreq: "weekly", priority: 0.9 },
    about: { fr: "/a-propos", en: "/about", index: true, changefreq: "monthly", priority: 0.7 },
    contact: { fr: "/contact", en: "/contact", index: true, changefreq: "monthly", priority: 0.8 },
    booking: { fr: "/rendez-vous", en: "/book", index: true, changefreq: "monthly", priority: 0.7 },
    cgu: { fr: "/cgu", en: "/terms", index: true, changefreq: "yearly", priority: 0.3 },
    career: { fr: "/carrieres", en: "/careers", index: true, changefreq: "monthly", priority: 0.7 },
    docs: { fr: "/docs", en: "/docs", index: false },
    kora: { fr: "/solutions/kora", en: "/solutions/kora", index: true, changefreq: "monthly", priority: 0.8 },
    securePass: { fr: "/secure-pass", en: "/secure-pass", index: true, changefreq: "monthly", priority: 0.8 },
    agentx: { fr: "/agentx", en: "/agentx", index: true, changefreq: "monthly", priority: 0.8 },
    aisio: { fr: "/global-seo", en: "/global-seo", index: true, changefreq: "monthly", priority: 0.7 },
    leefEditor: { fr: "/leef-editor", en: "/leef-editor", index: true, changefreq: "monthly", priority: 0.7 },
    starryNight: { fr: "/nuit-etoilee", en: "/starry-night", index: true, changefreq: "yearly", priority: 0.4 },
    creationOfAdam: { fr: "/la-creation-d-adam", en: "/creation-of-adam", index: true, changefreq: "yearly", priority: 0.4 },
    greatWave: { fr: "/la-grande-vague", en: "/the-great-wave", index: true, changefreq: "yearly", priority: 0.4 },
    monaLisa: { fr: "/la-joconde", en: "/mona-lisa", index: true, changefreq: "yearly", priority: 0.4 },
    lab: { fr: "/lab", en: "/lab", index: true, changefreq: "weekly", priority: 0.8 },
    preview: { fr: "/preview", en: "/preview", index: false }
  },
  children: {
    services: {
      slugs: [
        "built-application",
        "rework-application",
        "ai-integration",
        "infrastructure",
        "data-analyse",
        "security-audit",
        "optimisation",
        "seo-branding"
      ],
      index: true,
      changefreq: "monthly",
      priority: 0.85
    }
  }
};

// src/lib/site-routes.mjs
function normalizePath(p) {
  const trimmed = p.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}
function localize(data, key, locale) {
  const route = data.routes[key];
  if (!data.prefixed.includes(locale)) return route[locale];
  return route.en === "/" ? `/${locale}` : `/${locale}${route.en}`;
}
function alternates(data, key, slug) {
  const path = (locale) => localize(data, key, locale) + (slug ? `/${slug}` : "");
  const shared = path("en") === path("fr");
  return [
    ...data.locales.filter((l) => !(l === "en" && shared)).map((l) => ({ hreflang: l, path: path(l) })),
    { hreflang: "x-default", path: path("fr") }
  ];
}

// src/lib/routes.ts
var LOCALES = site_routes_default.locales;
var PREFIXED = site_routes_default.prefixed;
var OG_LOCALE = site_routes_default.og;
var keys = Object.keys(site_routes_default.routes);
var children = site_routes_default.children;
var routes = Object.fromEntries(
  keys.map((key) => [key, Object.fromEntries(LOCALES.map((l) => [l, localize(site_routes_default, key, l)]))])
);
var toLocale = (lang) => {
  const code = lang?.slice(0, 2);
  return LOCALES.includes(code) ? code : "fr";
};
var getLocalizedPath = (lang, key) => routes[key][toLocale(lang)];
var getLocalizedChildPath = (lang, key, slug) => `${getLocalizedPath(lang, key)}/${slug}`;
var findRoute = (path, bases) => {
  for (const key of keys) for (const base of bases(key)) if (base === path) return { key, base };
  for (const key of keys) for (const base of bases(key)) {
    const slug = path.startsWith(`${base}/`) ? path.slice(base.length + 1) : "";
    if (children[key]?.slugs.includes(slug)) return { key, base, slug };
  }
  return null;
};
var matchRoute = (pathname) => {
  const p = normalizePath(pathname);
  const seg = p.split("/")[1];
  if (PREFIXED.includes(seg)) {
    const found2 = findRoute(p.slice(seg.length + 1) || "/", (key) => [site_routes_default.routes[key].en]);
    return found2 && { key: found2.key, locale: seg, slug: found2.slug };
  }
  const found = findRoute(p, (key) => [site_routes_default.routes[key].fr, site_routes_default.routes[key].en]);
  if (!found) return null;
  const { fr, en } = site_routes_default.routes[found.key];
  return { key: found.key, locale: fr === en ? null : found.base === fr ? "fr" : "en", slug: found.slug };
};
var langFromPath = (pathname) => {
  const seg = normalizePath(pathname).split("/")[1];
  return PREFIXED.includes(seg) ? seg : matchRoute(pathname)?.locale ?? null;
};
var pathFor = (m, l) => routes[m.key][l] + (m.slug ? `/${m.slug}` : "");
var alternatesFor = (m) => alternates(site_routes_default, m.key, m.slug);
var isIndexed = (m) => m.slug ? children[m.key]?.index ?? false : site_routes_default.routes[m.key].index;
export {
  LOCALES,
  OG_LOCALE,
  PREFIXED,
  alternatesFor,
  getLocalizedChildPath,
  getLocalizedPath,
  isIndexed,
  langFromPath,
  matchRoute,
  pathFor,
  routes,
  toLocale
};

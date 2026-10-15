import { matchRoute, langFromPath, pathFor, getLocalizedPath, getLocalizedChildPath, routes } from "./routes.bundle.mjs"
for (const p of ["/de/products","/de","/contact","/produits/","/it/services/data-analyse","/de/xyz","/","/about","/lab","/de/lab","/services/seo-branding","/es/"])
  console.log(p, JSON.stringify(matchRoute(p)), langFromPath(p))
console.log(pathFor({key:"products",locale:"de"},"fr"), getLocalizedPath("en-US","about"), getLocalizedPath("de","home"), getLocalizedPath(undefined,"products"), getLocalizedChildPath("it","services","x"), JSON.stringify(routes.about))

import { matchRoute as m, langFromPath as l, getLocalizedPath as g, getLocalizedChildPath as c, pathFor } from "./routes.mjs"
const J = x => JSON.stringify(x)
for (const p of ["/de/products","/de","/contact","/produits/","/it/services/data-analyse","/de/xyz","/","/about","/lab","/de/lab","/DE/products","/de/","/de/services","/services","/es/services/inconnu","/de/a-propos"]) console.log(p, J(m(p)), l(p))
console.log(g("en-US","about"), g(undefined,"products"), g("de-AT","products"), g("pt","products"), c("it","services","x"))

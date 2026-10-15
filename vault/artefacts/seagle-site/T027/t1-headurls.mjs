// DoD 2 : URLs fr/en de HEAD servies, langue identique, 0 redirection
import { launch, open, state, summ } from "./lib.mjs"
const R = { home:["/","/"], services:["/services","/services"], products:["/produits","/products"], about:["/a-propos","/about"], contact:["/contact","/contact"], booking:["/rendez-vous","/book"], cgu:["/cgu","/terms"], career:["/carrieres","/careers"], kora:["/solutions/kora","/solutions/kora"], securePass:["/secure-pass","/secure-pass"], agentx:["/agentx","/agentx"], aisio:["/global-seo","/global-seo"], leefEditor:["/leef-editor","/leef-editor"], starryNight:["/nuit-etoilee","/starry-night"], creationOfAdam:["/la-creation-d-adam","/creation-of-adam"], greatWave:["/la-grande-vague","/the-great-wave"], monaLisa:["/la-joconde","/mona-lisa"] }
const slugs = ["built-application","rework-application","ai-integration","infrastructure","data-analyse","security-audit","optimisation","seo-branding"]
const urls = []
for (const [k,[fr,en]] of Object.entries(R)) { if (fr===en) urls.push([fr,null]); else { urls.push([fr,"fr"]); urls.push([en,"en"]) } }
for (const s of slugs) urls.push([`/services/${s}`, null])
const b = await launch(); let ko = 0, n = 0
for (const nav of ["fr-FR","en-US"]) for (const [u, ul] of urls) {
  const ctx = await b.newContext({ locale: nav }); const { page, navs, errs } = await open(ctx, u)
  const s = summ(await state(page)); n++
  const expUrl = u === "/services" ? "/services/built-application" : u
  const expLang = ul ?? nav.slice(0,2)
  const ok = s.url === expUrl && s.lang === expLang && s.tlang === expLang && errs.length === 0
  if (!ok) { ko++; console.log("KO", nav, u, JSON.stringify(s), navs, errs) }
  await ctx.close()
}
console.log(`headurls ${n} checked, KO ${ko}`); await b.close()

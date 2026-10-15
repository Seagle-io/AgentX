import { launch, open } from "./lib.mjs"
const b = await launch()
for (const u of ["/nuit-etoilee","/de/starry-night","/de","/it/mona-lisa","/la-joconde"]) {
  const ctx = await b.newContext({ viewport:{width:1440,height:900}, locale:"fr-FR" }); const { page } = await open(ctx, u)
  console.log(u, await page.evaluate(()=>[document.querySelector("header")?.className.slice(0,140), document.querySelector("header")?.getAttribute("data-theme"), document.querySelector("header [data-theme]")?.getAttribute("data-theme")].join(" | ")))
  await ctx.close() }
await b.close()

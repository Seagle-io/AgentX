import { launch, open, B } from "./lib.mjs"
const b = await launch()
for (const u of ["/de/services/inconnu", "/services/inconnu", "/it/services/xyz"]) {
  const ctx = await b.newContext({ locale: "fr-FR" }); const { page } = await open(ctx, u)
  console.log(u, JSON.stringify(await page.evaluate(() => ({ title: document.title, lang: document.documentElement.lang, main: (document.querySelector("main") || document.body).innerText.replace(/\s+/g, " ").slice(0, 200) }))))
  await ctx.close()
}
await b.close()

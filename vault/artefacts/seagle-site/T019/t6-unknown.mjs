import { launch, open } from "./lib.mjs"
const b = await launch()
for (const u of ["/de/services/inconnu","/services/inconnu"]) {
  const ctx = await b.newContext({ viewport:{width:1440,height:900}, locale:"fr-FR" })
  const { page } = await open(ctx, u)
  console.log(u, JSON.stringify(await page.evaluate(()=>({ main: document.querySelector("main")?.innerText, title: document.title, body: document.body.innerText.slice(0,600) }))))
  await page.screenshot({ path: `unknown${u.replace(/\//g,"_")}.png` })
  await ctx.close()
}
await b.close()

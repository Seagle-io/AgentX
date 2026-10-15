/**
 * Suite e2e : toutes les pages du sitemap, puis les parcours contact et
 * rendez-vous. L'API est toujours simulée : ni vrai serveur, ni mail envoyé.
 *
 * Usage : npm run build && npm run preview, puis npm run test:e2e
 * BASE=http://localhost:4173 et SITEMAP=dist/sitemap.xml par défaut.
 */

import { readFileSync } from "fs"
import { chromium } from "playwright"

const BASE = process.env.BASE ?? "http://localhost:4173"
const SITEMAP = process.env.SITEMAP ?? "dist/sitemap.xml"
const ORIGIN = new URL(BASE).origin
const WORKERS = 4

const t0 = Date.now()
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] })

/** Page neuve, thème sombre et français ; toute l'API coupée sauf mocks du test. */
const open = async () => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await ctx.addInitScript(() => {
    localStorage.setItem("seagle-theme", "dark")
    localStorage.setItem("i18nextLng", "fr")
  })
  await ctx.route("**/api/**", r => r.abort())
  return ctx.newPage()
}

/** Chargement sans attendre les animations. */
const visit = async (page, path) => {
  await page.goto(BASE + path, { waitUntil: "load" })
  await page.waitForTimeout(1000)
}

const json = (status, body) => r => r.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) })

// ─── Crawl ────────────────────────────────────────────────────────────────────

const crawl = async path => {
  const page = await open()
  const errs = []
  page.on("pageerror", e => errs.push(`pageerror ${e.message.slice(0, 120)}`))
  page.on("response", r => r.status() >= 400 && new URL(r.url()).origin === ORIGIN && errs.push(`${r.status()} ${r.url()}`))
  await visit(page, path)
  if (!(await page.locator("h1").count())) errs.push("h1 absent")
  if (!(await page.title()).trim()) errs.push("<title> vide")
  // Posé après le rendu, tardif quand le thread principal est chargé (canvas) : 2 à 5 s.
  const canonical = await page.locator('link[rel="canonical"]').first().getAttribute("href", { timeout: 8000 }).catch(() => null)
  if (!canonical?.startsWith("https://seagle.io")) errs.push(`canonical ${canonical}`)
  await page.context().close()
  if (errs.length) throw new Error(errs.join(" · "))
}

// ─── Contact ──────────────────────────────────────────────────────────────────

const sendContact = async mock => {
  const page = await open()
  await page.route("**/api/contact", mock)
  await visit(page, "/contact")
  await page.fill('input[name="name"]', "Test E2E")
  await page.fill('input[name="email"]', "e2e@example.com")
  await page.fill('input[name="subject"]', "Sujet")
  await page.fill('textarea[name="message"]', "Message de test")
  await page.click('form button[type="submit"]')
  return page
}

const contactOk = async () => {
  const page = await sendContact(json(200, { ok: true }))
  await page.locator("form").waitFor({ state: "detached", timeout: 5000 })
  const title = await page.locator("main h2, h2").first().textContent()
  await page.context().close()
  if (!title?.trim() || title.includes("Contact.")) throw new Error(`succès : ${title}`)
}

const contactDown = async () => {
  const page = await sendContact(r => r.abort("internetdisconnected"))
  await page.locator('a[href^="mailto:contact@seagle.io?subject="]').waitFor({ state: "visible", timeout: 5000 })
  await page.context().close()
}

// ─── Rendez-vous ──────────────────────────────────────────────────────────────

const book = async mock => {
  const page = await open()
  const d = new Date(Date.now() + 2 * 86_400_000)
  d.setUTCHours(9, 0, 0, 0)
  const slot = d.toISOString()
  await page.route("**/api/booking/slots*", json(200, { timezone: "Europe/Paris", minutes: 30, slots: [slot] }))
  await page.route("**/api/booking", mock)
  await visit(page, "/rendez-vous")
  // Même libellé que le bouton de créneau, dans le fuseau du navigateur.
  const label = await page.evaluate(iso => new Intl.DateTimeFormat("fr", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso)), slot)
  await page.getByRole("button", { name: label, exact: true }).click({ timeout: 5000 })
  await page.fill('form input[autocomplete="name"]', "Test E2E")
  await page.fill('form input[type="email"]', "e2e@example.com")
  await page.click('form button[type="submit"]')
  return { page, slot }
}

const bookingOk = async () => {
  const { page } = await book(r => {
    const { type, start } = r.request().postDataJSON()
    const end = new Date(new Date(start).getTime() + 30 * 60_000).toISOString()
    return json(200, { ok: true, booking: { id: "e2e", type, start, end } })(r)
  })
  await page.locator('a[download="rendez-vous-seagle.ics"]').waitFor({ state: "visible", timeout: 5000 })
  await page.context().close()
}

const bookingTaken = async () => {
  const { page } = await book(json(409, { error: "Ce créneau vient d'être réservé." }))
  const msg = page.locator("p.text-red-500")
  await msg.waitFor({ state: "visible", timeout: 5000 })
  const text = (await msg.textContent()) ?? ""
  await page.context().close()
  if (!text.trim() || /Failed to fetch|Booking\.form|vient d'être réservé/.test(text)) throw new Error(`409 : ${text}`)
}

// ─── Exécution ────────────────────────────────────────────────────────────────

const paths = [...readFileSync(SITEMAP, "utf-8").matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => new URL(m[1]).pathname)
const tests = [
  ...paths.map(p => [`page ${p}`, () => crawl(p)]),
  ["contact → 200 : succès", contactOk],
  ["contact → réseau coupé : mail de secours", contactDown],
  ["rdv → 200 : confirmation", bookingOk],
  ["rdv → 409 : message traduit", bookingTaken],
]

let failed = 0
const queue = [...tests]
await Promise.all(Array.from({ length: WORKERS }, async () => {
  for (let next; (next = queue.shift());) {
    const [name, run] = next
    try {
      await run()
      console.log(`✓ ${name}`)
    } catch (e) {
      failed++
      console.log(`✗ ${name} — ${e.message.split("\n")[0]}`)
    }
  }
}))
await browser.close()

console.log(`\n${tests.length - failed}/${tests.length} OK en ${((Date.now() - t0) / 1000).toFixed(1)} s`)
if (failed) process.exit(1)

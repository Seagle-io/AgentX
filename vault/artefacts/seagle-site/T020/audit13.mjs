import { chromium } from "/home/jdrac/Documents/Workspace/seagle-website/node_modules/playwright/index.mjs"
const BASE = process.env.BASE ?? "http://localhost:4408"
const PAGES = ['/', '/solutions/kora', '/secure-pass', '/agentx', '/leef-editor', '/global-seo', '/produits', '/services/ai-integration', '/services/infrastructure', '/services/seo-branding', '/a-propos', '/contact', '/carrieres', '/rendez-vous', '/book']
const only = process.argv[2] // optionnel: section
const out = {}
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] })
const mk = async (theme, extra = {}) => {
  const c = await b.newContext({ viewport: { width: 1440, height: 900 }, ...extra })
  await c.addInitScript(t => { localStorage.setItem("seagle-theme", t); localStorage.setItem("i18nextLng", "fr") }, theme)
  return c
}
const settle = async p => { await p.waitForLoadState("networkidle").catch(() => {}); for (let y = 0; y < 6000; y += 1000) { await p.evaluate(y => window.scrollTo(0, y), y); await p.waitForTimeout(80) } await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(500) }

// ---- helpers injectés
const DOM = () => {
  const desc = e => { if (!e || !e.tagName) return "∅"; const c = (e.className && e.className.baseVal === undefined ? String(e.className) : "").trim().split(/\s+/).slice(0, 4).join("."); return e.tagName.toLowerCase() + (e.id ? "#" + e.id : "") + (c ? "." + c : "") + ((e.getAttribute("aria-label") || e.innerText || "").trim().slice(0, 30) ? ` "${(e.getAttribute("aria-label") || e.innerText || "").trim().slice(0, 30).replace(/\n/g, " ")}"` : "") }
  window.__desc = desc
}

// ---- 1. structure + noms + alt + formulaires
if (!only || only === "struct") {
  const c = await mk("dark"); const p = await c.newPage(); out.struct = {}
  for (const u of PAGES) {
    await p.goto(BASE + u); await settle(p)
    out.struct[u] = await p.evaluate(() => {
      const d = e => (e.tagName.toLowerCase() + (e.id ? "#" + e.id : "") + "." + String(e.className?.baseVal ?? e.className).trim().split(/\s+/).slice(0, 3).join(".") + ` "${(e.innerText || "").trim().slice(0, 25).replace(/\n/g, " ")}"`)
      const name = e => (e.getAttribute("aria-label") || e.getAttribute("aria-labelledby") && document.getElementById(e.getAttribute("aria-labelledby"))?.innerText || e.innerText || e.getAttribute("title") || e.querySelector("img[alt]:not([alt=''])")?.alt || e.querySelector("svg title")?.textContent || "").trim()
      const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== "hidden" }
      return {
        lang: document.documentElement.lang, main: document.querySelectorAll("main").length, nav: document.querySelectorAll("nav").length, h1: document.querySelectorAll("h1").length,
        skip: !![...document.querySelectorAll("a[href^='#']")].find(a => /contenu|content|main/i.test(a.innerText + a.getAttribute("aria-label"))),
        imgNoAlt: [...document.images].filter(i => !i.hasAttribute("alt")).map(i => i.src.slice(-50)),
        imgEmptyAlt: [...document.images].filter(i => i.getAttribute("alt") === "").length,
        noName: [...document.querySelectorAll("a[href],button,[role=button],input:not([type=hidden]),select,textarea")].filter(e => vis(e) && !name(e) && !(e.labels && e.labels.length) && !e.placeholder).map(d),
        canvasNoLabel: [...document.querySelectorAll("canvas")].filter(c => !c.getAttribute("aria-label") && c.getAttribute("aria-hidden") !== "true" && c.getAttribute("role") !== "img").length,
        canvasTotal: document.querySelectorAll("canvas").length,
        fields: [...document.querySelectorAll("input:not([type=hidden]),textarea,select")].map(e => ({ d: d(e), type: e.type, labels: e.labels?.length ?? 0, aria: e.getAttribute("aria-label") || null, ph: e.placeholder || null, hidden: e.getAttribute("aria-hidden") })),
        live: document.querySelectorAll("[aria-live],[role=alert],[role=status]").length,
      }
    })
  }
  await c.close()
}

// ---- 2. contrastes
if (!only || only === "contrast") {
  out.contrast = {}
  for (const theme of ["light", "dark"]) {
    const c = await mk(theme); const p = await c.newPage()
    for (const u of PAGES) {
      await p.goto(BASE + u); await settle(p)
      out.contrast[theme + " " + u] = await p.evaluate(() => {
        const parse = s => { const m = s.match(/rgba?\(([^)]+)\)/) ; if (m) { const a = m[1].split(/[ ,\/]+/).map(Number); return { r: a[0], g: a[1], b: a[2], a: a[3] ?? 1 } } const m2 = s.match(/color\(srgb ([^)]+)\)/); if (m2) { const a = m2[1].split(/[ \/]+/).map(Number); return { r: a[0] * 255, g: a[1] * 255, b: a[2] * 255, a: a[3] ?? 1 } } return null }
        const over = (f, bg) => ({ r: f.r * f.a + bg.r * (1 - f.a), g: f.g * f.a + bg.g * (1 - f.a), b: f.b * f.a + bg.b * (1 - f.a), a: 1 })
        const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b) }
        const bgOf = el => { const stack = []; let e = el; let img = false; while (e) { const cs = getComputedStyle(e); if (cs.backgroundImage !== "none") img = true; const c = parse(cs.backgroundColor); if (c && c.a > 0) { stack.push(c); if (c.a === 1) break } e = e.parentElement } let base = { r: 255, g: 255, b: 255, a: 1 }; const body = parse(getComputedStyle(document.body).backgroundColor); if (!stack.length || stack[stack.length - 1].a < 1) { base = body && body.a > 0 ? body : base } for (let i = stack.length - 1; i >= 0; i--) base = stack[i].a === 1 && i === stack.length - 1 ? stack[i] : over(stack[i], base); return { c: base, img } }
        const res = {}; const seen = new Set()
        const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
        let n; while ((n = w.nextNode())) {
          const t = n.textContent.trim(); if (t.length < 2) continue; const el = n.parentElement; if (!el || ["SCRIPT", "STYLE", "NOSCRIPT"].includes(el.tagName)) continue
          const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue
          const cs = getComputedStyle(el); if (cs.visibility === "hidden" || cs.display === "none") continue
          let op = 1, e2 = el; while (e2) { op *= parseFloat(getComputedStyle(e2).opacity); e2 = e2.parentElement } if (op < 0.05) continue
          const fg0 = parse(cs.color); if (!fg0) continue
          const { c: bg, img } = bgOf(el); const fg = over({ ...fg0, a: fg0.a * op }, bg)
          const L1 = lum(fg), L2 = lum(bg); const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)
          const px = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight) >= 700; const large = px >= 24 || (px >= 18.66 && bold)
          const need = large ? 3 : 4.5
          if (ratio < need) {
            const cls = String(el.className?.baseVal ?? el.className).trim().split(/\s+/).filter(x => /text-|opacity|label|muted|th-/.test(x)).slice(0, 4).join(" ")
            const key = el.tagName + "|" + cls + "|" + cs.color + "|" + (bg.r | 0) + "," + (bg.g | 0) + "," + (bg.b | 0)
            if (!res[key]) res[key] = { sel: el.tagName.toLowerCase() + (cls ? "." + cls.replace(/ /g, ".") : ""), fg: cs.color, op: +op.toFixed(2), bg: `rgb(${bg.r | 0},${bg.g | 0},${bg.b | 0})`, ratio: +ratio.toFixed(2), px, need, img, canvasAncestor: !!el.closest("[class*=ascii],canvas,pre"), asciiAnc: !!el.closest("canvas,[data-ascii],pre"), n: 0, ex: t.slice(0, 30) }
            res[key].n++
          }
        }
        return Object.values(res).sort((a, b) => a.ratio - b.ratio)
      })
    }
    await c.close()
  }
}

// ---- 3. reduced-motion
if (!only || only === "motion") {
  out.motion = {}
  const c = await mk("dark", { reducedMotion: "reduce" }); const p = await c.newPage()
  for (const u of PAGES) {
    await p.goto(BASE + u); await settle(p)
    const snap = () => p.evaluate(() => [...document.querySelectorAll("canvas")].map(cv => { try { const r = cv.getBoundingClientRect(); let h = 0; if (cv.width && cv.height) { const t = document.createElement("canvas"); t.width = 64; t.height = 64; const x = t.getContext("2d"); x.drawImage(cv, 0, 0, 64, 64); const d = x.getImageData(0, 0, 64, 64).data; for (let i = 0; i < d.length; i += 4) h = (h * 31 + d[i] + d[i + 1] * 3 + d[i + 2] * 7) | 0 } return { cls: String(cv.className).trim().split(/\s+/).slice(0, 3).join("."), par: cv.parentElement?.className?.toString().slice(0, 40), w: cv.width, h: Math.round(r.height), hash: h } } catch (e) { return { err: e.message.slice(0, 40) } } }))
    const a = await snap(); await p.waitForTimeout(1000); const bb = await snap()
    const dom = await p.evaluate(() => {
      const css = new Set(); document.querySelectorAll("*").forEach(e => { const cs = getComputedStyle(e); if (cs.animationName !== "none" && parseFloat(cs.animationDuration) > 0.01) css.add(cs.animationName + " " + cs.animationDuration + " " + cs.animationIterationCount + " @" + e.tagName.toLowerCase() + "." + String(e.className?.baseVal ?? e.className).trim().split(/\s+/).slice(0, 3).join(".")) })
      const dyn = [...document.querySelectorAll("pre,[data-ascii]")].map(e => e.textContent.length)
      return { css: [...css].slice(0, 12), videos: [...document.querySelectorAll("video")].map(v => ({ paused: v.paused, auto: v.autoplay, loop: v.loop, src: v.currentSrc.slice(-30) })), marquee: !!document.querySelector("[class*=marquee]") }
    })
    // texte animé: comparer innerText de main à 1s
    const t1 = await p.evaluate(() => document.querySelector("main")?.innerText.length); await p.waitForTimeout(1000); const t2 = await p.evaluate(() => document.querySelector("main")?.innerText.length)
    out.motion[u] = { canvasChanged: a.map((x, i) => ({ ...x, changed: x.hash !== bb[i]?.hash })).filter(x => x.changed), canvasTotal: a.length, ...dom, textLenChange: t1 !== t2 }
  }
  await c.close()
}

// ---- 4. clavier + focus
if (!only || only === "kbd") {
  const c = await mk("dark"); const p = await c.newPage(); out.kbd = {}
  await p.goto(BASE + "/"); await settle(p)
  const info = () => p.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return null; const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); const cls = String(e.className?.baseVal ?? e.className).trim().split(/\s+/).slice(0, 3).join("."); return { d: e.tagName.toLowerCase() + (e.id ? "#" + e.id : "") + (cls ? "." + cls : "") + ` "${(e.getAttribute("aria-label") || e.innerText || e.getAttribute("href") || "").trim().slice(0, 25).replace(/\n/g, " ")}"`, ol: cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0, olc: cs.outlineStyle + " " + cs.outlineWidth, bs: cs.boxShadow !== "none", fvis: e.matches(":focus-visible"), y: Math.round(r.top + scrollY), w: r.width, hidden: r.width === 0 } })
  const seq = []; let trap = null
  for (let i = 0; i < 200; i++) { await p.keyboard.press("Tab"); const x = await info(); if (!x) { seq.push({ d: "BODY" }); continue } if (seq.length && seq.at(-1).d === x.d && i > 2) { trap = x.d; break } seq.push(x) }
  out.kbd.count = seq.length; out.kbd.trap = trap; out.kbd.last = seq.slice(-3).map(s => s.d)
  out.kbd.noFocusStyle = [...new Set(seq.filter(s => s.d !== "BODY" && !s.ol && !s.bs).map(s => s.d))]
  out.kbd.hiddenFocus = seq.filter(s => s.hidden).map(s => s.d)
  out.kbd.seq = seq.map(s => s.d).slice(0, 80)
  // Entrée/Espace/Échap sur contrôles
  await p.goto(BASE + "/"); await settle(p); out.kbd.ctl = {}
  const tryCtl = async (name, sel, fn) => { try { const el = p.locator(sel).first(); if (!(await el.count())) { out.kbd.ctl[name] = "∅ introuvable"; return } await fn(el) } catch (e) { out.kbd.ctl[name] = "KO " + e.message.slice(0, 80) } }
  await tryCtl("theme", "button[aria-label='Toggle theme']:visible", async el => { await el.focus(); const t0 = await p.evaluate(() => document.documentElement.className + document.documentElement.dataset.theme); await p.keyboard.press("Enter"); await p.waitForTimeout(1000); const t1 = await p.evaluate(() => document.documentElement.className + document.documentElement.dataset.theme); out.kbd.ctl.theme = t0 !== t1 ? "OK Entrée" : "KO inchangé"; await p.keyboard.press("Space"); await p.waitForTimeout(1000) })
  await tryCtl("langue", "button[aria-expanded]:visible", async el => { await el.focus(); await p.keyboard.press("Enter"); await p.waitForTimeout(300); const open = await el.getAttribute("aria-expanded"); const items = await p.evaluate(() => [...document.querySelectorAll("button")].filter(b => /^(Français|English|Español|Deutsch)/i.test(b.innerText.trim())).length); await p.keyboard.press("Tab"); const inMenu = await p.evaluate(() => /Fran|Engl|Espa|Deut/i.test(document.activeElement.innerText)); await p.keyboard.press("Escape"); await p.waitForTimeout(300); const closed = await el.getAttribute("aria-expanded"); out.kbd.ctl.langue = `ouvre=${open} items=${items} tab→item=${inMenu} échap→${closed}` })
  await p.setViewportSize({ width: 1440, height: 900 })
  // nav / sous-menus (mega-menu)
  const navBtns = await p.evaluate(() => [...document.querySelectorAll("header nav button, header nav a")].map(e => (e.innerText || e.getAttribute("aria-label") || "").trim().slice(0, 25) + (e.getAttribute("aria-haspopup") ? " [haspopup]" : "") + (e.getAttribute("aria-expanded") !== null ? " [expanded]" : "")))
  out.kbd.navItems = navBtns
  // hover-only submenu test
  const menuTrig = p.locator("header nav >> text=/Solutions|Services|Produits/i").first()
  if (await menuTrig.count()) {
    await menuTrig.focus(); const before = await p.evaluate(() => document.querySelectorAll("header a").length); await p.keyboard.press("Enter"); await p.waitForTimeout(400); const afterEnter = await p.evaluate(() => document.querySelectorAll("a[href]").length)
    const vis = await p.evaluate(() => [...document.querySelectorAll("a[href^='/solutions'],a[href^='/services'],a[href='/secure-pass']")].filter(a => { const r = a.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(a).visibility !== "hidden" && getComputedStyle(a).opacity !== "0" && r.top < 400 }).length)
    await p.keyboard.press("Tab"); const f = await info(); await p.keyboard.press("Escape"); await p.waitForTimeout(300)
    const vis2 = await p.evaluate(() => [...document.querySelectorAll("a[href^='/solutions'],a[href^='/services']")].filter(a => { const r = a.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(a).opacity !== "0" && r.top < 400 && r.top > 0 }).length)
    out.kbd.ctl.megaMenu = { trigger: await menuTrig.innerText(), expandedAttr: await menuTrig.getAttribute("aria-expanded"), linksVisibleAfterEnter: vis, tabNext: f?.d, linksVisibleAfterEsc: vis2 }
  }
  // menu mobile
  await p.setViewportSize({ width: 390, height: 800 }); await p.waitForTimeout(500)
  await tryCtl("menuMobile", "button[aria-label='Toggle menu']:visible", async el => { await el.focus(); await p.keyboard.press("Enter"); await p.waitForTimeout(500); const n = await p.evaluate(() => [...document.querySelectorAll("a[href]")].filter(a => { const r = a.getBoundingClientRect(); return r.width > 0 && r.top >= 0 && r.top < 800 }).length); const exp = await el.getAttribute("aria-expanded"); await p.keyboard.press("Escape"); await p.waitForTimeout(500); const n2 = await p.evaluate(() => [...document.querySelectorAll("a[href]")].filter(a => { const r = a.getBoundingClientRect(); return r.width > 0 && r.top >= 0 && r.top < 800 }).length); out.kbd.ctl.menuMobile = { ouvre_liens: n, aria_expanded: exp, après_échap: n2 } })
  await p.setViewportSize({ width: 1440, height: 900 })
  // chat
  await p.goto(BASE + "/"); await settle(p)
  const chatBtn = await p.evaluate(() => [...document.querySelectorAll("button")].filter(b => /chat|assistant|bot|message/i.test((b.getAttribute("aria-label") || "") + b.className + b.innerText)).map(b => b.getAttribute("aria-label") || b.innerText.slice(0, 20)))
  out.kbd.ctl.chatCandidates = chatBtn
  out.kbd.ctl.chatInSeq = seq.filter(s => /chat|assist|message/i.test(s.d)).map(s => s.d)
  // couverture tab: éléments focusables visibles non atteints
  const all = await p.evaluate(() => [...document.querySelectorAll("a[href],button,input,textarea,select,[tabindex]")].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && e.tabIndex >= 0 && getComputedStyle(e).visibility !== "hidden" }).length)
  out.kbd.focusablesVisibles = all
  // éléments cliquables non focusables
  out.kbd.clickNotFocusable = await p.evaluate(() => [...document.querySelectorAll("div[onclick],span[onclick],[role=button]:not(button)")].filter(e => e.tabIndex < 0).map(e => e.tagName + "." + String(e.className).slice(0, 30)))
  const cursorPtr = await p.evaluate(() => [...document.querySelectorAll("div,span,li,svg,img")].filter(e => getComputedStyle(e).cursor === "pointer" && e.tabIndex < 0 && !e.closest("a,button,[role=button]")).slice(0, 15).map(e => e.tagName.toLowerCase() + "." + String(e.className?.baseVal ?? e.className).trim().split(/\s+/).slice(0, 3).join(".")))
  out.kbd.cursorPointerNoFocus = cursorPtr
  // focus sur autres pages: contrôles sans style
  out.kbd.perPage = {}
  for (const u of PAGES.slice(1)) {
    await p.goto(BASE + u); await settle(p); const s2 = []
    for (let i = 0; i < 120; i++) { await p.keyboard.press("Tab"); const x = await info(); if (!x) continue; if (s2.length && s2.at(-1).d === x.d) break; s2.push(x) }
    out.kbd.perPage[u] = { n: s2.length, noStyle: [...new Set(s2.filter(s => !s.ol && !s.bs).map(s => s.d))].slice(0, 8) }
  }
  await c.close()
}

// ---- 5. formulaires: erreurs annoncées
if (!only || only === "forms") {
  const c = await mk("dark"); const p = await c.newPage(); out.forms = {}
  for (const u of ["/contact", "/rendez-vous"]) {
    await p.goto(BASE + u); await settle(p)
    out.forms[u] = await p.evaluate(() => ({ live: [...document.querySelectorAll("[aria-live],[role=alert],[role=status]")].map(e => e.tagName + " " + (e.getAttribute("role") || "") + " " + (e.getAttribute("aria-live") || "")), formNoValidate: document.querySelector("form")?.noValidate, required: [...document.querySelectorAll("[required]")].map(e => e.name || e.type), ariaInvalid: document.querySelectorAll("[aria-invalid]").length, ariaDescribedby: document.querySelectorAll("[aria-describedby]").length, labelsOnFields: [...document.querySelectorAll("input:not([type=hidden]),textarea")].map(e => ({ n: e.name || e.type, labels: e.labels.length, labelText: [...e.labels].map(l => l.innerText.slice(0, 25)).join("|"), aria: e.getAttribute("aria-label"), ph: !!e.placeholder, ariaHidden: e.getAttribute("aria-hidden") })) }))
  }
  // soumission vide /contact
  await p.goto(BASE + "/contact"); await settle(p)
  const btn = p.locator("form button[type=submit]").first(); if (await btn.count()) { await btn.click(); await p.waitForTimeout(800); out.forms.contactSubmitEmpty = await p.evaluate(() => ({ active: document.activeElement?.name || document.activeElement?.tagName, liveAfter: document.querySelectorAll("[aria-live],[role=alert],[role=status]").length, invalidNative: [...document.querySelectorAll(":invalid")].length })) }
  await c.close()
}

// ---- 6. extra: tab continu sur "/", booking, canvas par capture, drawer mobile, mega-menu hover vs focus
if (!only || only === "extra") {
  out.extra = {}
  const c = await mk("dark"); const p = await c.newPage()
  await p.goto(BASE + "/"); await settle(p)
  const seq = []
  for (let i = 0; i < 160; i++) { await p.keyboard.press("Tab"); const d = await p.evaluate(() => { const e = document.activeElement; return e === document.body ? "BODY" : e.tagName.toLowerCase() + ` "${(e.getAttribute("aria-label") || e.innerText || e.getAttribute("href") || "").trim().slice(0, 22).replace(/\n/g, " ")}"` }); seq.push(d) }
  out.extra.homeTab = { distinct: new Set(seq).size, first20: seq.slice(0, 20), tail: seq.slice(-14), bodyCount: seq.filter(x => x === "BODY").length, footerReached: seq.some(x => /mentions|confidentialit|linkedin|github|©/i.test(x)) }
  // mega-menu hover vs focus
  await p.goto(BASE + "/"); await settle(p)
  const trig = p.locator("header nav button", { hasText: "Services" }).first()
  const linksVis = () => p.evaluate(() => [...document.querySelectorAll("a[href*='services/']")].filter(a => { const r = a.getBoundingClientRect(); return r.width > 0 && r.top > 40 && r.top < 500 && getComputedStyle(a).opacity !== "0" }).length)
  await trig.focus(); await p.keyboard.press("Enter"); await p.waitForTimeout(500); const kb = await linksVis()
  await p.keyboard.press("ArrowDown"); await p.keyboard.press("Space"); await p.waitForTimeout(500); const kb2 = await linksVis()
  await p.mouse.move(0, 500); await p.waitForTimeout(300); await trig.hover(); await p.waitForTimeout(600); const hv = await linksVis()
  out.extra.megaMenu = { clavierEntrée: kb, clavierEspace: kb2, souris: hv }
  // drawer mobile: liens focusables quand fermé
  await p.setViewportSize({ width: 390, height: 800 }); await p.goto(BASE + "/"); await settle(p)
  out.extra.drawerFermé = await p.evaluate(() => { const l = [...document.querySelectorAll("a[href]")].filter(a => a.closest(".lg\\:hidden") && a.tabIndex >= 0); return l.map(a => { const r = a.getBoundingClientRect(); return { t: a.innerText.trim().slice(0, 15), h: Math.round(r.height), clipped: !!a.closest(".overflow-hidden") } }).slice(0, 12) })
  const burger = p.locator("button[aria-label='Toggle menu']"); await burger.focus(); await p.keyboard.press("Enter"); await p.waitForTimeout(600)
  const open = await p.evaluate(() => { const d = [...document.querySelectorAll(".max-h-96")][0]; return d ? Math.round(d.getBoundingClientRect().height) : -1 })
  await p.keyboard.press("Escape"); await p.waitForTimeout(600)
  const afterEsc = await p.evaluate(() => { const d = [...document.querySelectorAll(".max-h-96")][0]; return d ? Math.round(d.getBoundingClientRect().height) : -1 })
  out.extra.drawer = { hauteurOuvert: open, hauteurAprèsÉchap: afterEsc, ariaExpanded: await burger.getAttribute("aria-expanded"), ariaControls: await burger.getAttribute("aria-controls") }
  // booking: sélectionner un créneau
  await p.setViewportSize({ width: 1440, height: 900 }); await p.goto(BASE + "/rendez-vous"); await settle(p); await p.waitForTimeout(1500)
  out.extra.booking = await p.evaluate(() => ({ calBtns: [...document.querySelectorAll("button")].filter(b => /^\d{1,2}$/.test(b.innerText.trim())).length, calEnabled: [...document.querySelectorAll("button")].filter(b => /^\d{1,2}$/.test(b.innerText.trim()) && !b.disabled).length, ariaPressed: document.querySelectorAll("button[aria-pressed]").length, ariaLabelDay: [...document.querySelectorAll("button")].filter(b => /^\d{1,2}$/.test(b.innerText.trim())).slice(0, 2).map(b => b.getAttribute("aria-label")), grid: document.querySelectorAll("[role=grid],[role=gridcell],table").length, slotsTxt: document.body.innerText.includes("indisponible") || document.body.innerText.includes("unavailable") }))
  const day = p.locator("button:not([disabled])", { hasText: /^\d{1,2}$/ }); const nd = await day.count()
  if (nd) { await day.first().click(); await p.waitForTimeout(500); const slotBtn = p.locator("button", { hasText: /^\d{1,2}[:h]\d{2}$/ }).first(); out.extra.booking.slotBtns = await p.locator("button", { hasText: /^\d{1,2}[:h]\d{2}$/ }).count(); if (await slotBtn.count()) { await slotBtn.click(); await p.waitForTimeout(900); out.extra.bookingForm = await p.evaluate(() => ({ fields: [...document.querySelectorAll("form input:not([type=hidden]),form textarea")].map(e => ({ type: e.type, labels: e.labels.length, aria: e.getAttribute("aria-label"), ph: e.placeholder, hid: e.getAttribute("aria-hidden"), ol: getComputedStyle(e).outlineStyle })), live: document.querySelectorAll("[aria-live],[role=alert]").length })) } } else out.extra.booking.note = "∅ aucun jour dispo (API créneaux)"
  // canvas: capture élément à 1s, contrôle sans reduced-motion
  await c.close()
  for (const rm of ["no-preference", "reduce"]) {
    const c2 = await mk("dark", { reducedMotion: rm }); const p2 = await c2.newPage(); out.extra["canvas_" + rm] = {}
    for (const u of PAGES) {
      await p2.goto(BASE + u); await settle(p2)
      const cvs = p2.locator("canvas"); const n = await cvs.count(); const res = []
      for (let i = 0; i < n; i++) { const cv = cvs.nth(i); const bb = await cv.boundingBox(); if (!bb || bb.width < 20) continue; await cv.scrollIntoViewIfNeeded().catch(() => {}); await p2.waitForTimeout(2500); const a = await cv.screenshot().catch(() => null); await p2.waitForTimeout(1000); const b2 = await cv.screenshot().catch(() => null); await p2.waitForTimeout(1000); const b3 = await cv.screenshot().catch(() => null); const cls = await cv.evaluate(e => String(e.className).trim().split(/\s+/).slice(0, 2).join(".") + " <" + (e.parentElement?.tagName.toLowerCase()) + "." + String(e.parentElement?.className).trim().split(/\s+/).slice(0, 2).join(".") + ">"); res.push({ cv: cls, animé: a && b2 && b3 ? (!a.equals(b2) && !b2.equals(b3)) : null, diffs: a && b2 && b3 ? [!a.equals(b2), !b2.equals(b3)] : null }) }
      out.extra["canvas_" + rm][u] = res
    }
    await c2.close()
  }
}
await b.close()
console.log(JSON.stringify(out, null, 1))

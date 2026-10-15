// alpha minimal (pas 0.01) d'une encre rgba(ink,a) pour ratio >= 4.5 sur chaque fond
const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
const over = (ink, a, bg) => ink.map((v, i) => v * a + bg[i] * (1 - a))
const minA = (ink, bg, t = 4.5) => { for (let a = 0; a <= 1.0001; a += 0.01) if (ratio(over(ink, a, bg), bg) >= t) return +a.toFixed(2) }
const sets = { dark: { ink: [255, 255, 255], bgs: { page: [0, 0, 0], surface: [10, 10, 10], "surface-hi": [19, 19, 19], "29": [29, 29, 29] }, cur: { md: .55, lo: .35, faint: .20 } },
  light: { ink: [10, 10, 15], bgs: { page: [243, 242, 238], surface: [251, 250, 247], "surface-hi": [233, 231, 225], "231": [231, 230, 226], "237": [237, 236, 232] }, cur: { md: .55, lo: .38, faint: .22 } } }
const tryA = process.argv[2] ? JSON.parse(process.argv[2]) : null
for (const [th, s] of Object.entries(sets)) {
  for (const [bn, bg] of Object.entries(s.bgs)) console.log(th, bn, "minA=" + minA(s.ink, bg), Object.entries({ ...s.cur, ...(tryA?.[th] ?? {}) }).map(([k, a]) => `${k}${a}:${ratio(over(s.ink, a, bg), bg).toFixed(2)}`).join(" "))
}
// accents ServiceDetail, assombris en clair (même teinte HSL) jusqu'à 4.5 sur page clair
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))
const toHsl = ([r, g, b]) => { r /= 255; g /= 255; b /= 255; const M = Math.max(r, g, b), m = Math.min(r, g, b), l = (M + m) / 2; let h = 0, s = 0; if (M !== m) { const d = M - m; s = l > .5 ? d / (2 - M - m) : d / (M + m); h = M === r ? (g - b) / d + (g < b ? 6 : 0) : M === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60 } return [h, s, l] }
const fromHsl = ([h, s, l]) => { const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return [f(0), f(8), f(4)].map(v => Math.round(v * 255)) }
for (const c of ["#2ca9bc", "#8b5cf6", "#34d399", "#ef4444", "#f97316", "#eab308", "#0ea5e9", "#ec4899"]) {
  const [h, s, l0] = toHsl(hex(c)); let l = l0, rgb = hex(c)
  while (ratio(rgb, sets.light.bgs.page) < 4.6) { l -= 0.002; rgb = fromHsl([h, s, l]) }
  console.log(c, "→ l", l0.toFixed(3), "→", l.toFixed(3), "hex", "#" + rgb.map(v => v.toString(16).padStart(2, "0")).join(""), "page", ratio(rgb, sets.light.bgs.page).toFixed(2), "%", Math.round((1 - l / l0) * 100))
}

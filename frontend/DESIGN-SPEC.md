# EduNav `frontend/` — Design Contract

Source of truth: `EduNav Landing 3 (offline).html` (a React/Babel design-tool export).
We rebuild it as **static HTML + CSS + vanilla JS** — no build step, no framework,
deployable by copying the folder. Every rule below is binding.

---

## 0. Non-negotiables

1. **No inline `style=""` attributes.** The source used them everywhere; we do not.
   Everything goes through classes defined in `assets/css/style.css`.
2. **Never use `all: unset`** — it clears `box-sizing` and causes overflow bugs.
   Reset properties explicitly.
3. **Fully responsive.** The source had *zero* media queries and broke below 1265px.
   Every page must have `document.scrollWidth <= viewport` at 1440 / 1280 / 1024 / 768 / 560 / 390 px.
4. **Every `<img>`/decorative SVG** gets `alt=""` (decorative) or a real `alt`.
   Decorative SVG also gets `aria-hidden="true"`.
5. **Every page** has a real `<title>`, `<meta name="description">`, `lang="az"`.
6. **No external assets** except the two Google Fonts. No CDN JS, no photos.
7. Asset links carry a cache-buster: `assets/css/style.css?v=1`, `assets/js/app.js?v=1`.

---

## 1. Type

```
Lexend  — headings, numbers, prices, logo.   weights 400 500 600 700
Manrope — body, labels, buttons, meta.        weights 400 500 600 700 800
```

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

Scale (all headings Lexend 700, `letter-spacing:-.026em`, `text-wrap:pretty`):

| token | size | use |
|---|---|---|
| `--fs-h1` | `clamp(30px, 4.6vw, 62px)` / 1.14 | hero only |
| `--fs-h2` | `clamp(23px, 2.4vw, 28px)` / 1.15 | section titles |
| `--fs-h3` | `clamp(20px, 2vw, 31px)` / 1.14 | hero cards, banner titles |
| `--fs-h4` | `17px` / 1.3, `-.019em` | card titles |
| body | Manrope 400 `14.5px`/1.55 | paragraphs |
| lead | Manrope 400 `clamp(16px,1.4vw,20.5px)`/1.6 | hero sub |
| meta | Manrope 500 `12.5px`/1 | `Nəsimi · 2008-dən` |
| label | Manrope 700 `11px`/1, `letter-spacing:.16em`, uppercase | kickers |

---

## 2. Colour tokens — put these in `:root`, use nothing else

```css
:root{
  /* ink */
  --ink:#0F1420;  --ink-2:#1B2230;  --ink-3:#243049;
  --text:#5B6577; --text-2:#6B7484; --muted:#8A93A5; --muted-2:#9AA3B2; --muted-3:#A6AEBB;
  /* brand */
  --brand:#FFC629; --brand-deep:#EDB412; --brand-dark:#B0891F; --brand-word:#F0AE00;
  --brand-soft:#FFF9E8;
  /* kindergarten accent (purple) */
  --kg:#C8C6F4; --kg-2:#D5D3F8; --kg-3:#EDE4F6; --kg-ink:#1A1840; --kg-text:#453E86;
  /* surfaces & lines */
  --bg:#fff; --surface:#F8F9FC; --surface-2:#F4F6F9; --surface-3:#F1F3F7;
  --line:#E9ECF1; --line-2:#E6EAF0; --line-3:#E4E8EE; --line-4:#EEF1F5; --line-5:#E2E6EC;
  /* status */
  --ok:#2E7D4F; --ok-bg:#E8F5EE;
  --warn:#B0891F; --warn-bg:#FFF4D6;
  --danger:#C2415C; --danger-bg:#FDE8EC;
  --info:#2C63C4; --info-bg:#E4EEFF;
  /* radii */
  --r-pill:999px; --r-xl:22px; --r-lg:20px; --r-md:16px; --r-sm:12px; --r-xs:10px; --r-xxs:9px;
  /* shadow */
  --sh-1:0 6px 16px -8px rgba(15,20,32,.5);
  --sh-2:0 24px 48px -26px rgba(15,20,32,.35);
  --sh-3:0 34px 62px -34px rgba(15,20,32,.46);
  --sh-4:0 26px 56px -34px rgba(15,20,32,.6);
  /* motion */
  --ease:cubic-bezier(.22,1,.36,1);
  /* layout */
  --container:1200px; --pad:32px; --header-h:78px;
}
```

`prefers-reduced-motion: reduce` must disable all animation/transition.

---

## 3. Layout

- `.container { max-width:var(--container); margin:0 auto; padding:0 var(--pad) }`
- Section rhythm: `.section { padding:64px 0 0 }`, `.section--tight { padding:48px 0 0 }`
- Last section before footer: `padding-bottom:72px`

**Breakpoints** (max-width):

| bp | change |
|---|---|
| 1024px | `--pad:24px`; 4-col grids → 3-col; hero → single column |
| 768px  | 3-col → 2-col; desktop nav hidden, burger + drawer shown; hero cards stack |
| 560px  | 2-col → 1-col; `--pad:18px`; hero h1 min 30px; hide non-essential meta |

Grid helper: `.grid-4 / .grid-3 / .grid-2` using
`repeat(auto-fit, minmax(min(100%, 250px), 1fr))` where a fluid grid is acceptable,
otherwise explicit `repeat(N, minmax(0,1fr))` + the breakpoint steps above.

---

## 4. Components (exact class names — do not invent alternatives)

### Header `.site-header`
Sticky, `top:0`, `z-index:60`, `background:rgba(255,255,255,.94)`, `backdrop-filter:blur(12px)`,
`border-bottom:1px solid var(--line-4)`, inner height `78px`.
- `.logo` → `.logo-mark` (34px, `--r-xxs`+2, `--brand` bg, inline SVG cap) + `.logo-text` (Lexend 700 21px)
- `.nav` → `.nav-link` (Manrope 500 15px, `--text`… padding `9px 13px`, radius `--r-xxs`, hover `background:var(--surface-2)`); active page gets `.is-active` (color `--ink`, `background:var(--surface-2)`)
- `.header-actions` → `.btn-ghost` (Daxil ol) + `.btn-brand` (Müəssisə əlavə et)
- `.burger` (hidden ≥769px) toggles `.drawer` (full-screen slide-in, contains nav + both CTAs)

Nav items and their targets — **identical on every page**:
`Məktəblər mekteblar.html` · `Bağçalar bagcalar.html` · `Vakansiyalar vakansiyalar.html` ·
`Xəbərlər xeberler.html` · `Elanlar elanlar.html` · `Bloglar bloglar.html` ·
`Şəbəkələr sebekeler.html` · `Haqqımızda haqqimizda.html`

### Buttons
| class | look |
|---|---|
| `.btn-brand` | `--brand` bg, `--ink` text, Manrope 700 14px, `12px 20px`, `--r-xs`, hover `--brand-deep` |
| `.btn-ghost` | transparent, `1px solid var(--line-5)`, hover `border-color:var(--ink)` |
| `.btn-dark` | `--ink` bg, white text |
| `.btn-pill` | `--brand` bg, `15px 22px`, `--r-pill` — hero/CTA only |
| `.btn-sm` | `9px 14px`, 13px |
Every button has a visible `:focus-visible` ring: `outline:2px solid var(--ink); outline-offset:2px`.

### Section head `.sec-head`
`.sec-head-row` (flex, space-between) → `h2.sec-title` + `a.sec-all` ("Hamısına bax" + arrow, Manrope 600 14px, `--text`, hover `--ink`).
Below: `p.sec-sub` (Manrope 400 14.5px, `--text-2`, `max-width:620px`). Margin-bottom 24px.

### Institution card `.ecard` (schools **and** kindergartens)
```
.ecard                border:1px solid var(--line); radius --r-md; overflow:hidden; column flex
  .ecard-media        height:188px; position:relative        ← gradient placeholder, NOT a photo
    .ecard-mono       centred monogram, Lexend 700 34px, 22% white
    .ecard-tag        top-left pill: --brand bg, Manrope 700 11.5px  (Premium / Yeni)
    .ecard-fav        top-right 34px circle, white .95, heart SVG   [data-compare-toggle]
  .ecard-body         padding:15px 16px 16px; flex:1
    .ecard-meta       "Nəsimi · 2008-dən"
    .ecard-title      h3, --fs-h4
    .ecard-desc       13px/1.55, --text
    .ecard-foot       margin-top:auto; padding-top:13px; border-top:1px solid var(--surface-3)
      .ecard-price    Lexend 700 17px + .ecard-per (Manrope 500 12px, --muted)
```
Hover: `translateY(-4px)` + `--sh-2`.

`.ecard-media` gradient variants — cycle `.g1 … .g6` by index:
```
g1 linear-gradient(140deg,#0F1420,#243049)   g2 linear-gradient(140deg,#D5D3F8,#EDE4F6)
g3 linear-gradient(140deg,#FFC629,#FFE9A3)   g4 linear-gradient(140deg,#2C63C4,#8FB4F2)
g5 linear-gradient(140deg,#2E7D4F,#A6D8BE)   g6 linear-gradient(140deg,#C2415C,#F3B6C2)
```
Kindergarten cards prefer g2/g3/g5/g6; schools prefer g1/g3/g4/g6.

### Other blocks
- `.searchbar` — white, `1px solid var(--line-3)`, `--r-xl`, `padding:14px 16px`, `--sh-3`; 46px `--brand` icon square (`--r-sm`+2), text input, `.btn-brand`. Under it `.search-pop` chips row. Above it a radial `--brand` glow (`.search-glow`, decorative).
- `.banner-dark` — `linear-gradient(112deg,#0F1420,#1A2130 48%,#243049)`, `--r-lg`, two decorative radial blobs, kicker + title (yellow accent word) + pill + text + `.btn-brand`.
- `.marquee` — partner strip, `@keyframes edu-marquee` translateX(-50% - 22px), duplicated list, `.marquee:hover{animation-play-state:paused}`.
- `.vac-row` — vacancy row: title / institution / location / salary / `.chip` / `.btn-ghost.btn-sm`.
- `.news-card`, `.blog-card`, `.ann-row` — list items, `1px solid var(--line)`, `--r-md`.
- `.faq-item` — `<details>`-free JS accordion, `.faq-q` button + `.faq-a`, `@keyframes edu-faq-in`.
- `.chip` — `--surface-2` bg, `--r-pill`, Manrope 600 13px. `.chip.is-on` → `--ink` bg, white.
- `.badge` — status pill; modifiers `.badge--ok .badge--warn .badge--danger .badge--info`.
- `.page-head` — inner-page hero: kicker + h1 + sub + `.crumbs`. Keep it **compact** (padding `40px 0 28px`), never a full-screen block.
- `.compare-bar` — fixed bottom bar, hidden state must use `opacity:0; visibility:hidden; pointer-events:none` (translateY alone is not enough).
- `.modal` — `[data-open="..."]` opens `.modal[data-modal="..."]`; backdrop `rgba(15,20,32,.55)`, panel `--r-lg`, max-width 560px, ESC + backdrop close, focus trap.
- `.dd` — custom dropdown (single + `.dd-multi`). **Opens upward** when inside `.searchbar`. Never `all:unset` on `.dd-option`; set `box-sizing:border-box`.
- `.footer` — `--ink` bg, 4 columns + newsletter, `© 2026 EduNav. Bütün hüquqlar qorunur.`
- `.ad-rail` — the source's monetisation element: two `position:fixed` rails, 244px wide,
  `top:88px`, at `calc(50% - 600px - 268px)` left / right. Each holds 3 `.ad-card`
  (kicker pill + title + text + link) that cross-fade every 5.2s.
  **Only visible at `min-width:1736px`** — `display:none` below, so they never crowd the page.
  They must stop above the footer: JS clamps `top` to `footerTop - height - 28`.
  Markup: `<aside class="ad-rail ad-rail--left" aria-label="Reklam">`. Homepage + catalogue
  + article pages only; never on admin, auth or form pages.

### Animations (keep the source's names)
`edu-word-in` · `edu-caret` · `edu-marquee` · `edu-blink` · `edu-faq-in`
Plus `[data-reveal]` → IntersectionObserver adds `.is-in` (opacity+translateY 14px, `--ease`, honour `data-reveal-delay` in ms).

---

## 5. Homepage section order (from Landing 3)

1. **Hero** — grid `1fr 1.12fr`. Left: h1 with rotating word
   (`gələcəyin → inkişafın → uğurun → peşəkarlığın`, `--brand-word`, blinking `--brand` caret) + lead.
   Right: **two cards** side by side, `.hero-card`, min-height 352px, `--r-xl`:
   - `.hero-card--school` → `--ink` gradient, `--brand` icon, kicker `1–11 sinif`, title `Məktəbləri kəşf et`, sub `Keyfiyyətli təhsil üçün doğru seçim`, `.btn-pill` `Kəşf et` → `mekteblar.html`
   - `.hero-card--kg` → purple gradient, `--kg-ink` icon, kicker `2–6 yaş`, title `Bağçaları kəşf et`, sub `Sevgi və qayğı ilə dolu bir başlanğıc`, dark pill → `bagcalar.html`
   **Add a third card** `.hero-card--job` (`--brand-soft` bg, `--ink` border, kicker `84 açıq elan`, title `Vakansiyalar`, → `vakansiyalar.html`); on ≥1025px it sits under the two as a wide card, below 768px it stacks.
2. Tərəfdaşlar (marquee, 8 logos)
3. Axtarış (`.searchbar` + `1 240 müəssisə · Populyar` chips)
4. Süni intellekt köməkçisi — 4-step wizard (`STEPS`) → 5 results (`MATCHES`)
5. Seçilmiş məktəblər (8 `.ecard`)
6. Promo banner (`.banner-dark`)
7. Seçilmiş bağçalar (8 `.ecard`)
8. Vakansiyalar (4 `.vac-row`)
9. Xəbərlər və elanlar (2 columns: 3 news + 3 announcements)
10. CTA
11. Bloglar (1 featured + 4 list)
12. FAQ (6 items) + support side panel
13. Footer

**No scroll-snap anywhere.** (v1 had it; it was rejected.)

---

## 6. Content — reuse verbatim from Landing 3

Schools: Zəka Beynəlxalq Məktəbi (Nəsimi, 2008, IB, 12 000 AZN/il, Premium) · Horizon School (Binəqədi, 2012, 8 500) ·
Atlas Kolleci (Yasamal, 2010, Cambridge, 9 800, Premium) · Alov Liseyi (Nərimanov, 2006, 6 900) ·
Prestige School (Sabunçu, 2018, 7 200) · Beynəlxalq Akademiya (Xətai, 2015, IB, 15 200, Premium) ·
STEM Liseyi (Sumqayıt, 2019, 5 500, Yeni) · Günəş Kolleci (Gəncə, 2011, 4 900)

Kindergartens: Xoşbəxt Uşaqlar (Yasamal, 2014, Montessori, 480 AZN/ay, Premium) · Gənc İstedad Bağçası (Binəqədi, 2016, 390) ·
Sevincim Kids (Xətai, 2013, 520, Premium) · Balaca Ulduzlar (Nəsimi, 2011, 450) · Fəxrimiz Kids (Sabunçu, 2017, 360) ·
Ağıllı Uşaqlar (Binəqədi, 2015, 410) · Bal Arı Bağçası (Sumqayıt, 2019, 320, Yeni) · Nur Uşaq Mərkəzi (Xətai, 2012, 380)

Vacancies: Riyaziyyat müəllimi / Zəka / Yasamal / 1200–1600 AZN / Tam ştat ·
İngilis dili müəllimi / Horizon / Binəqədi / 1000–1500 · İbtidai sinif müəllimi / Atlas / Nərimanov / 900–1200 ·
Psixoloq / Alov Liseyi / Nəsimi / 800–1200 / Yarım ştat

News (12/8/5 iyul 2026), Announcements (11/10/9 iyul 2026), Blogs, the 6 FAQ Q&As,
`STEPS`, `MATCHES`, `HERO_WORDS`, `SEARCH_HINTS` — all in
`scratchpad/edunav3/component.js` and `scratchpad/edunav3/page.html`. **Copy the Azerbaijani text exactly.**
All person names use **Rasif Dünyamalı** where a founder/author is needed.

---

## 7. Files

### `frontend/` — public (26)
`index.html` `mekteblar.html` `bagcalar.html` `mekteb.html` `bagca.html` `muqayise.html`
`vakansiyalar.html` `vakansiya.html` `xeberler.html` `xeber.html` `elanlar.html` `elan.html`
`bloglar.html` `blog.html` `sebekeler.html` `sebeke.html` `haqqimizda.html` `elaqe.html`
`suallar.html` `daxil-ol.html` `qeydiyyat.html` `muessise-elave-et.html` `kabinet.html`
`qaydalar.html` `gizlilik.html` `404.html`

### `frontend/admin/` (14)
`daxil-ol.html` `index.html` `muessiseler.html` `muessise-detal.html` `tesdiq.html`
`vakansiyalar.html` `muracietler.html` `xeberler.html` `elanlar.html` `bloglar.html`
`reyler.html` `istifadeciler.html` `statistika.html` `ayarlar.html`

### assets
`assets/css/style.css` · `assets/css/admin.css` · `assets/js/app.js` · `assets/js/admin.js`
Page-specific CSS (only if truly needed): `assets/css/pages/<page>.css`, classes prefixed with the page name.

---

## 8. Admin panel rules

Layout `.adm` = fixed sidebar 248px (`--ink` bg) + `.adm-main`.
- `.adm-side` → logo, `.adm-nav-group` label, `.adm-nav-link` (`.is-active` → `--brand` left bar + `rgba(255,255,255,.06)` bg), user block pinned bottom.
- `.adm-top` → sticky bar: page title, search, notification bell, avatar.
- `.adm-stat` cards (4-up): label, big Lexend number, delta `.badge--ok/--danger`, sparkline SVG.
- `.adm-table` → sticky head, `--surface` head bg, row hover `--surface-2`, `.adm-cell-actions` icon buttons, checkbox column, sortable headers, `.adm-pager`.
- `.adm-filters` → chips + `.dd` dropdowns + search input.
- Forms: `.field`, `.field-label`, `.input`, `.textarea`, `.dd`, `.switch`, `.field-hint`, `.field-error`.
- `.adm-empty` empty state, `.adm-drawer` right-side detail panel.
- Below 1024px the sidebar collapses to icons; below 768px it becomes an off-canvas drawer and tables scroll inside `.table-wrap{overflow-x:auto}`.
- Admin pages are **demo/static**: no real auth, no backend. Data is hardcoded or in `assets/js/admin.js` arrays.

---

## 9. JS behaviour (`app.js`)

`localStorage` keys: `edunav_compare` (max 4) · `edunav_fav` · `edunav_ctx` · `edunav_survey`.
Modules: rotating hero word · rotating search hint · marquee pause · reveal observer ·
custom dropdown · compare bar · favourites · AI wizard · FAQ accordion · modals ·
mobile drawer · catalogue filter+sort (client-side, reads `?tip=`, `?rayon=` query params) ·
form validation (inline `.field-error`, never `alert()`).

Everything degrades gracefully with JS disabled — content stays readable.

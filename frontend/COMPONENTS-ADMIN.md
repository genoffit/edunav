# EduNav — Admin markup reference

The exact HTML every selector in `assets/css/admin.css` expects, plus every hook
`assets/js/admin.js` binds to. `admin.css` loads **after** `style.css` and reuses its
tokens and its `.field` / `.input` / `.textarea` / `.switch` / `.btn-*` / `.badge` /
`.chip` / `.dd` components — this file only documents the `.adm-*` layer and how the
shared components plug into it.

Live proof: **`admin/_gallery.html`** renders every block below with real content.
Frozen shell blocks: **`PARTIALS.md` 8a / 8b / 8c / 8d** — copy them, never retype them.

Binding rules for every admin page: no `style=""`, no `all: unset`, Azerbaijani copy
from `CONTENT.md` (§ *Admin panel strings*), decorative SVG carries
`aria-hidden="true" focusable="false"`, real inline stroke icons (24×24 viewBox,
`stroke-width="2"`, `stroke-linecap="round"`) — never an icon font, never emoji.

---

## 0. Page skeleton

`.adm` is a class on **`<body>`**, not on a wrapper. It owns the local custom properties
(`--adm-side-w: 248px`, `--adm-rail-w: 72px`, `--adm-top-h: 68px`, `--adm-gap: 20px`,
`--adm-pad: 26px`, `--adm-on-dark`, `--adm-hair`, `--adm-hover`). Anything outside
`<body class="adm">` gets none of them.

```
body.adm
├─ a.skip-link[href="#adm-content"]          ← 8a
├─ div.adm-side-backdrop[data-adm-side-close] ← 8b, the off-canvas scrim
├─ aside.adm-side#adm-side                    ← 8b, position:fixed, 248px
│   ├─ div.adm-side-head  →  a.logo (+ .logo-mark > svg, .logo-text)
│   │                        button.adm-side-close   (display:none until ≤768px)
│   ├─ nav.adm-nav        →  p.adm-nav-group  +  a.adm-nav-link …  (flat sequence)
│   └─ div.adm-user       →  span.adm-avatar
│                            span.adm-user-text > .adm-user-name + .adm-user-role
├─ div.adm-main                               ← 8c opens
│   ├─ header.adm-top     →  button.adm-burger, h1.adm-top-title,
│   │                        form.adm-top-search, div.adm-top-actions
│   └─ main.adm-content#adm-content           ← YOUR PAGE CONTENT GOES HERE
│        …                                    ← 8d closes </main></div>
├─ aside.adm-drawer[data-adm-drawer-id]       ← optional, authored, position:fixed
├─ div.adm-drawer-scrim                       ← created by admin.js, do not author
└─ div.adm-toasts                             ← created by admin.js, do not author
```

`.adm-side` is `position:fixed`; `.adm-main` clears it with `margin-left:var(--adm-side-w)`.
Never nest `.adm-main` inside `.adm-side`, and never give `.adm-content` an extra
`.container` — `.adm-content` already pads with `var(--adm-pad)`.

**Path depth.** Admin files live in `frontend/admin/`, so every asset link is
`../assets/css/style.css?v=1`, `../assets/css/admin.css?v=1`, `../assets/js/app.js?v=1`,
`../assets/js/admin.js?v=1`. Sibling page links are bare (`muessiseler.html`).
**Verified: PARTIALS.md blocks 8a–8d already use the correct `../` prefixes** — 8a for the
two stylesheets, 8d for the two scripts, 8b/8c link siblings with no prefix, which is right.
No fix was needed.

### 0.1 Sidebar states

| state | where the class lands | who sets it |
|---|---|---|
| active nav item | `.adm-nav-link.is-active` + `aria-current="page"` | authored **and** re-derived by `AdmSidebar.markActive()` from the filename |
| off-canvas open (≤768px) | `.is-side-open` on **`.adm`** (`<body>`) | `AdmSidebar`, via `[data-adm-side-open]` |
| desktop collapse | `.is-side-collapsed` on **`.adm`** | `AdmSidebar`, via `[data-adm-side-toggle]` |

`.adm-nav-link.is-active` grows a 22px `--brand` bar through `::before` — the anchor must
stay `position:relative` (it is, by rule) and must not be wrapped in an extra element.

> **Trap.** `admin.css` has **no `.is-side-collapsed` rule**. The desktop collapse button is
> a JS-only no-op today. Do **not** ship `[data-adm-side-toggle]` on a page; PARTIALS 8b/8c
> correctly ship only `[data-adm-side-open]` and `[data-adm-side-close]`.

> **Trap.** `.logo-text` in `style.css` hard-codes `color:var(--ink)`; `admin.css` re-points it
> to `#fff` **only** under `.adm-side .logo-text`. A logo placed anywhere else on a dark admin
> surface will be invisible.

### 0.2 Top bar

```html
<header class="adm-top">
  <button class="adm-burger" type="button" data-adm-side-open …>
    <span class="burger-line" aria-hidden="true"></span> ×3
  </button>
  <h1 class="adm-top-title">Müəssisələr</h1>
  <form class="adm-top-search" role="search">
    <label class="field-label sr-only" for="adm-search">Axtarış</label>
    <span class="adm-top-search-icon" aria-hidden="true"><svg …></span>
    <input class="input adm-top-input" id="adm-search" type="search" …>
  </form>
  <div class="adm-top-actions">
    <button class="adm-bell" …><svg …><span class="adm-bell-dot" aria-hidden="true"></span></button>
    <span class="adm-avatar" aria-hidden="true">RD</span>
  </div>
</header>
```

- `.adm-burger` is **three `<span class="burger-line">`**, not one SVG — the rule is
  `flex-direction:column; gap:3px` and `.adm-burger .burger-line{width:16px}`.
- `.adm-top-title` is a **flex column**: it may hold one optional
  `<span class="adm-top-sub">` second line (styled, hidden ≤768px). PARTIALS 8c ships it
  without one; if you add it, keep it inside the `<h1>`.
- `.adm-top-input` carries **both** `.input` and `.adm-top-input`; the `.adm-top .adm-top-input`
  rules are written at higher specificity so they win. The 36px left padding assumes
  `.adm-top-search-icon` is `position:absolute` — keep the icon **before** the input.
- `.adm-bell-dot` is absolutely positioned inside `.adm-bell`; `.adm-bell` must stay `relative`.
- `.adm-avatar` is a `<span>` (initials) or an `<a>`; an `<img>` inside is clipped to the circle.

---

## 1. Grids

```html
<div class="adm-grid">…4 columns…</div>
<div class="adm-grid adm-grid--3">…3 columns…</div>
<div class="adm-grid adm-grid--2">…2 columns…</div>
<div class="adm-grid adm-grid--wide">…1.7fr | 1fr…</div>
<div class="adm-grid adm-grid--narrow">…1fr | 1.7fr…</div>
```

`.adm-grid` is the base and must always be present; `--2/--3/--wide/--narrow` are modifiers,
never standalone. Gap and bottom margin are `var(--adm-gap)`; the last `.adm-grid` on a page
drops its margin automatically. Steps: 4→2 at 1024px, all→2 at 768px, all→1 at 560px.

---

## 2. Stat card `.adm-stat`

```html
<article class="adm-stat">
  <div class="adm-stat-head">
    <span class="adm-stat-ico" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">…</svg>
    </span>
    <p class="adm-stat-label">Ümumi müəssisə</p>
  </div>
  <p class="adm-stat-value">1 240</p>
  <div class="adm-stat-foot">
    <span class="adm-stat-delta">
      <svg …>↑</svg> +4.2%
    </span>
    <span class="adm-stat-note">keçən aya nisbətən</span>
  </div>
  <div class="adm-spark-slot" data-adm-spark data-values="980,1010,1044,1098,1130,1186,1240"
       data-label="Son 7 ay: 980 → 1240"></div>
</article>
```

- `.adm-stat` is a **column flex**; `.adm-stat-foot` uses `margin-top:auto`, so cards in one
  row keep their deltas aligned only if the sparkline comes **after** the foot or is absent.
  In the gallery the sparkline is last, which pushes the foot up — that is the intended look.
- `.adm-stat-label` is the uppercase 11px kicker; `.adm-stat-value` is **Lexend 700**,
  `clamp(24px,2.2vw,30px)`. Do not put the number in a `<span>` inside another wrapper.
- Icon tint variants on `.adm-stat-ico`: `--info`, `--ok`, `--kg` (default is `--brand-soft`).
- Delta variants: bare `.adm-stat-delta` is green. Add `.badge--danger` (or
  `.adm-stat-delta--down`), `.badge--warn`, `.badge--info` for the other three. The combined
  selectors `.adm-stat-delta.badge--danger` etc. are written at 2-class specificity, so the
  order of the classes in the attribute does not matter.

### 2.1 Sparkline — two shapes

**A. JS-drawn (use this).** Any element with `data-adm-spark` is a *container*. `AdmCharts`
reads `data-values` (comma-separated numbers, ≥2 needed), wipes the container and injects
`<svg class="adm-spark is-up|is-down">` holding `path.adm-spark-area`, `path.adm-spark-line`
and `circle.adm-spark-dot`, all painted with `currentColor`. It redraws on resize and via
`ResizeObserver` on the container's **parent**.

| attribute | on | meaning |
|---|---|---|
| `data-adm-spark` | container | marks it for `AdmCharts` |
| `data-values` | container | `"980,1010,1044"` — required |
| `data-label` | container | `aria-label` of the generated svg; falls back to `Son N dövr: a → b` |
| `data-width` / `data-height` | container | fallback box when the container has no layout size |

Because the svg's class list is rewritten on every redraw, the **colour variant goes on the
container**: `class="adm-spark--info"` / `--ok` / `--danger` next to `data-adm-spark`.

**B. Hand-authored (no JS).** `<svg class="adm-spark adm-spark--ok">` with a
`<path class="adm-spark-fill">` for the area and a `<polyline>`/`<path>` for the line.
`.adm-spark path, .adm-spark polyline` already sets `fill:none; stroke:var(--brand-deep);
stroke-width:2; round caps`, and `.adm-spark-fill` re-adds the tinted fill.

Do not mix the two: `.adm-spark-fill` is shape B, `.adm-spark-area` is shape A.

---

## 3. Panel `.adm-panel`

```html
<section class="adm-panel">
  <div class="adm-panel-head">
    <h2 class="adm-panel-title">Son fəaliyyət</h2>
    <div class="adm-panel-actions">
      <a class="btn-ghost btn-sm" href="statistika.html">Hamısına bax</a>
    </div>
    <p class="adm-panel-sub">Son 24 saat ərzində panelde baş verənlər.</p>
  </div>
  <div class="adm-panel-body">…</div>
  <div class="adm-panel-foot">…</div>
</section>
```

- `.adm-panel-head` is `flex; flex-wrap:wrap`. `.adm-panel-title` carries `margin-right:auto`,
  so it pushes `.adm-panel-actions` right **without** a spacer div.
- `.adm-panel-actions` is `flex: 0 0 auto`, so it never shrinks. Keep it to **two** controls;
  a third one overflows the panel below ~440px and `.adm-panel`'s `overflow:hidden` clips it.
  More than two buttons belong in `.adm-panel-body` inside a `.chip-row`.
- `.adm-panel-sub` is `width:100%` with `margin-top:-4px` — it is a **flex sibling** of the
  title that wraps onto its own line. Putting it inside a wrapper div breaks the wrap.
- Body variants: `.adm-panel-body--flush` (padding 0 — use for a table or a `.adm-log` that
  should touch the edges) and `.adm-panel-body--tight` (12/14px).
- `.adm-panel` sets `overflow:hidden` so a table's corners stay rounded — which also **clips
  any `.dd-panel`** opened inside `.adm-panel-body`. A panel that holds a form with a `.dd`
  must add `.adm-panel--overflow` (`overflow:visible`). Table panels keep the clip.
  `.adm-filters` never clips, so filter dropdowns need nothing.
- Stacked panels get their gap from `.adm-panel + .adm-panel { margin-top: var(--adm-gap) }`.

---

## 4. Table `.adm-table` — full anatomy

### 4.1 The scope wrapper

`AdmTable` resolves everything it needs (search input, bulk toolbar, empty state, pager,
result count) inside one **scope** element, found by
`table.closest('[data-adm-table]') || table.closest('.adm-panel') || table.closest('.adm-card')`.

Wrap the filters bar **and** the panel in a single `[data-adm-table]` div so the filters
reach the table. Keep the page-level `.adm-toolbar` **outside** it — `AdmTable` claims the
first `.adm-toolbar` in scope as the bulk bar.

```html
<div class="adm-toolbar">…page title + Yeni əlavə et… (OUTSIDE the scope)</div>

<div data-adm-table data-page-size="5">
  <div class="adm-filters">…</div>

  <section class="adm-panel">
    <div class="adm-panel-head">…</div>
    <div class="adm-toolbar adm-toolbar--bulk" aria-hidden="true">…bulk bar…</div>
    <div class="table-wrap">
      <table class="adm-table">…</table>
    </div>
    <div class="adm-empty" hidden>…</div>
    <nav class="adm-pager" aria-label="Səhifələmə">…</nav>
  </section>
</div>
```

`data-page-size` may sit on the `<table>` or on the scope element; default `10`.

### 4.2 `.table-wrap`

`.adm-table` has `min-width:720px`, so it **must** be inside `.table-wrap`
(`overflow-x:auto`) or the page overflows horizontally below ~780px. `.table-wrap--tall`
adds `max-height:62vh; overflow-y:auto` and is what makes the sticky head useful.

### 4.3 Head, sorting, select-all

```html
<thead>
  <tr>
    <th class="adm-col-check" scope="col">
      <input class="adm-check" type="checkbox" data-adm-check-all aria-label="Hamısını seç">
    </th>
    <th scope="col" data-sort="text">
      <button class="adm-sort" type="button">
        Ad
        <span class="adm-sort-ico" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
            <path d="M12 19V5"/><path d="m5 12 7-7 7 7"/>
          </svg>
        </span>
      </button>
    </th>
    <th scope="col" data-sort="num">Baxış</th>
    <th scope="col" data-sort="date">Tarix</th>
    <th scope="col">Əməliyyat</th>
  </tr>
</thead>
```

- `thead th` is `position:sticky; top:0; z-index:2` with a `--surface` background. It is only
  sticky against `.table-wrap--tall`; against the page it sticks under `.adm-top`.
- `data-sort` values: `text` (default, `Intl.Collator('az')`), `num`, `date`
  (ISO, `dd.mm.yyyy`, or Azerbaijani `12 iyul 2026`). A cell may override its own sort key
  with `data-sort-value="…"` on the `<td>`. Unparsable cells always sink to the bottom.
- **`admin.js` adds `.is-sortable` and `aria-sort="none"` to every `th[data-sort]` itself** —
  do not author them. `th.is-sortable` zeroes the `th` padding because the padding moves onto
  `.adm-sort`, so a sortable `th` **must** contain the button, otherwise its text loses padding.
- If the `th` contains a `<button>`, the button is the click target and gets `type="button"`
  automatically. If it does not, `admin.js` falls back to making the `th` itself
  `tabindex="0"` + Enter/Space — usable, but the padding collapse above still applies, so
  always use the button.
- Sorted state is expressed as `th[aria-sort="ascending"|"descending"]`, which recolours
  `.adm-sort` and `.adm-sort-ico` and rotates the icon 180° for descending. `admin.js` also
  toggles `.is-sorted`/`.is-asc`/`.is-desc` on the `th` — **these have no CSS**, do not rely
  on them.
- `.adm-check` is a styled `appearance:none` checkbox with a `::after` tick; `:indeterminate`
  flattens the tick into a dash. `admin.js` drives `checked`, `indeterminate` and `disabled`
  on the select-all box from the rows **on the current page only**.

### 4.4 Body rows

```html
<tr data-status="aktiv" data-nov="Məktəb" data-rayon="Nəsimi" data-paket="Premium"
    data-adm-label="Zəka Beynəlxalq Məktəbi">
  <td class="adm-col-check">
    <input class="adm-check" type="checkbox" data-adm-check
           aria-label="Zəka Beynəlxalq Məktəbi sətrini seç">
  </td>
  <td>
    <div class="adm-cell-media">
      <span class="adm-thumb" aria-hidden="true">ZM</span>
      <span>
        <a class="adm-cell-main" href="muessise-detal.html" data-adm-cell="ad">Zəka Beynəlxalq Məktəbi</a>
        <span class="adm-cell-sub">Nəsimi · 2008-dən</span>
      </span>
    </div>
  </td>
  <td data-adm-cell="nov">Məktəb</td>
  <td><span class="badge badge--ok" data-adm-status>Aktiv</span></td>
  <td class="adm-cell-num" data-adm-cell="baxis">18 420</td>
  <td data-adm-cell="tarix">12 iyul 2026</td>
  <td>
    <div class="adm-cell-actions">
      <button class="adm-icobtn" type="button" data-adm-drawer="muessise" aria-label="Bax">…</button>
      <button class="adm-icobtn adm-icobtn--ok" type="button" data-adm-action="approve" aria-label="Təsdiqlə">…</button>
      <button class="adm-icobtn adm-icobtn--danger" type="button" data-adm-action="delete" aria-label="Sil">…</button>
    </div>
  </td>
</tr>
```

| piece | rule |
|---|---|
| `tr:hover` | `background:var(--surface-2)` — lands on the `<tr>`, not the `<td>` |
| `tr.is-selected` | `background:var(--brand-soft)`; set by `admin.js` whenever the row box is checked and the row is visible |
| `tr[hidden]` / `tr.is-hidden` | pagination + filtering; the `hidden` attribute does the hiding (`style.css` ships `[hidden]{display:none!important}`), `.is-hidden` is an unstyled hook |
| `.adm-cell-media` | flex row: `.adm-thumb` (38px monogram, dark gradient, may hold an `<img>`) + a text column |
| `.adm-cell-main` | Manrope 700 13.5px, `--ink`; as `a.adm-cell-main` it underlines on hover |
| `.adm-cell-sub` | 12px `--muted` second line, `display:block` — must be a **sibling** of `.adm-cell-main`, not nested inside it |
| `.adm-cell-num` | Lexend 600, `tabular-nums`, right-aligned — put it on the `<td>` |
| `.adm-cell-actions` | `justify-content:flex-end` flex; wrap the icon buttons in it, on the last `<td>` |
| `.adm-icobtn` | 32px transparent square, `svg` forced to 16px. Variants `--danger` / `--ok` only change the hover skin. Icon-only ⇒ **always** `aria-label` |
| status cell | a `.badge` + one of `.badge--ok / --warn / --danger`; `Arxiv` is the bare grey `.badge` |

Status vocabulary is fixed by `admin.js`:

| `data-status` | badge label | badge class |
|---|---|---|
| `aktiv` | Aktiv | `badge--ok` |
| `gozleyir` | Gözləyir | `badge--warn` |
| `redd` | Rədd edildi | `badge--danger` |
| `arxiv` | Arxiv | *(none)* |

`tfoot td` is styled (top border, `--surface`, bold `--ink`) for a totals row. Rows in
`tfoot` are ignored by sorting/pagination only if you mark them `data-adm-norow`.

### 4.5 Pager `.adm-pager` — two shapes

`admin.js` **replaces `.adm-pager`'s innerHTML** whenever more rows match than fit on a page,
and sets `hidden` when they all fit. Author the no-JS shape; expect the generated one.

*Authored (no-JS fallback, § 9 of admin.css):*

```html
<nav class="adm-pager" aria-label="Səhifələmə">
  <span class="adm-pager-info">1–5 / 8 nəticə</span>
  <div class="adm-pager-nav">
    <button class="adm-pager-btn" type="button" disabled>Əvvəlki</button>
    <button class="adm-pager-btn is-active" type="button">1</button>
    <button class="adm-pager-btn" type="button">2</button>
    <span class="adm-pager-gap" aria-hidden="true">…</span>
    <button class="adm-pager-btn" type="button">Sonrakı</button>
  </div>
</nav>
```

*Generated:* `.adm-pager-info` + `.adm-pager-btns` wrapping
`.adm-pager-btn[data-adm-page="prev"|"next"]`, `.adm-pager-num[data-adm-page="N"][.is-on]`
and `.adm-pager-gap`. Both wrappers and both active classes are styled — see § "CSS added".

---

## 5. Bulk-action toolbar `.adm-toolbar`

Two different jobs share the class.

**A. Page toolbar** — always visible, lives above the scope wrapper:

```html
<div class="adm-toolbar">
  <h2 class="adm-toolbar-title">Müəssisələr</h2>
  <span class="adm-toolbar-count">1 240 qeyd</span>
  <div class="adm-toolbar-actions">
    <a class="btn-ghost btn-sm" href="tesdiq.html">Təsdiq növbəsi</a>
    <a class="btn-brand btn-sm" href="muessise-detal.html">Yeni əlavə et</a>
  </div>
</div>
```

`.adm-toolbar-actions` already carries `margin-left:auto`; `.adm-toolbar-spacer` is the
alternative when you need the push on a different child.

**B. Bulk bar** — inside the scope, hidden until something is selected:

```html
<div class="adm-toolbar adm-toolbar--bulk" aria-hidden="true">
  <span class="adm-toolbar-count" data-adm-selected>0 seçildi</span>
  <div class="adm-toolbar-actions">
    <button class="btn-ghost btn-sm" type="button" data-adm-bulk="approve" disabled>Toplu təsdiq</button>
    <button class="btn-ghost btn-sm" type="button" data-adm-bulk="archive" disabled>Toplu arxiv</button>
    <button class="btn-ghost btn-sm" type="button" data-adm-clear-selection>Seçimi ləğv et</button>
  </div>
</div>
```

`admin.js` rewrites `[data-adm-selected]` to `"{N} seçildi"`, enables/disables every
`[data-adm-bulk]`, toggles `.is-on` and flips `aria-hidden`. Author the initial state as
`aria-hidden="true"` with the bulk buttons `disabled`.

`data-adm-bulk` values: `approve` · `reject` · `archive` · `restore` · `delete`.
`delete` removes the rows and raises an undo toast; the rest rewrite the status badge.

---

## 6. Filters `.adm-filters`

```html
<div class="adm-filters">
  <div class="adm-filters-row" data-adm-filter-group="status">
    <button class="chip is-on" type="button" data-adm-value="">Hamısı</button>
    <button class="chip" type="button" data-adm-value="aktiv">Aktiv</button>
    <button class="chip" type="button" data-adm-value="gozleyir">Gözləyir</button>
  </div>

  <span class="adm-filters-sep" aria-hidden="true"></span>

  <div class="dd" data-dd data-name="rayon" data-adm-filter="rayon"
       data-placeholder="Rayon" data-label="Rayon">
    <button class="dd-trigger" type="button">
      <span class="dd-value is-placeholder" data-placeholder="Rayon">Rayon</span>
      <svg class="dd-caret" …></svg>
    </button>
    <div class="dd-panel">
      <div class="dd-list">
        <button class="dd-option" type="button" data-value="Nəsimi"><span class="dd-label">Nəsimi</span></button>
        …
      </div>
    </div>
  </div>

  <label class="adm-filter-search">
    <span class="sr-only">Cədvəldə axtar</span>
    <svg …aria-hidden="true" focusable="false"></svg>
    <input class="adm-search" type="search" placeholder="Ad və ya rayon üzrə axtar" autocomplete="off">
  </label>

  <button class="adm-filters-reset" type="button" data-adm-filter-reset>Filtri sıfırla</button>
</div>
```

- `.adm-filters` is the bordered card; `.adm-filters-row` is an inner flex group (use it for
  a chip set); `.adm-filters-sep` is a 1px×24px hairline (hidden ≤768px);
  `.adm-filters-reset` carries `margin-left:auto`.
- `.adm-filters .dd { min-width:168px }` — the dropdown needs no extra width class.
  The `.dd-caret` inside `.dd-trigger` rotates 180° on `.dd.is-open`; the panel flips upward
  with `.dd-up` or when `app.js` measures no room and adds `.is-up`. **Never `all:unset` on
  `.dd-option`** — `style.css` resets it explicitly and keeps `box-sizing:border-box`.
- `.adm-filter-search` positions its `svg` absolutely at `left:12px`, so the icon must come
  **before** the input and the input keeps its `padding-left:36px`.

**How a filter matches a row.** Each group declares a *key*; each row declares
`data-<key>="value"` (comma-separated for multi-valued rows). Values are folded
Azerbaijani-insensitively (`ə→e`, `İ/ı→i`, `ö ü ş ç ğ`), so `data-rayon="Nəsimi"` is matched
by `data-value="Nəsimi"` and by typing `nesimi` in the search box. Within one group the
values are OR-ed; separate groups are AND-ed.

| control | hook | key comes from |
|---|---|---|
| chip group | `data-adm-filter-group="status"` on the wrapper, `data-adm-value` on each `.chip` | the group attribute |
| chip group, multi-select | add `data-adm-multi` to the wrapper | — |
| “all” chip | `data-adm-value=""` (empty) — clears the group | — |
| `.dd` dropdown | `data-adm-filter="rayon"` on the `.dd` (falls back to `data-name`) | the attribute |
| native `<select>` | `data-adm-filter="rayon"` | the attribute |
| free text | `input.adm-search` (or any `input` inside `.adm-search`) | searches the row's text plus `data-adm-search` |
| reset | `[data-adm-filter-reset]` — resets every group and the search inside the nearest scope | — |

Chips get `aria-pressed` managed for them; `.chip.is-on` is the visual on-state.

---

## 7. Empty state `.adm-empty`

```html
<div class="adm-empty" hidden>
  <span class="adm-empty-ico" aria-hidden="true"><svg …></span>
  <p class="adm-empty-title">Nəticə tapılmadı</p>
  <p class="adm-empty-text">Filtri dəyişib yenidən cəhd edin.</p>
  <div class="adm-empty-actions">
    <button class="btn-ghost btn-sm" type="button" data-adm-filter-reset>Filtri sıfırla</button>
  </div>
</div>
```

Author it with the `hidden` attribute; `admin.js` removes/re-adds it as the match count
crosses zero. It must be a **sibling of the table inside the scope**, not inside `.table-wrap`
(a 720px-wide min-width scroller would shove the centred empty state off screen).
Used standalone (no table), simply omit `hidden`.

---

## 8. Detail drawer `.adm-drawer`

```html
<aside class="adm-drawer" data-adm-drawer-id="muessise" aria-labelledby="drawer-muessise-title">
  <div class="adm-drawer-head">
    <div>
      <h2 class="adm-drawer-title" id="drawer-muessise-title" data-adm-field="ad">Müəssisə</h2>
      <span class="adm-drawer-sub" data-adm-field="rayon">—</span>
    </div>
    <button class="adm-drawer-close" type="button" data-adm-drawer-close aria-label="Bağla">
      <svg …></svg>
    </button>
  </div>
  <div class="adm-drawer-body">
    <dl class="adm-kv">
      <dt class="adm-kv-k">Növ</dt>      <dd class="adm-kv-v" data-adm-field="nov">—</dd>
      <dt class="adm-kv-k">Status</dt>   <dd class="adm-kv-v"><span class="badge" data-adm-field="status">—</span></dd>
    </dl>
  </div>
  <div class="adm-drawer-foot">
    <button class="btn-brand btn-sm" type="button" data-adm-action="save">Yadda saxla</button>
    <button class="btn-ghost btn-sm" type="button" data-adm-drawer-close>Bağla</button>
  </div>
</aside>
```

- Open state is `.adm-drawer.is-open` (transform + opacity + visibility + pointer-events —
  transform alone is not enough). `admin.js` also sets `role="dialog"`, `aria-modal`,
  `aria-hidden`, locks the body with `body.is-locked` and traps Tab. ESC and the generated
  `.adm-drawer-scrim` both close it.
- Trigger: **any** element with `data-adm-drawer="muessise"`, matched against
  `.adm-drawer[data-adm-drawer-id="muessise"]` (an `id` of the same name also works).
  Triggers are delegated from `document`, so paginated rows keep working.
- Close: `[data-adm-drawer-close]` or `[data-close]` anywhere inside the panel.
- **Filling.** On open, `admin.js` builds a data object from, in order: the trigger row's
  `dataset` (`data-rayon` → `rayon`), every `[data-adm-cell="key"]` inside that row (text
  content), then `data-adm-drawer-data='{"json":"…"}'` on the trigger. It then writes each
  `[data-adm-field="key"]` in the panel. Add `data-adm-field-attr="href"` to write an
  attribute instead of the text.
- A field that also has class `badge` is special-cased: the value is looked up in the status
  table and the node gets the right label + `badge--*` class. Leave `data-adm-status` **off**
  that node (or empty) so the row's `data-status` is used.
- `.adm-kv` is a `132px | 1fr` grid of `dt.adm-kv-k` / `dd.adm-kv-v`; it collapses to one
  column ≤768px. It works outside the drawer too (detail pages).
- Events: `adm:drawer:open` / `adm:drawer:close` bubble from the panel.

---

## 9. Tag `.adm-tag`

```html
<span class="adm-tag adm-tag--ok">Təsdiqlənib</span>
<span class="adm-tag adm-tag--kg">Bağça</span>
<span class="adm-tag adm-tag--plain">Baza</span>
```

Pill with a 6px `currentColor` dot injected by `::before`. Tints: `--ok --warn --danger
--info --brand --kg`. `.adm-tag--plain` removes the dot. An `<svg>` inside is forced to 11px
and sits **after** the dot. `.adm-tag` is a display/label element — for a *status* use
`.badge`, which is what `admin.js` rewrites.

---

## 10. Activity log `.adm-log`

```html
<ul class="adm-log">
  <li class="adm-log-item">
    <span class="adm-log-dot adm-log-dot--ok" aria-hidden="true"><svg …></span>
    <div class="adm-log-body">
      <p class="adm-log-text"><b>Zəka Beynəlxalq Məktəbi</b> profili təsdiqləndi.</p>
      <span class="adm-log-time">12 iyul 2026 · 14:20</span>
    </div>
  </li>
</ul>
```

`.adm-log` is a `<ul>` with the list marker removed; `.adm-log-item` is the `<li>`. First item
loses its top padding, last item loses its bottom border — so a log placed in
`.adm-panel-body` is flush at both ends by design. `.adm-log-dot` tints: `--ok --warn
--danger --info`. `.adm-log-text b` is the `--ink` highlight for the subject.

---

## 11. Tabs `.adm-tabs`

```html
<div class="adm-tabs">
  <a class="adm-tab is-active" href="muessise-detal.html" aria-current="page">Profil</a>
  <a class="adm-tab" href="reyler.html">Rəylər</a>
  <button class="adm-tab" type="button">Sənədlər</button>
</div>
```

Pill rail; `.is-active` is the dark chip. Works with anchors or buttons — no JS is bound to
it, so the active state is authored per page. Scrolls horizontally below 390px.

---

## 12. Forms in the admin shell

`.field` / `.field-label` / `.input` / `.textarea` / `.field-hint` / `.field-error` /
`.switch` / `.dd` all come from `style.css` unchanged. `admin.css` only adds:

```html
<form class="…" data-adm-demo data-adm-demo-msg="Ayarlar yadda saxlanıldı" novalidate>
  <div class="adm-form-grid">
    <div class="field">
      <label class="field-label" for="f-ad">Müəssisənin adı <span class="req">*</span></label>
      <input class="input" id="f-ad" name="ad" type="text" value="Zəka Beynəlxalq Məktəbi" required>
      <p class="field-error" data-error-for="f-ad" hidden>Adı yazın.</p>
    </div>
    <div class="field">…</div>
    <div class="field field--full">
      <label class="field-label" for="f-tesvir">Təsvir</label>
      <textarea class="textarea" id="f-tesvir" name="tesvir" rows="4"></textarea>
      <p class="field-hint">Kataloq kartında görünən 1–2 cümlə.</p>
    </div>
  </div>
  <div class="adm-form-actions">
    <button class="btn-brand" type="submit">Yadda saxla</button>
    <button class="btn-ghost" type="reset">İmtina</button>
  </div>
</form>
```

- `.adm-form-grid` is a 2-column grid (1 column ≤768px). Inside it, a full-width field is
  `.field--full` (**two dashes** — `style.css`'s `.field-full` is the `.form-grid` version and
  does nothing here). `.adm-form-grid .field { margin-top: 0 }` cancels the stacking rule.
- Outside the grid, consecutive fields are spaced by `.adm .field + .field { margin-top:14px }`
  — do not add your own margins.
- `.adm-form-actions` is the bordered action row at the bottom.
- Error display: add `.has-error` to the `.field` (or `.is-on` to the `.field-error`) and
  `.has-error` to the `.input`. The message element uses `hidden` when clean.
- Switch: `<label class="switch"><input type="checkbox" data-adm-switch="Bildirişlər">
  <span class="switch-track"></span><span class="switch-label">…</span></label>` — the
  visually-hidden `<input>` **must** be the immediate previous sibling of `.switch-track`.
  `data-adm-switch="<label>"` makes `admin.js` raise a toast on change.
- `form[data-adm-demo]` cancels submit and raises `data-adm-demo-msg` (default
  `Yadda saxlanıldı`) as a toast. Every admin form is demo-only — there is no backend.

---

## 13. Bar chart (AdmCharts)

```html
<div data-adm-bars
     data-values="182,214,196,248,271,263,318"
     data-labels="Yan,Fev,Mar,Apr,May,İyn,İyl"
     data-label="Aylıq müraciət sayı"></div>
```

`AdmCharts` injects `<svg class="adm-bars">` containing `line.adm-bars-base` and one
`g.adm-bar-group` per column (`<title>` tooltip + `rect.adm-bar` + `text.adm-bar-value` +
`text.adm-bar-label`). The tallest bar gets `.is-peak`. Unless reduced motion is on, the
container gains `.is-animated` and the bars grow in.

| attribute | meaning |
|---|---|
| `data-adm-bars` | marks the container |
| `data-values` | required, comma-separated |
| `data-labels` | optional; when present the chart reserves 22px for the axis |
| `data-label` | `aria-label` of the svg; falls back to `Sütun diaqramı: …` |
| `data-width` / `data-height` | fallback box (defaults 520×200) when the container is unsized |

The container is `height:240px` by default — override with a page-level class, never
`style=""`. Redraw manually with `window.EduNavAdmin.redrawCharts()`.

---

## 14. Admin login `admin/daxil-ol.html`

The only admin page with **no** `.adm-side` / `.adm-top` / `.adm-main`: block 8a → the card →
the two `<script>` tags of 8d. `<body class="adm">` still applies.

```html
<main class="adm-login" id="adm-content">
  <div class="adm-login-card">
    <a class="adm-login-brand" href="../index.html">
      <span class="adm-brand-mark" aria-hidden="true"><svg …></span>
      <span class="adm-brand-text">Edu<b>Nav</b></span>
    </a>
    <h1 class="adm-login-title">İdarə panelinə giriş</h1>
    <p class="adm-login-sub">Yalnız səlahiyyətli əməkdaşlar üçün.</p>

    <form class="adm-login-form" data-adm-demo data-adm-demo-msg="Daxil olundu" novalidate>
      <div class="field">
        <label class="field-label" for="adm-login-email">E-poçt</label>
        <input class="input" id="adm-login-email" name="email" type="email" autocomplete="username" required>
        <p class="field-error" data-error-for="adm-login-email" hidden>E-poçt ünvanı düzgün deyil.</p>
      </div>
      <div class="field">
        <label class="field-label" for="adm-login-pass">Şifrə</label>
        <input class="input" id="adm-login-pass" name="password" type="password" autocomplete="current-password" required>
      </div>
      <div class="adm-login-row">
        <label class="switch">
          <input type="checkbox" checked>
          <span class="switch-track"></span>
          <span class="switch-label">Məni xatırla</span>
        </label>
        <a class="adm-login-link" href="../elaqe.html">Şifrəni unutdum</a>
      </div>
      <button class="btn-brand" type="submit">Daxil ol</button>
    </form>

    <p class="adm-login-note"><b>Demo:</b> panel statikdir…</p>
    <p class="adm-login-foot"><a href="../index.html">EduNav.az saytına qayıt</a></p>
  </div>
</main>
```

- `.adm-login` is the full-height radial-glow background and centres the card — it must be the
  page-level wrapper, not a child of `.adm-content`.
- The brand block uses the **legacy** `.adm-brand-mark` / `.adm-brand-text` pair, not
  `.logo-mark` / `.logo-text`: `.adm-login-brand .adm-brand-*` overrides size and colour.
- `.adm-login-form .btn-brand` is forced full-width and centred; do not add `.btn-block`.
- `.adm-login-row` is the space-between line under the fields.

---

## 15. Every `data-*` attribute `admin.js` binds to

**Sidebar** (`AdmSidebar`)

| attribute | on | effect |
|---|---|---|
| `data-adm-side-open` | `.adm-burger` | opens the off-canvas sidebar; `aria-expanded` is managed |
| `data-adm-side-close` | `.adm-side-close`, `.adm-side-backdrop` | closes it |
| `data-adm-side-toggle` | *(any button)* | desktop collapse — **no CSS exists, do not use** |

**Table** (`AdmTable`)

| attribute | on | effect |
|---|---|---|
| `data-adm-table` | wrapper div | declares the scope for search / bulk bar / empty / pager / count |
| `data-page-size` | `<table>` or the scope | rows per page, default `10` |
| `data-sort` | `th` | `text` \| `num` \| `date` — makes the header sortable |
| `data-sort-value` | `td` | overrides that cell's sort key |
| `data-adm-check-all` | `input[type=checkbox]` in `thead` | select-all for the current page |
| `data-adm-check` | `input[type=checkbox]` in each row | row selection |
| `data-adm-norow` | `tr` | excludes the row from sorting/filtering/paging |
| `data-adm-search` | `tr` | extra text folded into that row's search haystack |
| `data-adm-result-count` | any element **inside the scope** | receives the matched-row count |
| `data-adm-page` | generated pager buttons | `prev` \| `next` \| a page number |

**Selection + bulk** (`AdmTable`, `AdmActions`)

| attribute | on | effect |
|---|---|---|
| `data-adm-selected` | span in the bulk bar | rewritten to `"{N} seçildi"` |
| `data-adm-bulk` | button in the bulk bar | `approve` \| `reject` \| `archive` \| `restore` \| `delete` |
| `data-adm-clear-selection` | button in the bulk bar | unchecks everything |
| `data-adm-action` | any button, usually `.adm-icobtn` | `approve` \| `reject` \| `archive` \| `restore` \| `delete` \| `save` |
| `data-adm-status` | the `.badge` inside a row | marks which node `setStatus()` rewrites (leave the value empty) |
| `data-adm-label` | `tr` | the name used in the toast; otherwise `[data-adm-cell="ad"]` |

**Filters** (`AdmFilters`)

| attribute | on | effect |
|---|---|---|
| `data-adm-filter-group="key"` | chip wrapper | chip filter group |
| `data-adm-multi` | chip wrapper | multi-select chips |
| `data-adm-value` | `.chip` | the value; empty string = the “Hamısı” chip |
| `data-adm-filter="key"` | `.dd`, `[data-dd]`, `select` | dropdown filter |
| `data-adm-filter-reset` | button | resets every group + search in the nearest scope |
| `data-<key>` | `tr` | the row's value(s) for that key, comma-separated |

**Drawer** (`AdmDrawer`)

| attribute | on | effect |
|---|---|---|
| `data-adm-drawer="id"` | trigger | opens `.adm-drawer[data-adm-drawer-id="id"]` |
| `data-adm-drawer-id="id"` | `.adm-drawer` | the panel's identity |
| `data-adm-drawer-close` / `data-close` | button in the panel | closes it |
| `data-adm-field="key"` | node in the panel | receives the value |
| `data-adm-field-attr="href"` | same node | write an attribute instead of text |
| `data-adm-cell="key"` | cell/element inside the trigger row | supplies a value |
| `data-adm-drawer-data` | trigger | JSON object, wins over the row data |

**Forms, switches, charts**

| attribute | on | effect |
|---|---|---|
| `data-adm-demo` | `<form>` | cancels submit, raises a toast |
| `data-adm-demo-msg` | `<form>` | that toast's text |
| `data-adm-switch="Label"` | `.switch input` | raises `Label — aktiv edildi / söndürüldü` |
| `data-adm-spark` | container div | sparkline |
| `data-adm-bars` | container div | bar chart |
| `data-values` / `data-labels` / `data-label` / `data-width` / `data-height` | chart containers | see § 2.1 and § 13 |

**Public surface.** `window.admToast(msg, type, action)` and `window.EduNavAdmin`
(`toast`, `tables()`, `tableFor(el)`, `openDrawer(id)`, `closeDrawer()`, `closeSidebar()`,
`redrawCharts()`). Toast types: `ok` (default) · `danger` · `warn` · `info`.
Table event: `adm:table:render` bubbles from the `<table>` with
`detail:{total, matched, page}`.

---

## 16. Class names that exist in only one half

Keep these straight — each one is a page that silently renders wrong.

| you might write | the CSS/JS actually wants |
|---|---|
| `.adm-brand` in the sidebar | `.adm-side-head` + the shared `.logo` (PARTIALS 8b). `.adm-brand*` is kept only for the login card |
| `.adm-nav-group` as a wrapper | it is the **label** `<p>`; `.adm-nav-link`s are its flat siblings |
| `.field-full` in `.adm-form-grid` | `.field--full` |
| `.adm-spark-fill` on a JS chart | `.adm-spark-area` (`.adm-spark-fill` is the hand-authored shape) |
| `.adm-pager-nav` after JS runs | `.adm-pager-btns` (both are styled) |
| `.adm-pager-btn.is-active` after JS runs | `.adm-pager-num.is-on` (both are styled) |
| `.adm-search` in `.adm-top` | it is hidden ≤768px; the top-bar input is `.adm-top-input` |
| `.adm-cell-title` | not styled — use `.adm-cell-main` and `[data-adm-cell="ad"]` |
| `.adm-card` | not styled — it is only a fallback scope selector; use `.adm-panel` |
| `.is-side-collapsed`, `.is-sorted`, `.is-asc`, `.is-desc`, `.is-hidden`, `.is-empty`, `.is-touched` | JS-only hooks with **no** CSS |

---

## 17. CSS added to `admin.css` for this reference

Appended as **§ 22 “Runtime markup”**, each rule carrying the comment that explains it.
All seven groups exist because `admin.js` generates markup that sections 1–21 do not cover.

1. `.adm-toolbar--bulk` (+ `.is-on`) — the bulk bar had no hidden state and sat on the page
   permanently reading “0 seçildi”.
2. `.adm-filter-search .adm-search` — `.adm-search` is `display:none` below 768px (§ 19 wrote
   that rule for a top-bar search), which killed the table's only live-search hook on phones.
3. `.adm-pager-btns`, `.adm-pager-num`, `.adm-pager-num.is-on` — the shape `renderPager()`
   actually emits; only the hand-authored shape was styled.
4. `.adm-drawer-scrim` (+ `@keyframes adm-scrim-in`) — `AdmDrawer` creates this element; § 1
   only styles the sidebar's `.adm-scrim`.
5. `[data-adm-spark]` container sizing/colour + `.adm-spark-area` / `.adm-spark-line` /
   `.adm-spark-dot` — `.adm-spark path{fill:none;stroke:…}` was rendering the generated area
   fill as a stroked outline.
6. `[data-adm-bars]`, `.adm-bars`, `.adm-bars-base`, `.adm-bar(.is-peak)`, `.adm-bar-value`,
   `.adm-bar-label`, `.is-animated` (+ `@keyframes adm-bar-in`) — the bar chart had no rules.
7. `.adm-toasts`, `.adm-toast(--ok/--danger/--warn/--info)`, `.adm-toast-dot`, `-msg`,
   `-action`, `-close`, `.is-in`, `.is-out` — `window.admToast()` had no rules.
8. `.adm-panel--overflow` — `.adm-panel{overflow:hidden}` clips every `.dd-panel` opened
   inside `.adm-panel-body`, which makes a dropdown in an admin form unusable. Form panels
   opt out of the clip; table panels keep it.

Plus the matching `@media (max-width:560px)` and `@media print` lines for the new elements.

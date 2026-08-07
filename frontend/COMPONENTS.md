# EduNav `frontend/` — Component markup reference (public side)

The stylesheet is finished and frozen. **This file is the contract for the HTML that
goes under it.** Every block below is the exact element tree
`assets/css/style.css` selects for — descendant combinators, required wrapper
divs, which element carries `:hover`, which element carries `.is-*`, and which
pseudo-elements the CSS supplies so you must *not* author them.

`_gallery.html` renders every block on this page with real content. If a block
here and `_gallery.html` ever disagree, `_gallery.html` is the bug.

**How to read a block**

* Classes and nesting shown are **structural** unless the note says otherwise —
  drop a wrapper and the component loses its layout, its hover, or its state.
* Text, `href`, `alt`, numbers, icon paths, `data-id` values: **content**. Change freely.
* Anything the CSS draws with `::before` / `::after` is called out. Never add a
  span for it — you will get it twice.
* `[hidden]` is `display:none !important` globally, so `el.hidden = true` from JS
  always wins. Author `hidden` on anything that starts closed.

**Hard rules (from DESIGN-SPEC.md § 0):** no `style=""`, never `all: unset`,
Azerbaijani copy from `CONTENT.md` verbatim, decorative SVG carries
`aria-hidden="true" focusable="false"`, real inline SVG icons only
(`viewBox="0 0 24 24"`, `stroke-width="2"`, `stroke-linecap="round"`,
`stroke-linejoin="round"`, `fill="none"`) — never an icon font, never an emoji.
Icon **pixel size is set by CSS** (`.btn-brand svg{14px}`, `.vac-icon svg{20px}`,
`.searchbar-icon svg{22px}` …); still put `width`/`height` attributes on the tag
so the icon is sane before CSS lands.

---

## 0. The data-attribute map (`assets/js/app.js`)

Every hook `app.js` binds to, in boot order. **Names are exact.** A typo here is
silent — the module just no-ops.

| attribute | on | module | what it does |
|---|---|---|---|
| `data-year` | **footer copyright span only** | YearStamp | `textContent` ← current year. ⚠️ See the warning below — this selector is global and destructive |
| `data-drawer` | `.drawer` | Drawer | drawer root (falls back to `.drawer`) |
| `data-drawer-open` | `.burger` | Drawer | toggles the drawer; JS also flips `aria-expanded` and adds `.is-on` **to the burger** |
| `data-drawer-close` | backdrop / close button | Drawer | closes |
| `data-open="contact\|survey\|guest"` | any button/link | Modals | opens `.modal[data-modal="…"]`; JS adds `aria-haspopup="dialog"` |
| `data-modal="name"` | `.modal` | Modals | the dialog itself |
| `data-modal-close`, `data-close` | backdrop / close button | Modals | closes (`.modal-backdrop` and `.modal-close` are also bound by class) |
| `data-autofocus` | control inside `.modal` | Modals | gets focus on open instead of the first focusable |
| `data-dd` | `.dd` | Dropdown | alternative root marker; `.dd` alone is enough |
| `data-name` | `.dd` | Dropdown | field name. **Must match `/^[A-Za-z][\w-]*$/`** — only then does the hidden mirror `input` get created inside a `<form>` |
| `data-placeholder` | `.dd` or `.dd-value` | Dropdown | empty-state label (default `Seçin`) |
| `data-label` / `data-labelledby` | `.dd` | Dropdown | becomes `aria-label` / `aria-labelledby` on `.dd-list` |
| `data-value` | `.dd-option` | Dropdown | the value. Omit it and JS back-fills it from the visible label |
| `data-dd-up` | `.dd` | Dropdown | force upward opening (`.is-up`). Also forced for any `.dd` inside `.searchbar` |
| `data-dd-input` | hidden `input` inside `.dd` | Dropdown | mirror for form submit — **JS creates it, do not author it** |
| `data-reveal` | any block | Reveal | starts `opacity:0; translateY(14px)`, IO adds `.is-in` |
| `data-reveal-delay` | same element | Reveal | delay in **ms**, integer |
| `data-hero-word` | fallback for `.hero-word` | HeroWord | rotates `HERO_WORDS` |
| `data-search-input` | fallback for the search field | SearchHint | otherwise `.searchbar input[type=text\|search]` |
| `data-placeholder`, `data-hint-prefix` | search input | SearchHint | base placeholder / prefix (default `Axtarın: `) |
| `data-search-hint` | any element | SearchHint | mirrors the rotating hint text |
| `data-fav-toggle` | `.ecard-fav` button | Favourites | toggles `edunav_fav`; **reads the id from `closest('[data-id]')`** |
| `data-fav-count` / `data-fav-empty` | any | Favourites | count text / empty panel |
| `data-compare-toggle` | button | Compare | toggles `edunav_compare`, max 4; also reads `closest('[data-id]')` |
| `data-id` | `.ecard` (the card, not the button) | Fav + Compare | the identity both toggles read |
| `data-name` `data-mono` `data-tip` `data-meta` `data-price` `data-grad` `data-href` | `.ecard` | Compare | copied into the stored compare entry (`data-tip="bagca"` → `bagca.html`) |
| `data-compare-bar` | `.compare-bar` | Compare | the bar. If absent and the page has toggles, JS **builds one** |
| `data-cb-count` `data-cb-avatars` `data-cb-clear` `data-cb-go` `data-cb-hide` `data-cb-note` | inside the bar | Compare | number · stacked monograms · clear · link · dismiss · the “max 4” line |
| `data-compare-remove` / `data-compare-row` / `data-compare-clear` | `muqayise.html` | Compare | page-rendered remove buttons |
| `data-wizard` | wizard root | Wizard | see § 12 for the whole set |
| `data-survey-step` `data-survey-pick` `data-survey-prev` `data-survey-next` `data-modal-success` | survey modal | Survey | PARTIALS block 5, already wired |
| `data-catalogue` | section root | Catalogue | filtering scope |
| `data-list` | the grid inside | Catalogue | sort re-appends children here |
| `data-item` | each card | Catalogue | filterable item |
| `data-tip` `data-rayon` `data-dil` | `data-item` | Catalogue | comma-separated, folded (`Zəka` matches `zeka`) |
| `data-name` `data-price` `data-search` | `data-item` | Catalogue | sort keys + free-text haystack |
| `data-filter="tip\|rayon\|dil"` | `.dd` or `select` | Catalogue | bound filter control |
| `data-filter-chip` + `data-filter` + `data-value` | `.chip` | Catalogue | toggle chip; empty `data-value` = “hamısı” |
| `data-filter-q` | `input` | Catalogue | debounced (160 ms) free text |
| `data-sort` | `.dd` or `select` | Catalogue | value form `key` / `key-desc`, e.g. `price-desc`, `name`, `added-desc`. The key names the attribute Catalogue reads: `added-desc` sorts on `data-added` |
| `data-filter-reset` | button | Catalogue | clears everything |
| `data-count` | any | Catalogue | visible-result count, space-grouped |
| `data-validate` **or** `data-form="…"` | `form` | Forms | turns on validation; JS sets `novalidate` |
| `data-error-for="input-id"` | `.field-error` | — | authoring convention (PARTIALS); JS finds the node by `.field-error` inside `.field` |
| `data-error` | control | Forms | overrides the default message |
| `data-email` `data-tel` `data-min` `data-match` `data-skip-validate` | control | Forms | extra rules |
| `data-form-success` / `data-modal-success` / `data-success="sel"` | panel | Forms | shown in place of the form on a valid submit |

### `data-year` — bare stamps, valued is data

`YearStamp.init()` distinguishes the two uses by whether the attribute has a value:

```js
nodes.forEach(function (el) {
  if (el.getAttribute('data-year')) return;   // valued → card data, untouched
  el.textContent = year;                      // bare  → footer copyright
});
```

- **Bare** `<span data-year>2026</span>` — the footer copyright span. Gets stamped
  with the current year at boot.
- **Valued** `<article class="ecard" data-item data-year="2008">` — founding year for
  Catalogue's sort. Left alone.

So the sort key `year` is fully usable (`sort="year"` → reads `data-year`), and
`data-value="year-desc"` on a `.dd-option` works as expected. Also keep the
human-readable year in `.ecard-meta` and `data-search` so it stays visible and searchable.

An earlier build stamped every `[data-year]` unconditionally, which deleted a card's
entire contents at boot with no error. Do not reintroduce an unscoped `textContent`
write here.

**State classes JS owns — never author them, never style around them:**
`.is-open` (drawer, modal, `.dd`, `.faq-item`), `.is-on` (burger, chip, `.ecard-fav`,
compare bar, `.wz-opt`), `.is-active` (`.dd-option`, nav link), `.is-up` (`.dd`),
`.is-in` (`[data-reveal]`), `.is-placeholder` (`.dd-value`), `.has-error`
(control **and** `.field`), `.is-anim` (`.hero-word`), `has-compare-bar` /
`is-locked` (on `<body>`), `js-ready` / `js-booted` (on `<html>`).

**Hooks JS sets that the stylesheet deliberately has no rule for** — they exist so
page CSS can use them, do not expect a visual: `.dd.is-ready`, `.dd.has-value`,
`[data-item].is-hidden`, `[data-list].is-empty`, `.compare-bar.is-full`,
`[data-wizard].is-asking` / `.is-done`, `form.has-errors`.

---

## 1. Hero

```html
<div class="hero-bg">
  <section class="hero">
    <div class="container hero-inner">

      <div class="hero-copy">
        <h1 class="h1">
          Təhsilin doğru ünvanı,<br>
          <span class="hero-word" data-hero-word>gələcəyin</span><span class="hero-caret" aria-hidden="true"></span><br>
          güclü addımı.
        </h1>
        <p class="lead">Məktəb və bağçaları kəşf edin, müqayisə edin və övladınız üçün ən uyğun seçimi bizimlə edin.</p>
      </div>

      <div class="hero-cards">

        <a class="hero-card hero-card--school" href="mekteblar.html">
          <span class="hero-card-glow" aria-hidden="true"></span>
          <span class="hero-card-art" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="150" height="150" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M2.8 8.6 12 4.2l9.2 4.4L12 13z"/><path d="M6.6 10.8v4.6c0 1.6 2.4 2.9 5.4 2.9s5.4-1.3 5.4-2.9v-4.6"/><path d="M21.2 8.9v5.3"/></svg>
          </span>
          <span class="hero-card-inner">
            <span class="hero-card-top">
              <span class="hero-card-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M2.8 8.6 12 4.2l9.2 4.4L12 13z"/><path d="M6.6 10.8v4.6c0 1.6 2.4 2.9 5.4 2.9s5.4-1.3 5.4-2.9v-4.6"/><path d="M21.2 8.9v5.3"/></svg>
              </span>
              <span class="kicker">1–11 sinif</span>
            </span>
            <span class="hero-card-body">
              <span class="hero-card-title">Məktəbləri kəşf et</span>
              <span class="hero-card-sub">Keyfiyyətli təhsil üçün doğru seçim</span>
              <span class="btn-pill">Kəşf et</span>
            </span>
          </span>
        </a>

        <a class="hero-card hero-card--kg" href="bagcalar.html">
          <span class="hero-card-glow" aria-hidden="true"></span>
          <span class="hero-card-art" aria-hidden="true"> … </span>
          <span class="hero-card-inner">
            <span class="hero-card-top">
              <span class="hero-card-icon" aria-hidden="true"> … </span>
              <span class="kicker">2–6 yaş</span>
            </span>
            <span class="hero-card-body">
              <span class="hero-card-title">Bağçaları kəşf et</span>
              <span class="hero-card-sub">Sevgi və qayğı ilə dolu bir başlanğıc</span>
              <span class="btn-pill btn-pill--kg">Kəşf et</span>
            </span>
          </span>
        </a>

        <a class="hero-card hero-card--job" href="vakansiyalar.html">
          <span class="hero-card-glow" aria-hidden="true"></span>
          <span class="hero-card-inner">
            <span class="hero-card-top">
              <span class="hero-card-icon" aria-hidden="true"> … </span>
            </span>
            <span class="hero-card-body">
              <span class="kicker">84 açıq elan</span>
              <span class="hero-card-title">Vakansiyalar</span>
              <span class="hero-card-sub">Müəllim və tərbiyəçilər üçün iş yerləri</span>
            </span>
            <span class="hero-card-go" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12h16"/><path d="m14 6 6 6-6 6"/></svg>
            </span>
          </span>
        </a>

      </div>
    </div>
  </section>
</div>
```

**Structural.** `.hero-bg` is a separate wrapper *around* `.hero`, not a class on
it — it paints four stacked radial gradients plus a dotted `::before` overlay, and
its `overflow:hidden` is what clips them. `.hero` is only padding + `position:relative`;
`.hero-inner` must also carry `.container` (it is the `1fr 1.12fr` grid). Exactly
two children of `.hero-inner`: `.hero-copy` and `.hero-cards`.

The headline **must** be `<h1 class="h1">` — the `.h1` class carries the `--fs-h1`
clamp; bare `h1` only gets the shared heading reset. `.hero-copy .lead` is capped at
490px by a descendant rule, so `.lead` has to be inside `.hero-copy`.
`.hero-word` reserves `min-width: var(--hero-word-w, 6.24em)` so the line does not
reflow; app.js measures the longest word and overwrites that property, then swaps
`textContent` and toggles `.is-anim` on `.hero-word` itself. Author the initial word
as plain text inside `.hero-word` (an inner `.hero-word-in` span is the no-JS
fallback only — the first `textContent` write deletes it). `.hero-caret` is an empty
decorative `<span>`; it has no content and must be `aria-hidden`.

`.hero-cards` is a 2-column grid; `.hero-card--job` claims `grid-column: 1 / -1`
purely from CSS, so it just goes third in source order — do not wrap it.
Inside a card the order is fixed: `.hero-card-glow` → `.hero-card-art` →
`.hero-card-inner`, because the first two are absolutely positioned and
`.hero-card-inner` supplies `z-index:1`. `.hero-card-inner` uses
`justify-content: space-between`, so it needs **exactly two** flex children —
`.hero-card-top` and `.hero-card-body` — or the layout collapses to the top.
The `.btn-pill` lives **inside** `.hero-card-body` (`.hero-card-body .btn-pill`
supplies its `margin-top:22px`). Because the card is an `<a>`, the pill must be a
`<span>`, never a nested `<a>` or `<button>`.

Colour comes only from the modifier: `.hero-card--school .kicker`,
`.hero-card--school .hero-card-title`, `.hero-card--school .hero-card-sub`, and
the `--kg` / `--job` equivalents. A card with no modifier is transparent and
unreadable. `.hero-card--job` re-lays `.hero-card-inner` to a row and adds a
fourth optional child, `.hero-card-go` (a circle that slides on card hover);
its `.kicker` sits **inside** `.hero-card-body` on that variant, since the body
is the baseline-aligned wrap row.

**Content.** Words, hrefs, and the icon paths. `data-hero-word` is optional
(`.hero-word` alone is found).

---

## 2. Section head

```html
<div class="sec-head">
  <span class="kicker">Kataloq</span>
  <div class="sec-head-row">
    <h2 class="sec-title">Seçilmiş məktəblər</h2>
    <a class="sec-all" href="mekteblar.html">
      Hamısına bax
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12h16"/><path d="m14 6 6 6-6 6"/></svg>
    </a>
  </div>
  <p class="sec-sub">Kurikulum, tədris dili və illik ödəniş — redaksiyamızın yoxladığı profillər.</p>
</div>
```

**Structural.** `.sec-head` is the 24px-bottom-margin wrapper; `.sec-head-row` is
the `space-between` flex row and must contain **only** the title and the “all”
link. `.sec-sub` is a sibling *after* the row, not inside it — it is capped at
620px and gets its own `margin-top:10px`. An optional `.kicker` goes **before**
`.sec-head-row`; the `.sec-head .kicker` descendant rule gives it the 10px gap, so
it must be a direct descendant of `.sec-head`.

The arrow SVG must be the **last child of `.sec-all`** — `.sec-all:hover svg`
translates it 3px. Use `h2.sec-title`, not `h2.h2`: `.sec-title` zeroes the margin.
`.sec-all` is optional; drop the whole `<a>` and the row still works.

**Content.** All text, the href, the icon path.

---

## 3. Institution card `.ecard`

```html
<article class="ecard" data-item
         data-id="zeka-beynelxalq-mektebi"
         data-name="Zəka Beynəlxalq Məktəbi"
         data-mono="ZM"
         data-tip="mekteb"
         data-rayon="Nəsimi"
         data-dil="İngilis,Rus"
         data-meta="Nəsimi · 2008-dən"
         data-price="12000"
         data-added="2008"
         data-grad="g1"
         data-href="mekteb.html"
         data-search="Zəka Beynəlxalq Məktəbi Nəsimi IB robotexnika">
  <div class="ecard-media g1">
    <span class="ecard-mono" aria-hidden="true">ZM</span>
    <span class="ecard-tag">Premium</span>
    <button class="ecard-fav" type="button" data-fav-toggle aria-pressed="false" aria-label="Seçilmişlərə əlavə et">
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 20.3 4.6 13a4.6 4.6 0 0 1 6.5-6.5l.9.9.9-.9A4.6 4.6 0 1 1 19.4 13z"/></svg>
    </button>
  </div>
  <div class="ecard-body">
    <p class="ecard-meta">Nəsimi · 2008-dən</p>
    <h3 class="ecard-title"><a href="mekteb.html">Zəka Beynəlxalq Məktəbi</a></h3>
    <p class="ecard-desc">IB proqramı, üç dildə tədris və robotexnika sinfi.</p>
    <div class="ecard-foot">
      <span class="ecard-price">12 000 AZN</span>
      <span class="ecard-per">/il</span>
      <button class="btn-icon" type="button" data-compare-toggle aria-pressed="false" aria-label="Müqayisəyə əlavə et">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 7h16M4 12h10M4 17h6"/></svg>
      </button>
    </div>
  </div>
</article>
```

**Structural.** Two children only: `.ecard-media` then `.ecard-body`. The card is
`overflow:hidden` + column flex; `.ecard-body` is `flex:1` and `.ecard-foot` uses
`margin-top:auto`, which is what makes footers line up across a grid row — so the
foot must be the **last child of `.ecard-body`**, not of `.ecard`.

`.ecard-media` needs a gradient class **on the same element**: `.g1 … .g6`. Without
one you get the flat `--line-2` fallback. `.g2` and `.g3` are light, so a descendant
rule darkens `.g2 .ecard-mono, .g3 .ecard-mono` — the monogram must therefore be a
descendant of the gradient element, never a sibling. Cycle by index; schools prefer
`g1 g3 g4 g6`, kindergartens `g2 g3 g5 g6`.

`.ecard-mono` is `position:absolute; inset:0` and `pointer-events:none` — it centres
itself, do not wrap it. `.ecard-tag` is top-left, `.ecard-fav` top-right; both are
absolute, so their source order inside `.ecard-media` is free. Variants:
`.ecard-tag--new` (dark, use for `Yeni`) and `.ecard-tag--kg`. `.ecard-fav`
gets `.is-on` from JS and `.ecard-fav.is-on svg { fill: var(--ink) }` fills the
heart — so the heart must be a **stroke** path with `fill="none"` on the tag.

`.ecard-price` and `.ecard-per` are two separate inline elements inside
`.ecard-foot` (the foot is a 10px-gap flex row) — do not nest `per` inside `price`.
`.ecard-foot` carries `z-index:2` so its buttons stay clickable above the optional
`.ecard-link` overlay. Use `.ecard-link` (`position:absolute; inset:0`) **only** if
you want a whole-card link, and then the title must not also be an `<a>`.

Hover (`translateY(-4px)` + `--sh-2`) is on `.ecard`. `.ecard:focus-within` darkens
the border, which is why the title anchor is the accessible target.
`.ecard--row` flips to a horizontal list card and resizes `.ecard-media` — add it to
`.ecard`, change nothing else.

**Data.** `data-id` sits on the **card**, not on the fav/compare buttons — both
modules do `closest('[data-id]')`. `data-price` must be a bare number for sorting
(`toNumber` strips non-digits, so `12 000` also parses, but keep it clean).
`data-tip` doubles as the catalogue filter value *and* the compare link chooser
(`bagca` → `bagca.html`). **Never `data-year` on a card** — see the warning in § 0;
use `data-added` and the `added-desc` sort key.

**Content.** Everything textual, the monogram letters, the icons, the gradient index.

---

## 4. Search bar

```html
<div class="search-wrap">
  <span class="search-glow" aria-hidden="true"></span>

  <form class="searchbar" role="search" action="mekteblar.html" data-validate>
    <span class="searchbar-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg>
    </span>

    <label class="field-label sr-only" for="q">Axtarış</label>
    <div class="search-field">
      <input class="input search-input" id="q" name="q" type="search" autocomplete="off"
             data-filter-q data-placeholder="Məktəb, bağça və ya rayon axtarın" data-hint-prefix="Axtarın: ">
      <span class="search-hint" aria-hidden="true">
        Axtarın:
        <span class="search-hint-word" data-search-hint>«Zəka Beynəlxalq Məktəbi»</span>
        <span class="search-hint-caret"></span>
      </span>
    </div>

    <span class="search-kbd" aria-hidden="true">⌘K</span>
    <span class="searchbar-sep" aria-hidden="true"></span>

    <div class="dd dd-bare dd-end" data-name="tip" data-label="Növ" data-placeholder="Növ">
      <button class="dd-trigger" type="button">
        <span class="dd-value is-placeholder">Növ</span>
        <svg class="dd-caret" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      <div class="dd-panel">
        <div class="dd-list">
          <button class="dd-option" type="button" data-value="mekteb"><span class="dd-label">Məktəb</span></button>
          <button class="dd-option" type="button" data-value="bagca"><span class="dd-label">Bağça</span></button>
        </div>
      </div>
    </div>

    <button class="btn-brand" type="submit">Axtar</button>
  </form>

  <div class="search-pop">
    <span class="search-pop-label">1 240 müəssisə · Populyar</span>
    <a class="chip" href="mekteblar.html">Məktəblər</a>
    <a class="chip" href="bagcalar.html">Bağçalar</a>
    <a class="chip" href="mekteblar.html?dil=İngilis">İngilis dili</a>
  </div>
</div>
```

**Structural.** `.search-wrap` exists only to be the `position:relative` ancestor
of `.search-glow` (absolute, `top:-30px`, decorative — an empty span, never a
child of `.searchbar`, whose `overflow` would not clip it anyway but whose
`box-shadow` it must sit behind). `.searchbar` itself is the white flex bar.

Order inside `.searchbar` matters visually, not structurally, except that the
input **must** be wrapped in `.search-field`: that wrapper is the
`position:relative` ancestor for the absolutely-positioned `.search-hint`, and
`.search-field:focus-within .search-hint { display:none }` is what hides the fake
placeholder once you type. `.search-hint` must be `aria-hidden` — it duplicates the
placeholder. `.search-hint-word` runs `edu-word-in`, `.search-hint-caret` runs
`edu-caret`; both are empty/decorative.

SearchHint binds to `.searchbar input[type="text"]` **or** `input[type="search"]`,
so the `type` must be one of those (or add `data-search-input`). It rewrites the
real `placeholder` attribute; `data-placeholder` holds the value it restores on
focus, `data-hint-prefix` the `Axtarın: ` prefix.

`.searchbar .btn-brand` / `.btn-dark` get a bigger padding via a descendant rule —
keep the submit button a direct child. `.searchbar-sep` is a 1px stretched divider,
hidden below 768px. `.search-kbd` ships `display:none`; opt it in with page CSS if
you want the `⌘K` badge.

**Any `.dd` inside `.searchbar` opens upward automatically** —
`.searchbar .dd-panel` re-anchors to `bottom: calc(100% + 12px)` and
`Dropdown.placeUp()` adds `.is-up` when it sees `closest('.searchbar')`. You do
**not** add `.dd-up` there. Use `.dd-bare` so the trigger loses its border and
blends into the bar, and `.dd-end` if the panel would otherwise overflow the right
edge.

`.search-pop` is a **sibling of `.searchbar`**, inside `.search-wrap`.
`.search-pop-label` draws its blinking dot with `::before` — text only, no span.
It is hidden below 560px.

**Content.** Placeholder, hint strings (those live in `SEARCH_HINTS` in `app.js`),
chip labels and hrefs, the dropdown options.

---

## 5. Dropdown `.dd`

### 5a. Single select

```html
<div class="dd" data-name="sort" data-label="Sıralama" data-placeholder="Populyar" data-sort>
  <button class="dd-trigger" type="button">
    <span class="dd-value is-placeholder">Populyar</span>
    <svg class="dd-caret" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6"/></svg>
  </button>
  <div class="dd-panel">
    <div class="dd-list">
      <button class="dd-option" type="button" data-value="price"><span class="dd-label">Qiymət artan</span></button>
      <button class="dd-option" type="button" data-value="price-desc"><span class="dd-label">Qiymət azalan</span></button>
      <button class="dd-option" type="button" data-value="name"><span class="dd-label">Ad (A–Z)</span></button>
      <button class="dd-option" type="button" data-value="year-desc"><span class="dd-label">Yeni əlavə olunan</span></button>
    </div>
  </div>
</div>
```

### 5b. Multi select, with search, footer and upward opening

```html
<div class="dd dd-multi dd-up dd-end" data-name="rayon" data-label="Rayon" data-placeholder="Rayon" data-filter="rayon">
  <button class="dd-trigger" type="button">
    <span class="dd-value is-placeholder">Rayon</span>
    <svg class="dd-caret" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6"/></svg>
  </button>
  <div class="dd-panel">
    <input class="dd-search" type="text" placeholder="Rayon axtar" aria-label="Rayon axtar">
    <div class="dd-list">
      <button class="dd-option" type="button" data-value="Nəsimi"><span class="dd-label">Nəsimi</span><span class="dd-count">184</span></button>
      <button class="dd-option" type="button" data-value="Yasamal"><span class="dd-label">Yasamal</span><span class="dd-count">142</span></button>
      <button class="dd-option" type="button" data-value="Binəqədi"><span class="dd-label">Binəqədi</span><span class="dd-count">96</span></button>
    </div>
    <div class="dd-foot">
      <button class="dd-clear" type="button" hidden>Təmizlə</button>
      <span class="meta-line">Çoxseçimli</span>
    </div>
  </div>
</div>
```

Empty result placeholder inside `.dd-list`: `<p class="dd-empty">Nəticə tapılmadı</p>`.

**Structural.** Four required levels: `.dd` → `button.dd-trigger` → `.dd-panel` →
`.dd-list` → `button.dd-option`. `.dd` is the only `position:relative` ancestor, so
`.dd-panel` (absolute, `top: calc(100% + 8px)`, `z-index:70`) must be its **direct**
child. `.dd-list` must be inside `.dd-panel` — `Dropdown.placeUp()` measures
`.dd-list`'s `scrollHeight` to decide whether to flip, and the panel's `max-height`
scrolling lives on the list, not the panel.

`.dd-trigger` needs `.dd-value` inside it (the ellipsised label). Author it with
`.is-placeholder` and the placeholder text; `Dropdown.sync()` removes the class the
moment something is selected. The caret is `svg.dd-caret` — the class goes **on the
`<svg>` itself**, and `.dd.is-open .dd-caret` rotates it 180°.

`.dd-option` gets its tick from `::after` on the single-select variant
(`.dd:not(.dd-multi) .dd-option::after`) and its checkbox from **both** `::before`
and `::after` on `.dd-multi`. Never author a tick element; the padding
(`10px 34px 10px 12px`, or `padding-left:44px` under `.dd-multi`) already reserves
the space. Selection state is `aria-selected="true"` on the option — that attribute,
not a class, is what the CSS and `Dropdown.sync()` read. `.is-active` is the roving
keyboard focus and is JS-only.

`.dd-label` is required if you also use `.dd-count` (`.dd-count` uses
`margin-left:auto`); with a bare text node `Dropdown.labelOf()` still works, but
the label will not ellipsise.

Opening direction: `.dd-up` is the author's opt-in, `.is-up` is what
`Dropdown.placeUp()` adds at runtime, and `.searchbar .dd-panel` forces it by
ancestry. All three selectors are listed together in the stylesheet — if you invent
a fourth name the panel silently opens off-screen. `.dd-end` right-aligns the panel;
combine as `.dd-end.dd-up` and the transform-origin follows.

`.dd-bare` strips the trigger's border and background — for inline use inside
`.searchbar` or a toolbar.

`.dd-foot` / `.dd-clear` are optional. Author `.dd-clear` with `hidden`;
`Dropdown.sync()` unhides it as soon as there is a value.

**Forms.** Put a `.dd` inside a `<form>` with a `data-name` matching
`/^[A-Za-z][\w-]*$/` and app.js injects `<input type="hidden" data-dd-input>` so the
value submits. `data-name="rayon"` works; `data-name="Rayon seç"` does not.

**Content.** Labels, values, counts, the placeholder.

---

## 6. Dark promo banner

```html
<div class="banner-dark">
  <div class="banner-inner">
    <div class="banner-copy">
      <span class="kicker kicker--brand">Müəssisələr üçün</span>
      <h2 class="banner-title">Təhsil müəssisənizi <em>EduNav-da</em> tanıdın</h2>
      <div class="banner-row">
        <span class="banner-pill">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.2-4.1 5.8-.8z"/></svg>
          İlk ay pulsuz
        </span>
        <p class="banner-text">Profilinizi yaradın — ayda 40 000+ valideyn baxışı.</p>
      </div>
    </div>
    <div class="banner-media" aria-hidden="true"><span class="banner-media-mono">EN</span></div>
    <div class="banner-cta"><a class="btn-brand" href="muessise-elave-et.html">Ətraflı məlumat</a></div>
  </div>
</div>
```

**Structural.** `.banner-dark` is the gradient shell and the hover target
(`translateY(-3px)`); it draws **both** decorative blobs with `::before` / `::after`
— author no extra divs for them. `.banner-inner` (`z-index:1`) is required, or the
blobs paint over the copy. Its three flex children are `.banner-copy` (flex:1),
optional `.banner-media`, optional `.banner-cta`; below 768px `.banner-inner` turns
into a column and `.banner-cta` goes full-width.

`.banner-title` colours the accent word with `<em>` — the CSS un-italicises it and
paints it `--brand`. Do not use a span. `.banner-row` holds the pill next to the
text; `.banner-text` outside the row is fine too but loses the inline layout.

`.banner-soft` is the purple twin — swap the class on the shell and everything
below re-colours through `.banner-soft .banner-title` / `.banner-text` / `.banner-media`
descendant rules. Its CTA should be `.btn-dark` or `.btn-pill--kg`.

**Content.** All copy, the accent word choice, the monogram, the CTA href.

---

## 7. Partner marquee

```html
<div class="marquee-row">
  <span class="marquee-label">Tərəfdaşlar</span>
  <div class="marquee">
    <div class="marquee-track">
      <a class="marquee-item" href="sebekeler.html"><span class="marquee-mark" aria-hidden="true">ZM</span><span class="marquee-name">Zəka Məktəbləri</span></a>
      <a class="marquee-item" href="sebekeler.html"><span class="marquee-mark" aria-hidden="true">AL</span><span class="marquee-name">Alov Liseyi</span></a>
      <!-- … the remaining 6 … -->

      <!-- exact duplicate of all 8, aria-hidden, for the seamless loop -->
      <a class="marquee-item" href="sebekeler.html" aria-hidden="true" tabindex="-1"><span class="marquee-mark">ZM</span><span class="marquee-name">Zəka Məktəbləri</span></a>
      <!-- … 7 more … -->
    </div>
  </div>
</div>
```

**Structural.** Three levels, all required: `.marquee-row` (label + viewport) →
`.marquee` (`overflow:hidden` + the fade mask) → `.marquee-track` (the animated
`width:max-content` flex row). The animation is
`translateX(calc(-50% - 22px))`, which means the track must hold **exactly two
identical halves**; the `-22px` is half the 44px `gap`. Eight items → sixteen
children. Get the duplication wrong and the loop visibly jumps.

The duplicate half must be `aria-hidden="true" tabindex="-1"` — otherwise screen
readers and Tab visit every partner twice.

Pause on hover is `.marquee:hover .marquee-track` and `.marquee:focus-within
.marquee-track` — so it hangs off the **viewport**, not the track, and keyboard
users get the same pause. Under `prefers-reduced-motion` the stylesheet kills the
animation and turns `.marquee` into a horizontal scroller, so do not add your own
scroll container.

**Content.** Initials, names, hrefs, the count (keep both halves in sync).

---

## 8. Vacancy row

```html
<article class="vac-row" data-item data-name="Riyaziyyat müəllimi" data-rayon="Yasamal" data-price="1200">
  <span class="vac-icon" aria-hidden="true">
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="7.5" width="18" height="12.5" rx="2.5"/><path d="M8.5 7.5V5.8A1.8 1.8 0 0 1 10.3 4h3.4a1.8 1.8 0 0 1 1.8 1.8v1.7"/></svg>
  </span>
  <div class="vac-main">
    <h3 class="vac-title">Riyaziyyat müəllimi</h3>
    <p class="vac-org">Zəka Beynəlxalq Məktəbi</p>
  </div>
  <p class="vac-loc">Bakı, Yasamal r.</p>
  <p class="vac-salary">1200 – 1600 AZN</p>
  <span class="chip chip--static">Tam ştat</span>
  <a class="btn-ghost btn-sm" href="vakansiya.html">Müraciət et</a>
</article>
```

**Structural.** One flat flex row — no inner wrappers except `.vac-main`, which is
the only `flex: 1 1 240px` growing cell and is what holds the title + organisation
pair. Order is the layout; there is no grid. `.vac-icon` variants:
`.vac-icon--info`, `.vac-icon--ok`, `.vac-icon--kg`.

`.vac-row .chip` and `.vac-row .btn-ghost` are pinned to `flex:none` by descendant
rules, so the chip and the button must be **direct children** of `.vac-row`.
Consecutive rows self-space through `.vac-row + .vac-row { margin-top:12px }` — put
them in a plain `<div>`, not a `.grid-*`.

Responsive: at ≤768px the row wraps, `.vac-main` goes full width and the button
becomes full-width; at ≤560px `.vac-loc` is `display:none`. Never put load-bearing
information only in `.vac-loc`.

**Content.** Everything. Use `.chip--static` for the non-interactive contract-type
chip so it does not get a hover state.

---

## 9. News card · announcement row · blog cards

### 9a. `.news-card`

```html
<a class="news-card" href="xeber.html">
  <span class="news-thumb" aria-hidden="true"></span>
  <span class="news-title">Yeni tədris ilində məktəblərdə hansı yeniliklər olacaq?</span>
  <span class="news-date">12 iyul 2026</span>
</a>
```

`.news-thumb` is `position:relative; overflow:hidden` with a flat `--line-2`
placeholder background, and accepts a real `<img>` (`.news-thumb img` is
absolutely positioned and `object-fit:cover`). **Do not put `.g1…g6` on it.**
Those rules are declared at line 1058 of the stylesheet and `.news-thumb`'s own
`background` at line 1994 — equal specificity, later wins, so the gradient is
silently discarded. `.g1…g6` only take effect on `.ecard-media`, which is
declared *before* them. `.news-title` is the `flex:1` cell — it must be the middle
child. `.news-date` is `display:none` below 560px, so never put the only date there
if it matters. Rows self-space with `.news-card + .news-card`.

### 9b. `.ann-row`

```html
<a class="ann-row" href="elan.html">
  <span class="ann-body">
    <span class="ann-title">Məktəbimizə ibtidai sinif müəllimi tələb olunur</span>
    <span class="ann-meta">Zəka Beynəlxalq Məktəbi · Bakı, Yasamal r.</span>
  </span>
  <span class="ann-date">11 iyul 2026</span>
</a>
```

`.ann-body` is required — it is the `flex:1; min-width:0` cell that lets the title
truncate instead of pushing the date off the row. `.ann-date` is hidden ≤560px.

### 9c. `.blog-list` + `.blog-card`

```html
<div class="blog-list">
  <a class="blog-card" href="blog.html">
    <span class="blog-num" aria-hidden="true">01</span>
    <span class="blog-body">
      <span class="blog-cat">Tərbiyə</span>
      <span class="blog-title">Uşaqların yaradıcılıq qabiliyyətini necə inkişaf etdirmək olar?</span>
      <span class="blog-meta">9 iyul · 5 dəq oxu</span>
    </span>
    <span class="blog-thumb" aria-hidden="true"></span>
  </a>
</div>
```

`.blog-card` draws its own separator with `border-bottom`, zeroed on `:last-child` —
so the cards must be **direct children of `.blog-list`** with nothing between them.
`.blog-body` is the `flex:1` cell. `.blog-num` is hidden ≤560px. `.blog-thumb` has
the same cascade caveat as `.news-thumb`: `.g1…g6` will not apply to it, only a
flat placeholder or an `<img>`.

### 9d. Featured blog card

```html
<a class="blog-card blog-card--feature" href="blog.html">
  <span class="blog-feature-veil" aria-hidden="true"></span>
  <span class="blog-feature-tag">
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.2-4.1 5.8-.8z"/></svg>
    Redaktor seçimi
  </span>
  <span class="blog-feature-body">
    <span class="blog-feature-cat">Psixologiya <span>8 dəq oxu</span></span>
    <span class="blog-feature-title">Uşağınız üçün doğru məktəbi seçməyin 7 elmi meyarı</span>
    <span class="blog-feature-desc">Təhsil psixoloqları ilə birgə hazırladığımız bələdçi: uşağın xarakteri, ailənin gündəlik ritmi və müəssisənin metodikası arasında balansı necə tapmalı.</span>
    <span class="blog-feature-author">Nərmin Əliyeva <span class="meta-line">10 iyul 2026</span></span>
  </span>
</a>
```

`.blog-card--feature` **must** keep the base `.blog-card` class (the modifier only
overrides). It resets to `display:block` and paints a dark gradient, so an
`<img class="blog-feature-img">` is optional. `.blog-feature-veil` is the required
absolute scrim between the image and the text. `.blog-feature-body` is absolutely
pinned to the bottom — all four text spans go inside it.
`.blog-feature-cat span` and `.blog-feature-author .meta-line` are styled by
descendant rules, so the secondary bits are nested spans, not siblings.
`.blog-feature-desc` is hidden ≤768px.

---

## 10. FAQ

```html
<div class="faq-list">

  <div class="faq-item is-open">
    <button class="faq-q" type="button" id="faq-q-1" aria-expanded="true" aria-controls="faq-panel-1">
      <span class="faq-n" aria-hidden="true">01</span>
      <span class="faq-q-text">EduNav-dan istifadə valideynlər üçün pulludur?</span>
      <span class="faq-icon" aria-hidden="true">
        <svg class="faq-icon-plus" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 5v14M5 12h14"/></svg>
        <svg class="faq-icon-bar" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 12h14"/></svg>
      </span>
    </button>
    <div class="faq-a" id="faq-panel-1" role="region" aria-labelledby="faq-q-1">
      <div class="faq-a-inner">
        <p>Xeyr. Məktəb və bağçaların axtarışı, müqayisəsi, qəbul tarixlərinin izlənməsi və müraciət göndərilməsi valideynlər üçün tamamilə pulsuzdur. Platformanı müəssisələrin profil və reklam abunələri maliyyələşdirir.</p>
      </div>
    </div>
  </div>

  <div class="faq-item">
    <button class="faq-q" type="button" id="faq-q-2" aria-expanded="false" aria-controls="faq-panel-2"> … </button>
    <div class="faq-a" id="faq-panel-2" role="region" aria-labelledby="faq-q-2" hidden> … </div>
  </div>

  <p class="faq-foot">Sualınızın cavabını tapmadınız? <a class="btn-ghost btn-sm" href="elaqe.html">Bizə yazın</a></p>
</div>
```

**Structural.** `.faq-list` is the bordered card; `.faq-item` draws the separator
with `border-bottom` (zeroed on `:last-child`), so items are direct children.
Each item is exactly `button.faq-q` + `div.faq-a`.

`.faq-q` is `align-items: flex-start` with three children: `.faq-n` (fixed 24px,
hidden ≤560px), `.faq-q-text` (the growing cell — **required**, a bare text node
will not wrap correctly), `.faq-icon`.

`.faq-icon` needs **both** SVGs: `.faq-icon-plus` and `.faq-icon-bar`. The stylesheet
ships `.faq-icon .faq-icon-bar { display:none }` and swaps them under
`.faq-item.is-open` — a single rotating icon will not work.

`.faq-a` is `display:none` and becomes `display:block` + `edu-faq-in` only via
`.faq-item.is-open .faq-a`, i.e. **`.is-open` lands on `.faq-item`**, not on the
button or the panel. `.faq-a-inner` is required: it draws the yellow left rule with
`::before` and supplies the indent. `.faq-a p` is styled by descendant rule, so wrap
prose in `<p>`.

**ARIA.** Author `id` + `aria-controls` + `aria-expanded` on the button and
`role="region"` + `aria-labelledby` + `hidden` on the panel. `Faq.init()` re-stamps
all of them and will generate ids if you omit them, but authoring them keeps the
page correct with JS off. Only one item may start with `.is-open` /
`aria-expanded="true"`; if none does, JS opens the first.

Optional support panel beside it: `.faq-side` → `.faq-support` →
`.faq-support-inner` → `.faq-support-title` / `.faq-support-text` /
`.faq-support-actions`. `.faq-support` draws the giant `?` with `::before` — do not
author it. `.faq-support-inner` is required to lift the text above it.

---

## 11. Page head (inner pages)

```html
<div class="page-head">
  <div class="container">
    <nav aria-label="Səhifə yolu">
      <ol class="crumbs">
        <li><a href="index.html">Ana səhifə</a></li>
        <li><a href="mekteblar.html">Məktəblər</a></li>
        <li><span aria-current="page">Zəka Beynəlxalq Məktəbi</span></li>
      </ol>
    </nav>
    <span class="kicker">Kataloq</span>
    <h1 class="h1">Məktəblər</h1>
    <p class="lead">Bakı və regionlarda 1 240 müəssisə — kurikulum, tədris dili və illik ödənişə görə süzün.</p>
  </div>
</div>
```

**Structural.** `.page-head` is a full-bleed band (`40px 0 28px`, gradient +
bottom border) that lives **between `</header>` and the first `.section`**, not
inside `<main>`'s container — put a `.container` inside it. It stays compact;
never turn it into a full-screen hero.

`.page-head .kicker`, `.page-head .h1` and `.page-head .lead` are all descendant
overrides, so those three classes only get their page-head sizing while inside it.
`.page-head--plain` removes the gradient.

`.crumbs` is a **list** — the stylesheet styles `.crumbs li` and draws the dot
separator with `.crumbs li + li::before`, so a flat set of `<a>`s gets no
separators. The last crumb is a `<span aria-current="page">`, not a link;
`.crumbs [aria-current="page"]` is what darkens it. Wrap the list in a
`<nav aria-label="Səhifə yolu">`.

---

## 12. AI wizard (the markup `app.js` drives)

```html
<div class="banner-soft" data-wizard>
  <div class="banner-inner">
    <div class="banner-copy">
      <span class="kicker kicker--kg">EduNav süni intellekt</span>
      <h2 class="banner-title">Süni intellekt ilə övladınız üçün <em>doğru seçimi</em> edin</h2>
      <p class="banner-text">4 sual cavablandırın — ən uyğun 5 müəssisəni sizin üçün seçək.</p>

      <div class="wiz-nav">
        <span class="wiz-step" data-wizard-step-label>Sual 1 / 4</span>
        <span class="badge badge--brand">Tamamilə pulsuz</span>
      </div>
      <div class="wz-track" role="progressbar" aria-label="Anketin gedişi" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
        <span class="wz-bar" data-wizard-progress></span>
      </div>

      <div data-wizard-ask>
        <p class="wiz-q" data-wizard-question>Kimin üçün axtarırsınız?</p>
        <div class="wiz-opts" data-wizard-options></div>
        <div class="wiz-nav">
          <button class="wiz-back" type="button" data-wizard-back hidden>← Geri</button>
        </div>
      </div>

      <div data-wizard-result hidden>
        <div class="wiz-result-head">
          <span class="wiz-result-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m5 12.8 4.4 4.4L19 7.2"/></svg>
          </span>
          <p class="wiz-result-title" data-wizard-count>5 uyğun müəssisə tapıldı</p>
        </div>
        <p class="wiz-summary" data-wizard-summary></p>
        <div class="wiz-matches" data-wizard-results></div>
        <div class="wiz-actions">
          <a class="btn-brand" href="mekteblar.html">Nəticələrə bax</a>
          <button class="wiz-back" type="button" data-wizard-restart>Yenidən</button>
        </div>
      </div>
    </div>
  </div>
</div>
```

**Structural — and this is the trap.** There are **two** wizard vocabularies:

* `.wiz-*` — the *authored* shell: `.wiz-q`, `.wiz-opts`, `.wiz-nav`, `.wiz-back`,
  `.wiz-step`, `.wiz-result-head`, `.wiz-result-icon`, `.wiz-result-title`,
  `.wiz-summary`, `.wiz-matches`, `.wiz-actions`. You write these.
* `.wz-*` — what **`Wizard.render()` creates at runtime** and you must never
  author: `button.wz-opt` (one per `STEPS[i].opts`, injected into
  `[data-wizard-options]`) and
  `div.wz-row > span.wz-mono + span.wz-info(span.wz-name, span.wz-meta) + span.wz-price`
  (one per `MATCHES`, injected into `[data-wizard-results]`).
  `.wz-mono` receives `--wz-bg` / `--wz-fg` as custom properties from JS.

So `[data-wizard-options]` should carry `.wiz-opts` (the 2-column grid) and
`[data-wizard-results]` should carry `.wiz-matches` (the 9px column stack); the
children arrive already classed.

`[data-wizard]` is the root and every other hook is looked up **inside it**.
`[data-wizard-ask]` and `[data-wizard-result]` are toggled with the `hidden`
property — author `hidden` on the result block. `[data-wizard-back]` is hidden and
disabled at step 0 by JS. `[data-wizard-progress]` receives `--wz-progress`
(a percentage string), which is why the bar is `.wz-bar` with
`width: var(--wz-progress, 0%)` and its track is `.wz-track`; JS also stamps the
`role="progressbar"` / `aria-value*` set onto the nearest `[role="progressbar"]`
ancestor, so put that role on `.wz-track`.

`[data-wizard-results]` is filled once and then marked `data-wizard-rendered` — do
not pre-fill it. `[data-wizard-open]` may live **anywhere on the page**; if the
wizard sits inside a `.modal`, that button opens the modal, otherwise it scrolls
the wizard into view.

State is persisted to `localStorage.edunav_survey` in the same shape the survey
modal (PARTIALS block 5) uses, so a visitor who answered in the modal lands on the
result view here.

**Content.** Questions and options are **not** content — they come from `STEPS` in
`app.js`. Everything else (kicker, title, badge, CTA) is yours.

---

## 13. Ad rail

```html
<aside class="ad-rail ad-rail--left" aria-label="Reklam">
  <div class="ad-card">
    <span class="ad-kicker">Qəbul açıqdır</span>
    <p class="ad-title">Zəka Beynəlxalq Məktəbi</p>
    <p class="ad-text">IB proqramı, üç dildə tədris. 2026/2027 tədris ili üçün müraciətlər başladı.</p>
    <a class="ad-link" href="mekteb.html">Ətraflı bax</a>
  </div>
  <div class="ad-card"> … İlk ay 50% / Balaca Ulduzlar Bağçası … </div>
  <div class="ad-card"> … Yeni kurs / STEM Liseyi robotexnika … </div>
</aside>
<aside class="ad-rail ad-rail--right" aria-label="Reklam"> … 3 more .ad-card … </aside>
```

**Structural.** `.ad-rail` is `display:none` by default; **everything else about it
lives inside `@media (min-width: 1736px)`** — so at any normal viewport the whole
block including `.ad-card` is unstyled and invisible. Do not test it below 1736px
and conclude it is broken.

Above that width the rail becomes a `position:fixed`, 244px, single-cell grid, and
the three cards are stacked in the same `grid-area: 1 / 1` and cross-faded by
`edu-ad-fade` with `nth-child` delays of 0 / 5.2 / 10.4 s. **Exactly three
`.ad-card` children**, direct, with no wrapper — a fourth never appears.

Vertical position comes from `--ad-top` (default `88px`). Page JS clamps the rail
above the footer by setting that custom property on the rail; there is no inline
`style` in the authored HTML.

Under `prefers-reduced-motion` the stylesheet hides cards 2 and 3 and shows only the
first, so each card must stand alone.

Place the two rails as **siblings of `<main>`**, just before the footer.
Homepage, catalogue and article pages only — never on admin, auth or form pages.

---

## 14. Compare bar

Use **PARTIALS.md block 4 verbatim.** Cross-checked against the stylesheet and
`app.js`; the block is correct as shipped. Notes an author needs:

* `.compare-bar` is the fixed shell. `.compare-bar-inner` also carries
  `.container`, and the stylesheet deliberately neutralises the container's
  `max-width`/`margin`/`padding` — keep **both** classes on that div.
* Hidden state is `opacity:0; visibility:hidden; pointer-events:none`; JS only
  toggles `.is-on` and flips `aria-hidden`.
* `.cb-avatars` is filled by JS with `span.cb-avatar` children. The stylesheet
  styles them through `.cb-avatars > *`, so **`.cb-avatar` has no rule of its own** —
  that is intentional, not a gap. The container is `aria-hidden`; the count carries
  the meaning.
* `.cb-count` is the yellow number chip, `.cb-hint` the "Maksimum 4 müəssisə" line
  (a block-level span inside `.cb-text`). `Compare.flashFull()` temporarily
  rewrites `.cb-hint` and adds `.compare-bar.is-full` (no CSS rule — the text change
  is the feedback).
* Omit the block on `muqayise.html` only. If a page has `[data-compare-toggle]` but
  no bar markup, `Compare.build()` creates an equivalent bar at runtime (without the
  `[data-cb-hide]` close button).
* `body.has-compare-bar` reserves the bar's height while it is visible.

---

## 15. Forms

```html
<form class="form-grid" id="form-apply" data-validate novalidate>

  <div class="field">
    <label class="field-label" for="ap-name">Ad, Soyad <span class="req">*</span></label>
    <input class="input" id="ap-name" name="name" type="text" autocomplete="name" placeholder="Rasif Dünyamalı" required>
    <p class="field-error" data-error-for="ap-name" hidden>Adınızı yazın.</p>
  </div>

  <div class="field">
    <label class="field-label" for="ap-phone">Telefon</label>
    <input class="input" id="ap-phone" name="phone" type="tel" autocomplete="tel" placeholder="+994 50 000 00 00" required>
    <p class="field-hint">Yalnız müəssisə görəcək.</p>
    <p class="field-error" data-error-for="ap-phone" hidden>Telefon nömrəsini yazın.</p>
  </div>

  <div class="field">
    <label class="field-label" id="ap-rayon-label">Rayon</label>
    <div class="dd" data-name="rayon" data-labelledby="ap-rayon-label" data-placeholder="Rayon seçin"> … </div>
  </div>

  <div class="field field-full">
    <label class="field-label" for="ap-note">Qeyd</label>
    <textarea class="textarea" id="ap-note" name="note" rows="4" placeholder="Sualınızı yazın." data-min="12"></textarea>
    <p class="field-error" data-error-for="ap-note" hidden>Ən azı 12 simvol daxil edin.</p>
  </div>

  <div class="field field-full">
    <label class="switch">
      <input type="checkbox" name="notify" checked>
      <span class="switch-track" aria-hidden="true"></span>
      <span class="switch-label">Yeni vakansiyalar barədə bildiriş alım</span>
    </label>
  </div>

  <div class="field field-full">
    <label class="check">
      <input type="checkbox" name="terms" required>
      <span>İstifadə qaydaları ilə razıyam.</span>
    </label>
    <p class="field-error" data-error-for="ap-terms" hidden>Davam etmək üçün təsdiqləyin.</p>
  </div>

  <div class="field field-full field-row">
    <button class="btn-brand" type="submit">Göndər</button>
    <button class="btn-ghost" type="reset">Təmizlə</button>
  </div>
</form>

<div class="modal-success" data-form-success hidden> … </div>
```

**Structural.** `.field` is the mandatory wrapper: it is the 7px-gap column **and**
the scope `Forms.fieldOf()` uses (`closest('.field')`) to find or create the
`.field-error`. A control outside a `.field` gets its error appended to its raw
parent. `.field-error` is `display:none` and is shown by **either** `.is-on` on
itself **or** `.has-error` on the `.field` — JS sets both `has-error` (on control and
field) and `hidden=false`. Author it with `hidden`.

`.form-grid` is a 2-column grid; `.field-full` spans it and only works **inside**
`.form-grid` (`.form-grid .field-full { grid-column: 1 / -1 }`). `.field-row` is a
horizontal flex row for button pairs. `.field-label .req` paints the red asterisk.

`.input` and `.textarea` share every rule; `.textarea` adds `min-height:132px`.
Error styling is `.input.has-error` / `.textarea.has-error` — on the **control**,
which JS adds alongside the field class.

`.switch` is a `<label>` wrapping three things in this exact order:
`input[type=checkbox]` (visually hidden but focusable), `span.switch-track`,
`span.switch-label`. The knob is `.switch-track::after`; the checked and focus
states are adjacent-sibling selectors (`input:checked + .switch-track`), so the
track must **immediately follow** the input. `.check` is the plain checkbox/radio
row and uses `accent-color`.

A `.dd` inside a `.field` replaces a `<select>`; label it with
`data-labelledby` pointing at the `.field-label` id (a `<label for>` cannot target a
div).

**Validation.** `data-validate` (or `data-form="name"`) turns the form on. Messages:
`required`, `check`, `email`, `tel` (9–15 digits), `min` (`data-min` or `minlength`),
`match` (`data-match="#selector"`). Override any of them per control with
`data-error`. On a valid submit, if the form has a sibling `[data-form-success]` or
`[data-modal-success]` (or `data-success="sel"` on the form), the form is hidden and
the panel is shown and focused — nothing is posted. Never `alert()`.

---

## 16. Misc

### Buttons

```html
<a class="btn-brand" href="#x">Müəssisə əlavə et</a>
<a class="btn-ghost" href="#x">Daxil ol</a>
<button class="btn-dark" type="button">Axtar</button>
<a class="btn-pill" href="#x">Kəşf et</a>
<a class="btn-pill btn-pill--dark" href="#x">Kəşf et</a>
<a class="btn-pill btn-pill--kg" href="#x">Kəşf et</a>
<button class="btn-ghost btn-sm" type="button">Müraciət et</button>
<button class="btn-brand btn-block" type="button">Göndər</button>
<button class="btn-brand" type="button" disabled>Göndər</button>
<button class="btn-icon" type="button" aria-label="Paylaş"> <svg …/> </button>
```

`.btn-sm` and `.btn-block` are size modifiers — always combined with a base class,
never alone. `.btn-pill--dark` / `--kg` only modify `.btn-pill`. `[disabled]` and
`.is-disabled` are equivalent. Every base class sizes its own `svg` to 14px
(13px under `.btn-sm`), so put the icon inside as a sibling of the text.
`.btn-icon` is the square 34px icon-only button and needs an `aria-label`.

### Badges and chips

```html
<span class="badge">Baza</span>
<span class="badge badge--ok">Aktiv</span>
<span class="badge badge--warn">Gözləyir</span>
<span class="badge badge--danger">Rədd edildi</span>
<span class="badge badge--info">Yeni</span>
<span class="badge badge--brand">Premium</span>
<span class="badge badge--dark">Arxiv</span>
<span class="badge badge--pill badge--ok">Təsdiqlənib</span>

<div class="chip-row">
  <button class="chip is-on" type="button" data-filter-chip data-filter="rayon" data-value="">Hamısı</button>
  <button class="chip" type="button" data-filter-chip data-filter="rayon" data-value="Nəsimi">Nəsimi</button>
  <a class="chip chip--outline" href="suallar.html">Suallar</a>
  <span class="chip chip--sm chip--static">Tam ştat</span>
</div>
```

`.chip` is a `<button>`, `<a>` or `<span>`. `.is-on` is the selected state (dark
fill) — JS owns it on filter chips and survey chips. `.chip--static` removes the
hover for non-interactive chips. `.chip-row` is the wrapping 8px flex row.

### Pager

```html
<nav class="pager" aria-label="Səhifələr">
  <button class="pager-btn" type="button" disabled aria-label="Əvvəlki"> <svg …/> </button>
  <button class="pager-btn is-active" type="button" aria-current="page">1</button>
  <button class="pager-btn" type="button">2</button>
  <span class="pager-gap" aria-hidden="true">…</span>
  <button class="pager-btn" type="button">12</button>
  <button class="pager-btn" type="button" aria-label="Növbəti"> <svg …/> </button>
</nav>
```

`.is-active` is the current page; `.pager-gap` is the ellipsis cell.

### Empty state

```html
<div class="empty-state" data-empty hidden>
  <span class="empty-state-icon" aria-hidden="true">
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg>
  </span>
  <h3>Nəticə tapılmadı</h3>
  <p>Filtri dəyişib yenidən cəhd edin.</p>
  <button class="btn-ghost btn-sm" type="button" data-filter-reset>Filtri sıfırla</button>
</div>
```

The `h3` and `p` are styled by **element** selectors (`.empty-state h3`,
`.empty-state p`) — do not add classes, and do not use other heading levels.
Catalogue looks for `.empty-state` (or `[data-empty]`) **inside `[data-catalogue]`**
and toggles its `hidden`; author it `hidden`.

### Tabs

```html
<div class="tabs" role="tablist" aria-label="Profil bölmələri">
  <button class="tab is-active" type="button" role="tab" id="tab-1" aria-selected="true" aria-controls="panel-1">Ümumi</button>
  <button class="tab" type="button" role="tab" id="tab-2" aria-selected="false" aria-controls="panel-2" tabindex="-1">Qiymətlər</button>
</div>
<div class="tab-panel is-active" id="panel-1" role="tabpanel" aria-labelledby="tab-1"> … </div>
<div class="tab-panel" id="panel-2" role="tabpanel" aria-labelledby="tab-2" hidden> … </div>
```

`.tab.is-active::after` is the yellow underline — supplied by CSS, never authored.
`.tab-panel` is `display:none` until `.is-active`. **`app.js` does not implement
tabs** — wire them in a page script, or ship them as anchors.

### Stats

```html
<div class="stat-row stat-row--boxed">
  <div class="stat">
    <span class="stat-num">1 240</span>
    <span class="stat-label">Qeydiyyatdan keçmiş müəssisə</span>
  </div>
</div>
```

`.stat-row` auto-fits at 170px; `--boxed` adds the card border to each `.stat`.

### Avatar and rating

```html
<div class="avatar-stack">
  <span class="avatar avatar--brand">RD</span>
  <span class="avatar avatar--dark">NƏ</span>
  <span class="avatar avatar--sm">ZM</span>
</div>
<span class="avatar avatar--lg"><img src="…" alt="Rasif Dünyamalı"></span>

<span class="rating">
  <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.2-4.1 5.8-.8z"/></svg>
  4.8 <span class="rating-count">· 126 rəy</span>
</span>
```

`.avatar` is `overflow:hidden` with an absolutely-positioned `img`, so initials and
a photo use the same element. `.avatar-stack .avatar` gets a white ring and −13px
overlap. `.rating svg` is filled `--brand` **by the stylesheet** — the star must
therefore be a closed path and must **not** carry `fill="none"` (the one exception
to the icon rule).

### Table

```html
<div class="table-wrap">
  <table class="table">
    <caption class="sr-only">Müəssisələrin müqayisəsi</caption>
    <thead><tr><th scope="col">Ad</th><th scope="col">Rayon</th><th scope="col">Qiymət</th></tr></thead>
    <tbody><tr><td><strong>Zəka Beynəlxalq Məktəbi</strong></td><td>Nəsimi</td><td>12 000 AZN</td></tr></tbody>
  </table>
</div>
```

`.table-wrap` is the required scroll shell (`overflow-x:auto` + border + radius);
`.table` has `min-width:620px` (560px ≤560px) and would otherwise blow the page
width. `thead th` is sticky against the wrapper. Cells and hover are element
selectors — do not add classes.

### Grids

`.grid-2` / `.grid-3` / `.grid-4` are explicit `repeat(N, minmax(0,1fr))` with a
20px gap, stepping 4→3 at 1024px, 3/4→2 at 768px, all→1 at 560px. `.grid-fluid` is
the opt-in `auto-fit` version, `.grid-gap-lg` bumps the gap, `.grid-span-2` /
`.grid-span-all` promote a child. `.grid-aside` is the `1fr / 320px` page shell
that collapses at 1024px. Sections use `.section`, `.section--tight`,
`.section--flush`, and `.section--last` on the last one before the footer.

### Modal

Use **PARTIALS.md block 5 verbatim** for `contact` / `survey` / `guest`. For a new
modal the required tree is:

```html
<div class="modal" data-modal="apply" role="dialog" aria-modal="true" aria-labelledby="modal-apply-title" aria-hidden="true">
  <div class="modal-backdrop" data-modal-close aria-hidden="true"></div>
  <div class="modal-panel">
    <div class="modal-head">
      <span class="modal-icon" aria-hidden="true"> <svg …/> </span>
      <div class="modal-head-text">
        <h2 class="modal-title" id="modal-apply-title">Müraciət</h2>
        <p class="modal-sub">Anketi doldurun.</p>
      </div>
      <button class="modal-close" type="button" data-modal-close aria-label="Pəncərəni bağla"> <svg …/> </button>
    </div>
    <div class="modal-body"> … </div>
    <div class="modal-foot">
      <button class="btn-ghost" type="button" data-modal-close>İmtina</button>
      <button class="btn-brand" type="submit" form="form-apply">Göndər</button>
    </div>
  </div>
</div>
```

`.modal` is the fixed centring flex shell; `.modal-panel` (`z-index:1`) is the only
thing above `.modal-backdrop`, and the body's scroll lives on `.modal-body`
(`flex:1; overflow-y:auto`) so head and foot stay pinned. `.modal-head-text` is
required to keep the title block from stretching. `.modal-icon` is optional.
`.modal-panel--wide` widens to 720px. Below 560px the panel becomes a bottom sheet
and `.modal-foot` reverses to a column — so put the primary action **last** in
source order. Opening is `[data-open="apply"]`; JS handles ESC, backdrop,
focus trap, scroll lock and focus restore. `[data-autofocus]` overrides the
initial focus target.

### Reveal

```html
<div class="grid-4" data-reveal>…</div>
<article class="ecard" data-reveal data-reveal-delay="120">…</article>
```

`[data-reveal]` starts hidden and gets `.is-in` from the IntersectionObserver.
`data-reveal-delay` is milliseconds. With JS off nothing is hidden
(`html:not(.js-ready) [data-reveal]`), so it is always safe. Never put it on
something above the fold that must be readable instantly, and never on the
`.compare-bar` or a `.modal`.

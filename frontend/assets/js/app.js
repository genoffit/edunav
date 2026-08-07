/* =============================================================================
   EduNav.az — public site behaviour
   -----------------------------------------------------------------------------
   One IIFE, strict mode, no dependencies, no build step.
   Every module is defensive: it no-ops cleanly when its DOM is absent, so this
   single file can be loaded by all 26 public pages.

   Modules (in boot order):
     Store · Motion  — shared helpers
     NavActive · YearStamp · Drawer · Modals · Dropdown · Reveal
     HeroWord · SearchHint · Faq · Favourites · Compare · Wizard
     Catalogue · Forms

   localStorage keys: edunav_compare (max 4) · edunav_fav · edunav_survey
   ============================================================================= */
(function () {
  'use strict';

  /* Flag JS as available before first paint so the stylesheet can hide
     [data-reveal] blocks only when they can actually be revealed again.
     With JS off nothing is hidden and every page stays readable. */
  document.documentElement.classList.add('js-ready');

  /* ===========================================================================
     DATA — copied verbatim from the Landing 3 export (component.js)
     =========================================================================== */

  var HERO_WORDS = ['gələcəyin', 'inkişafın', 'uğurun', 'peşəkarlığın'];

  var SEARCH_HINTS = [
    '«Zəka Beynəlxalq Məktəbi»',
    '«Nəsimi rayonu, 1–4 sinif»',
    '«İngilis dilli bağça»',
    '«IB proqramı olan lisey»'
  ];

  var STEPS = [
    { q: 'Kimin üçün axtarırsınız?', opts: ['Məktəb', 'Bağça', 'Bağça + məktəb', 'Hələ qərar verməmişəm'] },
    { q: 'Hansı şəhər və ya rayonda?', opts: ['Bakı, Nəsimi', 'Bakı, Yasamal', 'Bakı, Binəqədi', 'Digər şəhər'] },
    { q: 'Tədris dili hansı olsun?', opts: ['Azərbaycan', 'İngilis', 'Rus', 'İki dilli'] },
    { q: 'Büdcəniz nə qədərdir?', opts: ['Aylıq 400 AZN-ə qədər', 'Aylıq 400–800 AZN', 'İllik 10 000 AZN-ə qədər', 'Fərq etməz'] }
  ];

  var MATCHES = [
    { mono: 'ZM', name: 'Zəka Beynəlxalq Məktəbi', meta: 'Nəsimi · IB · İngilis, Rus', price: '12 000 AZN/il', bg: '#FDE8EC', fg: '#C2415C' },
    { mono: 'AK', name: 'Atlas Kolleci', meta: 'Yasamal · Cambridge · Hovuz', price: '9 800 AZN/il', bg: '#E9EEF6', fg: '#3C5878' },
    { mono: 'HS', name: 'Horizon School', meta: 'Binəqədi · Milli · İdman zalı', price: '8 500 AZN/il', bg: '#E4EEFF', fg: '#2C63C4' },
    { mono: 'AL', name: 'Alov Liseyi', meta: 'Nərimanov · Olimpiada hazırlığı', price: '6 900 AZN/il', bg: '#FFF1DC', fg: '#B87514' },
    { mono: 'ST', name: 'STEM Liseyi', meta: 'Sumqayıt · STEAM · IT Lab', price: '5 500 AZN/il', bg: '#FDE8E5', fg: '#C0492C' }
  ];

  var KEY_COMPARE = 'edunav_compare';
  var KEY_FAV = 'edunav_fav';
  var KEY_SURVEY = 'edunav_survey';
  var MAX_COMPARE = 4;

  var FOCUSABLE = 'a[href],area[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),' +
    'select:not([disabled]),textarea:not([disabled]),iframe,object,embed,summary,[contenteditable="true"],' +
    '[tabindex]:not([tabindex="-1"])';

  /* ===========================================================================
     HELPERS — tiny DOM/query utilities used by every module
     =========================================================================== */

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function on(el, type, fn, opts) {
    if (el && el.addEventListener) el.addEventListener(type, fn, opts || false);
  }

  function off(el, type, fn, opts) {
    if (el && el.removeEventListener) el.removeEventListener(type, fn, opts || false);
  }

  function attr(el, name, fallback) {
    if (!el) return fallback || '';
    var v = el.getAttribute(name);
    return v === null ? (fallback || '') : v;
  }

  function closest(el, sel) {
    if (!el) return null;
    if (el.closest) return el.closest(sel);
    var node = el;
    while (node && node.nodeType === 1) {
      if (node.matches && node.matches(sel)) return node;
      node = node.parentElement;
    }
    return null;
  }

  function fileName(path) {
    var clean = String(path || '').split('?')[0].split('#')[0];
    var parts = clean.split('/');
    var last = parts[parts.length - 1];
    return last === '' ? 'index.html' : last;
  }

  var CURRENT_PAGE = fileName(window.location.pathname);

  /* Focusable descendants that are actually rendered. */
  function focusables(root) {
    return $$(FOCUSABLE, root).filter(function (el) {
      if (el.hasAttribute('hidden')) return false;
      if (el.getAttribute('aria-hidden') === 'true') return false;
      return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    });
  }

  /* Azerbaijani-friendly folding so "Zəka" is found by typing "zeka". */
  var FOLD_FROM = 'əğıöşçüİıĞÖŞÇÜƏ';
  var FOLD_TO = 'egiosculiigoscue';

  function fold(text) {
    var s = String(text == null ? '' : text).toLowerCase();
    var out = '';
    for (var i = 0; i < s.length; i++) {
      var idx = FOLD_FROM.indexOf(s.charAt(i));
      out += idx > -1 ? FOLD_TO.charAt(idx) : s.charAt(i);
    }
    return out;
  }

  function toNumber(value) {
    var n = parseFloat(String(value == null ? '' : value).replace(/[^\d.,-]/g, '').replace(',', '.'));
    return isNaN(n) ? null : n;
  }

  /* 12000 → "12 000" (thin non-breaking grouping, matches the reference copy). */
  function groupNumber(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  /* ===========================================================================
     Store — localStorage wrapper that survives private mode / quota errors
     =========================================================================== */

  var Store = {
    getJSON: function (key, fallback) {
      try {
        var raw = window.localStorage.getItem(key);
        if (!raw) return fallback;
        var parsed = JSON.parse(raw);
        return parsed === null || typeof parsed === 'undefined' ? fallback : parsed;
      } catch (e) {
        return fallback;
      }
    },
    setJSON: function (key, value) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        return false;
      }
    },
    remove: function (key) {
      try { window.localStorage.removeItem(key); } catch (e) { /* ignore */ }
    },
    array: function (key) {
      var v = Store.getJSON(key, []);
      return Object.prototype.toString.call(v) === '[object Array]' ? v : [];
    }
  };

  /* ===========================================================================
     Motion — one place that answers "may I animate?" (prefers-reduced-motion)
     =========================================================================== */

  var Motion = {
    query: null,
    reduced: false,
    listeners: [],

    init: function () {
      if (!window.matchMedia) return;
      Motion.query = window.matchMedia('(prefers-reduced-motion: reduce)');
      Motion.reduced = !!Motion.query.matches;
      var handler = function () {
        Motion.reduced = !!Motion.query.matches;
        Motion.listeners.forEach(function (fn) { fn(Motion.reduced); });
      };
      if (Motion.query.addEventListener) Motion.query.addEventListener('change', handler);
      else if (Motion.query.addListener) Motion.query.addListener(handler);
    },

    onChange: function (fn) {
      if (typeof fn === 'function') Motion.listeners.push(fn);
    },

    /* setInterval that pauses while the tab is hidden and stops under
       prefers-reduced-motion. Returns a stop() function. */
    ticker: function (ms, fn) {
      var id = null;
      function start() {
        if (id !== null || Motion.reduced) return;
        id = window.setInterval(function () {
          if (document.hidden) return;
          fn();
        }, ms);
      }
      function stop() {
        if (id === null) return;
        window.clearInterval(id);
        id = null;
      }
      Motion.onChange(function (reduced) {
        if (reduced) stop(); else start();
      });
      on(document, 'visibilitychange', function () {
        if (document.hidden) stop(); else start();
      });
      start();
      return stop;
    }
  };

  /* ===========================================================================
     NavActive — mark the nav link that matches the current page
     Hooks: .nav-link, .drawer-link → .is-active + aria-current="page"
     =========================================================================== */

  var NavActive = {
    /* Detail pages light up their parent listing. */
    aliases: {
      'mekteb.html': 'mekteblar.html',
      'bagca.html': 'bagcalar.html',
      'vakansiya.html': 'vakansiyalar.html',
      'xeber.html': 'xeberler.html',
      'elan.html': 'elanlar.html',
      'blog.html': 'bloglar.html',
      'sebeke.html': 'sebekeler.html'
      /* muqayise / elaqe / suallar are NOT children of any nav item — aliasing
         them would announce aria-current="page" on a page the user is not on. */
    },

    init: function () {
      var links = $$('.nav-link, .drawer-link');
      if (!links.length) return;
      var target = NavActive.aliases[CURRENT_PAGE] || CURRENT_PAGE;

      links.forEach(function (link) {
        var href = link.getAttribute('href');
        if (!href || href.charAt(0) === '#') return;
        var match = fileName(href) === target;
        link.classList.toggle('is-active', match);
        if (match) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
    }
  };

  /* ===========================================================================
     YearStamp — fill [data-year] with the current year (footer copyright)
     =========================================================================== */

  var YearStamp = {
    /* A BARE `data-year` means "stamp me" (the footer copyright span).
       A VALUED `data-year="2008"` is card data that Catalogue sorts on — leave it
       alone. Without this split, stamping would wipe every card's contents down to
       the current year, silently and with no error. */
    init: function () {
      var nodes = $$('[data-year]');
      if (!nodes.length) return;
      var year = String(new Date().getFullYear());
      nodes.forEach(function (el) {
        if (el.getAttribute('data-year')) return;
        el.textContent = year;
      });
    }
  };

  /* ===========================================================================
     Drawer — .burger toggles the mobile .drawer
     Closes on: link click, backdrop click, [data-drawer-close], Esc, resize>768
     =========================================================================== */

  var Drawer = {
    el: null,
    burger: null,
    lastFocus: null,
    mq: null,

    isOpen: function () {
      return !!Drawer.el && Drawer.el.classList.contains('is-open');
    },

    open: function () {
      if (!Drawer.el || Drawer.isOpen()) return;
      Drawer.lastFocus = document.activeElement;
      Drawer.el.classList.add('is-open');
      Drawer.el.setAttribute('aria-hidden', 'false');
      document.body.classList.add('is-locked');
      if (Drawer.burger) {
        Drawer.burger.setAttribute('aria-expanded', 'true');
        Drawer.burger.classList.add('is-on');
      }
      var first = focusables(Drawer.el)[0];
      if (first) first.focus();
    },

    close: function (restoreFocus) {
      if (!Drawer.el || !Drawer.isOpen()) return;
      Drawer.el.classList.remove('is-open');
      Drawer.el.setAttribute('aria-hidden', 'true');
      if (!Modals.active) document.body.classList.remove('is-locked');
      if (Drawer.burger) {
        Drawer.burger.setAttribute('aria-expanded', 'false');
        Drawer.burger.classList.remove('is-on');
      }
      if (restoreFocus !== false && Drawer.lastFocus && Drawer.lastFocus.focus) Drawer.lastFocus.focus();
      Drawer.lastFocus = null;
    },

    toggle: function () {
      if (Drawer.isOpen()) Drawer.close(); else Drawer.open();
    },

    init: function () {
      Drawer.el = $('.drawer') || $('[data-drawer]');
      Drawer.burger = $('.burger') || $('[data-drawer-open]');
      if (!Drawer.el || !Drawer.burger) return;

      Drawer.el.setAttribute('aria-hidden', 'true');
      Drawer.burger.setAttribute('aria-expanded', 'false');
      if (!Drawer.burger.hasAttribute('aria-controls') && Drawer.el.id) {
        Drawer.burger.setAttribute('aria-controls', Drawer.el.id);
      }
      if (!Drawer.burger.hasAttribute('aria-label')) {
        Drawer.burger.setAttribute('aria-label', 'Menyu');
      }

      on(Drawer.burger, 'click', function (ev) {
        ev.preventDefault();
        Drawer.toggle();
      });

      $$('[data-drawer-close], .drawer-backdrop, .drawer-close', Drawer.el)
        .forEach(function (el) { on(el, 'click', function () { Drawer.close(); }); });

      $$('a[href]', Drawer.el).forEach(function (link) {
        on(link, 'click', function () { Drawer.close(false); });
      });

      /* Focus trap while open. */
      on(Drawer.el, 'keydown', function (ev) {
        if (ev.key !== 'Tab' || !Drawer.isOpen()) return;
        var items = focusables(Drawer.el);
        if (!items.length) return;
        var first = items[0];
        var last = items[items.length - 1];
        if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
        else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
      });

      on(document, 'keydown', function (ev) {
        if (ev.key === 'Escape' && Drawer.isOpen() && !Modals.active) {
          ev.preventDefault();
          Drawer.close();
        }
      });

      /* Above the 768px breakpoint the desktop nav is back — drop the drawer. */
      if (window.matchMedia) {
        Drawer.mq = window.matchMedia('(min-width: 769px)');
        var handler = function () { if (Drawer.mq.matches) Drawer.close(false); };
        if (Drawer.mq.addEventListener) Drawer.mq.addEventListener('change', handler);
        else if (Drawer.mq.addListener) Drawer.mq.addListener(handler);
      } else {
        on(window, 'resize', function () {
          if (window.innerWidth > 768) Drawer.close(false);
        });
      }
    }
  };

  /* ===========================================================================
     Modals — [data-open="x"] opens .modal[data-modal="x"]
     Esc + backdrop close · focus trap · body scroll lock · focus restored
     =========================================================================== */

  var Modals = {
    active: null,
    opener: null,

    get: function (name) {
      return $('.modal[data-modal="' + String(name).replace(/"/g, '') + '"]');
    },

    open: function (name, opener) {
      var modal = typeof name === 'string' ? Modals.get(name) : name;
      if (!modal) return null;
      if (Modals.active && Modals.active !== modal) Modals.close(Modals.active, false);

      Modals.opener = opener || document.activeElement;
      Modals.active = modal;
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      modal.removeAttribute('hidden');
      document.body.classList.add('is-locked');

      var panel = $('.modal-panel', modal) || modal;
      var preferred = $('[data-autofocus]', modal);
      var items = focusables(panel);
      var target = preferred || items[0] || panel;
      if (target === panel && !panel.hasAttribute('tabindex')) panel.setAttribute('tabindex', '-1');
      if (target && target.focus) target.focus();

      modal.dispatchEvent(new CustomEvent('modal:open', { bubbles: true }));
      return modal;
    },

    close: function (modal, restoreFocus) {
      modal = modal || Modals.active;
      if (!modal) return;
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      if (Modals.active === modal) Modals.active = null;
      if (!Modals.active && !Drawer.isOpen()) document.body.classList.remove('is-locked');
      if (restoreFocus !== false && Modals.opener && Modals.opener.focus) Modals.opener.focus();
      Modals.opener = null;
      modal.dispatchEvent(new CustomEvent('modal:close', { bubbles: true }));
    },

    init: function () {
      var modals = $$('.modal');

      $$('[data-open]').forEach(function (btn) {
        var name = attr(btn, 'data-open');
        if (!name || !Modals.get(name)) return;
        btn.setAttribute('aria-haspopup', 'dialog');
        on(btn, 'click', function (ev) {
          ev.preventDefault();
          Modals.open(name, btn);
        });
      });

      modals.forEach(function (modal) {
        if (!modal.hasAttribute('role')) modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        if (!modal.classList.contains('is-open')) modal.setAttribute('aria-hidden', 'true');

        /* `data-modal-close` is what PARTIALS.md ships on every İmtina button, so it
           must be listed here — binding only `data-close` left the visible Cancel
           button dead on all 40 pages (Esc and the backdrop still worked, which is
           exactly why it went unnoticed). */
        $$('[data-close], [data-modal-close], .modal-backdrop, .modal-close', modal).forEach(function (el) {
          on(el, 'click', function (ev) {
            ev.preventDefault();
            Modals.close(modal);
          });
        });

        /* Clicking the shell outside the panel closes too. */
        on(modal, 'mousedown', function (ev) {
          if (ev.target !== modal) return;
          Modals.close(modal);
        });
      });

      on(document, 'keydown', function (ev) {
        if (!Modals.active) return;
        if (ev.key === 'Escape') {
          ev.preventDefault();
          Modals.close();
          return;
        }
        if (ev.key !== 'Tab') return;
        var panel = $('.modal-panel', Modals.active) || Modals.active;
        var items = focusables(panel);
        if (!items.length) return;
        var first = items[0];
        var last = items[items.length - 1];
        if (ev.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
          ev.preventDefault();
          last.focus();
        } else if (!ev.shiftKey && document.activeElement === last) {
          ev.preventDefault();
          first.focus();
        }
      });

      /* Focus escaping the dialog (browser chrome, stray programmatic focus). */
      on(document, 'focusin', function (ev) {
        if (!Modals.active) return;
        if (Modals.active.contains(ev.target)) return;
        var items = focusables($('.modal-panel', Modals.active) || Modals.active);
        if (items.length) items[0].focus();
      });
    }
  };

  /* ===========================================================================
     Dropdown — custom .dd component (single choice and .dd-multi)
     Markup:
       .dd[data-dd][data-name][data-placeholder]  (add .dd-multi for multi-select)
         button.dd-trigger > span.dd-value
         .dd-list  > button.dd-option[data-value] > span.dd-label
         button.dd-clear (optional)
     Keyboard: Enter/Space open+select · ArrowUp/Down · Home/End · Esc · Tab
     Roving focus: the active .dd-option holds tabindex="0" and real DOM focus.
     Never rely on `all: unset` — the component only toggles classes, and the
     stylesheet must declare `box-sizing:border-box` on .dd, .dd-trigger and
     .dd-option (they are reset explicitly, not blanket-unset).
     Opens upward (.is-up) inside .searchbar or when there is no room below.
     Fires a bubbling `dd:change` CustomEvent { name, value, values, labels }.
     =========================================================================== */

  var Dropdown = {
    seq: 0,
    open: null,

    all: function () {
      var seen = [];
      $$('.dd, [data-dd]').forEach(function (el) {
        if (seen.indexOf(el) === -1) seen.push(el);
      });
      return seen;
    },

    options: function (dd) {
      return $$('.dd-option', dd);
    },

    isMulti: function (dd) {
      return dd.classList.contains('dd-multi');
    },

    /* --- open / close ------------------------------------------------- */

    placeUp: function (dd) {
      if (closest(dd, '.searchbar') || dd.hasAttribute('data-dd-up')) {
        dd.classList.add('is-up');
        return;
      }
      var trigger = $('.dd-trigger', dd);
      var list = $('.dd-list', dd);
      if (!trigger || !list) return;
      var rect = trigger.getBoundingClientRect();
      var viewport = window.innerHeight || document.documentElement.clientHeight;
      var needed = Math.min(list.scrollHeight || 240, 280) + 12;
      var below = viewport - rect.bottom;
      var above = rect.top;
      dd.classList.toggle('is-up', below < needed && above > below);
    },

    show: function (dd) {
      if (Dropdown.open && Dropdown.open !== dd) Dropdown.hide(Dropdown.open, false);
      dd.classList.add('is-open');
      var trigger = $('.dd-trigger', dd);
      if (trigger) trigger.setAttribute('aria-expanded', 'true');
      Dropdown.open = dd;
      Dropdown.placeUp(dd);

      var opts = Dropdown.options(dd);
      var active = $('.dd-option[aria-selected="true"]', dd) || opts[0];
      Dropdown.setActive(dd, active, true);
    },

    hide: function (dd, focusTrigger) {
      if (!dd) return;
      dd.classList.remove('is-open');
      dd.classList.remove('is-up');
      var trigger = $('.dd-trigger', dd);
      if (trigger) {
        trigger.setAttribute('aria-expanded', 'false');
        trigger.removeAttribute('aria-activedescendant');
        if (focusTrigger) trigger.focus();
      }
      if (Dropdown.open === dd) Dropdown.open = null;
    },

    /* --- roving focus --------------------------------------------------- */

    setActive: function (dd, option, moveFocus) {
      if (!option) return;
      Dropdown.options(dd).forEach(function (o) {
        var is = o === option;
        o.classList.toggle('is-active', is);
        o.setAttribute('tabindex', is ? '0' : '-1');
      });
      var trigger = $('.dd-trigger', dd);
      if (trigger && option.id) trigger.setAttribute('aria-activedescendant', option.id);
      if (moveFocus !== false) option.focus();

      var list = $('.dd-list', dd);
      if (!list) return;
      if (option.offsetTop < list.scrollTop) {
        list.scrollTop = option.offsetTop;
      } else if (option.offsetTop + option.offsetHeight > list.scrollTop + list.clientHeight) {
        list.scrollTop = option.offsetTop + option.offsetHeight - list.clientHeight;
      }
    },

    /* --- value plumbing -------------------------------------------------- */

    labelOf: function (option) {
      var label = $('.dd-label', option);
      return (label ? label.textContent : option.textContent).trim();
    },

    sync: function (dd, silent) {
      var selected = $$('.dd-option[aria-selected="true"]', dd);
      var labels = selected.map(Dropdown.labelOf);
      var values = selected.map(function (o) { return attr(o, 'data-value'); });

      var valueEl = $('.dd-value', dd);
      if (valueEl) {
        var placeholder = attr(valueEl, 'data-placeholder') || attr(dd, 'data-placeholder') || 'Seçin';
        if (!labels.length) {
          valueEl.textContent = placeholder;
          valueEl.classList.add('is-placeholder');
        } else if (labels.length === 1) {
          valueEl.textContent = labels[0];
          valueEl.classList.remove('is-placeholder');
        } else {
          valueEl.textContent = labels[0] + ' +' + (labels.length - 1);
          valueEl.classList.remove('is-placeholder');
        }
      }

      var joined = values.join(',');
      dd.setAttribute('data-value', joined);
      dd.classList.toggle('has-value', !!joined);

      var mirror = $('input[data-dd-input]', dd);
      if (mirror) {
        mirror.value = joined;
        mirror.disabled = !joined;
      }

      var clear = $('.dd-clear', dd);
      if (clear) clear.hidden = !joined;

      if (silent) return;
      dd.dispatchEvent(new CustomEvent('dd:change', {
        bubbles: true,
        detail: { name: attr(dd, 'data-name'), value: joined, values: values, labels: labels }
      }));
    },

    select: function (dd, option) {
      if (!option || option.hasAttribute('disabled')) return;
      if (Dropdown.isMulti(dd)) {
        var isOn = option.getAttribute('aria-selected') === 'true';
        option.setAttribute('aria-selected', isOn ? 'false' : 'true');
        Dropdown.sync(dd);
        return;
      }
      Dropdown.options(dd).forEach(function (o) { o.setAttribute('aria-selected', 'false'); });
      option.setAttribute('aria-selected', 'true');
      Dropdown.sync(dd);
      Dropdown.hide(dd, true);
    },

    clear: function (dd) {
      Dropdown.options(dd).forEach(function (o) { o.setAttribute('aria-selected', 'false'); });
      Dropdown.sync(dd);
    },

    /* Programmatic setter used by Catalogue when it restores URL state. */
    setValue: function (dd, wanted, silent) {
      var list = Object.prototype.toString.call(wanted) === '[object Array]'
        ? wanted
        : String(wanted == null ? '' : wanted).split(',');
      var multi = Dropdown.isMulti(dd);
      var taken = false;
      Dropdown.options(dd).forEach(function (o) {
        var hit = list.indexOf(attr(o, 'data-value')) > -1 && attr(o, 'data-value') !== '';
        if (hit && !multi) {
          hit = !taken;
          taken = true;
        }
        o.setAttribute('aria-selected', hit ? 'true' : 'false');
      });
      Dropdown.sync(dd, silent);
    },

    /* --- per-instance wiring --------------------------------------------- */

    initOne: function (dd) {
      if (dd.hasAttribute('data-dd-ready')) return;
      var trigger = $('.dd-trigger', dd);
      var list = $('.dd-list', dd);
      var opts = Dropdown.options(dd);
      if (!trigger || !opts.length) return;

      dd.setAttribute('data-dd-ready', '');
      dd.classList.add('is-ready');

      Dropdown.seq += 1;
      var base = 'dd-' + Dropdown.seq;
      if (!dd.id) dd.id = base;

      if (list) {
        list.setAttribute('role', 'listbox');
        if (!list.id) list.id = base + '-list';
        if (Dropdown.isMulti(dd)) list.setAttribute('aria-multiselectable', 'true');
        var labelledBy = attr(dd, 'data-labelledby');
        if (labelledBy) list.setAttribute('aria-labelledby', labelledBy);
        else if (attr(dd, 'data-label')) list.setAttribute('aria-label', attr(dd, 'data-label'));
      }

      trigger.setAttribute('type', 'button');
      trigger.setAttribute('aria-haspopup', 'listbox');
      trigger.setAttribute('aria-expanded', 'false');
      if (list) trigger.setAttribute('aria-controls', list.id);

      opts.forEach(function (o, i) {
        if (!o.id) o.id = base + '-opt-' + i;
        o.setAttribute('role', 'option');
        o.setAttribute('tabindex', '-1');
        if (o.tagName === 'BUTTON') o.setAttribute('type', 'button');
        if (!o.hasAttribute('aria-selected')) o.setAttribute('aria-selected', 'false');
        if (!o.hasAttribute('data-value')) o.setAttribute('data-value', Dropdown.labelOf(o));
        on(o, 'click', function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          Dropdown.select(dd, o);
        });
        on(o, 'mousemove', function () {
          if (document.activeElement !== o) Dropdown.setActive(dd, o, false);
        });
      });

      /* A dropdown inside a form must actually submit → hidden mirror input. */
      var form = closest(dd, 'form');
      var name = attr(dd, 'data-name');
      if (form && /^[A-Za-z][\w-]*$/.test(name)) {
        var mirror = $('input[data-dd-input]', dd);
        if (!mirror) {
          mirror = document.createElement('input');
          mirror.type = 'hidden';
          mirror.setAttribute('data-dd-input', '');
          dd.appendChild(mirror);
        }
        mirror.name = name;
        var initial = opts.map(function (o) { return o.getAttribute('aria-selected') === 'true'; });
        on(form, 'reset', function () {
          window.setTimeout(function () {
            opts.forEach(function (o, i) { o.setAttribute('aria-selected', initial[i] ? 'true' : 'false'); });
            Dropdown.sync(dd);
          }, 0);
        });
      }

      Dropdown.sync(dd, true);

      on(trigger, 'click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        if (dd.classList.contains('is-open')) Dropdown.hide(dd, true);
        else Dropdown.show(dd);
      });

      on(dd, 'keydown', function (ev) {
        var isOpen = dd.classList.contains('is-open');
        var key = ev.key;

        if (key === 'Tab') {
          if (isOpen) Dropdown.hide(dd, false);
          return;
        }

        if (!isOpen) {
          if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Enter' || key === ' ' || key === 'Spacebar') {
            ev.preventDefault();
            Dropdown.show(dd);
          }
          return;
        }

        var items = Dropdown.options(dd);
        var idx = items.indexOf($('.dd-option.is-active', dd));
        if (idx < 0) idx = 0;

        if (key === 'Escape') {
          ev.preventDefault();
          Dropdown.hide(dd, true);
        } else if (key === 'ArrowDown') {
          ev.preventDefault();
          Dropdown.setActive(dd, items[Math.min(items.length - 1, idx + 1)]);
        } else if (key === 'ArrowUp') {
          ev.preventDefault();
          Dropdown.setActive(dd, items[Math.max(0, idx - 1)]);
        } else if (key === 'Home') {
          ev.preventDefault();
          Dropdown.setActive(dd, items[0]);
        } else if (key === 'End') {
          ev.preventDefault();
          Dropdown.setActive(dd, items[items.length - 1]);
        } else if (key === 'Enter' || key === ' ' || key === 'Spacebar') {
          ev.preventDefault();
          Dropdown.select(dd, items[idx]);
        }
      });

      var clearBtn = $('.dd-clear', dd);
      if (clearBtn) {
        clearBtn.setAttribute('type', 'button');
        if (!clearBtn.hasAttribute('aria-label')) clearBtn.setAttribute('aria-label', 'Təmizlə');
        on(clearBtn, 'click', function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          Dropdown.clear(dd);
          trigger.focus();
        });
      }
    },

    init: function () {
      var list = Dropdown.all();
      if (!list.length) return;
      list.forEach(Dropdown.initOne);

      on(document, 'click', function (ev) {
        if (!Dropdown.open) return;
        if (!Dropdown.open.contains(ev.target)) Dropdown.hide(Dropdown.open, false);
      });

      on(window, 'resize', function () {
        if (Dropdown.open) Dropdown.hide(Dropdown.open, false);
      });

      on(window, 'scroll', function () {
        if (Dropdown.open) Dropdown.placeUp(Dropdown.open);
      }, { passive: true });
    }
  };

  /* ===========================================================================
     Reveal — IntersectionObserver adds .is-in to [data-reveal]
     Honours data-reveal-delay (ms). No observer / reduced motion → reveal now.
     =========================================================================== */

  var Reveal = {
    init: function () {
      var items = $$('[data-reveal]');
      if (!items.length) return;

      function showAll() {
        items.forEach(function (el) { el.classList.add('is-in'); });
      }

      if (Motion.reduced || typeof window.IntersectionObserver === 'undefined') {
        showAll();
        return;
      }

      var io = new window.IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          io.unobserve(el);
          var delay = parseInt(attr(el, 'data-reveal-delay', '0'), 10) || 0;
          if (delay > 0) window.setTimeout(function () { el.classList.add('is-in'); }, delay);
          else el.classList.add('is-in');
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

      items.forEach(function (el) { io.observe(el); });

      /* If the user flips the OS setting mid-visit, stop hiding content. */
      Motion.onChange(function (reduced) {
        if (!reduced) return;
        io.disconnect();
        showAll();
      });
    }
  };

  /* ===========================================================================
     HeroWord — rotate HERO_WORDS into .hero-word every 2.4s
     Re-triggers the edu-word-in animation by toggling .is-anim.
     Sets --hero-word-w so the headline does not reflow between words.
     =========================================================================== */

  var HeroWord = {
    init: function () {
      var el = $('.hero-word') || $('[data-hero-word]');
      if (!el) return;

      var words = HERO_WORDS.slice();
      var start = words.indexOf(el.textContent.trim());
      var index = start > -1 ? start : 0;

      var longest = words.reduce(function (a, b) { return b.length > a.length ? b : a; }, '');
      el.style.setProperty('--hero-word-w', (longest.length * 0.54).toFixed(2) + 'em');
      el.textContent = words[index];
      el.setAttribute('aria-live', 'off');

      if (Motion.reduced) return;

      Motion.ticker(2400, function () {
        index = (index + 1) % words.length;
        el.classList.remove('is-anim');
        /* Force a reflow so the animation restarts from frame 0. */
        void el.offsetWidth;
        el.textContent = words[index];
        el.classList.add('is-anim');
      });
    }
  };

  /* ===========================================================================
     SearchHint — rotate SEARCH_HINTS through the .searchbar placeholder
     Stops permanently once the field is focused or has text.
     Also mirrors the hint into [data-search-hint] when the markup has one.
     =========================================================================== */

  var SearchHint = {
    init: function () {
      var input = $('.searchbar input[type="text"], .searchbar input[type="search"]') || $('[data-search-input]');
      if (!input) return;

      var mirror = $('[data-search-hint]');
      var base = attr(input, 'data-placeholder') || input.getAttribute('placeholder') || '';
      var prefix = attr(input, 'data-hint-prefix', 'Axtarın: ');
      var index = 0;
      var stopped = false;
      var stopTicker = null;

      function paint() {
        var hint = SEARCH_HINTS[index];
        input.setAttribute('placeholder', prefix + hint);
        if (mirror) mirror.textContent = hint;
      }

      function stop() {
        if (stopped) return;
        stopped = true;
        if (stopTicker) stopTicker();
        input.setAttribute('placeholder', base);
        if (mirror) {
          mirror.textContent = '';
          mirror.hidden = true;
        }
      }

      if (input.value.trim()) {
        input.setAttribute('placeholder', base);
        return;
      }

      paint();
      on(input, 'focus', stop);
      on(input, 'input', function () { if (input.value) stop(); });

      if (Motion.reduced) return;

      stopTicker = Motion.ticker(2800, function () {
        if (stopped || input.value || document.activeElement === input) return;
        index = (index + 1) % SEARCH_HINTS.length;
        paint();
      });
    }
  };

  /* ===========================================================================
     Faq — accordion on .faq-item, one panel open at a time
     .faq-q button drives aria-expanded; .faq-a is the panel (edu-faq-in in CSS).
     =========================================================================== */

  var Faq = {
    init: function () {
      var items = $$('.faq-item');
      if (!items.length) return;

      var entries = [];

      items.forEach(function (item, i) {
        var button = $('.faq-q', item);
        var panel = $('.faq-a', item);
        if (!button || !panel) return;

        if (button.tagName === 'BUTTON') button.setAttribute('type', 'button');
        if (!panel.id) panel.id = 'faq-panel-' + (i + 1);
        if (!button.id) button.id = 'faq-q-' + (i + 1);
        button.setAttribute('aria-controls', panel.id);
        panel.setAttribute('role', 'region');
        panel.setAttribute('aria-labelledby', button.id);

        entries.push({ item: item, button: button, panel: panel });
      });

      if (!entries.length) return;

      function setOpen(target) {
        entries.forEach(function (e) {
          var isOpen = e === target;
          e.item.classList.toggle('is-open', isOpen);
          e.button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
          e.panel.hidden = !isOpen;
        });
      }

      /* Honour a pre-opened item in the markup, otherwise open the first. */
      var initial = null;
      entries.forEach(function (e) {
        if (!initial && (e.item.classList.contains('is-open') || e.button.getAttribute('aria-expanded') === 'true')) {
          initial = e;
        }
      });
      setOpen(initial || entries[0]);

      entries.forEach(function (e, i) {
        on(e.button, 'click', function (ev) {
          ev.preventDefault();
          setOpen(e.item.classList.contains('is-open') ? null : e);
        });
        on(e.button, 'keydown', function (ev) {
          var step = ev.key === 'ArrowDown' ? 1 : ev.key === 'ArrowUp' ? -1 : 0;
          if (step) {
            ev.preventDefault();
            entries[(i + step + entries.length) % entries.length].button.focus();
          } else if (ev.key === 'Home') {
            ev.preventDefault();
            entries[0].button.focus();
          } else if (ev.key === 'End') {
            ev.preventDefault();
            entries[entries.length - 1].button.focus();
          }
        });
      });
    }
  };

  /* ===========================================================================
     Favourites — [data-fav-toggle] ⇄ localStorage 'edunav_fav'
     Reads the id from the closest [data-id]. Paints .is-on + aria-pressed.
     [data-fav-count] shows the total, [data-fav-empty] the empty state.
     =========================================================================== */

  var Favourites = {
    ids: [],

    load: function () {
      Favourites.ids = Store.array(KEY_FAV).filter(function (v) { return typeof v === 'string' && v; });
      return Favourites.ids;
    },

    save: function () {
      Store.setJSON(KEY_FAV, Favourites.ids);
    },

    has: function (id) {
      return Favourites.ids.indexOf(id) > -1;
    },

    toggle: function (id) {
      if (!id) return false;
      var idx = Favourites.ids.indexOf(id);
      if (idx > -1) Favourites.ids.splice(idx, 1);
      else Favourites.ids.push(id);
      Favourites.save();
      Favourites.paint();
      return idx === -1;
    },

    paint: function () {
      $$('[data-fav-toggle]').forEach(function (btn) {
        var host = closest(btn, '[data-id]');
        var id = host ? attr(host, 'data-id') : attr(btn, 'data-fav-toggle');
        var isOn = !!id && Favourites.has(id);
        btn.classList.toggle('is-on', isOn);
        btn.setAttribute('aria-pressed', isOn ? 'true' : 'false');
        btn.setAttribute('aria-label', isOn ? 'Seçilmişlərdən çıxar' : 'Seçilmişlərə əlavə et');
        btn.setAttribute('title', isOn ? 'Seçilmişlərdən çıxar' : 'Seçilmişlərə əlavə et');
      });

      $$('[data-fav-count]').forEach(function (el) {
        el.textContent = String(Favourites.ids.length);
        el.classList.toggle('is-on', Favourites.ids.length > 0);
      });

      var empty = $('[data-fav-empty]');
      if (empty) empty.hidden = Favourites.ids.length > 0;
    },

    init: function () {
      var toggles = $$('[data-fav-toggle]');
      Favourites.load();
      if (!toggles.length && !$('[data-fav-count]') && !$('[data-fav-empty]')) return;

      toggles.forEach(function (btn) {
        if (btn.tagName === 'BUTTON') btn.setAttribute('type', 'button');
        on(btn, 'click', function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          var host = closest(btn, '[data-id]');
          var id = host ? attr(host, 'data-id') : attr(btn, 'data-fav-toggle');
          Favourites.toggle(id);
        });
      });

      Favourites.paint();
    }
  };

  /* ===========================================================================
     Compare — [data-compare-toggle] ⇄ localStorage 'edunav_compare' (max 4)
     Drives the fixed .compare-bar; the bar is created when a page has compare
     toggles but no markup for it. Hidden state is a class only — the stylesheet
     must hide it with opacity/visibility/pointer-events (translateY alone is
     not enough, the bar would still swallow clicks).
     'Müqayisə et' → muqayise.html · [data-cb-clear] empties the list.
     =========================================================================== */

  var Compare = {
    items: [],
    bar: null,
    dismissed: false,

    load: function () {
      var raw = Store.array(KEY_COMPARE);
      Compare.items = raw.filter(function (i) {
        return i && typeof i === 'object' && typeof i.id === 'string' && i.id;
      }).slice(0, MAX_COMPARE);
      return Compare.items;
    },

    save: function () {
      Store.setJSON(KEY_COMPARE, Compare.items);
    },

    has: function (id) {
      return Compare.items.some(function (i) { return i.id === id; });
    },

    read: function (host) {
      return {
        id: attr(host, 'data-id'),
        name: attr(host, 'data-name'),
        mono: attr(host, 'data-mono') || attr(host, 'data-name').slice(0, 2).toUpperCase(),
        type: attr(host, 'data-tip') || 'mekteb',
        meta: attr(host, 'data-meta'),
        price: attr(host, 'data-price'),
        grad: attr(host, 'data-grad') || 'g1',
        href: attr(host, 'data-href') || (attr(host, 'data-tip') === 'bagca' ? 'bagca.html' : 'mekteb.html')
      };
    },

    add: function (data) {
      if (!data || !data.id) return { ok: false, reason: 'noid' };
      if (Compare.has(data.id)) return { ok: true, added: false };
      if (Compare.items.length >= MAX_COMPARE) return { ok: false, reason: 'full' };
      Compare.items.push(data);
      Compare.dismissed = false;
      Compare.save();
      Compare.render();
      return { ok: true, added: true };
    },

    remove: function (id) {
      Compare.items = Compare.items.filter(function (i) { return i.id !== id; });
      Compare.save();
      Compare.render();
    },

    toggle: function (data) {
      if (Compare.has(data.id)) {
        Compare.remove(data.id);
        return { ok: true, added: false };
      }
      return Compare.add(data);
    },

    clear: function () {
      Compare.items = [];
      Compare.save();
      Compare.render();
    },

    /* --- the bar ---------------------------------------------------------- */

    build: function () {
      var bar = document.createElement('div');
      bar.className = 'compare-bar';
      bar.setAttribute('data-compare-bar', '');
      bar.setAttribute('aria-hidden', 'true');

      /* Same class vocabulary as PARTIALS.md block 4 — style.css only
         implements the .compare-bar-inner / .cb-* set. */
      var inner = document.createElement('div');
      inner.className = 'container compare-bar-inner';

      var left = document.createElement('div');
      left.className = 'cb-left';

      var list = document.createElement('div');
      list.className = 'cb-avatars';
      list.setAttribute('data-cb-avatars', '');
      list.setAttribute('aria-hidden', 'true');

      var text = document.createElement('p');
      text.className = 'cb-text';
      var count = document.createElement('span');
      count.className = 'cb-count';
      count.setAttribute('data-cb-count', '');
      count.setAttribute('aria-live', 'polite');
      count.textContent = '0';
      var note = document.createElement('span');
      note.className = 'cb-hint';
      note.setAttribute('data-cb-note', '');
      note.textContent = 'Maksimum ' + MAX_COMPARE + ' müəssisə';
      text.appendChild(count);
      text.appendChild(document.createTextNode(' müəssisə müqayisə siyahısındadır '));
      text.appendChild(note);

      left.appendChild(list);
      left.appendChild(text);

      var actions = document.createElement('div');
      actions.className = 'cb-actions';

      var clear = document.createElement('button');
      clear.className = 'btn-ghost btn-sm';
      clear.type = 'button';
      clear.setAttribute('data-cb-clear', '');
      clear.textContent = 'Siyahını təmizlə';

      var go = document.createElement('a');
      go.className = 'btn-brand btn-sm';
      go.href = 'muqayise.html';
      go.setAttribute('data-cb-go', '');
      go.textContent = 'Müqayisə et';

      actions.appendChild(clear);
      actions.appendChild(go);
      inner.appendChild(left);
      inner.appendChild(actions);
      bar.appendChild(inner);
      document.body.appendChild(bar);
      return bar;
    },

    ensureBar: function () {
      if (Compare.bar) return Compare.bar;
      var existing = $('.compare-bar') || $('[data-compare-bar]');
      if (existing) {
        Compare.bar = existing;
      } else if (CURRENT_PAGE !== 'muqayise.html' && $('[data-compare-toggle]')) {
        Compare.bar = Compare.build();
      } else {
        return null;
      }

      var clear = $('[data-cb-clear]', Compare.bar);
      if (clear) {
        if (clear.tagName === 'BUTTON') clear.setAttribute('type', 'button');
        on(clear, 'click', function (ev) {
          ev.preventDefault();
          Compare.clear();
        });
      }
      var go = $('[data-cb-go]', Compare.bar);
      if (go && go.tagName === 'A' && !go.getAttribute('href')) go.setAttribute('href', 'muqayise.html');

      /* [data-cb-hide] dismisses the bar for this page view without touching
         the stored list — Compare.render() honours the flag. */
      var hide = $('[data-cb-hide]', Compare.bar);
      if (hide) {
        if (hide.tagName === 'BUTTON') hide.setAttribute('type', 'button');
        on(hide, 'click', function (ev) {
          ev.preventDefault();
          Compare.dismissed = true;
          Compare.render();
        });
      }

      return Compare.bar;
    },

    /* Decorative stacked thumbnail for [data-cb-avatars] (PARTIALS block 4).
       The container is aria-hidden — the count text carries the meaning. */
    avatar: function (item) {
      var av = document.createElement('span');
      av.className = 'cb-avatar';
      av.setAttribute('data-cb-avatar', item.id);
      av.textContent = item.mono || (item.name || '?').charAt(0);
      if (item.name) av.setAttribute('title', item.name);
      return av;
    },

    chip: function (item) {
      var chip = document.createElement('span');
      chip.className = 'cb-chip';
      chip.setAttribute('data-cb-chip', item.id);

      var mono = document.createElement('span');
      mono.className = 'cb-chip-mono';
      mono.textContent = item.mono || '';
      mono.setAttribute('aria-hidden', 'true');

      var name = document.createElement('span');
      name.className = 'cb-chip-name';
      name.textContent = item.name || '';

      var drop = document.createElement('button');
      drop.className = 'cb-chip-x';
      drop.type = 'button';
      drop.setAttribute('data-cb-remove', item.id);
      drop.setAttribute('aria-label', (item.name || 'Müəssisə') + ' — müqayisədən çıxar');
      drop.textContent = '×';

      chip.appendChild(mono);
      chip.appendChild(name);
      chip.appendChild(drop);
      return chip;
    },

    flashFull: function () {
      var bar = Compare.ensureBar();
      if (!bar) return;
      /* PARTIALS block 4 names this element .cb-hint and ships static copy. */
      var note = $('[data-cb-note]', bar) || $('.cb-hint', bar);
      if (!note) return;
      var previous = note.getAttribute('data-cb-note-default');
      if (previous === null) {
        previous = note.textContent;
        note.setAttribute('data-cb-note-default', previous);
      }
      note.textContent = 'Ən çox ' + MAX_COMPARE + ' müəssisə müqayisə edilə bilər.';
      bar.classList.add('is-full');
      window.clearTimeout(Compare._noteTimer);
      Compare._noteTimer = window.setTimeout(function () {
        bar.classList.remove('is-full');
        note.textContent = previous;
      }, 2600);
    },

    render: function () {
      var count = Compare.items.length;

      $$('[data-compare-toggle]').forEach(function (btn) {
        var host = closest(btn, '[data-id]');
        var id = host ? attr(host, 'data-id') : attr(btn, 'data-compare-toggle');
        var isOn = !!id && Compare.has(id);
        btn.classList.toggle('is-on', isOn);
        btn.setAttribute('aria-pressed', isOn ? 'true' : 'false');
        btn.setAttribute('aria-label', isOn ? 'Müqayisədən çıxar' : 'Müqayisəyə əlavə et');
        btn.setAttribute('title', isOn ? 'Müqayisədən çıxar' : 'Müqayisəyə əlavə et');
      });

      $$('[data-compare-count]').forEach(function (el) {
        el.textContent = String(count);
        el.classList.toggle('is-on', count > 0);
      });

      var bar = Compare.ensureBar();
      if (!bar) return;

      /* The static markup already reads "… müəssisə müqayisə siyahısındadır",
         so only the number goes in here. */
      var counter = $('[data-cb-count]', bar);
      if (counter) counter.textContent = String(count);

      var avatars = $('[data-cb-avatars]', bar);
      if (avatars) {
        avatars.textContent = '';
        Compare.items.forEach(function (item) { avatars.appendChild(Compare.avatar(item)); });
      }

      var list = $('[data-cb-list]', bar);
      if (list) {
        list.textContent = '';
        Compare.items.forEach(function (item) { list.appendChild(Compare.chip(item)); });
        $$('[data-cb-remove]', list).forEach(function (btn) {
          on(btn, 'click', function (ev) {
            ev.preventDefault();
            Compare.remove(attr(btn, 'data-cb-remove'));
          });
        });
      }

      var visible = count > 0 && !Compare.dismissed && CURRENT_PAGE !== 'muqayise.html';
      bar.classList.toggle('is-on', visible);
      bar.setAttribute('aria-hidden', visible ? 'false' : 'true');
      document.body.classList.toggle('has-compare-bar', visible);
    },

    init: function () {
      Compare.load();
      var toggles = $$('[data-compare-toggle]');
      if (!toggles.length && !$('.compare-bar') && !$('[data-compare-bar]') && !$('[data-compare-count]')) return;

      toggles.forEach(function (btn) {
        if (btn.tagName === 'BUTTON') btn.setAttribute('type', 'button');
        on(btn, 'click', function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          var host = closest(btn, '[data-id]');
          if (!host) return;
          var result = Compare.toggle(Compare.read(host));
          if (!result.ok && result.reason === 'full') Compare.flashFull();
        });
      });

      /* Remove buttons rendered by the page itself (muqayise.html). */
      $$('[data-compare-remove]').forEach(function (btn) {
        on(btn, 'click', function (ev) {
          ev.preventDefault();
          Compare.remove(attr(btn, 'data-compare-remove'));
          var row = closest(btn, '[data-compare-row]');
          if (row && row.parentNode) row.parentNode.removeChild(row);
        });
      });

      $$('[data-compare-clear]').forEach(function (btn) {
        on(btn, 'click', function (ev) {
          ev.preventDefault();
          Compare.clear();
        });
      });

      /* Another tab changed the list — stay in sync. */
      on(window, 'storage', function (ev) {
        if (ev.key !== KEY_COMPARE) return;
        Compare.load();
        Compare.render();
      });

      Compare.render();
    }
  };

  /* ===========================================================================
     Wizard — 4-step AI helper (STEPS → MATCHES)
     Root [data-wizard]; state persisted in localStorage 'edunav_survey'.
     Renders: step label, progress bar (--wz-progress), question, option buttons,
     back button, summary line, 5 result rows, restart.
     =========================================================================== */

  var Wizard = {
    root: null,
    state: { step: 0, answers: [] },

    load: function () {
      var saved = Store.getJSON(KEY_SURVEY, null);
      if (!saved || typeof saved !== 'object') return;
      var answers = Object.prototype.toString.call(saved.answers) === '[object Array]'
        ? saved.answers.filter(function (a) { return typeof a === 'string'; })
        : [];
      var step = parseInt(saved.step, 10);
      if (isNaN(step)) step = answers.length;
      Wizard.state.answers = answers.slice(0, STEPS.length);
      Wizard.state.step = Math.max(0, Math.min(STEPS.length, step));
    },

    save: function () {
      Store.setJSON(KEY_SURVEY, { step: Wizard.state.step, answers: Wizard.state.answers });
    },

    answer: function (label) {
      var s = Wizard.state;
      s.answers = s.answers.slice(0, s.step).concat([label]);
      s.step = Math.min(STEPS.length, s.step + 1);
      Wizard.save();
      Wizard.render();
    },

    back: function () {
      Wizard.state.step = Math.max(0, Wizard.state.step - 1);
      Wizard.save();
      Wizard.render();
    },

    restart: function () {
      Wizard.state = { step: 0, answers: [] };
      Wizard.save();
      Wizard.render();
    },

    optionButton: function (label) {
      var btn = document.createElement('button');
      btn.className = 'wz-opt';
      btn.type = 'button';
      btn.setAttribute('data-wz-value', label);
      btn.textContent = label;
      on(btn, 'click', function (ev) {
        ev.preventDefault();
        Wizard.answer(label);
      });
      return btn;
    },

    resultRow: function (match) {
      var row = document.createElement('div');
      row.className = 'wz-row';

      var mono = document.createElement('span');
      mono.className = 'wz-mono';
      mono.textContent = match.mono;
      mono.setAttribute('aria-hidden', 'true');
      mono.style.setProperty('--wz-bg', match.bg);
      mono.style.setProperty('--wz-fg', match.fg);

      var info = document.createElement('span');
      info.className = 'wz-info';
      var name = document.createElement('span');
      name.className = 'wz-name';
      name.textContent = match.name;
      var meta = document.createElement('span');
      meta.className = 'wz-meta';
      meta.textContent = match.meta;
      info.appendChild(name);
      info.appendChild(meta);

      var price = document.createElement('span');
      price.className = 'wz-price';
      price.textContent = match.price;

      row.appendChild(mono);
      row.appendChild(info);
      row.appendChild(price);
      return row;
    },

    render: function () {
      var root = Wizard.root;
      if (!root) return;
      var s = Wizard.state;
      var asking = s.step < STEPS.length;
      var step = STEPS[Math.min(s.step, STEPS.length - 1)];

      root.classList.toggle('is-asking', asking);
      root.classList.toggle('is-done', !asking);

      var label = asking ? 'Sual ' + (s.step + 1) + ' / ' + STEPS.length : 'Nəticə hazırdır';
      $$('[data-wizard-step-label]', root).forEach(function (el) { el.textContent = label; });

      var pct = Math.round((Math.min(s.step, STEPS.length) / STEPS.length) * 100);
      $$('[data-wizard-progress]', root).forEach(function (el) {
        el.style.setProperty('--wz-progress', pct + '%');
        var track = closest(el, '[role="progressbar"]') || el;
        track.setAttribute('role', 'progressbar');
        track.setAttribute('aria-valuemin', '0');
        track.setAttribute('aria-valuemax', '100');
        track.setAttribute('aria-valuenow', String(pct));
        track.setAttribute('aria-label', 'Anketin gedişi');
      });

      var ask = $('[data-wizard-ask]', root);
      var result = $('[data-wizard-result]', root);
      if (ask) ask.hidden = !asking;
      if (result) result.hidden = asking;

      var question = $('[data-wizard-question]', root);
      if (question) question.textContent = step.q;

      var options = $('[data-wizard-options]', root);
      if (options) {
        options.textContent = '';
        if (asking) {
          step.opts.forEach(function (label2) { options.appendChild(Wizard.optionButton(label2)); });
        }
      }

      var backBtn = $('[data-wizard-back]', root);
      if (backBtn) {
        backBtn.disabled = s.step === 0;
        backBtn.hidden = s.step === 0;
      }

      if (!asking) {
        var count = $('[data-wizard-count]', root);
        if (count) count.textContent = MATCHES.length + ' uyğun müəssisə tapıldı';

        var summary = $('[data-wizard-summary]', root);
        if (summary) summary.textContent = 'Seçimləriniz: ' + s.answers.join(' · ');

        var rows = $('[data-wizard-results]', root);
        if (rows && !rows.hasAttribute('data-wizard-rendered')) {
          rows.textContent = '';
          MATCHES.forEach(function (m) { rows.appendChild(Wizard.resultRow(m)); });
          rows.setAttribute('data-wizard-rendered', '');
        }
      }
    },

    init: function () {
      Wizard.root = $('[data-wizard]');
      if (!Wizard.root) return;

      Wizard.load();

      var restart = $('[data-wizard-restart]', Wizard.root);
      if (restart) {
        if (restart.tagName === 'BUTTON') restart.setAttribute('type', 'button');
        on(restart, 'click', function (ev) {
          ev.preventDefault();
          Wizard.restart();
          var first = $('.wz-opt', Wizard.root);
          if (first) first.focus();
        });
      }

      var back = $('[data-wizard-back]', Wizard.root);
      if (back) {
        if (back.tagName === 'BUTTON') back.setAttribute('type', 'button');
        on(back, 'click', function (ev) {
          ev.preventDefault();
          Wizard.back();
        });
      }

      /* «Seçimə başla» — opens the wizard modal when the wizard lives in one. */
      var modal = closest(Wizard.root, '.modal');
      $$('[data-wizard-open]').forEach(function (btn) {
        on(btn, 'click', function (ev) {
          ev.preventDefault();
          if (modal) Modals.open(modal, btn);
          else Wizard.root.scrollIntoView({ block: 'center' });
          if (Wizard.state.step >= STEPS.length) Wizard.render();
        });
      });

      Wizard.render();
    }
  };

  /* ===========================================================================
     Survey — the 4-step modal shipped by PARTIALS.md block 5.
     Markup contract (distinct from the on-page [data-wizard] helper):
       .modal[data-modal="survey"]
         [data-survey-progress]                     progress bar span
         .modal-step[data-survey-step="1..4"]       one per question, .is-on shows
           .chip[data-survey-pick="key"][data-value]
         [data-modal-success]                       final panel
         [data-survey-prev] / [data-survey-next]    footer buttons
     Answers are persisted to localStorage 'edunav_survey' in the same shape the
     Wizard uses, so the two stay interchangeable.
     =========================================================================== */

  var Survey = {
    root: null,
    steps: [],
    success: null,
    prevBtn: null,
    nextBtn: null,
    index: 0,
    answers: {},
    order: [],

    stepIndexOf: function (el) {
      var n = parseInt(attr(el, 'data-survey-step') || '', 10);
      return isNaN(n) ? 0 : n;
    },

    answered: function (i) {
      var key = Survey.order[i];
      return !!(key && Survey.answers[key]);
    },

    save: function () {
      var list = Survey.order.map(function (k) { return Survey.answers[k] || ''; })
        .filter(function (v) { return !!v; });
      Store.setJSON(KEY_SURVEY, { step: list.length, answers: list });
    },

    render: function () {
      var total = Survey.steps.length;
      var done = Survey.index >= total;

      Survey.steps.forEach(function (step, i) {
        var on1 = !done && i === Survey.index;
        step.classList.toggle('is-on', on1);
        step.setAttribute('aria-hidden', on1 ? 'false' : 'true');
      });

      if (Survey.success) Survey.success.hidden = !done;

      var shown = Math.min(Survey.index + (done ? 0 : 1), total);
      $$('[data-survey-progress]', Survey.root).forEach(function (el) {
        el.style.width = total ? Math.round((done ? total : shown) / total * 100) + '%' : '0%';
        var track = closest(el, '[role="progressbar"]');
        if (track) track.setAttribute('aria-valuenow', String(done ? total : shown));
      });

      if (Survey.prevBtn) {
        Survey.prevBtn.disabled = done || Survey.index === 0;
        Survey.prevBtn.hidden = done;
      }
      if (Survey.nextBtn) {
        Survey.nextBtn.hidden = done;
        Survey.nextBtn.disabled = !done && !Survey.answered(Survey.index);
        Survey.nextBtn.textContent = Survey.index >= total - 1 ? 'Bitir' : 'Növbəti';
      }
    },

    go: function (i) {
      Survey.index = Math.max(0, Math.min(Survey.steps.length, i));
      Survey.render();
      var first = Survey.steps[Survey.index] ? $('.chip', Survey.steps[Survey.index]) : null;
      if (first && first.focus) first.focus();
    },

    init: function () {
      Survey.root = $('.modal[data-modal="survey"]');
      if (!Survey.root) return;

      Survey.steps = $$('[data-survey-step]', Survey.root).sort(function (a, b) {
        return Survey.stepIndexOf(a) - Survey.stepIndexOf(b);
      });
      if (!Survey.steps.length) return;

      Survey.success = $('[data-modal-success]', Survey.root);
      Survey.prevBtn = $('[data-survey-prev]', Survey.root);
      Survey.nextBtn = $('[data-survey-next]', Survey.root);

      Survey.order = Survey.steps.map(function (step) {
        var pick = $('[data-survey-pick]', step);
        return pick ? attr(pick, 'data-survey-pick') : '';
      });

      $$('[data-survey-pick]', Survey.root).forEach(function (chip) {
        if (chip.tagName === 'BUTTON') chip.setAttribute('type', 'button');
        chip.setAttribute('aria-pressed', 'false');
        on(chip, 'click', function (ev) {
          ev.preventDefault();
          var key = attr(chip, 'data-survey-pick');
          var step = closest(chip, '[data-survey-step]');
          $$('[data-survey-pick="' + key + '"]', step || Survey.root).forEach(function (sib) {
            sib.classList.remove('is-on');
            sib.setAttribute('aria-pressed', 'false');
          });
          chip.classList.add('is-on');
          chip.setAttribute('aria-pressed', 'true');
          Survey.answers[key] = attr(chip, 'data-value') || chip.textContent;
          Survey.save();
          Survey.render();
        });
      });

      if (Survey.prevBtn) {
        Survey.prevBtn.setAttribute('type', 'button');
        on(Survey.prevBtn, 'click', function (ev) {
          ev.preventDefault();
          Survey.go(Survey.index - 1);
        });
      }
      if (Survey.nextBtn) {
        Survey.nextBtn.setAttribute('type', 'button');
        on(Survey.nextBtn, 'click', function (ev) {
          ev.preventDefault();
          if (!Survey.answered(Survey.index)) return;
          Survey.go(Survey.index + 1);
          if (Survey.index >= Survey.steps.length && Survey.success) {
            if (!Survey.success.hasAttribute('tabindex')) Survey.success.setAttribute('tabindex', '-1');
            Survey.success.focus();
          }
        });
      }

      Survey.render();
    }
  };

  /* ===========================================================================
     Catalogue — client-side filter + sort for mekteblar / bagcalar / vakansiyalar
     Root [data-catalogue]; cards are [data-item] with data-tip / data-rayon /
     data-dil / data-name / data-price / data-year / data-search.
     Controls: .dd[data-filter="…"], select/input[data-filter="…"],
     .chip[data-filter-chip][data-filter][data-value], [data-filter-q],
     [data-sort], [data-filter-reset].
     Reads ?tip= ?rayon= ?dil= ?q= ?sort= on load and writes the state back with
     history.replaceState. Shows .empty-state when nothing matches.
     =========================================================================== */

  var Catalogue = {
    root: null,
    list: null,
    items: [],
    filters: { tip: [], rayon: [], dil: [], q: '' },
    sort: '',
    order: [],

    FIELDS: ['tip', 'rayon', 'dil'],

    param: function (name) {
      var m = new RegExp('[?&]' + name + '=([^&#]*)').exec(window.location.search);
      if (!m) return '';
      var raw = m[1].replace(/\+/g, ' ');
      try { return decodeURIComponent(raw); } catch (e) { return raw; }
    },

    /* Any of the requested values matches any of the item's values. */
    matchField: function (item, field) {
      var wanted = Catalogue.filters[field];
      if (!wanted.length) return true;
      var have = attr(item, 'data-' + field).split(',').map(function (v) { return fold(v.trim()); })
        .filter(function (v) { return v; });
      if (!have.length) return false;
      return wanted.some(function (w) { return have.indexOf(fold(w)) > -1; });
    },

    matchQuery: function (item) {
      var q = fold(Catalogue.filters.q.trim());
      if (!q) return true;
      var hay = attr(item, 'data-search') || item.textContent;
      return fold(hay).indexOf(q) > -1;
    },

    apply: function (pushUrl) {
      if (!Catalogue.root) return;
      var matched = [];

      Catalogue.items.forEach(function (item) {
        var visible = Catalogue.matchQuery(item)
          && Catalogue.FIELDS.every(function (f) { return Catalogue.matchField(item, f); });
        item.hidden = !visible;
        item.classList.toggle('is-hidden', !visible);
        if (visible) matched.push(item);
      });

      Catalogue.applySort();

      var shown = matched.length;
      $$('[data-count]').forEach(function (el) { el.textContent = groupNumber(shown); });

      /* Pagination is folded into apply() rather than living in its own module:
         both would write `item.hidden` and the last one to run would win. */
      Catalogue.paginate(matched);

      var empty = $('.empty-state', Catalogue.root) || $('[data-empty]', Catalogue.root) || $('.empty-state');
      if (empty) empty.hidden = shown > 0;
      if (Catalogue.list) Catalogue.list.classList.toggle('is-empty', shown === 0);

      Catalogue.paintChips();
      if (pushUrl !== false) Catalogue.writeUrl();
    },

    /* --- pagination -------------------------------------------------------
       The catalogue pages ship a static `.pager` (1 2 3 … 14) that claimed far
       more pages than there are records and did nothing when clicked. The
       button row is rebuilt here from the real filtered count, so it always
       tells the truth. */
    page: 1,
    pageSize: 0,

    paginate: function (matched) {
      var pager = $('.pager', Catalogue.root) || $('.pager');
      if (!pager) return;

      if (!Catalogue.pageSize) {
        Catalogue.pageSize = toNumber(attr(pager, 'data-page-size')) || 12;
      }
      var size = Catalogue.pageSize;
      var pages = Math.max(1, Math.ceil(matched.length / size));
      if (Catalogue.page > pages) Catalogue.page = pages;
      if (Catalogue.page < 1) Catalogue.page = 1;

      if (pages < 2) {
        /* Clear as well as hide — the authored markup ships a fake "1 2 3 … 14"
           row, and leaving those buttons in the DOM keeps dead controls around
           for keyboard and assistive-tech users even while visually hidden. */
        pager.innerHTML = '';
        pager.hidden = true;
        return;
      }
      pager.hidden = false;

      var start = (Catalogue.page - 1) * size;
      matched.forEach(function (item, i) {
        var onPage = i >= start && i < start + size;
        item.hidden = !onPage;
        item.classList.toggle('is-hidden', !onPage);
      });

      Catalogue.renderPager(pager, pages);
    },

    renderPager: function (pager, pages) {
      var cur = Catalogue.page;
      var arrow = function (d) {
        return '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"'
          + ' stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"'
          + ' focusable="false"><path d="' + (d < 0 ? 'm14 6-6 6 6 6' : 'm10 6 6 6-6 6') + '"/></svg>';
      };
      var list = [];
      for (var n = 1; n <= pages; n++) {
        if (n === 1 || n === pages || Math.abs(n - cur) <= 1) list.push(n);
        else if (list[list.length - 1] !== '…') list.push('…');
      }

      var html = '<button class="pager-btn" type="button" data-page="prev" aria-label="Əvvəlki səhifə"'
        + (cur === 1 ? ' disabled' : '') + '>' + arrow(-1) + '</button>';
      list.forEach(function (n) {
        html += n === '…'
          ? '<span class="pager-gap" aria-hidden="true">…</span>'
          : '<button class="pager-btn' + (n === cur ? ' is-active' : '') + '" type="button" data-page="'
            + n + '"' + (n === cur ? ' aria-current="page"' : '') + '>' + n + '</button>';
      });
      html += '<button class="pager-btn" type="button" data-page="next" aria-label="Sonrakı səhifə"'
        + (cur === pages ? ' disabled' : '') + '>' + arrow(1) + '</button>';
      pager.innerHTML = html;

      $$('[data-page]', pager).forEach(function (btn) {
        on(btn, 'click', function () {
          var v = attr(btn, 'data-page');
          if (v === 'prev') Catalogue.page -= 1;
          else if (v === 'next') Catalogue.page += 1;
          else Catalogue.page = toNumber(v) || 1;
          Catalogue.apply(false);
          var top = Catalogue.list || Catalogue.root;
          if (top && top.scrollIntoView) top.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    },

    applySort: function () {
      if (!Catalogue.list || !Catalogue.sort) return;
      var parts = Catalogue.sort.split('-');
      var key = parts[0];
      var dir = parts[1] === 'desc' ? -1 : 1;

      var sorted = Catalogue.items.slice().sort(function (a, b) {
        if (key === 'name') {
          var an = attr(a, 'data-name');
          var bn = attr(b, 'data-name');
          return an.localeCompare(bn, 'az') * dir;
        }
        var av = toNumber(attr(a, 'data-' + key));
        var bv = toNumber(attr(b, 'data-' + key));
        if (av === null && bv === null) return 0;
        if (av === null) return 1;
        if (bv === null) return -1;
        return (av - bv) * dir;
      });

      var frag = document.createDocumentFragment();
      sorted.forEach(function (item) { frag.appendChild(item); });
      Catalogue.list.appendChild(frag);
    },

    paintChips: function () {
      $$('[data-filter-chip]', Catalogue.root).forEach(function (chip) {
        var field = attr(chip, 'data-filter');
        var value = attr(chip, 'data-value');
        var active = Catalogue.filters[field] && Catalogue.filters[field].indexOf(value) > -1;
        var none = !value && Catalogue.filters[field] && !Catalogue.filters[field].length;
        chip.classList.toggle('is-on', !!(active || none));
        chip.setAttribute('aria-pressed', active || none ? 'true' : 'false');
      });
    },

    writeUrl: function () {
      if (!window.history || !window.history.replaceState) return;
      var parts = [];
      Catalogue.FIELDS.forEach(function (f) {
        if (Catalogue.filters[f].length) {
          parts.push(f + '=' + encodeURIComponent(Catalogue.filters[f].join(',')));
        }
      });
      if (Catalogue.filters.q.trim()) parts.push('q=' + encodeURIComponent(Catalogue.filters.q.trim()));
      if (Catalogue.sort) parts.push('sort=' + encodeURIComponent(Catalogue.sort));
      var url = window.location.pathname + (parts.length ? '?' + parts.join('&') : '') + window.location.hash;
      try { window.history.replaceState(null, '', url); } catch (e) { /* file:// */ }
    },

    setFilter: function (field, values) {
      Catalogue.filters[field] = (values || []).filter(function (v) { return v !== ''; });
      /* Narrowing the results while parked on page 3 would show an empty grid. */
      Catalogue.page = 1;
      Catalogue.apply();
    },

    reset: function () {
      Catalogue.FIELDS.forEach(function (f) { Catalogue.filters[f] = []; });
      Catalogue.filters.q = '';
      Catalogue.page = 1;

      $$('.dd[data-filter], [data-dd][data-filter]', Catalogue.root).forEach(function (dd) {
        Dropdown.setValue(dd, [], true);
      });
      $$('select[data-filter]', Catalogue.root).forEach(function (sel) { sel.value = ''; });
      $$('[data-filter-q]').forEach(function (input) { input.value = ''; });
      Catalogue.apply();
    },

    init: function () {
      Catalogue.root = $('[data-catalogue]');
      if (!Catalogue.root) return;

      /* FIELDS is discovered from the page, not hard-coded. A catalogue that adds a
         `data-filter="kurikulum"` control gets that filter for free; hard-coding the
         list meant any extra control rendered fine and then silently did nothing. */
      Catalogue.FIELDS = ['tip', 'rayon', 'dil'].slice();
      $$('[data-filter]', Catalogue.root).forEach(function (el) {
        var f = attr(el, 'data-filter');
        if (f && Catalogue.FIELDS.indexOf(f) === -1) Catalogue.FIELDS.push(f);
      });

      Catalogue.items = $$('[data-item]', Catalogue.root);
      if (!Catalogue.items.length) return;
      Catalogue.list = $('[data-list]', Catalogue.root) || Catalogue.items[0].parentElement;

      /* 1. seed state from the URL */
      Catalogue.FIELDS.forEach(function (f) {
        var raw = Catalogue.param(f);
        Catalogue.filters[f] = raw ? raw.split(',').map(function (v) { return v.trim(); }).filter(Boolean) : [];
      });
      Catalogue.filters.q = Catalogue.param('q');
      Catalogue.sort = Catalogue.param('sort');

      /* 2. reflect it in the controls */
      $$('.dd[data-filter], [data-dd][data-filter]', Catalogue.root).forEach(function (dd) {
        var field = attr(dd, 'data-filter');
        if (Catalogue.FIELDS.indexOf(field) === -1) return;
        if (Catalogue.filters[field].length) Dropdown.setValue(dd, Catalogue.filters[field], true);
        on(dd, 'dd:change', function (ev) {
          var values = (ev.detail && ev.detail.values ? ev.detail.values : []).filter(Boolean);
          Catalogue.setFilter(field, values);
        });
      });

      $$('select[data-filter]', Catalogue.root).forEach(function (sel) {
        var field = attr(sel, 'data-filter');
        if (Catalogue.FIELDS.indexOf(field) === -1) return;
        if (Catalogue.filters[field].length) sel.value = Catalogue.filters[field][0];
        on(sel, 'change', function () {
          Catalogue.setFilter(field, sel.value ? [sel.value] : []);
        });
      });

      $$('[data-filter-chip]', Catalogue.root).forEach(function (chip) {
        if (chip.tagName === 'BUTTON') chip.setAttribute('type', 'button');
        on(chip, 'click', function (ev) {
          ev.preventDefault();
          var field = attr(chip, 'data-filter');
          var value = attr(chip, 'data-value');
          if (Catalogue.FIELDS.indexOf(field) === -1) return;
          if (!value) {
            Catalogue.setFilter(field, []);
            return;
          }
          var current = Catalogue.filters[field].slice();
          var idx = current.indexOf(value);
          if (idx > -1) current.splice(idx, 1); else current.push(value);
          Catalogue.setFilter(field, current);
        });
      });

      var search = $('[data-filter-q]');
      if (search) {
        if (Catalogue.filters.q) search.value = Catalogue.filters.q;
        var debounce = null;
        on(search, 'input', function () {
          window.clearTimeout(debounce);
          debounce = window.setTimeout(function () {
            Catalogue.filters.q = search.value;
            Catalogue.page = 1;
            Catalogue.apply();
          }, 160);
        });
        var searchForm = closest(search, 'form');
        if (searchForm) {
          on(searchForm, 'submit', function (ev) {
            ev.preventDefault();
            window.clearTimeout(debounce);
            Catalogue.filters.q = search.value;
            Catalogue.apply();
          });
        }
      }

      var sorter = $('[data-sort]');
      if (sorter) {
        if (sorter.classList.contains('dd') || sorter.hasAttribute('data-dd')) {
          if (Catalogue.sort) Dropdown.setValue(sorter, [Catalogue.sort], true);
          on(sorter, 'dd:change', function (ev) {
            Catalogue.sort = (ev.detail && ev.detail.value) || '';
            Catalogue.apply();
          });
        } else {
          if (Catalogue.sort) sorter.value = Catalogue.sort;
          on(sorter, 'change', function () {
            Catalogue.sort = sorter.value;
            Catalogue.apply();
          });
        }
      }

      $$('[data-filter-reset]').forEach(function (btn) {
        if (btn.tagName === 'BUTTON') btn.setAttribute('type', 'button');
        on(btn, 'click', function (ev) {
          ev.preventDefault();
          Catalogue.reset();
        });
      });

      /* 3. first paint — do not rewrite the URL the visitor arrived with */
      Catalogue.apply(false);
    }
  };

  /* ===========================================================================
     Forms — validate [data-validate] on submit (required / email / tel / min)
     Inline .field-error inside the field, aria-invalid + aria-describedby,
     focus moves to the first bad control. Never alert().
     =========================================================================== */

  var Forms = {
    MSG: {
      required: 'Bu sahə tələb olunur.',
      check: 'Davam etmək üçün təsdiqləyin.',
      email: 'Düzgün e-poçt ünvanı daxil edin.',
      tel: 'Düzgün telefon nömrəsi daxil edin.',
      min: 'Ən azı {n} simvol daxil edin.',
      match: 'Dəyərlər eyni deyil.'
    },

    EMAIL: /^[^\s@]+@[^\s@]+\.[A-Za-zƏəĞğİıÖöŞşÇçÜü]{2,}$/,

    controls: function (form) {
      return $$('input, select, textarea', form).filter(function (el) {
        if (el.type === 'hidden' || el.type === 'submit' || el.type === 'button' || el.type === 'reset') return false;
        return !el.disabled && !el.hasAttribute('data-skip-validate');
      });
    },

    fieldOf: function (control) {
      return closest(control, '.field') || control.parentElement;
    },

    errorNode: function (control) {
      var field = Forms.fieldOf(control);
      if (!field) return null;
      var node = $('.field-error', field);
      if (!node) {
        node = document.createElement('span');
        node.className = 'field-error';
        field.appendChild(node);
      }
      if (!node.id) {
        node.id = (control.id || control.name || 'field') + '-error-' + Math.random().toString(36).slice(2, 7);
      }
      node.setAttribute('role', 'alert');
      return node;
    },

    setError: function (control, message) {
      var field = Forms.fieldOf(control);
      var node = Forms.errorNode(control);
      if (!node) return;
      node.textContent = message;
      node.hidden = false;
      control.setAttribute('aria-invalid', 'true');
      control.setAttribute('aria-describedby', node.id);
      control.classList.add('has-error');
      if (field) field.classList.add('has-error');
    },

    clearError: function (control) {
      var field = Forms.fieldOf(control);
      var node = field ? $('.field-error', field) : null;
      if (node) {
        node.textContent = '';
        node.hidden = true;
      }
      control.removeAttribute('aria-invalid');
      if (node && control.getAttribute('aria-describedby') === node.id) {
        control.removeAttribute('aria-describedby');
      }
      control.classList.remove('has-error');
      if (field) field.classList.remove('has-error');
    },

    validateOne: function (control) {
      var value = (control.value || '').trim();
      var custom = attr(control, 'data-error');
      var type = (control.getAttribute('type') || '').toLowerCase();

      if (type === 'checkbox' || type === 'radio') {
        if (control.required && !control.checked) return custom || Forms.MSG.check;
        return '';
      }

      if (control.required && !value) return custom || Forms.MSG.required;
      if (!value) return '';

      if (type === 'email' || control.hasAttribute('data-email')) {
        if (!Forms.EMAIL.test(value)) return custom || Forms.MSG.email;
      }

      if (type === 'tel' || control.hasAttribute('data-tel')) {
        var digits = value.replace(/\D/g, '');
        if (digits.length < 9 || digits.length > 15) return custom || Forms.MSG.tel;
      }

      var min = parseInt(attr(control, 'data-min') || control.getAttribute('minlength') || '', 10);
      if (!isNaN(min) && min > 0 && value.length < min) {
        return (custom || Forms.MSG.min).replace('{n}', String(min));
      }

      var matchSel = attr(control, 'data-match');
      if (matchSel) {
        var other = $(matchSel, closest(control, 'form') || document);
        if (other && (other.value || '').trim() !== value) return custom || Forms.MSG.match;
      }

      return '';
    },

    validate: function (form) {
      var bad = [];
      Forms.controls(form).forEach(function (control) {
        var message = Forms.validateOne(control);
        if (message) {
          Forms.setError(control, message);
          bad.push(control);
        } else {
          Forms.clearError(control);
        }
      });
      return bad;
    },

    init: function () {
      /* PARTIALS.md tags its forms `data-form="…"`, page forms use
         `data-validate` — both get the same validation + in-place success. */
      var forms = $$('form[data-validate], form[data-form]');
      if (!forms.length) return;

      forms.forEach(function (form) {
        form.noValidate = true;

        Forms.controls(form).forEach(function (control) {
          var reset = function () {
            if (control.classList.contains('has-error')) Forms.clearError(control);
          };
          on(control, 'input', reset);
          on(control, 'change', reset);
          on(control, 'blur', function () {
            if (!control.classList.contains('has-error')) return;
            var message = Forms.validateOne(control);
            if (message) Forms.setError(control, message);
            else Forms.clearError(control);
          });
        });

        on(form, 'submit', function (ev) {
          var bad = Forms.validate(form);
          if (bad.length) {
            ev.preventDefault();
            var first = bad[0];
            if (first.focus) first.focus();
            if (first.scrollIntoView) first.scrollIntoView({ block: 'center' });
            form.classList.add('has-errors');
            return;
          }
          form.classList.remove('has-errors');

          /* Static site: a form with a success panel confirms in place.
             PARTIALS.md block 5 names the panel [data-modal-success]. */
          var successSel = attr(form, 'data-success');
          var scope = form.parentElement || document;
          var success = successSel
            ? $(successSel)
            : ($('[data-form-success]', scope) || $('[data-modal-success]', scope));
          if (!success) return;
          ev.preventDefault();
          form.hidden = true;
          success.hidden = false;
          if (!success.hasAttribute('tabindex')) success.setAttribute('tabindex', '-1');
          success.focus();
        });

        on(form, 'reset', function () {
          window.setTimeout(function () {
            Forms.controls(form).forEach(Forms.clearError);
            form.classList.remove('has-errors');
          }, 0);
        });
      });
    }
  };

  /* ===========================================================================
     Boot
     =========================================================================== */

  /* ===========================================================================
     Toast — minimal transient confirmation for actions that change nothing
     visible on the page (copying a link, for instance).
     Hooks: .toast-wrap / .toast (created on demand), window.EduNav.toast(msg)
     =========================================================================== */

  var Toast = {
    wrap: null,

    show: function (msg) {
      if (!Toast.wrap) {
        Toast.wrap = document.createElement('div');
        Toast.wrap.className = 'toast-wrap';
        Toast.wrap.setAttribute('role', 'status');
        Toast.wrap.setAttribute('aria-live', 'polite');
        document.body.appendChild(Toast.wrap);
      }
      var el = document.createElement('div');
      el.className = 'toast';
      el.textContent = msg;
      Toast.wrap.appendChild(el);
      window.setTimeout(function () { el.classList.add('is-on'); }, 10);
      window.setTimeout(function () {
        el.classList.remove('is-on');
        window.setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 260);
      }, 2600);
    }
  };

  /* ===========================================================================
     Share — the article action row (copy link / share / print)
     Hooks: [data-share="copy|native|print"]
     =========================================================================== */

  var Share = {
    init: function () {
      var btns = $$('[data-share]');
      if (!btns.length) return;

      btns.forEach(function (btn) {
        var kind = attr(btn, 'data-share');

        /* Native sharing only exists on some browsers; fall back to copying
           rather than leaving the button inert. */
        if (kind === 'native' && !navigator.share) kind = 'copy';

        on(btn, 'click', function () {
          if (kind === 'print') { window.print(); return; }

          var url = window.location.href;
          if (kind === 'native') {
            navigator.share({ title: document.title, url: url })
              .catch(function () { /* user dismissed the sheet */ });
            return;
          }
          Share.copy(url).then(function (ok) {
            Toast.show(ok ? 'Link kopyalandı' : 'Linki kopyalamaq alınmadı');
          });
        });
      });
    },

    copy: function (text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text)
          .then(function () { return true; })
          .catch(function () { return Share.fallbackCopy(text); });
      }
      return Promise.resolve(Share.fallbackCopy(text));
    },

    /* file:// and older browsers have no async clipboard. */
    fallbackCopy: function (text) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      /* NOT .visually-hidden — that clips with clip-path, and a clipped
         textarea cannot be selected, which makes execCommand('copy') fail. */
      ta.className = 'offscreen-copy';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, text.length);
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      return ok;
    }
  };

  function boot() {
    Motion.init();
    NavActive.init();
    YearStamp.init();
    Drawer.init();
    Modals.init();
    Dropdown.init();
    Reveal.init();
    HeroWord.init();
    SearchHint.init();
    Faq.init();
    Favourites.init();
    Compare.init();
    Wizard.init();
    Survey.init();
    Catalogue.init();
    Forms.init();
    Share.init();
    document.documentElement.classList.add('js-booted');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* Small public surface for page-level scripts and the admin bundle. */
  window.EduNav = {
    compare: Compare,
    favourites: Favourites,
    wizard: Wizard,
    survey: Survey,
    catalogue: Catalogue,
    dropdown: Dropdown,
    modals: Modals,
    drawer: Drawer,
    forms: Forms,
    share: Share,
    toast: Toast.show,
    data: { HERO_WORDS: HERO_WORDS, SEARCH_HINTS: SEARCH_HINTS, STEPS: STEPS, MATCHES: MATCHES }
  };
})();

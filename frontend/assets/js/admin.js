/* ==========================================================================
   EduNav.az — admin panel behaviour
   Loaded AFTER assets/js/app.js, on frontend/admin/*.html only.
   One IIFE, ES2019, strict mode, every lookup guarded.

   Modules
     AdmSidebar  collapse / expand + off-canvas drawer + active link
     AdmTable    sorting, selection, bulk bar, pagination, text filter
     AdmFilters  chips + .dd dropdowns narrowing the rows, .adm-empty
     AdmDrawer   [data-adm-drawer] → right-side .adm-drawer detail panel
     AdmToast    window.admToast(msg, type) + optimistic demo row actions
     AdmCharts   inline SVG sparklines and one bar chart, no library

   Everything here is demo behaviour: no backend, no persistence beyond the
   sidebar preference. Rows are the source of truth; nothing is fetched.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------------------------------------------------------------------
     0. Helpers
     --------------------------------------------------------------------- */
  var $ = function (sel, root) {
    try { return (root || document).querySelector(sel); } catch (e) { return null; }
  };
  var $$ = function (sel, root) {
    try {
      return Array.prototype.slice.call((root || document).querySelectorAll(sel));
    } catch (e) { return []; }
  };
  var on = function (el, type, fn, opts) {
    if (el && el.addEventListener) el.addEventListener(type, fn, opts || false);
  };
  var off = function (el, type, fn, opts) {
    if (el && el.removeEventListener) el.removeEventListener(type, fn, opts || false);
  };

  var KEY_SIDE = 'edunav_adm_side';

  var store = {
    get: function (key, fallback) {
      try {
        var raw = window.localStorage.getItem(key);
        return raw === null ? fallback : raw;
      } catch (e) { return fallback; }
    },
    set: function (key, value) {
      try { window.localStorage.setItem(key, value); } catch (e) { /* private mode */ }
    }
  };

  var reduceMotion = function () {
    try {
      return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (e) { return false; }
  };

  var escapeHtml = function (value) {
    return String(value === null || typeof value === 'undefined' ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  var fileName = function (path) {
    var clean = String(path || '').split('?')[0].split('#')[0];
    var parts = clean.split('/');
    var last = parts[parts.length - 1];
    return last === '' ? 'index.html' : last.toLowerCase();
  };

  /* Azerbaijani-friendly folding so "mekteb" finds "Məktəb" and "IS" finds "İş". */
  var fold = function (value) {
    var s = String(value === null || typeof value === 'undefined' ? '' : value);
    s = s.replace(/İ/g, 'i').replace(/ı/g, 'i');   /* İ, ı */
    s = s.toLowerCase().replace(/\u0307/g, '');   /* combining dot above */
    return s
      .replace(/ə/g, 'e')   /* ə */
      .replace(/ö/g, 'o')   /* ö */
      .replace(/ü/g, 'u')   /* ü */
      .replace(/ş/g, 's')   /* ş */
      .replace(/ç/g, 'c')   /* ç */
      .replace(/ğ/g, 'g')   /* ğ */
      .replace(/\s+/g, ' ')
      .trim();
  };

  var collator = (function () {
    try {
      if (window.Intl && window.Intl.Collator) {
        return new window.Intl.Collator('az', { numeric: true, sensitivity: 'base' });
      }
    } catch (e) { /* fall through */ }
    return null;
  }());

  var compareText = function (a, b) {
    if (collator) return collator.compare(a, b);
    a = fold(a); b = fold(b);
    return a < b ? -1 : (a > b ? 1 : 0);
  };

  /* "12 000 AZN /il" → 12000 · "−3" → -3 · "+4.2%" → 4.2 */
  var toNumber = function (value) {
    var s = String(value === null || typeof value === 'undefined' ? '' : value)
      .replace(/[\s\u00A0\u202F\u2009]/g, '')
      .replace(/−/g, '-');
    var m = /-?\d+(?:[.,]\d+)?/.exec(s);
    if (!m) return NaN;
    return parseFloat(m[0].replace(',', '.'));
  };

  var MONTHS_AZ = {
    yanvar: 0, fevral: 1, mart: 2, aprel: 3, may: 4, iyun: 5,
    iyul: 6, avqust: 7, sentyabr: 8, oktyabr: 9, noyabr: 10, dekabr: 11
  };

  var toDate = function (value) {
    var raw = String(value === null || typeof value === 'undefined' ? '' : value).trim();
    if (!raw) return NaN;

    var iso = /(\d{4})-(\d{1,2})-(\d{1,2})/.exec(raw);
    if (iso) return Date.UTC(+iso[1], +iso[2] - 1, +iso[3]);

    var dotted = /(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/.exec(raw);
    if (dotted) return Date.UTC(+dotted[3], +dotted[2] - 1, +dotted[1]);

    var az = /(\d{1,2})\s+([^\s\d]+)\s+(\d{4})/.exec(raw);
    if (az) {
      var month = MONTHS_AZ[fold(az[2])];
      if (typeof month === 'number') return Date.UTC(+az[3], month, +az[1]);
    }
    return NaN;
  };

  var svgNS = 'http://www.w3.org/2000/svg';
  var svgEl = function (name, attrs) {
    var node = document.createElementNS(svgNS, name);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        if (attrs[key] !== null && typeof attrs[key] !== 'undefined') {
          node.setAttribute(key, String(attrs[key]));
        }
      });
    }
    return node;
  };

  var round = function (n) { return Math.round(n * 100) / 100; };

  var focusablesIn = function (root) {
    if (!root) return [];
    return $$('a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), ' +
      'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', root)
      .filter(function (el) {
        return el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement;
      });
  };

  var trapTab = function (ev, root) {
    if (ev.key !== 'Tab') return;
    var items = focusablesIn(root);
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (ev.shiftKey && document.activeElement === first) {
      ev.preventDefault();
      last.focus();
    } else if (!ev.shiftKey && document.activeElement === last) {
      ev.preventDefault();
      first.focus();
    }
  };

  /* Shared UI strings — CONTENT.md, "Admin panel strings". */
  var TXT = {
    selected: 'seçildi',
    clearSelection: 'Seçimi ləğv et',
    prev: 'Əvvəlki',
    next: 'Sonrakı',
    prevAria: 'Əvvəlki səhifə',
    nextAria: 'Sonrakı səhifə',
    pageAria: 'Səhifə',
    of: 'nəticə',
    approved: 'Təsdiqləndi',
    rejected: 'Rədd edildi',
    archived: 'Arxivləndi',
    deleted: 'Silindi',
    saved: 'Yadda saxlanıldı',
    undo: 'Geri qaytar',
    restored: 'Geri qaytarıldı',
    close: 'Bağla',
    sortAsc: 'artan sıra',
    sortDesc: 'azalan sıra',
    nothingSelected: 'Heç bir sətir seçilməyib'
  };

  var STATUS = {
    aktiv:    { label: 'Aktiv',       cls: 'badge--ok' },
    gozleyir: { label: 'Gözləyir',    cls: 'badge--warn' },
    redd:     { label: 'Rədd edildi', cls: 'badge--danger' },
    arxiv:    { label: 'Arxiv',       cls: '' }
  };
  var STATUS_CLASSES = ['badge--ok', 'badge--warn', 'badge--danger', 'badge--info'];

  /* =====================================================================
     1. AdmSidebar — collapse toggle, off-canvas drawer, active link
     ===================================================================== */
  var AdmSidebar = (function () {
    var root = null;
    var side = null;
    var scrim = null;
    var collapseBtns = [];
    var openBtns = [];
    var mqDrawer = null;
    var drawerOpen = false;
    var lastFocus = null;

    function isDrawerMode() {
      return !!(mqDrawer && mqDrawer.matches);
    }

    function syncCollapseButtons(collapsed) {
      collapseBtns.forEach(function (btn) {
        btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        btn.setAttribute('aria-label', collapsed ? 'Yan paneli aç' : 'Yan paneli yığ');
        btn.classList.toggle('is-on', collapsed);
      });
    }

    function applyCollapsed(collapsed, persist) {
      if (!root) return;
      root.classList.toggle('is-side-collapsed', !!collapsed);
      syncCollapseButtons(!!collapsed);
      if (persist) store.set(KEY_SIDE, collapsed ? 'collapsed' : 'expanded');
    }

    function ensureScrim() {
      if (scrim && scrim.parentNode) return scrim;
      scrim = $('.adm-scrim', root) || $('.adm-scrim');
      if (!scrim) {
        scrim = document.createElement('div');
        scrim.className = 'adm-scrim';
        (root || document.body).appendChild(scrim);
      }
      scrim.setAttribute('hidden', '');
      on(scrim, 'click', function () { closeDrawer(true); });
      return scrim;
    }

    function openDrawer() {
      if (!root || !side || drawerOpen) return;
      lastFocus = document.activeElement;
      drawerOpen = true;
      root.classList.add('is-side-open');
      document.body.classList.add('is-locked');
      if (scrim) scrim.removeAttribute('hidden');
      side.setAttribute('aria-hidden', 'false');
      openBtns.forEach(function (b) { b.setAttribute('aria-expanded', 'true'); });
      var first = focusablesIn(side)[0];
      if (first && first.focus) first.focus();
    }

    function closeDrawer(restoreFocus) {
      if (!root || !drawerOpen) return;
      drawerOpen = false;
      root.classList.remove('is-side-open');
      document.body.classList.remove('is-locked');
      if (scrim) scrim.setAttribute('hidden', '');
      openBtns.forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
      if (side) side.setAttribute('aria-hidden', isDrawerMode() ? 'true' : 'false');
      if (restoreFocus && lastFocus && lastFocus.focus) lastFocus.focus();
      lastFocus = null;
    }

    function onModeChange() {
      if (!side) return;
      if (isDrawerMode()) {
        side.setAttribute('aria-hidden', drawerOpen ? 'false' : 'true');
      } else {
        closeDrawer(false);
        side.removeAttribute('aria-hidden');
      }
    }

    function markActive() {
      var here = fileName(window.location.pathname);
      var links = $$('.adm-nav-link');
      var matched = null;

      links.forEach(function (link) {
        var href = link.getAttribute('href');
        if (!href || href.charAt(0) === '#') return;
        if (fileName(href) === here) matched = matched || link;
      });

      /* `admin/` with no file resolves to index.html; keep the dashboard lit. */
      if (!matched && (here === 'index.html' || here === '')) {
        matched = links.filter(function (l) {
          return fileName(l.getAttribute('href') || '') === 'index.html';
        })[0] || null;
      }

      links.forEach(function (link) {
        var isActive = link === matched;
        link.classList.toggle('is-active', isActive);
        if (isActive) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });

      if (matched) {
        var group = matched.closest ? matched.closest('.adm-nav-group') : null;
        if (group) group.classList.add('is-current');
      }
    }

    function init() {
      root = $('.adm');
      side = $('.adm-side');
      markActive();
      if (!root) return;

      collapseBtns = $$('[data-adm-side-toggle]');
      openBtns = $$('[data-adm-side-open]');

      applyCollapsed(store.get(KEY_SIDE, 'expanded') === 'collapsed', false);

      collapseBtns.forEach(function (btn) {
        if (btn.tagName === 'BUTTON' && !btn.getAttribute('type')) btn.setAttribute('type', 'button');
        on(btn, 'click', function () {
          /* On phones the same control acts as the drawer handle. */
          if (isDrawerMode()) {
            if (drawerOpen) closeDrawer(true); else openDrawer();
            return;
          }
          applyCollapsed(!root.classList.contains('is-side-collapsed'), true);
        });
      });

      ensureScrim();

      openBtns.forEach(function (btn) {
        if (btn.tagName === 'BUTTON' && !btn.getAttribute('type')) btn.setAttribute('type', 'button');
        btn.setAttribute('aria-expanded', 'false');
        if (side && side.id) btn.setAttribute('aria-controls', side.id);
        on(btn, 'click', function () {
          if (drawerOpen) closeDrawer(true); else openDrawer();
        });
      });

      $$('[data-adm-side-close]').forEach(function (btn) {
        if (btn.tagName === 'BUTTON' && !btn.getAttribute('type')) btn.setAttribute('type', 'button');
        on(btn, 'click', function () { closeDrawer(true); });
      });

      /* Following a nav link inside the drawer should not leave it hanging open. */
      $$('.adm-nav-link', side).forEach(function (link) {
        on(link, 'click', function () { if (isDrawerMode()) closeDrawer(false); });
      });

      on(document, 'keydown', function (ev) {
        if (ev.key === 'Escape' && drawerOpen) {
          ev.preventDefault();
          closeDrawer(true);
        }
      });

      on(side, 'keydown', function (ev) {
        if (drawerOpen) trapTab(ev, side);
      });

      try {
        mqDrawer = window.matchMedia('(max-width: 768px)');
        if (mqDrawer.addEventListener) mqDrawer.addEventListener('change', onModeChange);
        else if (mqDrawer.addListener) mqDrawer.addListener(onModeChange);
      } catch (e) { mqDrawer = null; }
      onModeChange();
    }

    return { init: init, close: function () { closeDrawer(false); } };
  }());

  /* =====================================================================
     5. AdmToast — window.admToast(msg, type) + optimistic demo actions
        (defined before the table so bulk actions can call it)
     ===================================================================== */
  var AdmToast = (function () {
    var host = null;
    var MAX = 4;
    var LIFE = 4200;

    function ensureHost() {
      if (host && host.parentNode) return host;
      host = $('.adm-toasts');
      if (!host) {
        host = document.createElement('div');
        host.className = 'adm-toasts';
        document.body.appendChild(host);
      }
      host.setAttribute('role', 'status');
      host.setAttribute('aria-live', 'polite');
      host.setAttribute('aria-atomic', 'false');
      return host;
    }

    function dismiss(toast) {
      if (!toast || toast.dataset.closing === '1') return;
      toast.dataset.closing = '1';
      if (toast.timer) window.clearTimeout(toast.timer);
      if (reduceMotion()) {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
        return;
      }
      toast.classList.remove('is-in');
      toast.classList.add('is-out');
      window.setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 260);
    }

    /**
     * @param {string} msg   Azerbaijani message body.
     * @param {string} [type] 'ok' | 'danger' | 'warn' | 'info' (default 'ok').
     * @param {{label:string, onClick:Function}} [action] optional single action.
     */
    function toast(msg, type, action) {
      var box = ensureHost();
      var kind = ['ok', 'danger', 'warn', 'info'].indexOf(String(type || '')) > -1 ? type : 'ok';

      var el = document.createElement('div');
      el.className = 'adm-toast adm-toast--' + kind;
      el.setAttribute('role', kind === 'danger' ? 'alert' : 'status');

      var html = '<span class="adm-toast-dot" aria-hidden="true"></span>' +
        '<span class="adm-toast-msg">' + escapeHtml(msg) + '</span>';
      if (action && action.label) {
        html += '<button class="adm-toast-action" type="button">' + escapeHtml(action.label) + '</button>';
      }
      html += '<button class="adm-toast-close" type="button" aria-label="' + TXT.close + '">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
        'stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>' +
        '</button>';
      el.innerHTML = html;

      var actionBtn = $('.adm-toast-action', el);
      if (actionBtn && action && typeof action.onClick === 'function') {
        on(actionBtn, 'click', function () {
          dismiss(el);
          try { action.onClick(); } catch (e) { /* demo handler */ }
        });
      }
      on($('.adm-toast-close', el), 'click', function () { dismiss(el); });

      box.appendChild(el);
      while (box.children.length > MAX) dismiss(box.children[0]);

      if (!reduceMotion()) {
        window.requestAnimationFrame(function () { el.classList.add('is-in'); });
      } else {
        el.classList.add('is-in');
      }

      el.timer = window.setTimeout(function () { dismiss(el); }, action ? LIFE + 2600 : LIFE);
      on(el, 'mouseenter', function () { if (el.timer) window.clearTimeout(el.timer); });
      on(el, 'mouseleave', function () {
        el.timer = window.setTimeout(function () { dismiss(el); }, 2000);
      });
      return el;
    }

    return { toast: toast };
  }());

  window.admToast = function (msg, type, action) {
    return AdmToast.toast(msg, type, action);
  };

  /* =====================================================================
     2. AdmTable — sorting, selection + bulk bar, pagination, text filter
     ===================================================================== */
  var AdmTable = (function () {
    var instances = [];

    function scopeOf(table) {
      if (!table.closest) return document;
      return table.closest('[data-adm-table]') ||
        table.closest('.adm-panel') ||
        table.closest('.adm-card') ||
        table.parentElement ||
        document;
    }

    function searchInputIn(scope) {
      var direct = $('input.adm-search', scope);
      if (direct) return direct;
      var wrap = $('.adm-search', scope);
      return wrap ? $('input', wrap) : null;
    }

    function create(table) {
      var tbody = table.tBodies && table.tBodies[0];
      if (!tbody) return null;

      var scope = scopeOf(table);
      var rows = $$('tr', tbody).filter(function (r) { return !r.hasAttribute('data-adm-norow'); });
      if (!rows.length) return null;

      var toolbar = $('.adm-toolbar', scope) || $('.adm-toolbar');
      var pager = $('.adm-pager', scope);
      var empty = $('.adm-empty', scope);
      var searchInput = searchInputIn(scope);
      var countOut = $('[data-adm-result-count]', scope);
      var checkAll = $('input[data-adm-check-all]', table);

      var pageSize = Math.max(1, parseInt(
        table.getAttribute('data-page-size') ||
        (scope.getAttribute && scope.getAttribute('data-page-size')) || '10', 10) || 10);

      var api = {
        table: table,
        scope: scope,
        rows: rows,
        page: 1,
        pageSize: pageSize,
        query: '',
        sortIndex: -1,
        sortDir: 1,
        predicates: {},
        matched: rows.slice(),
        visible: rows.slice()
      };

      /* --- text haystack, cached per row ------------------------------- */
      function haystack(row) {
        if (typeof row._admHay !== 'string') {
          var extra = row.getAttribute('data-adm-search') || '';
          row._admHay = fold((row.textContent || '') + ' ' + extra);
        }
        return row._admHay;
      }

      /* --- sorting ------------------------------------------------------ */
      var heads = $$('th[data-sort]', table);

      function cellValue(row, index) {
        var cell = row.cells ? row.cells[index] : null;
        if (!cell) return '';
        var explicit = cell.getAttribute('data-sort-value');
        if (explicit !== null) return explicit;
        return (cell.textContent || '').trim();
      }

      function sortKey(type) {
        if (type === 'num' || type === 'number') return toNumber;
        if (type === 'date') return toDate;
        return null;
      }

      function applySort() {
        if (api.sortIndex < 0) return;
        var th = heads.filter(function (h) { return h.cellIndex === api.sortIndex; })[0];
        var type = th ? (th.getAttribute('data-sort') || 'text') : 'text';
        var key = sortKey(type);
        var dir = api.sortDir;

        var decorated = api.rows.map(function (row, i) {
          return { row: row, i: i, raw: cellValue(row, api.sortIndex) };
        });

        decorated.sort(function (a, b) {
          var res = 0;
          if (key) {
            var na = key(a.raw);
            var nb = key(b.raw);
            var aBad = typeof na !== 'number' || isNaN(na);
            var bBad = typeof nb !== 'number' || isNaN(nb);
            /* Unparsable cells sink to the bottom in both directions. */
            if (aBad !== bBad) return aBad ? 1 : -1;
            if (!aBad && na !== nb) res = (na < nb ? -1 : 1) * dir;
          } else {
            res = compareText(a.raw, b.raw) * dir;
          }
          return res !== 0 ? res : a.i - b.i; /* stable */
        });

        api.rows = decorated.map(function (d) { return d.row; });

        var frag = document.createDocumentFragment();
        api.rows.forEach(function (row) { frag.appendChild(row); });
        tbody.appendChild(frag);
      }

      function syncSortHeads() {
        heads.forEach(function (th) {
          var active = th.cellIndex === api.sortIndex;
          th.setAttribute('aria-sort', active ? (api.sortDir === 1 ? 'ascending' : 'descending') : 'none');
          th.classList.toggle('is-sorted', active);
          th.classList.toggle('is-asc', active && api.sortDir === 1);
          th.classList.toggle('is-desc', active && api.sortDir === -1);
        });
      }

      function sortBy(th) {
        var index = th.cellIndex;
        if (api.sortIndex === index) api.sortDir = api.sortDir === 1 ? -1 : 1;
        else { api.sortIndex = index; api.sortDir = 1; }
        applySort();
        syncSortHeads();
        api.page = 1;
        render();
        var label = (th.textContent || '').trim();
        if (label) {
          th.setAttribute('title', label + ' — ' + (api.sortDir === 1 ? TXT.sortAsc : TXT.sortDesc));
        }
      }

      heads.forEach(function (th) {
        th.setAttribute('aria-sort', 'none');
        th.classList.add('is-sortable');
        var inner = $('button', th);
        if (inner) {
          if (!inner.getAttribute('type')) inner.setAttribute('type', 'button');
          on(inner, 'click', function () { sortBy(th); });
          return;
        }
        if (!th.hasAttribute('tabindex')) th.setAttribute('tabindex', '0');
        on(th, 'click', function () { sortBy(th); });
        on(th, 'keydown', function (ev) {
          if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'Spacebar') {
            ev.preventDefault();
            sortBy(th);
          }
        });
      });

      /* --- filtering ---------------------------------------------------- */
      function matches(row) {
        if (api.query && haystack(row).indexOf(api.query) === -1) return false;
        var keys = Object.keys(api.predicates);
        for (var i = 0; i < keys.length; i++) {
          var fn = api.predicates[keys[i]];
          if (typeof fn === 'function' && !fn(row)) return false;
        }
        return true;
      }

      /* --- selection ---------------------------------------------------- */
      function boxOf(row) { return $('input[data-adm-check]', row); }

      function selectedRows() {
        return api.rows.filter(function (row) {
          var box = boxOf(row);
          return !!(box && box.checked && !row.hidden);
        });
      }

      function syncSelection() {
        var picked = selectedRows();
        var n = picked.length;

        api.rows.forEach(function (row) {
          var box = boxOf(row);
          row.classList.toggle('is-selected', !!(box && box.checked && !row.hidden));
        });

        if (checkAll) {
          var onPage = api.visible.filter(function (r) { return !!boxOf(r); });
          var checkedOnPage = onPage.filter(function (r) { return boxOf(r).checked; }).length;
          checkAll.checked = onPage.length > 0 && checkedOnPage === onPage.length;
          checkAll.indeterminate = checkedOnPage > 0 && checkedOnPage < onPage.length;
          checkAll.disabled = onPage.length === 0;
        }

        if (toolbar) {
          toolbar.classList.toggle('is-on', n > 0);
          toolbar.setAttribute('aria-hidden', n > 0 ? 'false' : 'true');
          $$('[data-adm-selected]', toolbar).forEach(function (out) {
            out.textContent = n + ' ' + TXT.selected;
          });
          $$('[data-adm-bulk]', toolbar).forEach(function (btn) { btn.disabled = n === 0; });
        }
      }

      function clearSelection() {
        api.rows.forEach(function (row) {
          var box = boxOf(row);
          if (box) box.checked = false;
        });
        syncSelection();
      }

      $$('input[data-adm-check]', tbody).forEach(function (box) {
        if (!box.getAttribute('aria-label') && !box.id) {
          box.setAttribute('aria-label', 'Sətri seç');
        }
        on(box, 'change', syncSelection);
      });

      if (checkAll) {
        if (!checkAll.getAttribute('aria-label')) checkAll.setAttribute('aria-label', 'Hamısını seç');
        on(checkAll, 'change', function () {
          var want = checkAll.checked;
          api.visible.forEach(function (row) {
            var box = boxOf(row);
            if (box) box.checked = want;
          });
          syncSelection();
        });
      }

      if (toolbar) {
        $$('[data-adm-clear-selection]', toolbar).forEach(function (btn) {
          if (btn.tagName === 'BUTTON' && !btn.getAttribute('type')) btn.setAttribute('type', 'button');
          on(btn, 'click', clearSelection);
        });
      }

      /* --- pagination ---------------------------------------------------- */
      function pageCount() {
        return Math.max(1, Math.ceil(api.matched.length / api.pageSize));
      }

      function pageWindow(total, current) {
        var out = [];
        var i;
        if (total <= 7) {
          for (i = 1; i <= total; i++) out.push(i);
          return out;
        }
        out.push(1);
        var from = Math.max(2, current - 1);
        var to = Math.min(total - 1, current + 1);
        if (from > 2) out.push('…');
        for (i = from; i <= to; i++) out.push(i);
        if (to < total - 1) out.push('…');
        out.push(total);
        return out;
      }

      function renderPager() {
        if (!pager) return;
        var total = api.matched.length;
        var pages = pageCount();

        if (total <= api.pageSize) {
          pager.innerHTML = '';
          pager.setAttribute('hidden', '');
          return;
        }
        pager.removeAttribute('hidden');
        pager.setAttribute('role', 'navigation');
        if (!pager.getAttribute('aria-label')) pager.setAttribute('aria-label', 'Səhifələmə');

        var from = (api.page - 1) * api.pageSize + 1;
        var to = Math.min(total, api.page * api.pageSize);

        var html = '<span class="adm-pager-info">' + from + '–' + to + ' / ' + total + ' ' + TXT.of + '</span>' +
          '<span class="adm-pager-btns">' +
          '<button class="adm-pager-btn" type="button" data-adm-page="prev" aria-label="' + TXT.prevAria + '"' +
          (api.page === 1 ? ' disabled' : '') + '>' + TXT.prev + '</button>';

        pageWindow(pages, api.page).forEach(function (item) {
          if (item === '…') {
            html += '<span class="adm-pager-gap" aria-hidden="true">…</span>';
            return;
          }
          html += '<button class="adm-pager-num' + (item === api.page ? ' is-on' : '') +
            '" type="button" data-adm-page="' + item + '" aria-label="' + TXT.pageAria + ' ' + item + '"' +
            (item === api.page ? ' aria-current="page"' : '') + '>' + item + '</button>';
        });

        html += '<button class="adm-pager-btn" type="button" data-adm-page="next" aria-label="' + TXT.nextAria + '"' +
          (api.page === pages ? ' disabled' : '') + '>' + TXT.next + '</button></span>';

        pager.innerHTML = html;
      }

      if (pager) {
        on(pager, 'click', function (ev) {
          var btn = ev.target && ev.target.closest ? ev.target.closest('[data-adm-page]') : null;
          if (!btn || btn.disabled) return;
          var value = btn.getAttribute('data-adm-page');
          var pages = pageCount();
          if (value === 'prev') api.page = Math.max(1, api.page - 1);
          else if (value === 'next') api.page = Math.min(pages, api.page + 1);
          else api.page = Math.min(pages, Math.max(1, parseInt(value, 10) || 1));
          render();
          var wrap = $('.table-wrap', scope) || table;
          if (wrap && wrap.scrollIntoView && !reduceMotion()) {
            wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        });
      }

      /* --- render --------------------------------------------------------- */
      function render() {
        api.matched = api.rows.filter(matches);

        var pages = pageCount();
        if (api.page > pages) api.page = pages;
        if (api.page < 1) api.page = 1;

        var start = (api.page - 1) * api.pageSize;
        api.visible = api.matched.slice(start, start + api.pageSize);

        var onPage = api.visible;
        api.rows.forEach(function (row) {
          var show = onPage.indexOf(row) > -1;
          row.hidden = !show;
          row.classList.toggle('is-hidden', !show);
          if (!show) {
            var box = boxOf(row);
            if (box && box.checked) box.checked = false;
          }
        });

        if (empty) {
          if (api.matched.length === 0) empty.removeAttribute('hidden');
          else empty.setAttribute('hidden', '');
        }
        table.classList.toggle('is-empty', api.matched.length === 0);

        if (countOut) countOut.textContent = String(api.matched.length);

        renderPager();
        syncSelection();

        table.dispatchEvent(new CustomEvent('adm:table:render', {
          bubbles: true,
          detail: { total: api.rows.length, matched: api.matched.length, page: api.page }
        }));
      }

      /* --- live search ------------------------------------------------------ */
      if (searchInput) {
        var debounce = null;
        if (!searchInput.getAttribute('type')) searchInput.setAttribute('type', 'search');
        if (!searchInput.getAttribute('aria-label') && !searchInput.getAttribute('placeholder')) {
          searchInput.setAttribute('aria-label', 'Cədvəldə axtar');
        }
        on(searchInput, 'input', function () {
          window.clearTimeout(debounce);
          debounce = window.setTimeout(function () {
            api.query = fold(searchInput.value);
            api.page = 1;
            render();
          }, 130);
        });
        on(searchInput, 'keydown', function (ev) {
          if (ev.key === 'Escape' && searchInput.value) {
            ev.preventDefault();
            searchInput.value = '';
            api.query = '';
            api.page = 1;
            render();
          }
        });
        if (searchInput.value) api.query = fold(searchInput.value);
      }

      /* --- public surface ---------------------------------------------------- */
      api.setPredicate = function (name, fn) {
        if (!name) return;
        if (typeof fn === 'function') api.predicates[name] = fn;
        else delete api.predicates[name];
        api.page = 1;
        render();
      };
      api.clearPredicates = function () {
        api.predicates = {};
        api.page = 1;
        render();
      };
      api.refresh = function (resetPage) {
        if (resetPage) api.page = 1;
        render();
      };
      api.selected = selectedRows;
      api.clearSelection = clearSelection;
      api.removeRow = function (row) {
        var i = api.rows.indexOf(row);
        if (i === -1) return null;
        var ref = { row: row, index: i, next: row.nextElementSibling };
        api.rows.splice(i, 1);
        if (row.parentNode) row.parentNode.removeChild(row);
        render();
        return ref;
      };
      api.restoreRow = function (ref) {
        if (!ref || !ref.row) return;
        var index = Math.min(Math.max(0, ref.index), api.rows.length);
        api.rows.splice(index, 0, ref.row);
        if (ref.next && ref.next.parentNode === tbody) tbody.insertBefore(ref.row, ref.next);
        else tbody.appendChild(ref.row);
        var box = boxOf(ref.row);
        if (box) box.checked = false;
        render();
      };

      table._adm = api;
      scope._adm = scope._adm || api;
      render();
      return api;
    }

    function forElement(node) {
      if (!node || !node.closest) return instances[0] || null;
      var table = node.closest('table.adm-table') || node.closest('.adm-table');
      if (table && table._adm) return table._adm;
      var scope = node.closest('[data-adm-table]') || node.closest('.adm-panel');
      if (scope) {
        var inner = $('table.adm-table', scope);
        if (inner && inner._adm) return inner._adm;
        if (scope._adm) return scope._adm;
      }
      return instances[0] || null;
    }

    function init() {
      var tables = $$('table.adm-table');
      if (!tables.length) tables = $$('.adm-table').filter(function (t) { return t.tagName === 'TABLE'; });
      tables.forEach(function (table) {
        var made = create(table);
        if (made) instances.push(made);
      });
    }

    return { init: init, all: function () { return instances.slice(); }, forElement: forElement };
  }());

  /* =====================================================================
     3. AdmFilters — chip groups + .dd dropdowns narrowing the visible rows
     ===================================================================== */
  var AdmFilters = (function () {
    /* A row matches when its data-<key> attribute contains the wanted token.
       data-rayon="nesimi" or data-xidmet="neqliyyat,yemek" both work. */
    function rowTokens(row, key) {
      var raw = row.getAttribute('data-' + key);
      if (raw === null) return [];
      return String(raw).split(',').map(fold).filter(Boolean);
    }

    function makePredicate(key, wanted) {
      var needles = wanted.map(fold).filter(Boolean);
      if (!needles.length) return null;
      return function (row) {
        var tokens = rowTokens(row, key);
        if (!tokens.length) return false;
        for (var i = 0; i < needles.length; i++) {
          if (tokens.indexOf(needles[i]) > -1) return true;   /* OR inside one group */
        }
        return false;
      };
    }

    function initChipGroup(group) {
      var key = group.getAttribute('data-adm-filter-group');
      if (!key) return;
      var multi = group.hasAttribute('data-adm-multi');
      var chips = $$('[data-adm-value]', group);
      if (!chips.length) return;

      var api = AdmTable.forElement(group);

      function currentValues() {
        return chips
          .filter(function (c) { return c.classList.contains('is-on'); })
          .map(function (c) { return c.getAttribute('data-adm-value') || ''; })
          .filter(Boolean);
      }

      function push() {
        if (!api) api = AdmTable.forElement(group);
        if (!api) return;
        api.setPredicate('chip:' + key, makePredicate(key, currentValues()));
      }

      chips.forEach(function (chip) {
        if (chip.tagName === 'BUTTON' && !chip.getAttribute('type')) chip.setAttribute('type', 'button');
        chip.setAttribute('aria-pressed', chip.classList.contains('is-on') ? 'true' : 'false');

        on(chip, 'click', function () {
          var value = chip.getAttribute('data-adm-value') || '';
          var wasOn = chip.classList.contains('is-on');

          if (!value) {
            /* the "Hamısı" chip clears the group */
            chips.forEach(function (c) {
              c.classList.toggle('is-on', c === chip);
              c.setAttribute('aria-pressed', c === chip ? 'true' : 'false');
            });
          } else if (multi) {
            chip.classList.toggle('is-on', !wasOn);
            chip.setAttribute('aria-pressed', !wasOn ? 'true' : 'false');
            var allChip = chips.filter(function (c) { return !(c.getAttribute('data-adm-value') || ''); })[0];
            if (allChip) {
              var any = chips.some(function (c) {
                return c !== allChip && c.classList.contains('is-on');
              });
              allChip.classList.toggle('is-on', !any);
              allChip.setAttribute('aria-pressed', !any ? 'true' : 'false');
            }
          } else {
            chips.forEach(function (c) {
              var isOn = c === chip && !wasOn;
              c.classList.toggle('is-on', isOn);
              c.setAttribute('aria-pressed', isOn ? 'true' : 'false');
            });
          }
          push();
        });
      });

      group._admPush = push;
      group._admReset = function () {
        chips.forEach(function (c) {
          var isAll = !(c.getAttribute('data-adm-value') || '');
          c.classList.toggle('is-on', isAll);
          c.setAttribute('aria-pressed', isAll ? 'true' : 'false');
        });
      };
      push();
    }

    function initDropdown(dd) {
      var key = dd.getAttribute('data-adm-filter') || dd.getAttribute('data-name');
      if (!key) return;
      var api = AdmTable.forElement(dd);

      function push() {
        if (!api) api = AdmTable.forElement(dd);
        if (!api) return;
        var raw = dd.dataset ? (dd.dataset.value || '') : '';
        var values = raw.split(',').filter(Boolean);
        api.setPredicate('dd:' + key, makePredicate(key, values));
      }

      /* app.js fires dd:change on every selection; the click fallback covers
         a dropdown that was rendered without app.js having initialised it. */
      on(dd, 'dd:change', push);
      on(dd, 'click', function (ev) {
        if (ev.target && ev.target.closest && ev.target.closest('.dd-option, .dd-clear')) {
          window.setTimeout(push, 0);
        }
      });

      dd._admPush = push;
      dd._admReset = function () {
        $$('.dd-option', dd).forEach(function (o) { o.setAttribute('aria-selected', 'false'); });
        var value = $('.dd-value', dd);
        if (value) {
          value.textContent = value.getAttribute('data-placeholder') || 'Hamısı';
          value.classList.add('is-placeholder');
        }
        if (dd.dataset) dd.dataset.value = '';
      };
      push();
    }

    function initNativeSelect(select) {
      var key = select.getAttribute('data-adm-filter');
      if (!key) return;
      var api = AdmTable.forElement(select);
      function push() {
        if (!api) api = AdmTable.forElement(select);
        if (!api) return;
        api.setPredicate('sel:' + key, makePredicate(key, select.value ? [select.value] : []));
      }
      on(select, 'change', push);
      select._admPush = push;
      select._admReset = function () { select.selectedIndex = 0; };
      push();
    }

    function init() {
      $$('[data-adm-filter-group]').forEach(initChipGroup);
      $$('.dd[data-adm-filter], [data-dd][data-adm-filter]').forEach(initDropdown);
      $$('select[data-adm-filter]').forEach(initNativeSelect);

      $$('[data-adm-filter-reset]').forEach(function (btn) {
        if (btn.tagName === 'BUTTON' && !btn.getAttribute('type')) btn.setAttribute('type', 'button');
        on(btn, 'click', function () {
          var scope = btn.closest ? (btn.closest('[data-adm-table]') || btn.closest('.adm-panel') || document) : document;
          $$('[data-adm-filter-group], [data-adm-filter]', scope).forEach(function (node) {
            if (typeof node._admReset === 'function') node._admReset();
            if (typeof node._admPush === 'function') node._admPush();
          });
          var input = $('input.adm-search', scope) || ($('.adm-search', scope) ? $('input', $('.adm-search', scope)) : null);
          if (input) {
            input.value = '';
            input.dispatchEvent(new Event('input', { bubbles: true }));
          }
          var api = AdmTable.forElement(btn);
          if (api) api.refresh(true);
        });
      });
    }

    return { init: init };
  }());

  /* =====================================================================
     4. AdmDrawer — [data-adm-drawer="id"] → right-side .adm-drawer panel
     ===================================================================== */
  var AdmDrawer = (function () {
    var openPanel = null;
    var lastFocus = null;
    var scrim = null;

    function ensureScrim() {
      if (scrim && scrim.parentNode) return scrim;
      scrim = $('.adm-drawer-scrim');
      if (!scrim) {
        scrim = document.createElement('div');
        scrim.className = 'adm-drawer-scrim';
        document.body.appendChild(scrim);
      }
      scrim.setAttribute('hidden', '');
      on(scrim, 'click', function () { close(); });
      return scrim;
    }

    function panelFor(id) {
      if (!id) return null;
      return $('.adm-drawer[data-adm-drawer-id="' + id + '"]') ||
        $('.adm-drawer#' + id) ||
        (document.getElementById(id) && document.getElementById(id).classList.contains('adm-drawer')
          ? document.getElementById(id) : null);
    }

    /* Demo detail data: JSON on the trigger, else the row's data-* attributes. */
    function dataFor(trigger) {
      var out = {};
      var row = trigger.closest ? trigger.closest('tr') : null;
      if (row && row.dataset) {
        Object.keys(row.dataset).forEach(function (k) { out[k] = row.dataset[k]; });
      }
      if (row) {
        $$('[data-adm-cell]', row).forEach(function (cell) {
          out[cell.getAttribute('data-adm-cell')] = (cell.textContent || '').trim();
        });
      }
      var raw = trigger.getAttribute('data-adm-drawer-data');
      if (raw) {
        try {
          var parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            Object.keys(parsed).forEach(function (k) { out[k] = parsed[k]; });
          }
        } catch (e) { /* malformed demo JSON — keep the row data */ }
      }
      return out;
    }

    function fill(panel, data) {
      $$('[data-adm-field]', panel).forEach(function (node) {
        var key = node.getAttribute('data-adm-field');
        if (!key || !Object.prototype.hasOwnProperty.call(data, key)) return;
        var value = data[key];
        var attr = node.getAttribute('data-adm-field-attr');
        if (attr) {
          node.setAttribute(attr, String(value));
          return;
        }
        node.textContent = String(value);
        if (node.classList.contains('badge')) {
          var meta = STATUS[fold(node.getAttribute('data-adm-status') || value)] ||
            STATUS[fold(data.status || '')];
          if (meta) {
            STATUS_CLASSES.forEach(function (c) { node.classList.remove(c); });
            if (meta.cls) node.classList.add(meta.cls);
            node.textContent = meta.label;
          }
        }
      });
    }

    function open(id, trigger) {
      var panel = panelFor(id);
      if (!panel) return;
      if (openPanel && openPanel !== panel) close(true);

      lastFocus = trigger || document.activeElement;
      if (trigger) fill(panel, dataFor(trigger));

      ensureScrim().removeAttribute('hidden');
      panel.classList.add('is-open');
      panel.setAttribute('aria-hidden', 'false');
      if (!panel.getAttribute('role')) panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-modal', 'true');
      document.body.classList.add('is-locked');
      openPanel = panel;

      var first = focusablesIn(panel)[0];
      if (first && first.focus) first.focus();
      else if (panel.focus) {
        if (!panel.hasAttribute('tabindex')) panel.setAttribute('tabindex', '-1');
        panel.focus();
      }

      panel.dispatchEvent(new CustomEvent('adm:drawer:open', { bubbles: true, detail: { id: id } }));
    }

    function close(skipFocus) {
      if (!openPanel) return;
      var panel = openPanel;
      openPanel = null;
      panel.classList.remove('is-open');
      panel.setAttribute('aria-hidden', 'true');
      panel.removeAttribute('aria-modal');
      if (scrim) scrim.setAttribute('hidden', '');
      document.body.classList.remove('is-locked');
      if (!skipFocus && lastFocus && lastFocus.focus) lastFocus.focus();
      lastFocus = null;
      panel.dispatchEvent(new CustomEvent('adm:drawer:close', { bubbles: true }));
    }

    function init() {
      var panels = $$('.adm-drawer');
      if (!panels.length && !$$('[data-adm-drawer]').length) return;

      panels.forEach(function (panel) {
        panel.setAttribute('aria-hidden', 'true');
        $$('[data-adm-drawer-close], [data-close]', panel).forEach(function (btn) {
          if (btn.tagName === 'BUTTON' && !btn.getAttribute('type')) btn.setAttribute('type', 'button');
          if (!btn.getAttribute('aria-label') && !(btn.textContent || '').trim()) {
            btn.setAttribute('aria-label', TXT.close);
          }
          on(btn, 'click', function () { close(); });
        });
      });
      ensureScrim();

      /* Delegated: rows and buttons can be re-rendered by the table. */
      on(document, 'click', function (ev) {
        var trigger = ev.target && ev.target.closest ? ev.target.closest('[data-adm-drawer]') : null;
        if (!trigger) return;
        var id = trigger.getAttribute('data-adm-drawer');
        if (!id || !panelFor(id)) return;
        ev.preventDefault();
        open(id, trigger);
      });

      on(document, 'keydown', function (ev) {
        if (!openPanel) return;
        if (ev.key === 'Escape') {
          ev.preventDefault();
          close();
          return;
        }
        trapTab(ev, openPanel);
      });
    }

    return { init: init, open: open, close: close };
  }());

  /* =====================================================================
     5b. Demo row actions — Təsdiqlə / Rədd et / Arxivlə / Sil
     ===================================================================== */
  var AdmActions = (function () {
    var ACTIONS = {
      approve: { status: 'aktiv',    msg: TXT.approved, type: 'ok' },
      reject:  { status: 'redd',     msg: TXT.rejected, type: 'danger' },
      archive: { status: 'arxiv',    msg: TXT.archived, type: 'info' },
      restore: { status: 'gozleyir', msg: TXT.saved,    type: 'info' }
    };

    function rowLabel(row) {
      if (!row) return '';
      var explicit = row.getAttribute('data-adm-label');
      if (explicit) return explicit;
      var cell = $('[data-adm-cell="ad"]', row) || $('.adm-cell-title', row);
      if (cell) return (cell.textContent || '').trim();
      var first = row.cells ? row.cells[row.cells.length > 1 ? 1 : 0] : null;
      return first ? (first.textContent || '').trim().slice(0, 60) : '';
    }

    function setStatus(row, statusKey) {
      var meta = STATUS[statusKey];
      if (!row || !meta) return;
      row.setAttribute('data-status', statusKey);
      var badge = $('[data-adm-status]', row) || $('.badge', row);
      if (badge) {
        STATUS_CLASSES.forEach(function (c) { badge.classList.remove(c); });
        if (meta.cls) badge.classList.add(meta.cls);
        badge.textContent = meta.label;
      }
      row.classList.add('is-touched');
      if (typeof row._admHay === 'string') row._admHay = null;   /* re-index for search */
    }

    function applyOne(row, action, api) {
      var conf = ACTIONS[action];
      if (!conf || !row) return;
      setStatus(row, conf.status);
      if (api) api.refresh(false);
    }

    function removeWithUndo(rows, api, message) {
      if (!api) {
        rows.forEach(function (row) { if (row.parentNode) row.parentNode.removeChild(row); });
        AdmToast.toast(message, 'danger');
        return;
      }
      var refs = rows.map(function (row) { return api.removeRow(row); }).filter(Boolean);
      AdmToast.toast(message, 'danger', {
        label: TXT.undo,
        onClick: function () {
          refs.slice().reverse().forEach(function (ref) { api.restoreRow(ref); });
          AdmToast.toast(TXT.restored, 'ok');
        }
      });
    }

    function init() {
      /* Single-row actions — delegated so paginated rows keep working. */
      on(document, 'click', function (ev) {
        var btn = ev.target && ev.target.closest ? ev.target.closest('[data-adm-action]') : null;
        if (!btn) return;
        var action = btn.getAttribute('data-adm-action');
        if (!action) return;
        ev.preventDefault();

        var row = btn.closest ? btn.closest('tr') : null;
        var api = AdmTable.forElement(btn);
        var name = rowLabel(row);

        if (action === 'delete') {
          if (!row) return;
          removeWithUndo([row], api, (name ? name + ' — ' : '') + TXT.deleted);
          return;
        }
        if (action === 'save') {
          AdmToast.toast(TXT.saved, 'ok');
          return;
        }
        var conf = ACTIONS[action];
        if (!conf) return;
        applyOne(row, action, api);
        AdmToast.toast((name ? name + ' — ' : '') + conf.msg, conf.type);
      });

      /* Bulk actions from the .adm-toolbar bar. */
      on(document, 'click', function (ev) {
        var btn = ev.target && ev.target.closest ? ev.target.closest('[data-adm-bulk]') : null;
        if (!btn) return;
        var action = btn.getAttribute('data-adm-bulk');
        if (!action) return;
        ev.preventDefault();

        var api = AdmTable.forElement(btn) || AdmTable.all()[0];
        if (!api) return;
        var picked = api.selected();
        if (!picked.length) {
          AdmToast.toast(TXT.nothingSelected, 'warn');
          return;
        }
        var n = picked.length;

        if (action === 'delete') {
          removeWithUndo(picked, api, n + ' sətir ' + TXT.deleted.toLowerCase());
          return;
        }
        var conf = ACTIONS[action];
        if (!conf) return;
        picked.forEach(function (row) { setStatus(row, conf.status); });
        api.clearSelection();
        api.refresh(false);
        AdmToast.toast(n + ' sətir — ' + conf.msg.toLowerCase(), conf.type);
      });

      /* Demo forms never post anywhere. */
      $$('form[data-adm-demo]').forEach(function (form) {
        on(form, 'submit', function (ev) {
          ev.preventDefault();
          AdmToast.toast(form.getAttribute('data-adm-demo-msg') || TXT.saved, 'ok');
        });
      });

      /* Switches echo their new state. */
      $$('.switch input[type="checkbox"][data-adm-switch]').forEach(function (input) {
        on(input, 'change', function () {
          var label = input.getAttribute('data-adm-switch') || '';
          AdmToast.toast((label ? label + ' — ' : '') + (input.checked ? 'aktiv edildi' : 'söndürüldü'), 'info');
        });
      });
    }

    return { init: init };
  }());

  /* =====================================================================
     6. AdmCharts — inline SVG sparklines + one bar chart, no library
     ===================================================================== */
  var AdmCharts = (function () {
    var drawn = [];

    function values(el) {
      return String(el.getAttribute('data-values') || '')
        .split(',')
        .map(function (v) { return toNumber(v); })
        .filter(function (v) { return typeof v === 'number' && !isNaN(v); });
    }

    function box(el, fallbackW, fallbackH) {
      var w = el.clientWidth || parseInt(el.getAttribute('data-width') || '0', 10) || fallbackW;
      var h = el.clientHeight || parseInt(el.getAttribute('data-height') || '0', 10) || fallbackH;
      return { w: Math.max(24, w), h: Math.max(16, h) };
    }

    function drawSpark(el) {
      var data = values(el);
      el.innerHTML = '';
      if (data.length < 2) return;

      var size = box(el, 120, 34);
      var padX = 2;
      var padY = 3;
      var min = Math.min.apply(null, data);
      var max = Math.max.apply(null, data);
      var span = max - min || 1;
      var innerW = size.w - padX * 2;
      var innerH = size.h - padY * 2;

      var pts = data.map(function (v, i) {
        return {
          x: round(padX + (i / (data.length - 1)) * innerW),
          y: round(padY + (1 - (v - min) / span) * innerH)
        };
      });

      var line = pts.map(function (p, i) {
        return (i === 0 ? 'M' : 'L') + p.x + ' ' + p.y;
      }).join(' ');
      var area = line + ' L' + pts[pts.length - 1].x + ' ' + round(size.h) +
        ' L' + pts[0].x + ' ' + round(size.h) + ' Z';

      var up = data[data.length - 1] >= data[0];
      var svg = svgEl('svg', {
        'class': 'adm-spark' + (up ? ' is-up' : ' is-down'),
        viewBox: '0 0 ' + size.w + ' ' + size.h,
        preserveAspectRatio: 'none',
        role: 'img',
        focusable: 'false',
        'aria-label': el.getAttribute('data-label') ||
          ('Son ' + data.length + ' dövr: ' + data[0] + ' → ' + data[data.length - 1])
      });

      svg.appendChild(svgEl('path', { 'class': 'adm-spark-area', d: area, fill: 'currentColor' }));
      svg.appendChild(svgEl('path', {
        'class': 'adm-spark-line', d: line, fill: 'none', stroke: 'currentColor',
        'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
        'vector-effect': 'non-scaling-stroke'
      }));

      var last = pts[pts.length - 1];
      svg.appendChild(svgEl('circle', {
        'class': 'adm-spark-dot',
        cx: last.x, cy: last.y, r: 2.5, fill: 'currentColor',
        'vector-effect': 'non-scaling-stroke'
      }));

      el.appendChild(svg);
    }

    function drawBars(el) {
      var data = values(el);
      el.innerHTML = '';
      if (!data.length) return;

      var labels = String(el.getAttribute('data-labels') || '')
        .split(',')
        .map(function (s) { return s.trim(); });

      var size = box(el, 520, 200);
      var hasLabels = labels.filter(Boolean).length > 0;
      var bottom = hasLabels ? 22 : 8;
      var top = 18;
      var padX = 6;
      var max = Math.max.apply(null, data.concat([0])) || 1;
      var innerW = size.w - padX * 2;
      var innerH = Math.max(10, size.h - top - bottom);
      var slot = innerW / data.length;
      var barW = Math.max(6, Math.min(46, slot * 0.56));

      var svg = svgEl('svg', {
        'class': 'adm-bars',
        viewBox: '0 0 ' + size.w + ' ' + size.h,
        preserveAspectRatio: 'xMidYMid meet',
        role: 'img',
        focusable: 'false',
        'aria-label': el.getAttribute('data-label') || ('Sütun diaqramı: ' + data.join(', '))
      });

      svg.appendChild(svgEl('line', {
        'class': 'adm-bars-base',
        x1: padX, y1: round(top + innerH), x2: round(size.w - padX), y2: round(top + innerH),
        stroke: 'currentColor', 'stroke-width': '1'
      }));

      data.forEach(function (v, i) {
        var h = Math.max(2, round((Math.max(0, v) / max) * innerH));
        var x = round(padX + slot * i + (slot - barW) / 2);
        var y = round(top + innerH - h);

        var group = svgEl('g', { 'class': 'adm-bar-group' });
        var title = svgEl('title');
        title.textContent = (labels[i] ? labels[i] + ': ' : '') + v;
        group.appendChild(title);

        group.appendChild(svgEl('rect', {
          'class': 'adm-bar' + (v === max ? ' is-peak' : ''),
          x: x, y: y, width: round(barW), height: h,
          rx: Math.min(5, round(barW / 3)),
          fill: 'currentColor'
        }));

        var value = svgEl('text', {
          'class': 'adm-bar-value',
          x: round(x + barW / 2), y: Math.max(11, y - 6),
          'text-anchor': 'middle', 'font-size': '11', fill: 'currentColor'
        });
        value.textContent = String(v);
        group.appendChild(value);

        if (labels[i]) {
          var label = svgEl('text', {
            'class': 'adm-bar-label',
            x: round(x + barW / 2), y: round(size.h - 6),
            'text-anchor': 'middle', 'font-size': '11', fill: 'currentColor'
          });
          label.textContent = labels[i];
          group.appendChild(label);
        }

        svg.appendChild(group);
      });

      el.appendChild(svg);
      if (!reduceMotion()) el.classList.add('is-animated');
    }

    function drawAll() {
      drawn.forEach(function (item) {
        try { item.fn(item.el); } catch (e) { /* never break the page over a chart */ }
      });
    }

    function init() {
      $$('[data-adm-spark]').forEach(function (el) { drawn.push({ el: el, fn: drawSpark }); });
      $$('[data-adm-bars]').forEach(function (el) { drawn.push({ el: el, fn: drawBars }); });
      if (!drawn.length) return;

      drawAll();

      var timer = null;
      var schedule = function () {
        window.clearTimeout(timer);
        timer = window.setTimeout(drawAll, 160);
      };
      on(window, 'resize', schedule);

      if ('ResizeObserver' in window) {
        var ro = new window.ResizeObserver(schedule);
        drawn.forEach(function (item) {
          if (item.el.parentElement) ro.observe(item.el.parentElement);
        });
      }
    }

    return { init: init, redraw: drawAll };
  }());

  /* =====================================================================
     Boot
     ===================================================================== */
  /* =====================================================================
     AdmBell — the top-bar notification button. It shipped inert; a button
     that visibly does nothing reads as a broken panel, so it now opens a
     small demo panel listing recent activity.
     Hooks: [data-adm-notifications], .adm-bell-panel (created on demand)
     ===================================================================== */

  var AdmBell = {
    init: function () {
      var bell = document.querySelector('[data-adm-notifications], .adm-bell');
      if (!bell) return;

      var panel = null;

      function close() {
        if (!panel) return;
        panel.hidden = true;
        bell.setAttribute('aria-expanded', 'false');
      }

      function build() {
        panel = document.createElement('div');
        panel.className = 'adm-bell-panel';
        panel.hidden = true;
        panel.innerHTML =
          '<p class="adm-bell-panel-title">Bildirişlər</p>'
          + '<ul class="adm-bell-list">'
          + '<li><span class="badge badge--warn">Təsdiq</span> 7 müəssisə təsdiq gözləyir</li>'
          + '<li><span class="badge badge--info">Müraciət</span> 12 yeni valideyn müraciəti</li>'
          + '<li><span class="badge badge--danger">Şikayət</span> 3 rəyə şikayət edilib</li>'
          + '</ul>'
          + '<a class="adm-bell-all" href="tesdiq.html">Təsdiq növbəsinə keç</a>';
        bell.parentNode.insertBefore(panel, bell.nextSibling);
      }

      bell.setAttribute('aria-expanded', 'false');

      bell.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        if (!panel) build();
        var open = panel.hidden;
        panel.hidden = !open;
        bell.setAttribute('aria-expanded', open ? 'true' : 'false');
      });

      document.addEventListener('click', function (ev) {
        if (!panel || panel.hidden) return;
        if (panel.contains(ev.target) || bell.contains(ev.target)) return;
        close();
      });
      document.addEventListener('keydown', function (ev) {
        if (ev.key === 'Escape') close();
      });
    }
  };

  /* =====================================================================
     AdmKeyRotate — the "Yenilə" buttons beside the masked API-key fields.
     Demo only: it re-masks the field with a fresh trailing group. No real
     secret is ever generated, stored or displayed.
     Hooks: any button labelled "Yenilə" next to a readonly .input
     ===================================================================== */

  var AdmKeyRotate = {
    init: function () {
      var btns = Array.prototype.slice.call(document.querySelectorAll('.field-row button'))
        .filter(function (b) { return b.textContent.trim() === 'Yenilə'; });
      if (!btns.length) return;

      btns.forEach(function (btn) {
        var input = btn.parentNode.querySelector('input.input');
        if (!input) return;
        btn.addEventListener('click', function () {
          var prefix = (input.value.split('•')[0] || 'sk_live_');
          var tail = '';
          for (var i = 0; i < 4; i++) tail += Math.floor(Math.random() * 10);
          input.value = prefix + '••••••••••••' + tail;
          if (window.admToast) window.admToast('Açar yeniləndi — köhnəsi ləğv edildi', 'ok');
        });
      });
    }
  };

  function boot() {
    AdmSidebar.init();
    AdmTable.init();
    AdmFilters.init();
    AdmDrawer.init();
    AdmActions.init();
    AdmCharts.init();
    AdmBell.init();
    AdmKeyRotate.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* Small public surface for page-level scripts. */
  window.EduNavAdmin = {
    toast: AdmToast.toast,
    tables: function () { return AdmTable.all(); },
    tableFor: AdmTable.forElement,
    openDrawer: AdmDrawer.open,
    closeDrawer: AdmDrawer.close,
    closeSidebar: AdmSidebar.close,
    redrawCharts: AdmCharts.redraw
  };
})();

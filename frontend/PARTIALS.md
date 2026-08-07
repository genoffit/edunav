# EduNav `frontend/` — PARTIALS

Copy-paste block library. There is **no build step**, so these blocks are physically
duplicated across the 26 public + 14 admin HTML files. They must stay **byte-identical**
everywhere — copy them, do not retype them, do not "improve" them per page.

Only three things ever change per page:

| what | where |
|---|---|
| `{{TITLE}}` / `{{DESC}}` | head block |
| the active nav link gets `class="nav-link is-active"` + `aria-current="page"` | header + drawer |
| the active admin link gets `class="adm-nav-link is-active"` + `aria-current="page"` | `.adm-side` |

Everything else is frozen. Rules enforced by every block below: no `style=""` attributes,
no `all: unset`, Azerbaijani copy only, decorative SVG carries `aria-hidden="true"` +
`focusable="false"`, all assets carry `?v=1`.

---

## 1. Head — public pages

Opens the document. Replace `{{TITLE}}` and `{{DESC}}` only. Sits at the very top of all 26 public files.

```html
<!DOCTYPE html>
<html lang="az">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{TITLE}} | EduNav.az</title>
<meta name="description" content="{{DESC}}">
<meta name="theme-color" content="#FFC629">
<meta property="og:site_name" content="EduNav.az">
<meta property="og:type" content="website">
<meta property="og:locale" content="az_AZ">
<meta property="og:title" content="{{TITLE}} | EduNav.az">
<meta property="og:description" content="{{DESC}}">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%23FFC629'/%3E%3Cpath d='M4.6 13 16 7.8 27.4 13 16 18.2z' fill='%230F1420'/%3E%3Cpath d='M9.4 15.4v4.3c0 1.7 2.9 3.1 6.6 3.1s6.6-1.4 6.6-3.1v-4.3' fill='none' stroke='%230F1420' stroke-width='2.2' stroke-linecap='round'/%3E%3Cpath d='M26.4 13.4v5.4' fill='none' stroke='%230F1420' stroke-width='2.2' stroke-linecap='round'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/style.css?v=1">
</head>
<body>
<a class="skip-link" href="#main">Əsas məzmuna keç</a>
```

---

## 2. Public header `.site-header`

Sticky 78px bar: logo, the 8 contract nav links, `Daxil ol` + `Müəssisə əlavə et`, burger. Paste immediately after the skip link.
The 8 links need ~1182px of content but `.container` never offers more than `1200 - 2×--pad`, so `.nav` hands over to
`.burger` at **≤1200px**, not at 768px. The three `.burger-line` spans are the frozen structure — `style.css` styles them directly.

```html
<header class="site-header">
  <div class="container header-inner">
    <a class="logo" href="index.html" aria-label="EduNav — ana səhifə">
      <span class="logo-mark" aria-hidden="true">
        <svg viewBox="0 0 18 18" width="18" height="18" fill="none" aria-hidden="true" focusable="false"><path d="M2.6 6.4 9 3.2l6.4 3.2L9 9.6z" fill="currentColor"/><path d="M5.3 8.5v3.2c0 1.05 1.66 1.9 3.7 1.9s3.7-.85 3.7-1.9V8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M15.1 6.6v3.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </span>
      <span class="logo-text">EduNav</span>
    </a>

    <nav class="nav" aria-label="Əsas naviqasiya">
      <a class="nav-link" href="mekteblar.html">Məktəblər</a>
      <a class="nav-link" href="bagcalar.html">Bağçalar</a>
      <a class="nav-link" href="vakansiyalar.html">Vakansiyalar</a>
      <a class="nav-link" href="xeberler.html">Xəbərlər</a>
      <a class="nav-link" href="elanlar.html">Elanlar</a>
      <a class="nav-link" href="bloglar.html">Bloglar</a>
      <a class="nav-link" href="sebekeler.html">Şəbəkələr</a>
      <a class="nav-link" href="haqqimizda.html">Haqqımızda</a>
    </nav>

    <div class="header-actions">
      <a class="btn-ghost" href="daxil-ol.html">Daxil ol</a>
      <a class="btn-brand" href="muessise-elave-et.html">Müəssisə əlavə et</a>
      <button class="burger" type="button" data-drawer-open aria-label="Menyunu aç" aria-expanded="false" aria-controls="drawer">
        <span class="burger-line" aria-hidden="true"></span>
        <span class="burger-line" aria-hidden="true"></span>
        <span class="burger-line" aria-hidden="true"></span>
      </button>
    </div>
  </div>
</header>
```

---

## 3. Mobile drawer `.drawer`

Off-canvas menu shown ≤1200px; JS toggles `.is-open` and flips `aria-hidden`. Paste directly after `</header>`.
`.drawer-panel` is the scroll container (`overflow-y:auto`) — the head, nav, section and actions all live inside it.

```html
<div class="drawer" id="drawer" data-drawer aria-hidden="true">
  <div class="drawer-backdrop" data-drawer-close aria-hidden="true"></div>
  <div class="drawer-panel" role="dialog" aria-modal="true" aria-label="Menyu">
    <div class="drawer-head">
      <span class="logo">
        <span class="logo-mark" aria-hidden="true">
          <svg viewBox="0 0 18 18" width="18" height="18" fill="none" aria-hidden="true" focusable="false"><path d="M2.6 6.4 9 3.2l6.4 3.2L9 9.6z" fill="currentColor"/><path d="M5.3 8.5v3.2c0 1.05 1.66 1.9 3.7 1.9s3.7-.85 3.7-1.9V8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M15.1 6.6v3.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </span>
        <span class="logo-text">EduNav</span>
      </span>
      <button class="drawer-close" type="button" data-drawer-close aria-label="Menyunu bağla">
        <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true" focusable="false"><path d="M5 5l10 10M15 5 5 15" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>
      </button>
    </div>

    <nav class="drawer-nav" aria-label="Mobil naviqasiya">
      <a class="drawer-link" href="mekteblar.html">Məktəblər</a>
      <a class="drawer-link" href="bagcalar.html">Bağçalar</a>
      <a class="drawer-link" href="vakansiyalar.html">Vakansiyalar</a>
      <a class="drawer-link" href="xeberler.html">Xəbərlər</a>
      <a class="drawer-link" href="elanlar.html">Elanlar</a>
      <a class="drawer-link" href="bloglar.html">Bloglar</a>
      <a class="drawer-link" href="sebekeler.html">Şəbəkələr</a>
      <a class="drawer-link" href="haqqimizda.html">Haqqımızda</a>
    </nav>

    <div class="drawer-section">
      <p class="drawer-section-title">Sürətli keçidlər</p>
      <div class="chip-row">
        <a class="chip" href="muqayise.html">Müqayisə et</a>
        <a class="chip" href="suallar.html">Suallar</a>
        <a class="chip" href="elaqe.html">Əlaqə</a>
        <a class="chip" href="kabinet.html">Kabinet</a>
      </div>
    </div>

    <div class="drawer-actions">
      <a class="btn-ghost" href="daxil-ol.html">Daxil ol</a>
      <a class="btn-brand" href="muessise-elave-et.html">Müəssisə əlavə et</a>
    </div>
  </div>
</div>
```

---

## 4. Compare bar `.compare-bar`

Fixed bottom bar; hidden by default, JS adds `.is-on` when `edunav_compare` is non-empty (max 4). Paste just before the footer on every page **except** `muqayise.html`.

```html
<div class="compare-bar" data-compare-bar aria-hidden="true">
  <div class="container compare-bar-inner">
    <div class="cb-left">
      <div class="cb-avatars" data-cb-avatars aria-hidden="true"></div>
      <p class="cb-text">
        <span class="cb-count" data-cb-count aria-live="polite">0</span>
        müəssisə müqayisə siyahısındadır
        <span class="cb-hint">Maksimum 4 müəssisə</span>
      </p>
    </div>
    <div class="cb-actions">
      <button class="btn-ghost btn-sm" type="button" data-cb-clear>Siyahını təmizlə</button>
      <a class="btn-brand btn-sm" href="muqayise.html">Müqayisə et</a>
      <button class="cb-close" type="button" data-cb-hide aria-label="Müqayisə panelini gizlət">
        <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden="true" focusable="false"><path d="M5 5l10 10M15 5 5 15" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>
      </button>
    </div>
  </div>
</div>
```

---

## 5. Shared modals — contact / survey / guest

All three on every public page, opened by any `[data-open="contact|survey|guest"]` control. ESC + backdrop close, focus trap, `.is-open` toggles visibility. Paste as one group before the footer.

```html
<div class="modal" data-modal="contact" role="dialog" aria-modal="true" aria-labelledby="modal-contact-title" aria-hidden="true">
  <div class="modal-backdrop" data-modal-close aria-hidden="true"></div>
  <div class="modal-panel">
    <div class="modal-head">
      <div class="modal-head-text">
        <h2 class="modal-title" id="modal-contact-title">Əlaqə</h2>
        <p class="modal-sub">Formu doldurun — 1 iş günü ərzində sizinlə əlaqə saxlayırıq.</p>
      </div>
      <button class="modal-close" type="button" data-modal-close aria-label="Pəncərəni bağla">
        <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true" focusable="false"><path d="M5 5l10 10M15 5 5 15" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <form class="form-grid" id="form-contact" data-form="contact" novalidate>
        <div class="field">
          <label class="field-label" for="contact-name">Ad, Soyad</label>
          <input class="input" id="contact-name" name="name" type="text" autocomplete="name" placeholder="Rasif Dünyamalı" required>
          <p class="field-error" data-error-for="contact-name" hidden>Adınızı yazın.</p>
        </div>
        <div class="field">
          <label class="field-label" for="contact-phone">Telefon</label>
          <input class="input" id="contact-phone" name="phone" type="tel" autocomplete="tel" placeholder="+994 50 000 00 00" required>
          <p class="field-error" data-error-for="contact-phone" hidden>Telefon nömrəsini yazın.</p>
        </div>
        <div class="field field-full">
          <label class="field-label" for="contact-email">E-poçt</label>
          <input class="input" id="contact-email" name="email" type="email" autocomplete="email" placeholder="ad@nümunə.az">
          <p class="field-hint">Cavabı e-poçtla almaq istəyirsinizsə doldurun.</p>
          <p class="field-error" data-error-for="contact-email" hidden>E-poçt ünvanı düzgün deyil.</p>
        </div>
        <div class="field field-full">
          <label class="field-label" for="contact-message">Mesajınız</label>
          <textarea class="textarea" id="contact-message" name="message" rows="4" placeholder="Sualınızı yazın — məktəb, bağça, vakansiya və ya əməkdaşlıq barədə." required></textarea>
          <p class="field-error" data-error-for="contact-message" hidden>Mesaj mətnini yazın.</p>
        </div>
      </form>
      <div class="modal-success" data-modal-success hidden>
        <span class="modal-success-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true" focusable="false"><path d="m5 12.6 4.4 4.4L19 7.4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
        <h3 class="modal-success-title">Müraciətiniz qəbul olundu</h3>
        <p class="modal-success-text">Komandamız 1 iş günü ərzində sizinlə əlaqə saxlayacaq.</p>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn-ghost" type="button" data-modal-close>İmtina</button>
      <button class="btn-brand" type="submit" form="form-contact" data-modal-submit="contact">Göndər</button>
    </div>
  </div>
</div>

<div class="modal" data-modal="survey" role="dialog" aria-modal="true" aria-labelledby="modal-survey-title" aria-hidden="true">
  <div class="modal-backdrop" data-modal-close aria-hidden="true"></div>
  <div class="modal-panel">
    <div class="modal-head">
      <div class="modal-head-text">
        <h2 class="modal-title" id="modal-survey-title">Sorğu</h2>
        <p class="modal-sub">4 sürətli sual — sizə uyğun müəssisələri seçək.</p>
      </div>
      <button class="modal-close" type="button" data-modal-close aria-label="Pəncərəni bağla">
        <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true" focusable="false"><path d="M5 5l10 10M15 5 5 15" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <div class="modal-progress" role="progressbar" aria-label="Sorğunun gedişi" aria-valuemin="0" aria-valuemax="4" aria-valuenow="1">
        <span class="modal-progress-bar" data-survey-progress></span>
      </div>
      <div class="modal-step is-on" data-survey-step="1">
        <h3 class="modal-step-title">Kimin üçün axtarırsınız?</h3>
        <div class="chip-row">
          <button class="chip" type="button" data-survey-pick="tip" data-value="Məktəb">Məktəb</button>
          <button class="chip" type="button" data-survey-pick="tip" data-value="Bağça">Bağça</button>
          <button class="chip" type="button" data-survey-pick="tip" data-value="Bağça + məktəb">Bağça + məktəb</button>
          <button class="chip" type="button" data-survey-pick="tip" data-value="Hələ qərar verməmişəm">Hələ qərar verməmişəm</button>
        </div>
      </div>
      <div class="modal-step" data-survey-step="2">
        <h3 class="modal-step-title">Hansı şəhər və ya rayonda?</h3>
        <div class="chip-row">
          <button class="chip" type="button" data-survey-pick="rayon" data-value="Bakı, Nəsimi">Bakı, Nəsimi</button>
          <button class="chip" type="button" data-survey-pick="rayon" data-value="Bakı, Yasamal">Bakı, Yasamal</button>
          <button class="chip" type="button" data-survey-pick="rayon" data-value="Bakı, Binəqədi">Bakı, Binəqədi</button>
          <button class="chip" type="button" data-survey-pick="rayon" data-value="Digər şəhər">Digər şəhər</button>
        </div>
      </div>
      <div class="modal-step" data-survey-step="3">
        <h3 class="modal-step-title">Tədris dili hansı olsun?</h3>
        <div class="chip-row">
          <button class="chip" type="button" data-survey-pick="dil" data-value="Azərbaycan">Azərbaycan</button>
          <button class="chip" type="button" data-survey-pick="dil" data-value="İngilis">İngilis</button>
          <button class="chip" type="button" data-survey-pick="dil" data-value="Rus">Rus</button>
          <button class="chip" type="button" data-survey-pick="dil" data-value="İki dilli">İki dilli</button>
        </div>
      </div>
      <div class="modal-step" data-survey-step="4">
        <h3 class="modal-step-title">Büdcəniz nə qədərdir?</h3>
        <div class="chip-row">
          <button class="chip" type="button" data-survey-pick="budce" data-value="Aylıq 400 AZN-ə qədər">Aylıq 400 AZN-ə qədər</button>
          <button class="chip" type="button" data-survey-pick="budce" data-value="Aylıq 400–800 AZN">Aylıq 400–800 AZN</button>
          <button class="chip" type="button" data-survey-pick="budce" data-value="İllik 10 000 AZN-ə qədər">İllik 10 000 AZN-ə qədər</button>
          <button class="chip" type="button" data-survey-pick="budce" data-value="Fərq etməz">Fərq etməz</button>
        </div>
      </div>
      <div class="modal-success" data-modal-success hidden>
        <span class="modal-success-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true" focusable="false"><path d="m5 12.6 4.4 4.4L19 7.4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
        <h3 class="modal-success-title">Seçimləriniz yadda saxlanıldı</h3>
        <p class="modal-success-text">Cavablarınıza uyğun müəssisələri kataloqda ilk sıralarda göstərəcəyik.</p>
        <a class="btn-brand" href="mekteblar.html">Nəticələrə bax</a>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn-ghost" type="button" data-survey-prev>Geri</button>
      <button class="btn-brand" type="button" data-survey-next>Növbəti</button>
    </div>
  </div>
</div>

<div class="modal" data-modal="guest" role="dialog" aria-modal="true" aria-labelledby="modal-guest-title" aria-hidden="true">
  <div class="modal-backdrop" data-modal-close aria-hidden="true"></div>
  <div class="modal-panel">
    <div class="modal-head">
      <div class="modal-head-text">
        <h2 class="modal-title" id="modal-guest-title">Hesabınıza daxil olun</h2>
        <p class="modal-sub">Seçdiyiniz müəssisələri, müqayisə siyahınızı və müraciətlərinizi yadda saxlamaq üçün hesab lazımdır.</p>
      </div>
      <button class="modal-close" type="button" data-modal-close aria-label="Pəncərəni bağla">
        <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true" focusable="false"><path d="M5 5l10 10M15 5 5 15" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>
      </button>
    </div>
    <div class="modal-body">
      <ul class="modal-list">
        <li class="modal-list-item">Bəyəndiyiniz məktəb və bağçaları favoritlərə əlavə edin.</li>
        <li class="modal-list-item">4 müəssisəyə qədər müqayisə siyahısı qurun.</li>
        <li class="modal-list-item">Müraciətlərinizin statusunu kabinetdən izləyin.</li>
        <li class="modal-list-item">Qəbul tarixləri və yeni vakansiyalar barədə bildiriş alın.</li>
      </ul>
      <p class="modal-note">Qeydiyyat valideynlər üçün tamamilə pulsuzdur.</p>
    </div>
    <div class="modal-foot">
      <button class="btn-ghost" type="button" data-modal-close>Qonaq kimi davam et</button>
      <a class="btn-ghost" href="qeydiyyat.html">Qeydiyyatdan keç</a>
      <a class="btn-brand" href="daxil-ol.html">Daxil ol</a>
    </div>
  </div>
</div>
```

---

## 6. Footer `.footer`

Dark footer: brand + social, 4 link columns (Platforma / Şirkət / Kömək / Müəssisələr), newsletter, © line. Last element before the scripts.

```html
<footer class="footer">
  <div class="container footer-inner">
    <div class="footer-brand">
      <a class="logo" href="index.html" aria-label="EduNav — ana səhifə">
        <span class="logo-mark" aria-hidden="true">
          <svg viewBox="0 0 18 18" width="17" height="17" fill="none" aria-hidden="true" focusable="false"><path d="M2.6 6.4 9 3.2l6.4 3.2L9 9.6z" fill="currentColor"/><path d="M5.3 8.5v3.2c0 1.05 1.66 1.9 3.7 1.9s3.7-.85 3.7-1.9V8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M15.1 6.6v3.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </span>
        <span class="logo-text">EduNav</span>
      </a>
      <p class="footer-about">Təhsil müəssisələri üçün etibarlı platforma. Məktəb və bağçaları kəşf edin, müqayisə edin, birbaşa müraciət göndərin.</p>
      <ul class="footer-social" aria-label="Sosial şəbəkələr">
        <li><a class="footer-social-link" href="https://www.facebook.com/" rel="noopener noreferrer" target="_blank" aria-label="EduNav Facebook səhifəsi">FB</a></li>
        <li><a class="footer-social-link" href="https://www.instagram.com/" rel="noopener noreferrer" target="_blank" aria-label="EduNav Instagram səhifəsi">IG</a></li>
        <li><a class="footer-social-link" href="https://www.linkedin.com/" rel="noopener noreferrer" target="_blank" aria-label="EduNav LinkedIn səhifəsi">IN</a></li>
        <li><a class="footer-social-link" href="https://www.youtube.com/" rel="noopener noreferrer" target="_blank" aria-label="EduNav YouTube kanalı">YT</a></li>
      </ul>
    </div>

    <nav class="footer-col" aria-labelledby="footer-col-platforma">
      <h2 class="footer-col-title" id="footer-col-platforma">Platforma</h2>
      <ul class="footer-links">
        <li><a class="footer-link" href="mekteblar.html">Məktəblər</a></li>
        <li><a class="footer-link" href="bagcalar.html">Bağçalar</a></li>
        <li><a class="footer-link" href="vakansiyalar.html">Vakansiyalar</a></li>
        <li><a class="footer-link" href="muqayise.html">Müqayisə</a></li>
        <li><a class="footer-link" href="sebekeler.html">Şəbəkələr</a></li>
      </ul>
    </nav>

    <nav class="footer-col" aria-labelledby="footer-col-sirket">
      <h2 class="footer-col-title" id="footer-col-sirket">Şirkət</h2>
      <ul class="footer-links">
        <li><a class="footer-link" href="haqqimizda.html">Haqqımızda</a></li>
        <li><a class="footer-link" href="xeberler.html">Xəbərlər</a></li>
        <li><a class="footer-link" href="elanlar.html">Elanlar</a></li>
        <li><a class="footer-link" href="bloglar.html">Bloglar</a></li>
        <li><a class="footer-link" href="elaqe.html">Əlaqə</a></li>
      </ul>
    </nav>

    <nav class="footer-col" aria-labelledby="footer-col-komek">
      <h2 class="footer-col-title" id="footer-col-komek">Kömək</h2>
      <ul class="footer-links">
        <li><a class="footer-link" href="suallar.html">Tez-tez verilən suallar</a></li>
        <li><a class="footer-link" href="kabinet.html">Kabinet</a></li>
        <li><a class="footer-link" href="qaydalar.html">İstifadə qaydaları</a></li>
        <li><a class="footer-link" href="gizlilik.html">Gizlilik siyasəti</a></li>
      </ul>
    </nav>

    <nav class="footer-col" aria-labelledby="footer-col-muessiseler">
      <h2 class="footer-col-title" id="footer-col-muessiseler">Müəssisələr</h2>
      <ul class="footer-links">
        <li><a class="footer-link" href="muessise-elave-et.html">Müəssisə əlavə et</a></li>
        <li><a class="footer-link" href="qeydiyyat.html">Qeydiyyat</a></li>
        <li><a class="footer-link" href="daxil-ol.html">Daxil ol</a></li>
        <li><a class="footer-link" href="elaqe.html">Reklam və əməkdaşlıq</a></li>
      </ul>
    </nav>

    <div class="footer-news">
      <h2 class="footer-col-title">Yeniliklərdən xəbərdar olun</h2>
      <p class="footer-news-text">Ən son yenilikləri e-poçtla alın.</p>
      <form class="footer-news-form" data-form="newsletter" novalidate>
        <div class="field">
          <label class="field-label sr-only" for="footer-news-email">E-poçt ünvanınız</label>
          <div class="footer-news-row">
            <input class="input footer-news-input" id="footer-news-email" name="email" type="email" autocomplete="email" placeholder="E-poçt ünvanınız" required>
            <button class="footer-news-btn" type="submit" aria-label="Abunə ol">
              <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden="true" focusable="false"><path d="M2.5 8h10M9 4.5 12.5 8 9 11.5" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
          <p class="field-error" data-error-for="footer-news-email" hidden>E-poçt ünvanı düzgün deyil.</p>
          <p class="field-hint">Abunə olmaqla <a class="footer-link" href="gizlilik.html">gizlilik siyasəti</a> ilə razılaşırsınız.</p>
        </div>
      </form>
    </div>
  </div>

  <div class="container footer-bottom">
    <p class="footer-copy">© <span data-year>2026</span> EduNav. Bütün hüquqlar qorunur.</p>
    <ul class="footer-legal">
      <li><a class="footer-link" href="qaydalar.html">Qaydalar</a></li>
      <li><a class="footer-link" href="gizlilik.html">Gizlilik</a></li>
      <li><a class="footer-link" href="elaqe.html">Əlaqə</a></li>
    </ul>
  </div>
</footer>
```

---

## 7. Public closing scripts

Closes every public page. Nothing goes after it.

```html
<script src="assets/js/app.js?v=1"></script>
</body>
</html>
```

---

## 8a. Head — admin pages

Same shape as the public head, but paths are `../` (files live in `frontend/admin/`) and `admin.css?v=1` loads after `style.css?v=1`. `<body class="adm">` is required — the whole admin layout hangs off it.

```html
<!DOCTYPE html>
<html lang="az">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{TITLE}} | EduNav İdarə Paneli</title>
<meta name="description" content="{{DESC}}">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#0F1420">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%23FFC629'/%3E%3Cpath d='M4.6 13 16 7.8 27.4 13 16 18.2z' fill='%230F1420'/%3E%3Cpath d='M9.4 15.4v4.3c0 1.7 2.9 3.1 6.6 3.1s6.6-1.4 6.6-3.1v-4.3' fill='none' stroke='%230F1420' stroke-width='2.2' stroke-linecap='round'/%3E%3Cpath d='M26.4 13.4v5.4' fill='none' stroke='%230F1420' stroke-width='2.2' stroke-linecap='round'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/css/style.css?v=1">
<link rel="stylesheet" href="../assets/css/admin.css?v=1">
</head>
<body class="adm">
<a class="skip-link" href="#adm-content">Əsas məzmuna keç</a>
```

---

## 8b. Admin sidebar `.adm-side`

248px fixed rail, grouped nav covering all 14 admin pages, user block pinned to the bottom. Paste right after the skip link. (Omit on `daxil-ol.html`, which is a bare login screen.)

```html
<div class="adm-side-backdrop" data-adm-side-close aria-hidden="true"></div>
<aside class="adm-side" id="adm-side" aria-label="İdarə paneli naviqasiyası">
  <div class="adm-side-head">
    <a class="logo" href="index.html" aria-label="EduNav İdarə Paneli — ana səhifə">
      <span class="logo-mark" aria-hidden="true">
        <svg viewBox="0 0 18 18" width="18" height="18" fill="none" aria-hidden="true" focusable="false"><path d="M2.6 6.4 9 3.2l6.4 3.2L9 9.6z" fill="currentColor"/><path d="M5.3 8.5v3.2c0 1.05 1.66 1.9 3.7 1.9s3.7-.85 3.7-1.9V8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M15.1 6.6v3.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </span>
      <span class="logo-text">EduNav</span>
    </a>
    <button class="adm-side-close" type="button" data-adm-side-close aria-label="Menyunu bağla">
      <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true" focusable="false"><path d="M5 5l10 10M15 5 5 15" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>
    </button>
  </div>

  <nav class="adm-nav" aria-label="Bölmələr">
    <p class="adm-nav-group">Ümumi baxış</p>
    <a class="adm-nav-link" href="index.html">
      <svg class="adm-nav-icon" viewBox="0 0 20 20" width="17" height="17" fill="none" aria-hidden="true" focusable="false"><path d="M3 8.4 10 3l7 5.4V16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M8 17v-5h4v5" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>
      <span class="adm-nav-text">İdarə paneli</span>
    </a>
    <a class="adm-nav-link" href="statistika.html">
      <svg class="adm-nav-icon" viewBox="0 0 20 20" width="17" height="17" fill="none" aria-hidden="true" focusable="false"><path d="M3 17h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M6 17V9M10 17V4M14 17v-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
      <span class="adm-nav-text">Statistika</span>
    </a>

    <p class="adm-nav-group">Müəssisələr</p>
    <a class="adm-nav-link" href="muessiseler.html">
      <svg class="adm-nav-icon" viewBox="0 0 20 20" width="17" height="17" fill="none" aria-hidden="true" focusable="false"><path d="M3.5 17V5.5L10 3l6.5 2.5V17" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M3.5 17h13M8 17v-4h4v4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
      <span class="adm-nav-text">Müəssisələr</span>
    </a>
    <a class="adm-nav-link" href="muessise-detal.html">
      <svg class="adm-nav-icon" viewBox="0 0 20 20" width="17" height="17" fill="none" aria-hidden="true" focusable="false"><rect x="3.5" y="3" width="13" height="14" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M6.8 7.5h6.4M6.8 10.5h6.4M6.8 13.5h3.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
      <span class="adm-nav-text">Müəssisə detalı</span>
    </a>
    <a class="adm-nav-link" href="tesdiq.html">
      <svg class="adm-nav-icon" viewBox="0 0 20 20" width="17" height="17" fill="none" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.6"/><path d="m6.8 10.3 2.3 2.3 4.1-4.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span class="adm-nav-text">Təsdiq gözləyənlər</span>
      <span class="badge badge--warn adm-nav-badge">7</span>
    </a>

    <p class="adm-nav-group">Məzmun</p>
    <a class="adm-nav-link" href="xeberler.html">
      <svg class="adm-nav-icon" viewBox="0 0 20 20" width="17" height="17" fill="none" aria-hidden="true" focusable="false"><rect x="3" y="4.5" width="14" height="11" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M6 8h5M6 11h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
      <span class="adm-nav-text">Xəbərlər</span>
    </a>
    <a class="adm-nav-link" href="elanlar.html">
      <svg class="adm-nav-icon" viewBox="0 0 20 20" width="17" height="17" fill="none" aria-hidden="true" focusable="false"><path d="M4 8.2v3.6h3l5 3.2V5L7 8.2z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M14.8 7.6a4 4 0 0 1 0 4.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
      <span class="adm-nav-text">Elanlar</span>
    </a>
    <a class="adm-nav-link" href="bloglar.html">
      <svg class="adm-nav-icon" viewBox="0 0 20 20" width="17" height="17" fill="none" aria-hidden="true" focusable="false"><path d="M4 4.5h8.5L16 8v7.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 4.5V8h4" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>
      <span class="adm-nav-text">Bloglar</span>
    </a>
    <a class="adm-nav-link" href="vakansiyalar.html">
      <svg class="adm-nav-icon" viewBox="0 0 20 20" width="17" height="17" fill="none" aria-hidden="true" focusable="false"><rect x="3" y="6.5" width="14" height="9.5" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M7.5 6.5V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
      <span class="adm-nav-text">Vakansiyalar</span>
    </a>

    <p class="adm-nav-group">İcma</p>
    <a class="adm-nav-link" href="muracietler.html">
      <svg class="adm-nav-icon" viewBox="0 0 20 20" width="17" height="17" fill="none" aria-hidden="true" focusable="false"><path d="M17 12.5a1.8 1.8 0 0 1-1.8 1.8H7.4L4 17.5V5.3A1.8 1.8 0 0 1 5.8 3.5h9.4A1.8 1.8 0 0 1 17 5.3z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>
      <span class="adm-nav-text">Müraciətlər</span>
      <span class="badge badge--info adm-nav-badge">12</span>
    </a>
    <a class="adm-nav-link" href="reyler.html">
      <svg class="adm-nav-icon" viewBox="0 0 20 20" width="17" height="17" fill="none" aria-hidden="true" focusable="false"><path d="m10 3.6 1.98 4.02 4.44.64-3.21 3.13.76 4.42L10 13.72l-3.97 2.09.76-4.42L3.58 8.26l4.44-.64z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>
      <span class="adm-nav-text">Rəylər</span>
    </a>
    <a class="adm-nav-link" href="istifadeciler.html">
      <svg class="adm-nav-icon" viewBox="0 0 20 20" width="17" height="17" fill="none" aria-hidden="true" focusable="false"><circle cx="8" cy="7.4" r="2.9" stroke="currentColor" stroke-width="1.6"/><path d="M2.8 16.4c0-2.6 2.33-4.4 5.2-4.4s5.2 1.8 5.2 4.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M14.2 5.2a2.5 2.5 0 0 1 0 4.6M15.4 12.6c1.4.66 2.3 1.9 2.3 3.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
      <span class="adm-nav-text">İstifadəçilər</span>
    </a>

    <p class="adm-nav-group">Sistem</p>
    <a class="adm-nav-link" href="ayarlar.html">
      <svg class="adm-nav-icon" viewBox="0 0 20 20" width="17" height="17" fill="none" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="2.4" stroke="currentColor" stroke-width="1.6"/><path d="M10 2.8v2M10 15.2v2M17.2 10h-2M4.8 10h-2M15.1 4.9l-1.4 1.4M6.3 13.7l-1.4 1.4M15.1 15.1l-1.4-1.4M6.3 6.3 4.9 4.9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
      <span class="adm-nav-text">Ayarlar</span>
    </a>
    <a class="adm-nav-link" href="daxil-ol.html">
      <svg class="adm-nav-icon" viewBox="0 0 20 20" width="17" height="17" fill="none" aria-hidden="true" focusable="false"><path d="M12.4 14.2v1.4a1.4 1.4 0 0 1-1.4 1.4H5.4A1.4 1.4 0 0 1 4 15.6V4.4A1.4 1.4 0 0 1 5.4 3H11a1.4 1.4 0 0 1 1.4 1.4v1.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M8.6 10h8.2M14.2 7.4 16.8 10l-2.6 2.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span class="adm-nav-text">Çıxış</span>
    </a>
  </nav>

  <div class="adm-user">
    <span class="adm-avatar" aria-hidden="true">RD</span>
    <span class="adm-user-text">
      <span class="adm-user-name">Rasif Dünyamalı</span>
      <span class="adm-user-role">Baş administrator</span>
    </span>
  </div>
</aside>
```

---

## 8c. Admin top bar `.adm-top` + main open

Sticky bar: burger (≤768px), page title, search, notification bell, avatar. Follows `</aside>`; replace `{{TITLE}}` with the same title used in the head. Closes with block 8d.

```html
<div class="adm-main">
  <header class="adm-top">
    <button class="adm-burger" type="button" data-adm-side-open aria-label="Menyunu aç" aria-expanded="false" aria-controls="adm-side">
      <span class="burger-line" aria-hidden="true"></span>
      <span class="burger-line" aria-hidden="true"></span>
      <span class="burger-line" aria-hidden="true"></span>
    </button>

    <h1 class="adm-top-title">{{TITLE}}</h1>

    <form class="adm-top-search" role="search" data-form="adm-search" novalidate>
      <label class="field-label sr-only" for="adm-search">Axtarış</label>
      <span class="adm-top-search-icon" aria-hidden="true">
        <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden="true" focusable="false"><circle cx="7" cy="7" r="4.6" stroke="currentColor" stroke-width="1.6"/><path d="M10.6 10.6 14 14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
      </span>
      <input class="input adm-top-input" id="adm-search" name="q" type="search" placeholder="Müəssisə, istifadəçi və ya elan axtar" autocomplete="off">
    </form>

    <div class="adm-top-actions">
      <button class="adm-bell" type="button" data-adm-notifications aria-label="Bildirişlər — 3 yeni" aria-expanded="false">
        <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true" focusable="false"><path d="M15.2 13.4V9a5.2 5.2 0 1 0-10.4 0v4.4L3.4 15.2h13.2z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M8.2 15.2a1.9 1.9 0 0 0 3.6 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
        <span class="adm-bell-dot" aria-hidden="true"></span>
      </button>
      <span class="adm-avatar" aria-hidden="true">RD</span>
    </div>
  </header>

  <main class="adm-content" id="adm-content">
```

---

## 8d. Admin closing scripts

Closes `.adm-content` and `.adm-main`, then loads both scripts. Nothing goes after it.

```html
  </main>
</div>
<script src="../assets/js/app.js?v=1"></script>
<script src="../assets/js/admin.js?v=1"></script>
</body>
</html>
```

---

## 9. How to use

**Placeholders.** Only `{{TITLE}}` and `{{DESC}}` are ever substituted.
`{{TITLE}}` is the page name in Azerbaijani (`Məktəblər`, `Bağçalar`, `Müəssisələr` …) — the
suffix `| EduNav.az` / `| EduNav İdarə Paneli` is already in the block, do not repeat it.
`{{DESC}}` is a 120–160 character Azerbaijani sentence, unique per page, no double quotes inside.
Block **8c** uses `{{TITLE}}` a second time as the visible `<h1>`; keep both copies identical.

**Active state — public.** On each page, exactly one `.nav-link` in block 2 and the matching
`.drawer-link` in block 3 become:

```html
<a class="nav-link is-active" href="mekteblar.html" aria-current="page">Məktəblər</a>
<a class="drawer-link is-active" href="mekteblar.html" aria-current="page">Məktəblər</a>
```

Detail pages inherit their parent's active link — `mekteb.html` marks *Məktəblər*,
`bagca.html` marks *Bağçalar*, `xeber.html` marks *Xəbərlər*, `elan.html` marks *Elanlar*,
`blog.html` marks *Bloglar*, `vakansiya.html` marks *Vakansiyalar*, `sebeke.html` marks *Şəbəkələr*.
`index.html`, `muqayise.html`, `daxil-ol.html`, `qeydiyyat.html`, `muessise-elave-et.html`,
`kabinet.html`, `elaqe.html`, `suallar.html`, `qaydalar.html`, `gizlilik.html` and `404.html`
mark **nothing** — no `.is-active`, no `aria-current`.

**Active state — admin.** Exactly one `.adm-nav-link` in block 8b becomes:

```html
<a class="adm-nav-link is-active" href="muessiseler.html" aria-current="page"> … </a>
```

`muessise-detal.html` marks its own entry, not *Müəssisələr*.

**Page skeleton — public.** Block 1 → 2 → 3 → `<main id="main"> … </main>` → 4 → 5 → 6 → 7.
Block 4 (`.compare-bar`) is omitted on `muqayise.html` only. Block 5 goes on every public page —
the modals are inert until something with `data-open="contact|survey|guest"` is clicked.
`404.html` keeps the full skeleton.

**Page skeleton — admin.** Block 8a → 8b → 8c → page content → 8d.
`admin/daxil-ol.html` is the exception: 8a → a centred login card → 8d, with no `.adm-side`,
no `.adm-top` and no `.adm-main`/`.adm-content` wrapper — so its closing block is just the two
`<script>` tags plus `</body></html>`.

**Paths.** Public blocks use root-relative-free paths (`assets/…`, `mekteblar.html`) because all
26 public files sit in `frontend/`. Admin blocks use `../assets/…` because the 14 admin files sit
in `frontend/admin/`. Never mix the two.

**Cache-buster.** When `style.css`, `admin.css`, `app.js` or `admin.js` changes, bump `?v=1` to
`?v=2` in **all 40 files** in the same commit. A partial bump is a bug.

**Do not.** Do not add `style=""` to anything here. Do not rename a class to fit a page. Do not
drop the `aria-*` attributes — the JS in `app.js` reads `aria-expanded` and `aria-hidden` as state,
so removing them breaks the drawer, the modals and the compare bar.

---

### Class inventory introduced by these partials

`style.css` must implement all of these. Contract-named classes are marked ✔; the rest are the
children the contract implies for those blocks and are reserved to them — do not reuse elsewhere.

| block | classes |
|---|---|
| global | `.container` ✔, `.skip-link`, `.sr-only`, `.chip` ✔, `.chip-row`, `.badge` ✔ `.badge--ok/--warn/--danger/--info` ✔, `.btn-brand` ✔, `.btn-ghost` ✔, `.btn-dark` ✔, `.btn-pill` ✔, `.btn-sm` ✔, `.field` ✔, `.field-label` ✔, `.field-hint` ✔, `.field-error` ✔, `.field-full`, `.input` ✔, `.textarea` ✔, `.form-grid`, `.is-active`, `.is-on` |
| header | `.site-header` ✔, `.header-inner`, `.logo` ✔, `.logo-mark` ✔, `.logo-text` ✔, `.nav` ✔, `.nav-link` ✔, `.header-actions` ✔, `.burger` ✔, `.burger-line` |
| drawer | `.drawer` ✔, `.drawer-backdrop`, `.drawer-panel`, `.drawer-head`, `.drawer-close`, `.drawer-nav`, `.drawer-link`, `.drawer-section`, `.drawer-section-title`, `.drawer-actions` |
| compare | `.compare-bar` ✔, `.compare-bar-inner`, `.cb-left`, `.cb-avatars`, `.cb-text`, `.cb-count`, `.cb-hint`, `.cb-actions`, `.cb-close` |
| modal | `.modal` ✔, `.modal-backdrop`, `.modal-panel`, `.modal-head`, `.modal-head-text`, `.modal-title`, `.modal-sub`, `.modal-close`, `.modal-body`, `.modal-foot`, `.modal-progress`, `.modal-progress-bar`, `.modal-step`, `.modal-step-title`, `.modal-list`, `.modal-list-item`, `.modal-note`, `.modal-success`, `.modal-success-icon`, `.modal-success-title`, `.modal-success-text` |
| footer | `.footer` ✔, `.footer-inner`, `.footer-brand`, `.footer-about`, `.footer-social`, `.footer-social-link`, `.footer-col`, `.footer-col-title`, `.footer-links`, `.footer-link`, `.footer-news`, `.footer-news-text`, `.footer-news-form`, `.footer-news-row`, `.footer-news-input`, `.footer-news-btn`, `.footer-bottom`, `.footer-copy`, `.footer-legal` |

`admin.css` must implement:

| block | classes |
|---|---|
| shell | `.adm` ✔, `.adm-main` ✔, `.adm-content`, `.adm-side` ✔, `.adm-side-backdrop`, `.adm-side-head`, `.adm-side-close` |
| sidebar nav | `.adm-nav`, `.adm-nav-group` ✔, `.adm-nav-link` ✔, `.adm-nav-icon`, `.adm-nav-text`, `.adm-nav-badge`, `.adm-user`, `.adm-user-text`, `.adm-user-name`, `.adm-user-role` |
| top bar | `.adm-top` ✔, `.adm-burger`, `.adm-top-title`, `.adm-top-search`, `.adm-top-search-icon`, `.adm-top-input`, `.adm-top-actions`, `.adm-bell`, `.adm-bell-dot`, `.adm-avatar` |

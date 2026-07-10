# EduNav.az

Özəl məktəbləri axtar, müqayisə et və sənə uyğununu seç — Azərbaycanın özəl məktəb kataloqu.

## Struktur

```
public/              # Frontend (canlı sayt)
  index.html         # Ana səhifə
  mekteblar.html     # Məktəblər siyahısı
  mekteb-profili.html
  muqayise.html
  vakansiyalar.html
  vakansiya-muraciet.html
  xeberler.html
  elanlar.html
  bloq.html
  meqale.html
  haqqimizda.html
  mekteb-elave-et.html
  giris.html
  assets/
    css/style.css    # Bütün stil sistemi
    js/script.js     # İnteraktivlik (compare, survey, contact modal, snap)

docs/planlama/       # İlkin planlama sənədləri
```

## Yerli işə salma

Statik saytdır — hər hansı HTTP server ilə açıla bilər:

```bash
cd public
python -m http.server 8000
# http://localhost:8000
```

Laragon istifadə edirsinizsə: `http://localhost/edunav/public/`

## Xüsusiyyətlər

- Modul-modul scroll-snap (yalnız ana səhifədə)
- Müqayisə (yastıqlı popup, localStorage persistent, 4 məktəbə qədər)
- Valideyn sorğusu popup (5 addım, ilk ziyarətdə auto-aç)
- Əlaqə modal (menyudakı Əlaqə linki popup açır)
- Responsive dizayn (mobil / tablet / desktop)
- Minimalist dizayn sistemi (Inter font, sarı + qara)

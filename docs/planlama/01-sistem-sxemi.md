# EduNav.az — Sistem İşləmə Sxemi

> Platformanın ümumi arxitekturası, aktorları və əsas iş axınları.

---

## 1. Ümumi Arxitektura (High-Level)

```mermaid
flowchart TB
    subgraph Clients["İstifadəçi İnterfeysləri"]
        PW[Public Web<br/>Valideyn/Qonaq]
        SD[Məktəb Dashboard]
        AD[Super Admin Panel]
    end

    subgraph Backend["Tətbiq Qatı (Laravel)"]
        API[HTTP + API Layer]
        AUTH[Auth / RBAC]
        BIZ[Business Logic<br/>Services]
        QUEUE[Queue / Jobs<br/>Redis]
    end

    subgraph Data["Məlumat Qatı"]
        DB[(MySQL<br/>Əsas DB)]
        CACHE[(Redis<br/>Cache/Session)]
        SEARCH[(MeiliSearch<br/>Filtr + Axtarış)]
        MEDIA[(S3/Bunny CDN<br/>Media)]
    end

    subgraph External["Xarici Xidmətlər"]
        MAP[Google Maps / OSM]
        WA[WhatsApp Business API]
        MAIL[SMTP / Resend]
        PAY[Epoint / PayRiff]
        SMS[SMS Gateway]
    end

    PW --> API
    SD --> API
    AD --> API
    API --> AUTH
    AUTH --> BIZ
    BIZ --> DB
    BIZ --> CACHE
    BIZ --> SEARCH
    BIZ --> MEDIA
    BIZ --> QUEUE
    QUEUE --> WA
    QUEUE --> MAIL
    QUEUE --> SMS
    BIZ --> PAY
    PW --> MAP
```

---

## 2. İstifadəçi Rolları və Hüquq Matrisi

```mermaid
flowchart LR
    U[İstifadəçilər] --> G[Qonaq<br/>Guest]
    U --> P[Valideyn<br/>Qeydiyyatlı]
    U --> S[Məktəb Admin]
    U --> A[Super Admin]

    G -->|Görür| g1[Axtarış, Profil, Müqayisə, Bloq]
    P -->|Əlavə| p1[Favori, Rəy, Müraciət tarixçəsi]
    S -->|İdarə edir| s1[Öz məktəb profili, Bloq, Lead-lər]
    A -->|Tam giriş| a1[Bütün məktəblər, Lead route,<br/>Ödəniş, Moderasiya, Reytinq]
```

**İcazə qaydaları:**

| Əməliyyat | Qonaq | Valideyn | Məktəb | S.Admin |
|---|:---:|:---:|:---:|:---:|
| Məktəb axtar/bax | ✓ | ✓ | ✓ | ✓ |
| Müqayisə et | ✓ | ✓ | ✓ | ✓ |
| Müraciət göndər | ✓ | ✓ | – | – |
| Rəy yaz | – | ✓ | – | ✓ |
| Öz profilini redaktə | – | – | ✓ | ✓ |
| Lead-i məktəbə göndər | – | – | – | ✓ |
| Rəy moderasiyası | – | – | – | ✓ |
| Paket/ödəniş | – | – | ✓ | ✓ |

---

## 3. Əsas Axın: Valideyn Səyahəti (Parent Journey)

```mermaid
flowchart TD
    Start([Valideyn saytı açır]) --> Home[Ana Səhifə]
    Home --> Choice{Nə etmək istəyir?}

    Choice -->|Axtarış| Search[Filtr: qiymət,<br/>ərazi, dil, kurrikulum]
    Choice -->|Bloq oxu| Blog[Bloq Səhifəsi]
    Choice -->|Birbaşa| Profile

    Search --> Results[Nəticələr: Məktəb Kartları]
    Results --> Sort{Sırala}
    Sort --> Results

    Results -->|Ətraflı bax| Profile[Məktəb Profili]
    Results -->|Müqayisəyə əlavə et| Compare

    Profile --> Actions{İstifadəçi seçimi}
    Actions -->|Favori| Fav[(Favori siyahısı)]
    Actions -->|Paylaş| Share[Sosial media/Link]
    Actions -->|Google Map| Map[Marşrut göstər]
    Actions -->|Müqayisəyə əlavə| Compare[Müqayisə Səbəti<br/>max 4 məktəb]
    Actions -->|Müraciət et| ApplyForm

    Compare --> CompareView[Yanaşı Müqayisə Görünüşü]
    CompareView -->|PDF yüklə| PDF[(PDF Export)]
    CompareView --> Profile

    ApplyForm[Müraciət Forması<br/>ad, telefon, email, şagird yaşı]
    ApplyForm --> Validate{Validasiya +<br/>reCaptcha}
    Validate -->|OK| LeadStore[(Lead saxlanılır<br/>status=new)]
    Validate -->|Xəta| ApplyForm

    LeadStore --> Notify[Valideyn SMS/Email<br/>təsdiq mesajı]
    Notify --> End([Admin tərəfinə keçir])
```

---

## 4. Lead İdarəetmə Axını (Admin → Məktəb)

```mermaid
sequenceDiagram
    actor Parent as Valideyn
    participant Web as Public Web
    participant API as Backend
    participant DB as MySQL
    participant Admin as Super Admin
    participant School as Məktəb Admini
    participant WA as WhatsApp API
    participant Mail as Email

    Parent->>Web: Müraciət formasını doldurur
    Web->>API: POST /leads
    API->>DB: Lead yarat (status=new)
    API-->>Parent: Təsdiq mesajı
    API->>Mail: Admin-ə bildiriş

    Admin->>API: Lead-i baxır və yoxlayır
    Admin->>API: "Məktəbə göndər" düyməsi
    API->>DB: status=sent_to_school
    par Paralel bildiriş
        API->>Mail: Məktəbə email
    and
        API->>WA: Məktəbə WhatsApp mesajı
    end

    School->>API: Lead-i gördü (status=seen)
    School->>Parent: Birbaşa əlaqə (zəng/WA)
    School->>API: Nəticə qeyd edir (contacted/enrolled/rejected)
    API->>DB: status yenilənir
    API->>Admin: Statistika yenilənir
```

**Lead status-ları:** `new` → `reviewed` → `sent_to_school` → `seen` → `contacted` → `enrolled` / `rejected`

---

## 5. Məktəb Qeydiyyat və Aktivləşmə Axını

```mermaid
flowchart TD
    Start([Məktəb saytı tapır]) --> Form[Məktəb əlavə et anketi]
    Form --> Fill[Ad, ünvan, əlaqə,<br/>sənədlər, paket seçimi]
    Fill --> Submit[Göndər]
    Submit --> DB1[(status=pending)]
    DB1 --> Admin{Super Admin<br/>yoxlayır}

    Admin -->|Rədd| Reject[Səbəb ilə rədd<br/>email bildirişi]
    Admin -->|Təsdiq| Approve[status=approved<br/>ödəniş linki göndərilir]

    Approve --> Pay{Ödəniş}
    Pay -->|Uğurlu| Active[status=active<br/>profil canlıdır]
    Pay -->|Uğursuz| Retry[Yenidən cəhd]
    Retry --> Pay

    Active --> Dashboard[Məktəb Dashboard-a giriş]
    Dashboard --> Manage[Profil, media, bloq,<br/>lead idarəetmə]

    Active --> Expire{Abunə müddəti}
    Expire -->|7 gün qalır| Remind[Xatırlatma emaili]
    Expire -->|Bitdi| Suspended[status=suspended<br/>profil gizlənir]
    Suspended --> Pay
```

**Paket fərqləri (təklif):**

| Feature | Basic | Standard | Premium |
|---|:---:|:---:|:---:|
| Profil görünürlüyü | ✓ | ✓ | ✓ |
| Foto sayı | 5 | 20 | ∞ |
| Video | – | 1 | ∞ |
| Aylıq lead limiti | 10 | 50 | ∞ |
| Bloq yerləşdirmə | – | ✓ | ✓ |
| Premium Badge | – | – | ✓ |
| Siyahıda önə çıxma | – | – | ✓ |
| Müqayisədə prioritet | – | – | ✓ |

---

## 6. Rəy və Reytinq Axını

```mermaid
flowchart LR
    P[Valideyn] -->|Rəy yaz| Form[Rəy forması<br/>ulduz + mətn]
    Form --> Check{Əvvəl müraciət<br/>edibmi?}
    Check -->|Yox| Block[Rəy qəbul edilmir]
    Check -->|Bəli| Queue[(status=pending)]
    Queue --> Mod[Admin moderasiyası]
    Mod -->|Təsdiq| Pub[Profildə görünür]
    Mod -->|Rədd| Rej[Səbəb bildirilir]
    Pub --> Calc[Reytinq hesablanır]

    Calc --> Formula["Reytinq =<br/>0.6 × rəy_orta +<br/>0.2 × müraciət_sayı_n +<br/>0.2 × baxış_sayı_n"]
    Formula --> Rank[(Məktəb reytinq cədvəli)]
```

---

## 7. Məlumat Modeli (ERD — İlkin Eskiz)

```mermaid
erDiagram
    USER ||--o{ LEAD : submits
    USER ||--o{ REVIEW : writes
    USER ||--o{ FAVORITE : saves
    SCHOOL ||--o{ LEAD : receives
    SCHOOL ||--o{ REVIEW : has
    SCHOOL ||--o{ FAVORITE : appears_in
    SCHOOL ||--o{ MEDIA : has
    SCHOOL ||--o{ BLOG_POST : publishes
    SCHOOL }o--|| PLAN : subscribes
    SCHOOL }o--o{ SERVICE : offers
    SCHOOL }o--o{ INFRASTRUCTURE : has
    SCHOOL }o--o{ ACTIVITY : offers
    SCHOOL }o--o{ LANGUAGE : teaches
    SCHOOL }o--|| CURRICULUM : follows
    SCHOOL }o--|| DISTRICT : located_in
    PLAN ||--o{ PAYMENT : billed
    LEAD ||--o{ LEAD_STATUS_LOG : tracks

    USER {
        id bigint
        name string
        email string
        phone string
        role enum
        email_verified_at ts
    }
    SCHOOL {
        id bigint
        name string
        slug string
        district_id fk
        address string
        lat decimal
        lng decimal
        price_min int
        price_max int
        student_count int
        opened_year int
        plan_id fk
        status enum
        rating decimal
        views_count int
    }
    LEAD {
        id bigint
        user_id fk
        school_id fk
        student_name string
        student_age int
        status enum
        notes text
        created_at ts
    }
    REVIEW {
        id bigint
        user_id fk
        school_id fk
        stars tinyint
        comment text
        status enum
    }
    PLAN {
        id bigint
        name string
        price decimal
        features json
        duration_days int
    }
```

---

## 8. SEO və Bloq Axını

```mermaid
flowchart LR
    A[Admin/Məktəb] -->|Məqalə yaz| Editor[Bloq Editor<br/>başlıq, kontent, kateqoriya]
    Editor --> Draft[(status=draft)]
    Draft -->|Publish| Live[(status=published)]
    Live --> SEO[SEO emal]
    SEO --> Meta[Meta tags +<br/>Open Graph]
    SEO --> Schema[Schema.org<br/>Article/School]
    SEO --> Sitemap[sitemap.xml<br/>yenilənir]
    Sitemap --> Google[Google Search Console]
    Schema --> Google
```

---

## 9. Kritik Qeyri-Funksional Tələblər

| Kateqoriya | Tələb |
|---|---|
| **Performans** | Ana səhifə < 1.5s, filtr nəticəsi < 500ms |
| **SEO** | Lighthouse SEO ≥ 95, Core Web Vitals yaşıl |
| **Mobil** | Mobile-first, 360px-dan test |
| **Dillər** | AZ (əsas), RU, EN |
| **Təhlükəsizlik** | reCaptcha v3, rate-limit, CSRF, XSS qorunması |
| **GDPR/Məxfilik** | Valideyn məlumatları şifrələnmiş, silmə hüququ |
| **Yedək** | Gündəlik DB backup, 30 gün saxlanma |
| **Monitoring** | Sentry (error), Uptime robot, Google Analytics |

---

## 10. Növbəti addımlar

1. Bu sxem üzrə **razılaşma** (nə dəyişmək lazımdır?)
2. **Paket matrisini** dəqiqləşdirmək (qiymət, limitlər)
3. **Tech stack** yekun qərarı (Livewire vs Next.js)
4. **ERD detallaşması** → miqration planı
5. **Wireframe** / səhifə skeletləri
6. **Sprint planı** və task breakdown

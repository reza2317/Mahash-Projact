# مستند فنی معماری و بهینه‌سازی ذخیره‌سازی رسانه‌ها و تصاویر در پرتال محاش
### راهنمای جامع تیم توسعه: مدیریت بهینه تصاویر، فرمت WebP، ذخیره‌سازی در MySQL و مهاجرت به Cloud Storage

---

## ۱. خلاصه مدیریتی و هدف (Executive Summary)

با افزایش تعداد مشاوران، نشان‌های تیم‌ها، گزارش‌های فعالیت و رویدادها در پرتال کانون ناشنوایان و کم‌شنوایان (محاش)، مدیریت بهینه فایل‌های رسانه‌ای (تصاویر و ویدیوها) اهمیت حیاتی در حفظ **سرعت بارگذاری صفحه (Page Load Time)** و دستیابی به شاخص‌های عالی **Core Web Vitals (LCP, CLS, FID)** دارد.

این سند فنی به منظور شفاف‌سازی ساختار ذخیره‌سازی فعلی، استانداردهای فشرده‌سازی **WebP**، نحوه تعامل با دیتابیس **MySQL** و نقشه راه مهاجرت به **Object Storage ابری** تدوین شده است.

---

## ۲. بررسی معماری ذخیره‌سازی فعلی در پایگاه داده MySQL

### ۲.۱. جدول `mahash_assets`
در نسخه فعلی، تمامی دارایی‌های گرافیکی اختصاصی سامانه اعم از آواتار مشاوران، لوگوی پنج تیم، نشان مدور باشگاه جوانان و لوگوی رسمی محاش در جدول زیر در پایگاه داده MySQL ذخیره می‌شوند:

```sql
CREATE TABLE IF NOT EXISTS mahash_assets (
  id VARCHAR(191) NOT NULL PRIMARY KEY COMMENT 'شناسه یکتا مانند consultant_dr_rezaei یا team_silence_logo',
  category VARCHAR(64) NOT NULL COMMENT 'دسته‌بندی: consultant, team, official, general',
  name VARCHAR(255) NOT NULL COMMENT 'عنوان قابل خواندن برای انسان',
  data LONGTEXT NOT NULL COMMENT 'رشته Base64 تصویر با پیشوند data:image/webp;base64,...',
  mime_type VARCHAR(64) NOT NULL DEFAULT 'image/webp',
  size_bytes BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### ۲.۲. تحلیل عملکرد نگهداری Base64 در MySQL

| معیار | وضعیت در دیتابیس MySQL | راهکار اعمال‌شده در پرتال محاش |
| :--- | :--- | :--- |
| **سربار Base64** | انکود Base64 حدود ۳۳٪ حجم فایل را افزایش می‌دهد. | با فشرده‌سازی **WebP با ضریب ۷۵٪ تا ۸۵٪**، حجم نهایی به مراتب کمتر از یک فایل PNG معمولی می‌شود (کاهش تا ۸۰٪ الی ۹۵٪ نسبت به فایل خام). |
| **مصرف Buffer Pool** | خواندن فیلدهای بزرگ `LONGTEXT` باعث خروج سریع‌تر صفحات کش از حافظه رم InnoDB می‌شود. | **جداسازی کوئری‌ها**: در اندپوینت‌های فهرستی فقط `id, name, mime_type, size_bytes` واکشی می‌شود و ستون سنگین `data` تنها در صورت درخواست نمایش لود می‌گردد. |
| **کش در لایه سرور (Node.js)** | درخواست مکرر یک تصویر به دیتابیس فشار می‌آورد. | متغیر `inMemoryAssets` در فایل `server.ts` دارایی‌ها را در RAM سرور کش می‌کند تا پاسخگویی صفر میلی‌ثانیه‌ای (Sub-millisecond) حاصل شود. |

---

## ۳. پایپ‌لاین فشرده‌سازی و تبدیل خودکار به WebP (`imageOptimizer.ts`)

فرمت **WebP** توسط گوگل توسعه یافته و به طور میانگین **۳۰٪ تا ۸۰٪ حجم کمتری** نسبت به JPEG و PNG با کیفیت بصری یکسان ارائه می‌دهد.

### ۳.۱. مراحل بهینه‌سازی کلاینت قبل از ارسال به دیتابیس
1. **بارگذاری و اعتبارسنجی فایل**: بررسی فرمت و کنترل سقف حجم (حداکثر ۱۵ مگابایت برای فایل ورودی).
2. **رسم در Canvas HTML5**: تغییر ابعاد تصویر بر اساس حداکثر پیکسل مجاز (`maxWidth` و `maxHeight` بین ۴۰۰ تا ۷۰۰ پیکسل برای آواتارها و لوگوها).
3. **تبدیل به فرمت WebP**: استفاده از متد بومی مرورگر:
   ```typescript
   canvas.toDataURL('image/webp', quality); // quality = 0.85
   ```
4. **محاسبه هوشمند صرفه‌جویی**: محاسبه نسبت حجم اولیه به ثانویه و گزارش درصد صرفه‌جویی به کاربر در فرم مدیریت محتوا.

---

## ۴. کامپوننت هوشمند `ImageLoader` و تکنینک‌های Lazy Loading

کامپوننت `/src/components/ImageLoader.tsx` وظایف زیر را انجام می‌دهد:

1. **Lazy Loading با IntersectionObserver**:
   - تصاویر تا زمانی که به دید کاربر (Viewport) نزدیک نشوند بارگذاری نمی‌شوند.
   - پارامتر `rootMargin: '200px'` تضمین می‌کند تصویر ۲۰۰ پیکسل قبل از اسکرول کاربر لود شود تا کاربر با کادر خالی مواجه نشود.
2. **کش در حافظه مرورگر (`memoryImageCache`)**:
   - جلوگیری از چندباره خوانی در صورت جابجایی بین صفحات SPA.
3. **پشتیبانی از تگ استاندارد `<picture>`**:
   - در صورت در دسترس بودن سورس WebP، مرورگر از سورس فشرده‌تر استفاده می‌کند و در غیر این صورت به فرمت SVG یا پیش‌فرض برمی‌گردد.
4. **کاهش Cumulative Layout Shift (CLS)**:
   - با نسبت ابعاد معین (`aspectRatio`) و انیمیشن Skeleton، ساختار صفحه پرش نمی‌کند.

---

## ۵. نقشه راه مهاجرت به Object Storage و CDN (Scale-up Plan)

زمانی که تعداد تصاویر از چندهزار عبور کرده یا ترافیک همزمان پرتال افزایش یابد، معماری پیشنهادی به صورت زیر ارتقا می‌یابد:

```
[مرورگر کاربر] ─── درخواست تصویر ───> [شبکه توزیع محتوا CDN (Cloudflare / Arvan)]
                                                      │ (Cache Miss)
                                                      ▼
[سرویس ذخیره‌سازی ابری S3 / MinIO / ArvanCloud S3]
                               ▲
                               │ (آپلود و ذخیره فقط لینک)
                    [سرور Backend و دیتابیس MySQL]
```

### ۵.۱. اصلاح ساختار جدول برای حالت Cloud Storage
در آن مرحله، ستون سنگین `data` حذف شده و به لینک ذخیره‌شده تبدیل می‌شود:

```sql
CREATE TABLE IF NOT EXISTS mahash_media_cloud (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  category VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  original_url VARCHAR(512) NOT NULL COMMENT 'لینک فایل در باکت S3',
  webp_url VARCHAR(512) NOT NULL COMMENT 'لینک نسخه فشرده WebP در CDN',
  thumbnail_url VARCHAR(512) NOT NULL COMMENT 'لینک بندانگشتی ۱۰۰ پیکسلی',
  width INT NOT NULL,
  height INT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  mime_type VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## ۶. چک‌لیست برنامه‌نویسان و راهنمای عملی توسعه‌دهندگان (Best Practices)

1. **هیچ تصویر خامی را بدون فشرده‌سازی ذخیره نکنید**:
   - همواره از تابع `convertToWebP(file, { quality: 0.85, maxWidth: 500 })` استفاده فرمایید.
2. **عدم استفاده از `SELECT *` در کوئری‌های MySQL**:
   - برای لیست‌ها و جداول، هرگز فیلد `data` را نیاورید.
   - فرمول صحیح کوئری:
     ```sql
     -- صحیح:
     SELECT id, category, name, mime_type, size_bytes, updated_at FROM mahash_assets;

     -- غلط و غیربهینه:
     SELECT * FROM mahash_assets;
     ```
3. **تنظیم پارامترهای موتور MySQL در سرور**:
   - مقدار `max_allowed_packet` حداقل `64M` یا `128M` تنظیم شود.
   - مقدار `innodb_buffer_pool_size` متناسب با رم سرور (حداقل ۵۰٪ تا ۷۰٪ حافظه آزاد سرور) تنظیم گردد.
4. **استفاده همیشگی از `ImageLoader` در صفحات فرانت‌اند**:
   - به جای تگ ساده `<img>`، کامپوننت `<ImageLoader />` را به همراه `fallbackSrc` و تعیین اندازه استفاده کنید.

---
*تهیه‌شده توسط تیم فنی و توسعه زیرساخت پرتال کانون ناشنوایان و کم‌شنوایان (محاش)*

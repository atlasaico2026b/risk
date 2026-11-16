# سامانه پیشنهادات ارزیابی ریسک

سامانه‌ای برای ثبت پیشنهادات کارکنان درباره ریسک‌هایی که در محیط کار مشاهده می‌کنند؛
هر پیشنهاد شامل **شرح ریسک**، **خطرات و پیامدهای احتمالی** و **راهکار پیشنهادی** است و
مدیر سازمان همه آن‌ها را در یک داشبورد تحلیلی می‌بیند و وضعیت هر مورد را تعیین می‌کند.

---

## قابلیت‌ها

### برای کارکنان — «ثبت پیشنهاد»
- فرم ساده و راست‌به‌چپ با اعتبارسنجی فیلدهای الزامی
- انتخاب دسته‌بندی ریسک (ایمنی، عملیاتی، مالی، زیست‌محیطی، امنیت اطلاعات، منابع انسانی، کیفیت، تجهیزات)
- ارزیابی اولیه ریسک با مقیاس ۱ تا ۵ برای **احتمال وقوع** و **شدت پیامد**
- محاسبه خودکار امتیاز (احتمال × شدت) و سطح ریسک به‌صورت زنده
- صدور **کد پیگیری** پس از ثبت (مثل `RSK-4I6C95`)

### برای مدیر — «داشبورد مدیریت»
- شاخص‌های کلیدی: کل پیشنهادات، در انتظار بررسی، ریسک بحرانی، میانگین امتیاز، اجرا شده
- **ماتریس ریسک ۵×۵** با شمارش موارد در هر خانه و فیلتر با کلیک روی خانه
- نمودار دسته‌بندی‌ها و نمودار وضعیت بررسی
- جستجو و فیلتر بر اساس وضعیت، دسته، واحد سازمانی و سطح ریسک
- مشاهده جزئیات کامل هر پیشنهاد، تغییر وضعیت و ثبت یادداشت مدیر
- خروجی **CSV** سازگار با اکسل (با پشتیبانی از فارسی)

### وضعیت‌های بررسی
`جدید` → `در حال بررسی` → `تأیید شده` → `اجرا شده` (یا `رد شده`)

---

## نسخه ویندوزی

پوشه [`desktop/`](desktop/) یک اپلیکیشن دسکتاپ **Electron** است که همین سامانه را در
یک پنجره ویندوزی اجرا می‌کند. برای ساخت فایل `.exe`:

1. Node.js (LTS) را نصب کنید.
2. فایل `desktop/build-windows.bat` را دوبار کلیک کنید.

خروجی در `desktop/release/` ساخته می‌شود: یک **نصب‌کننده** و یک **نسخه پرتابل**.
جزئیات بیشتر در [`desktop/README.md`](desktop/README.md).

---

## اجرای پروژه

```bash
bun install
bun run generate     # تولید مسیرهای API از روی schema
bun run dev:full     # اجرای همزمان کلاینت و سرور
```

- کلاینت: Vite + React + TypeScript + Tailwind CSS
- سرور: Hono + Prisma + SQLite (روی پورت ۳۰۰۱، مسیرهای `/api/*`)

### مدل داده

```prisma
model RiskReport {
  id           String   @id @default(cuid())
  reporterName String
  department   String
  position     String?
  contact      String?
  title        String
  category     String
  location     String?
  description  String
  hazards      String?
  suggestion   String
  probability  Int
  impact       Int
  score        Int
  level        String
  status       String   @default("new")
  managerNote  String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

### مسیرهای API

| متد | مسیر | توضیح |
|---|---|---|
| `GET` | `/api/risk-reports` | فهرست پیشنهادات (`limit`, `offset`, `orderBy`) |
| `POST` | `/api/risk-reports` | ثبت پیشنهاد جدید |
| `PATCH` | `/api/risk-reports/:id` | تغییر وضعیت / یادداشت مدیر |
| `DELETE` | `/api/risk-reports/:id` | حذف پیشنهاد |

---

## ساختار پروژه

```
src/
├── App.tsx                        # پوسته برنامه و تب‌ها
├── components/
│   ├── RiskForm.tsx               # فرم ثبت پیشنهاد کارکنان
│   ├── ManagerDashboard.tsx       # داشبورد مدیریت
│   └── RiskMatrix.tsx             # ماتریس ریسک ۵×۵
├── lib/
│   ├── risk.ts                    # انواع، دسته‌بندی‌ها، محاسبه سطح، خروجی CSV
│   └── api.ts                     # لایه ارتباط با API
└── generated/                     # تولیدشده توسط shogo generate
desktop/                           # نسخه ویندوزی (Electron)
prisma/schema.prisma               # مدل داده
```

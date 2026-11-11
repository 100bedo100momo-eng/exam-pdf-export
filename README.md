# Exam PDF Export Component

مكون React/Next.js لتصدير أسئلة الامتحان إلى PDF باستخدام `html2pdf.js` مع دعم SSR، RTL، وإخفاء عناصر التحكم.

## المميزات

- ✅ دعم SSR عبر Dynamic Import
- ✅ إخفاء عناصر التحكم (أزرار، تنقل، إلخ)
- ✅ جودة عالية للنصوص العربية
- ✅ منع قطع الأسئلة في منتصف الصفحة
- ✅ **جديد: التحكم في عدد الأسئلة في كل صفحة** (`questionsPerPage`)
- ✅ تتبع حالة التصدير (جاري، نجاح، خطأ)
- ✅ أزرار مخصصة عبر Render Props

## التثبيت

```bash
npm install html2pdf.js
```

## الاستخدام السريع

```tsx
'use client';
import { ExamPDFExport } from './ExamPDFExport';

export default function ExamPage() {
  return (
    <div dir="rtl">
      <header className="no-print">
        <h1>امتحان الرياضيات</h1>
        <ExamPDFExport
          containerId="exam-content-area"
          filename="math-exam.pdf"
          questionsPerPage={3}  // 3 أسئلة في كل صفحة
        />
      </header>

      <main id="exam-content-area">
        <div className="question">سؤال 1...</div>
        <div className="question">سؤال 2...</div>
        <div className="question">سؤال 3...</div>
      </main>
    </div>
  );
}
```

## الخيارات

| الخاصية | النوع | الافتراضي | الوصف |
|-----------|------|-----------|---------|
| `containerId` | `string` | `'exam-content-area'` | معرف حاوية الأسئلة |
| `filename` | `string` | `'exam-questions.pdf'` | اسم ملف PDF |
| `margins` | `number` | `10` | هوامش الصفحة (مم) |
| `scale` | `number` | `2` | مقياس التكبير |
| `format` | `string` | `'a4'` | حجم الورقة |
| `orientation` | `string` | `'portrait'` | اتجاه الصفحة |
| `questionsPerPage` | `number` | `undefined` | **عدد الأسئلة في الصفحة** |
| `elementClassesToHide` | `string[]` | `[...]` | كلاسات للإخفاء |

## الترخيص

MIT
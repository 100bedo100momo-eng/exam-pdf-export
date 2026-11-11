/**
 * أمثلة استخدام مكون ExamPDFExport
 * =================================
 */

import { ExamPDFExport } from './ExamPDFExport';

// مثال 1: الاستخدام الأساسي
export function BasicExamPage() {
  return (
    <div dir="rtl" className="exam-page">
      <header className="exam-header no-print">
        <h1>امتحان الرياضيات - الفصل الأول</h1>
        <ExamPDFExport
          containerId="exam-content-area"
          filename="math-exam-chapter1.pdf"
        />
      </header>

      <main id="exam-content-area" className="exam-content">
        <section className="exam-section">
          <h2>الأسئلة الموضوعية</h2>
          <div className="question">
            <h3>سؤال 1: اوجد قيمة x في المعادلة التالية:</h3>
            <p className="equation">2x + 5 = 15</p>
            <div className="options">
              <label className="option"><input type="radio" name="q1" /> x = 5</label>
              <label className="option"><input type="radio" name="q1" /> x = 10</label>
              <label className="option"><input type="radio" name="q1" /> x = 3</label>
              <label className="option"><input type="radio" name="q1" /> x = 7</label>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

// مثال 2: التحكم في عدد الأسئلة في الصفحة (الميزة الجديدة)
export function QuestionsPerPageExamPage() {
  return (
    <div dir="rtl" className="exam-page">
      <header className="no-print">
        <h1>امتحان تجريبي - 3 أسئلة في الصفحة</h1>
        <div className="controls">
          <ExamPDFExport
            containerId="controlled-exam-content"
            filename="exam-3-per-page.pdf"
            margins={15}
            scale={2}
            questionsPerPage={3}
            onExportComplete={() => alert('تم تصدير الامتحان مع 3 أسئلة في كل صفحة!')}
          >
            {({ exportToPDF, isExporting }) => (
              <button onClick={exportToPDF} disabled={isExporting} className="btn btn-primary">
                {isExporting ? 'جاري التصدير...' : '📥 تصدير PDF (3 أسئلة/صفحة)'}
              </button>
            )}
          </ExamPDFExport>

          <ExamPDFExport
            containerId="controlled-exam-content"
            filename="exam-5-per-page.pdf"
            margins={15}
            scale={2}
            questionsPerPage={5}
          >
            {({ exportToPDF, isExporting }) => (
              <button onClick={exportToPDF} disabled={isExporting} className="btn btn-secondary" style={{ marginRight: '8px' }}>
                {isExporting ? 'جاري...' : '📄 تصدير PDF (5 أسئلة/صفحة)'}
              </button>
            )}
          </ExamPDFExport>

          <ExamPDFExport
            containerId="controlled-exam-content"
            filename="exam-auto.pdf"
            margins={15}
            scale={2}
          >
            {({ exportToPDF, isExporting }) => (
              <button onClick={exportToPDF} disabled={isExporting} className="btn btn-outline" style={{ marginRight: '8px' }}>
                {isExporting ? 'جاري...' : '📄 تصدير PDF (تلقائي)'}
              </button>
            )}
          </ExamPDFExport>
        </div>
      </header>

      <main id="controlled-exam-content" className="exam-content">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
          <div key={num} className="question page-break-avoid">
            <h3>سؤال {num}: هذا نص سؤال تجريبي رقم {num}</h3>
            <div className="options">
              <label className="option"><input type="radio" name={`q${num}`} /> خيار أ</label>
              <label className="option"><input type="radio" name={`q${num}`} /> خيار ب</label>
              <label className="option"><input type="radio" name={`q${num}`} /> خيار ج</label>
              <label className="option"><input type="radio" name={`q${num}`} /> خيار د</label>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}

// مثال 3: مع Tailwind CSS
export function TailwindStyledExamPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 no-print">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">امتحان اللغة العربية</h1>
          <ExamPDFExport
            containerId="arabic-exam-content"
            filename="arabic-exam.pdf"
            margins={15}
            scale={2}
            format="a4"
            questionsPerPage={2}
            elementClassesToHide={['.no-print', '.print-hide', 'button', 'nav', '.toolbar']}
          >
            {({ exportToPDF, isExporting, error }) => (
              <button
                onClick={exportToPDF}
                disabled={isExporting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm"
              >
                {isExporting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    جاري التصدير...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    تصدير PDF (2 سؤال/صفحة)
                  </>
                )}
              </button>
            )}
          </ExamPDFExport>
        </div>
      </header>

      <main id="arabic-exam-content" className="max-w-4xl mx-auto px-4 py-8">
        <article className="bg-white rounded-xl shadow-sm p-6 print:shadow-none print:p-0">
          <section className="exam-section mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">النص القرائي</h2>
            <div className="prose prose-ar max-w-none text-gray-700 leading-relaxed">
              <p>إن العلم نور يضيء دروب الحياة، ومن يسعى وراءه بصدق وإخلاص يجد الطريق معبداً بالنجاح والتفوق.</p>
            </div>
          </section>
          <section className="exam-section">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">الأسئلة</h2>
            <div className="space-y-6">
              <div className="question p-4 bg-gray-50 rounded-lg page-break-avoid">
                <h3 className="font-medium text-gray-900 mb-3">سؤال 1: ما الفكرة الرئيسية للنص؟</h3>
                <div className="options space-y-2">
                  <label className="option flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-blue-50 transition">
                    <input type="radio" name="ar1" className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                    <span>العلم نور وسبيل للنجاح</span>
                  </label>
                  <label className="option flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-blue-50 transition">
                    <input type="radio" name="ar1" className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                    <span>جمع المعلومات فقط</span>
                  </label>
                </div>
              </div>
            </div>
          </section>
        </article>
      </main>
    </div>
  );
}
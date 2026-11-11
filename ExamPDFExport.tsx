'use client';

import { useCallback, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

// تعريف أنواع الخيارات
interface PDFExportOptions {
  filename?: string;
  containerId?: string;
  margins?: number;
  scale?: number;
  format?: 'a4' | 'a3' | 'letter' | 'legal';
  orientation?: 'portrait' | 'landscape';
  elementClassesToHide?: string[];
}

interface PDFExportState {
  isExporting: boolean;
  error: string | null;
  progress: number;
}

/**
 * مكون تصدير الامتحان إلى PDF
 *
 * المميزات:
 * - دعم SSR عبر dynamic import
 * - إخفاء عناصر التحكم أثناء التصدير
 * - إعدادات A4 محسنة للوضوح
 * - تتبع حالة التصدير (جاري، خطأ، نجاح)
 * - تحكم في عدد الأسئلة في الصفحة
 *
 * @example
 * ```tsx
 * <ExamPDFExport
 *   containerId="exam-content-area"
 *   filename="exam-questions.pdf"
 *   questionsPerPage={3}
 *   onExportComplete={() => console.log('تم التصدير بنجاح')}
 * />
 * ```
 */
export function ExamPDFExport({
  containerId = 'exam-content-area',
  filename = 'exam-questions.pdf',
  margins = 10,
  scale = 2,
  format = 'a4',
  orientation = 'portrait',
  elementClassesToHide = ['.no-print', '.print-hide', 'button', 'nav', '.controls', '.pagination', '.export-btn'],
  questionsPerPage,
  onExportStart,
  onExportComplete,
  onExportError,
  children,
}: {
  containerId?: string;
  filename?: string;
  margins?: number;
  scale?: number;
  format?: 'a4' | 'a3' | 'letter' | 'legal';
  orientation?: 'portrait' | 'landscape';
  elementClassesToHide?: string[];
  questionsPerPage?: number;
  onExportStart?: () => void;
  onExportComplete?: () => void;
  onExportError?: (error: Error) => void;
  children?: React.ReactNode;
}) {
  const [state, setState] = useState<PDFExportState>({
    isExporting: false,
    error: null,
    progress: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // استيراد ديناميكي للمكتبة (يتجنب مشاكل SSR)
  const loadHtml2Pdf = useCallback(async () => {
    const html2pdf = (await import('html2pdf.js')).default;
    return html2pdf;
  }, []);

  const exportToPDF = useCallback(async () => {
    const container = document.getElementById(containerId);
    if (!container) {
      const error = new Error(`العنصر ذو المعرف "${containerId}" غير موجود في الصفحة`);
      setState(prev => ({ ...prev, error: error.message, isExporting: false }));
      onExportError?.(error);
      return;
    }

    if (typeof window === 'undefined') {
      const error = new Error('لا يمكن التصدير في بيئة الخادم (SSR)');
      setState(prev => ({ ...prev, error: error.message, isExporting: false }));
      onExportError?.(error);
      return;
    }

    setState(prev => ({ ...prev, isExporting: true, error: null, progress: 0 }));
    onExportStart?.();

    try {
      const html2pdf = await loadHtml2Pdf();
      abortControllerRef.current = new AbortController();

      // تطبيق تقسيم الأسئلة لكل صفحة إذا تم تحديده
      let processedContainer = container;
      if (questionsPerPage && questionsPerPage > 0) {
        processedContainer = applyQuestionsPerPage(container, questionsPerPage);
      }

      const options = {
        margin: margins,
        format: format,
        orientation: orientation,
        image: {
          type: 'jpeg',
          quality: 0.98,
        },
        scale: scale,
        html2canvas: {
          scale: scale,
          useCORS: true,
          logging: false,
          letterRendering: true,
          ignoreElements: (element: Element) => {
            const classList = Array.from(element.classList);
            const hasHideClass = elementClassesToHide.some(cls => {
              if (cls.startsWith('.')) {
                return classList.includes(cls.slice(1));
              }
              return element.tagName.toLowerCase() === cls.toLowerCase();
            });
            const hasDataNoPrint = element.hasAttribute('data-no-print');
            const style = window.getComputedStyle(element);
            const isDisplayNone = style.display === 'none';
            const isVisibilityHidden = style.visibility === 'hidden';
            return hasHideClass || hasDataNoPrint || isDisplayNone || isVisibilityHidden;
          },
          onclone: (clonedDoc: Document) => {
            clonedDoc.documentElement.setAttribute('dir', 'rtl');
            clonedDoc.documentElement.setAttribute('lang', 'ar');
            const style = clonedDoc.createElement('style');
            style.textContent = `
              * {
                font-family: 'Tajawal', 'Cairo', 'Amiri', 'Noto Sans Arabic', sans-serif !important;
              }
              @media print {
                @page {
                  margin: ${margins}mm;
                  size: ${format} ${orientation};
                }
                body {
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
              }
            `;
            clonedDoc.head.appendChild(style);
          },
        },
        jsPDF: {
          unit: 'mm',
          format: format,
          orientation: orientation,
          compress: true,
          precision: 16,
        },
        filename: filename,
        pagebreak: {
          mode: ['avoid-all', 'css', 'legacy'],
          avoid: ['.question', '.option', '.answer', '.exam-section', '.question-group'],
        },
      };

      await html2pdf().set(options).from(processedContainer).save();

      // تنظيف العنصر المستنسخ إذا تم تعديله
      if (processedContainer !== container && processedContainer.parentNode) {
        processedContainer.parentNode.removeChild(processedContainer);
      }

      setState(prev => ({ ...prev, isExporting: false, progress: 100 }));
      onExportComplete?.();

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setState(prev => ({ ...prev, isExporting: false }));
        return;
      }
      const err = error instanceof Error ? error : new Error('حدث خطأ غير معروف أثناء التصدير');
      setState(prev => ({ ...prev, isExporting: false, error: err.message }));
      onExportError?.(err);
    }
  }, [containerId, filename, margins, scale, format, orientation, elementClassesToHide, questionsPerPage, loadHtml2Pdf, onExportStart, onExportComplete, onExportError]);

  const cancelExport = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState(prev => ({ ...prev, isExporting: false }));
  }, []);

  if (children) {
    return (
      <>
        {children({
          exportToPDF,
          cancelExport,
          ...state,
        })}
        <PrintStylesheet />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={exportToPDF}
        disabled={state.isExporting}
        className="exam-pdf-export-btn no-print"
        style={defaultButtonStyles(state.isExporting)}
        aria-label="تصدير الامتحان إلى PDF"
        data-no-print="true"
      >
        {state.isExporting ? (
          <>
            <span className="spinner" style={spinnerStyles}></span>
            <span>جاري التصدير... {state.progress}%</span>
          </>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={iconStyles}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>تصدير إلى PDF</span>
          </>
        )}
      </button>
      <PrintStylesheet />
    </>
  );
}

/**
 * تطبيق تقسيم الأسئلة لكل صفحة
 * يقوم بتغليف كل N سؤال في حاوية مع فاصل صفحة
 */
function applyQuestionsPerPage(container: HTMLElement, questionsPerPage: number): HTMLElement {
  const clonedContainer = container.cloneNode(true) as HTMLElement;
  
  // البحث عن الأسئلة - يدعم عدة أنماط
  const questionSelectors = [
    '.question',
    '.question-block',
    '.mcq-item',
    '.exam-question',
    '[data-question]',
    '.question-card'
  ];

  let questions: Element[] = [];
  for (const selector of questionSelectors) {
    const found = clonedContainer.querySelectorAll(selector);
    if (found.length > 0) {
      questions = Array.from(found);
      break;
    }
  }

  // إذا لم توجد أسئلة بمحددات معروفة، ابحث عن عناصر تشبه الأسئلة
  if (questions.length === 0) {
    const allChildren = Array.from(clonedContainer.children);
    questions = allChildren.filter(el => {
      const className = el.className.toString().toLowerCase();
      return className.includes('question') || className.includes('q-');
    });
  }

  if (questions.length === 0) {
    return clonedContainer;
  }

  // تجميع الأسئلة في مجموعات
  const groups: HTMLElement[] = [];
  for (let i = 0; i < questions.length; i += questionsPerPage) {
    const groupQuestions = questions.slice(i, i + questionsPerPage);
    const groupWrapper = document.createElement('div');
    groupWrapper.className = 'question-group page-break-avoid';
    groupWrapper.setAttribute('data-question-group', String(Math.floor(i / questionsPerPage) + 1));
    
    // إضافة فاصل صفحة بعد كل مجموعة ما عدا الأخيرة
    if (i + questionsPerPage < questions.length) {
      groupWrapper.classList.add('page-break-after');
    }

    groupQuestions.forEach(q => {
      // نقل السؤال للمجموعة الجديدة
      groupWrapper.appendChild(q.cloneNode(true));
    });

    groups.push(groupWrapper);
  }

  // إزالة الأسئلة الأصلية
  questions.forEach(q => q.remove());

  // إضافة المجموعات الجديدة
  groups.forEach(g => clonedContainer.appendChild(g));

  return clonedContainer;
}

/**
 * مكون حقن تنسيقات الطباعة
 */
function PrintStylesheet() {
  if (typeof window === 'undefined') return null;

  const styleId = 'exam-print-styles';
  if (document.getElementById(styleId)) return null;

  return (
    <style id={styleId} dangerouslySetInnerHTML={{
      __html: `
        @media print {
          .no-print,
          .print-hide,
          button,
          nav,
          .controls,
          .pagination,
          .export-btn,
          [data-no-print="true"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            height: 0 !important;
            width: 0 !important;
            overflow: hidden !important;
            pointer-events: none !important;
          }

          .question,
          .option,
          .answer,
          .exam-section,
          .question-block,
          .mcq-item,
          .question-group,
          .page-break-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          @page {
            margin: 10mm;
            size: A4 portrait;
          }

          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          * {
            font-family: 'Tajawal', 'Cairo', 'Amiri', 'Noto Sans Arabic', system-ui, sans-serif !important;
          }

          html, body {
            overflow: visible !important;
            height: auto !important;
          }

          .page-break-before { page-break-before: always !important; }
          .page-break-after { page-break-after: always !important; }
        }

        .exam-pdf-export-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
          font-family: inherit;
          direction: rtl;
        }

        .exam-pdf-export-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(37, 99, 235, 0.4);
        }

        .exam-pdf-export-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
      `,
    }} />
  );
}

const defaultButtonStyles = (isExporting: boolean) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 20px',
  background: isExporting
    ? 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)'
    : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '600',
  cursor: isExporting ? 'not-allowed' : 'pointer',
  transition: 'all 0.2s ease',
  boxShadow: isExporting
    ? '0 2px 4px rgba(148, 163, 184, 0.3)'
    : '0 2px 8px rgba(37, 99, 235, 0.3)',
  fontFamily: 'inherit',
  direction: 'rtl',
  opacity: isExporting ? 0.8 : 1,
});

const iconStyles = { flexShrink: 0 };
const spinnerStyles = {
  width: '18px',
  height: '18px',
  border: '2px solid rgba(255,255,255,0.3)',
  borderTopColor: 'white',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
};

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes spin { to { transform: rotate(360deg); } }
  `;
  document.head.appendChild(styleSheet);
}

export default ExamPDFExport;
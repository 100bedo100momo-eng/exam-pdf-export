/**
 * Hook مخصص لتصدير الامتحان إلى PDF
 * يوفر مرونة أكبر للاستخدام في أي مكون
 */

'use client';

import { useCallback, useRef, useState } from 'react';

interface UseExamPDFExportOptions {
  containerId: string;
  filename?: string;
  margins?: number;
  scale?: number;
  format?: 'a4' | 'a3' | 'letter' | 'legal';
  orientation?: 'portrait' | 'landscape';
  elementClassesToHide?: string[];
  questionsPerPage?: number;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

interface UseExamPDFExportReturn {
  exportToPDF: () => Promise<void>;
  cancelExport: () => void;
  isExporting: boolean;
  error: string | null;
  progress: number;
}

/**
 * Hook لتصدير محتوى الامتحان إلى PDF
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { exportToPDF, isExporting, error, progress } = useExamPDFExport({
 *     containerId: 'exam-content',
 *     filename: 'exam.pdf',
 *     questionsPerPage: 3,
 *     onComplete: () => toast.success('تم الحفظ'),
 *     onError: (err) => toast.error(err.message),
 *   });
 *
 *   return (
 *     <button onClick={exportToPDF} disabled={isExporting}>
 *       {isExporting ? `جاري التصدير... ${progress}%` : 'تصدير PDF'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useExamPDFExport({
  containerId,
  filename = 'exam-questions.pdf',
  margins = 10,
  scale = 2,
  format = 'a4',
  orientation = 'portrait',
  elementClassesToHide = [
    '.no-print',
    '.print-hide',
    'button',
    'nav',
    '.controls',
    '.pagination',
    '.export-btn',
    '.toolbar',
    '.sidebar',
  ],
  questionsPerPage,
  onProgress,
  onComplete,
  onError,
}: UseExamPDFExportOptions): UseExamPDFExportReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // تحميل المكتبة ديناميكياً
  const loadHtml2Pdf = useCallback(async () => {
    const html2pdf = (await import('html2pdf.js')).default;
    return html2pdf;
  }, []);

  // تطبيق تقسيم الأسئلة لكل صفحة
  const applyQuestionsPerPage = useCallback((container: HTMLElement, perPage: number): HTMLElement => {
    const clonedContainer = container.cloneNode(true) as HTMLElement;
    
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

    const groups: HTMLElement[] = [];
    for (let i = 0; i < questions.length; i += perPage) {
      const groupQuestions = questions.slice(i, i + perPage);
      const groupWrapper = document.createElement('div');
      groupWrapper.className = 'question-group page-break-avoid';
      groupWrapper.setAttribute('data-question-group', String(Math.floor(i / perPage) + 1));
      
      if (i + perPage < questions.length) {
        groupWrapper.classList.add('page-break-after');
      }

      groupQuestions.forEach(q => {
        groupWrapper.appendChild(q.cloneNode(true));
      });

      groups.push(groupWrapper);
    }

    questions.forEach(q => q.remove());
    groups.forEach(g => clonedContainer.appendChild(g));

    return clonedContainer;
  }, []);

  const exportToPDF = useCallback(async () => {
    if (typeof window === 'undefined') {
      const err = new Error('لا يمكن التصدير في بيئة الخادم (SSR)');
      setError(err.message);
      onError?.(err);
      return;
    }

    const container = document.getElementById(containerId);
    if (!container) {
      const err = new Error(`العنصر "${containerId}" غير موجود`);
      setError(err.message);
      onError?.(err);
      return;
    }

    setIsExporting(true);
    setError(null);
    setProgress(0);
    abortControllerRef.current = new AbortController();

    try {
      const html2pdf = await loadHtml2Pdf();

      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // تطبيق تقسيم الأسئلة إذا تم تحديده
      let processedContainer = container;
      if (questionsPerPage && questionsPerPage > 0) {
        processedContainer = applyQuestionsPerPage(container, questionsPerPage);
      }

      const options = {
        margin: margins,
        format,
        orientation,
        image: { type: 'jpeg', quality: 0.98 },
        scale,
        html2canvas: {
          scale,
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
              * { font-family: 'Tajawal', 'Cairo', 'Amiri', 'Noto Sans Arabic', sans-serif !important; }
              @media print {
                @page { margin: ${margins}mm; size: ${format} ${orientation}; }
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              }
            `;
            clonedDoc.head.appendChild(style);
          },
        },
        jsPDF: {
          unit: 'mm',
          format,
          orientation,
          compress: true,
          precision: 16,
        },
        filename,
        pagebreak: {
          mode: ['avoid-all', 'css', 'legacy'],
          avoid: ['.question', '.option', '.answer', '.exam-section', '.question-group'],
        },
      };

      await html2pdf().set(options).from(processedContainer).save();

      if (processedContainer !== container && processedContainer.parentNode) {
        processedContainer.parentNode.removeChild(processedContainer);
      }

      clearInterval(progressInterval);
      setProgress(100);
      setIsExporting(false);
      onComplete?.();

    } catch (err) {
      clearInterval(progressInterval);
      if (err instanceof Error && err.name === 'AbortError') {
        setIsExporting(false);
        return;
      }
      const error = err instanceof Error ? err : new Error('فشل التصدير');
      setError(error.message);
      setIsExporting(false);
      onError?.(error);
    }
  }, [
    containerId,
    filename,
    margins,
    scale,
    format,
    orientation,
    elementClassesToHide,
    questionsPerPage,
    loadHtml2Pdf,
    applyQuestionsPerPage,
    onProgress,
    onComplete,
    onError,
  ]);

  const cancelExport = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsExporting(false);
    setProgress(0);
  }, []);

  return {
    exportToPDF,
    cancelExport,
    isExporting,
    error,
    progress,
  };
}

export default useExamPDFExport;
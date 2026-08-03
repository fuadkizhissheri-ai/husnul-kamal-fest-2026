import html2canvas from 'html2canvas';

export interface PixelAccurateExportOptions {
  element: HTMLElement;
  className: string;
  width: number;
  height: number;
  scale?: number;
  backgroundColor?: string | null;
  filename: string;
  format?: 'image/jpeg' | 'image/png';
  quality?: number;
}

/**
 * 🎨 Shared Pixel-Accurate Document & Card Image Exporter
 * Consolidates server/client rendering logic for ID Cards, Certificates & Reports
 * Guarantees font metric loading, layout settling, stylesheet cloning, and transform normalization.
 */
export async function exportElementAsImage(options: PixelAccurateExportOptions): Promise<void> {
  const {
    element,
    className,
    width,
    height,
    scale = 3,
    backgroundColor = null,
    filename,
    format = 'image/jpeg',
    quality = 0.98,
  } = options;

  if (!element) throw new Error('Target export element is null');

  // 1. Explicitly await document fonts loading completion
  if (typeof document !== 'undefined' && document.fonts) {
    await document.fonts.ready;
  }

  // 2. Allow flexbox reflow & font rendering layout settlement
  await new Promise((resolve) => setTimeout(resolve, 150));

  // 3. Capture canvas with exact target dimensions and stylesheet cloning
  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: backgroundColor || undefined,
    logging: false,
    width,
    height,
    onclone: (clonedDoc: Document) => {
      // Copy all active stylesheets and font link tags into cloned document context
      const styleElements = document.querySelectorAll('link[rel="stylesheet"], style');
      styleElements.forEach((el) => {
        clonedDoc.head.appendChild(el.cloneNode(true));
      });

      const clonedEl = clonedDoc.querySelector(`.${className}`) as HTMLElement;
      if (clonedEl) {
        clonedEl.style.transform = 'none';
        clonedEl.style.margin = '0';
        clonedEl.style.position = 'relative';
        clonedEl.style.width = `${width}px`;
        clonedEl.style.height = `${height}px`;
      }
    },
  } as any);

  // 4. Download file
  const imageDataUrl = canvas.toDataURL(format, quality);
  const downloadLink = document.createElement('a');
  downloadLink.href = imageDataUrl;
  downloadLink.download = filename;
  downloadLink.click();
}

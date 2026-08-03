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
    scale = 2,
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
  await new Promise((resolve) => setTimeout(resolve, 200));

  // 3. Capture canvas with unscaled off-screen cloned DOM context
  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: backgroundColor || undefined,
    logging: false,
    width,
    height,
    windowWidth: width + 200,
    windowHeight: height + 200,
    x: 0,
    y: 0,
    scrollX: 0,
    scrollY: 0,
    onclone: (clonedDoc: Document) => {
      // Copy all active stylesheets and font link tags into cloned document context
      const styleElements = document.querySelectorAll('link[rel="stylesheet"], style');
      styleElements.forEach((el) => {
        clonedDoc.head.appendChild(el.cloneNode(true));
      });

      const clonedEl = clonedDoc.querySelector(`.${className}`) as HTMLElement;
      if (clonedEl) {
        // Isolate target element into clean, unscaled top-level body container
        clonedDoc.body.innerHTML = '';
        clonedDoc.body.appendChild(clonedEl);

        clonedDoc.body.style.margin = '0';
        clonedDoc.body.style.padding = '0';
        clonedDoc.body.style.width = `${width}px`;
        clonedDoc.body.style.height = `${height}px`;
        clonedDoc.body.style.overflow = 'hidden';
        clonedDoc.body.style.backgroundColor = backgroundColor || '#F8F5EE';

        clonedEl.style.transform = 'none';
        clonedEl.style.webkitTransform = 'none';
        clonedEl.style.position = 'absolute';
        clonedEl.style.top = '0';
        clonedEl.style.left = '0';
        clonedEl.style.margin = '0';
        clonedEl.style.padding = '0';
        clonedEl.style.width = `${width}px`;
        clonedEl.style.height = `${height}px`;
        clonedEl.style.zIndex = '999999';
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

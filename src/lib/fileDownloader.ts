import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

/**
 * 📥 Universal File Downloader for Web, Mobile WebView, and Capacitor Native
 * Supports Data URLs (base64), Blobs, or raw string data.
 */
export async function downloadFile(
  contentOrUrl: string | Blob,
  filename: string,
  mimeType: string = 'application/pdf'
): Promise<void> {
  const isNative = Capacitor.isNativePlatform();

  // 1. CAPACITOR NATIVE ANDROID / IOS FLOW
  if (isNative) {
    try {
      let base64Data = '';

      if (typeof contentOrUrl === 'string') {
        if (contentOrUrl.startsWith('data:')) {
          base64Data = contentOrUrl.split(',')[1] || contentOrUrl;
        } else {
          // Plain text (CSV, TXT)
          base64Data = btoa(unescape(encodeURIComponent(contentOrUrl)));
        }
      } else if (contentOrUrl instanceof Blob) {
        base64Data = await blobToBase64(contentOrUrl);
      }

      const savedFile = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache,
      });

      await Share.share({
        title: filename,
        text: `Husnul Kamal 2026 — ${filename}`,
        url: savedFile.uri,
        dialogTitle: `Download / Save ${filename}`,
      });
      return;
    } catch (nativeErr) {
      console.warn('[FileDownloader] Native download fallback to browser:', nativeErr);
    }
  }

  // 2. BROWSER / WEB FLOW
  try {
    let blobUrl = '';
    if (typeof contentOrUrl === 'string') {
      if (contentOrUrl.startsWith('data:')) {
        blobUrl = contentOrUrl;
      } else {
        const blob = new Blob([contentOrUrl], { type: mimeType });
        blobUrl = URL.createObjectURL(blob);
      }
    } else {
      blobUrl = URL.createObjectURL(contentOrUrl);
    }

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.target = '_blank';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
      if (blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl);
      }
    }, 500);
  } catch (err) {
    console.error('[FileDownloader] Download error:', err);
    if (typeof contentOrUrl === 'string' && contentOrUrl.startsWith('data:')) {
      const win = window.open();
      if (win) {
        win.document.write(`<iframe src="${contentOrUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
      }
    }
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const res = reader.result as string;
      const base64 = res.split(',')[1] || res;
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
}

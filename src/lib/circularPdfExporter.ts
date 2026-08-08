import jsPDF from 'jspdf';
import { downloadFile } from '@/lib/fileDownloader';

export interface CircularData {
  title: string;
  body: string;
  refNumber?: string | null;
  categoryBadge?: string | null;
  publishedAt?: string | Date | null;
  signatoryOption?: string | null; // BOTH, COORD1, COORD2
  coordinator1Name?: string | null;
  coordinator1Designation?: string | null;
  coordinator2Name?: string | null;
  coordinator2Designation?: string | null;
  coordinatorName?: string | null;
  coordinatorDesignation?: string | null;
}

export function downloadOfficialCircularPDF(circular: CircularData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  // 1. TOP HEADER BANNER (Official Letterhead Look)
  doc.setFillColor(7, 7, 9); // Dark Obsidian
  doc.rect(0, 0, 210, 36, 'F');

  // Gold Decorative Accent Line
  doc.setFillColor(200, 168, 107); // Champagne Gold (#C8A86B)
  doc.rect(0, 34, 210, 2, 'F');

  // Fest Title Header
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('HUSNUL KAMAL — MEELAD FEST 2026', margin, 16);

  doc.setTextColor(200, 168, 107);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Mifthahul Uloom Madrasa, Ullisherikkunnu • Event Portal', margin, 24);

  // 2. REFERENCE NUMBER & DATE
  const refNum = circular.refNumber || `HK/2026/CIR-${String(Math.floor(Math.random() * 900 + 100))}`;
  const publishDate = circular.publishedAt
    ? new Date(circular.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(9);
  doc.setFont('courier', 'bold');
  doc.text(`Ref: ${refNum}`, pageWidth - margin, 46, { align: 'right' });
  doc.text(`Date: ${publishDate}`, pageWidth - margin, 52, { align: 'right' });

  // 3. OFFICIAL CIRCULAR TITLE BADGE
  doc.setFillColor(200, 168, 107);
  doc.rect(margin, 46, 60, 8, 'F');

  doc.setTextColor(7, 7, 9);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('OFFICIAL CIRCULAR', margin + 6, 51.5);

  if (circular.categoryBadge) {
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(`Category: ${circular.categoryBadge}`, margin, 60);
  }

  // Horizontal Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, 64, pageWidth - margin, 64);

  // 4. CIRCULAR SUBJECT / TITLE
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');

  const titleLines = doc.splitTextToSize(circular.title.toUpperCase(), contentWidth);
  doc.text(titleLines, margin, 74);

  let currentY = 74 + titleLines.length * 7 + 4;

  // 5. BODY TEXT
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const bodyLines = doc.splitTextToSize(circular.body, contentWidth);
  
  bodyLines.forEach((line: string) => {
    if (currentY > 230) {
      doc.addPage();
      currentY = 25;
    }
    doc.text(line, margin, currentY);
    currentY += 6;
  });

  currentY += 14;

  if (currentY > 220) {
    doc.addPage();
    currentY = 40;
  }

  // 6. DUAL PROGRAMME COORDINATOR SIGNATURE BLOCK
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text('By Order & Authorization of Programme Coordinators,', margin, currentY);

  currentY += 16;

  const coord1Name = circular.coordinator1Name || circular.coordinatorName || 'FUAD BIN ADAM';
  const coord1Desig = circular.coordinator1Designation || circular.coordinatorDesignation || 'Programme Convener, Husnul Kamal Fest 2026';

  const coord2Name = circular.coordinator2Name || 'Midlaj Roshan Kamali';
  const coord2Desig = circular.coordinator2Designation || 'Coordinator';

  const option = (circular.signatoryOption || 'BOTH').toUpperCase();

  if (option === 'BOTH') {
    // TWO COLUMNS SIGNATURE BLOCK (Side-by-Side)
    const colWidth = (contentWidth - 10) / 2;
    const col1X = margin;
    const col2X = margin + colWidth + 10;

    // Signature Lines
    doc.setDrawColor(200, 168, 107);
    doc.setLineWidth(0.8);
    doc.line(col1X, currentY, col1X + colWidth - 10, currentY);
    doc.line(col2X, currentY, col2X + colWidth - 10, currentY);

    currentY += 6;

    // Names
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(coord1Name, col1X, currentY);
    doc.text(coord2Name, col2X, currentY);

    currentY += 5;

    // Designations
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(coord1Desig, col1X, currentY);
    doc.text(coord2Desig, col2X, currentY);

    currentY += 4;
    doc.text('Husnul Kamal Fest 2026', col1X, currentY);
    doc.text('Husnul Kamal Fest 2026', col2X, currentY);
  } else {
    // SINGLE SIGNATURE BLOCK (Right-Aligned)
    const activeName = option === 'COORD2' ? coord2Name : coord1Name;
    const activeDesig = option === 'COORD2' ? coord2Desig : coord1Desig;
    const signX = pageWidth - margin;

    doc.setDrawColor(200, 168, 107);
    doc.setLineWidth(0.8);
    doc.line(signX - 60, currentY, signX, currentY);

    currentY += 6;

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(activeName, signX, currentY, { align: 'right' });

    currentY += 5;

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(activeDesig, signX, currentY, { align: 'right' });

    currentY += 4;
    doc.text('Husnul Kamal Fest 2026', signX, currentY, { align: 'right' });
  }

  // 7. FOOTER
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 282, 210, 15, 'F');

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(0, 282, 210, 282);

    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Husnul Kamal Meelad Fest 2026 • Official Document Ref: ${refNum} • Page ${i} of ${pageCount}`,
      margin,
      289
    );
    doc.text('www.husnulkamal2026.org', pageWidth - margin, 289, { align: 'right' });
  }

  // Trigger Instant Download
  const filename = `${refNum.replace(/[/\\?%*:|"<>]/g, '_')}_Official_Circular.pdf`;
  const pdfDataUri = doc.output('datauristring');
  downloadFile(pdfDataUri, filename, 'application/pdf');
}

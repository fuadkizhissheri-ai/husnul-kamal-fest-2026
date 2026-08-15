import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { downloadFile } from '@/lib/fileDownloader';

export interface ScoreCardConfig {
  programmeName: string;
  category: string;
  stage: string;
  date?: string;
  startTime?: string;
  judgeCount?: number; // 1, 2, or 3 judges
  includeRemarks?: boolean;
  orientation?: 'portrait' | 'landscape';
}

export interface ScoreCardParticipant {
  chestNumber: string;
  fullName?: string;
  madrasa?: string;
  group?: string;
  category?: string;
  whatsapp?: string;
}

export function downloadProgrammeChartPDF(
  programme: { name: string; category: string; date?: string; startTime?: string; registrations?: any[] },
  filename?: string
) {
  const doc = new jsPDF();

  // Header Banner
  doc.setFillColor(6, 78, 59); // Emerald 900
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(251, 191, 36); // Amber 400
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Husnul Kamal — Meelad Fest 2026', 14, 14);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Mifthahul Uloom Madrasa, Ullisherikkunnu', 14, 22);

  doc.setTextColor(245, 158, 11);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`PROGRAMME CHART: ${programme.name.toUpperCase()}`, 14, 42);

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  const totalRegistrations = programme.registrations?.length || 0;
  doc.text(
    `Category: ${programme.category}  |  Date/Time: ${programme.date || 'TBD'} ${programme.startTime || ''}  |  Total Registrations: ${totalRegistrations}`,
    14,
    48
  );

  const headers = ['Sl No', 'Chest No', 'Participant Name', 'Institution/House', 'Category', 'Phone Number'];
  
  const validParticipants = (programme.registrations || []).map((r: any) => r.participant).filter(Boolean);
  const sortedParticipants = [...validParticipants].sort((a: any, b: any) => {
    const numA = parseInt((a.chestNumber || '').replace(/\D/g, '')) || 0;
    const numB = parseInt((b.chestNumber || '').replace(/\D/g, '')) || 0;
    return numA - numB;
  });

  const rows = sortedParticipants.map((p: any, index: number) => [
    index + 1,
    p.chestNumber || '-',
    p.fullName || '-',
    p.group || p.madrasa || '-', // house or institution
    p.category || programme.category,
    p.whatsapp || '-'
  ]);

  autoTable(doc, {
    startY: 55,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [11, 93, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [241, 245, 249],
    },
    margin: { top: 55 },
  });

  // Footer Signature Space
  const finalY = (doc as any).lastAutoTable?.finalY || 160;
  let signatureY = finalY + 20;
  const pageHeight = doc.internal.pageSize.getHeight();
  if (signatureY > pageHeight - 30) {
    doc.addPage();
    signatureY = 30;
  }
  
  doc.setLineWidth(0.4);
  doc.setDrawColor(100, 100, 100);
  
  doc.line(14, signatureY, 70, signatureY);
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text('Controller Signature', 42, signatureY + 5, { align: 'center' });

  doc.line(140, signatureY, 196, signatureY);
  doc.text('Convener Signature', 168, signatureY + 5, { align: 'center' });

  // Page Numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Generated on ${new Date().toLocaleDateString()} • Page ${i} of ${pageCount} • Husnul Kamal Meelad Fest 2026`,
      14,
      288
    );
  }

  const saveName = filename || `ProgrammeChart_${programme.name.replace(/\s+/g, '_')}_${programme.category}.pdf`;
  const pdfDataUri = doc.output('datauristring');
  downloadFile(pdfDataUri, saveName, 'application/pdf');
}

export interface ScoreCardParticipant {
  chestNumber: string;
  fullName?: string;
  madrasa?: string;
  group?: string;
  category?: string;
}

export function downloadSingleProgrammeChartPDF(
  programmeName: string,
  category: string,
  participants: any[],
  filename: string
) {
  const doc = new jsPDF();
  
  // Header
  doc.setFillColor(6, 78, 59); // Emerald 900
  doc.rect(0, 0, 210, 32, 'F');
  
  doc.setTextColor(251, 191, 36); // Amber 400
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Husnul Kamal — Meelad Fest 2026', 14, 14);
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Mifthahul Uloom Madrasa, Ullisherikkunnu', 14, 22);
  
  doc.setTextColor(245, 158, 11); // Amber 500
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`PROGRAMME: ${programmeName.toUpperCase()}`, 14, 42);

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.text(`Category: ${category}  |  Total Delegates: ${participants.length}`, 14, 48);

  const headers = ['Sl No', 'Chest No', 'Participant Name', 'Institution/Group', 'Category'];
  
  const sortedParticipants = [...participants].sort((a, b) => {
    const numA = parseInt((a.chestNumber || '').replace(/\D/g, '')) || 0;
    const numB = parseInt((b.chestNumber || '').replace(/\D/g, '')) || 0;
    return numA - numB;
  });

  const rows = sortedParticipants.map((p, index) => [
    index + 1,
    p.chestNumber || '-',
    p.fullName?.toUpperCase() || '-',
    p.group || p.madrasa || '-',
    p.category || '-'
  ]);

  autoTable(doc, {
    startY: 55,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [11, 93, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
    bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [241, 245, 249] },
  });

  // Footer Signature Space
  const finalY = (doc as any).lastAutoTable?.finalY || 160;
  let signatureY = finalY + 20;
  const pageHeight = doc.internal.pageSize.getHeight();
  if (signatureY > pageHeight - 30) {
    doc.addPage();
    signatureY = 30;
  }
  
  doc.setLineWidth(0.4);
  doc.setDrawColor(100, 100, 100);
  doc.line(14, signatureY, 70, signatureY);
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text('Controller Signature', 42, signatureY + 5, { align: 'center' });

  // Page Numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on ${new Date().toLocaleDateString()} • Page ${i} of ${pageCount}`, 14, 288);
  }

  const pdfDataUri = doc.output('datauristring');
  downloadFile(pdfDataUri, filename, 'application/pdf');
}

export function downloadPublicFilteredViewPDF(
  filterTitle: string,
  participants: any[],
  filename: string
) {
  const doc = new jsPDF();
  doc.setFillColor(6, 78, 59);
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(251, 191, 36);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Husnul Kamal — Meelad Fest 2026', 14, 14);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Mifthahul Uloom Madrasa, Ullisherikkunnu', 14, 22);

  doc.setTextColor(245, 158, 11);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(filterTitle.toUpperCase(), 14, 42);

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.text(`Total Delegates: ${participants.length}`, 14, 48);

  const headers = ['Sl No', 'Chest No', 'Name', 'Group/House', 'Category', 'Programmes'];
  
  const rows = participants.map((p, index) => [
    index + 1,
    p.chestNumber || '-',
    p.fullName?.toUpperCase() || '-',
    p.group || p.madrasa || '-',
    p.category || '-',
    p.registrations ? p.registrations.map((r: any) => r.programme?.name).filter(Boolean).join(', ') : '-'
  ]);

  autoTable(doc, {
    startY: 55,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [11, 93, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [241, 245, 249],
    },
  });

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on ${new Date().toLocaleDateString()} • Page ${i} of ${pageCount}`, 14, 288);
  }

  const pdfDataUri = doc.output('datauristring');
  downloadFile(pdfDataUri, filename, 'application/pdf');
}

export function downloadAllProgrammesChartPDF(participants: any[], filename: string) {
  const doc = new jsPDF();
  
  // Header
  doc.setFillColor(6, 78, 59);
  doc.rect(0, 0, 210, 32, 'F');
  doc.setTextColor(251, 191, 36);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Husnul Kamal — Meelad Fest 2026', 14, 14);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Mifthahul Uloom Madrasa, Ullisherikkunnu', 14, 22);
  doc.setTextColor(245, 158, 11);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ALL PROGRAMMES DELEGATE CHART', 14, 42);

  // Group by programme
  const progMap = new Map<string, any[]>();
  participants.forEach(p => {
    (p.registrations || []).forEach((r: any) => {
      if (r.programme?.name) {
        if (!progMap.has(r.programme.name)) progMap.set(r.programme.name, []);
        progMap.get(r.programme.name)!.push(p);
      }
    });
  });

  const headers = ['Sl No', 'Chest No', 'Name', 'Group', 'Category'];
  let currentY = 50;

  progMap.forEach((delegates, progName) => {
    // Sort delegates numerically by chest number
    delegates.sort((a, b) => {
      const numA = parseInt((a.chestNumber || '').replace(/\D/g, '')) || 0;
      const numB = parseInt((b.chestNumber || '').replace(/\D/g, '')) || 0;
      return numA - numB;
    });

    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    doc.setTextColor(31, 58, 58);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Programme: ${progName.toUpperCase()} (${delegates.length} Delegates)`, 14, currentY);
    
    const rows = delegates.map((p, index) => [
      index + 1,
      p.chestNumber || '-',
      p.fullName?.toUpperCase() || '-',
      p.group || '-',
      p.category || '-'
    ]);

    autoTable(doc, {
      startY: currentY + 5,
      head: [headers],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [11, 93, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      margin: { top: 20 },
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 15;
  });

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on ${new Date().toLocaleDateString()} • Page ${i} of ${pageCount}`, 14, 288);
  }

  const pdfDataUri = doc.output('datauristring');
  downloadFile(pdfDataUri, filename, 'application/pdf');
}

export function downloadPDFReport(title: string, headers: string[], rows: (string | number)[][], filename: string) {
  const doc = new jsPDF();

  // Header Banner
  doc.setFillColor(6, 78, 59); // Emerald 900
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(251, 191, 36); // Amber 400
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Husnul Kamal — Meelad Fest 2026', 14, 14);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Mifthahul Uloom Madrasa, Ullisherikkunnu', 14, 22);

  doc.setTextColor(245, 158, 11);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), 14, 42);

  // Generate Table
  autoTable(doc, {
    startY: 48,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [11, 93, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [241, 245, 249],
    },
    margin: { top: 48 },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Generated on ${new Date().toLocaleDateString()} • Page ${i} of ${pageCount} • Husnul Kamal Meelad Fest 2026`,
      14,
      288
    );
  }

  const pdfDataUri = doc.output('datauristring');
  downloadFile(pdfDataUri, filename, 'application/pdf');
}

/**
 * 🏆 SIMPLIFIED JUDGMENT & SCORE CARD PDF GENERATOR
 * Formats a clean, high-contrast, ink-friendly print sheet with visible cell gridlines
 * and CHEST NUMBER ONLY for judges. Handles multi-page pagination repeating headers.
 */
export function downloadScoreCardPDF(
  config: ScoreCardConfig,
  participants: ScoreCardParticipant[],
  filename?: string
) {
  const orientation = config.orientation || 'landscape';
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  renderSingleScoreCardPage(doc, config, participants);

  const saveName = filename || `ScoreCard_${config.programmeName.replace(/\s+/g, '_')}_${config.category}.pdf`;
  doc.save(saveName);
}

/**
 * 📦 BATCH SCORE CARD EXPORTER
 */
export function downloadBatchScoreCardsPDF(
  items: Array<{ config: ScoreCardConfig; participants: ScoreCardParticipant[] }>,
  batchFilename: string
) {
  if (items.length === 0) return;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  items.forEach((item, index) => {
    if (index > 0) {
      doc.addPage('a4', 'landscape');
    }
    renderSingleScoreCardPage(doc, item.config, item.participants);
  });

  doc.save(batchFilename);
}

/**
 * Helper to render a score card page with live registration auto-population,
 * repeat headers on multi-page overflow, and 0-participant empty states.
 */
function renderSingleScoreCardPage(
  doc: jsPDF,
  config: ScoreCardConfig,
  participants: ScoreCardParticipant[]
) {
  const isLandscape = doc.internal.pageSize.getWidth() > doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 1. Header Banner (Ink-friendly white with gold border)
  doc.setFillColor(250, 248, 243); // Warm cream base
  doc.rect(10, 8, pageWidth - 20, 28, 'F');
  doc.setDrawColor(201, 162, 39); // Gold border
  doc.setLineWidth(0.6);
  doc.rect(10, 8, pageWidth - 20, 28, 'S');

  // Fest Title
  doc.setTextColor(31, 58, 58); // Dark Teal
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('HUSNUL KAMAL MEELAD FEST 2026', 15, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(85, 85, 85);
  doc.text('Mifthahul Uloom Madrasa, Ullisherikkunnu Campus • Official Judge Score Sheet', 15, 22);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(158, 116, 29); // Bronze Gold
  doc.text(`PROGRAMME: ${config.programmeName.toUpperCase()}`, 15, 30);

  // Right Metadata block
  doc.setFontSize(9);
  doc.setTextColor(31, 58, 58);
  doc.text(`Category: ${config.category}`, pageWidth - 15, 16, { align: 'right' });
  doc.text(`Stage Venue: ${config.stage}`, pageWidth - 15, 22, { align: 'right' });
  doc.text(`Date/Time: ${config.date || 'Event Day'} ${config.startTime || ''}`, pageWidth - 15, 30, { align: 'right' });

  // Filter out invalid items and sort participants by Chest Number numerically ascending
  const validParticipants = (participants || []).filter((p) => p && p.chestNumber);
  const sortedParticipants = [...validParticipants].sort((a, b) => {
    const numA = parseInt((a.chestNumber || '').replace(/\D/g, '')) || 0;
    const numB = parseInt((b.chestNumber || '').replace(/\D/g, '')) || 0;
    return numA - numB;
  });

  // Handle 0-Participant Empty State
  if (sortedParticipants.length === 0) {
    doc.setFillColor(254, 242, 242);
    doc.rect(10, 42, pageWidth - 20, 24, 'F');
    doc.setDrawColor(239, 68, 68);
    doc.setLineWidth(0.5);
    doc.rect(10, 42, pageWidth - 20, 24, 'S');

    doc.setTextColor(185, 28, 28);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('NO PARTICIPANTS REGISTERED FOR THIS PROGRAMME YET', pageWidth / 2, 54, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text('Delegates registered for this event will auto-populate here upon next export.', pageWidth / 2, 61, { align: 'center' });
    return;
  }

  // Build simplified table headers
  const judgeCount = config.judgeCount || 3;
  const includeRemarks = config.includeRemarks !== false;

  const headers = ['Chest No.'];
  for (let j = 1; j <= judgeCount; j++) {
    headers.push(`Judge ${j} (50)`);
  }
  headers.push('Total (150)');
  if (includeRemarks) {
    headers.push('Remarks / Grade');
  }

  // Populate auto-generated participant rows
  const tableRows: string[][] = sortedParticipants.map((p) => {
    const row = [p.chestNumber];
    for (let j = 1; j <= judgeCount; j++) {
      row.push(''); // Blank for judge hand-written score
    }
    row.push(''); // Blank Total
    if (includeRemarks) {
      row.push(''); // Blank Remarks
    }
    return row;
  });

  // Generate Table with multi-page repeat headers and crisp gridlines
  autoTable(doc, {
    startY: 40,
    head: [headers],
    body: tableRows,
    theme: 'grid',
    showHead: 'everyPage', // Repeats header row on page 2+ for 15+ participants
    styles: {
      lineColor: [80, 80, 80],
      lineWidth: 0.4,
      minCellHeight: 13,
      valign: 'middle',
      fontSize: 10,
    },
    headStyles: {
      fillColor: [31, 58, 58],
      textColor: [248, 245, 238],
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'center',
      valign: 'middle',
      lineColor: [31, 58, 58],
      lineWidth: 0.4,
    },
    bodyStyles: {
      textColor: [20, 20, 20],
      halign: 'center',
      valign: 'middle',
    },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'center', cellWidth: isLandscape ? 45 : 38 },
    },
    alternateRowStyles: {
      fillColor: [250, 252, 255],
    },
    margin: { top: 40, left: 10, right: 10, bottom: 25 },
  });

  // Footer Signatures
  const finalY = (doc as any).lastAutoTable?.finalY || 160;
  const signatureY = Math.min(finalY + 16, pageHeight - 22);

  doc.setLineWidth(0.4);
  doc.setDrawColor(100, 100, 100);

  const sigBoxWidth = (pageWidth - 30) / 4;
  for (let s = 0; s < 4; s++) {
    const sigX = 10 + s * (sigBoxWidth + 3.3);
    doc.line(sigX, signatureY, sigX + sigBoxWidth, signatureY);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    const label = s < 3 ? `Judge ${s + 1} Signature` : 'Stage Controller Signature';
    doc.text(label, sigX + sigBoxWidth / 2, signatureY + 4, { align: 'center' });
  }

  // Page numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(
    `Husnul Kamal Meelad Fest 2026 • Official Score Card • Page ${currentPage} of ${pageCount}`,
    pageWidth / 2,
    pageHeight - 6,
    { align: 'center' }
  );

  const pdfDataUri = doc.output('datauristring');
  const filename = `${config.programmeName.replace(/[^a-zA-Z0-9]/g, '_')}_ScoreCard.pdf`;
  downloadFile(pdfDataUri, filename, 'application/pdf');
}

export function downloadProgrammesViewPDF(
  title: string,
  registrations: any[],
  filename: string
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header Banner
  doc.setFillColor(11, 11, 11);
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setTextColor(200, 168, 107);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Husnul Kamal — Meelad Fest 2026', 14, 15);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Mifthahul Uloom Madrasa, Ullisherikkunnu', 14, 22);

  doc.setTextColor(245, 230, 196);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), 14, 31);

  const headers = ['Sl No', 'Programme Name', 'Participant', 'Chest No', 'Category', 'Group'];

  const rows = registrations.map((r: any, index: number) => [
    index + 1,
    r.programmeName || '-',
    r.participantName || '-',
    r.chestNumber || '-',
    r.category || '-',
    r.group || '-'
  ]);

  autoTable(doc, {
    startY: 42,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 30, 30],
      textColor: [200, 168, 107],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 30, 30],
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248],
    },
    margin: { top: 42, left: 14, right: 14, bottom: 25 },
  });

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Generated on ${new Date().toLocaleDateString()} • Page ${i} of ${pageCount} • Husnul Kamal Meelad Fest 2026`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  const pdfDataUri = doc.output('datauristring');
  downloadFile(pdfDataUri, filename, 'application/pdf');
}

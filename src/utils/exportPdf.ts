import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DAY_NAMES, getDayOfWeek, JENIS_CUTI, MONTH_NAMES, MONTH_SHORT } from '../data/kpmCalendar';
import { SchoolSettings, TakwimRow } from '../types/takwim';
import { DEFAULT_SCHOOL_SVG, DEFAULT_TS25_SVG } from '../data/defaultLogos';

interface ExportPdfOptions {
  rows: Record<string, TakwimRow>;
  allDates: string[];
  weeksMap: Record<string, number>;
  weekKeyFn: (d: string) => string;
  isWeekendFn: (d: string) => boolean;
  settings: SchoolSettings;
  monthScope: number | 'all'; // 0..11 or 'all'
}

/**
 * Tukar URI SVG atau dataURL imej ke PNG base64 menggunakan Canvas
 * supaya serasi 100% dengan jsPDF tanpa sebarang ralat format.
 */
async function convertImageToPng(src: string): Promise<string | null> {
  if (!src) return null;
  return new Promise(resolve => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || 160;
          canvas.height = img.naturalHeight || 160;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(null);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const pngData = canvas.toDataURL('image/png');
          resolve(pngData);
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = src;
    } catch {
      resolve(null);
    }
  });
}

/**
 * Jana dokumen PDF rasmi Takwim Persekolahan KPM.
 * Bermula tepat dari: KEMENTERIAN PENDIDIKAN MALAYSIA.
 * Menggunakan format A4 Portrait dengan susun atur terpusat (center).
 */
export async function generateTakwimPdf({
  rows,
  allDates,
  weeksMap,
  weekKeyFn,
  isWeekendFn,
  settings,
  monthScope
}: ExportPdfOptions): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Pra-muat imej logo sekolah & logo TS25
  const schoolLogoSrc = settings.logoSekolah || DEFAULT_SCHOOL_SVG;
  const ts25LogoSrc = settings.logoTs25 || DEFAULT_TS25_SVG;

  const [schoolLogoPng, ts25LogoPng] = await Promise.all([
    convertImageToPng(schoolLogoSrc),
    settings.paparLogoTs25 !== false ? convertImageToPng(ts25LogoSrc) : Promise.resolve(null)
  ]);

  const monthsToExport = typeof monthScope === 'number' && monthScope >= 0 && monthScope <= 11
    ? [monthScope]
    : Array.from({ length: 12 }, (_, i) => i);

  monthsToExport.forEach((monthIdx, pageIndex) => {
    if (pageIndex > 0) {
      doc.addPage();
    }

    const monthDates = allDates.filter(d => parseInt(d.slice(5, 7), 10) === monthIdx + 1);

    // Kira rowspan minggu
    const weekRowSpanMap: Record<string, number> = {};
    let i = 0;
    while (i < monthDates.length) {
      const wKey = weekKeyFn(monthDates[i]);
      let j = i;
      while (j < monthDates.length && weekKeyFn(monthDates[j]) === wKey) {
        j++;
      }
      weekRowSpanMap[monthDates[i]] = j - i;
      i = j;
    }

    // =========================================================================
    // 1. KEPALA SURAT RASMI (HANYA BERMULA DARI KEMENTERIAN PENDIDIKAN MALAYSIA)
    // =========================================================================
    doc.setTextColor(0, 0, 0);

    // Lukis Logo Sekolah di Kiri jika ada
    if (schoolLogoPng) {
      try {
        doc.addImage(schoolLogoPng, 'PNG', 12, 7, 15, 15);
      } catch {
        // Abaikan jika tidak disokong
      }
    }

    // Lukis Logo TS25 di Kanan jika diaktifkan
    if (ts25LogoPng && settings.paparLogoTs25 !== false) {
      try {
        doc.addImage(ts25LogoPng, 'PNG', 183, 7, 15, 15);
      } catch {
        // Abaikan jika tidak disokong
      }
    }

    // Teks Utama: KEMENTERIAN PENDIDIKAN MALAYSIA
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.text('KEMENTERIAN PENDIDIKAN MALAYSIA', 105, 12, { align: 'center' });

    // Tajuk Takwim
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(`TAKWIM PENGURUSAN DAN PERSEKOLAHAN TAHUN ${settings.tahun}`, 105, 17, { align: 'center' });

    // Nama Sekolah, Kod & Kumpulan
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const sekolahLine = `${(settings.sekolah || 'SEKOLAH KEBANGSAAN').toUpperCase()}${
      settings.kodSekolah ? ` (${settings.kodSekolah})` : ''
    } · KUMPULAN ${settings.kumpulan}`;
    doc.text(sekolahLine, 105, 21.5, { align: 'center' });

    // Garisan pemisah rasmi di bawah kepala surat
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.line(10, 24, 200, 24);
    doc.setLineWidth(0.15);
    doc.line(10, 24.7, 200, 24.7);

    // Jalur Bulan (Header Box)
    doc.setFillColor(235, 240, 245);
    doc.rect(10, 26, 190, 5.8, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(`BULAN ${MONTH_NAMES[monthIdx].toUpperCase()} ${settings.tahun}`, 105, 30.1, { align: 'center' });

    // =========================================================================
    // 2. JADUAL TAKWIM KPM DENGAN SEMUA DATA DI TENGAH (CENTER)
    // =========================================================================
    const tableBody: any[] = [];

    monthDates.forEach(dateStr => {
      const r = rows[dateStr] || { d: dateStr, j: '', l: '', p: '', k: '', h: '', o: '' };
      const isW = isWeekendFn(dateStr);
      const isCuti = Boolean(r.j || isW);
      const dow = getDayOfWeek(dateStr);
      const dayNum = parseInt(dateStr.slice(8), 10);
      const wKey = weekKeyFn(dateStr);
      const wNum = weeksMap[wKey];
      const isWeekStart = dateStr in weekRowSpanMap;
      const rowSpan = weekRowSpanMap[dateStr] || 1;

      const holidayLabel = r.j ? (r.l || JENIS_CUTI[r.j]) : 'Cuti Hujung Minggu';
      const holidayPrefix = r.j === 'UMUM'
        ? '[CUTI UMUM RASMI] '
        : r.j === 'PENGGAL'
        ? '[CUTI PENGGAL KPM] '
        : r.j === 'LAIN'
        ? '[CUTI TAMBAHAN KPM] '
        : '[HUJUNG MINGGU] ';

      const progs = [r.p, r.k, r.h, r.o].filter(Boolean).join(' | ');

      const rowCells: any[] = [];

      // MINGGU
      if (isWeekStart) {
        rowCells.push({
          content: wNum ? `M${wNum}` : '-',
          rowSpan: rowSpan,
          styles: {
            halign: 'center',
            valign: 'middle',
            fontStyle: 'bold',
            fillColor: [241, 245, 249]
          }
        });
      }

      // TARIKH
      rowCells.push({
        content: `${dayNum} ${MONTH_SHORT[monthIdx]}`,
        styles: {
          halign: 'center',
          valign: 'middle',
          fontStyle: 'bold'
        }
      });

      // HARI
      rowCells.push({
        content: DAY_NAMES[dow],
        styles: {
          halign: 'center',
          valign: 'middle'
        }
      });

      // KANDUNGAN PROGRAM / CUTI
      if (isCuti) {
        let cutiText = `${holidayPrefix}${holidayLabel}`;
        if (progs) {
          cutiText += `\n[Program: ${progs}]`;
        }
        rowCells.push({
          content: cutiText,
          colSpan: 4,
          styles: {
            halign: 'center',
            valign: 'middle',
            fontStyle: 'bold',
            fillColor: [248, 250, 252],
            textColor: r.j === 'UMUM' ? [180, 20, 20] : [20, 40, 80]
          }
        });
      } else {
        // HARI PERSEKOLAHAN BIASA (4 Lajur: PK1, Kurikulum, HEM, Koko)
        // Semua teks berada di tengah (halign: 'center') seperti kehendak guru
        rowCells.push({
          content: r.p || '-',
          styles: { halign: 'center', valign: 'middle' }
        });
        rowCells.push({
          content: r.k || '-',
          styles: { halign: 'center', valign: 'middle' }
        });
        rowCells.push({
          content: r.h || '-',
          styles: { halign: 'center', valign: 'middle' }
        });
        rowCells.push({
          content: r.o || '-',
          styles: { halign: 'center', valign: 'middle' }
        });
      }

      tableBody.push(rowCells);
    });

    autoTable(doc, {
      startY: 33,
      theme: 'grid',
      tableWidth: 190,
      margin: { left: 10, right: 10 },
      head: [
        [
          { content: 'MINGGU', styles: { halign: 'center', valign: 'middle' } },
          { content: 'TARIKH', styles: { halign: 'center', valign: 'middle' } },
          { content: 'HARI', styles: { halign: 'center', valign: 'middle' } },
          { content: 'PENTADBIRAN (PK1)', styles: { halign: 'center', valign: 'middle' } },
          { content: 'KURIKULUM', styles: { halign: 'center', valign: 'middle' } },
          { content: 'HAL EHWAL MURID', styles: { halign: 'center', valign: 'middle' } },
          { content: 'KOKURIKULUM', styles: { halign: 'center', valign: 'middle' } }
        ]
      ],
      body: tableBody,
      styles: {
        fontSize: 6.8,
        cellPadding: 0.85,
        halign: 'center',
        valign: 'middle',
        lineColor: [40, 40, 40],
        lineWidth: 0.18,
        textColor: [0, 0, 0],
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [226, 232, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 7.2,
        halign: 'center',
        valign: 'middle',
        lineColor: [0, 0, 0],
        lineWidth: 0.25
      },
      columnStyles: {
        0: { cellWidth: 14, halign: 'center' }, // MINGGU
        1: { cellWidth: 16, halign: 'center' }, // TARIKH
        2: { cellWidth: 16, halign: 'center' }, // HARI
        3: { cellWidth: 36, halign: 'center' }, // PK1
        4: { cellWidth: 36, halign: 'center' }, // KURIKULUM
        5: { cellWidth: 36, halign: 'center' }, // HEM
        6: { cellWidth: 36, halign: 'center' }  // KOKO
      },
      didDrawPage: () => {
        // Nombor muka surat di bucu bawah
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Muka surat ${pageIndex + 1} daripada ${monthsToExport.length} · Takwim KPM ${settings.tahun}`,
          105,
          292,
          { align: 'center' }
        );
      }
    });

  });

  return doc;
}

/**
 * Muat turun terus fail PDF ke peranti pengguna (.pdf)
 */
export async function downloadTakwimPdf(options: ExportPdfOptions): Promise<string> {
  const doc = await generateTakwimPdf(options);
  const scopeLabel = typeof options.monthScope === 'number'
    ? `_${MONTH_NAMES[options.monthScope]}`
    : '_12Bulan';
  const cleanSchool = (options.settings.sekolah || 'KPM').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Takwim_KPM_${options.settings.tahun}${scopeLabel}_${cleanSchool}.pdf`;
  doc.save(filename);
  return filename;
}

/**
 * Buka atau cetak dokumen PDF rasmi terus
 */
export async function printTakwimPdf(options: ExportPdfOptions): Promise<void> {
  const doc = await generateTakwimPdf(options);
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);

  // Buat iframe tersembunyi untuk mencetak fail PDF secara langsung
  let iframe = document.getElementById('pdf-print-iframe') as HTMLIFrameElement | null;
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'pdf-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
  }

  iframe.src = blobUrl;
  iframe.onload = () => {
    try {
      iframe?.contentWindow?.focus();
      iframe?.contentWindow?.print();
    } catch {
      // Jika disekat iframe, gunakan window.print() atau buka URL
      window.print();
    }
  };
}

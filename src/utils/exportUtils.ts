import * as XLSX from 'xlsx';
import { DAY_NAMES, getDayOfWeek, JENIS_CUTI, MONTH_NAMES, MONTH_SHORT } from '../data/kpmCalendar';
import { SchoolSettings, TakwimRow } from '../types/takwim';

export function exportToCSV(
  rows: Record<string, TakwimRow>,
  allDates: string[],
  weeksMap: Record<string, number>,
  weekKeyFn: (d: string) => string,
  settings: SchoolSettings
): void {
  const headers = [
    'Minggu Persekolahan',
    'Tarikh',
    'Hari',
    'Jenis Hari',
    'Catatan Cuti',
    'Pentadbiran (PK1)',
    'Kurikulum',
    'Hal Ehwal Murid (HEM)',
    'Kokurikulum'
  ];

  const escapeCsv = (val: any) => {
    const s = String(val == null ? '' : val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const lines: string[] = [headers.map(escapeCsv).join(',')];

  allDates.forEach(d => {
    const r = rows[d];
    if (!r) return;
    const wKey = weekKeyFn(d);
    const wNum = weeksMap[wKey] || '';
    const dayName = DAY_NAMES[getDayOfWeek(d)];
    const holidayLabel = r.j ? (r.l || JENIS_CUTI[r.j]) : '';

    lines.push([
      wNum ? `M${wNum}` : '',
      d,
      dayName,
      r.j || 'BIASA',
      holidayLabel,
      r.p.replace(/\n/g, ' | '),
      r.k.replace(/\n/g, ' | '),
      r.h.replace(/\n/g, ' | '),
      r.o.replace(/\n/g, ' | ')
    ].map(escapeCsv).join(','));
  });

  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `Takwim_Sekolah_${settings.tahun}_${settings.sekolah.replace(/[^a-zA-Z0-9]/g, '_') || 'Rasmi'}.csv`);
}

export function exportToExcel(
  rows: Record<string, TakwimRow>,
  allDates: string[],
  weeksMap: Record<string, number>,
  weekKeyFn: (d: string) => string,
  isWeekendFn: (d: string) => boolean,
  settings: SchoolSettings
): void {
  const aoa: any[][] = [];
  const merges: XLSX.Range[] = [];

  const addBanner = (text: string) => {
    merges.push({ s: { r: aoa.length, c: 0 }, e: { r: aoa.length, c: 6 } });
    aoa.push([text]);
  };

  addBanner(`KEMENTERIAN PENDIDIKAN MALAYSIA`);
  addBanner(`TAKWIM TAHUNAN PERSEKOLAHAN ${settings.tahun}`);
  if (settings.sekolah) {
    addBanner(`${settings.sekolah.toUpperCase()} ${settings.kodSekolah ? `(${settings.kodSekolah})` : ''}`);
  }
  addBanner(`KUMPULAN ${settings.kumpulan} | DISEDIAKAN: ${settings.gpkPentadbiran || 'GPK'} | DISAHKAN: ${settings.guruBesar || 'GURU BESAR'}`);

  aoa.push(['MINGGU', 'TARIKH', 'HARI', 'PENTADBIRAN', 'KURIKULUM', 'HAL EHWAL MURID', 'KOKURIKULUM']);

  for (let m = 0; m < 12; m++) {
    addBanner(`BULAN ${MONTH_NAMES[m].toUpperCase()} ${settings.tahun}`);
    const monthDates = allDates.filter(d => parseInt(d.slice(5, 7), 10) === m + 1);

    let prevWKey = '';
    monthDates.forEach(d => {
      const r = rows[d];
      if (!r) return;
      const wKey = weekKeyFn(d);
      const wNum = (wKey !== prevWKey && weeksMap[wKey]) ? `M${weeksMap[wKey]}` : '';
      prevWKey = wKey;

      const dayNum = parseInt(d.slice(8), 10);
      const tglFormatted = `${dayNum} ${MONTH_SHORT[m]} ${settings.tahun}`;
      const dayName = DAY_NAMES[getDayOfWeek(d)];
      const isW = isWeekendFn(d);
      const isCuti = Boolean(r.j || isW);

      if (isCuti) {
        const cutiLabel = r.j ? (r.l || JENIS_CUTI[r.j]) : 'CUTI HUJUNG MINGGU';
        const holidayProgs = [r.p, r.k, r.h, r.o].filter(Boolean).join(' | ');
        const mainLabel = cutiLabel.toUpperCase();

        const displayTxt = holidayProgs 
          ? `${mainLabel} [PROGRAM: ${holidayProgs}]` 
          : mainLabel;

        merges.push({ s: { r: aoa.length, c: 3 }, e: { r: aoa.length, c: 6 } });
        aoa.push([
          wNum,
          tglFormatted,
          dayName,
          displayTxt,
          '',
          '',
          ''
        ]);
      } else {
        aoa.push([
          wNum,
          tglFormatted,
          dayName,
          r.p.replace(/\n/g, ' | '),
          r.k.replace(/\n/g, ' | '),
          r.h.replace(/\n/g, ' | '),
          r.o.replace(/\n/g, ' | ')
        ]);
      }
    });
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!merges'] = merges;
  ws['!cols'] = [
    { wch: 10 }, // Minggu
    { wch: 14 }, // Tarikh
    { wch: 10 }, // Hari
    { wch: 40 }, // Pentadbiran
    { wch: 40 }, // Kurikulum
    { wch: 40 }, // HEM
    { wch: 40 }  // Koko
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Takwim ${settings.tahun}`);
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadBlob(blob, `Takwim_${settings.tahun}_${settings.sekolah.replace(/[^a-zA-Z0-9]/g, '_') || 'Sekolah'}.xlsx`);
}

/**
 * Jana fail iCalendar (.ics) untuk Google Calendar guru
 */
export function exportToICal(
  rows: Record<string, TakwimRow>,
  allDates: string[],
  settings: SchoolSettings
): void {
  const events: string[] = [];

  allDates.forEach(d => {
    const r = rows[d];
    if (!r) return;

    const units: [string, string][] = [
      ['[PENTADBIRAN]', r.p],
      ['[KURIKULUM]', r.k],
      ['[HEM]', r.h],
      ['[KOKURIKULUM]', r.o]
    ];

    units.forEach(([tag, text]) => {
      if (!text || !text.trim()) return;
      const programs = text.split('\n').filter(Boolean);
      programs.forEach(prog => {
        const cleanDate = d.replace(/-/g, '');
        events.push([
          'BEGIN:VEVENT',
          `UID:${d}-${Math.random().toString(36).substring(2, 9)}@etakwim.moe`,
          `DTSTAMP:${cleanDate}T000000Z`,
          `DTSTART;VALUE=DATE:${cleanDate}`,
          `SUMMARY:${tag} ${prog.trim()}`,
          `DESCRIPTION:Takwim Sekolah ${settings.sekolah || ''} - Unit: ${tag}`,
          'END:VEVENT'
        ].join('\r\n'));
      });
    });

    if (r.j && r.l) {
      const cleanDate = d.replace(/-/g, '');
      events.push([
        'BEGIN:VEVENT',
        `UID:${d}-cuti-${Math.random().toString(36).substring(2, 9)}@etakwim.moe`,
        `DTSTAMP:${cleanDate}T000000Z`,
        `DTSTART;VALUE=DATE:${cleanDate}`,
        `SUMMARY:[CUTI] ${r.l}`,
        `DESCRIPTION:${JENIS_CUTI[r.j]}`,
        'END:VEVENT'
      ].join('\r\n'));
    }
  });

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//KPM//e-Takwim Sekolah Malaysia//MS',
    `X-WR-CALNAME:Takwim ${settings.sekolah || 'Sekolah'} ${settings.tahun}`,
    events.join('\r\n'),
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
  downloadBlob(blob, `Kalendar_Takwim_${settings.tahun}.ics`);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 1000);
}

/**
 * Eksport sandaran penuh Takwim (Data + Tetapan) ke fail JSON
 */
export function exportBackupJSON(
  rows: Record<string, TakwimRow>,
  settings: SchoolSettings
): void {
  const backupData = {
    app: 'e-Takwim Sekolah KPM',
    version: '3.0',
    exportDate: new Date().toISOString(),
    settings,
    rows
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const safeSchoolName = (settings.sekolah || 'Sekolah').replace(/[^a-zA-Z0-9]/g, '_');
  downloadBlob(blob, `Sandaran_Takwim_${safeSchoolName}_${settings.tahun}.json`);
}

/**
 * Baca dan sahkan fail sandaran JSON
 */
export async function readBackupJSON(file: File): Promise<{
  ok: boolean;
  settings?: SchoolSettings;
  rows?: Record<string, TakwimRow>;
  error?: string;
}> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data || (!data.rows && !data.settings)) {
      return { ok: false, error: 'Format fail tidak sah. Sila pilih fail .json sandaran e-Takwim.' };
    }
    return {
      ok: true,
      settings: data.settings,
      rows: data.rows
    };
  } catch (err: any) {
    return { ok: false, error: 'Ralat membaca fail: ' + (err.message || 'Fail rosak') };
  }
}

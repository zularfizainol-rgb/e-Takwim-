import React, { useMemo } from 'react';
import { DAY_NAMES, getDayOfWeek, JENIS_CUTI, MONTH_NAMES } from '../data/kpmCalendar';
import { SchoolSettings, TakwimRow } from '../types/takwim';
import { SchoolLogoDisplay } from '../data/defaultLogos';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { downloadTakwimPdf } from '../utils/exportPdf';

interface PrintTakwimViewProps {
  allDates: string[];
  rows: Record<string, TakwimRow>;
  weeksMap: Record<string, number>;
  weekKeyFn: (d: string) => string;
  isWeekendFn: (d: string) => boolean;
  settings: SchoolSettings;
  printMonth?: number | 'all';
  isPreview?: boolean;
  onClosePreview?: () => void;
}

export const PrintTakwimView: React.FC<PrintTakwimViewProps> = ({
  allDates,
  rows,
  weeksMap,
  weekKeyFn,
  isWeekendFn,
  settings,
  printMonth = 'all',
  isPreview = false,
  onClosePreview
}) => {
  // Tentukan senarai indeks bulan yang ingin dicetak (0..11)
  const monthsToPrint = useMemo(() => {
    if (typeof printMonth === 'number' && printMonth >= 0 && printMonth <= 11) {
      return [printMonth];
    }
    return Array.from({ length: 12 }, (_, i) => i);
  }, [printMonth]);

  const handleDownloadDirectPdf = () => {
    downloadTakwimPdf({
      rows,
      allDates,
      weeksMap,
      weekKeyFn,
      isWeekendFn,
      settings,
      monthScope: printMonth
    });
  };

  const handleDirectPrint = () => {
    window.print();
  };

  return (
    <div 
      id="print-area" 
      className={
        isPreview 
          ? "block text-black bg-slate-100 min-h-screen pb-12" 
          : "hidden print:block text-black bg-white w-full"
      }
    >
      {/* Bar Atas Pratonton (Hanya dipaparkan di skrin ketika Pratonton, disembunyikan ketika cetak) */}
      {isPreview && (
        <div className="sticky top-0 z-50 bg-teal-900 text-white px-4 py-3 shadow-md flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            {onClosePreview && (
              <button
                onClick={onClosePreview}
                className="px-3 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Jadual Skrin</span>
              </button>
            )}
            <div>
              <h2 className="text-sm font-bold leading-tight">Pratonton Rasmi Dokumen Takwim KPM</h2>
              <p className="text-[11px] text-teal-200">
                Format Surat Siaran KPM (A4 Portrait) · {monthsToPrint.length === 1 ? `Bulan ${MONTH_NAMES[monthsToPrint[0]]}` : '12 Bulan Sepanjang Tahun'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDirectPrint}
              className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 border border-white/20 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak (Print)</span>
            </button>
            <button
              onClick={handleDownloadDirectPdf}
              className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Muat Turun Fail PDF (.pdf)</span>
            </button>
          </div>
        </div>
      )}

      <div className={isPreview ? "max-w-4xl mx-auto p-4 sm:p-6 space-y-8" : "w-full"}>
        {monthsToPrint.map(monthIndex => {
          const monthDates = allDates.filter(d => parseInt(d.slice(5, 7), 10) === monthIndex + 1);

          // Kira rowspan minggu untuk bulan ini
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

          return (
            <div 
              key={monthIndex} 
              className={`print-page page-break-after-always text-[8.5pt] leading-tight ${
                isPreview 
                  ? "bg-white shadow-xl rounded-lg p-6 sm:p-8 border border-slate-300" 
                  : "px-4 py-3 mb-6 print:mb-0 print:py-1"
              }`}
            >
              {/* KEPALA SURAT RASMI: HANYA BERMULA DARI KEMENTERIAN PENDIDIKAN MALAYSIA */}
              <div className="flex items-center justify-between gap-3 mb-2 border-b-2 border-black pb-2">
                {/* Logo Sekolah di Kiri */}
                <div className="w-14 h-14 flex items-center justify-center shrink-0">
                  <SchoolLogoDisplay
                    src={settings.logoSekolah}
                    alt="Logo Sekolah"
                    className="max-h-14 max-w-14 object-contain"
                    fallbackType="school"
                  />
                </div>

                {/* Teks Rasmi di Tengah: HANYA BERMULA DARI KEMENTERIAN PENDIDIKAN MALAYSIA */}
                <div className="text-center flex-1">
                  <h1 className="text-[13pt] font-extrabold uppercase tracking-wide text-black leading-none">
                    KEMENTERIAN PENDIDIKAN MALAYSIA
                  </h1>
                  <h2 className="text-[10pt] font-bold uppercase mt-1 text-black leading-tight">
                    TAKWIM PENGURUSAN DAN PERSEKOLAHAN TAHUN {settings.tahun}
                  </h2>
                  <p className="text-[8.5pt] font-semibold mt-0.5 text-black">
                    {settings.sekolah ? settings.sekolah.toUpperCase() : 'SEKOLAH KEBANGSAAN'} 
                    {settings.kodSekolah ? ` (${settings.kodSekolah})` : ''} 
                    {' · KUMPULAN ' + settings.kumpulan}
                  </p>
                </div>

                {/* Logo TS25 di Kanan (jika diaktifkan) */}
                <div className="w-14 h-14 flex items-center justify-center shrink-0">
                  {settings.paparLogoTs25 !== false ? (
                    <SchoolLogoDisplay
                      src={settings.logoTs25}
                      alt="Logo TS25"
                      className="max-h-14 max-w-14 object-contain"
                      fallbackType="ts25"
                    />
                  ) : (
                    <div className="w-14 h-14" />
                  )}
                </div>
              </div>

              {/* Tajuk Bulan */}
              <div className="bg-slate-200 py-1 px-3 text-center font-bold text-[9pt] border border-black mb-1 uppercase tracking-wide text-black">
                BULAN {MONTH_NAMES[monthIndex]} {settings.tahun}
              </div>

              {/* Jadual Takwim Rasmi */}
              <table className="w-full border-collapse border border-black text-[7.5pt] table-fixed">
                <thead>
                  <tr className="bg-slate-100 border-b border-black font-bold text-center">
                    <th className="border border-black p-0.5 w-10 text-center">MINGGU</th>
                    <th className="border border-black p-0.5 w-16 text-center">TARIKH</th>
                    <th className="border border-black p-0.5 w-14 text-center">HARI</th>
                    <th className="border border-black p-0.5 text-center">PENTADBIRAN (PK1)</th>
                    <th className="border border-black p-0.5 text-center">KURIKULUM</th>
                    <th className="border border-black p-0.5 text-center">HAL EHWAL MURID</th>
                    <th className="border border-black p-0.5 text-center">KOKURIKULUM</th>
                  </tr>
                </thead>
                <tbody>
                  {monthDates.map(dateStr => {
                    const r = rows[dateStr] || { d: dateStr, j: '', l: '', p: '', k: '', h: '', o: '' };
                    const isW = isWeekendFn(dateStr);
                    const isCuti = Boolean(r.j || isW);
                    const dow = getDayOfWeek(dateStr);
                    const dayNum = parseInt(dateStr.slice(8), 10);
                    const wKey = weekKeyFn(dateStr);
                    const wNum = weeksMap[wKey];
                    const isWeekStart = dateStr in weekRowSpanMap;
                    const rowSpan = weekRowSpanMap[dateStr];

                    const holidayLabel = r.j ? (r.l || JENIS_CUTI[r.j]) : 'Cuti Hujung Minggu';
                    const holidayProgs = [r.p, r.k, r.h, r.o].filter(Boolean).join(' | ');

                    return (
                      <tr key={dateStr} className={`border-b border-black ${isCuti ? 'bg-slate-50' : ''}`}>
                        {isWeekStart && (
                          <td
                            rowSpan={rowSpan}
                            className="border border-black text-center align-middle font-bold bg-slate-100 p-0.5"
                          >
                            {wNum ? `M${wNum}` : '-'}
                          </td>
                        )}

                        <td className="border border-black p-0.5 font-semibold text-center align-middle">
                          {dayNum} {MONTH_NAMES[monthIndex].slice(0, 3)}
                        </td>

                        <td className="border border-black p-0.5 text-center font-medium align-middle">
                          {DAY_NAMES[dow]}
                        </td>

                        {isCuti ? (
                          <td colSpan={4} className="border border-black p-1 text-center align-middle font-bold">
                            <div className="uppercase text-center">
                              {r.j === 'UMUM' ? '[CUTI UMUM RASMI] ' : r.j === 'PENGGAL' ? '[CUTI PENGGAL KPM] ' : r.j === 'LAIN' ? '[CUTI TAMBAHAN KPM] ' : '[HUJUNG MINGGU] '}
                              {holidayLabel}
                            </div>
                            {holidayProgs && (
                              <span className="block font-semibold text-[7pt] mt-0.5 text-slate-800 text-center">
                                [Program Bertindih: {holidayProgs}]
                              </span>
                            )}
                          </td>
                        ) : (
                          <>
                            <td className="border border-black p-0.5 align-middle text-center whitespace-pre-line">
                              {r.p || '-'}
                            </td>
                            <td className="border border-black p-0.5 align-middle text-center whitespace-pre-line">
                              {r.k || '-'}
                            </td>
                            <td className="border border-black p-0.5 align-middle text-center whitespace-pre-line">
                              {r.h || '-'}
                            </td>
                            <td className="border border-black p-0.5 align-middle text-center whitespace-pre-line">
                              {r.o || '-'}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

            </div>
          );
        })}
      </div>
    </div>
  );
};

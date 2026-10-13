import React from 'react';
import { DAY_NAMES, getDayOfWeek, JENIS_CUTI, MONTH_NAMES } from '../data/kpmCalendar';
import { SchoolSettings, TakwimRow } from '../types/takwim';
import { SchoolLogoDisplay } from '../data/defaultLogos';

interface PrintTakwimViewProps {
  allDates: string[];
  rows: Record<string, TakwimRow>;
  weeksMap: Record<string, number>;
  weekKeyFn: (d: string) => string;
  isWeekendFn: (d: string) => boolean;
  settings: SchoolSettings;
}

export const PrintTakwimView: React.FC<PrintTakwimViewProps> = ({
  allDates,
  rows,
  weeksMap,
  weekKeyFn,
  isWeekendFn,
  settings
}) => {
  return (
    <div id="print-area" className="hidden print:block text-black bg-white">
      {Array.from({ length: 12 }).map((_, monthIndex) => {
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
          <div key={monthIndex} className="print-page page-break-after-always p-6 mb-8 text-[9pt] leading-tight">
            {/* Kepala Surat Takwim Rasmi dengan Logo Sekolah & Logo TS25 */}
            <div className="flex items-center justify-between gap-4 mb-3 border-b-2 border-black pb-2.5">
              {/* Logo Sekolah di Kiri */}
              <div className="w-16 h-16 flex items-center justify-center shrink-0">
                <SchoolLogoDisplay
                  src={settings.logoSekolah}
                  alt="Logo Sekolah"
                  className="max-h-16 max-w-16 object-contain"
                  fallbackType="school"
                />
              </div>

              {/* Teks Rasmi di Tengah */}
              <div className="text-center flex-1">
                <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wider">
                  KEMENTERIAN PENDIDIKAN MALAYSIA
                </h2>
                <h3 className="text-xs sm:text-sm font-bold uppercase mt-0.5">
                  TAKWIM PENGURUSAN DAN PERSEKOLAHAN TAHUN {settings.tahun}
                </h3>
                <p className="text-xs font-semibold mt-0.5">
                  {settings.sekolah ? settings.sekolah.toUpperCase() : 'SEKOLAH'} 
                  {settings.kodSekolah ? ` (${settings.kodSekolah})` : ''} 
                  {' · KUMPULAN ' + settings.kumpulan}
                </p>
              </div>

              {/* Logo TS25 di Kanan (jika diaktifkan) */}
              <div className="w-16 h-16 flex items-center justify-center shrink-0">
                {settings.paparLogoTs25 !== false ? (
                  <SchoolLogoDisplay
                    src={settings.logoTs25}
                    alt="Logo TS25"
                    className="max-h-16 max-w-16 object-contain"
                    fallbackType="ts25"
                  />
                ) : (
                  <div className="w-16 h-16" />
                )}
              </div>
            </div>

            {/* Tajuk Bulan */}
            <div className="bg-slate-200 py-1 px-3 text-center font-bold text-xs border border-black mb-1 uppercase tracking-wide">
              BULAN {MONTH_NAMES[monthIndex]} {settings.tahun}
            </div>

            {/* Jadual Takwim */}
            <table className="w-full border-collapse border border-black text-[8pt] table-fixed">
              <thead>
                <tr className="bg-slate-100 border-b border-black font-bold text-center">
                  <th className="border border-black p-1 w-12">MINGGU</th>
                  <th className="border border-black p-1 w-20">TARIKH</th>
                  <th className="border border-black p-1 w-16">HARI</th>
                  <th className="border border-black p-1">PENTADBIRAN (PK1)</th>
                  <th className="border border-black p-1">KURIKULUM</th>
                  <th className="border border-black p-1">HAL EHWAL MURID</th>
                  <th className="border border-black p-1">KOKURIKULUM</th>
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

                  const isUmum = r.j === 'UMUM';
                  const dateIdx = monthDates.indexOf(dateStr);
                  let isRepeatingHoliday = false;
                  if (isCuti && !isUmum && dateIdx > 0) {
                    const prevDate = monthDates[dateIdx - 1];
                    const prevRow = rows[prevDate];
                    const prevIsW = isWeekendFn(prevDate);
                    const prevIsCuti = Boolean(prevRow?.j || prevIsW);
                    if (prevIsCuti) {
                      if (r.j && prevRow?.j === r.j) {
                        const prevLabel = (prevRow.l || JENIS_CUTI[prevRow.j] || '').trim();
                        const curLabel = (r.l || JENIS_CUTI[r.j] || '').trim();
                        if (prevLabel === curLabel || (!r.l && !prevRow.l)) {
                          isRepeatingHoliday = true;
                        }
                      } else if (!r.j && isW && !prevRow?.j && prevIsW) {
                        isRepeatingHoliday = true;
                      }
                    }
                  }

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

                      <td className="border border-black p-1 font-semibold text-center">
                        {dayNum} {MONTH_NAMES[monthIndex].slice(0, 3)}
                      </td>

                      <td className="border border-black p-1 text-center font-medium">
                        {DAY_NAMES[dow]}
                      </td>

                      {isCuti ? (
                        <td colSpan={4} className="border border-black p-1.5 text-center align-middle font-bold">
                          <div className="uppercase text-center">
                            {r.j === 'UMUM' ? '[CUTI UMUM RASMI] ' : r.j === 'PENGGAL' ? '[CUTI PENGGAL KPM] ' : r.j === 'LAIN' ? '[CUTI TAMBAHAN KPM] ' : '[HUJUNG MINGGU] '}
                            {holidayLabel}
                          </div>
                          {holidayProgs && (
                            <span className="block font-semibold text-[7.5pt] mt-0.5 text-slate-800 text-center">
                              [Program Bertindih: {holidayProgs}]
                            </span>
                          )}
                        </td>
                      ) : (
                        <>
                          <td className="border border-black p-1 align-middle text-center whitespace-pre-line">
                            {r.p || '-'}
                          </td>
                          <td className="border border-black p-1 align-middle text-center whitespace-pre-line">
                            {r.k || '-'}
                          </td>
                          <td className="border border-black p-1 align-middle text-center whitespace-pre-line">
                            {r.h || '-'}
                          </td>
                          <td className="border border-black p-1 align-middle text-center whitespace-pre-line">
                            {r.o || '-'}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Ruangan Pengesahan Rasmi Pentadbiran */}
            <div className="mt-4 pt-2 border-t border-slate-400 flex justify-between text-[8.5pt]">
              <div className="w-5/12">
                <p>Disediakan oleh:</p>
                <div className="mt-8 border-b border-black w-48"></div>
                <p className="font-bold mt-1 uppercase">{settings.gpkPentadbiran || 'GURU PENOLONG KANAN PENTADBIRAN'}</p>
                <p className="text-[7.5pt] text-slate-600">GPK Pentadbiran / Kurikulum</p>
              </div>

              <div className="w-5/12 text-right">
                <p>Disahkan oleh:</p>
                <div className="mt-8 border-b border-black w-48 ml-auto"></div>
                <p className="font-bold mt-1 uppercase">{settings.guruBesar || 'GURU BESAR / PENGETUA'}</p>
                <p className="text-[7.5pt] text-slate-600">{settings.sekolah || 'Sekolah Kebangsaan'}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

import React from 'react';
import { DAY_NAMES, getDayOfWeek, JENIS_CUTI, MONTH_NAMES } from '../data/kpmCalendar';
import { SchoolGroup, TakwimRow, UserRole } from '../types/takwim';
import { Calendar, Edit3, Sparkles } from 'lucide-react';

interface TakwimTableProps {
  datesToRender: string[];
  rows: Record<string, TakwimRow>;
  weeksMap: Record<string, number>;
  weekKeyFn: (dateStr: string) => string;
  isWeekendFn: (dateStr: string) => boolean;
  schoolGroup: SchoolGroup;
  currentRole: UserRole;
  selectedUnit: 'all' | 'p' | 'k' | 'h' | 'o';
  searchQuery: string;
  onCellChange: (dateStr: string, colKey: 'p' | 'k' | 'h' | 'o', value: string) => void;
  onOpenDayModal: (dateStr: string) => void;
}

export const TakwimTable: React.FC<TakwimTableProps> = ({
  datesToRender,
  rows,
  weeksMap,
  weekKeyFn,
  isWeekendFn,
  schoolGroup,
  currentRole,
  selectedUnit,
  searchQuery,
  onCellChange,
  onOpenDayModal
}) => {
  const isViewOnly = currentRole === 'GURU';

  // Tentukan kebenaran menyunting mengikut peranan
  const canEditCol = (colKey: 'p' | 'k' | 'h' | 'o') => {
    if (isViewOnly) return false;
    if (currentRole === 'PENTADBIR') return true;
    if (currentRole === 'GPK_PENTADBIRAN') return true; // GPK 1 menyelaras semua
    if (currentRole === 'GPK_KURIKULUM' && colKey === 'k') return true;
    if (currentRole === 'GPK_HEM' && colKey === 'h') return true;
    if (currentRole === 'GPK_KOKO' && colKey === 'o') return true;
    return true;
  };

  // Kira rowspan untuk minggu persekolahan
  const weekRowSpanMap: Record<string, number> = {};
  let i = 0;
  while (i < datesToRender.length) {
    const wKey = weekKeyFn(datesToRender[i]);
    let j = i;
    while (j < datesToRender.length && weekKeyFn(datesToRender[j]) === wKey) {
      j++;
    }
    weekRowSpanMap[datesToRender[i]] = j - i;
    i = j;
  }

  const highlightMatches = (text: string, query: string) => {
    if (!query.trim() || !text) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-amber-300 text-amber-950 px-1 py-0.5 rounded font-bold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="bg-white border border-slate-300 rounded-lg shadow-sm overflow-x-auto">
      <table className="w-full border-collapse table-fixed min-w-[980px] text-center text-xs">
        {/* Header Jadual Takwim Rasmi KPM: Berada di Tengah (Center) */}
        <thead>
          <tr className="bg-[#0b6b5c] text-white font-bold divide-x divide-teal-800 shadow-xs">
            <th className="w-16 py-3.5 px-2 text-center text-[11px] uppercase tracking-wider sticky top-0 z-20 bg-[#0b6b5c]">
              Minggu
            </th>
            <th className="w-28 py-3.5 px-3 text-center text-[11px] uppercase tracking-wider sticky top-0 z-20 bg-[#0b6b5c]">
              Tarikh & Hari
            </th>
            {(selectedUnit === 'all' || selectedUnit === 'p') && (
              <th className="py-3.5 px-3 text-center text-[11px] uppercase tracking-wider sticky top-0 z-20 bg-[#0b6b5c]">
                <span>Pentadbiran & Pengurusan (PK1)</span>
              </th>
            )}
            {(selectedUnit === 'all' || selectedUnit === 'k') && (
              <th className="py-3.5 px-3 text-center text-[11px] uppercase tracking-wider sticky top-0 z-20 bg-[#0b6b5c]">
                <span>Kurikulum</span>
              </th>
            )}
            {(selectedUnit === 'all' || selectedUnit === 'h') && (
              <th className="py-3.5 px-3 text-center text-[11px] uppercase tracking-wider sticky top-0 z-20 bg-[#0b6b5c]">
                <span>Hal Ehwal Murid (HEM)</span>
              </th>
            )}
            {(selectedUnit === 'all' || selectedUnit === 'o') && (
              <th className="py-3.5 px-3 text-center text-[11px] uppercase tracking-wider sticky top-0 z-20 bg-[#0b6b5c]">
                <span>Kokurikulum</span>
              </th>
            )}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-200 text-slate-800">
          {datesToRender.map((dateStr, index) => {
            const row = rows[dateStr] || { d: dateStr, j: '', l: '', p: '', k: '', h: '', o: '' };
            const isW = isWeekendFn(dateStr);
            const holidayType = row.j;
            const isCuti = Boolean(holidayType || isW);
            const dayOfWeek = getDayOfWeek(dateStr);
            const dayName = DAY_NAMES[dayOfWeek];
            const dayNum = parseInt(dateStr.slice(8), 10);
            const monthNum = parseInt(dateStr.slice(5, 7), 10);
            const wKey = weekKeyFn(dateStr);
            const weekNum = weeksMap[wKey];
            const isWeekStart = dateStr in weekRowSpanMap;
            const weekRowSpan = weekRowSpanMap[dateStr];

            // Garisan pemisah minggu (Isnin untuk Kumpulan B, Ahad untuk Kumpulan A)
            const isNewWeekBoundary = schoolGroup === 'A' ? dayOfWeek === 0 : dayOfWeek === 1;

            // Kelas warna TERANG untuk jenis cuti
            const getHolidayRowClass = () => {
              if (holidayType === 'UMUM') {
                return 'bg-red-50 hover:bg-red-100/90 text-red-950 border-l-[6px] border-l-red-600 transition-colors';
              }
              if (holidayType === 'PENGGAL') {
                return 'bg-amber-100 hover:bg-amber-200/90 text-amber-950 border-l-[6px] border-l-amber-500 transition-colors';
              }
              if (holidayType === 'LAIN') {
                return 'bg-indigo-50 hover:bg-indigo-100/90 text-indigo-950 border-l-[6px] border-l-indigo-600 transition-colors';
              }
              if (isW) {
                return 'bg-slate-100/90 hover:bg-slate-200/80 text-slate-800 border-l-[6px] border-l-slate-400 transition-colors';
              }
              return 'bg-white hover:bg-slate-50/80';
            };

            const getDateCellColor = () => {
              if (holidayType === 'UMUM') return 'bg-red-100/80 text-red-900 border-r border-red-200';
              if (holidayType === 'PENGGAL') return 'bg-amber-200/80 text-amber-950 border-r border-amber-300';
              if (holidayType === 'LAIN') return 'bg-indigo-100/80 text-indigo-950 border-r border-indigo-200';
              if (isW) return 'bg-slate-200/70 text-slate-800 border-r border-slate-300';
              return 'bg-slate-50/70 text-slate-800 border-r border-slate-200';
            };

            const getDateNumberColor = () => {
              if (holidayType === 'UMUM') return 'text-red-700 font-extrabold';
              if (holidayType === 'PENGGAL') return 'text-amber-900 font-extrabold';
              if (holidayType === 'LAIN') return 'text-indigo-800 font-extrabold';
              if (isW) return 'text-slate-700 font-bold';
              return 'text-slate-900 font-bold';
            };

            const holidayLabel = row.j ? (row.l || JENIS_CUTI[row.j]) : 'Cuti Hujung Minggu';
            const isUmum = holidayType === 'UMUM';

            // Semak program bertindih jika ada (cth: Kem / Kursus / Gotong-Royong pada hari cuti)
            const holidayPrograms = [row.p, row.k, row.h, row.o].filter(Boolean).join(' | ');

            return (
              <tr 
                key={dateStr} 
                className={`transition-colors ${isNewWeekBoundary && index !== 0 ? 'border-t-2 border-slate-400' : ''} ${getHolidayRowClass()}`}
              >
                {/* Sel Minggu Persekolahan (RowSpan): Di Tengah */}
                {isWeekStart && (
                  <td 
                    rowSpan={weekRowSpan}
                    className="border-r border-slate-300 bg-[#e8f3f0] text-center align-middle font-bold text-[#084f44] text-sm tabular-nums p-1 select-none"
                    title={weekNum ? `Minggu Persekolahan ${weekNum}` : 'Cuti Persekolahan'}
                  >
                    {weekNum ? (
                      <div className="flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] text-teal-800 uppercase tracking-tighter font-semibold">Minggu</span>
                        <span className="text-base font-extrabold text-[#084f44]">M{weekNum}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-bold bg-slate-200/60 px-1 py-0.5 rounded">
                        CUTI
                      </span>
                    )}
                  </td>
                )}

                {/* Sel Tarikh & Hari: Di Tengah */}
                <td 
                  onClick={() => !isViewOnly && onOpenDayModal(dateStr)}
                  className={`py-2 px-2 text-center align-middle select-none ${getDateCellColor()} ${!isViewOnly ? 'cursor-pointer group' : ''}`}
                  title={!isViewOnly ? 'Klik untuk tukar jenis hari / cuti atau edit program' : undefined}
                >
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className={`text-sm tabular-nums ${getDateNumberColor()}`}>
                        {dayNum}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-700">
                        {dayName}
                      </span>
                      {!isViewOnly && (
                        <Edit3 className="w-2.5 h-2.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ml-0.5" />
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      {MONTH_NAMES[monthNum - 1].slice(0, 3)}
                    </div>
                  </div>
                </td>

                {/* Baris Gabungan Cuti: Diletakkan Di Tengah (Center) dan Nama Cuti Dipaparkan Semula Termasuk Yang Berulang */}
                {isCuti && selectedUnit === 'all' ? (
                  <td 
                    colSpan={4} 
                    onClick={() => !isViewOnly && onOpenDayModal(dateStr)}
                    className={`py-3 px-4 text-center align-middle ${!isViewOnly ? 'cursor-pointer hover:opacity-95' : ''}`}
                  >
                    <div className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
                      {isUmum ? (
                        /* CUTI UMUM RASMI: Lencana merah terang & teks di tengah */
                        <div className="flex flex-col items-center justify-center text-center gap-1">
                          <span className="px-3 py-0.5 rounded text-[10px] font-extrabold bg-red-600 text-white uppercase tracking-wider shadow-xs">
                            Cuti Umum Rasmi
                          </span>
                          <span className="font-extrabold text-xs sm:text-sm tracking-tight text-red-950 uppercase text-center">
                            {holidayLabel.toUpperCase()}
                          </span>
                        </div>
                      ) : holidayType === 'PENGGAL' ? (
                        /* CUTI PENGGAL PERSEKOLAHAN KPM: Lencana kuning emas terang & nama cuti dipaparkan pada setiap baris di tengah */
                        <div className="flex flex-col items-center justify-center text-center gap-1">
                          <span className="px-3 py-0.5 rounded text-[10px] font-extrabold bg-amber-600 text-white uppercase tracking-wider shadow-xs">
                            Cuti Penggal Persekolahan KPM
                          </span>
                          <span className="font-extrabold text-xs sm:text-sm tracking-tight text-amber-950 uppercase text-center">
                            {holidayLabel.toUpperCase()}
                          </span>
                        </div>
                      ) : holidayType === 'LAIN' ? (
                        /* CUTI TAMBAHAN KPM / PERISTIWA: Lencana indigo terang & nama cuti dipaparkan di tengah */
                        <div className="flex flex-col items-center justify-center text-center gap-1">
                          <span className="px-3 py-0.5 rounded text-[10px] font-extrabold bg-indigo-600 text-white uppercase tracking-wider shadow-xs">
                            Cuti Tambahan KPM / Peristiwa
                          </span>
                          <span className="font-extrabold text-xs sm:text-sm tracking-tight text-indigo-950 uppercase text-center">
                            {holidayLabel.toUpperCase()}
                          </span>
                        </div>
                      ) : (
                        /* CUTI HUJUNG MINGGU: Lencana kelabu & nama cuti hujung minggu dipaparkan di tengah */
                        <div className="flex flex-col items-center justify-center text-center gap-1">
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-600 text-white uppercase tracking-wider shadow-xs">
                            Cuti Hujung Minggu
                          </span>
                          <span className="font-extrabold text-xs sm:text-sm tracking-tight text-slate-800 uppercase text-center">
                            {holidayLabel.toUpperCase()}
                          </span>
                        </div>
                      )}

                      {/* Program Sekolah Bertindih Jika Ada (cth: Kem Kepimpinan Sabtu) */}
                      {holidayPrograms && (
                        <div className="mt-2 p-2 bg-white/95 rounded-md border border-black/15 font-normal text-slate-900 shadow-xs w-full max-w-lg text-center">
                          <span className="font-bold text-teal-900 text-xs flex items-center justify-center gap-1 mb-0.5 text-center">
                            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                            {dayOfWeek === 6 ? 'Program Hari Sabtu:' : 'Aktiviti Sekolah Terancang:'}
                          </span>
                          <div className="text-xs text-slate-800 leading-relaxed font-medium text-center">
                            {highlightMatches(holidayPrograms, searchQuery)}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                ) : (
                  <>
                    {/* Kolum Pentadbiran: Semua Teks di Tengah (Center) */}
                    {(selectedUnit === 'all' || selectedUnit === 'p') && (
                      <td className="p-0 border-r border-slate-200 align-middle text-center">
                        {canEditCol('p') ? (
                          <textarea
                            value={row.p}
                            onChange={e => onCellChange(dateStr, 'p', e.target.value)}
                            placeholder="Program Pentadbiran..."
                            rows={Math.max(1, (row.p || '').split('\n').length)}
                            className="w-full h-full min-h-[38px] p-2 bg-transparent text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0b6b5c] resize-none leading-relaxed transition-colors placeholder:text-slate-400 font-medium text-center"
                          />
                        ) : (
                          <div className="p-2 min-h-[38px] text-xs text-slate-800 leading-relaxed whitespace-pre-line font-medium text-center">
                            {row.p ? highlightMatches(row.p, searchQuery) : <span className="text-slate-300">-</span>}
                          </div>
                        )}
                      </td>
                    )}

                    {/* Kolum Kurikulum: Semua Teks di Tengah (Center) */}
                    {(selectedUnit === 'all' || selectedUnit === 'k') && (
                      <td className="p-0 border-r border-slate-200 align-middle text-center">
                        {canEditCol('k') ? (
                          <textarea
                            value={row.k}
                            onChange={e => onCellChange(dateStr, 'k', e.target.value)}
                            placeholder="Program Kurikulum..."
                            rows={Math.max(1, (row.k || '').split('\n').length)}
                            className="w-full h-full min-h-[38px] p-2 bg-transparent text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 resize-none leading-relaxed transition-colors placeholder:text-slate-400 font-medium text-center"
                          />
                        ) : (
                          <div className="p-2 min-h-[38px] text-xs text-slate-800 leading-relaxed whitespace-pre-line font-medium text-center">
                            {row.k ? highlightMatches(row.k, searchQuery) : <span className="text-slate-300">-</span>}
                          </div>
                        )}
                      </td>
                    )}

                    {/* Kolum Hal Ehwal Murid (HEM): Semua Teks di Tengah (Center) */}
                    {(selectedUnit === 'all' || selectedUnit === 'h') && (
                      <td className="p-0 border-r border-slate-200 align-middle text-center">
                        {canEditCol('h') ? (
                          <textarea
                            value={row.h}
                            onChange={e => onCellChange(dateStr, 'h', e.target.value)}
                            placeholder="Program HEM..."
                            rows={Math.max(1, (row.h || '').split('\n').length)}
                            className="w-full h-full min-h-[38px] p-2 bg-transparent text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 resize-none leading-relaxed transition-colors placeholder:text-slate-400 font-medium text-center"
                          />
                        ) : (
                          <div className="p-2 min-h-[38px] text-xs text-slate-800 leading-relaxed whitespace-pre-line font-medium text-center">
                            {row.h ? highlightMatches(row.h, searchQuery) : <span className="text-slate-300">-</span>}
                          </div>
                        )}
                      </td>
                    )}

                    {/* Kolum Kokurikulum: Semua Teks di Tengah (Center) */}
                    {(selectedUnit === 'all' || selectedUnit === 'o') && (
                      <td className="p-0 align-middle text-center">
                        {canEditCol('o') ? (
                          <textarea
                            value={row.o}
                            onChange={e => onCellChange(dateStr, 'o', e.target.value)}
                            placeholder="Program Kokurikulum..."
                            rows={Math.max(1, (row.o || '').split('\n').length)}
                            className="w-full h-full min-h-[38px] p-2 bg-transparent text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-600 resize-none leading-relaxed transition-colors placeholder:text-slate-400 font-medium text-center"
                          />
                        ) : (
                          <div className="p-2 min-h-[38px] text-xs text-slate-800 leading-relaxed whitespace-pre-line font-medium text-center">
                            {row.o ? highlightMatches(row.o, searchQuery) : <span className="text-slate-300">-</span>}
                          </div>
                        )}
                      </td>
                    )}
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {datesToRender.length === 0 && (
        <div className="py-12 text-center text-slate-400">
          <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium">Tiada rekod tarikh yang sepadan dengan carian / penapis anda.</p>
        </div>
      )}
    </div>
  );
};

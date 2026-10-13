import React from 'react';
import { MONTH_SHORT } from '../data/kpmCalendar';

interface MonthTabsProps {
  currentMonth: number; // 0..11, or -1 for All Months
  onSelectMonth: (monthIndex: number) => void;
  stats: {
    weekRangeText: string;
    schoolDaysCount: number;
    holidayCount: number;
    penggalDaysCount: number;
    umumDaysCount: number;
    lainDaysCount: number;
    weekendDaysCount: number;
    programCount: number;
    unitCounts: {
      p: number;
      k: number;
      h: number;
      o: number;
    };
  };
}

export const MonthTabs: React.FC<MonthTabsProps> = ({
  currentMonth,
  onSelectMonth,
  stats
}) => {
  return (
    <div className="bg-white border-b border-slate-200">
      {/* Tab Navigasi Bulan */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none border-b border-slate-100">
          {MONTH_SHORT.map((name, index) => {
            const isSelected = currentMonth === index;
            return (
              <button
                key={index}
                onClick={() => onSelectMonth(index)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors shrink-0 ${
                  isSelected
                    ? 'bg-[#0b6b5c] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {name}
              </button>
            );
          })}
          <button
            onClick={() => onSelectMonth(-1)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors shrink-0 ${
              currentMonth === -1
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Semua (Setahun)
          </button>
        </div>

        {/* Ringkasan Maklumat & Metrik Takwim */}
        <div className="py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-800">
              {stats.weekRangeText}
            </span>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <span className="flex items-center gap-1.5">
              <span>Hari Persekolahan:</span>
              <strong className="text-slate-900 tabular-nums font-bold">{stats.schoolDaysCount}</strong>
              <span>hari</span>
              {currentMonth === -1 && (
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  stats.schoolDaysCount >= 190 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {stats.schoolDaysCount >= 190 ? '✓ Minima 190 Hari KPM Dipatuhi' : 'Perlu Semakan (<190 Hari)'}
                </span>
              )}
            </span>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <span className="flex items-center gap-1 flex-wrap">
              <span>Cuti / Penggal:</span>
              <strong className="text-slate-900 tabular-nums font-bold">{stats.holidayCount}</strong>
              <span>hari</span>
              <span className="text-[11px] text-slate-500 font-normal">
                (Penggal KPM: <strong className="text-amber-800">{stats.penggalDaysCount}</strong> · Umum/Khas: <strong className="text-red-700">{stats.umumDaysCount + stats.lainDaysCount}</strong> · Hujung Minggu: <strong className="text-slate-700">{stats.weekendDaysCount}</strong>)
              </span>
            </span>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <span>
              Jumlah Program: <strong className="text-teal-700 tabular-nums font-bold">{stats.programCount}</strong>
            </span>
          </div>

          {/* Pengagihan Program Mengikut Unit */}
          <div className="flex items-center gap-2 text-[11px] font-medium flex-wrap">
            <span className="text-slate-400">Pecahan Unit:</span>
            <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
              Pentadbiran: <strong className="tabular-nums">{stats.unitCounts.p}</strong>
            </span>
            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200">
              Kurikulum: <strong className="tabular-nums">{stats.unitCounts.k}</strong>
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              HEM: <strong className="tabular-nums">{stats.unitCounts.h}</strong>
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
              Koko: <strong className="tabular-nums">{stats.unitCounts.o}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

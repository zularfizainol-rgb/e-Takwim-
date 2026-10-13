import React from 'react';
import { Search, X, CheckCircle2, ShieldAlert } from 'lucide-react';
import { UserRole } from '../types/takwim';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedUnit: 'all' | 'p' | 'k' | 'h' | 'o';
  onSelectUnit: (unit: 'all' | 'p' | 'k' | 'h' | 'o') => void;
  selectedDayType: 'all' | 'school' | 'holiday';
  onSelectDayType: (type: 'all' | 'school' | 'holiday') => void;
  currentRole: UserRole;
  onOpenLoginModal: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedUnit,
  onSelectUnit,
  selectedDayType,
  onSelectDayType,
  currentRole,
  onOpenLoginModal
}) => {
  const isViewOnly = currentRole === 'GURU';

  return (
    <div className="bg-slate-50 border-b border-slate-200 py-2.5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3">
        {/* Carian & Penapis */}
        <div className="flex items-center gap-2 flex-1 min-w-[280px] max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Cari program, aktiviti, mesyuarat, ujian..."
              className="w-full pl-8 pr-8 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0b6b5c] focus:border-[#0b6b5c] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Butang Penapis Lajur Unit */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs scrollbar-none">
          <span className="text-slate-400 text-[11px] font-medium mr-1 hidden sm:inline">Unit:</span>
          {[
            { id: 'all', label: 'Semua Lajur' },
            { id: 'p', label: 'Pentadbiran', color: 'text-teal-800' },
            { id: 'k', label: 'Kurikulum', color: 'text-indigo-800' },
            { id: 'h', label: 'HEM', color: 'text-emerald-800' },
            { id: 'o', label: 'Kokurikulum', color: 'text-amber-800' }
          ].map(u => (
            <button
              key={u.id}
              onClick={() => onSelectUnit(u.id as any)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                selectedUnit === u.id
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {u.label}
            </button>
          ))}
        </div>

        {/* Penapis Jenis Hari */}
        <div className="flex items-center gap-1 text-xs">
          <select
            value={selectedDayType}
            onChange={e => onSelectDayType(e.target.value as any)}
            className="bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0b6b5c]"
          >
            <option value="all">Semua Hari (Kalendar Penuh)</option>
            <option value="school">Hari Persekolahan Sahaja</option>
            <option value="holiday">Hari Cuti / Penggal Sahaja</option>
          </select>
        </div>
      </div>

      {/* Nota Status Keselamatan / Mod Pengguna */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11.5px]">
        {isViewOnly ? (
          <div className="flex items-center gap-1.5 text-slate-500">
            <span className="font-semibold text-slate-700">Mod Guru (Paparan Sahaja):</span>
            <span>Anda boleh melihat, mencari dan mencetak PDF takwim sekolah.</span>
            <button 
              onClick={onOpenLoginModal} 
              className="ml-1 text-[#0b6b5c] hover:underline font-semibold"
            >
              Log masuk Mod GPK untuk mengisi takwim &rarr;
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-teal-900 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span>
              <strong>Mod GPK Aktif:</strong> Anda boleh mengedit takwim, muat semula dari Google Sheet, muat turun data pelbagai format, dan tetapan sekolah.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { X, Calendar, Save } from 'lucide-react';
import { DAY_NAMES, getDayOfWeek, JENIS_CUTI, MONTH_NAMES } from '../data/kpmCalendar';
import { HolidayType, TakwimRow } from '../types/takwim';

interface EditDayModalProps {
  isOpen: boolean;
  dateStr: string | null;
  onClose: () => void;
  rows: Record<string, TakwimRow>;
  onSaveDay: (updatedRow: TakwimRow) => void;
}

export const EditDayModal: React.FC<EditDayModalProps> = ({
  isOpen,
  dateStr,
  onClose,
  rows,
  onSaveDay
}) => {
  const [rowState, setRowState] = useState<TakwimRow>({
    d: '',
    j: '',
    l: '',
    p: '',
    k: '',
    h: '',
    o: ''
  });

  useEffect(() => {
    if (isOpen && dateStr && rows[dateStr]) {
      setRowState({ ...rows[dateStr] });
    }
  }, [isOpen, dateStr, rows]);

  if (!isOpen || !dateStr) return null;

  const dayOfWeek = getDayOfWeek(dateStr);
  const dayName = DAY_NAMES[dayOfWeek];
  const dayNum = parseInt(dateStr.slice(8), 10);
  const monthNum = parseInt(dateStr.slice(5, 7), 10);
  const yearNum = parseInt(dateStr.slice(0, 4), 10);

  const handleSave = () => {
    onSaveDay(rowState);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#0b6b5c]" />
              <h3 className="font-bold text-slate-900 text-base">
                Tetapan Tarikh: {dayName}, {dayNum} {MONTH_NAMES[monthNum - 1]} {yearNum}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Tukar status cuti atau sunting program bagi semua unit pada tarikh ini.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Borang Suntingan */}
        <div className="p-5 space-y-3.5 max-h-[75vh] overflow-y-auto text-xs">
          {/* Status Hari & Nama Cuti */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Jenis Hari
              </label>
              <select
                value={rowState.j}
                onChange={e => {
                  const val = e.target.value as HolidayType;
                  setRowState(prev => ({
                    ...prev,
                    j: val,
                    l: val ? (prev.l || JENIS_CUTI[val]) : ''
                  }));
                }}
                className="w-full p-2 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-[#0b6b5c]"
              >
                <option value="">Hari Biasa (Persekolahan)</option>
                <option value="UMUM">Cuti Umum</option>
                <option value="PENGGAL">Cuti Penggal KPM</option>
                <option value="LAIN">Cuti Peristiwa / Khas KPM</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Catatan / Nama Cuti
              </label>
              <input
                type="text"
                value={rowState.l}
                disabled={!rowState.j}
                onChange={e => setRowState(prev => ({ ...prev, l: e.target.value }))}
                placeholder="cth: Cuti Peristiwa Sukan Sekolah"
                className="w-full p-2 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-[#0b6b5c] disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>
          </div>

          {/* Program Pentadbiran */}
          <div>
            <label className="block font-semibold text-teal-900 mb-1">
              Pentadbiran & Pengurusan (PK1)
            </label>
            <textarea
              value={rowState.p}
              onChange={e => setRowState(prev => ({ ...prev, p: e.target.value }))}
              placeholder="Program Pentadbiran (satu setiap baris)..."
              rows={2}
              className="w-full p-2 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-[#0b6b5c]"
            />
          </div>

          {/* Program Kurikulum */}
          <div>
            <label className="block font-semibold text-indigo-900 mb-1">
              Kurikulum (PK Pentadbiran/Kurikulum)
            </label>
            <textarea
              value={rowState.k}
              onChange={e => setRowState(prev => ({ ...prev, k: e.target.value }))}
              placeholder="Program Kurikulum (satu setiap baris)..."
              rows={2}
              className="w-full p-2 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          {/* Program HEM */}
          <div>
            <label className="block font-semibold text-emerald-900 mb-1">
              Hal Ehwal Murid (PK HEM)
            </label>
            <textarea
              value={rowState.h}
              onChange={e => setRowState(prev => ({ ...prev, h: e.target.value }))}
              placeholder="Program Hal Ehwal Murid (satu setiap baris)..."
              rows={2}
              className="w-full p-2 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          {/* Program Kokurikulum */}
          <div>
            <label className="block font-semibold text-amber-900 mb-1">
              Kokurikulum (PK Kokurikulum)
            </label>
            <textarea
              value={rowState.o}
              onChange={e => setRowState(prev => ({ ...prev, o: e.target.value }))}
              placeholder="Program Kokurikulum (satu setiap baris)..."
              rows={2}
              className="w-full p-2 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-amber-600"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium text-xs"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 rounded-md bg-[#0b6b5c] hover:bg-[#084f44] text-white font-medium text-xs shadow-xs flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </div>
    </div>
  );
};

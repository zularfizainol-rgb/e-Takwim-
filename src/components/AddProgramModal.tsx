import React, { useState, useEffect } from 'react';
import { X, Calendar, PlusCircle, Check } from 'lucide-react';
import { DAY_NAMES, getDayOfWeek, padZero } from '../data/kpmCalendar';
import { SchoolGroup, TakwimRow } from '../types/takwim';

interface AddProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  rows: Record<string, TakwimRow>;
  schoolGroup: SchoolGroup;
  year: number;
  currentMonth: number;
  isWeekendFn: (d: string) => boolean;
  onSavePrograms: (targetDates: string[], colKey: 'p' | 'k' | 'h' | 'o', text: string) => void;
}

export const AddProgramModal: React.FC<AddProgramModalProps> = ({
  isOpen,
  onClose,
  rows,
  schoolGroup,
  year,
  currentMonth,
  isWeekendFn,
  onSavePrograms
}) => {
  const [text, setText] = useState('');
  const [colKey, setColKey] = useState<'p' | 'k' | 'h' | 'o'>('k');
  const [mode, setMode] = useState<'single' | 'range' | 'weekly'>('single');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([3]); // 3 = Rabu (hari koko popular)
  const [skipHolidays, setSkipHolidays] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const defaultM = currentMonth >= 0 ? currentMonth + 1 : 1;
      const defaultDate = `${year}-${padZero(defaultM)}-04`;
      setStartDate(defaultDate);
      setEndDate(`${year}-${padZero(defaultM)}-28`);
      setText('');
      setError('');
    }
  }, [isOpen, currentMonth, year]);

  if (!isOpen) return null;

  // Kira tarikh sasaran berdasarkan input
  const calculateTargetDates = (): string[] => {
    if (!startDate) return [];
    if (mode === 'single') {
      return [startDate];
    }

    const startT = Date.parse(startDate + 'T00:00:00Z');
    const endT = Date.parse((endDate || startDate) + 'T00:00:00Z');
    if (isNaN(startT) || isNaN(endT) || startT > endT) return [];

    const out: string[] = [];
    for (let t = startT; t <= endT; t += 86400000) {
      const dObj = new Date(t);
      const dStr = `${dObj.getUTCFullYear()}-${padZero(dObj.getUTCMonth() + 1)}-${padZero(dObj.getUTCDate())}`;
      const r = rows[dStr];
      if (!r) continue;

      const isW = isWeekendFn(dStr);
      const isCuti = Boolean(r.j || isW);

      if (skipHolidays && isCuti) continue;

      if (mode === 'weekly') {
        const dow = getDayOfWeek(dStr);
        if (!selectedDays.includes(dow)) continue;
      }

      out.push(dStr);
    }
    return out;
  };

  const targets = calculateTargetDates();

  const handleToggleDay = (dNum: number) => {
    setSelectedDays(prev =>
      prev.includes(dNum) ? prev.filter(x => x !== dNum) : [...prev, dNum]
    );
  };

  const handleSave = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setError('Sila taip nama program atau aktiviti.');
      return;
    }
    if (targets.length === 0) {
      setError('Tiada tarikh yang sepadan. Sila semak julat tarikh atau pilihan langkau cuti.');
      return;
    }

    onSavePrograms(targets, colKey, trimmed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Tajuk Modal */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-[#0b6b5c]" />
            <h3 className="font-bold text-slate-900 text-base">Tambah Program Takwim</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Borang Input */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Teks Program */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nama Program / Aktiviti <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={text}
              onChange={e => { setText(e.target.value); setError(''); }}
              placeholder="cth: Perhimpunan Rasmi Mingguan / Mesyuarat Guru Bil 1 / Perjumpaan Kokurikulum (Badan Beruniform)"
              rows={2}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0b6b5c] text-xs"
            />
          </div>

          {/* Pilihan Lajur Unit */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Masukkan ke Lajur Unit
            </label>
            <select
              value={colKey}
              onChange={e => setColKey(e.target.value as any)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0b6b5c] font-medium"
            >
              <option value="p">Pentadbiran & Pengurusan (PK1)</option>
              <option value="k">Kurikulum (PK Pentadbiran/Kurikulum)</option>
              <option value="h">Hal Ehwal Murid (PK HEM)</option>
              <option value="o">Kokurikulum (PK Kokurikulum)</option>
            </select>
          </div>

          {/* Corak Kekerapan (Single / Range / Weekly) */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Corak Tarikh
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMode('single')}
                className={`py-1.5 px-2 rounded-md font-medium border text-center transition-colors ${
                  mode === 'single'
                    ? 'bg-[#0b6b5c] text-white border-[#0b6b5c]'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Satu Hari
              </button>
              <button
                type="button"
                onClick={() => setMode('range')}
                className={`py-1.5 px-2 rounded-md font-medium border text-center transition-colors ${
                  mode === 'range'
                    ? 'bg-[#0b6b5c] text-white border-[#0b6b5c]'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Julat Tarikh
              </button>
              <button
                type="button"
                onClick={() => setMode('weekly')}
                className={`py-1.5 px-2 rounded-md font-medium border text-center transition-colors ${
                  mode === 'weekly'
                    ? 'bg-[#0b6b5c] text-white border-[#0b6b5c]'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Berulang Mingguan
              </button>
            </div>
          </div>

          {/* Pemilihan Tarikh */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-600 mb-1">
                {mode === 'single' ? 'Tarikh Program' : 'Tarikh Mula'}
              </label>
              <input
                type="date"
                value={startDate}
                min={`${year}-01-01`}
                max={`${year}-12-31`}
                onChange={e => setStartDate(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white text-xs"
              />
            </div>
            {mode !== 'single' && (
              <div>
                <label className="block font-medium text-slate-600 mb-1">
                  Tarikh Tamat
                </label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || `${year}-01-01`}
                  max={`${year}-12-31`}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white text-xs"
                />
              </div>
            )}
          </div>

          {/* Hari tertentu jika mode == weekly */}
          {mode === 'weekly' && (
            <div>
              <label className="block font-medium text-slate-600 mb-1.5">
                Pilih Hari Berulang:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[1, 2, 3, 4, 5, 6, 0].map(dNum => (
                  <button
                    key={dNum}
                    type="button"
                    onClick={() => handleToggleDay(dNum)}
                    className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                      selectedDays.includes(dNum)
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {DAY_NAMES[dNum]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Langkau cuti */}
          {mode !== 'single' && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="skipHol"
                checked={skipHolidays}
                onChange={e => setSkipHolidays(e.target.checked)}
                className="w-4 h-4 text-[#0b6b5c] rounded border-slate-300 focus:ring-[#0b6b5c]"
              />
              <label htmlFor="skipHol" className="text-slate-700 font-medium cursor-pointer">
                Langkau cuti umum, cuti penggal & hujung minggu sekolah
              </label>
            </div>
          )}

          {/* Pra-tonton Kiraan Tarikh */}
          <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-lg text-teal-900">
            <span className="font-semibold">Pra-tonton Pengisian: </span>
            Program ini akan dimasukkan ke dalam <strong className="tabular-nums">{targets.length}</strong> hari tarikh sasaran.
          </div>

          {error && (
            <p className="text-rose-600 font-medium bg-rose-50 p-2 rounded border border-rose-200">
              {error}
            </p>
          )}
        </div>

        {/* Butang Bawah */}
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
            <Check className="w-3.5 h-3.5" />
            <span>Masukkan ke Takwim</span>
          </button>
        </div>
      </div>
    </div>
  );
};

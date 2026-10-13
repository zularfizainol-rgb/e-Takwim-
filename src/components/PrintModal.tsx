import React, { useState } from 'react';
import { 
  Printer, 
  Calendar, 
  X, 
  CheckCircle2, 
  FileText, 
  Sparkles, 
  AlertCircle,
  Download,
  Loader2,
  Eye,
  FileCheck
} from 'lucide-react';
import { MONTH_NAMES } from '../data/kpmCalendar';
import { SchoolSettings, TakwimRow } from '../types/takwim';
import { downloadTakwimPdf, printTakwimPdf } from '../utils/exportPdf';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMonth: number; // 0..11, or -1 for All
  settings: SchoolSettings;
  rows: Record<string, TakwimRow>;
  allDates: string[];
  weeksMap: Record<string, number>;
  weekKeyFn: (d: string) => string;
  isWeekendFn: (d: string) => boolean;
  onExecuteBrowserPrint: (monthScope: number | 'all') => void;
  onOpenPreview?: (monthScope: number | 'all') => void;
}

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  currentMonth,
  settings,
  rows,
  allDates,
  weeksMap,
  weekKeyFn,
  isWeekendFn,
  onExecuteBrowserPrint,
  onOpenPreview
}) => {
  // Pilihan skop cetakan
  const [selectedScope, setSelectedScope] = useState<'current' | 'all' | 'custom'>(() => {
    return currentMonth === -1 ? 'all' : 'current';
  });
  const [customMonth, setCustomMonth] = useState<number>(currentMonth === -1 ? 0 : currentMonth);

  // Status proses muat turun
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const currentMonthName = currentMonth >= 0 && currentMonth < 12 
    ? MONTH_NAMES[currentMonth] 
    : 'Bulan Semasa';

  const getTargetScope = (): number | 'all' => {
    if (selectedScope === 'current') {
      return currentMonth === -1 ? 'all' : currentMonth;
    }
    if (selectedScope === 'all') {
      return 'all';
    }
    return customMonth;
  };

  // Muat turun fail PDF secara langsung ke peranti (100% Berfungsi di semua pelayar & iframe)
  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    setStatusMessage(null);
    try {
      const scope = getTargetScope();
      const filename = await downloadTakwimPdf({
        rows,
        allDates,
        weeksMap,
        weekKeyFn,
        isWeekendFn,
        settings,
        monthScope: scope
      });
      setStatusMessage({
        type: 'success',
        text: `Fail PDF berjaya dijana dan dimuat turun: ${filename}`
      });
      setTimeout(() => {
        setIsGenerating(false);
      }, 800);
    } catch (err: any) {
      console.error('Ralat menjana fail PDF:', err);
      setStatusMessage({
        type: 'error',
        text: 'Ralat semasa menjana PDF. Sila cuba kaedah Dialog Pelayar atau cuba sekali lagi.'
      });
      setIsGenerating(false);
    }
  };

  // Cetakan pelayar (Buka dialog print browser)
  const handleBrowserPrint = () => {
    const scope = getTargetScope();
    setStatusMessage(null);
    onClose();
    onExecuteBrowserPrint(scope);
  };

  // Pratonton paparan cetakan
  const handlePreview = () => {
    if (onOpenPreview) {
      const scope = getTargetScope();
      onClose();
      onOpenPreview(scope);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Kepala Modal */}
        <div className="px-5 py-4 bg-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-700/80 text-white shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-tight">Cetak / Simpan PDF Takwim</h3>
              <p className="text-xs text-teal-100">Format Rasmi Surat Siaran KPM (A4 Portrait)</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-teal-700/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Isi Kandungan Modal */}
        <div className="p-5 space-y-4 text-slate-700 text-xs sm:text-sm max-h-[78vh] overflow-y-auto">
          {/* Status Notifikasi */}
          {statusMessage && (
            <div className={`p-3 rounded-xl border flex items-start gap-2.5 animate-in fade-in duration-150 ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}>
              {statusMessage.type === 'success' ? (
                <FileCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="text-xs font-medium leading-relaxed">
                {statusMessage.text}
              </div>
            </div>
          )}

          {/* Jaminan Cetakan Rasmi */}
          <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-emerald-950 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <strong className="text-emerald-900 block font-semibold mb-0.5">
                Kawasan & Format Dokumen Diselaraskan:
              </strong>
              Cetakan bermula terus dari <strong>KEMENTERIAN PENDIDIKAN MALAYSIA</strong> bersama kepala surat sekolah & TS25. Semua butang sistem, navigasi, dan menu web <strong>dibuang sepenuhnya</strong>. Semua maklumat diletakkan di tengah (center).
            </div>
          </div>

          {/* Pilihan Skop Cetakan */}
          <div>
            <label className="block font-bold text-slate-800 mb-2 text-xs uppercase tracking-wider">
              Pilih Skop Dokumen:
            </label>

            <div className="space-y-2">
              {/* Pilihan 1: Bulan Semasa */}
              {currentMonth !== -1 && (
                <label 
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedScope === 'current' 
                      ? 'border-teal-600 bg-teal-50/60 ring-2 ring-teal-600/20' 
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="printScope"
                    checked={selectedScope === 'current'}
                    onChange={() => setSelectedScope('current')}
                    className="mt-0.5 text-teal-600 focus:ring-teal-500"
                  />
                  <div className="flex-1">
                    <div className="font-bold text-slate-900 flex items-center justify-between">
                      <span>Bulan Ini Sahaja ({currentMonthName} {settings.tahun})</span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 bg-teal-100 text-teal-800 rounded-md">
                        1 Muka Surat A4
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Cetak takwim satu bulan lengkap format rasmi KPM.
                    </p>
                  </div>
                </label>
              )}

              {/* Pilihan 2: Setahun Penuh */}
              <label 
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedScope === 'all' 
                    ? 'border-teal-600 bg-teal-50/60 ring-2 ring-teal-600/20' 
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="printScope"
                  checked={selectedScope === 'all'}
                  onChange={() => setSelectedScope('all')}
                  className="mt-0.5 text-teal-600 focus:ring-teal-500"
                />
                <div className="flex-1">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>Sepanjang Tahun (12 Bulan Lengkap)</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md">
                      12 Muka Surat A4
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Januari hingga Disember {settings.tahun} (Setiap bulan pada muka surat A4 tersendiri).
                  </p>
                </div>
              </label>

              {/* Pilihan 3: Pilih Bulan Khusus */}
              <label 
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedScope === 'custom' 
                    ? 'border-teal-600 bg-teal-50/60 ring-2 ring-teal-600/20' 
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="printScope"
                  checked={selectedScope === 'custom'}
                  onChange={() => setSelectedScope('custom')}
                  className="mt-0.5 text-teal-600 focus:ring-teal-500"
                />
                <div className="flex-1">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>Pilih Bulan Tertentu</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md">
                      1 Muka Surat
                    </span>
                  </div>
                  {selectedScope === 'custom' && (
                    <div className="mt-2.5">
                      <select
                        value={customMonth}
                        onChange={e => setCustomMonth(parseInt(e.target.value, 10))}
                        className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                      >
                        {MONTH_NAMES.map((name, idx) => (
                          <option key={idx} value={idx}>
                            Bulan {name} {settings.tahun}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Kotak Petunjuk Penyelesaian PDF */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              Pilihan Simpan & Cetak:
            </div>
            <p className="text-[11.5px] leading-relaxed text-slate-600">
              Gunakan <strong>&ldquo;Muat Turun Fail PDF (.pdf)&rdquo;</strong> untuk menjana fail PDF secara terus ke komputer atau telefon anda tanpa bergantung kepada pemandu pencetak. Atau gunakan <strong>&ldquo;Cetak Dokumen&rdquo;</strong> untuk pencetak fizikal.
            </p>
          </div>
        </div>

        {/* Butang Tindakan di Bawah */}
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors w-full sm:w-auto text-center"
            >
              Batal
            </button>
            {onOpenPreview && (
              <button
                type="button"
                onClick={handlePreview}
                className="px-3 py-2 text-xs font-semibold text-teal-800 hover:bg-teal-50 border border-teal-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 w-full sm:w-auto"
                title="Lihat paparan A4 rasmi sebelum cetak"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Pratonton</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Butang 1: Buka Dialog Pencetak Pelayar */}
            <button
              type="button"
              onClick={handleBrowserPrint}
              disabled={isGenerating}
              className="px-3.5 py-2.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl shadow-2xs flex items-center justify-center gap-1.5 transition-all w-full sm:w-auto disabled:opacity-50"
              title="Buka dialog pencetak penyemak imbas"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Cetak Pelayar</span>
            </button>

            {/* Butang 2 (UTAMA): Muat Turun Fail PDF Terus */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="px-4 py-2.5 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 active:scale-98 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all w-full sm:w-auto disabled:opacity-70"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menjana PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Muat Turun PDF (.pdf)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

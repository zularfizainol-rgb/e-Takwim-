import React, { useState } from 'react';
import { 
  Calendar, 
  Cloud, 
  CloudOff, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Lock, 
  LogIn, 
  LogOut, 
  PlusCircle, 
  Printer, 
  RefreshCw, 
  Settings, 
  ShieldCheck, 
  CalendarDays
} from 'lucide-react';
import { SchoolSettings, SyncState, UserRole } from '../types/takwim';
import { SchoolLogoDisplay } from '../data/defaultLogos';

interface NavbarProps {
  settings: SchoolSettings;
  currentRole: UserRole;
  syncState: SyncState;
  syncMessage: string;
  onRefresh: () => void;
  onOpenAddModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenLoginModal: () => void;
  onLogoutRole: () => void;
  onExportCSV: () => void;
  onExportExcel: () => void;
  onExportICal: () => void;
  onPrint: () => void;
  onSwitchYear?: (year: number) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  currentRole,
  syncState,
  syncMessage,
  onRefresh,
  onOpenAddModal,
  onOpenSettingsModal,
  onOpenLoginModal,
  onLogoutRole,
  onExportCSV,
  onExportExcel,
  onExportICal,
  onPrint,
  onSwitchYear
}) => {
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const isViewOnly = currentRole === 'GURU';

  const getRoleBadge = () => {
    switch (currentRole) {
      case 'GURU':
        return { 
          label: 'Guru (Paparan Sahaja)', 
          bg: 'bg-slate-100 text-slate-800 border-slate-300' 
        };
      case 'GPK_PENTADBIRAN':
        return { 
          label: 'GPK Pentadbiran (PK1)', 
          bg: 'bg-teal-50 text-teal-900 border-teal-300' 
        };
      case 'GPK_KURIKULUM':
        return { 
          label: 'GPK Kurikulum', 
          bg: 'bg-indigo-50 text-indigo-900 border-indigo-300' 
        };
      case 'GPK_HEM':
        return { 
          label: 'GPK Hal Ehwal Murid (HEM)', 
          bg: 'bg-emerald-50 text-emerald-900 border-emerald-300' 
        };
      case 'GPK_KOKO':
        return { 
          label: 'GPK Kokurikulum', 
          bg: 'bg-amber-50 text-amber-900 border-amber-300' 
        };
      case 'PENTADBIR':
        return { 
          label: 'Guru Besar / Pentadbir', 
          bg: 'bg-rose-50 text-rose-900 border-rose-300' 
        };
    }
  };

  const roleInfo = getRoleBadge();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Logo & Maklumat Sekolah (Sebelah Kiri) */}
        <div className="flex items-center gap-3">
          {/* Logo Sekolah */}
          <div className="w-11 h-11 rounded-lg bg-white p-0.5 border border-slate-200 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
            <SchoolLogoDisplay
              src={settings.logoSekolah}
              alt="Logo Sekolah"
              className="max-h-full max-w-full"
              fallbackType="school"
            />
          </div>

          {/* Logo TS25 (jika diaktifkan) */}
          {settings.paparLogoTs25 !== false && (
            <div className="w-10 h-10 rounded-lg bg-white p-0.5 border border-slate-200 hidden sm:flex items-center justify-center shadow-xs shrink-0 overflow-hidden" title="Program Transformasi Sekolah 2025 (TS25)">
              <SchoolLogoDisplay
                src={settings.logoTs25}
                alt="Logo TS25"
                className="max-h-full max-w-full"
                fallbackType="ts25"
              />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
                e-Takwim Sekolah
              </h1>
              {/* Pemilih Tahun Cepat */}
              <select
                value={settings.tahun}
                onChange={e => onSwitchYear?.(parseInt(e.target.value, 10))}
                className="text-xs font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-900 border border-teal-300 hover:bg-teal-100 cursor-pointer transition-colors shadow-2xs"
                title="Tukar Tahun Takwim (Tahun semasa / lepas / akan datang)"
              >
                <option value={2028}>2028 (Akan Datang)</option>
                <option value={2027}>2027 (Semasa)</option>
                <option value={2026}>2026 (Lepas)</option>
                <option value={2025}>2025 (Arkib)</option>
                <option value={2029}>2029</option>
                <option value={2030}>2030</option>
              </select>

              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium border border-slate-200">
                Kumpulan {settings.kumpulan}
              </span>
              {settings.paparLogoTs25 !== false && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200 hidden md:inline">
                  TS25
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium truncate max-w-xs sm:max-w-md">
              {settings.sekolah || 'Nama Sekolah Belum Ditetapkan'} 
              {settings.kodSekolah ? ` (${settings.kodSekolah})` : ''}
            </p>
          </div>
        </div>

        {/* Tindakan Takwim & Penjuru Sebelah Kanan */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap ml-auto">
          {/* Status Penyelarasan */}
          <div 
            onClick={onOpenSettingsModal}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700"
            title="Klik untuk buka Tetapan & Sambungan Google Sheet"
          >
            {settings.googleWebAppUrl ? (
              <Cloud className="w-3.5 h-3.5 text-teal-600" />
            ) : (
              <CloudOff className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span className="max-w-[130px] truncate">{syncMessage}</span>
          </div>

          {/* Butang Tindakan Kalendar */}
          <div className="flex items-center gap-1.5">
            {/* Muat Semula */}
            <button
              onClick={onRefresh}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Ambil data terkini daripada Google Sheet atau Storan"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Muat Semula</span>
            </button>

            {/* Tambah Program (Hanya untuk GPK / Pentadbir) */}
            {!isViewOnly && (
              <button
                onClick={onOpenAddModal}
                className="px-2.5 py-1.5 rounded-md bg-[#0b6b5c] hover:bg-[#084f44] text-white text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span className="whitespace-nowrap">Tambah Program</span>
              </button>
            )}

            {/* Butang Cetak Pantas */}
            <button
              onClick={onPrint}
              className="px-2.5 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Cetak Takwim atau Simpan sebagai PDF (A4 Rasmi KPM)"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Cetak PDF</span>
            </button>

            {/* Menu Muat Turun */}
            <div className="relative">
              <button
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                className="px-2.5 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
                title="Muat turun Excel, CSV atau iCalendar"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Muat Turun</span>
              </button>

              {showDownloadMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowDownloadMenu(false)} 
                  />
                  <div className="absolute right-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-50 text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-100">
                    <button
                      onClick={() => { setShowDownloadMenu(false); onPrint(); }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Printer className="w-4 h-4 text-slate-500" />
                      <div>
                        <div className="font-medium text-slate-800">Cetak / Simpan PDF (A4 Rasmi)</div>
                        <div className="text-[11px] text-slate-500">Format surat siaran takwim KPM</div>
                      </div>
                    </button>
                    <button
                      onClick={() => { setShowDownloadMenu(false); onExportExcel(); }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-100"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <div>
                        <div className="font-medium text-slate-800">Muat Turun Excel (.xlsx)</div>
                        <div className="text-[11px] text-slate-500">Lengkap dengan grid dan tajuk KPM</div>
                      </div>
                    </button>
                    <button
                      onClick={() => { setShowDownloadMenu(false); onExportCSV(); }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-100"
                    >
                      <FileText className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="font-medium text-slate-800">Muat Turun CSV (Semua Data)</div>
                        <div className="text-[11px] text-slate-500">Sesuai untuk pangkalan data</div>
                      </div>
                    </button>
                    <button
                      onClick={() => { setShowDownloadMenu(false); onExportICal(); }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-100"
                    >
                      <CalendarDays className="w-4 h-4 text-indigo-600" />
                      <div>
                        <div className="font-medium text-slate-800">Eksport iCalendar (.ics)</div>
                        <div className="text-[11px] text-slate-500">Selaraskan ke Google Calendar guru</div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ========================================================
              PENJURU SEBELAH KANAN:
              1. Lencana Guru (Paparan Sahaja) - DIBESARKAN & JELAS
              2. Butang Mod GPK / Keluar Edit
              3. Butang Tetapan (Termasuk Integrasi Google Sheet)
             ======================================================== */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            {/* 1. Lencana Paparan Guru (DIBESARKAN & JELAS) */}
            <div 
              className={`px-3 py-1.5 rounded-lg border-2 flex items-center gap-2 text-xs sm:text-sm font-bold shadow-xs whitespace-nowrap ${roleInfo.bg}`}
              title="Status Mod Paparan Semasa"
            >
              {isViewOnly ? (
                <Lock className="w-4 h-4 text-slate-600 shrink-0" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
              )}
              <span className="tracking-tight">{roleInfo.label}</span>
            </div>

            {/* 2. Butang Mod GPK / Keluar Edit */}
            {isViewOnly ? (
              <button
                onClick={onOpenLoginModal}
                className="px-3.5 py-1.5 rounded-lg bg-[#0b6b5c] hover:bg-[#084f44] text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors shadow-xs whitespace-nowrap"
                title="Buka mod pengisian GPK & Pentadbir"
              >
                <LogIn className="w-4 h-4" />
                <span>Mod GPK</span>
              </button>
            ) : (
              <button
                onClick={onLogoutRole}
                className="px-3 py-1.5 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shadow-xs"
                title="Keluar daripada mod penyuntingan ke paparan guru sahaja"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar Edit</span>
              </button>
            )}

            {/* 3. Butang Tetapan (Mengandungi Tetapan Sekolah, Logo & Google Sheet) */}
            <button
              onClick={onOpenSettingsModal}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shadow-xs"
              title="Tetapan Sekolah, Logo TS25 & Integrasi Google Sheet"
            >
              <Settings className="w-4 h-4 text-slate-600" />
              <span>Tetapan</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

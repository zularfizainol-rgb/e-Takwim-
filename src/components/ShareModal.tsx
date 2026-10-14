import React, { useState, useRef } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  ExternalLink, 
  Users, 
  ShieldCheck, 
  Eye, 
  AlertTriangle, 
  KeyRound, 
  Layers,
  Sparkles,
  HelpCircle,
  Download,
  Upload,
  FileCode,
  FileSpreadsheet,
  CheckCircle2,
  Info
} from 'lucide-react';
import { SchoolSettings, TakwimRow } from '../types/takwim';
import { exportBackupJSON, readBackupJSON } from '../utils/exportUtils';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SchoolSettings;
  rows: Record<string, TakwimRow>;
  onOpenGoogleSheetModal: () => void;
  onImportBackup?: (importedRows: Record<string, TakwimRow>, importedSettings: SchoolSettings) => void;
  onSyncGoogleSheet?: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  settings,
  rows,
  onOpenGoogleSheetModal,
  onImportBackup,
  onSyncGoogleSheet
}) => {
  const [activeTab, setActiveTab] = useState<'link' | 'file' | 'faq'>('link');
  const [copiedType, setCopiedType] = useState<'teacher' | 'gpk' | 'code' | 'msg' | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin + window.location.pathname 
    : '';

  const hasSheet = Boolean(settings.googleWebAppUrl && settings.googleWebAppUrl.trim().length > 0);

  // Bina pautan guru (Paparan sahaja)
  const teacherUrl = hasSheet
    ? `${baseUrl}?sheet=${encodeURIComponent(settings.googleWebAppUrl!)}`
    : baseUrl;

  // Bina pautan GPK (Mod GPK)
  const gpkUrl = hasSheet
    ? `${baseUrl}?sheet=${encodeURIComponent(settings.googleWebAppUrl!)}&mode=gpk`
    : `${baseUrl}?mode=gpk`;

  const handleCopy = (text: string, type: 'teacher' | 'gpk' | 'code' | 'msg') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => {
      setCopiedType(null);
    }, 2500);
  };

  const handleDownloadBackup = () => {
    exportBackupJSON(rows, settings);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const res = await readBackupJSON(file);
    if (res.ok && res.rows && res.settings && onImportBackup) {
      onImportBackup(res.rows, res.settings);
      setImportStatus('Takwim berjaya dimuat naik sepenuhnya daripada fail sandaran!');
      setTimeout(() => {
        setImportStatus(null);
      }, 4000);
    } else {
      setImportStatus('Ralat: ' + (res.error || 'Gagal memproses fail'));
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Kiraan data yang telah diisi di komputer ini
  const filledCount = Object.values(rows).filter(r => 
    Boolean(
      (r.p && r.p.trim() !== '') ||
      (r.k && r.k.trim() !== '') ||
      (r.h && r.h.trim() !== '') ||
      (r.o && r.o.trim() !== '')
    )
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-700/60 border border-teal-500/40 flex items-center justify-center shrink-0">
              <Share2 className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Kongsi e-Takwim Sekolah</h3>
              <p className="text-teal-200/80 text-xs truncate max-w-xs sm:max-w-md">
                {settings.sekolah || 'Takwim Rasmi'} ({settings.tahun}) • {filledCount} program telah diisi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigasi */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('link')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'link'
                ? 'border-teal-700 text-teal-800 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Pautan Web Sekolah</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'file'
                ? 'border-teal-700 text-teal-800 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Fail Sandaran (.json)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('faq')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'faq'
                ? 'border-amber-600 text-amber-800 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Kenapa Peranti Lain Nampak Default?</span>
          </button>
        </div>

        {/* Kandungan Modal */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">

          {/* TAB 1: PAUTAN KONGSI WEB */}
          {activeTab === 'link' && (
            <>
              {/* Amaran & Panduan Status Google Sheet */}
              {!hasSheet ? (
                <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl space-y-2 text-amber-950">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-sm text-amber-900">
                        Pautan Google Sheet Belum Disambungkan!
                      </div>
                      <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                        Data takwim ({filledCount} program) yang telah diisi sekarang <strong>hanya berada di dalam memori pelayar komputer ini sahaja (LocalStorage)</strong>. 
                        Jika anda kongsikan pautan sekarang, telefon/komputer orang lain <strong>akan melihat paparan lalai asal (default)</strong> kerana pelayar mereka tiada akses ke data komputer ini.
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenGoogleSheetModal();
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Sambung Google Sheet Sekarang
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('file')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100/60 text-amber-900 rounded-lg font-semibold text-xs"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-700" />
                      Atau Kongsi Fail Sandaran (.json)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-emerald-900 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      <strong>Google Sheet Disambung:</strong> Pautan di bawah mengandungi ID helaian sekolah anda secara automatik.
                    </span>
                  </div>
                  {onSyncGoogleSheet && (
                    <button
                      type="button"
                      onClick={onSyncGoogleSheet}
                      className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold text-[11px] shrink-0"
                    >
                      Sync Sekarang
                    </button>
                  )}
                </div>
              )}

              {/* Kad 1: Pautan Untuk Guru-Guru (Paparan Sahaja) */}
              <div className="p-4 sm:p-5 rounded-xl border-2 border-sky-200 bg-sky-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-sky-600 text-white shadow-xs">
                      <Eye className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">1. Pautan Untuk Guru-Guru (Paparan Sahaja)</h4>
                      <p className="text-slate-500 text-xs">Untuk guru biasa, staf sokongan, & AKP melihat takwim dan cetak PDF.</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                    Lihat & Cetak Sahaja
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={teacherUrl}
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-700 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(teacherUrl, 'teacher')}
                    className={`px-3.5 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs ${
                      copiedType === 'teacher'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-sky-700 hover:bg-sky-800 text-white'
                    }`}
                  >
                    {copiedType === 'teacher' ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Disalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Salin Pautan Guru</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-white/80 p-3 rounded-lg border border-sky-100 text-xs text-slate-600 space-y-1 leading-relaxed">
                  <div className="font-semibold text-slate-800">Ciri-ciri untuk Guru:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-600 pl-1">
                    <li>Membuka takwim sekolah secara langsung tanpa boleh mengedit data.</li>
                    <li>Hanya butang <strong>Cetak PDF</strong>, penapis carian, dan tab bulan disediakan.</li>
                  </ul>
                </div>
              </div>

              {/* Kad 2: Pautan Untuk GPK & Pentadbir (Edit Bersama Serentak) */}
              <div className="p-4 sm:p-5 rounded-xl border-2 border-teal-300 bg-teal-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-[#0b6b5c] text-white shadow-xs">
                      <ShieldCheck className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">2. Pautan Untuk GPK & Pentadbir (Edit Bersama)</h4>
                      <p className="text-slate-500 text-xs">Untuk PK1, PK Kurikulum, PK HEM, PK Koko dan Guru Besar mengisi takwim.</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-100 text-teal-900 border border-teal-300">
                    Akses Edit Berperanan
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={gpkUrl}
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-700 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(gpkUrl, 'gpk')}
                    className={`px-3.5 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs ${
                      copiedType === 'gpk'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#0b6b5c] hover:bg-[#084f44] text-white'
                    }`}
                  >
                    {copiedType === 'gpk' ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Disalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Salin Pautan GPK</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Kod Keselamatan Edit */}
                <div className="p-3 bg-white rounded-lg border border-teal-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-teal-700" />
                    <span className="text-xs text-slate-700">Kod Keselamatan Edit GPK:</span>
                    <code className="px-2 py-0.5 bg-teal-50 border border-teal-300 rounded font-mono font-bold text-teal-900 text-xs">
                      {settings.kodEdit || 'gpk2027'}
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(settings.kodEdit || 'gpk2027', 'code')}
                    className="text-xs text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1"
                  >
                    {copiedType === 'code' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedType === 'code' ? 'Disalin' : 'Salin Kod'}</span>
                  </button>
                </div>

                {/* Bagaimana GPK Edit Serentak */}
                <div className="bg-white/80 p-3 rounded-lg border border-teal-100 text-xs text-slate-600 space-y-1.5 leading-relaxed">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-teal-700" />
                    <span>Pengasingan Lajur Mengelakkan Pertindihan:</span>
                  </div>
                  <p className="text-slate-600">
                    Setiap GPK hanya menaip di unit masing-masing (PK1: Pentadbiran, GPK HEM: HEM, GPK Koko: Kokurikulum, GPK Kurikulum: Kurikulum). Data tidak bertindih dan terus disimpan ke Google Sheet.
                  </p>
                </div>
              </div>

              {/* Panduan Ringkas WhatsApp / Telegram */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-600">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-slate-500" />
                  <span>Format Mesej WhatsApp / Telegram Sekolah:</span>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-md font-mono text-[11px] text-slate-700 whitespace-pre-wrap select-all">
{`📅 *E-TAKWIM PERSEKOLAHAN ${settings.tahun || 2027}*
🏫 ${settings.sekolah || 'Sekolah'}

🔹 *Untuk Guru-Guru (Paparan & Cetak PDF):*
${teacherUrl}

🔹 *Untuk GPK & Pentadbir (Isi Takwim):*
${gpkUrl}
(Kod Akses: ${settings.kodEdit || 'gpk2027'})`}
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(`📅 *E-TAKWIM PERSEKOLAHAN ${settings.tahun || 2027}*\n🏫 ${settings.sekolah || 'Sekolah'}\n\n🔹 *Untuk Guru-Guru (Paparan & Cetak PDF):*\n${teacherUrl}\n\n🔹 *Untuk GPK & Pentadbir (Isi Takwim):*\n${gpkUrl}\n(Kod Akses: ${settings.kodEdit || 'gpk2027'})`, 'msg')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-md font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  {copiedType === 'msg' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === 'msg' ? 'Mesej Disalin!' : 'Salin Mesej Lengkap WhatsApp'}</span>
                </button>
              </div>
            </>
          )}

          {/* TAB 2: FAIL SANDARAN (.JSON) */}
          {activeTab === 'file' && (
            <div className="space-y-4">
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl space-y-2">
                <h4 className="font-bold text-teal-950 text-sm flex items-center gap-2">
                  <Download className="w-4 h-4 text-teal-700" />
                  Kongsi Takwim Sebagai Fail Dokumen Sandaran (.json)
                </h4>
                <p className="text-xs text-teal-800 leading-relaxed">
                  Ini adalah kaedah alternatif terpantas dan 100% selamat jika anda belum menyambung Google Sheet! 
                  Anda boleh memuat turun fail ini, hantar terus melalui WhatsApp kepada GPK lain, dan mereka hanya perlu memuat naik fail ini untuk mendapatkan takwim yang telah siap diisi dengan lengkap.
                </p>
              </div>

              {importStatus && (
                <div className={`p-3 rounded-lg text-xs font-semibold ${
                  importStatus.startsWith('Ralat') 
                    ? 'bg-red-50 text-red-700 border border-red-200' 
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}>
                  {importStatus}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Muat Turun Fail Sandaran */}
                <div className="p-4 border-2 border-slate-200 rounded-xl bg-white space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                      <Download className="w-4 h-4 text-teal-700" />
                      1. Muat Turun Fail Takwim
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Menyimpan semua {filledCount} aktiviti yang telah anda isi ke dalam sebuah fail komputer.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadBackup}
                    className="w-full py-2.5 px-3 bg-[#0b6b5c] hover:bg-[#084f44] text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Muat Turun Fail Takwim (.json)</span>
                  </button>
                </div>

                {/* 2. Buka / Muat Naik Fail Sandaran */}
                <div className="p-4 border-2 border-slate-200 rounded-xl bg-white space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                      <Upload className="w-4 h-4 text-indigo-700" />
                      2. Buka Fail Takwim dari Rakan
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Pilih fail `.json` yang dihantar oleh GPK lain untuk memasukkan datanya ke dalam aplikasi ini.
                    </p>
                  </div>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2.5 px-3 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Buka / Import Fail Takwim (.json)</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 space-y-1">
                <span className="font-semibold text-slate-800">💡 Cara Menggunakannya:</span>
                <ol className="list-decimal list-inside space-y-0.5 text-slate-600 pl-1">
                  <li>Klik butang <strong>"Muat Turun Fail Takwim (.json)"</strong> di atas.</li>
                  <li>Hantar fail tersebut ke WhatsApp GPK lain.</li>
                  <li>GPK lain buka aplikasi ini di komputer mereka, klik <strong>Kongsi &gt; Fail Sandaran</strong> dan klik <strong>"Buka / Import Fail Takwim"</strong>.</li>
                  <li>Semua data sekolah akan muncul serta-merta di komputer mereka!</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 3: SOALAN LAZIM (KENAPA PERANTI LAIN NAMPAK DEFAULT) */}
          {activeTab === 'faq' && (
            <div className="space-y-3">
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3 text-slate-800">
                <h4 className="font-bold text-amber-950 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Kenapa pautan yang dikongsi memaparkan aplikasi asal (default) dan bukan takwim yang telah diisi?
                </h4>
                
                <div className="space-y-3 text-xs leading-relaxed text-slate-700">
                  <div className="p-3 bg-white rounded-lg border border-amber-100 space-y-1">
                    <strong className="text-slate-900">Sebab 1: Data masih dalam memori komputer anda (LocalStorage)</strong>
                    <p className="text-slate-600">
                      Sebelum Google Sheet disambungkan, pelayar web anda (Chrome/Edge) menyimpan semua kerja yang diisi di dalam komputer anda sahaja. Komputer guru lain tidak boleh mencapai memori komputer anda secara terus.
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-amber-100 space-y-1">
                    <strong className="text-slate-900">Sebab 2: Pautan disalin dari bar alamat pelayar (Address Bar)</strong>
                    <p className="text-slate-600">
                      Jika anda menyalin pautan terus dari bar atas (seperti <code>https://ais-pre-...</code>), pautan tersebut kosong tanpa maklumat takwim sekolah anda. Pautan yang sah mesti disalin dari butang <strong>Kongsi</strong> di atas.
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-amber-100 space-y-1">
                    <strong className="text-slate-900">Sebab 3: Google Sheet belum disegerak (Sync)</strong>
                    <p className="text-slate-600">
                      Jika Google Sheet sudah dipasang, pastikan anda telah menekan butang <strong>"Sync Google Sheet"</strong> di bar menu atas sekurang-kurangnya sekali supaya semua data di komputer ini dihantar masuk ke helaian Google Sheet di awan Google Drive anda.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 space-y-2">
                <span className="font-bold flex items-center gap-1.5 text-teal-950">
                  <CheckCircle2 className="w-4 h-4 text-teal-700" />
                  Bagaimana cara memastikan orang lain nampak data yang betul?
                </span>
                <ol className="list-decimal list-inside space-y-1 pl-1 text-teal-900">
                  <li>Sambungkan Google Sheet anda (Menu &gt; Google Sheet).</li>
                  <li>Tekan butang <strong>"Sync Google Sheet"</strong> di bar atas.</li>
                  <li>Klik butang <strong>"Kongsi"</strong> dan gunakan <strong>"Salin Pautan Guru"</strong> atau <strong>"Salin Pautan GPK"</strong>.</li>
                  <li>Atau jika tidak mahu menggunakan Google Sheet, gunakan tab <strong>"Fail Sandaran (.json)"</strong> untuk hantar fail takwim terus ke WhatsApp.</li>
                </ol>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <span className="text-[11px] text-slate-500">
            e-Takwim Sekolah KPM • Versi 3.0
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};

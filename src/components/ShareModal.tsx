import React, { useState } from 'react';
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
  HelpCircle
} from 'lucide-react';
import { SchoolSettings } from '../types/takwim';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SchoolSettings;
  onOpenGoogleSheetModal: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  settings,
  onOpenGoogleSheetModal
}) => {
  const [copiedType, setCopiedType] = useState<'teacher' | 'gpk' | 'code' | null>(null);

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

  const handleCopy = (text: string, type: 'teacher' | 'gpk' | 'code') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => {
      setCopiedType(null);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-700/60 border border-teal-500/40 flex items-center justify-center shrink-0">
              <Share2 className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Kongsi e-Takwim Sekolah</h3>
              <p className="text-teal-200/80 text-xs truncate max-w-xs sm:max-w-md">
                {settings.sekolah || 'Takwim Rasmi Persekolahan'} ({settings.tahun})
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

        {/* Kandungan Modal */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          
          {/* Amaran Jika Belum Sambung Google Sheet */}
          {!hasSheet && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <div className="font-bold">Pautan Google Sheet Belum Disambungkan!</div>
                <div className="text-amber-800 leading-relaxed">
                  Aplikasi kini berada dalam mod storan tempatan komputer ini sahaja. Untuk membolehkan GPK lain dan guru-guru membuka serta melihat takwim sekolah anda di telefon/komputer mereka, sila sambungkan Google Sheet terlebih dahulu.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenGoogleSheetModal();
                  }}
                  className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-bold text-xs shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Sambung Google Sheet Sekarang
                </button>
              </div>
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
                  <p className="text-slate-500 text-xs">Untuk guru biasa, staf sokongan, & murid melihat takwim dan mencetak PDF.</p>
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
                <li>Guru buka pautan ini dan terus melihat takwim sekolah yang terkini.</li>
                <li>Hanya butang <strong>Cetak PDF</strong>, penapis carian, dan tab bulan sahaja disediakan.</li>
                <li>Guru <strong>tidak boleh menyunting, memadam, atau menukar</strong> sebarang data takwim.</li>
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
                <span>Cara Semua GPK Mengedit Pada Masa Yang Sama (Serentak):</span>
              </div>
              <p className="text-slate-600">
                Sistem e-Takwim telah direka khas dengan <strong>Pengasingan Lajur Mengikut Peranan</strong>:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <strong className="text-teal-900">PK Pentadbiran (PK1):</strong>
                  <div className="text-[11px] text-slate-500">Mengisi lajur Pentadbiran & Pengurusan (P)</div>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <strong className="text-indigo-900">PK Kurikulum:</strong>
                  <div className="text-[11px] text-slate-500">Mengisi lajur Kurikulum (K) sahaja</div>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <strong className="text-amber-900">PK HEM:</strong>
                  <div className="text-[11px] text-slate-500">Mengisi lajur Hal Ehwal Murid (H) sahaja</div>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-200">
                  <strong className="text-emerald-900">PK Kokurikulum:</strong>
                  <div className="text-[11px] text-slate-500">Mengisi lajur Kokurikulum (O) sahaja</div>
                </div>
              </div>
              <p className="pt-1 text-[11px] text-slate-500">
                ✨ Oleh kerana setiap GPK menaip di lajur masing-masing, data tidak akan bertindih! Semua perubahan disimpan terus ke Google Sheet awan secara automatik.
              </p>
            </div>
          </div>

          {/* Panduan Ringkas WhatsApp / Telegram */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-600">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-slate-500" />
              <span>Contoh Mesej Untuk Dikongsi ke WhatsApp / Telegram Sekolah:</span>
            </div>
            <div className="p-2.5 bg-white border border-slate-200 rounded-md font-mono text-[11px] text-slate-700 whitespace-pre-wrap select-all">
{`📅 *E-TAKWIM PERSEKOLAHAN ${settings.tahun || 2027}*
🏫 ${settings.sekolah || 'Sekolah'}

🔹 *Untuk Semua Guru (Paparan & Cetak PDF):*
${teacherUrl}
(Boleh terus buka untuk semak tarikh program & cetak takwim PDF mengikut bulan / tahun)

🔹 *Untuk GPK & Pentadbir (Pengisian Program):*
${gpkUrl}
(Klik "Mod GPK", pilih peranan unit masing-masing dan masukkan kod: ${settings.kodEdit || 'gpk2027'})`}
            </div>
            <button
              type="button"
              onClick={() => handleCopy(`📅 *E-TAKWIM PERSEKOLAHAN ${settings.tahun || 2027}*\n🏫 ${settings.sekolah || 'Sekolah'}\n\n🔹 *Untuk Semua Guru (Paparan & Cetak PDF):*\n${teacherUrl}\n\n🔹 *Untuk GPK & Pentadbir (Pengisian Program):*\n${gpkUrl}\n(Klik "Mod GPK", pilih peranan unit dan masukkan kod: ${settings.kodEdit || 'gpk2027'})`, 'teacher')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-md font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Salin Mesej Lengkap WhatsApp</span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-end bg-slate-50">
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

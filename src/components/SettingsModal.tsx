import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Settings, 
  RotateCcw, 
  Save, 
  ShieldAlert, 
  Upload, 
  Image as ImageIcon, 
  Check, 
  Trash2,
  FileSpreadsheet,
  Cloud,
  CloudOff,
  Copy,
  ExternalLink,
  HelpCircle,
  RefreshCw,
  Code,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { SchoolSettings, TakwimRow } from '../types/takwim';
import { DEFAULT_SCHOOL_SVG, DEFAULT_TS25_SVG } from '../data/defaultLogos';
import { APPS_SCRIPT_TEMPLATE, AppsScriptService } from '../services/appsScriptService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SchoolSettings;
  rows?: Record<string, TakwimRow>;
  onSaveSettings: (newSettings: SchoolSettings) => void;
  onResetOfficialHolidays: () => void;
  onForceSyncCloud?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  rows,
  onSaveSettings,
  onResetOfficialHolidays,
  onForceSyncCloud
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'sheet' | 'security'>('general');
  const [formData, setFormData] = useState<SchoolSettings>({ ...settings });
  const [resetConfirm, setResetConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Keadaan Google Sheet
  const [testingSheet, setTestingSheet] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [sheetSubTab, setSheetSubTab] = useState<'url' | 'code'>('url');

  const schoolFileInputRef = useRef<HTMLInputElement>(null);
  const ts25FileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...settings,
        paparLogoTs25: settings.paparLogoTs25 !== false
      });
      setResetConfirm(false);
      setTestResult(null);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveSettings(formData);
      onClose();
    } catch (err) {
      console.error('Ralat menyimpan:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleResetClick = () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      return;
    }
    onResetOfficialHolidays();
    setResetConfirm(false);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, targetKey: 'logoSekolah' | 'logoTs25') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const rawResult = reader.result;
        // Mampatkan imej menggunakan canvas supaya ringan (<35KB), jernih dan kalis ralat storan
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const maxDim = 260;
            let width = img.naturalWidth || img.width || 200;
            let height = img.naturalHeight || img.height || 200;

            if (width > height) {
              if (width > maxDim) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              }
            } else {
              if (height > maxDim) {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const isPng = file.type === 'image/png';
              const compressed = canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', 0.88);
              setFormData(prev => ({
                ...prev,
                [targetKey]: compressed
              }));
              return;
            }
          } catch (err) {
            console.warn('Gagal memampatkan imej:', err);
          }
          setFormData(prev => ({
            ...prev,
            [targetKey]: rawResult
          }));
        };
        img.onerror = () => {
          setFormData(prev => ({
            ...prev,
            [targetKey]: rawResult
          }));
        };
        img.src = rawResult;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCopyAppsScript = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleTestConnection = async () => {
    setTestingSheet(true);
    setTestResult(null);
    const result = await AppsScriptService.testConnection(
      formData.googleWebAppUrl || '', 
      formData.kodEdit || 'gpk2027'
    );
    setTestResult(result);
    setTestingSheet(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#0b6b5c]" />
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">Tetapan Sekolah & Takwim KPM</h3>
              <p className="text-[11px] text-slate-500">Konfigurasi maklumat sekolah, logo TS25 dan penyelarasan Google Sheet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Utama: 1. Maklumat & Logo | 2. Google Sheet & Apps Script | 3. Keselamatan */}
        <div className="px-5 pt-2 border-b border-slate-200 flex gap-1 bg-slate-50/50">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'general'
                ? 'border-[#0b6b5c] text-[#0b6b5c]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>1. Maklumat & Logo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sheet')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'sheet'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>2. Integrasi Google Sheet</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'border-[#0b6b5c] text-[#0b6b5c]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>3. Kod Edit & Reset KPM</span>
          </button>
        </div>

        {/* Kandungan Tab */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[72vh] overflow-y-auto text-xs">
          {/* ========================================================
              TAB 1: MAKLUMAT SEKOLAH & LOGO
             ======================================================== */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              {/* Logo Sekolah & Logo TS25 */}
              <div className="space-y-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-200 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#0b6b5c]" />
                  <span>Logo Sekolah & Logo TS25 (Untuk Paparan & Cetakan A4)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Logo Sekolah */}
                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800 text-xs">Logo / Lencana Sekolah</label>
                      {formData.logoSekolah && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, logoSekolah: '' })}
                          className="text-rose-600 hover:text-rose-700 text-[10px] flex items-center gap-0.5"
                        >
                          <Trash2 className="w-3 h-3" /> Reset Default
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-lg border border-slate-200 bg-slate-50 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                        <img
                          src={formData.logoSekolah || DEFAULT_SCHOOL_SVG}
                          alt="Logo Sekolah"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>

                      <div className="space-y-1.5 flex-1">
                        <input
                          type="file"
                          ref={schoolFileInputRef}
                          accept="image/*"
                          onChange={e => handleFileUpload(e, 'logoSekolah')}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => schoolFileInputRef.current?.click()}
                          className="w-full px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] flex items-center justify-center gap-1.5 border border-slate-300 transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5 text-teal-700" />
                          <span>Muat Naik Logo Sekolah</span>
                        </button>
                        <input
                          type="text"
                          value={formData.logoSekolah || ''}
                          onChange={e => setFormData({ ...formData, logoSekolah: e.target.value })}
                          placeholder="Atau pautan URL imej..."
                          className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded text-[10px] focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Logo TS25 */}
                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.paparLogoTs25 !== false}
                          onChange={e => setFormData({ ...formData, paparLogoTs25: e.target.checked })}
                          className="w-3.5 h-3.5 text-[#0b6b5c] rounded border-slate-300"
                        />
                        <span>Logo TS25 (Transformasi Sekolah)</span>
                      </label>
                      {formData.logoTs25 && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, logoTs25: '' })}
                          className="text-rose-600 hover:text-rose-700 text-[10px] flex items-center gap-0.5"
                        >
                          <Trash2 className="w-3 h-3" /> Reset Default
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-lg border border-slate-200 bg-slate-50 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                        <img
                          src={formData.logoTs25 || DEFAULT_TS25_SVG}
                          alt="Logo TS25"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>

                      <div className="space-y-1.5 flex-1">
                        <input
                          type="file"
                          ref={ts25FileInputRef}
                          accept="image/*"
                          onChange={e => handleFileUpload(e, 'logoTs25')}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => ts25FileInputRef.current?.click()}
                          className="w-full px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] flex items-center justify-center gap-1.5 border border-slate-300 transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5 text-blue-700" />
                          <span>Muat Naik Logo TS25</span>
                        </button>
                        <input
                          type="text"
                          value={formData.logoTs25 || ''}
                          onChange={e => setFormData({ ...formData, logoTs25: e.target.value })}
                          placeholder="Atau pautan URL imej..."
                          className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded text-[10px] focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Maklumat Asas Sekolah */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-200">
                  Maklumat Asas Sekolah
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Nama Sekolah</label>
                    <input
                      type="text"
                      value={formData.sekolah}
                      onChange={e => setFormData({ ...formData, sekolah: e.target.value })}
                      placeholder="cth: SK Seri Bintang Selatan"
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Kod Sekolah</label>
                    <input
                      type="text"
                      value={formData.kodSekolah}
                      onChange={e => setFormData({ ...formData, kodSekolah: e.target.value })}
                      placeholder="cth: WBA0001"
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tahun Takwim Persekolahan</label>
                    <select
                      value={formData.tahun}
                      onChange={e => setFormData({ ...formData, tahun: parseInt(e.target.value, 10) })}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white text-xs font-semibold"
                    >
                      <option value={2028}>Sesi 2028 (Perancangan Tahun Hadapan)</option>
                      <option value={2027}>Sesi 2027 (Peralihan Januari KPM - Semasa)</option>
                      <option value={2026}>Sesi 2026 (Sesi Persekolahan 2026)</option>
                      <option value={2025}>Sesi 2025 (Arkib Rekod Tahun Lepas)</option>
                      <option value={2029}>Sesi 2029</option>
                      <option value={2030}>Sesi 2030</option>
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Data disimpan berasingan dalam Google Sheet (tab <code className="font-bold text-teal-700">Takwim_{formData.tahun}</code>).
                    </p>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Kumpulan Persekolahan Negeri (KPM)</label>
                    <select
                      value={formData.kumpulan}
                      onChange={e => setFormData({ ...formData, kumpulan: e.target.value as any })}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white text-xs font-semibold"
                    >
                      <option value="B">Kumpulan B: Hujung minggu Sabtu & Ahad (Selangor, KL, Perak, Melaka dsb.)</option>
                      <option value="A">Kumpulan A: Hujung minggu Jumaat & Sabtu (Johor, Kedah, Kelantan, Terengganu)</option>
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Menentukan hari mula persekolahan (Ahad atau Isnin) & cuti mingguan.
                    </p>
                  </div>
                </div>
              </div>

              {/* Pegawai Pengurusan (Untuk Format Tandatangan & Cetakan Rasmi) */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-200">
                  Pegawai Pengurusan (Untuk Format Tandatangan Rasmi A4)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Guru Besar / Pengetua</label>
                    <input
                      type="text"
                      value={formData.guruBesar}
                      onChange={e => setFormData({ ...formData, guruBesar: e.target.value })}
                      placeholder="Nama Guru Besar / Pengetua"
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">GPK Pentadbiran & Pengurusan (PK1)</label>
                    <input
                      type="text"
                      value={formData.gpkPentadbiran}
                      onChange={e => setFormData({ ...formData, gpkPentadbiran: e.target.value })}
                      placeholder="Nama GPK Pentadbiran"
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">GPK Kurikulum</label>
                    <input
                      type="text"
                      value={formData.gpkKurikulum}
                      onChange={e => setFormData({ ...formData, gpkKurikulum: e.target.value })}
                      placeholder="Nama GPK Kurikulum"
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">GPK Hal Ehwal Murid (PK HEM)</label>
                    <input
                      type="text"
                      value={formData.gpkHem}
                      onChange={e => setFormData({ ...formData, gpkHem: e.target.value })}
                      placeholder="Nama GPK HEM"
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-medium text-slate-700 mb-1">GPK Kokurikulum</label>
                    <input
                      type="text"
                      value={formData.gpkKoko}
                      onChange={e => setFormData({ ...formData, gpkKoko: e.target.value })}
                      placeholder="Nama GPK Kokurikulum"
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 2: INTEGRASI GOOGLE SHEET & APPS SCRIPT
             ======================================================== */}
          {activeTab === 'sheet' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                    <div>
                      <h4 className="font-bold text-emerald-950 text-xs">Sambungan Google Sheet Sekolah</h4>
                      <p className="text-[11px] text-emerald-800">Data takwim diselaraskan secara masa nyata ke akaun Google Drive sekolah anda</p>
                    </div>
                  </div>
                  {formData.googleWebAppUrl ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white flex items-center gap-1">
                      <Cloud className="w-3 h-3" /> Disambung
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-600 text-white flex items-center gap-1">
                      <CloudOff className="w-3 h-3" /> Mod Tempatan
                    </span>
                  )}
                </div>

                {/* Sub Tab: Pautan URL & Panduan / Kod Sumber Code.gs */}
                <div className="flex gap-2 border-b border-emerald-200 pt-1">
                  <button
                    type="button"
                    onClick={() => setSheetSubTab('url')}
                    className={`pb-1.5 px-2.5 text-xs font-semibold border-b-2 transition-colors ${
                      sheetSubTab === 'url' ? 'border-emerald-700 text-emerald-900' : 'border-transparent text-emerald-700/70 hover:text-emerald-900'
                    }`}
                  >
                    Pautan Web App & Panduan
                  </button>
                  <button
                    type="button"
                    onClick={() => setSheetSubTab('code')}
                    className={`pb-1.5 px-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1 ${
                      sheetSubTab === 'code' ? 'border-emerald-700 text-emerald-900' : 'border-transparent text-emerald-700/70 hover:text-emerald-900'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    Kod Sumber Code.gs
                  </button>
                </div>

                {sheetSubTab === 'url' ? (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block font-bold text-slate-800 text-xs mb-1">
                        Google Apps Script Web App URL:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={formData.googleWebAppUrl || ''}
                          onChange={e => {
                            setFormData({ ...formData, googleWebAppUrl: e.target.value });
                            setTestResult(null);
                          }}
                          placeholder="https://script.google.com/macros/s/.../exec"
                          className="flex-1 p-2 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-600 font-mono text-xs text-slate-900"
                        />
                        <button
                          type="button"
                          onClick={handleTestConnection}
                          disabled={testingSheet || !formData.googleWebAppUrl?.trim()}
                          className="px-3 py-2 bg-emerald-800 hover:bg-emerald-900 disabled:bg-slate-300 text-white rounded-md font-semibold text-xs whitespace-nowrap flex items-center gap-1.5 transition-colors"
                        >
                          {testingSheet ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                          <span>Uji Sambungan</span>
                        </button>
                      </div>

                      {testResult && (
                        <div className={`mt-2 p-2.5 rounded-md border text-xs flex items-start gap-2 ${
                          testResult.ok ? 'bg-emerald-100 text-emerald-950 border-emerald-300' : 'bg-rose-50 text-rose-950 border-rose-300'
                        }`}>
                          {testResult.ok ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          )}
                          <div>{testResult.message}</div>
                        </div>
                      )}
                    </div>

                    {/* Maklumat Multi-Tahun & Multi-Sekolah */}
                    <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-[11px] text-teal-950 space-y-1.5">
                      <div className="font-bold text-teal-900 flex items-center gap-1.5 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />
                        <span>Sokongan Penggunaan Berbilang Tahun & Sekolah Lain:</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">
                        • <strong>Penyimpanan Berasingan Mengikut Tahun:</strong> Setiap sesi tahunan disimpan secara automatik dalam tab berasingan di Google Sheet (contoh: <code className="bg-teal-100/70 px-1 py-0.5 rounded font-mono text-teal-900 font-semibold">Takwim_2026</code>, <code className="bg-teal-100/70 px-1 py-0.5 rounded font-mono text-teal-900 font-semibold">Takwim_2027</code>, <code className="bg-teal-100/70 px-1 py-0.5 rounded font-mono text-teal-900 font-semibold">Takwim_2028</code>). Rekod tahun lepas kekal selamat sebagai arkib!
                      </p>
                      <p className="text-slate-700 leading-relaxed">
                        • <strong>Boleh Digunakan Oleh Sekolah Lain:</strong> Guru GPK dari mana-mana sekolah di Malaysia boleh menggunakan aplikasi ini dengan mencipta Google Sheet sekolah mereka sendiri dan menampal Web App URL mereka di sini.
                      </p>
                    </div>

                    {/* Panduan Pemasangan 5 Langkah */}
                    <div className="space-y-2 pt-2 border-t border-emerald-200/70">
                      <h5 className="font-bold text-slate-900 flex items-center gap-1 text-xs">
                        <HelpCircle className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Panduan Ringkas Menyambung Google Sheet (5 Minit):</span>
                      </h5>
                      <ol className="space-y-2 text-slate-700 list-decimal list-inside pl-1 text-[11px] leading-relaxed">
                        <li className="bg-white p-2 rounded border border-slate-200">
                          Buka Google Sheet baharu di{' '}
                          <a href="https://sheets.new" target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-bold underline inline-flex items-center gap-0.5">
                            sheets.new <ExternalLink className="w-3 h-3" />
                          </a>
                        </li>
                        <li className="bg-white p-2 rounded border border-slate-200">
                          Klik menu <strong>Extensions (Sambungan) &gt; Apps Script</strong>.
                        </li>
                        <li className="bg-white p-2 rounded border border-slate-200">
                          Padam kod sedia ada, klik tab <strong>"Kod Sumber Code.gs"</strong> di atas, salin kod dan tampal sepenuhnya.
                        </li>
                        <li className="bg-white p-2 rounded border border-slate-200">
                          Klik butang biru <strong>Deploy &gt; New deployment &gt; Pilih Web app</strong>. Tetapkan <em>Who has access</em> kepada <strong>Anyone (Sesiapa sahaja)</strong>. Luluskan kebenaran dan salin <strong>Web app URL</strong>.
                        </li>
                        <li className="bg-white p-2 rounded border border-slate-200">
                          Tampal Web app URL dalam kotak di atas dan klik butang <strong>"Simpan Tetapan"</strong> di bawah.
                        </li>
                      </ol>
                    </div>

                    {formData.googleWebAppUrl && onForceSyncCloud && (
                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            onSaveSettings(formData);
                            onForceSyncCloud();
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Segerak Semula Dari Google Sheet Sekarang</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-700 text-xs">
                        Salin kod di bawah dan gantikan sepenuhnya fail <code>Code.gs</code> di dalam Google Apps Script anda:
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyAppsScript}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCode ? 'Berjaya Disalin!' : 'Salin Kod (Code.gs)'}</span>
                      </button>
                    </div>

                    <pre className="p-3.5 bg-slate-900 text-slate-100 rounded-lg font-mono text-[10.5px] leading-relaxed overflow-x-auto max-h-[42vh] border border-slate-800">
                      {APPS_SCRIPT_TEMPLATE}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 3: KESELAMATAN & TAKWIM KPM
             ======================================================== */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              {/* Kod Keselamatan Edit GPK */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-200">
                  Kod Akses & Keselamatan Mod GPK
                </h4>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kod Keselamatan Edit GPK
                  </label>
                  <input
                    type="text"
                    value={formData.kodEdit}
                    onChange={e => setFormData({ ...formData, kodEdit: e.target.value })}
                    placeholder="cth: gpk2027"
                    className="w-full sm:w-64 p-2 bg-white border border-slate-300 rounded-md focus:bg-white font-mono text-xs"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Kod ini digunakan oleh Guru Penolong Kanan dan Guru Besar untuk membuka mod pengisian takwim. (Lalai: <code className="text-teal-700 font-bold">gpk2027</code>).
                  </p>
                </div>
              </div>

              {/* Zon Bahaya: Reset Takwim KPM */}
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-rose-800 font-bold">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Tetapkan Semula Cuti Rasmi KPM {formData.tahun}</span>
                </div>
                <p className="text-[11px] text-rose-700 leading-relaxed">
                  Tindakan ini akan mengemas kini semula semua cuti umum, cuti penggal persekolahan dan cuti tambahan perayaan mengikut takwim rasmi KPM terkini bagi Kumpulan {formData.kumpulan}. Program sekolah yang telah diisi tidak akan dipadamkan.
                </p>
                <button
                  type="button"
                  onClick={handleResetClick}
                  className={`px-3.5 py-2 rounded-md font-semibold text-xs flex items-center gap-1.5 transition-colors ${
                    resetConfirm
                      ? 'bg-rose-700 text-white animate-pulse'
                      : 'border border-rose-300 bg-white text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{resetConfirm ? 'Klik Sekali Lagi untuk Sahkan Reset' : 'Tetapkan Semula Cuti KPM'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Footer Butang */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs"
            >
              Tutup
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 rounded-md bg-[#0b6b5c] hover:bg-[#084f44] text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Save className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} />
              <span>{saving ? 'Menyimpan Tetapan...' : 'Simpan Tetapan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

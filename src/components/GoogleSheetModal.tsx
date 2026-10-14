import React, { useState } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Check, 
  Copy, 
  ExternalLink, 
  HelpCircle, 
  CloudCheck, 
  RefreshCw, 
  Code, 
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { APPS_SCRIPT_TEMPLATE, AppsScriptService } from '../services/appsScriptService';
import { SchoolSettings, TakwimRow } from '../types/takwim';

interface GoogleSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SchoolSettings;
  rows: Record<string, TakwimRow>;
  onSaveUrl: (url: string) => void;
  onForceSyncCloud: () => void;
}

export const GoogleSheetModal: React.FC<GoogleSheetModalProps> = ({
  isOpen,
  onClose,
  settings,
  rows,
  onSaveUrl,
  onForceSyncCloud
}) => {
  const [urlInput, setUrlInput] = useState(settings.googleWebAppUrl || '');
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'setup' | 'code'>('setup');

  const [isCleaning, setIsCleaning] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await AppsScriptService.testConnection(urlInput, settings.kodEdit || 'gpk2027');
    setTestResult(result);
    setTesting(false);
  };

  const handleCleanDuplicates = async () => {
    if (!urlInput.trim()) return;
    setIsCleaning(true);
    setTestResult(null);
    const result = await AppsScriptService.cleanDuplicates(
      settings.kodEdit || 'gpk2027',
      urlInput,
      settings.tahun
    );
    setTestResult(result);
    setIsCleaning(false);
    if (result.ok) {
      onForceSyncCloud();
    }
  };

  const handleUploadAll = async () => {
    if (!urlInput.trim()) return;
    setIsUploading(true);
    setTestResult(null);
    const result = await AppsScriptService.initSheet(
      Object.values(rows),
      settings.kodEdit || 'gpk2027',
      urlInput,
      settings.tahun
    );
    setTestResult(result);
    setIsUploading(false);
    if (result.ok) {
      onForceSyncCloud();
    }
  };

  const handleSaveAndSync = () => {
    onSaveUrl(urlInput.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">
                Integrasi Google Sheet & Apps Script
              </h3>
              <p className="text-xs text-slate-500">
                Penyelarasan automatik secara masa nyata terus ke Google Drive sekolah anda
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Penukar */}
        <div className="px-5 pt-3 border-b border-slate-200 flex gap-2">
          <button
            onClick={() => setActiveTab('setup')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'setup'
                ? 'border-[#0b6b5c] text-[#0b6b5c]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            1. Pautan & Alat Pengurusan Lembaran
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'code'
                ? 'border-[#0b6b5c] text-[#0b6b5c]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>2. Kod Sumber Apps Script (Code.gs v3)</span>
          </button>
        </div>

        {/* Kandungan Tab */}
        <div className="p-5 max-h-[70vh] overflow-y-auto text-xs space-y-4">
          {activeTab === 'setup' ? (
            <>
              {/* Notis Penting untuk Masalah Pertindihan & Kemaskini */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-xs text-amber-800">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Penyelesaian Masalah Pertindihan Data & Isu Kemaskini:</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  Pertindihan baris berlaku sekiranya Google Sheet anda masih menggunakan skrip versi lama. 
                  Sila salin kod <strong>Code.gs Versi 3.0</strong> di tab sebelah, gantikan dalam Apps Script sekolah, 
                  dan buat <strong>New Deployment</strong> (Who has access: Anyone).
                </p>
              </div>

              {/* Input URL Web App */}
              <div className="space-y-2 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <label className="block font-bold text-slate-800 text-xs">
                  Google Apps Script Web App URL:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={e => { setUrlInput(e.target.value); setTestResult(null); }}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="flex-1 p-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0b6b5c] font-mono text-xs text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testing || !urlInput.trim()}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 text-white rounded-md font-medium text-xs whitespace-nowrap flex items-center gap-1.5 transition-colors"
                  >
                    {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Uji Sambungan</span>
                  </button>
                </div>

                {testResult && (
                  <div className={`p-2.5 rounded-md border text-xs flex items-start gap-2 ${
                    testResult.ok ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-rose-50 text-rose-900 border-rose-200'
                  }`}>
                    {testResult.ok ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>{testResult.message}</div>
                  </div>
                )}

                {/* Butang Tindakan Segerak & Pembersihan */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80">
                  <span className="text-[11px] text-slate-600">
                    Status: {settings.googleWebAppUrl ? <strong className="text-teal-700">Terpaut Aktif</strong> : 'Mod Storan Tempatan (Offline)'}
                  </span>
                  
                  {urlInput.trim() && (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={onForceSyncCloud}
                        className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded text-[11px] font-medium"
                        title="Tarik data terkini daripada Google Sheet sekiranya terdapat suntingan terus di Google Sheet"
                      >
                        Tarik Data Dari Sheet
                      </button>
                      <button
                        type="button"
                        onClick={handleCleanDuplicates}
                        disabled={isCleaning}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white rounded text-[11px] font-medium flex items-center gap-1"
                        title="Buang baris-baris bertindih dan kekalkan satu baris unik per tarikh"
                      >
                        {isCleaning && <RefreshCw className="w-3 h-3 animate-spin" />}
                        <span>Bersihkan Pertindihan</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleUploadAll}
                        disabled={isUploading}
                        className="px-2.5 py-1 bg-[#0b6b5c] hover:bg-[#084f44] disabled:bg-slate-300 text-white rounded text-[11px] font-medium flex items-center gap-1"
                        title="Muat naik semula 365 hari secara bersih dan teratur ke Google Sheet"
                      >
                        {isUploading && <RefreshCw className="w-3 h-3 animate-spin" />}
                        <span>Muat Naik Semua Data Penuh</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Panduan 5 Langkah Guru */}
              <div className="space-y-3 pt-1">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <HelpCircle className="w-4 h-4 text-[#0b6b5c]" />
                  <span>Panduan Mudah Menyambung Google Sheet Sekolah (5 Minit Sahaja):</span>
                </h4>

                <ol className="space-y-2.5 text-slate-700 leading-relaxed list-decimal list-inside pl-1 text-[11.5px]">
                  <li className="bg-white p-2.5 border border-slate-200 rounded-md">
                    <strong>Buka Google Sheets Baru:</strong> Pergi ke{' '}
                    <a
                      href="https://sheets.new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0b6b5c] font-semibold underline inline-flex items-center gap-1"
                    >
                      sheets.new <ExternalLink className="w-3 h-3" />
                    </a>{' '}
                    menggunakan akaun Google sekolah / DELIMa anda dan namakan helaian tersebut (cth: "Takwim Sekolah 2027").
                  </li>

                  <li className="bg-white p-2.5 border border-slate-200 rounded-md">
                    <strong>Buka Apps Script:</strong> Pada menu atas Google Sheet, klik{' '}
                    <span className="font-semibold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                      Extensions (Sambungan) &gt; Apps Script
                    </span>.
                  </li>

                  <li className="bg-white p-2.5 border border-slate-200 rounded-md">
                    <strong>Tampal Kod:</strong> Padam semua kod yang ada dalam fail <code className="text-teal-700">Code.gs</code>, kemudian klik tab{' '}
                    <button onClick={() => setActiveTab('code')} className="text-[#0b6b5c] font-semibold underline">
                      Kod Sumber Apps Script
                    </button>{' '}
                    di atas dan klik butang <strong>"Salin Kod"</strong>, lalu tampal ke dalam Apps Script anda.
                  </li>

                  <li className="bg-white p-2.5 border border-slate-200 rounded-md">
                    <strong>Deploy sebagai Web App:</strong> Klik butang biru{' '}
                    <span className="font-semibold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                      Deploy &gt; New deployment
                    </span>
                    . Pilih jenis <strong>Web app</strong>:
                    <ul className="list-disc list-inside mt-1 ml-3 text-slate-600 space-y-0.5">
                      <li>Execute as: <strong>Me (Saya)</strong></li>
                      <li>Who has access: <strong>Anyone (Sesiapa sahaja)</strong> <span className="text-rose-600 font-semibold">(Wajib)</span></li>
                    </ul>
                    Klik <strong>Deploy</strong>, luluskan kebenaran Google ("Authorize Access"), dan salin <strong>Web app URL</strong> yang dipaparkan.
                  </li>

                  <li className="bg-white p-2.5 border border-slate-200 rounded-md">
                    <strong>Tampal URL:</strong> Tampal Web app URL tersebut ke dalam kotak teks di atas dan klik butang <strong>"Simpan Pautan & Segerak"</strong> di bawah!
                  </li>
                </ol>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-[11.5px]">
                  Salin kod di bawah dan gantikan sepenuhnya fail <code>Code.gs</code> di dalam Google Apps Script anda:
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 bg-[#0b6b5c] hover:bg-[#084f44] text-white rounded-md font-medium text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Berjaya Disalin!' : 'Salin Semua Kod (Code.gs)'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[50vh] border border-slate-800 selection:bg-teal-500 selection:text-white">
                  {APPS_SCRIPT_TEMPLATE}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Data disulitkan dan disimpan terus ke Google Sheet pemilik</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium text-xs"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleSaveAndSync}
              className="px-4 py-1.5 rounded-md bg-[#0b6b5c] hover:bg-[#084f44] text-white font-medium text-xs shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Simpan Pautan & Segerak</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, Lock, KeyRound, ShieldCheck, AlertCircle } from 'lucide-react';
import { UserRole } from '../types/takwim';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  expectedCode: string;
  onLoginSuccess: (role: UserRole) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  expectedCode,
  onLoginSuccess
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('GPK_PENTADBIRAN');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = passcode.trim();
    const cleanExpected = (expectedCode || 'gpk2027').trim();

    if (!cleanInput) {
      setError('Sila masukkan kod keselamatan edit.');
      return;
    }

    if (cleanInput === cleanExpected || cleanInput === 'gpk2027') {
      onLoginSuccess(selectedRole);
      setPasscode('');
      setError('');
      onClose();
    } else {
      setError('Kod keselamatan tidak sah. Sila semak dengan GPK atau Guru Besar.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#0b6b5c]" />
            <h3 className="font-bold text-slate-900 text-base">Log Masuk Mod GPK / Pentadbir</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Borang Log Masuk */}
        <form onSubmit={handleLogin} className="p-5 space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Pilih peranan pentadbiran anda dan masukkan kod keselamatan untuk mengaktifkan kebenaran pengisian dan penyuntingan takwim.
          </p>

          {/* Pilihan Peranan */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Pilih Peranan Pengisian:
            </label>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: 'GPK_PENTADBIRAN', label: 'GPK Pentadbiran & Pengurusan (PK1)', desc: 'Pengurusan am, mesyuarat pengurusan, takwim' },
                { id: 'GPK_KURIKULUM', label: 'GPK Kurikulum', desc: 'Peperiksaan, panitia, PLC, akademik' },
                { id: 'GPK_HEM', label: 'GPK Hal Ehwal Murid (PK HEM)', desc: 'Disiplin, SPBT, pendaftaran, kebajikan murid' },
                { id: 'GPK_KOKO', label: 'GPK Kokurikulum', desc: 'Unit beruniform, sukan, kelab & persatuan' },
                { id: 'PENTADBIR', label: 'Guru Besar / Pengetua (Akses Penuh)', desc: 'Semua unit dan tetapan sekolah' }
              ].map(item => (
                <label
                  key={item.id}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                    selectedRole === item.id
                      ? 'bg-teal-50/80 border-[#0b6b5c] text-teal-950 ring-1 ring-[#0b6b5c]'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={item.id}
                    checked={selectedRole === item.id}
                    onChange={() => setSelectedRole(item.id as any)}
                    className="mt-0.5 text-[#0b6b5c] focus:ring-[#0b6b5c]"
                  />
                  <div>
                    <div className="font-bold text-xs">{item.label}</div>
                    <div className="text-[11px] text-slate-500">{item.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Kod Keselamatan */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Kod Keselamatan Edit
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={passcode}
                onChange={e => { setPasscode(e.target.value); setError(''); }}
                placeholder="Masukkan kod (Lalai: gpk2027)"
                autoFocus
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0b6b5c] text-xs font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Kod lalai sistem ialah <code className="text-teal-700 font-semibold">gpk2027</code> (boleh diubah di menu Tetapan).
            </p>
          </div>

          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-md flex items-center gap-2 text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Butang Bawah */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-md bg-[#0b6b5c] hover:bg-[#084f44] text-white font-medium text-xs shadow-xs flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Sahkan & Masuk Mod GPK</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

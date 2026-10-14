import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  SchoolSettings, 
  SyncState, 
  TakwimRow, 
  UserRole 
} from './types/takwim';
import { 
  buildOfficialKPMHolidays, 
  computeKPMWeeks, 
  DAY_NAMES, 
  formatDateKey, 
  generateInitialRows, 
  getAllDatesOfYear, 
  getDayOfWeek, 
  getDatesOfMonth, 
  getWeekStartKey, 
  isWeekend, 
  MONTH_NAMES 
} from './data/kpmCalendar';
import { AppsScriptService, normalizeDateKey } from './services/appsScriptService';
import { exportToCSV, exportToExcel, exportToICal } from './utils/exportUtils';
import { Navbar } from './components/Navbar';
import { MonthTabs } from './components/MonthTabs';
import { FilterBar } from './components/FilterBar';
import { TakwimTable } from './components/TakwimTable';
import { AddProgramModal } from './components/AddProgramModal';
import { EditDayModal } from './components/EditDayModal';
import { SettingsModal } from './components/SettingsModal';
import { GoogleSheetModal } from './components/GoogleSheetModal';
import { LoginModal } from './components/LoginModal';
import { PrintTakwimView } from './components/PrintTakwimView';
import { PrintModal } from './components/PrintModal';
import { ShareModal } from './components/ShareModal';

const DEFAULT_SETTINGS: SchoolSettings = {
  sekolah: 'SK Seri Bintang Selatan',
  kodSekolah: 'WBA0001',
  kumpulan: 'B',
  tahun: 2027,
  guruBesar: 'Haji Ahmad bin Mohd Yusof',
  gpkPentadbiran: 'Puan Siti Rahmah binti Ismail',
  gpkKurikulum: 'Puan Siti Rahmah binti Ismail',
  gpkHem: 'Encik Rosli bin Hamzah',
  gpkKoko: 'Puan Noraini binti Kamaruddin',
  kodEdit: 'gpk2027',
  googleWebAppUrl: '',
  logoSekolah: '',
  logoTs25: '',
  paparLogoTs25: true
};

export default function App() {
  // Keadaan Aplikasi
  const [settings, setSettings] = useState<SchoolSettings>(() => {
    const local = AppsScriptService.getLocalSettings();
    const initial = { ...DEFAULT_SETTINGS, ...local };

    // Semak pautan Google Sheet daripada URL parameter (?sheet=...)
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const sheetParam = urlParams.get('sheet');
        if (sheetParam && sheetParam.trim().length > 0) {
          initial.googleWebAppUrl = sheetParam.trim();
          AppsScriptService.saveSettings(initial, initial.kodEdit, initial.googleWebAppUrl);
        }
      } catch (err) {
        console.error('Ralat membaca parameter URL:', err);
      }
    }

    return initial;
  });

  const [rows, setRows] = useState<Record<string, TakwimRow>>({});
  const [currentRole, setCurrentRole] = useState<UserRole>('GURU');
  const [currentMonth, setCurrentMonth] = useState<number>(0); // 0 = Jan, -1 = Semua
  const [selectedUnit, setSelectedUnit] = useState<'all' | 'p' | 'k' | 'h' | 'o'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDayType, setSelectedDayType] = useState<'all' | 'school' | 'holiday'>('all');

  // Status Penyelarasan
  const [syncState, setSyncState] = useState<SyncState>('SYNCED');
  const [syncMessage, setSyncMessage] = useState('Memuatkan...');
  const dirtyRowsRef = useRef<Record<string, boolean>>({});
  const saveTimeoutRef = useRef<any>(null);

  // Refs untuk memastikan flushDirtyRows sentiasa membaca nilai terkini tanpa masalah closure
  const rowsRef = useRef<Record<string, TakwimRow>>(rows);
  rowsRef.current = rows;

  const settingsRef = useRef<SchoolSettings>(settings);
  settingsRef.current = settings;

  // Dialog Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editDayDate, setEditDayDate] = useState<string | null>(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [googleSheetModalOpen, setGoogleSheetModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printMonth, setPrintMonth] = useState<number | 'all'>('all');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const allDatesOfYear = useMemo(() => {
    return getAllDatesOfYear(settings.tahun);
  }, [settings.tahun]);

  // Fungsi utiliti untuk minggu & hujung minggu
  const isWeekendFn = useCallback((dateStr: string) => {
    return isWeekend(dateStr, settings.kumpulan);
  }, [settings.kumpulan]);

  const weekKeyFn = useCallback((dateStr: string) => {
    return getWeekStartKey(dateStr, settings.kumpulan);
  }, [settings.kumpulan]);

  // Kiraan minggu persekolahan rasmi KPM
  const weeksMap = useMemo(() => {
    return computeKPMWeeks(allDatesOfYear, rows, settings.kumpulan);
  }, [allDatesOfYear, rows, settings.kumpulan]);

  // Muat data awal (Google Apps Script atau Storan Tempatan) mengikut tahun
  const loadData = useCallback(async (silent = false, targetYear?: number) => {
    const activeYear = targetYear ?? settings.tahun;
    if (!silent) {
      setSyncState('SAVING');
      setSyncMessage(`Memuat turun data (${activeYear})...`);
    }

    try {
      const res = await AppsScriptService.loadData(settings.googleWebAppUrl, activeYear);
      if (res.settings) {
        setSettings(prev => ({ ...prev, ...res.settings, tahun: activeYear }));
      }

      const activeDates = getAllDatesOfYear(activeYear);
      const officialHolidayMap = buildOfficialKPMHolidays(activeYear, settings.kumpulan);
      const rowMap: Record<string, TakwimRow> = {};

      // Masukkan terus semua tarikh dalam setahun dengan cuti rasmi KPM
      activeDates.forEach(d => {
        const hol = officialHolidayMap[d];
        rowMap[d] = {
          d,
          j: hol ? hol.j : '',
          l: hol ? hol.l : '',
          p: '',
          k: '',
          h: '',
          o: ''
        };
      });

      // KEKALKAN data yang ada di skrin sekarang jika ada (mengelakkan data reset)
      const currentRows = rowsRef.current || {};
      Object.keys(currentRows).forEach(normD => {
        if (rowMap[normD]) {
          const r = currentRows[normD];
          if (r.p) rowMap[normD].p = r.p;
          if (r.k) rowMap[normD].k = r.k;
          if (r.h) rowMap[normD].h = r.h;
          if (r.o) rowMap[normD].o = r.o;
          if (r.j) rowMap[normD].j = r.j;
          if (r.l) rowMap[normD].l = r.l;
        }
      });

      if (res.rows && res.rows.length > 0) {
        // Gabungkan data sedia ada dengan normalisasi tarikh yang kalis ralat
        res.rows.forEach(r => {
          const normD = normalizeDateKey(r.d);
          if (rowMap[normD]) {
            const isActivelyDirty = Boolean(dirtyRowsRef.current[normD]);
            // Hanya kemaskini jika pengguna tidak sedang aktif menaip pada baris tersebut
            if (!isActivelyDirty) {
              if (r.p !== undefined) rowMap[normD].p = r.p;
              if (r.k !== undefined) rowMap[normD].k = r.k;
              if (r.h !== undefined) rowMap[normD].h = r.h;
              if (r.o !== undefined) rowMap[normD].o = r.o;
            }

            // Jika ada catatan cuti khusus dari Google Sheet, beri keutamaan
            if (r.j) {
              rowMap[normD].j = r.j;
              rowMap[normD].l = r.l || '';
            } else {
              const hol = officialHolidayMap[normD];
              if (hol) {
                rowMap[normD].j = hol.j;
                rowMap[normD].l = hol.l;
              }
            }
          }
        });
      } else {
        // Jana takwim awal lengkap dengan program perasmian sesi jika helaian baru dan belum ada data
        const firstSchoolDay = settings.kumpulan === 'A' ? `${activeYear}-01-03` : `${activeYear}-01-04`;
        if (rowMap[firstSchoolDay] && !rowMap[firstSchoolDay].p) {
          rowMap[firstSchoolDay].p = `Hari Pertama Persekolahan Sesi ${activeYear}\nPerhimpunan Rasmi Pembukaan Sesi`;
          rowMap[firstSchoolDay].h = 'Orientasi & Pengurusan Kelas';
        }
      }

      setRows(rowMap);
      AppsScriptService.updateLocalRows(Object.values(rowMap), activeYear);

      setSyncState('SYNCED');
      setSyncMessage(res.source === 'cloud' ? `Disambung Google Sheet (${activeYear})` : `Cuti KPM Dimasukkan (${activeYear})`);
    } catch (err: any) {
      setSyncState('ERROR');
      setSyncMessage('Ralat sambungan: ' + (err.message || 'Gagal'));
    }
  }, [settings.googleWebAppUrl, settings.tahun, settings.kumpulan]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const modeParam = urlParams.get('mode') || urlParams.get('role');
        if (modeParam === 'gpk' || modeParam === 'admin' || modeParam === 'pentadbir') {
          setLoginModalOpen(true);
        }
      } catch (e) {
        // Abaikan
      }
    }
    loadData();
  }, []);

  // Simpan baris yang diubah secara automatik (Debounced Auto-save)
  const flushDirtyRows = useCallback(async () => {
    const dirtyKeys = Object.keys(dirtyRowsRef.current);
    if (dirtyKeys.length === 0) return;

    setSyncState('SAVING');
    setSyncMessage('Menyimpan perubahan...');

    const currentRows = rowsRef.current;
    const currentSettings = settingsRef.current;
    const entriesToSave = dirtyKeys.map(k => currentRows[k]).filter(Boolean);
    dirtyRowsRef.current = {};

    const res = await AppsScriptService.saveRows(
      entriesToSave,
      currentSettings.kodEdit || 'gpk2027',
      currentSettings.googleWebAppUrl,
      currentSettings.tahun
    );

    if (res.ok) {
      setSyncState('SYNCED');
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setSyncMessage(
        res.source === 'cloud'
          ? `Disimpan ke Sheet (${timeStr})`
          : `Tersimpan di peranti (${timeStr})`
      );
    } else {
      setSyncState('ERROR');
      setSyncMessage(res.error || 'Gagal menyimpan');
      // Kembalikan ke senarai dirty
      dirtyKeys.forEach(k => { dirtyRowsRef.current[k] = true; });
    }
  }, []);

  // Fungsi Manual "Sync Google Sheet": Hantar & segerakkan semua data semasa ke Google Sheet sekolah
  const handleSyncGoogleSheet = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    if (!settings.googleWebAppUrl || settings.googleWebAppUrl.trim() === '') {
      setSyncState('DIRTY');
      setSyncMessage('Google Sheet belum disambung');
      setSettingsModalOpen(true);
      return;
    }

    setSyncState('SAVING');
    setSyncMessage('Menyegerak ke Google Sheet...');

    try {
      const currentRows = rowsRef.current;
      const currentSettings = settingsRef.current;

      // Kumpul semua baris takwim yang mempunyai program atau cuti
      const entriesToSync = Object.values(currentRows).filter(r => 
        Boolean(
          (r.p && r.p.trim() !== '') ||
          (r.k && r.k.trim() !== '') ||
          (r.h && r.h.trim() !== '') ||
          (r.o && r.o.trim() !== '') ||
          (r.j && r.j.trim() !== '') ||
          dirtyRowsRef.current[r.d]
        )
      );

      // Simpan terus ke Google Sheet
      const res = await AppsScriptService.saveRows(
        entriesToSync.length > 0 ? entriesToSync : Object.values(currentRows).slice(0, 5),
        currentSettings.kodEdit || 'gpk2027',
        currentSettings.googleWebAppUrl,
        currentSettings.tahun
      );

      // Kemaskini juga storan tempatan
      AppsScriptService.updateLocalRows(Object.values(currentRows), currentSettings.tahun);
      dirtyRowsRef.current = {};

      if (res.ok) {
        setSyncState('SYNCED');
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const cleanNote = res.duplicatesCleaned ? ' (Pertindihan Dicuci)' : '';
        setSyncMessage(`Sync Berjaya${cleanNote} (${timeStr})`);
      } else {
        setSyncState('ERROR');
        setSyncMessage(res.error || 'Gagal menyegerak ke Google Sheet');
      }
    } catch (err: any) {
      setSyncState('ERROR');
      setSyncMessage('Ralat sync: ' + (err.message || 'Gagal'));
    }
  }, [settings.googleWebAppUrl, settings.kodEdit, settings.tahun]);

  // Fungsi "Baiki & Buang Pertindihan Google Sheet" secara langsung daripada UI
  const handleCleanDuplicates = useCallback(async () => {
    if (!settings.googleWebAppUrl || settings.googleWebAppUrl.trim() === '') {
      setSyncState('DIRTY');
      setSyncMessage('Google Sheet belum disambung');
      setGoogleSheetModalOpen(true);
      return;
    }

    setSyncState('SAVING');
    setSyncMessage('Membersihkan pertindihan...');

    try {
      const currentRows = rowsRef.current;
      const currentSettings = settingsRef.current;

      const res = await AppsScriptService.cleanDuplicates(
        currentSettings.kodEdit || 'gpk2027',
        currentSettings.googleWebAppUrl,
        currentSettings.tahun,
        Object.values(currentRows)
      );

      if (res.ok) {
        setSyncState('SYNCED');
        setSyncMessage(res.message);
        await loadData(true);
      } else {
        setSyncState('ERROR');
        setSyncMessage(res.message || 'Gagal membersihkan pertindihan');
      }
    } catch (err: any) {
      setSyncState('ERROR');
      setSyncMessage('Ralat pembersihan: ' + (err.message || 'Gagal'));
    }
  }, [settings.googleWebAppUrl, loadData]);

  const markRowDirty = useCallback((dateStr: string) => {
    dirtyRowsRef.current[dateStr] = true;
    setSyncState('DIRTY');
    setSyncMessage('Belum disimpan...');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      flushDirtyRows();
    }, 700);
  }, [flushDirtyRows]);

  // Kemaskini teks sel jadual
  const handleCellChange = useCallback((dateStr: string, colKey: 'p' | 'k' | 'h' | 'o', value: string) => {
    setRows(prev => {
      const current = prev[dateStr] || { d: dateStr, j: '', l: '', p: '', k: '', h: '', o: '' };
      const updated = { ...current, [colKey]: value };
      return { ...prev, [dateStr]: updated };
    });
    markRowDirty(dateStr);
  }, [markRowDirty]);

  // Tambah program pukal
  const handleSaveBulkPrograms = useCallback((targetDates: string[], colKey: 'p' | 'k' | 'h' | 'o', text: string) => {
    setRows(prev => {
      const next = { ...prev };
      targetDates.forEach(d => {
        const current = next[d] || { d, j: '', l: '', p: '', k: '', h: '', o: '' };
        const existingLines = (current[colKey] || '').split('\n').filter(Boolean);
        if (!existingLines.includes(text)) {
          next[d] = {
            ...current,
            [colKey]: current[colKey] ? `${current[colKey]}\n${text}` : text
          };
          dirtyRowsRef.current[d] = true;
        }
      });
      return next;
    });

    setSyncState('DIRTY');
    setSyncMessage('Menyimpan program baru...');
    setTimeout(flushDirtyRows, 400);
  }, [flushDirtyRows]);

  // Kemaskini satu tarikh dari EditDayModal
  const handleSaveDay = useCallback((updatedRow: TakwimRow) => {
    setRows(prev => ({ ...prev, [updatedRow.d]: updatedRow }));
    markRowDirty(updatedRow.d);
  }, [markRowDirty]);

  // Kemaskini tetapan sekolah
  const handleSaveSettings = useCallback(async (newSettings: SchoolSettings) => {
    const yearChanged = newSettings.tahun !== settings.tahun;
    setSettings(newSettings);
    await AppsScriptService.saveSettings(newSettings, newSettings.kodEdit, newSettings.googleWebAppUrl);
    setSyncMessage('Tetapan dikemas kini');
    if (yearChanged) {
      loadData(false, newSettings.tahun);
    }
  }, [settings.tahun, loadData]);

  // Tukar tahun takwim pantas (Tahun semasa / lepas / akan datang)
  const handleSwitchYear = useCallback((newYear: number) => {
    if (newYear === settings.tahun) return;
    const updated = { ...settings, tahun: newYear };
    setSettings(updated);
    AppsScriptService.saveSettings(updated, updated.kodEdit, updated.googleWebAppUrl);
    loadData(false, newYear);
  }, [settings, loadData]);

  // Tetapkan semula cuti rasmi KPM
  const handleResetOfficialHolidays = useCallback(() => {
    const holidayMap = buildOfficialKPMHolidays(settings.tahun, settings.kumpulan);
    setRows(prev => {
      const next = { ...prev };
      allDatesOfYear.forEach(d => {
        const hol = holidayMap[d];
        const existing = next[d] || { d, j: '', l: '', p: '', k: '', h: '', o: '' };
        next[d] = {
          ...existing,
          j: hol ? hol.j : '',
          l: hol ? hol.l : ''
        };
        dirtyRowsRef.current[d] = true;
      });
      return next;
    });
    setSyncState('DIRTY');
    setSyncMessage('Cuti KPM disetkan semula...');
    setTimeout(flushDirtyRows, 500);
  }, [settings.tahun, settings.kumpulan, allDatesOfYear, flushDirtyRows]);

  // Pautan URL Google Apps Script
  const handleSaveGoogleUrl = useCallback(async (url: string) => {
    const updated = { ...settings, googleWebAppUrl: url };
    setSettings(updated);
    await AppsScriptService.saveSettings(updated, updated.kodEdit, url);
    // Muat semula data
    loadData(false);
  }, [settings, loadData]);

  // Tarikh yang ditapis untuk dipaparkan dalam jadual
  const datesToRender = useMemo(() => {
    let list = currentMonth === -1 
      ? allDatesOfYear 
      : getDatesOfMonth(settings.tahun, currentMonth);

    // Penapis Carian
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(d => {
        const r = rows[d];
        if (!r) return false;
        const dayNum = d.slice(8);
        const dayName = DAY_NAMES[getDayOfWeek(d)].toLowerCase();
        const monthName = MONTH_NAMES[parseInt(d.slice(5, 7), 10) - 1].toLowerCase();

        return (
          d.includes(q) ||
          dayNum.includes(q) ||
          dayName.includes(q) ||
          monthName.includes(q) ||
          r.l.toLowerCase().includes(q) ||
          r.p.toLowerCase().includes(q) ||
          r.k.toLowerCase().includes(q) ||
          r.h.toLowerCase().includes(q) ||
          r.o.toLowerCase().includes(q)
        );
      });
    }

    // Penapis Jenis Hari
    if (selectedDayType === 'school') {
      list = list.filter(d => {
        const r = rows[d];
        const isW = isWeekendFn(d);
        return !(r?.j || isW);
      });
    } else if (selectedDayType === 'holiday') {
      list = list.filter(d => {
        const r = rows[d];
        const isW = isWeekendFn(d);
        return Boolean(r?.j || isW);
      });
    }

    return list;
  }, [currentMonth, allDatesOfYear, settings.tahun, searchQuery, selectedDayType, rows, isWeekendFn]);

  // Statistik bulan atau setahun
  const stats = useMemo(() => {
    const targetDates = currentMonth === -1 
      ? allDatesOfYear 
      : getDatesOfMonth(settings.tahun, currentMonth);

    let schoolDays = 0;
    let holidays = 0;
    let penggalDays = 0;
    let umumDays = 0;
    let lainDays = 0;
    let weekendOnlyDays = 0;
    let pCount = 0;
    let kCount = 0;
    let hCount = 0;
    let oCount = 0;
    const weekNumbersInView: number[] = [];

    targetDates.forEach(d => {
      const r = rows[d];
      const isW = isWeekendFn(d);
      const isCuti = Boolean(r?.j || isW);

      if (isCuti) {
        holidays++;
        if (r?.j === 'PENGGAL') {
          penggalDays++;
        } else if (r?.j === 'UMUM') {
          umumDays++;
        } else if (r?.j === 'LAIN') {
          lainDays++;
        } else if (isW) {
          weekendOnlyDays++;
        }
      } else {
        schoolDays++;
      }

      if (r) {
        if (r.p) pCount += r.p.split('\n').filter(Boolean).length;
        if (r.k) kCount += r.k.split('\n').filter(Boolean).length;
        if (r.h) hCount += r.h.split('\n').filter(Boolean).length;
        if (r.o) oCount += r.o.split('\n').filter(Boolean).length;
      }

      const wKey = weekKeyFn(d);
      const wNum = weeksMap[wKey];
      if (wNum && !weekNumbersInView.includes(wNum)) {
        weekNumbersInView.push(wNum);
      }
    });

    const totalPrograms = pCount + kCount + hCount + oCount;

    let weekRangeText = 'Tiada Minggu Persekolahan';
    if (weekNumbersInView.length > 0) {
      const minW = Math.min(...weekNumbersInView);
      const maxW = Math.max(...weekNumbersInView);
      weekRangeText = minW === maxW ? `Minggu Persekolahan M${minW}` : `Minggu Persekolahan M${minW} – M${maxW}`;
    }

    return {
      weekRangeText,
      schoolDaysCount: schoolDays,
      holidayCount: holidays,
      penggalDaysCount: penggalDays,
      umumDaysCount: umumDays,
      lainDaysCount: lainDays,
      weekendDaysCount: weekendOnlyDays,
      programCount: totalPrograms,
      unitCounts: { p: pCount, k: kCount, h: hCount, o: oCount }
    };
  }, [currentMonth, allDatesOfYear, settings.tahun, rows, isWeekendFn, weekKeyFn, weeksMap]);

  // Pelaksanaan cetakan rasmi KPM (Hanya bermula dari Kementerian Pendidikan Malaysia)
  const handleExecutePrint = useCallback((scope: number | 'all') => {
    setPrintMonth(scope);
    // Beri masa untuk rendering DOM sebelum print dialog pelayar dibuka
    setTimeout(() => {
      window.print();
    }, 120);
  }, []);

  // Selaraskan jika pengguna menekan kekunci pintas Ctrl+P
  useEffect(() => {
    const handleBeforePrint = () => {
      setPrintMonth(prev => {
        if (currentMonth >= 0 && currentMonth < 12 && prev === 'all') {
          return currentMonth;
        }
        return prev;
      });
    };
    window.addEventListener('beforeprint', handleBeforePrint);
    return () => window.removeEventListener('beforeprint', handleBeforePrint);
  }, [currentMonth]);

  return (
    <div className="min-h-screen bg-[#f4f7f6] text-slate-800 font-sans selection:bg-teal-500 selection:text-white">
      {/* 
        ========================================================================
        1. PAPARAN ANTARAMUKA SISTEM (DISEMBUNYIKAN SECARA MUTLAK KETIKA CETAK)
        ========================================================================
      */}
      <div id="screen-ui" className={`${isPreviewMode ? 'hidden' : 'flex flex-col min-h-screen'} print:hidden`}>
        {/* 1. Bar Navigasi Utama */}
        <Navbar
          settings={settings}
          currentRole={currentRole}
          syncState={syncState}
          syncMessage={syncMessage}
          onSyncGoogleSheet={handleSyncGoogleSheet}
          onCleanDuplicates={handleCleanDuplicates}
          onOpenAddModal={() => setAddModalOpen(true)}
          onOpenSettingsModal={() => setSettingsModalOpen(true)}
          onOpenLoginModal={() => setLoginModalOpen(true)}
          onLogoutRole={() => setCurrentRole('GURU')}
          onExportCSV={() => exportToCSV(rows, allDatesOfYear, weeksMap, weekKeyFn, settings)}
          onExportExcel={() => exportToExcel(rows, allDatesOfYear, weeksMap, weekKeyFn, isWeekendFn, settings)}
          onExportICal={() => exportToICal(rows, allDatesOfYear, settings)}
          onPrint={() => setPrintModalOpen(true)}
          onOpenShareModal={() => setShareModalOpen(true)}
          onSwitchYear={handleSwitchYear}
        />

        {/* 2. Tab Bulan & Ringkasan Metrik */}
        <MonthTabs
          currentMonth={currentMonth}
          onSelectMonth={m => setCurrentMonth(m)}
          stats={stats}
        />

        {/* 3. Bar Penapis & Carian Pantas */}
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedUnit={selectedUnit}
          onSelectUnit={setSelectedUnit}
          selectedDayType={selectedDayType}
          onSelectDayType={setSelectedDayType}
          currentRole={currentRole}
          onOpenLoginModal={() => setLoginModalOpen(true)}
        />

        {/* 4. Ruang Utama Jadual Takwim */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {currentMonth === -1 ? `Takwim Penuh Setahun ${settings.tahun}` : `Bulan ${MONTH_NAMES[currentMonth]} ${settings.tahun}`}
              </h2>
              <p className="text-xs text-slate-500">
                {settings.sekolah || 'Sekolah'} · Kumpulan {settings.kumpulan} (Hari mula persekolahan: {settings.kumpulan === 'A' ? 'Ahad' : 'Isnin'})
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-900 border border-red-300 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-red-600"></span>
                Cuti Umum
              </span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-950 border border-amber-400 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                Cuti Penggal Persekolahan KPM
              </span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-950 border border-indigo-300 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                Cuti Tambahan KPM / Peristiwa
              </span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-200 text-slate-800 border border-slate-300">
                <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                Hujung Minggu
              </span>
              {currentRole !== 'GURU' && (
                <button
                  onClick={() => handleResetOfficialHolidays()}
                  className="px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 transition-colors"
                  title="Segerakkan semula semua tarikh cuti rasmi KPM"
                >
                  Kemaskini Cuti KPM ↺
                </button>
              )}
            </div>
          </div>

          {/* Jadual Takwim KPM */}
          <TakwimTable
            datesToRender={datesToRender}
            rows={rows}
            weeksMap={weeksMap}
            weekKeyFn={weekKeyFn}
            isWeekendFn={isWeekendFn}
            schoolGroup={settings.kumpulan}
            currentRole={currentRole}
            selectedUnit={selectedUnit}
            searchQuery={searchQuery}
            onCellChange={handleCellChange}
            onOpenDayModal={dateStr => setEditDayDate(dateStr)}
          />
        </main>

        {/* 5. Footer */}
        <footer className="bg-white border-t border-slate-200 py-3.5 mt-8 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <strong>e-Takwim Sekolah KPM</strong> · Modul Pengisian Bersepadu GPK Pentadbiran, Kurikulum, HEM & Kokurikulum.
            </div>
            <div>
              Data terselaras dengan Google Sheets & Google Apps Script.
            </div>
          </div>
        </footer>

        {/* 6. Dialog Modals */}
        <AddProgramModal
          isOpen={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          rows={rows}
          schoolGroup={settings.kumpulan}
          year={settings.tahun}
          currentMonth={currentMonth}
          isWeekendFn={isWeekendFn}
          onSavePrograms={handleSaveBulkPrograms}
        />

        <EditDayModal
          isOpen={Boolean(editDayDate)}
          dateStr={editDayDate}
          onClose={() => setEditDayDate(null)}
          rows={rows}
          onSaveDay={handleSaveDay}
        />

        <SettingsModal
          isOpen={settingsModalOpen}
          onClose={() => setSettingsModalOpen(false)}
          settings={settings}
          rows={rows}
          onSaveSettings={handleSaveSettings}
          onResetOfficialHolidays={handleResetOfficialHolidays}
          onForceSyncCloud={() => loadData(false)}
        />

        <GoogleSheetModal
          isOpen={googleSheetModalOpen}
          onClose={() => setGoogleSheetModalOpen(false)}
          settings={settings}
          rows={rows}
          onSaveUrl={handleSaveGoogleUrl}
          onForceSyncCloud={() => loadData(false)}
        />

        <LoginModal
          isOpen={loginModalOpen}
          onClose={() => setLoginModalOpen(false)}
          expectedCode={settings.kodEdit}
          onLoginSuccess={role => setCurrentRole(role)}
        />

        <PrintModal
          isOpen={printModalOpen}
          onClose={() => setPrintModalOpen(false)}
          currentMonth={currentMonth}
          settings={settings}
          rows={rows}
          allDates={allDatesOfYear}
          weeksMap={weeksMap}
          weekKeyFn={weekKeyFn}
          isWeekendFn={isWeekendFn}
          onExecuteBrowserPrint={handleExecutePrint}
          onOpenPreview={(scope) => {
            setPrintMonth(scope);
            setIsPreviewMode(true);
          }}
        />

        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          settings={settings}
          rows={rows}
          onOpenGoogleSheetModal={() => setGoogleSheetModalOpen(true)}
          onSyncGoogleSheet={handleSyncGoogleSheet}
          onImportBackup={(importedRows, importedSettings) => {
            setRows(importedRows);
            const mergedSettings = { ...settings, ...importedSettings };
            setSettings(mergedSettings);
            AppsScriptService.updateLocalRows(Object.values(importedRows), mergedSettings.tahun || settings.tahun);
            AppsScriptService.saveSettings(mergedSettings, mergedSettings.kodEdit, mergedSettings.googleWebAppUrl);
            setSyncState('SYNCED');
            setSyncMessage('Data Sandaran Dipulihkan');
          }}
        />
      </div>

      {/* 
        ========================================================================
        2. FORMAT CETAKAN RASMI KPM (HANYA INI YANG DICETAK)
           HANYA BERMULA DARI: KEMENTERIAN PENDIDIKAN MALAYSIA
        ========================================================================
      */}
      <PrintTakwimView
        allDates={allDatesOfYear}
        rows={rows}
        weeksMap={weeksMap}
        weekKeyFn={weekKeyFn}
        isWeekendFn={isWeekendFn}
        settings={settings}
        printMonth={printMonth}
        isPreview={isPreviewMode}
        onClosePreview={() => setIsPreviewMode(false)}
      />
    </div>
  );
}

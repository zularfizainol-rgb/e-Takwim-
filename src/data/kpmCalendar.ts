import { HolidayType, SchoolGroup, TakwimRow } from '../types/takwim';

export const MONTH_NAMES = [
  'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
  'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
];

export const MONTH_SHORT = [
  'Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun',
  'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'
];

export const DAY_NAMES = [
  'Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'
];

export const JENIS_CUTI: Record<HolidayType, string> = {
  '': 'Hari Biasa',
  'UMUM': 'Cuti Umum',
  'PENGGAL': 'Cuti Penggal Persekolahan KPM',
  'LAIN': 'Cuti Tambahan KPM / Peristiwa'
};

// Cuti Umum Rasmi 2027 (Warta Persekutuan & Negeri)
export const CUTI_UMUM_2027: [string, string][] = [
  ['2027-01-01', 'Tahun Baharu 2027'],
  ['2027-01-22', 'Hari Thaipusam'],
  ['2027-02-01', 'Hari Wilayah Persekutuan'],
  ['2027-02-06', 'Tahun Baharu Cina'],
  ['2027-02-07', 'Tahun Baharu Cina (Hari Kedua)'],
  ['2027-02-08', 'Cuti Ganti Tahun Baharu Cina'],
  ['2027-02-24', 'Hari Nuzul Al-Quran'],
  ['2027-03-10', 'Hari Raya Aidilfitri'],
  ['2027-03-11', 'Hari Raya Aidilfitri (Hari Kedua)'],
  ['2027-05-01', 'Hari Pekerja'],
  ['2027-05-17', 'Hari Raya Aidiladha'],
  ['2027-05-20', 'Hari Wesak'],
  ['2027-06-06', 'Awal Muharram (Maal Hijrah)'],
  ['2027-06-07', 'Hari Keputeraan YDP Agong'],
  ['2027-06-08', 'Cuti Ganti Awal Muharram'],
  ['2027-08-15', 'Maulidur Rasul'],
  ['2027-08-16', 'Cuti Ganti Maulidur Rasul'],
  ['2027-08-31', 'Hari Kebangsaan'],
  ['2027-09-16', 'Hari Malaysia'],
  ['2027-10-28', 'Hari Deepavali'],
  ['2027-12-11', 'Hari Keputeraan Sultan Selangor'],
  ['2027-12-25', 'Hari Krismas']
];

// Cuti Tambahan Perayaan KPM 2027 (Kumpulan B)
export const CUTI_TAMBAHAN_B_2027: [string, string][] = [
  ['2027-02-05', 'Cuti Tambahan KPM (Tahun Baharu Cina)'],
  ['2027-02-09', 'Cuti Tambahan KPM (Tahun Baharu Cina)'],
  ['2027-02-10', 'Cuti Tambahan KPM (Tahun Baharu Cina)'],
  ['2027-02-11', 'Cuti Tambahan KPM (Tahun Baharu Cina)'],
  ['2027-02-12', 'Cuti Tambahan KPM (Tahun Baharu Cina)'],
  ['2027-03-08', 'Cuti Tambahan KPM (Hari Raya Aidilfitri)'],
  ['2027-03-09', 'Cuti Tambahan KPM (Hari Raya Aidilfitri)'],
  ['2027-03-12', 'Cuti Tambahan KPM (Hari Raya Aidilfitri)'],
  ['2027-05-18', 'Cuti Tambahan KPM (Hari Raya Korban)'],
  ['2027-05-19', 'Cuti Tambahan KPM (Hari Raya Korban)'],
  ['2027-05-21', 'Cuti Tambahan KPM (Hari Wesak)'],
  ['2027-10-27', 'Cuti Tambahan KPM (Deepavali)'],
  ['2027-10-29', 'Cuti Tambahan KPM (Deepavali)']
];

// Cuti Tambahan Perayaan KPM 2027 (Kumpulan A)
export const CUTI_TAMBAHAN_A_2027: [string, string][] = [
  ['2027-02-04', 'Cuti Tambahan KPM (Tahun Baharu Cina)'],
  ['2027-02-08', 'Cuti Tambahan KPM (Tahun Baharu Cina)'],
  ['2027-02-09', 'Cuti Tambahan KPM (Tahun Baharu Cina)'],
  ['2027-02-10', 'Cuti Tambahan KPM (Tahun Baharu Cina)'],
  ['2027-02-11', 'Cuti Tambahan KPM (Tahun Baharu Cina)'],
  ['2027-03-07', 'Cuti Tambahan KPM (Hari Raya Aidilfitri)'],
  ['2027-03-08', 'Cuti Tambahan KPM (Hari Raya Aidilfitri)'],
  ['2027-03-09', 'Cuti Tambahan KPM (Hari Raya Aidilfitri)'],
  ['2027-03-14', 'Cuti Tambahan KPM (Hari Raya Aidilfitri)'],
  ['2027-05-16', 'Cuti Tambahan KPM (Hari Raya Korban)'],
  ['2027-05-18', 'Cuti Tambahan KPM (Hari Raya Korban)'],
  ['2027-05-19', 'Cuti Tambahan KPM (Hari Raya Korban)'],
  ['2027-10-27', 'Cuti Tambahan KPM (Deepavali)'],
  ['2027-10-28', 'Cuti Tambahan KPM (Deepavali)']
];

// Cuti Umum Rasmi 2026
export const CUTI_UMUM_2026: [string, string][] = [
  ['2026-01-01', 'Tahun Baharu 2026'],
  ['2026-02-01', 'Hari Wilayah Persekutuan'],
  ['2026-02-03', 'Hari Thaipusam'],
  ['2026-02-17', 'Tahun Baharu Cina'],
  ['2026-02-18', 'Tahun Baharu Cina (Hari Kedua)'],
  ['2026-03-06', 'Hari Nuzul Al-Quran'],
  ['2026-03-20', 'Hari Raya Aidilfitri'],
  ['2026-03-21', 'Hari Raya Aidilfitri (Hari Kedua)'],
  ['2026-05-01', 'Hari Pekerja'],
  ['2026-05-27', 'Hari Raya Aidiladha'],
  ['2026-05-31', 'Hari Wesak'],
  ['2026-06-01', 'Hari Keputeraan YDP Agong'],
  ['2026-06-17', 'Awal Muharram (Maal Hijrah)'],
  ['2026-08-26', 'Maulidur Rasul'],
  ['2026-08-31', 'Hari Kebangsaan'],
  ['2026-09-16', 'Hari Malaysia'],
  ['2026-11-08', 'Hari Deepavali'],
  ['2026-12-11', 'Hari Keputeraan Sultan Selangor'],
  ['2026-12-25', 'Hari Krismas']
];

// Cuti Umum Rasmi 2025 (Rujukan Arkib Tahun Lepas)
export const CUTI_UMUM_2025: [string, string][] = [
  ['2025-01-01', 'Tahun Baharu 2025'],
  ['2025-01-29', 'Tahun Baharu Cina'],
  ['2025-01-30', 'Tahun Baharu Cina (Hari Kedua)'],
  ['2025-02-01', 'Hari Wilayah Persekutuan'],
  ['2025-02-11', 'Hari Thaipusam'],
  ['2025-03-31', 'Hari Raya Aidilfitri'],
  ['2025-04-01', 'Hari Raya Aidilfitri (Hari Kedua)'],
  ['2025-05-01', 'Hari Pekerja'],
  ['2025-05-12', 'Hari Wesak'],
  ['2025-06-02', 'Hari Keputeraan YDP Agong'],
  ['2025-06-07', 'Hari Raya Aidiladha'],
  ['2025-06-27', 'Awal Muharram (Maal Hijrah)'],
  ['2025-08-31', 'Hari Kebangsaan'],
  ['2025-09-05', 'Maulidur Rasul'],
  ['2025-09-16', 'Hari Malaysia'],
  ['2025-10-20', 'Hari Deepavali'],
  ['2025-12-11', 'Hari Keputeraan Sultan Selangor'],
  ['2025-12-25', 'Hari Krismas']
];

// Cuti Umum Rasmi 2028 (Perancangan Tahun Hadapan)
export const CUTI_UMUM_2028: [string, string][] = [
  ['2028-01-01', 'Tahun Baharu 2028'],
  ['2028-01-26', 'Tahun Baharu Cina'],
  ['2028-01-27', 'Tahun Baharu Cina (Hari Kedua)'],
  ['2028-02-01', 'Hari Wilayah Persekutuan'],
  ['2028-02-11', 'Hari Thaipusam'],
  ['2028-02-28', 'Hari Raya Aidilfitri'],
  ['2028-02-29', 'Hari Raya Aidilfitri (Hari Kedua)'],
  ['2028-05-01', 'Hari Pekerja'],
  ['2028-05-06', 'Hari Raya Aidiladha'],
  ['2028-05-09', 'Hari Wesak'],
  ['2028-05-26', 'Awal Muharram (Maal Hijrah)'],
  ['2028-06-05', 'Hari Keputeraan YDP Agong'],
  ['2028-08-04', 'Maulidur Rasul'],
  ['2028-08-31', 'Hari Kebangsaan'],
  ['2028-09-16', 'Hari Malaysia'],
  ['2028-10-17', 'Hari Deepavali'],
  ['2028-12-11', 'Hari Keputeraan Sultan Selangor'],
  ['2028-12-25', 'Hari Krismas']
];

export function padZero(n: number): string {
  return n < 10 ? '0' + n : '' + n;
}

export function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${padZero(month)}-${padZero(day)}`;
}

export function getDayOfWeek(dateStr: string): number {
  return new Date(dateStr + 'T00:00:00Z').getUTCDay();
}

export function isWeekend(dateStr: string, group: SchoolGroup): boolean {
  const w = getDayOfWeek(dateStr);
  return group === 'A' ? (w === 5 || w === 6) : (w === 0 || w === 6);
}

export function getAllDatesOfYear(year: number): string[] {
  const dates: string[] = [];
  const start = Date.UTC(year, 0, 1);
  const end = Date.UTC(year, 11, 31);
  for (let t = start; t <= end; t += 86400000) {
    const d = new Date(t);
    dates.push(formatDateKey(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()));
  }
  return dates;
}

export function getDatesOfMonth(year: number, monthIndex: number): string[] {
  return getAllDatesOfYear(year).filter(d => parseInt(d.slice(5, 7), 10) === monthIndex + 1);
}

/**
 * Jana peta lengkap semua cuti rasmi KPM:
 * 1. Cuti Penggal Persekolahan KPM (Cuti Penggal 1, Cuti Pertengahan Tahun/Penggal 2, Cuti Penggal 3, Cuti Akhir Persekolahan)
 * 2. Cuti Tambahan Perayaan KPM (Tahun Baharu Cina, Aidilfitri, Aidiladha, Wesak, Deepavali)
 * 3. Cuti Umum Kebangsaan & Negeri
 */
export function buildOfficialKPMHolidays(year: number, group: SchoolGroup): Record<string, { j: HolidayType; l: string }> {
  const map: Record<string, { j: HolidayType; l: string }> = {};
  const isA = group === 'A';

  function addRange(startM: number, startD: number, endM: number, endD: number, j: HolidayType, l: string) {
    const start = Date.UTC(year, startM - 1, startD);
    const end = Date.UTC(year, endM - 1, endD);
    for (let t = start; t <= end; t += 86400000) {
      const d = new Date(t);
      const key = formatDateKey(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
      map[key] = { j, l };
    }
  }

  if (year === 2027) {
    // 1. Cuti Penggal Persekolahan KPM 2027
    addRange(3, isA ? 5 : 6, 3, isA ? 13 : 14, 'PENGGAL', 'Cuti Penggal 1 Persekolahan KPM');

    // 2. Cuti Tambahan Perayaan KPM
    const tambahan = isA ? CUTI_TAMBAHAN_A_2027 : CUTI_TAMBAHAN_B_2027;
    tambahan.forEach(([d, l]) => {
      map[d] = { j: 'LAIN', l };
    });

    addRange(5, isA ? 21 : 22, 6, isA ? 5 : 6, 'PENGGAL', 'Cuti Pertengahan Tahun Persekolahan KPM');
    addRange(8, isA ? 27 : 28, 9, isA ? 4 : 5, 'PENGGAL', 'Cuti Penggal 2 Persekolahan KPM');
    addRange(12, isA ? 3 : 4, 12, 31, 'PENGGAL', 'Cuti Akhir Persekolahan Sesi 2027');

    CUTI_UMUM_2027.forEach(([d, l]) => {
      const old = map[d];
      map[d] = {
        j: 'UMUM',
        l: l + (old && old.j === 'PENGGAL' ? ` (dalam ${old.l})` : '')
      };
    });
  } else if (year === 2026) {
    // Sesi 2026
    addRange(3, isA ? 27 : 28, 4, isA ? 4 : 5, 'PENGGAL', 'Cuti Penggal 1 Persekolahan KPM');
    addRange(5, isA ? 22 : 23, 6, isA ? 6 : 7, 'PENGGAL', 'Cuti Pertengahan Tahun Persekolahan KPM');
    addRange(8, isA ? 28 : 29, 9, isA ? 5 : 6, 'PENGGAL', 'Cuti Penggal 2 Persekolahan KPM');
    addRange(12, isA ? 4 : 5, 12, 31, 'PENGGAL', 'Cuti Akhir Persekolahan Sesi 2026');

    CUTI_UMUM_2026.forEach(([d, l]) => {
      const old = map[d];
      map[d] = {
        j: 'UMUM',
        l: l + (old && old.j === 'PENGGAL' ? ` (dalam ${old.l})` : '')
      };
    });
  } else if (year === 2025) {
    // Sesi 2025
    addRange(5, isA ? 23 : 24, 6, isA ? 7 : 8, 'PENGGAL', 'Cuti Penggal 1 Persekolahan KPM');
    addRange(9, isA ? 12 : 13, 9, isA ? 20 : 21, 'PENGGAL', 'Cuti Penggal 2 Persekolahan KPM');
    addRange(12, isA ? 19 : 20, 12, 31, 'PENGGAL', 'Cuti Akhir Persekolahan Sesi 2025');

    CUTI_UMUM_2025.forEach(([d, l]) => {
      const old = map[d];
      map[d] = {
        j: 'UMUM',
        l: l + (old && old.j === 'PENGGAL' ? ` (dalam ${old.l})` : '')
      };
    });
  } else if (year === 2028) {
    // Sesi 2028 (Unjuran Rasmi)
    addRange(3, isA ? 10 : 11, 3, isA ? 18 : 19, 'PENGGAL', 'Cuti Penggal 1 Persekolahan KPM');
    addRange(5, isA ? 26 : 27, 6, isA ? 10 : 11, 'PENGGAL', 'Cuti Pertengahan Tahun Persekolahan KPM');
    addRange(8, isA ? 25 : 26, 9, isA ? 2 : 3, 'PENGGAL', 'Cuti Penggal 2 Persekolahan KPM');
    addRange(12, isA ? 8 : 9, 12, 31, 'PENGGAL', 'Cuti Akhir Persekolahan Sesi 2028');

    CUTI_UMUM_2028.forEach(([d, l]) => {
      const old = map[d];
      map[d] = {
        j: 'UMUM',
        l: l + (old && old.j === 'PENGGAL' ? ` (dalam ${old.l})` : '')
      };
    });
  } else {
    // Tahun umum lain (cth: 2029, 2030 dsb.)
    addRange(3, isA ? 12 : 13, 3, isA ? 20 : 21, 'PENGGAL', `Cuti Penggal 1 Persekolahan KPM ${year}`);
    addRange(5, isA ? 25 : 26, 6, isA ? 9 : 10, 'PENGGAL', `Cuti Pertengahan Tahun KPM ${year}`);
    addRange(8, isA ? 26 : 27, 9, isA ? 3 : 4, 'PENGGAL', `Cuti Penggal 2 Persekolahan KPM ${year}`);
    addRange(12, isA ? 7 : 8, 12, 31, 'PENGGAL', `Cuti Akhir Persekolahan Sesi ${year}`);

    // Cuti tetap kebangsaan
    const fixedHolidays: [string, string][] = [
      [`${year}-01-01`, `Tahun Baharu ${year}`],
      [`${year}-02-01`, 'Hari Wilayah Persekutuan'],
      [`${year}-05-01`, 'Hari Pekerja'],
      [`${year}-08-31`, 'Hari Kebangsaan'],
      [`${year}-09-16`, 'Hari Malaysia'],
      [`${year}-12-25`, 'Hari Krismas']
    ];
    fixedHolidays.forEach(([d, l]) => {
      const old = map[d];
      map[d] = {
        j: 'UMUM',
        l: l + (old && old.j === 'PENGGAL' ? ` (dalam ${old.l})` : '')
      };
    });
  }

  return map;
}

export function getWeekStartKey(dateStr: string, group: SchoolGroup): string {
  const w = getDayOfWeek(dateStr);
  const back = group === 'A' ? w : (w + 6) % 7;
  const t = Date.parse(dateStr + 'T00:00:00Z') - back * 86400000;
  const d = new Date(t);
  return formatDateKey(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/**
 * Kira minggu persekolahan rasmi KPM:
 * Hanya minggu yang mempunyai sekurang-kurangnya 1 hari persekolahan (bukan cuti penggal/hujung minggu penuh)
 * diberi nombor minggu (W1, W2, ...)
 */
export function computeKPMWeeks(
  allDates: string[],
  rows: Record<string, TakwimRow>,
  group: SchoolGroup
): Record<string, number> {
  const weekHasSchoolDay: Record<string, boolean> = {};
  const orderedWeekKeys: string[] = [];

  allDates.forEach(d => {
    const wKey = getWeekStartKey(d, group);
    if (!(wKey in weekHasSchoolDay)) {
      weekHasSchoolDay[wKey] = false;
      orderedWeekKeys.push(wKey);
    }
    const r = rows[d];
    const isW = isWeekend(d, group);
    const isCuti = r?.j || isW;
    if (!isCuti) {
      weekHasSchoolDay[wKey] = true;
    }
  });

  const weekNumberMap: Record<string, number> = {};
  let count = 0;
  orderedWeekKeys.forEach(wKey => {
    if (weekHasSchoolDay[wKey]) {
      count++;
      weekNumberMap[wKey] = count;
    } else {
      weekNumberMap[wKey] = 0;
    }
  });

  return weekNumberMap;
}

export function generateInitialRows(year: number, group: SchoolGroup): Record<string, TakwimRow> {
  const dates = getAllDatesOfYear(year);
  const holidayMap = buildOfficialKPMHolidays(year, group);
  const rows: Record<string, TakwimRow> = {};

  dates.forEach(d => {
    const hol = holidayMap[d];
    rows[d] = {
      d,
      j: hol ? hol.j : '',
      l: hol ? hol.l : '',
      p: '',
      k: '',
      h: '',
      o: ''
    };
  });

  // Contoh program rasmi perasmian sesi persekolahan
  const firstSchoolDay = group === 'A' ? `${year}-01-03` : `${year}-01-04`;
  if (rows[firstSchoolDay]) {
    rows[firstSchoolDay].p = `Hari Pertama Persekolahan Sesi ${year}\nPerhimpunan Rasmi Pembukaan Sesi`;
    rows[firstSchoolDay].h = 'Orientasi & Pengurusan Kelas';
  }

  return rows;
}

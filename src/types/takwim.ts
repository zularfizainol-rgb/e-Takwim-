export type HolidayType = 'UMUM' | 'PENGGAL' | 'LAIN' | '';

export interface TakwimRow {
  d: string; // YYYY-MM-DD
  j: HolidayType;
  l: string; // Label cuti
  p: string; // Pentadbiran
  k: string; // Kurikulum
  h: string; // Hal Ehwal Murid
  o: string; // Kokurikulum
}

export type SchoolGroup = 'A' | 'B';

export interface SchoolSettings {
  sekolah: string;
  kodSekolah: string;
  kumpulan: SchoolGroup;
  tahun: number;
  guruBesar: string;
  gpkPentadbiran: string;
  gpkKurikulum: string;
  gpkHem: string;
  gpkKoko: string;
  kodEdit: string;
  googleWebAppUrl?: string;
  autoSyncGoogleSheet?: boolean;
  logoSekolah?: string;
  logoTs25?: string;
  paparLogoTs25?: boolean;
}

export type UserRole = 
  | 'GURU' 
  | 'GPK_PENTADBIRAN' 
  | 'GPK_KURIKULUM' 
  | 'GPK_HEM' 
  | 'GPK_KOKO' 
  | 'PENTADBIR';

export type SyncState = 'SYNCED' | 'SAVING' | 'DIRTY' | 'OFFLINE' | 'ERROR';

export interface UnitInfo {
  key: 'p' | 'k' | 'h' | 'o';
  label: string;
  shortLabel: string;
  colorClass: string;
  badgeClass: string;
  borderClass: string;
  role: UserRole;
  leaderTitle: string;
}

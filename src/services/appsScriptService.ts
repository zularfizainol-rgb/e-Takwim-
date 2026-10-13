import { SchoolSettings, TakwimRow } from '../types/takwim';

const STORAGE_KEY_ROWS = 'etakwim_rows_data_v2';
const STORAGE_KEY_SETTINGS = 'etakwim_settings_v2';

export const APPS_SCRIPT_TEMPLATE = `/**
 * ============================================================================
 * e-Takwim Sekolah KPM - Google Apps Script (Code.gs)
 * ============================================================================
 * Skrip ini bertindak sebagai API Backend untuk Google Sheet sekolah anda.
 * 
 * LANGKAH PEMASANGAN:
 * 1. Buka Google Sheets baharu di https://sheets.new
 * 2. Namakan Google Sheet anda (cth: "Takwim Sekolah 2027")
 * 3. Klik menu: Extensions (Sambungan) > Apps Script
 * 4. Padam semua kod sedia ada dan TAMPAL kod di bawah sepenuhnya.
 * 5. Tukar nilai KOD_EDIT di bawah jika mahu kata laluan keselamatan tersendiri.
 * 6. Klik butang 'Deploy' (Guna) > 'New deployment' (Gunakan baharu)
 * 7. Pilih jenis 'Web app' (Aplikasi Web)
 * 8. Konfigurasi:
 *    - Description: "API e-Takwim"
 *    - Execute as: "Me" (Saya)
 *    - Who has access: "Anyone" (Sesiapa sahaja)  <-- WAJIB untuk akses webapp
 * 9. Klik 'Deploy', beri kebenaran (Authorize Access), dan SALIN Web App URL!
 * 10. Tampal Web App URL tersebut ke dalam aplikasi e-Takwim Sekolah.
 */

// KATA LALUAN KESELAMATAN GPK & GURU BESAR
var KOD_EDIT = "gpk2027"; 
var SHEET_NAME_CONFIG = "Tetapan_Sekolah";

function getTakwimSheetName(year) {
  var y = year || 2027;
  return "Takwim_" + y;
}

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'getData';
  var year = (e && e.parameter && e.parameter.year) ? parseInt(e.parameter.year, 10) : 2027;
  var result;
  
  if (action === 'getData') {
    result = getData(year);
  } else if (action === 'checkKod') {
    var kod = (e && e.parameter && e.parameter.kod) || '';
    result = { status: kod === KOD_EDIT ? 'OK' : 'INVALID' };
  } else {
    result = { status: 'OK', message: 'e-Takwim API aktif' };
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch(err) {
    data = e.parameter;
  }
  
  var action = data.action || 'saveRows';
  var kod = data.kod || '';
  var year = data.year ? parseInt(data.year, 10) : 2027;
  var result = { ok: false };
  
  // Pengesahan kod keselamatan jika ada tindakan kemaskini
  if (action !== 'checkKod' && kod !== KOD_EDIT) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'KOD_EDIT_SALAH' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'saveRows') {
    result = saveRows(data.entries, year);
  } else if (action === 'initSheet') {
    result = initSheet(data.entries, year);
  } else if (action === 'saveSettings') {
    result = saveSettings(data.settings);
  } else if (action === 'checkKod') {
    result = { ok: kod === KOD_EDIT, status: kod === KOD_EDIT ? 'OK' : 'INVALID' };
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function getData(year) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = getTakwimSheetName(year);
  var sheet = getOrCreateSheet(sheetName);
  var lastRow = sheet.getLastRow();
  
  var rows = [];
  if (lastRow > 1) {
    var data = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
    for (var i = 0; i < data.length; i++) {
      var r = data[i];
      if (!r[0]) continue;
      rows.push({
        d: String(r[0]),
        j: String(r[1] || ''),
        l: String(r[2] || ''),
        p: String(r[3] || ''),
        k: String(r[4] || ''),
        h: String(r[5] || ''),
        o: String(r[6] || '')
      });
    }
  }
  
  // Baca tetapan sekolah
  var cfgSheet = getOrCreateSheet(SHEET_NAME_CONFIG);
  var settings = {};
  if (cfgSheet.getLastRow() >= 2) {
    var cfgData = cfgSheet.getRange(2, 1, cfgSheet.getLastRow() - 1, 2).getValues();
    for (var j = 0; j < cfgData.length; j++) {
      settings[cfgData[j][0]] = cfgData[j][1];
    }
  }

  // Senaraikan semua tab takwim yang wujud dalam fail Google Sheet ini
  var sheets = ss.getSheets();
  var availableYears = [];
  for (var s = 0; s < sheets.length; s++) {
    var sName = sheets[s].getName();
    if (sName.indexOf("Takwim_") === 0) {
      var yNum = parseInt(sName.replace("Takwim_", ""), 10);
      if (!isNaN(yNum) && availableYears.indexOf(yNum) === -1) {
        availableYears.push(yNum);
      }
    }
  }
  availableYears.sort();
  
  return {
    ok: true,
    sheetUrl: ss.getUrl(),
    sheetId: ss.getId(),
    activeYear: year,
    availableYears: availableYears,
    rows: rows,
    settings: settings
  };
}

function initSheet(entries, year) {
  var sheetName = getTakwimSheetName(year);
  var sheet = getOrCreateSheet(sheetName);
  sheet.clear();
  
  var headers = [
    'Tarikh (YYYY-MM-DD)', 
    'Jenis Cuti (UMUM/PENGGAL/LAIN)', 
    'Catatan Cuti', 
    'Pentadbiran (PK1)', 
    'Kurikulum', 
    'Hal Ehwal Murid (HEM)', 
    'Kokurikulum'
  ];
  
  sheet.appendRow(headers);
  var headerRange = sheet.getRange(1, 1, 1, 7);
  headerRange.setBackground('#0b6b5c')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
  
  sheet.setFrozenRows(1);
  
  if (entries && entries.length) {
    var batch = entries.map(function(r) {
      return [r.d, r.j || '', r.l || '', r.p || '', r.k || '', r.h || '', r.o || ''];
    });
    sheet.getRange(2, 1, batch.length, 7).setValues(batch);
  }
  
  sheet.autoResizeColumns(1, 7);
  return { ok: true, count: entries ? entries.length : 0 };
}

function saveRows(entries, year) {
  if (!entries || !entries.length) return { ok: true, count: 0 };
  var sheetName = getTakwimSheetName(year);
  var sheet = getOrCreateSheet(sheetName);
  var lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) {
    return initSheet(entries, year);
  }
  
  var dateCol = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  var dateIndexMap = {};
  for (var i = 0; i < dateCol.length; i++) {
    dateIndexMap[String(dateCol[i][0])] = i + 2;
  }
  
  for (var k = 0; k < entries.length; k++) {
    var item = entries[k];
    var rowIndex = dateIndexMap[item.d];
    var rowValues = [item.d, item.j || '', item.l || '', item.p || '', item.k || '', item.h || '', item.o || ''];
    if (rowIndex) {
      sheet.getRange(rowIndex, 1, 1, 7).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }
  }
  
  return { ok: true, updated: entries.length };
}

function saveSettings(settings) {
  var sheet = getOrCreateSheet(SHEET_NAME_CONFIG);
  sheet.clear();
  sheet.appendRow(['Kunci Tetapan', 'Nilai']);
  sheet.getRange(1, 1, 1, 2).setBackground('#084f44').setFontColor('#ffffff').setFontWeight('bold');
  
  var keys = Object.keys(settings || {});
  for (var i = 0; i < keys.length; i++) {
    sheet.appendRow([keys[i], settings[keys[i]]]);
  }
  return { ok: true };
}
`;

export class AppsScriptService {
  static getStorageKeyRows(year?: number): string {
    return year ? `etakwim_rows_${year}` : STORAGE_KEY_ROWS;
  }

  /**
   * Muat data daripada Google Apps Script Web App atau LocalStorage mengikut tahun
   */
  static async loadData(webAppUrl?: string, year: number = 2027): Promise<{
    rows?: TakwimRow[];
    settings?: Partial<SchoolSettings>;
    availableYears?: number[];
    source: 'cloud' | 'local';
    error?: string;
  }> {
    if (webAppUrl && webAppUrl.trim().startsWith('http')) {
      try {
        const fetchUrl = `${webAppUrl.trim()}${webAppUrl.includes('?') ? '&' : '?'}action=getData&year=${year}&_t=${Date.now()}`;
        const res = await fetch(fetchUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });

        if (res.ok) {
          const json = await res.json();
          if (json && json.rows && Array.isArray(json.rows) && json.rows.length > 0) {
            // Simpan ke cache tempatan mengikut tahun
            const storageKey = this.getStorageKeyRows(year);
            localStorage.setItem(storageKey, JSON.stringify(json.rows));
            if (json.settings) {
              const cachedSettings = this.getLocalSettings();
              localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify({ ...cachedSettings, ...json.settings }));
            }
            return {
              rows: json.rows,
              settings: json.settings,
              availableYears: json.availableYears,
              source: 'cloud'
            };
          }
        }
      } catch (err) {
        console.warn('Gagal memuat turun dari Google Apps Script Web App, beralih ke cache tempatan:', err);
      }
    }

    // Fallback ke storan tempatan mengikut tahun
    const localRows = this.getLocalRows(year);
    const localSettings = this.getLocalSettings();
    return {
      rows: localRows,
      settings: localSettings,
      source: 'local'
    };
  }

  /**
   * Simpan baris yang dikemaskini mengikut tahun
   */
  static async saveRows(
    entries: TakwimRow[],
    kod: string,
    webAppUrl?: string,
    year: number = 2027
  ): Promise<{ ok: boolean; source: 'cloud' | 'local'; error?: string }> {
    // Simpan ke storan tempatan mengikut tahun untuk jaminan keselamatan data
    this.updateLocalRows(entries, year);

    if (webAppUrl && webAppUrl.trim().startsWith('http')) {
      try {
        const payload = {
          action: 'saveRows',
          kod,
          year,
          entries
        };

        const res = await fetch(webAppUrl.trim(), {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const result = await res.json();
          if (result && result.error === 'KOD_EDIT_SALAH') {
            return { ok: false, source: 'cloud', error: 'Kod keselamatan salah.' };
          }
          return { ok: true, source: 'cloud' };
        }
      } catch (err: any) {
        console.warn('Ralat menyimpan ke Google Apps Script:', err);
        return { ok: true, source: 'local', error: 'Disimpan di peranti tempatan. (Sambungan Apps Script gagal)' };
      }
    }

    return { ok: true, source: 'local' };
  }

  /**
   * Simpan tetapan sekolah
   */
  static async saveSettings(
    settings: SchoolSettings,
    kod: string,
    webAppUrl?: string
  ): Promise<{ ok: boolean }> {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));

    if (webAppUrl && webAppUrl.trim().startsWith('http')) {
      try {
        await fetch(webAppUrl.trim(), {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'saveSettings',
            kod,
            settings
          })
        });
      } catch (err) {
        console.warn('Ralat menyimpan tetapan ke Google Apps Script:', err);
      }
    }

    return { ok: true };
  }

  /**
   * Uji sambungan ke Web App URL
   */
  static async testConnection(webAppUrl: string, kod: string): Promise<{ ok: boolean; message: string }> {
    if (!webAppUrl || !webAppUrl.trim().startsWith('http')) {
      return { ok: false, message: 'URL Google Apps Script tidak sah. Sila masukkan URL lengkap.' };
    }

    try {
      const url = `${webAppUrl.trim()}${webAppUrl.includes('?') ? '&' : '?'}action=checkKod&kod=${encodeURIComponent(kod)}&_t=${Date.now()}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'OK') {
          return { ok: true, message: 'Sambungan ke Google Sheet & Apps Script BERJAYA! Data disegerakkan secara masa nyata.' };
        } else {
          return { ok: true, message: 'Sambungan Web App berjaya dicapai, tetapi kod keselamatan berbeza daripada KOD_EDIT dalam Code.gs.' };
        }
      }
      return { ok: false, message: `Pelayan memberi respons HTTP ${res.status}. Pastikan pilihan "Who has access" adalah "Anyone".` };
    } catch (err: any) {
      return { ok: false, message: `Gagal berhubung: ${err.message || 'CORS / Ralat Rangkaian'}. Sila pastikan Web App telah dideploy dengan akses "Anyone".` };
    }
  }

  /**
   * Ambil data tempatan daripada localStorage mengikut tahun
   */
  static getLocalRows(year: number = 2027): TakwimRow[] | undefined {
    try {
      const storageKey = this.getStorageKeyRows(year);
      let raw = localStorage.getItem(storageKey);
      if (!raw && year === 2027) {
        raw = localStorage.getItem(STORAGE_KEY_ROWS);
      }
      return raw ? JSON.parse(raw) : undefined;
    } catch {
      return undefined;
    }
  }

  static getLocalSettings(): Partial<SchoolSettings> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  static updateLocalRows(updatedEntries: TakwimRow[], year: number = 2027): void {
    try {
      const current = this.getLocalRows(year) || [];
      const map: Record<string, TakwimRow> = {};
      current.forEach(r => { map[r.d] = r; });
      updatedEntries.forEach(r => { map[r.d] = r; });
      const storageKey = this.getStorageKeyRows(year);
      localStorage.setItem(storageKey, JSON.stringify(Object.values(map)));
    } catch (e) {
      console.warn('Gagal mengemas kini local storage', e);
    }
  }
}

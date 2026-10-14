import { SchoolSettings, TakwimRow } from '../types/takwim';

const STORAGE_KEY_ROWS = 'etakwim_rows_data_v2';
const STORAGE_KEY_SETTINGS = 'etakwim_settings_v2';

export const APPS_SCRIPT_TEMPLATE = `/**
 * ============================================================================
 * e-Takwim Sekolah KPM - Google Apps Script (Code.gs)
 * Versi 3.0 (Anti-Pertindihan & Penyelarasan Pintar)
 * ============================================================================
 * Skrip ini bertindak sebagai API Backend untuk Google Sheet sekolah anda.
 * 
 * LANGKAH PEMASANGAN / KEMASKINI:
 * 1. Buka Google Sheet takwim anda di Google Drive.
 * 2. Klik menu: Extensions (Sambungan) > Apps Script
 * 3. Padam SEMUA kod sedia ada dalam Code.gs dan TAMPAL kod di bawah sepenuhnya.
 * 4. Klik ikon 'Simpan' (Disket).
 * 5. Klik butang 'Deploy' (Guna) > 'New deployment' (Gunakan baharu)
 *    *PENTING*: Mesti 'New deployment' (bukan edit) agar kod versi baru diaktifkan.
 * 6. Pilih jenis: 'Web app' (Aplikasi Web)
 * 7. Konfigurasi:
 *    - Description: "API e-Takwim v3"
 *    - Execute as: "Me" (Saya)
 *    - Who has access: "Anyone" (Sesiapa sahaja)  <-- WAJIB
 * 8. Klik 'Deploy', berikan kebenaran (Authorize Access jika diminta),
 *    dan SALIN Web App URL yang berakhir dengan '/exec'.
 * 9. Tampal Web App URL tersebut ke dalam aplikasi e-Takwim Sekolah.
 */

// KATA LALUAN KESELAMATAN GPK & GURU BESAR (Lalai: gpk2027)
var KOD_EDIT = "gpk2027"; 
var SHEET_NAME_CONFIG = "Tetapan_Sekolah";

function getTakwimSheetName(year) {
  var y = year || 2027;
  return "Takwim_" + y;
}

/**
 * Normalisasikan tarikh kepada format piawai YYYY-MM-DD
 * Mengelakkan masalah objek Date Google Sheets menghasilkan timezone string
 */
function normalizeDateStr(val) {
  if (!val) return '';
  if (val instanceof Date) {
    var year = val.getFullYear();
    var month = ('0' + (val.getMonth() + 1)).slice(-2);
    var day = ('0' + val.getDate()).slice(-2);
    return year + '-' + month + '-' + day;
  }
  var str = String(val).trim();
  // Format YYYY-MM-DD atau YYYY/MM/DD
  var match = str.match(/^(\\d{4})[-/.](\\d{1,2})[-/.](\\d{1,2})/);
  if (match) {
    return match[1] + '-' + ('0' + match[2]).slice(-2) + '-' + ('0' + match[3]).slice(-2);
  }
  // Format DD/MM/YYYY atau DD-MM-YYYY
  var dmyMatch = str.match(/^(\\d{1,2})[-/.](\\d{1,2})[-/.](\\d{4})/);
  if (dmyMatch) {
    return dmyMatch[3] + '-' + ('0' + dmyMatch[2]).slice(-2) + '-' + ('0' + dmyMatch[1]).slice(-2);
  }
  var parsed = new Date(str);
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 2000 && parsed.getFullYear() < 2100) {
    var py = parsed.getFullYear();
    var pm = ('0' + (parsed.getMonth() + 1)).slice(-2);
    var pd = ('0' + parsed.getDate()).slice(-2);
    return py + '-' + pm + '-' + pd;
  }
  return str;
}

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'getData';
  var year = (e && e.parameter && e.parameter.year) ? parseInt(e.parameter.year, 10) : 2027;
  var result;
  
  if (action === 'getData') {
    result = getData(year);
  } else if (action === 'cleanDuplicates') {
    result = cleanDuplicates(year);
  } else if (action === 'checkKod') {
    var kod = (e && e.parameter && e.parameter.kod) || '';
    result = { status: kod === KOD_EDIT ? 'OK' : 'INVALID' };
  } else {
    result = { status: 'OK', message: 'e-Takwim API v3 aktif' };
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
  } else if (action === 'cleanDuplicates') {
    result = cleanDuplicates(year);
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
  var seenMap = {};
  
  if (lastRow > 1) {
    var data = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
    for (var i = 0; i < data.length; i++) {
      var r = data[i];
      if (!r[0]) continue;
      var dateKey = normalizeDateStr(r[0]);
      if (!dateKey) continue;
      
      var entry = {
        d: dateKey,
        j: String(r[1] || '').trim(),
        l: String(r[2] || '').trim(),
        p: String(r[3] || '').trim(),
        k: String(r[4] || '').trim(),
        h: String(r[5] || '').trim(),
        o: String(r[6] || '').trim()
      };

      // Jika lembaran sedia ada mempunyai baris bertindih lama, gabungkan tanpa membuang maklumat
      if (seenMap[dateKey] !== undefined) {
        var idx = seenMap[dateKey];
        var cur = rows[idx];
        rows[idx] = {
          d: dateKey,
          j: entry.j || cur.j,
          l: entry.l || cur.l,
          p: entry.p ? (cur.p && cur.p.indexOf(entry.p) === -1 ? cur.p + '\\n' + entry.p : entry.p) : cur.p,
          k: entry.k ? (cur.k && cur.k.indexOf(entry.k) === -1 ? cur.k + '\\n' + entry.k : entry.k) : cur.k,
          h: entry.h ? (cur.h && cur.h.indexOf(entry.h) === -1 ? cur.h + '\\n' + entry.h : entry.h) : cur.h,
          o: entry.o ? (cur.o && cur.o.indexOf(entry.o) === -1 ? cur.o + '\\n' + entry.o : entry.o) : cur.o
        };
      } else {
        seenMap[dateKey] = rows.length;
        rows.push(entry);
      }
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
      return [normalizeDateStr(r.d), r.j || '', r.l || '', r.p || '', r.k || '', r.h || '', r.o || ''];
    });
    // Tetapkan lajur A format Plain Text (@)
    sheet.getRange(2, 1, batch.length, 1).setNumberFormat('@');
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
  
  // Baca semua tarikh sedia ada dengan normalisasi tarikh yang tepat
  var dateCol = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  var dateIndexMap = {};
  for (var i = 0; i < dateCol.length; i++) {
    var rawDate = dateCol[i][0];
    if (rawDate) {
      var dKey = normalizeDateStr(rawDate);
      if (dKey && !dateIndexMap[dKey]) {
        dateIndexMap[dKey] = i + 2;
      }
    }
  }
  
  for (var k = 0; k < entries.length; k++) {
    var item = entries[k];
    var normDate = normalizeDateStr(item.d);
    if (!normDate) continue;
    
    var rowIndex = dateIndexMap[normDate];
    var rowValues = [normDate, item.j || '', item.l || '', item.p || '', item.k || '', item.h || '', item.o || ''];
    
    if (rowIndex) {
      // KEMASKINI BARIS SEDIA ADA (Mengelakkan pertindihan data!)
      sheet.getRange(rowIndex, 1, 1, 7).setValues([rowValues]);
    } else {
      // HANYA tambah baris jika tarikh belum wujud
      sheet.appendRow(rowValues);
      var newLastRow = sheet.getLastRow();
      sheet.getRange(newLastRow, 1).setNumberFormat('@');
      dateIndexMap[normDate] = newLastRow;
    }
  }
  
  return { ok: true, updated: entries.length };
}

/**
 * Pembersihan Pintar: Buang baris bertindih dalam Google Sheet
 */
function cleanDuplicates(year) {
  var sheetName = getTakwimSheetName(year);
  var sheet = getOrCreateSheet(sheetName);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { ok: true, message: 'Lembaran kosong' };

  var data = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
  var uniqueMap = {};
  var order = [];

  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    if (!r[0]) continue;
    var dKey = normalizeDateStr(r[0]);
    if (!dKey) continue;

    if (!uniqueMap[dKey]) {
      uniqueMap[dKey] = [dKey, r[1] || '', r[2] || '', r[3] || '', r[4] || '', r[5] || '', r[6] || ''];
      order.push(dKey);
    } else {
      for (var col = 1; col < 7; col++) {
        var existingVal = String(uniqueMap[dKey][col] || '').trim();
        var incomingVal = String(r[col] || '').trim();
        if (!existingVal && incomingVal) {
          uniqueMap[dKey][col] = incomingVal;
        } else if (incomingVal && existingVal && existingVal.indexOf(incomingVal) === -1) {
          uniqueMap[dKey][col] = existingVal + '\\n' + incomingVal;
        }
      }
    }
  }

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
  sheet.getRange(1, 1, 1, 7)
    .setBackground('#0b6b5c')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
  sheet.setFrozenRows(1);

  order.sort();
  var cleanedRows = order.map(function(k) { return uniqueMap[k]; });
  if (cleanedRows.length > 0) {
    sheet.getRange(2, 1, cleanedRows.length, 1).setNumberFormat('@');
    sheet.getRange(2, 1, cleanedRows.length, 7).setValues(cleanedRows);
  }
  sheet.autoResizeColumns(1, 7);
  return { ok: true, cleaned: cleanedRows.length, originalCount: lastRow - 1 };
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

  /**
   * Bersihkan pertindihan baris dalam helaian Google Sheet
   */
  static async cleanDuplicates(
    kod: string,
    webAppUrl?: string,
    year: number = 2027
  ): Promise<{ ok: boolean; message: string }> {
    if (!webAppUrl || !webAppUrl.trim().startsWith('http')) {
      return { ok: false, message: 'URL Google Apps Script tidak sah.' };
    }

    try {
      const res = await fetch(webAppUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'cleanDuplicates',
          kod,
          year
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          return {
            ok: true,
            message: `Pembersihan berjaya! Sebanyak ${data.cleaned || 0} tarikh unik dikemaskini tanpa pertindihan (daripada ${data.originalCount || 0} baris sebelumnya).`
          };
        } else {
          return { ok: false, message: data.error || 'Gagal membersihkan lembaran.' };
        }
      }
      return { ok: false, message: `Ralat respons pelayan (${res.status})` };
    } catch (err: any) {
      return { ok: false, message: 'Ralat sambungan: ' + (err.message || 'CORS / Ralat Rangkaian') };
    }
  }

  /**
   * Inisialisasi semula seluruh lembaran Google Sheet dengan data lengkap
   */
  static async initSheet(
    entries: TakwimRow[],
    kod: string,
    webAppUrl?: string,
    year: number = 2027
  ): Promise<{ ok: boolean; message: string }> {
    if (!webAppUrl || !webAppUrl.trim().startsWith('http')) {
      return { ok: false, message: 'URL Google Apps Script tidak sah.' };
    }

    try {
      const res = await fetch(webAppUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'initSheet',
          kod,
          year,
          entries
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          return { ok: true, message: `Berjaya memuat naik ${data.count || entries.length} baris takwim secara tersusun ke Google Sheet!` };
        } else {
          return { ok: false, message: data.error || 'Gagal inisialisasi lembaran.' };
        }
      }
      return { ok: false, message: `Ralat respons pelayan (${res.status})` };
    } catch (err: any) {
      return { ok: false, message: 'Ralat sambungan: ' + (err.message || 'CORS / Ralat Rangkaian') };
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

/**
 * Normalisasikan tarikh kepada format piawai YYYY-MM-DD
 */
export function normalizeDateKey(val: any): string {
  if (!val) return '';
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const str = String(val).trim();
  const match = str.match(/^(\\d{4})[-/.](\\d{1,2})[-/.](\\d{1,2})/);
  if (match) {
    return `${match[1]}-${String(match[2]).padStart(2, '0')}-${String(match[3]).padStart(2, '0')}`;
  }
  const dmyMatch = str.match(/^(\\d{1,2})[-/.](\\d{1,2})[-/.](\\d{4})/);
  if (dmyMatch) {
    return `${dmyMatch[3]}-${String(dmyMatch[2]).padStart(2, '0')}-${String(dmyMatch[1]).padStart(2, '0')}`;
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 2000 && parsed.getFullYear() < 2100) {
    const py = parsed.getFullYear();
    const pm = String(parsed.getMonth() + 1).padStart(2, '0');
    const pd = String(parsed.getDate()).padStart(2, '0');
    return `${py}-${pm}-${pd}`;
  }
  return str;
}

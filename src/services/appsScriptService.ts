import { SchoolSettings, TakwimRow } from '../types/takwim';

const STORAGE_KEY_ROWS = 'etakwim_rows_data_v2';
const STORAGE_KEY_SETTINGS = 'etakwim_settings_v2';

export const APPS_SCRIPT_TEMPLATE = `/**
 * ============================================================================
 * e-Takwim Sekolah KPM - Google Apps Script (Code.gs)
 * Versi 4.0 (Anti-Pertindihan Mutlak & Auto-Susun Kronologi)
 * ============================================================================
 * Ciri-ciri Utama Versi 4.0:
 * 1. PENGUNCIAN SERENTAK (LockService): Menghalang pertindihan apabila beberapa 
 *    guru atau simpanan pantas berlaku pada saat yang sama.
 * 2. KAWALAN ZON MASA TEPAT (Timezone-Safe): Membaca tarikh secara teks tulen (@)
 *    bagi mengelakkan isu tanggal beranjak atau berganda dalam Google Sheets.
 * 3. AUTO-DEDUP & AUTO-SORT: Setiap kali data disimpan, sebarang baris bertindih 
 *    dalam Google Sheet akan dicantum dan disusun rapi 1 Jan - 31 Dis secara automatik.
 *
 * CARA MENGEMASKINI DI GOOGLE SHEETS:
 * 1. Buka Google Sheet takwim anda di Google Drive.
 * 2. Klik menu: Extensions (Sambungan) > Apps Script
 * 3. Padam SEMUA kod sedia ada dalam Code.gs dan TAMPAL kod Versi 4.0 ini sepenuhnya.
 * 4. Klik ikon 'Simpan' (Disket).
 * 5. *PENTING - WAJIB*: Klik butang biru 'Deploy' (Guna) > 'Manage deployments' 
 *    (Urus penggunaan), klik ikon Pensel (Edit), pilih Version: "New version" (Versi baharu),
 *    dan klik 'Deploy'.
 *    ATAU: Klik 'Deploy' > 'New deployment' > Web app > Execute as: Me > Who has access: Anyone.
 * 6. Salin Web App URL (/exec) dan tampal ke dalam e-Takwim Sekolah.
 */

// KATA LALUAN KESELAMATAN GPK & GURU BESAR (Lalai: gpk2027)
var KOD_EDIT = "gpk2027"; 
var SHEET_NAME_CONFIG = "Tetapan_Sekolah";

function getTakwimSheetName(year) {
  var y = year || 2027;
  return "Takwim_" + y;
}

/**
 * Normalisasikan sebarang format tarikh kepada YYYY-MM-DD
 * Kalis ralat objek Date, teks bebas, dan zon masa pelayan.
 */
function normalizeDateStr(val, optTz) {
  if (!val) return '';
  var tz = optTz || SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone() || 'Asia/Kuala_Lumpur';
  
  if (val instanceof Date) {
    try {
      return Utilities.formatDate(val, tz, 'yyyy-MM-dd');
    } catch(e) {
      var year = val.getFullYear();
      var month = ('0' + (val.getMonth() + 1)).slice(-2);
      var day = ('0' + val.getDate()).slice(-2);
      return year + '-' + month + '-' + day;
    }
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
    try {
      return Utilities.formatDate(parsed, tz, 'yyyy-MM-dd');
    } catch(e) {
      var py = parsed.getFullYear();
      var pm = ('0' + (parsed.getMonth() + 1)).slice(-2);
      var pd = ('0' + parsed.getDate()).slice(-2);
      return py + '-' + pm + '-' + pd;
    }
  }
  return str;
}

function mergeFieldText(a, b) {
  var sA = String(a || '').trim();
  var sB = String(b || '').trim();
  if (!sA) return sB;
  if (!sB) return sA;
  if (sA === sB) return sA;
  if (sA.indexOf(sB) !== -1) return sA;
  if (sB.indexOf(sA) !== -1) return sB;
  return sA + '\\n' + sB;
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
    result = { status: 'OK', message: 'e-Takwim API v4 aktif' };
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
  
  // Pengesahan kod keselamatan GPK / Admin
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
  var tz = ss.getSpreadsheetTimeZone() || 'Asia/Kuala_Lumpur';
  var sheetName = getTakwimSheetName(year);
  var sheet = getOrCreateSheet(sheetName);
  var lastRow = sheet.getLastRow();
  
  var rows = [];
  var seenMap = {};
  
  if (lastRow > 1) {
    var displayData = sheet.getRange(2, 1, lastRow - 1, 7).getDisplayValues();
    var rawDates = sheet.getRange(2, 1, lastRow - 1, 1).getValues();

    for (var i = 0; i < displayData.length; i++) {
      var r = displayData[i];
      var rawDate = rawDates[i][0];
      var dateKey = normalizeDateStr(r[0], tz) || normalizeDateStr(rawDate, tz);
      if (!dateKey || dateKey.length < 8) continue;
      
      var entry = {
        d: dateKey,
        j: String(r[1] || '').trim(),
        l: String(r[2] || '').trim(),
        p: String(r[3] || '').trim(),
        k: String(r[4] || '').trim(),
        h: String(r[5] || '').trim(),
        o: String(r[6] || '').trim()
      };

      if (seenMap[dateKey] !== undefined) {
        var idx = seenMap[dateKey];
        var cur = rows[idx];
        rows[idx] = {
          d: dateKey,
          j: entry.j || cur.j,
          l: entry.l || cur.l,
          p: mergeFieldText(cur.p, entry.p),
          k: mergeFieldText(cur.k, entry.k),
          h: mergeFieldText(cur.h, entry.h),
          o: mergeFieldText(cur.o, entry.o)
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

  // Senaraikan semua tab takwim sedia ada
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

/**
 * Simpan baris takwim dengan perlindungan mutlak daripada pertindihan.
 * Setiap tarikh hanya wujud 1 kali dan disusun rapi.
 */
function saveRows(entries, year) {
  if (!entries || !entries.length) return { ok: true, count: 0 };
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tz = ss.getSpreadsheetTimeZone() || 'Asia/Kuala_Lumpur';
  var sheetName = getTakwimSheetName(year);
  var sheet = getOrCreateSheet(sheetName);

  // Kunci menggunakan LockService untuk keselamatan transaksi serentak
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch(e) {
    return { ok: false, error: 'Google Sheet sedang sibuk, sila cuba semula.' };
  }

  try {
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      var initRes = initSheet(entries, year);
      lock.releaseLock();
      return initRes;
    }

    var existingDisplay = sheet.getRange(2, 1, lastRow - 1, 7).getDisplayValues();
    var existingRawDates = sheet.getRange(2, 1, lastRow - 1, 1).getValues();

    var rowMap = {};
    var dateList = [];
    var duplicatesFound = false;

    // 1. Kumpulkan semua data sedia ada mengikut tarikh unik
    for (var i = 0; i < existingDisplay.length; i++) {
      var rawD = existingDisplay[i][0];
      var nDate = normalizeDateStr(rawD, tz) || normalizeDateStr(existingRawDates[i][0], tz);
      if (!nDate || nDate.length < 8) continue;

      if (!rowMap[nDate]) {
        rowMap[nDate] = [
          nDate,
          existingDisplay[i][1] || '',
          existingDisplay[i][2] || '',
          existingDisplay[i][3] || '',
          existingDisplay[i][4] || '',
          existingDisplay[i][5] || '',
          existingDisplay[i][6] || ''
        ];
        dateList.push(nDate);
      } else {
        // Pertindihan wujud dalam helaian sedia ada!
        duplicatesFound = true;
        for (var col = 1; col <= 6; col++) {
          rowMap[nDate][col] = mergeFieldText(rowMap[nDate][col], existingDisplay[i][col]);
        }
      }
    }

    // 2. Kemaskini dengan data baharu yang dihantar dari aplikasi
    for (var k = 0; k < entries.length; k++) {
      var item = entries[k];
      var itemDate = normalizeDateStr(item.d, tz);
      if (!itemDate || itemDate.length < 8) continue;

      var existingRow = rowMap[itemDate];
      var updatedRow = [
        itemDate,
        item.j !== undefined ? String(item.j) : (existingRow ? existingRow[1] : ''),
        item.l !== undefined ? String(item.l) : (existingRow ? existingRow[2] : ''),
        item.p !== undefined ? String(item.p) : (existingRow ? existingRow[3] : ''),
        item.k !== undefined ? String(item.k) : (existingRow ? existingRow[4] : ''),
        item.h !== undefined ? String(item.h) : (existingRow ? existingRow[5] : ''),
        item.o !== undefined ? String(item.o) : (existingRow ? existingRow[6] : '')
      ];

      if (!rowMap[itemDate]) {
        dateList.push(itemDate);
      }
      rowMap[itemDate] = updatedRow;
    }

    // 3. Susun semua tarikh secara kronologi YYYY-MM-DD
    dateList.sort();

    var finalMatrix = [];
    for (var m = 0; m < dateList.length; m++) {
      finalMatrix.push(rowMap[dateList[m]]);
    }

    // 4. Jika ada pertindihan atau bilangan baris berubah, tulis semula lembaran bersih
    if (duplicatesFound || finalMatrix.length !== (lastRow - 1)) {
      sheet.clearContents();
      var headers = [
        'Tarikh (YYYY-MM-DD)', 
        'Jenis Cuti (UMUM/PENGGAL/LAIN)', 
        'Catatan Cuti', 
        'Pentadbiran (PK1)', 
        'Kurikulum', 
        'Hal Ehwal Murid (HEM)', 
        'Kokurikulum'
      ];
      sheet.getRange(1, 1, 1, 7).setValues([headers]);
      sheet.getRange(1, 1, 1, 7)
        .setBackground('#0b6b5c')
        .setFontColor('#ffffff')
        .setFontWeight('bold')
        .setHorizontalAlignment('center');
      sheet.setFrozenRows(1);

      if (finalMatrix.length > 0) {
        sheet.getRange(2, 1, finalMatrix.length, 1).setNumberFormat('@');
        sheet.getRange(2, 1, finalMatrix.length, 7).setValues(finalMatrix);
      }
    } else {
      // Tulis pantas satu matriks
      sheet.getRange(2, 1, finalMatrix.length, 1).setNumberFormat('@');
      sheet.getRange(2, 1, finalMatrix.length, 7).setValues(finalMatrix);
    }

    SpreadsheetApp.flush();
    lock.releaseLock();
    return { 
      ok: true, 
      updated: entries.length, 
      totalUniqueRows: finalMatrix.length, 
      duplicatesCleaned: duplicatesFound 
    };
  } catch(err) {
    try { lock.releaseLock(); } catch(e) {}
    return { ok: false, error: String(err) };
  }
}

/**
 * Bersihkan SEMUA pertindihan dalam Google Sheet dan susun dari 1 Jan ke 31 Dis
 */
function cleanDuplicates(year) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tz = ss.getSpreadsheetTimeZone() || 'Asia/Kuala_Lumpur';
  var sheetName = getTakwimSheetName(year);
  var sheet = getOrCreateSheet(sheetName);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { ok: true, message: 'Lembaran kosong' };

  var lock = LockService.getScriptLock();
  try { lock.waitLock(20000); } catch(e) {}

  try {
    var existingDisplay = sheet.getRange(2, 1, lastRow - 1, 7).getDisplayValues();
    var existingRawDates = sheet.getRange(2, 1, lastRow - 1, 1).getValues();

    var uniqueMap = {};
    var dateList = [];

    for (var i = 0; i < existingDisplay.length; i++) {
      var rawD = existingDisplay[i][0];
      var dKey = normalizeDateStr(rawD, tz) || normalizeDateStr(existingRawDates[i][0], tz);
      if (!dKey || dKey.length < 8) continue;

      if (!uniqueMap[dKey]) {
        uniqueMap[dKey] = [
          dKey,
          existingDisplay[i][1] || '',
          existingDisplay[i][2] || '',
          existingDisplay[i][3] || '',
          existingDisplay[i][4] || '',
          existingDisplay[i][5] || '',
          existingDisplay[i][6] || ''
        ];
        dateList.push(dKey);
      } else {
        for (var col = 1; col <= 6; col++) {
          uniqueMap[dKey][col] = mergeFieldText(uniqueMap[dKey][col], existingDisplay[i][col]);
        }
      }
    }

    dateList.sort();
    var cleanedMatrix = dateList.map(function(k) { return uniqueMap[k]; });

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

    if (cleanedMatrix.length > 0) {
      sheet.getRange(2, 1, cleanedMatrix.length, 1).setNumberFormat('@');
      sheet.getRange(2, 1, cleanedMatrix.length, 7).setValues(cleanedMatrix);
    }
    sheet.autoResizeColumns(1, 7);
    SpreadsheetApp.flush();
    lock.releaseLock();

    return { 
      ok: true, 
      cleaned: cleanedMatrix.length, 
      originalCount: lastRow - 1,
      removed: (lastRow - 1) - cleanedMatrix.length
    };
  } catch(err) {
    try { lock.releaseLock(); } catch(e) {}
    return { ok: false, error: String(err) };
  }
}

/**
 * Inisialisasi semula seluruh lembaran 365 hari secara bersih & tersusun
 */
function initSheet(entries, year) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tz = ss.getSpreadsheetTimeZone() || 'Asia/Kuala_Lumpur';
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
  sheet.getRange(1, 1, 1, 7)
    .setBackground('#0b6b5c')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
  
  sheet.setFrozenRows(1);
  
  if (entries && entries.length) {
    // Susun secara kronologi dan buang sebarang duplikasi
    var uniqueMap = {};
    var dateList = [];
    
    for (var i = 0; i < entries.length; i++) {
      var item = entries[i];
      var dKey = normalizeDateStr(item.d, tz);
      if (!dKey || dKey.length < 8) continue;
      
      if (!uniqueMap[dKey]) {
        uniqueMap[dKey] = [
          dKey, 
          item.j || '', 
          item.l || '', 
          item.p || '', 
          item.k || '', 
          item.h || '', 
          item.o || ''
        ];
        dateList.push(dKey);
      } else {
        uniqueMap[dKey][1] = item.j || uniqueMap[dKey][1];
        uniqueMap[dKey][2] = item.l || uniqueMap[dKey][2];
        uniqueMap[dKey][3] = mergeFieldText(uniqueMap[dKey][3], item.p);
        uniqueMap[dKey][4] = mergeFieldText(uniqueMap[dKey][4], item.k);
        uniqueMap[dKey][5] = mergeFieldText(uniqueMap[dKey][5], item.h);
        uniqueMap[dKey][6] = mergeFieldText(uniqueMap[dKey][6], item.o);
      }
    }
    
    dateList.sort();
    var batch = dateList.map(function(k) { return uniqueMap[k]; });
    
    sheet.getRange(2, 1, batch.length, 1).setNumberFormat('@');
    sheet.getRange(2, 1, batch.length, 7).setValues(batch);
  }
  
  sheet.autoResizeColumns(1, 7);
  return { ok: true, count: entries ? entries.length : 0 };
}

function saveSettings(settings) {
  var sheet = getOrCreateSheet(SHEET_NAME_CONFIG);
  sheet.clear();
  sheet.appendRow(['Kunci Tetapan', 'Nilai']);
  sheet.getRange(1, 1, 1, 2).setBackground('#084f44').setFontColor('#ffffff').setFontWeight('bold');
  
  var keys = Object.keys(settings || {});
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    var val = settings[k];
    if (typeof val === 'string' && val.length > 45000) {
      continue;
    }
    sheet.appendRow([k, val]);
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
            // Dapatkan tetapan pusat daripada pelayan (/api/settings) untuk logo & metadata sekolah
            let centralSettings: Partial<SchoolSettings> = {};
            try {
              const sRes = await fetch(`/api/settings?_t=${Date.now()}`);
              if (sRes.ok) {
                const sJson = await sRes.json();
                if (sJson && sJson.settings) {
                  centralSettings = sJson.settings;
                }
              }
            } catch (e) {}

            const cachedSettings = this.getLocalSettings();
            const mergedSettings: Partial<SchoolSettings> = {
              ...cachedSettings,
              ...(json.settings || {}),
              ...centralSettings
            };

            // Pastikan maklumat utama sekolah (nama, kod, logo) tidak hilang jika helaian Google Sheet tiada menyimpannya
            if (centralSettings.sekolah && (!mergedSettings.sekolah || mergedSettings.sekolah === 'SEKOLAH KEBANGSAAN SERI BINTANG' || mergedSettings.sekolah === 'SK Seri Bintang Selatan')) {
              mergedSettings.sekolah = centralSettings.sekolah;
            }
            if (centralSettings.kodSekolah && (!mergedSettings.kodSekolah || mergedSettings.kodSekolah === 'WBA0001')) {
              mergedSettings.kodSekolah = centralSettings.kodSekolah;
            }
            if (centralSettings.logoSekolah) {
              mergedSettings.logoSekolah = centralSettings.logoSekolah;
            }
            if (centralSettings.logoTs25) {
              mergedSettings.logoTs25 = centralSettings.logoTs25;
            }
            if (centralSettings.guruBesar) {
              mergedSettings.guruBesar = centralSettings.guruBesar;
            }
            if (centralSettings.gpkPentadbiran) {
              mergedSettings.gpkPentadbiran = centralSettings.gpkPentadbiran;
            }
            if (centralSettings.gpkKurikulum) {
              mergedSettings.gpkKurikulum = centralSettings.gpkKurikulum;
            }
            if (centralSettings.gpkHem) {
              mergedSettings.gpkHem = centralSettings.gpkHem;
            }
            if (centralSettings.gpkKoko) {
              mergedSettings.gpkKoko = centralSettings.gpkKoko;
            }

            try {
              localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(mergedSettings));
            } catch (storageErr) {
              try {
                const compact = { ...mergedSettings, logoSekolah: '', logoTs25: '' };
                localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(compact));
              } catch {}
            }
            return {
              rows: json.rows,
              settings: mergedSettings,
              availableYears: json.availableYears,
              source: 'cloud'
            };
          }
        }
      } catch (err) {
        console.warn('Gagal memuat turun dari Google Apps Script Web App, beralih ke cache tempatan:', err);
      }
    }

    // 2. Semak dari Pelayan Pusat (/api/takwim) jika peranti baharu (cth: telefon pintar atau laptop lain)
    try {
      const serverRes = await fetch(`/api/takwim?year=${year}&_t=${Date.now()}`);
      if (serverRes.ok) {
        const serverData = await serverRes.json();
        if (serverData && (serverData.settings || (serverData.rows && Object.keys(serverData.rows).length > 0))) {
          const sRows = serverData.rows ? Object.values(serverData.rows) as TakwimRow[] : [];
          
          // Jika telefon/peranti belum ada URL Google Sheet, tetapi pelayan pusat ada:
          if (serverData.settings?.googleWebAppUrl && (!webAppUrl || !webAppUrl.trim())) {
            // Muat terus dari Google Sheet sekolah tersebut
            try {
              const cloudRes = await this.loadData(serverData.settings.googleWebAppUrl, year);
              if (cloudRes.source === 'cloud') {
                return cloudRes;
              }
            } catch (e) {
              // Teruskan dengan data pelayan jika gagal
            }
          }

          if (sRows.length > 0 || serverData.settings) {
            const cachedSettings = this.getLocalSettings();
            const mergedSettings = { ...cachedSettings, ...(serverData.settings || {}) };
            if (serverData.settings?.sekolah && (!mergedSettings.sekolah || mergedSettings.sekolah === 'SK Seri Bintang Selatan' || mergedSettings.sekolah === 'SEKOLAH KEBANGSAAN SERI BINTANG')) {
              mergedSettings.sekolah = serverData.settings.sekolah;
            }
            if (serverData.settings?.logoSekolah) {
              mergedSettings.logoSekolah = serverData.settings.logoSekolah;
            }
            if (serverData.settings?.logoTs25) {
              mergedSettings.logoTs25 = serverData.settings.logoTs25;
            }
            try {
              localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(mergedSettings));
            } catch (storageErr) {
              try {
                const compact = { ...mergedSettings, logoSekolah: '', logoTs25: '' };
                localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(compact));
              } catch {}
            }
            return {
              rows: sRows.length > 0 ? sRows : this.getLocalRows(year),
              settings: mergedSettings,
              source: 'cloud'
            };
          }
        }
      }
    } catch (e) {
      // Abaikan jika luar talian / persekitaran tiada pelayan API
    }

    // 3. Fallback ke storan tempatan mengikut tahun
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
  ): Promise<{ ok: boolean; source: 'cloud' | 'local'; error?: string; duplicatesCleaned?: boolean }> {
    // Simpan ke storan tempatan mengikut tahun untuk jaminan keselamatan data
    this.updateLocalRows(entries, year);

    // Simpan salinan ke Pelayan Pusat (/api/takwim) supaya semua peranti (telefon dll) segera dapat data ini
    try {
      fetch('/api/takwim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries, year })
      }).catch(() => {});
    } catch (e) {
      // Abaikan jika luar talian
    }

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
          return { ok: true, source: 'cloud', duplicatesCleaned: Boolean(result && result.duplicatesCleaned) };
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
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      try {
        const compact = { ...settings, logoSekolah: '', logoTs25: '' };
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(compact));
      } catch {}
    }

    // Simpan ke Pelayan Pusat (/api/settings)
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      });
    } catch (e) {
      console.warn('Gagal menyimpan tetapan ke pelayan pusat:', e);
    }

    if (webAppUrl && webAppUrl.trim().startsWith('http')) {
      try {
        const sheetSettings: any = { ...settings };
        if (typeof sheetSettings.logoSekolah === 'string' && sheetSettings.logoSekolah.length > 45000) {
          delete sheetSettings.logoSekolah;
        }
        if (typeof sheetSettings.logoTs25 === 'string' && sheetSettings.logoTs25.length > 45000) {
          delete sheetSettings.logoTs25;
        }

        await fetch(webAppUrl.trim(), {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'saveSettings',
            kod,
            settings: sheetSettings
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
   * Bersihkan pertindihan baris dalam helaian Google Sheet secara automatik.
   * Dilengkapi fallback bijak menggunakan initSheet sekiranya skrip pengguna belum dinaik taraf ke v4.
   */
  static async cleanDuplicates(
    kod: string,
    webAppUrl?: string,
    year: number = 2027,
    fallbackRows?: TakwimRow[]
  ): Promise<{ ok: boolean; message: string }> {
    if (!webAppUrl || !webAppUrl.trim().startsWith('http')) {
      return { ok: false, message: 'URL Google Apps Script tidak sah. Sila sambungkan Google Sheet terlebih dahulu.' };
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
        if (data && data.ok) {
          const removedNote = data.removed !== undefined && data.removed > 0 
            ? ` (${data.removed} baris pertindihan berjaya dibuang!)` 
            : ' (Tiada pertindihan dikesan, data disusun rapi)';
          return {
            ok: true,
            message: `Pembersihan berjaya! Sebanyak ${data.cleaned || 0} tarikh disusun secara kronologi${removedNote}.`
          };
        }
      }
    } catch (err: any) {
      console.warn('Endpoint cleanDuplicates gagal, mencuba fallback initSheet:', err);
    }

    // FALLBACK PINTAR: Jika skrip di Apps Script adalah versi lama yang belum ada endpoint cleanDuplicates,
    // kita susun dan buang pertindihan secara klien dan inisialisasi semula lembaran melalui initSheet!
    if (fallbackRows && fallbackRows.length > 0) {
      try {
        const uniqueMap: Record<string, TakwimRow> = {};
        fallbackRows.forEach(r => {
          const dKey = normalizeDateKey(r.d);
          if (dKey) {
            uniqueMap[dKey] = r;
          }
        });
        const cleanSorted = Object.values(uniqueMap).sort((a, b) => a.d.localeCompare(b.d));

        const initRes = await this.initSheet(cleanSorted, kod, webAppUrl, year);
        if (initRes.ok) {
          return {
            ok: true,
            message: `Pertindihan berjaya dibersihkan! Sebanyak ${cleanSorted.length} baris takwim telah disusun semula tanpa pertindihan ke Google Sheet.`
          };
        }
      } catch (fallbackErr: any) {
        return { ok: false, message: 'Gagal membersihkan lembaran: ' + (fallbackErr.message || 'Ralat') };
      }
    }

    return { ok: false, message: 'Gagal menghubungi Google Sheet. Sila pastikan Web App URL betul dan aktif.' };
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
      current.forEach(r => { 
        const normD = normalizeDateKey(r.d);
        if (normD) map[normD] = { ...r, d: normD }; 
      });
      updatedEntries.forEach(r => { 
        const normD = normalizeDateKey(r.d);
        if (normD) map[normD] = { ...r, d: normD }; 
      });
      const storageKey = this.getStorageKeyRows(year);
      localStorage.setItem(storageKey, JSON.stringify(Object.values(map)));

      // Segerakkan ke Pelayan Pusat untuk peranti lain (telefon pintar dll)
      try {
        fetch('/api/takwim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entries: updatedEntries, year })
        }).catch(() => {});
      } catch (e) {
        // Abaikan jika luar talian
      }
    } catch (e) {
      console.warn('Gagal mengemas kini local storage', e);
    }
  }

  /**
   * Segerakkan takwim semasa ke pelayan pusat
   */
  static async syncToServer(rows: Record<string, TakwimRow>, settings?: Partial<SchoolSettings>, year: number = 2027): Promise<void> {
    try {
      await fetch('/api/takwim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows, settings, year })
      });
    } catch {
      // Abaikan jika luar talian
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
  const match = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (match) {
    return `${match[1]}-${String(match[2]).padStart(2, '0')}-${String(match[3]).padStart(2, '0')}`;
  }
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
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

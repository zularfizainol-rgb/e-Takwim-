import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'takwim_db.json');

// Pastikan folder data wujud
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface TakwimDB {
  settings?: any;
  rows?: Record<string, any>;
  updatedAt?: string;
}

function readDB(): TakwimDB {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading takwim DB:', err);
  }
  return {};
}

function writeDB(data: TakwimDB) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing takwim DB:', err);
  }
}

app.use(express.json({ limit: '15mb' }));

// ============================================================================
// API ROUTES: Storan Terpusat Takwim & Tetapan Sekolah
// Memastikan semua peranti (komputer, telefon pintar, tablet) berkongsi takwim yang sama
// ============================================================================

// Dapatkan takwim & tetapan terkini sekolah
app.get('/api/takwim', (req, res) => {
  const db = readDB();
  res.json({
    ok: true,
    settings: db.settings || null,
    rows: db.rows || {},
    updatedAt: db.updatedAt || null
  });
});

// Simpan atau segerakkan takwim & tetapan
app.post('/api/takwim', (req, res) => {
  try {
    const { settings, rows, entries } = req.body;
    const db = readDB();

    if (settings) {
      db.settings = { ...(db.settings || {}), ...settings };
    }

    if (rows && typeof rows === 'object') {
      db.rows = { ...(db.rows || {}), ...rows };
    } else if (Array.isArray(entries)) {
      const currentRows = db.rows || {};
      entries.forEach((item: any) => {
        if (item && item.d) {
          currentRows[item.d] = { ...(currentRows[item.d] || {}), ...item };
        }
      });
      db.rows = currentRows;
    }

    db.updatedAt = new Date().toISOString();
    writeDB(db);

    res.json({ ok: true, message: 'Takwim berjaya disimpan di pelayan pusat.' });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message || 'Gagal menyimpan takwim.' });
  }
});

// Dapatkan tetapan sekolah sahaja
app.get('/api/settings', (req, res) => {
  const db = readDB();
  res.json({ ok: true, settings: db.settings || null });
});

// Kemaskini tetapan sekolah
app.post('/api/settings', (req, res) => {
  try {
    const { settings } = req.body;
    const db = readDB();
    if (settings) {
      db.settings = { ...(db.settings || {}), ...settings };
      db.updatedAt = new Date().toISOString();
      writeDB(db);
    }
    res.json({ ok: true, settings: db.settings });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ============================================================================
// VITE SPA DEV / PROD MIDDLEWARE
// ============================================================================
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Takwim Server running on port ${PORT}`);
  });
}

startServer();

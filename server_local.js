// ======================================================================
// Blucher Project Tracker - Local Node.js Express/HTTP Runner & Sync
// ======================================================================

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Silently load .env if present
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(envPath);
    console.log('[ENV] Loaded configuration from .env');
  } catch (err) {
    console.warn('[ENV] Warning: Failed to load .env automatically', err.message);
  }
}

// 2. Local D1 SQLite Adapter wrapping Node's native DatabaseSync
function createLocalD1(dbFilePath) {
  const sqlite = new DatabaseSync(dbFilePath);

  // Enable WAL mode for better concurrency
  try {
    sqlite.exec('PRAGMA journal_mode = WAL;');
    sqlite.exec('PRAGMA foreign_keys = ON;');
  } catch (e) {
    // ignore
  }

  return {
    prepare(sql) {
      let boundParams = [];
      return {
        bind(...params) {
          boundParams = params;
          return this;
        },
        async first(col) {
          const stmt = sqlite.prepare(sql);
          const row = stmt.get(...boundParams);
          if (!row) return null;
          if (col) return row[col];
          return row;
        },
        async all() {
          const stmt = sqlite.prepare(sql);
          const rows = stmt.all(...boundParams);
          return { results: rows };
        },
        async run() {
          const stmt = sqlite.prepare(sql);
          const info = stmt.run(...boundParams);
          return { success: true, meta: info };
        }
      };
    },
    async exec(sql) {
      sqlite.exec(sql);
      return { success: true };
    },
    async batch(statements) {
      const results = [];
      for (const stmt of statements) {
        if (typeof stmt.run === 'function') {
          results.push(await stmt.run());
        }
      }
      return results;
    }
  };
}

const localDbPath = path.join(__dirname, 'local_db.sqlite');
const localD1 = createLocalD1(localDbPath);

// 3. Import Worker handler
import worker from './worker/src/index.js';
import { initDatabase, getProjectById, getDailyLogs } from './worker/src/db.js';

// Standard Cloudflare Security Headers
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
};

// Environment object matching Cloudflare Worker bindings
const workerEnv = {
  DB: localD1,
  LINE_CHANNEL_SECRET: process.env.LINE_CHANNEL_SECRET || '',
  LINE_CHANNEL_ACCESS_TOKEN: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || '',
  ALLOWED_LINE_USERS: process.env.ALLOWED_LINE_USERS || '',
  ENVIRONMENT: 'local-development'
};

// 4. Desktop Scanner & Sync Handlers (Local Node Capabilities)
const DESKTOP_DIR = path.join(process.env.USERPROFILE || 'C:\\Users\\nattc', 'OneDrive', 'Desktop');

async function handleScanDesktopFolders(req, res) {
  try {
    if (!fs.existsSync(DESKTOP_DIR)) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, folders: [] }));
    }

    const entries = fs.readdirSync(DESKTOP_DIR, { withFileTypes: true });
    const folders = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const folderName = entry.name;

        // STRICT SAFETY CHECK:
        // NEVER inspect or expose forbidden '4.วางสเปค'
        if (folderName === '4.วางสเปค') continue;

        const fullPath = path.join(DESKTOP_DIR, folderName);
        const aiSubfolder = path.join(fullPath, 'AI_สร้าง_ข้อมูลและรูปจาก_LINE');
        const hasAiSubfolder = fs.existsSync(aiSubfolder);

        // Check if matching Blucher project folder
        const isProjectFolder = /^(ศนท|อบต|พี่บอม|โครงการ)/.test(folderName);

        folders.push({
          name: folderName,
          fullPath,
          isProjectFolder,
          hasAiSubfolder,
          targetSubfolder: aiSubfolder
        });
      }
    }

    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      ...SECURITY_HEADERS
    });
    return res.end(JSON.stringify({
      success: true,
      desktopPath: DESKTOP_DIR,
      subfolderRule: 'AI_สร้าง_ข้อมูลและรูปจาก_LINE',
      folders
    }));
  } catch (err) {
    console.error('Scan desktop error:', err);
    res.writeHead(500, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      ...SECURITY_HEADERS
    });
    return res.end(JSON.stringify({ success: false, error: 'Internal folder scan error' }));
  }
}

async function handleSyncToDesktop(body, res) {
  try {
    const { projectId } = body;
    if (!projectId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'projectId is required' }));
    }

    const project = await getProjectById(localD1, projectId);
    if (!project) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'Project not found' }));
    }

    if (!project.folder_path || !fs.existsSync(project.folder_path)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: false,
        error: `Project folder path does not exist on desktop: ${project.folder_path}`
      }));
    }

    // STRICT USER RULE:
    // Files must strictly be saved in <โฟลเดอร์โครงการ>\AI_สร้าง_ข้อมูลและรูปจาก_LINE\
    const targetDir = path.join(project.folder_path, 'AI_สร้าง_ข้อมูลและรูปจาก_LINE');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Fetch all logs for this project
    const logs = await getDailyLogs(localD1, projectId);

    // 1. Write structured JSON log
    const jsonPath = path.join(targetDir, '_Site_Progress_Auto.json');
    fs.writeFileSync(jsonPath, JSON.stringify({
      project: {
        id: project.id,
        name: project.name,
        actual_progress: project.actual_progress,
        daily_workers: project.daily_workers,
        status: project.status,
        updated_at: project.updated_at
      },
      lastSyncedAt: new Date().toISOString(),
      dailyLogs: logs
    }, null, 2), 'utf8');

    // 2. Write Markdown site log
    const mdPath = path.join(targetDir, '_Site_Progress_Auto.md');
    let mdContent = `# บันทึกความคืบหน้าหน้างาน (AI สร้างอัตโนมัติจาก LINE)\n\n`;
    mdContent += `**โครงการ:** ${project.name} (${project.id})\n`;
    mdContent += `**ความคืบหน้า:** ${project.actual_progress}%\n`;
    mdContent += `**คนงานล่าสุด:** ${project.daily_workers} คน\n`;
    mdContent += `**อัปเดตล่าสุด:** ${new Date().toLocaleString('th-TH')}\n\n`;
    mdContent += `---\n\n## ประวัติรายงานประจำวัน\n\n`;

    for (const log of logs) {
      mdContent += `### 📅 ${log.log_date || 'ไม่ระบุวันที่'} - โดย ${log.sender_name || 'ช่างหน้างาน'}\n`;
      mdContent += `- **สรุปงาน:** ${log.summary || '-'}\n`;
      if (log.area_sqm_done) mdContent += `- **พื้นที่แล้วเสร็จ:** ${log.area_sqm_done} ตร.ม.\n`;
      if (log.worker_count) mdContent += `- **จำนวนช่าง:** ${log.worker_count} คน\n`;
      if (log.photo_url) mdContent += `- **รูปภาพ:** [เปิดดูรูปภาพ](${log.photo_url})\n`;
      mdContent += `\n`;
    }

    fs.writeFileSync(mdPath, mdContent, 'utf8');

    // Mark synced in database
    await localD1.prepare('UPDATE daily_logs SET synced_to_pc = 1 WHERE project_id = ?').bind(projectId).run();

    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      ...SECURITY_HEADERS
    });
    return res.end(JSON.stringify({
      success: true,
      message: 'ซิงค์ข้อมูลลงในโฟลเดอร์ AI_สร้าง_ข้อมูลและรูปจาก_LINE เรียบร้อยแล้ว',
      targetDir,
      syncedLogsCount: logs.length,
      filesGenerated: ['_Site_Progress_Auto.json', '_Site_Progress_Auto.md']
    }));
  } catch (err) {
    console.error('Sync error:', err);
    res.writeHead(500, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      ...SECURITY_HEADERS
    });
    return res.end(JSON.stringify({ success: false, error: 'Internal sync error' }));
  }
}

// 5. MIME Types Dictionary for Static Files
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

// 6. HTTP Server Implementation
const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || '*';

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-line-signature, x-mock-test, x-api-key',
      'Access-Control-Max-Age': '86400',
      ...SECURITY_HEADERS
    });
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // ------------------------------------------------------------------
  // A. Local-Specific Endpoints
  // ------------------------------------------------------------------
  if (pathname === '/api/scan-desktop-folders' && req.method === 'GET') {
    return await handleScanDesktopFolders(req, res);
  }

  if (pathname === '/api/sync-to-desktop' && req.method === 'POST') {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const bodyText = Buffer.concat(chunks).toString('utf8');
    let body = {};
    try { body = JSON.parse(bodyText); } catch (e) {}
    return await handleSyncToDesktop(body, res);
  }

  // ------------------------------------------------------------------
  // B. Worker REST API Endpoints (100% Shared Cloudflare Worker Logic)
  // ------------------------------------------------------------------
  if (pathname.startsWith('/api/')) {
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const reqBody = chunks.length > 0 ? Buffer.concat(chunks) : undefined;

      const webReq = new Request(url.href, {
        method: req.method,
        headers: req.headers,
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : reqBody,
        duplex: 'half'
      });

      const webRes = await worker.fetch(webReq, workerEnv, {});

      // Copy headers to Node res
      const resHeaders = {};
      webRes.headers.forEach((val, key) => {
        resHeaders[key] = val;
      });

      res.writeHead(webRes.status, resHeaders);
      const resBuffer = await webRes.arrayBuffer();
      return res.end(Buffer.from(resBuffer));
    } catch (err) {
      console.error('API Error:', err);
      res.writeHead(500, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        ...SECURITY_HEADERS
      });
      return res.end(JSON.stringify({ error: 'Local server API error', success: false }));
    }
  }

  // ------------------------------------------------------------------
  // C. Static Files Frontend Serving
  // ------------------------------------------------------------------
  let filePath = '';

  if (pathname === '/' || pathname === '/index.html') {
    // Check if frontend/index.html exists
    const frontendIndex = path.join(__dirname, 'frontend', 'index.html');
    if (fs.existsSync(frontendIndex)) {
      filePath = frontendIndex;
    } else {
      // Fallback to BuildTrack_Dashboard_Demo.html
      filePath = path.join(__dirname, 'BuildTrack_Dashboard_Demo.html');
    }
  } else {
    // Check in frontend/ or root
    const inFrontend = path.join(__dirname, 'frontend', pathname);
    const inRoot = path.join(__dirname, pathname);

    if (fs.existsSync(inFrontend) && fs.statSync(inFrontend).isFile()) {
      filePath = inFrontend;
    } else if (fs.existsSync(inRoot) && fs.statSync(inRoot).isFile()) {
      filePath = inRoot;
    }
  }

  if (filePath && fs.existsSync(filePath)) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      ...SECURITY_HEADERS
    });
    return fs.createReadStream(filePath).pipe(res);
  }

  // 404 for Static
  res.writeHead(404, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    ...SECURITY_HEADERS
  });
  return res.end('404 Not Found - BuildTrack Project Tracker');
});

// 7. Initialize Database & Start Server
const PORT = parseInt(process.env.PORT || '3000', 10);

(async () => {
  try {
    console.log('[DB] Initializing local SQLite database...');
    const seedResult = await initDatabase(localD1);
    console.log('[DB] Database ready.', seedResult);

    server.listen(PORT, '0.0.0.0', () => {
      console.log('================================================================');
      console.log('🚀 Blucher Project Tracker & 2-Way LINE AI Bot Server');
      console.log(`🌐 Local Web Dashboard:  http://localhost:${PORT}`);
      console.log(`📡 Local API Endpoint:   http://localhost:${PORT}/api/bootstrap`);
      console.log(`📲 LINE Webhook URL:     http://localhost:${PORT}/api/line-webhook`);
      console.log(`📁 Desktop Scan API:     http://localhost:${PORT}/api/scan-desktop-folders`);
      console.log(`🛡️ Target Subfolder:     <Project>\\AI_สร้าง_ข้อมูลและรูปจาก_LINE\\`);
      console.log('================================================================');
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();

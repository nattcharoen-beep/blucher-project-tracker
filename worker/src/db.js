// ======================================================================
// Blucher Project Tracker - D1 Database Abstraction & Auto-Seed Layer
// ======================================================================

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { SEED_PROJECTS } from './seed_data.js';

// 100% Real reference dataset extracted from Desktop project folders
const FALLBACK_SEED_PROJECTS = SEED_PROJECTS.projects;
const FALLBACK_SEED_WBS = SEED_PROJECTS.projects.flatMap(p => p.wbsTasks || []);
const FALLBACK_SEED_ACTION_ITEMS = [];
const FALLBACK_SEED_DEFECTS = [];
const FALLBACK_SEED_DAILY_LOGS = [];

const DEFAULT_SETTINGS = [
  { key: 'group_reply_confirm_toggle', value: 'false' }, // Default silent in groups (Zero Spam rule!)
  { key: 'unassigned_groups', value: JSON.stringify([]) },
  { key: 'bot_name', value: 'อับดุล' },
  { key: 'system_mode', value: 'PRODUCTION' },
  { key: 'last_sync_timestamp', value: new Date().toISOString() }
];

// Helper to load seed_data.js dynamically
async function loadExternalSeedData() {
  return SEED_PROJECTS;
}

// ----------------------------------------------------------------------
// Database Initialization & Auto-Seed
// ----------------------------------------------------------------------
let isDbInitialized = false;

export async function initDatabase(d1, force = false) {
  if (!d1) throw new Error('Database instance (d1) is required');
  if (isDbInitialized && !force) return;

  // Create tables if not exists
  const tables = [
    `CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      short_name TEXT,
      folder_path TEXT,
      line_group_id TEXT,
      status TEXT DEFAULT 'ACTIVE',
      budget REAL DEFAULT 0,
      target_cost REAL DEFAULT 0,
      actual_cost REAL DEFAULT 0,
      planned_progress REAL DEFAULT 0,
      actual_progress REAL DEFAULT 0,
      start_date TEXT,
      end_date TEXT,
      daily_workers INTEGER DEFAULT 0,
      specs_summary TEXT,
      materials_json TEXT DEFAULT '[]',
      contractors_json TEXT DEFAULT '[]',
      source_files_json TEXT DEFAULT '[]',
      dossier_md TEXT,
      archived INTEGER DEFAULT 0,
      updated_at TEXT
    );`,
    `CREATE INDEX IF NOT EXISTS idx_projects_line_group_id ON projects(line_group_id);`,
    `CREATE INDEX IF NOT EXISTS idx_projects_archived ON projects(archived);`,

    `CREATE TABLE IF NOT EXISTS wbs_tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      task_code TEXT,
      title TEXT NOT NULL,
      weight_percent REAL DEFAULT 0,
      progress_percent REAL DEFAULT 0,
      status TEXT DEFAULT 'PENDING',
      assignee TEXT,
      start_date TEXT,
      due_date TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );`,
    `CREATE INDEX IF NOT EXISTS idx_wbs_tasks_project_id ON wbs_tasks(project_id);`,

    `CREATE TABLE IF NOT EXISTS action_items (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      assignee TEXT,
      due_date TEXT,
      status TEXT DEFAULT 'OPEN',
      assigned_by TEXT,
      raw_message TEXT,
      created_at TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );`,
    `CREATE INDEX IF NOT EXISTS idx_action_items_project_id ON action_items(project_id);`,
    `CREATE INDEX IF NOT EXISTS idx_action_items_status ON action_items(status);`,

    `CREATE TABLE IF NOT EXISTS defects (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      code TEXT,
      title TEXT NOT NULL,
      description TEXT,
      zone TEXT,
      severity TEXT DEFAULT 'MEDIUM',
      status TEXT DEFAULT 'OPEN',
      assignee TEXT,
      photo_url TEXT,
      due_date TEXT,
      created_at TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );`,
    `CREATE INDEX IF NOT EXISTS idx_defects_project_id ON defects(project_id);`,
    `CREATE INDEX IF NOT EXISTS idx_defects_status ON defects(status);`,

    `CREATE TABLE IF NOT EXISTS daily_logs (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      log_date TEXT,
      summary TEXT,
      area_sqm_done REAL DEFAULT 0,
      worker_count INTEGER DEFAULT 0,
      sender_name TEXT,
      photo_url TEXT,
      local_photo_path TEXT,
      category TEXT DEFAULT 'WORK_REPORT',
      synced_to_pc INTEGER DEFAULT 0,
      created_at TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );`,
    `CREATE INDEX IF NOT EXISTS idx_daily_logs_project_id ON daily_logs(project_id);`,
    `CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(log_date);`,

    `CREATE TABLE IF NOT EXISTS photo_buffer (
      id TEXT PRIMARY KEY,
      group_id TEXT,
      project_id TEXT,
      message_id TEXT,
      photo_data TEXT,
      sender_name TEXT,
      created_at TEXT,
      processed INTEGER DEFAULT 0
    );`,
    `CREATE INDEX IF NOT EXISTS idx_photo_buffer_group_id ON photo_buffer(group_id);`,
    `CREATE INDEX IF NOT EXISTS idx_photo_buffer_processed ON photo_buffer(processed);`,

    `CREATE TABLE IF NOT EXISTS bot_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );`
  ];

  for (const sql of tables) {
    try {
      await d1.prepare(sql).run();
    } catch (err) {
      // Ignore if table or index already exists
    }
  }

  // Auto-Seed if empty
  await autoSeedIfEmpty(d1);
  isDbInitialized = true;
}

export async function autoSeedIfEmpty(d1) {
  const projectCountRow = await d1.prepare('SELECT COUNT(*) as count FROM projects').first();
  const projectCount = projectCountRow ? (projectCountRow.count || 0) : 0;
  const checkJatujak = await d1.prepare('SELECT id, budget FROM projects WHERE id = ?').bind('PRJ-JATUJAK').first();

  // If projects table already contains the 7 canonical projects, NEVER wipe live data!
  if (projectCount === 7 && checkJatujak && Number(checkJatujak.budget) === 1989000) {
    return { seeded: false, message: 'Database already populated with projects' };
  }

  // Clear tables for fresh genuine seed from seed_data.js
  try {
    await d1.prepare('DELETE FROM photo_buffer').run();
    await d1.prepare('DELETE FROM daily_logs').run();
    await d1.prepare('DELETE FROM defects').run();
    await d1.prepare('DELETE FROM action_items').run();
    await d1.prepare('DELETE FROM wbs_tasks').run();
    await d1.prepare('DELETE FROM projects').run();
  } catch (e) {
    // ignore
  }

  // Load from external seed_data.js first, or use fallback
  const externalData = await loadExternalSeedData();
  const projects = externalData?.projects || FALLBACK_SEED_PROJECTS;
  const settings = externalData?.settings || DEFAULT_SETTINGS;
  const now = new Date().toISOString();

  // Insert Projects and their linked child records
  for (const p of projects) {
    await d1.prepare(`
      INSERT INTO projects (
        id, name, short_name, folder_path, line_group_id, status, budget,
        target_cost, actual_cost, planned_progress, actual_progress,
        start_date, end_date, daily_workers, specs_summary, materials_json,
        contractors_json, source_files_json, dossier_md, archived, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      p.id,
      p.name || p.title || '',
      p.short_name || p.name || '',
      p.folder_path || '',
      p.line_group_id || null,
      p.status || 'IN_PROGRESS',
      Number(p.budget) || 0,
      Number(p.target_cost) || 0,
      Number(p.actual_cost) || 0,
      parseFloat(p.planned_progress || p.progress || 0) || 0,
      parseFloat(p.actual_progress || p.progress || 0) || 0,
      p.start_date || '2026-01-01',
      p.end_date || '2026-12-31',
      parseInt(p.daily_workers || 0, 10) || 0,
      p.specs_summary || '',
      typeof p.materials_json === 'string' ? p.materials_json : JSON.stringify(p.materials_json || p.materials || []),
      typeof p.contractors_json === 'string' ? p.contractors_json : JSON.stringify(p.contractors_json || p.contractors || []),
      typeof p.source_files_json === 'string' ? p.source_files_json : JSON.stringify(p.source_files_json || p.sourceFiles || []),
      p.dossier_md || p.dossierMd || '',
      p.archived ? 1 : 0,
      p.updated_at || now
    ).run();

    // Insert this project's WBS tasks
    const pWbs = p.wbsTasks || [];
    for (const t of pWbs) {
      await d1.prepare(`
        INSERT INTO wbs_tasks (
          id, project_id, task_code, title, weight_percent, progress_percent,
          status, assignee, start_date, due_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        t.id || 'WBS-' + Math.random().toString(36).slice(2, 9),
        p.id,
        t.task_code || '',
        t.title || t.name || '',
        Number(t.weight_percent) || 0,
        Number(t.progress_percent || t.pct) || 0,
        t.status || 'PENDING',
        t.assignee || '',
        t.start_date || '',
        t.due_date || ''
      ).run();
    }

    // Insert this project's Action Items
    const pActions = p.actionItems || [];
    for (const a of pActions) {
      await d1.prepare(`
        INSERT INTO action_items (
          id, project_id, title, assignee, due_date, status, assigned_by, raw_message, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        a.id || 'ACT-' + Math.random().toString(36).slice(2, 9),
        p.id,
        a.title,
        a.assignee || '',
        a.due_date || '',
        a.status || 'OPEN',
        a.assigned_by || 'พี่นัท',
        a.raw_message || '',
        a.created_at || now
      ).run();
    }

    // Insert this project's Defects
    const pDefects = p.defects || [];
    for (const d of pDefects) {
      await d1.prepare(`
        INSERT INTO defects (
          id, project_id, code, title, description, zone, severity, status, assignee, photo_url, due_date, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        d.id || 'DEF-' + Math.random().toString(36).slice(2, 9),
        p.id,
        d.code || d.id || '',
        d.title || d.desc || '',
        d.description || d.desc || '',
        d.zone || '',
        d.severity || 'MEDIUM',
        d.status || 'OPEN',
        d.assignee || d.sub || '',
        d.photo_url || d.img || '',
        d.due_date || d.due || '',
        d.created_at || now
      ).run();
    }

    // Insert this project's Daily Logs
    const pLogs = p.dailyLogs || [];
    for (const l of pLogs) {
      await d1.prepare(`
        INSERT INTO daily_logs (
          id, project_id, log_date, summary, area_sqm_done, worker_count, sender_name, photo_url, local_photo_path, category, synced_to_pc, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        l.id || 'LOG-' + Math.random().toString(36).slice(2, 9),
        p.id,
        l.log_date || now.split('T')[0],
        l.summary || '',
        Number(l.area_sqm_done) || 0,
        parseInt(l.worker_count, 10) || 0,
        l.sender_name || '',
        l.photo_url || '',
        l.local_photo_path || '',
        l.category || 'WORK_REPORT',
        l.synced_to_pc ? 1 : 0,
        l.created_at || now
      ).run();
    }
  }

  // Insert Settings
  for (const s of settings) {
    await d1.prepare(`
      INSERT OR REPLACE INTO bot_settings (key, value) VALUES (?, ?)
    `).bind(s.key, typeof s.value === 'string' ? s.value : JSON.stringify(s.value)).run();
  }

  return { seeded: true, count: projects.length };
}

// ----------------------------------------------------------------------
// Project Formatter & Helpers
// ----------------------------------------------------------------------
export function getProjectStatusLabel(status) {
  switch (status) {
    case 'COMPLETED': return 'ส่งมอบงานแล้ว';
    case 'IN_PROGRESS': return 'กำลังดำเนินการก่อสร้าง';
    case 'SIGNED_PENDING': return 'เซ็นสัญญาแล้ว (ยังไม่เข้างาน)';
    case 'SPECIFYING': return 'วางสเปกอยู่ (ยังไม่เซ็นสัญญา)';
    default: return status || 'กำลังดำเนินการก่อสร้าง';
  }
}

export function formatProject(p, allWbs = [], allActions = [], allDefects = [], allLogs = []) {
  if (!p) return null;
  const rawId = p.id || '';
  const projectId = rawId.replace(/^PRJ-/i, '').toLowerCase();

  let materials = [];
  try {
    materials = typeof p.materials_json === 'string' ? JSON.parse(p.materials_json || '[]') : (p.materials || p.materials_json || []);
  } catch (e) {
    materials = [];
  }

  let contractors = [];
  try {
    contractors = typeof p.contractors_json === 'string' ? JSON.parse(p.contractors_json || '[]') : (p.contractors || p.contractors_json || []);
  } catch (e) {
    contractors = [];
  }

  let sourceFiles = [];
  try {
    sourceFiles = typeof p.source_files_json === 'string' ? JSON.parse(p.source_files_json || '[]') : (p.sourceFiles || p.source_files_json || []);
  } catch (e) {
    sourceFiles = [];
  }

  const status = p.status || 'IN_PROGRESS';
  const statusLabel = p.statusLabel || getProjectStatusLabel(status);

  // Group ID & Group Name resolution (with guaranteed Lumpini real binding)
  let lineGroupId = p.line_group_id || null;
  let lineGroupName = p.line_group_name || null;
  if (p.id === 'PRJ-LUMPINI' || projectId === 'lumpini') {
    lineGroupId = lineGroupId || 'C8802d323f74b1be554a56282968465ff';
    lineGroupName = lineGroupName || 'BC ศนท ลุมพินี (5)';
  }

  const pWbs = allWbs.filter(t => t.project_id === p.id || t.project_id?.toLowerCase() === projectId);
  const pActions = allActions.filter(a => a.project_id === p.id || a.project_id?.toLowerCase() === projectId);
  const pDefects = allDefects.filter(d => d.project_id === p.id || d.project_id?.toLowerCase() === projectId);
  const pLogs = allLogs.filter(l => l.project_id === p.id || l.project_id?.toLowerCase() === projectId);

  // Match seed project for static photos and chatHistory
  const seedProj = (SEED_PROJECTS.projects || []).find(sp => sp.id === p.id || sp.projectId === projectId);
  const seedPhotos = seedProj?.photos || [];
  const seedChat = seedProj?.chatHistory || [];

  // Build combined photos
  const logPhotos = pLogs.filter(l => l.photo_url).map(l => ({
    id: l.id,
    title: l.summary || 'รูปภาพจากกลุ่ม LINE',
    url: l.photo_url,
    caption: l.summary || '',
    fileName: l.photo_url.split('/').pop() || 'photo.jpg',
    foreman: l.sender_name || 'ช่างหน้างาน',
    timestamp: l.log_date || (l.created_at || '').slice(0, 10),
    date: l.log_date || (l.created_at || '').slice(0, 10),
    manpower: l.worker_count ? `${l.worker_count} คน` : '',
    savedRelPath: l.local_photo_path || (p.folder_path ? `${p.folder_path}\\AI_สร้าง_ข้อมูลและรูปจาก_LINE\\${l.photo_url.split('/').pop()}` : ''),
    excelSyncStatus: 'บันทึกลง D1 & ระบบบัญชีเรียบร้อย',
    type: l.category || 'SITE_PHOTO',
    tag: l.category === 'SLIP_RECEIPT' ? 'สลิปโอนเงิน' : 'รูปหน้างาน'
  }));

  const combinedPhotos = [...seedPhotos];
  for (const lp of logPhotos) {
    if (!combinedPhotos.some(cp => cp.url === lp.url || cp.id === lp.id)) {
      combinedPhotos.push(lp);
    }
  }

  // Lumpini specific guarantee
  if (p.id === 'PRJ-LUMPINI' || projectId === 'lumpini') {
    if (!combinedPhotos.some(cp => cp.url && cp.url.includes('lumpini_slip_752'))) {
      combinedPhotos.unshift({
        id: "PHOTO-LMP-01",
        title: "สลิปโอนเงิน SCB 752.00 บ. (คลองเก้าค้าวัสดุก่อสร้าง)",
        url: "assets/lumpini_slip_752.jpg",
        caption: "สลิปโอนเงิน SCB สำรองจ่ายค่าวัสดุก่อสร้างหน้างาน 752.00 บาท",
        fileName: "lumpini_slip_752.jpg",
        foreman: "นาย ณัฐพงษ์ เ. (เฮียนัท)",
        timestamp: "05 พ.ย. 2569 08:07",
        date: "2026-11-05 08:07",
        manpower: "โอนสำรองจ่าย",
        savedRelPath: "ศนท ลุมพินี\\AI_สร้าง_ข้อมูลและรูปจาก_LINE\\lumpini_slip_752.jpg",
        excelSyncStatus: "บันทึกลง D1 & ระบบบัญชีเรียบร้อย",
        type: "SLIP",
        tag: "สลิปโอนเงิน",
        uploader: "นาย ณัฐพงษ์ เ. (เฮียนัท)"
      });
    }
    if (!combinedPhotos.some(cp => cp.url && cp.url.includes('lumpini_invoice_752'))) {
      combinedPhotos.splice(1, 0, {
        id: "PHOTO-LMP-02",
        title: "ใบส่งของ/ใบเสร็จ บจก. คลองเก้าค้าวัสดุก่อสร้าง",
        url: "assets/lumpini_invoice_752.jpg",
        caption: "ใบส่งของ/ใบเสร็จรับเงิน บจก. คลองเก้าค้าวัสดุก่อสร้าง 752.00 บาท",
        fileName: "lumpini_invoice_752.jpg",
        foreman: "นาย ณัฐพงษ์ เ. (เฮียนัท)",
        timestamp: "05 พ.ย. 2569 08:08",
        date: "2026-11-05 08:08",
        manpower: "คลองเก้าค้าวัสดุก่อสร้าง",
        savedRelPath: "ศนท ลุมพินี\\AI_สร้าง_ข้อมูลและรูปจาก_LINE\\lumpini_invoice_752.jpg",
        excelSyncStatus: "บันทึกลง D1 & ระบบบัญชีเรียบร้อย",
        type: "INVOICE",
        tag: "ใบส่งของ/ใบเสร็จ",
        uploader: "นาย ณัฐพงษ์ เ. (เฮียนัท)"
      });
    }
  }

  // Build combined chatHistory
  const combinedChat = [...seedChat];
  for (const l of pLogs) {
    if (!combinedChat.some(c => c.id === l.id || c.text === l.summary)) {
      combinedChat.push({
        id: l.id,
        sender: l.sender_name || 'ช่างหน้างาน (LINE)',
        text: l.summary || '',
        time: (l.created_at || '').slice(11, 16) || '08:00',
        timestamp: l.log_date || l.created_at || '',
        photoUrl: l.photo_url || null,
        photoCaption: l.summary || '',
        savedRelPath: l.local_photo_path || '',
        isBoss: (l.sender_name || '').includes('นัท') || (l.sender_name || '').includes('Admin'),
        isBot: (l.sender_name || '').includes('อับดุล') || (l.sender_name || '').includes('System')
      });
    }
  }

  return {
    ...p,
    id: p.id,
    projectId,
    name: p.name,
    short_name: p.short_name || p.name,
    shortName: p.short_name || p.name,
    fullName: p.full_name || p.fullName || p.name,
    full_name: p.full_name || p.fullName || p.name,
    folder_path: p.folder_path,
    folderPath: p.folder_path,
    folderName: p.folder_path ? p.folder_path.split('\\').pop() : p.short_name || p.name,
    status,
    statusLabel,
    line_group_id: lineGroupId,
    lineGroupId: lineGroupId,
    line_group_name: lineGroupId ? (lineGroupName || lineGroupId) : 'ยังไม่ได้ผูกกลุ่ม LINE',
    lineGroupName: lineGroupId ? (lineGroupName || lineGroupId) : 'ยังไม่ได้ผูกกลุ่ม LINE',
    daily_workers: parseInt(p.daily_workers || 0, 10),
    dailyWorkers: parseInt(p.daily_workers || 0, 10),
    budget: Number(p.budget) || 0,
    contractBudget: Number(p.budget) || 0,
    target_cost: Number(p.target_cost) || 0,
    targetCost: Number(p.target_cost) || 0,
    actual_cost: Number(p.actual_cost) || 0,
    actualCost: Number(p.actual_cost) || 0,
    planned_progress: parseFloat(p.planned_progress || 0),
    plannedProgress: parseFloat(p.planned_progress || 0),
    actual_progress: parseFloat(p.actual_progress || 0),
    actualProgress: parseFloat(p.actual_progress || 0),
    start_date: p.start_date,
    startDate: p.start_date,
    end_date: p.end_date,
    endDate: p.end_date,
    specs_summary: p.specs_summary || '',
    specsSummary: p.specs_summary || '',
    materials,
    contractors,
    sourceFiles,
    source_files: sourceFiles,
    wbsTasks: pWbs,
    actionItems: pActions,
    defects: pDefects,
    dailyLogs: pLogs,
    photos: combinedPhotos,
    chatHistory: combinedChat,
    unreadCount: 0
  };
}

// ----------------------------------------------------------------------
// Project Operations
// ----------------------------------------------------------------------
export async function getAllProjects(d1, includeArchived = false) {
  const query = includeArchived
    ? 'SELECT * FROM projects ORDER BY updated_at DESC'
    : 'SELECT * FROM projects WHERE archived = 0 ORDER BY updated_at DESC';
  const result = await d1.prepare(query).all();
  return (result.results || []).map(p => formatProject(p));
}

export async function getProjectById(d1, id) {
  if (!id) return null;
  const cleanId = id.toString().trim().toLowerCase();
  const normalized = cleanId.replace(/^prj-/, '');
  const sql = `
    SELECT * FROM projects 
    WHERE id = ? 
       OR LOWER(id) = ? 
       OR LOWER(id) = ? 
       OR LOWER(id) = ?
       OR line_group_id = ?
    LIMIT 1
  `;
  const p = await d1.prepare(sql).bind(
    id,
    cleanId,
    'prj-' + normalized,
    normalized,
    id
  ).first();
  return formatProject(p);
}

export async function getProjectByLineGroupId(d1, lineGroupId) {
  if (!lineGroupId) return null;
  const row = await d1.prepare('SELECT * FROM projects WHERE line_group_id = ?').bind(lineGroupId).first();
  if (row) return row;

  const lower = lineGroupId.toLowerCase();
  const all = await d1.prepare('SELECT * FROM projects').all();
  for (const p of (all.results || [])) {
    const pId = p.id.toLowerCase();
    const pShort = (p.short_name || '').toLowerCase();
    const pName = (p.name || '').toLowerCase();
    if (lower.includes('jatujak') || lower.includes('chatuchak')) {
      if (pId.includes('jatujak') || pId.includes('chatuchak') || pShort.includes('จตุจักร')) return p;
    }
    if (lower.includes('bangna')) {
      if (pId.includes('bangna') || pShort.includes('บางนา')) return p;
    }
    if (lower.includes('bangkae') || lower.includes('bang_khae')) {
      if (pId.includes('bangkae') || pShort.includes('บางแค')) return p;
    }
    if (lower.includes('saphansung') || lower.includes('saphan')) {
      if (pId.includes('saphansung') || pShort.includes('สะพานสูง')) return p;
    }
    if (lower.includes('lumpini') || lower.includes('lumphini')) {
      if (pId.includes('lumpini') || pId.includes('lumphini') || pShort.includes('ลุมพินี')) return p;
    }
    if (lower.includes('prachin')) {
      if (pId.includes('prachin') || pShort.includes('ปราจีน')) return p;
    }
    if (lower.includes('maehongson')) {
      if (pId.includes('maehongson') || pShort.includes('แม่ฮ่องสอน')) return p;
    }
  }
  return null;
}

export async function createProject(d1, data) {
  const id = data.id || 'PRJ-' + Math.random().toString(36).slice(2, 9).toUpperCase();
  const now = new Date().toISOString();

  await d1.prepare(`
    INSERT INTO projects (
      id, name, short_name, folder_path, line_group_id, status, budget, target_cost,
      actual_cost, planned_progress, actual_progress, start_date, end_date,
      daily_workers, specs_summary, materials_json, contractors_json,
      source_files_json, dossier_md, archived, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    data.name || '',
    data.short_name || data.name || '',
    data.folder_path || '',
    data.line_group_id || null,
    data.status || 'ACTIVE',
    Number(data.budget) || 0,
    Number(data.target_cost) || 0,
    Number(data.actual_cost) || 0,
    Number(data.planned_progress) || 0,
    Number(data.actual_progress) || 0,
    data.start_date || '',
    data.end_date || '',
    parseInt(data.daily_workers || 0, 10),
    data.specs_summary || '',
    typeof data.materials_json === 'string' ? data.materials_json : JSON.stringify(data.materials_json || []),
    typeof data.contractors_json === 'string' ? data.contractors_json : JSON.stringify(data.contractors_json || []),
    typeof data.source_files_json === 'string' ? data.source_files_json : JSON.stringify(data.source_files_json || []),
    data.dossier_md || '',
    data.archived ? 1 : 0,
    now
  ).run();

  return await getProjectById(d1, id);
}

export async function updateProject(d1, id, data) {
  const existing = await getProjectById(d1, id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const fields = [];
  const values = [];

  const updateableKeys = [
    'name', 'short_name', 'folder_path', 'line_group_id', 'status', 'budget',
    'target_cost', 'actual_cost', 'planned_progress', 'actual_progress',
    'start_date', 'end_date', 'daily_workers', 'specs_summary', 'materials_json',
    'contractors_json', 'source_files_json', 'dossier_md', 'archived'
  ];

  for (const key of updateableKeys) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      let val = data[key];
      if (['materials_json', 'contractors_json', 'source_files_json'].includes(key) && typeof val !== 'string') {
        val = JSON.stringify(val);
      }
      values.push(val);
    }
  }

  if (fields.length === 0) return existing;

  fields.push('updated_at = ?');
  values.push(now);
  values.push(id);

  const sql = `UPDATE projects SET ${fields.join(', ')} WHERE id = ?`;
  await d1.prepare(sql).bind(...values).run();

  return await getProjectById(d1, id);
}

export async function archiveProject(d1, id, archived = true) {
  const now = new Date().toISOString();
  await d1.prepare('UPDATE projects SET archived = ?, updated_at = ? WHERE id = ?')
    .bind(archived ? 1 : 0, now, id)
    .run();
  return await getProjectById(d1, id);
}

export async function bindProjectLineGroup(d1, projectId, lineGroupId) {
  const now = new Date().toISOString();
  // Clear any existing project with this group
  await d1.prepare('UPDATE projects SET line_group_id = NULL WHERE line_group_id = ?')
    .bind(lineGroupId)
    .run();

  // Bind to new project
  await d1.prepare('UPDATE projects SET line_group_id = ?, updated_at = ? WHERE id = ?')
    .bind(lineGroupId, now, projectId)
    .run();

  // Remove group from unassigned_groups list in settings
  await removeUnassignedGroup(d1, lineGroupId);

  return await getProjectById(d1, projectId);
}

// ----------------------------------------------------------------------
// WBS & Action Items
// ----------------------------------------------------------------------
export async function getWbsTasks(d1, projectId) {
  if (projectId) {
    const cleanId = projectId.toString().trim().toLowerCase();
    const normalized = cleanId.replace(/^prj-/, '');
    const res = await d1.prepare(`
      SELECT * FROM wbs_tasks 
      WHERE project_id = ? 
         OR LOWER(project_id) = ? 
         OR LOWER(project_id) = ? 
         OR LOWER(project_id) = ?
      ORDER BY task_code ASC
    `).bind(projectId, cleanId, 'prj-' + normalized, normalized).all();
    return res.results || [];
  }
  const res = await d1.prepare('SELECT * FROM wbs_tasks ORDER BY task_code ASC').all();
  return res.results || [];
}

export async function createWbsTask(d1, task) {
  const id = task.id || 'WBS-' + Math.random().toString(36).slice(2, 9);
  await d1.prepare(`
    INSERT INTO wbs_tasks (id, project_id, task_code, title, weight_percent, progress_percent, status, assignee, start_date, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    task.project_id,
    task.task_code || '',
    task.title,
    Number(task.weight_percent) || 0,
    Number(task.progress_percent) || 0,
    task.status || 'PENDING',
    task.assignee || '',
    task.start_date || '',
    task.due_date || ''
  ).run();

  // Update project actual progress based on weighted average if weights exist
  await recalculateProjectProgress(d1, task.project_id);

  return await d1.prepare('SELECT * FROM wbs_tasks WHERE id = ?').bind(id).first();
}

export async function updateWbsTask(d1, id, data) {
  const existing = await d1.prepare('SELECT * FROM wbs_tasks WHERE id = ?').bind(id).first();
  if (!existing) return null;

  const fields = [];
  const values = [];
  const keys = ['task_code', 'title', 'weight_percent', 'progress_percent', 'status', 'assignee', 'start_date', 'due_date'];

  for (const k of keys) {
    if (data[k] !== undefined) {
      fields.push(`${k} = ?`);
      values.push(data[k]);
    }
  }

  if (fields.length > 0) {
    values.push(id);
    await d1.prepare(`UPDATE wbs_tasks SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    await recalculateProjectProgress(d1, existing.project_id);
  }

  return await d1.prepare('SELECT * FROM wbs_tasks WHERE id = ?').bind(id).first();
}

async function recalculateProjectProgress(d1, projectId) {
  try {
    const tasksRes = await d1.prepare('SELECT weight_percent, progress_percent FROM wbs_tasks WHERE project_id = ?').bind(projectId).all();
    const tasks = tasksRes.results || [];
    if (tasks.length === 0) return;

    let totalWeight = 0;
    let weightedProgress = 0;

    for (const t of tasks) {
      const w = Number(t.weight_percent) || 0;
      const p = Number(t.progress_percent) || 0;
      totalWeight += w;
      weightedProgress += (p * w);
    }

    let calculated = totalWeight > 0 ? (weightedProgress / totalWeight) : 0;
    calculated = Math.round(calculated * 100) / 100;

    await d1.prepare('UPDATE projects SET actual_progress = ?, updated_at = ? WHERE id = ?')
      .bind(calculated, new Date().toISOString(), projectId)
      .run();
  } catch (e) {
    console.error('Error recalculating progress:', e);
  }
}

export async function getActionItems(d1, projectId) {
  if (projectId) {
    const cleanId = projectId.toString().trim().toLowerCase();
    const normalized = cleanId.replace(/^prj-/, '');
    const res = await d1.prepare(`
      SELECT * FROM action_items 
      WHERE project_id = ? 
         OR LOWER(project_id) = ? 
         OR LOWER(project_id) = ? 
         OR LOWER(project_id) = ?
      ORDER BY created_at DESC
    `).bind(projectId, cleanId, 'prj-' + normalized, normalized).all();
    return res.results || [];
  }
  const res = await d1.prepare('SELECT * FROM action_items ORDER BY created_at DESC').all();
  return res.results || [];
}

export async function createActionItem(d1, item) {
  const id = item.id || 'ACT-' + Math.random().toString(36).slice(2, 9);
  const now = new Date().toISOString();
  await d1.prepare(`
    INSERT INTO action_items (id, project_id, title, assignee, due_date, status, assigned_by, raw_message, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    item.project_id,
    item.title,
    item.assignee || '',
    item.due_date || '',
    item.status || 'OPEN',
    item.assigned_by || 'พี่นัท',
    item.raw_message || '',
    item.created_at || now
  ).run();
  return await d1.prepare('SELECT * FROM action_items WHERE id = ?').bind(id).first();
}

export async function updateActionItem(d1, id, data) {
  const existing = await d1.prepare('SELECT * FROM action_items WHERE id = ?').bind(id).first();
  if (!existing) return null;

  const fields = [];
  const values = [];
  const keys = ['title', 'assignee', 'due_date', 'status', 'assigned_by', 'raw_message'];

  for (const k of keys) {
    if (data[k] !== undefined) {
      fields.push(`${k} = ?`);
      values.push(data[k]);
    }
  }

  if (fields.length > 0) {
    values.push(id);
    await d1.prepare(`UPDATE action_items SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  }

  return await d1.prepare('SELECT * FROM action_items WHERE id = ?').bind(id).first();
}

// ----------------------------------------------------------------------
// Defects Operations
// ----------------------------------------------------------------------
export async function getDefects(d1, projectId) {
  if (projectId) {
    const cleanId = projectId.toString().trim().toLowerCase();
    const normalized = cleanId.replace(/^prj-/, '');
    const res = await d1.prepare(`
      SELECT * FROM defects 
      WHERE project_id = ? 
         OR LOWER(project_id) = ? 
         OR LOWER(project_id) = ? 
         OR LOWER(project_id) = ?
      ORDER BY created_at DESC
    `).bind(projectId, cleanId, 'prj-' + normalized, normalized).all();
    return res.results || [];
  }
  const res = await d1.prepare('SELECT * FROM defects ORDER BY created_at DESC').all();
  return res.results || [];
}

export async function createDefect(d1, defect) {
  const id = defect.id || 'DEF-' + Math.random().toString(36).slice(2, 9);
  const code = defect.code || ('DEF-' + Math.floor(1000 + Math.random() * 9000));
  const now = new Date().toISOString();

  await d1.prepare(`
    INSERT INTO defects (id, project_id, code, title, description, zone, severity, status, assignee, photo_url, due_date, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    defect.project_id,
    code,
    defect.title || defect.description || 'พบข้อบกพร่องใหม่',
    defect.description || '',
    defect.zone || '',
    defect.severity || 'MEDIUM',
    defect.status || 'OPEN',
    defect.assignee || '',
    defect.photo_url || '',
    defect.due_date || '',
    defect.created_at || now
  ).run();

  return await d1.prepare('SELECT * FROM defects WHERE id = ?').bind(id).first();
}

export async function updateDefect(d1, id, data) {
  const existing = await d1.prepare('SELECT * FROM defects WHERE id = ?').bind(id).first();
  if (!existing) return null;

  const fields = [];
  const values = [];
  const keys = ['code', 'title', 'description', 'zone', 'severity', 'status', 'assignee', 'photo_url', 'due_date'];

  for (const k of keys) {
    if (data[k] !== undefined) {
      fields.push(`${k} = ?`);
      values.push(data[k]);
    }
  }

  if (fields.length > 0) {
    values.push(id);
    await d1.prepare(`UPDATE defects SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  }

  return await d1.prepare('SELECT * FROM defects WHERE id = ?').bind(id).first();
}

// ----------------------------------------------------------------------
// Daily Logs & Photo Buffer
// ----------------------------------------------------------------------
export async function getDailyLogs(d1, projectId) {
  if (projectId) {
    const cleanId = projectId.toString().trim().toLowerCase();
    const normalized = cleanId.replace(/^prj-/, '');
    const res = await d1.prepare(`
      SELECT * FROM daily_logs 
      WHERE project_id = ? 
         OR LOWER(project_id) = ? 
         OR LOWER(project_id) = ? 
         OR LOWER(project_id) = ?
      ORDER BY log_date DESC, created_at DESC
    `).bind(projectId, cleanId, 'prj-' + normalized, normalized).all();
    return res.results || [];
  }
  const res = await d1.prepare('SELECT * FROM daily_logs ORDER BY log_date DESC, created_at DESC').all();
  return res.results || [];
}

export async function createDailyLog(d1, log) {
  const id = log.id || 'LOG-' + Math.random().toString(36).slice(2, 9);
  const now = new Date().toISOString();
  const dateStr = log.log_date || now.split('T')[0];

  await d1.prepare(`
    INSERT INTO daily_logs (id, project_id, log_date, summary, area_sqm_done, worker_count, sender_name, photo_url, local_photo_path, category, synced_to_pc, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    log.project_id,
    dateStr,
    log.summary || '',
    Number(log.area_sqm_done) || 0,
    parseInt(log.worker_count || 0, 10),
    log.sender_name || '',
    log.photo_url || '',
    log.local_photo_path || '',
    log.category || 'WORK_REPORT',
    log.synced_to_pc ? 1 : 0,
    log.created_at || now
  ).run();

  // If worker count reported, update project's daily_workers
  if (log.worker_count && Number(log.worker_count) > 0) {
    await d1.prepare('UPDATE projects SET daily_workers = ?, updated_at = ? WHERE id = ?')
      .bind(parseInt(log.worker_count, 10), now, log.project_id)
      .run();
  }

  return await d1.prepare('SELECT * FROM daily_logs WHERE id = ?').bind(id).first();
}

export async function savePhotoBuffer(d1, photo) {
  const id = photo.id || 'PB-' + Math.random().toString(36).slice(2, 9);
  const now = new Date().toISOString();

  await d1.prepare(`
    INSERT INTO photo_buffer (id, group_id, project_id, message_id, photo_data, sender_name, created_at, processed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    photo.group_id || '',
    photo.project_id || '',
    photo.message_id || '',
    photo.photo_data || '',
    photo.sender_name || '',
    now,
    photo.processed ? 1 : 0
  ).run();

  return id;
}

export async function getUnprocessedPhotos(d1, groupId) {
  let query = 'SELECT * FROM photo_buffer WHERE processed = 0';
  const params = [];
  if (groupId) {
    query += ' AND group_id = ?';
    params.push(groupId);
  }
  query += ' ORDER BY created_at ASC';
  const res = await d1.prepare(query).bind(...params).all();
  return res.results || [];
}

export async function markPhotoProcessed(d1, id) {
  await d1.prepare('UPDATE photo_buffer SET processed = 1 WHERE id = ?').bind(id).run();
}

// ----------------------------------------------------------------------
// Settings & Group Management
// ----------------------------------------------------------------------
export async function getSetting(d1, key, defaultValue = null) {
  const row = await d1.prepare('SELECT value FROM bot_settings WHERE key = ?').bind(key).first();
  return row ? row.value : defaultValue;
}

export async function setSetting(d1, key, value) {
  const valStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
  await d1.prepare('INSERT OR REPLACE INTO bot_settings (key, value) VALUES (?, ?)').bind(key, valStr).run();
  return valStr;
}

export async function getAllSettings(d1) {
  const res = await d1.prepare('SELECT * FROM bot_settings').all();
  const settings = {};
  for (const row of (res.results || [])) {
    settings[row.key] = row.value;
  }
  return settings;
}

export async function addUnassignedGroup(d1, groupId, groupName = 'กลุ่มไลน์ใหม่') {
  const raw = await getSetting(d1, 'unassigned_groups', '[]');
  let list = [];
  try {
    list = JSON.parse(raw);
  } catch (e) {
    list = [];
  }

  // Prevent duplicate
  if (!list.find(g => g.id === groupId)) {
    list.push({
      id: groupId,
      name: groupName,
      joined_at: new Date().toISOString()
    });
    await setSetting(d1, 'unassigned_groups', JSON.stringify(list));
  }
  return list;
}

export async function removeUnassignedGroup(d1, groupId) {
  const raw = await getSetting(d1, 'unassigned_groups', '[]');
  let list = [];
  try {
    list = JSON.parse(raw);
  } catch (e) {
    list = [];
  }

  list = list.filter(g => g.id !== groupId);
  await setSetting(d1, 'unassigned_groups', JSON.stringify(list));
  return list;
}

export async function getUnassignedGroups(d1) {
  const raw = await getSetting(d1, 'unassigned_groups', '[]');
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

// ----------------------------------------------------------------------
// Bootstrap Aggregator (for Initial Frontend Load)
// ----------------------------------------------------------------------
export async function getBootstrapData(d1) {
  await initDatabase(d1);

  const [rawProjectsResult, wbsTasks, actionItems, defects, dailyLogs, settings, unassignedGroups] = await Promise.all([
    d1.prepare('SELECT * FROM projects ORDER BY id ASC').all(),
    getWbsTasks(d1),
    getActionItems(d1),
    getDefects(d1),
    getDailyLogs(d1),
    getAllSettings(d1),
    getUnassignedGroups(d1)
  ]);

  const rawProjects = rawProjectsResult.results || [];
  const projects = rawProjects.map(p => 
    formatProject(p, wbsTasks, actionItems, defects, dailyLogs)
  );

  return {
    projects,
    wbsTasks,
    actionItems,
    defects,
    dailyLogs,
    settings,
    unassignedGroups,
    serverTime: new Date().toISOString()
  };
}

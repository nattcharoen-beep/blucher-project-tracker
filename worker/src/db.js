// ======================================================================
// Blucher Project Tracker - D1 Database Abstraction & Auto-Seed Layer
// ======================================================================

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Fallback seed data if seed_data.js is missing or still being created by peer
const FALLBACK_SEED_PROJECTS = [
  {
    id: 'PRJ-LUMPHINI',
    name: 'โครงการสวนลุมพินี (สนามเด็กเล่น & พื้นยาง EPDM)',
    short_name: 'สวนลุมพินี',
    folder_path: 'C:\\Users\\nattc\\OneDrive\\Desktop\\ศนท ลุมพินี',
    line_group_id: 'c_lumphini_line_grp',
    status: 'ACTIVE',
    budget: 3500000,
    target_cost: 2450000,
    actual_cost: 1680000,
    planned_progress: 75.0,
    actual_progress: 68.5,
    start_date: '2026-09-01',
    end_date: '2026-12-15',
    daily_workers: 14,
    specs_summary: 'พื้นยาง EPDM 2 ชั้น หนา 25 มม. (SBR 15 มม. + EPDM 10 มม.) มาตรฐานความปลอดภัย EN1177 พื้นที่ 850 ตร.ม.',
    materials_json: JSON.stringify([
      { name: 'เม็ดยาง EPDM สีฟ้า/เขียว', required: '8,500 กก.', delivered: '8,500 กก.', status: 'COMPLETED' },
      { name: 'เม็ดยาง SBR ดำรองพื้น', required: '12,000 กก.', delivered: '12,000 กก.', status: 'COMPLETED' },
      { name: 'น้ำยาโพลียูรีเทนไบนเดอร์ (PU Binder)', required: '3,200 กก.', delivered: '2,800 กก.', status: 'IN_TRANSIT' }
    ]),
    contractors_json: JSON.stringify([
      { role: 'หัวหน้าช่างติดตั้งยาง EPDM', name: 'ช่างสมหมาย', phone: '081-234-5678', company: 'ทีมช่างบลูเคอร์ A' },
      { role: 'ผู้รับเหมาปรับพื้นคอนกรีต', name: 'นายช่างทวี', phone: '089-876-5432', company: 'ทวีทรัพย์การช่าง' }
    ]),
    source_files_json: JSON.stringify([
      'TOR_สวนลุมพินี_EPDM.pdf',
      'BOQ_ต้นทุน_ลุมพินี_v3.xlsx',
      'Layout_สนามเด็กเล่น_ลุมพินี.dwg'
    ]),
    dossier_md: '# โครงการสวนลุมพินี\n- พื้นที่ติดตั้ง EPDM 850 ตร.ม.\n- อุณหภูมิหน้างานปกติ ควบคุมความชื้นพื้นคอนกรีตไม่เกิน 5%',
    archived: 0
  },
  {
    id: 'PRJ-BANGNA',
    name: 'โครงการบางนา (ลานกีฬาอเนกประสงค์ & พื้น PU Sport)',
    short_name: 'บางนา',
    folder_path: 'C:\\Users\\nattc\\OneDrive\\Desktop\\ศนท บางนา',
    line_group_id: 'c_bangna_line_grp',
    status: 'ACTIVE',
    budget: 4200000,
    target_cost: 2900000,
    actual_cost: 1250000,
    planned_progress: 45.0,
    actual_progress: 42.0,
    start_date: '2026-10-01',
    end_date: '2026-12-30',
    daily_workers: 18,
    specs_summary: 'พื้นสนามกีฬา Silicon PU ความหนา 5 มม. พื้นที่ 1,200 ตร.ม. พร้อมตีเส้นสนามบาสเกตบอลและวอลเลย์บอล',
    materials_json: JSON.stringify([
      { name: 'Silicon PU Primer', required: '400 กก.', delivered: '400 กก.', status: 'COMPLETED' },
      { name: 'PU Elastic Layer', required: '3,600 กก.', delivered: '2,000 กก.', status: 'PARTIAL' },
      { name: 'Top Coat UV Resistant', required: '600 กก.', delivered: '0 กก.', status: 'WAITING' }
    ]),
    contractors_json: JSON.stringify([
      { role: 'โฟร์แมนคุมงานสนาม', name: 'ช่างวิชัย', phone: '086-112-2334', company: 'ทีมช่างบลูเคอร์ B' }
    ]),
    source_files_json: JSON.stringify([
      'TOR_ลานกีฬาบางนา.pdf',
      'BOQ_บางนา_PU.xlsx'
    ]),
    dossier_md: '# โครงการบางนา\n- พื้นที่ 1,200 ตร.ม.\n- อยู่ระหว่างลงชั้นยางสังเคราะห์ชั้นแรก',
    archived: 0
  },
  {
    id: 'PRJ-SAPHAN-SUNG',
    name: 'โครงการสะพานสูง (สนามฟุตซอลหญ้าเทียม & EPDM)',
    short_name: 'สะพานสูง',
    folder_path: 'C:\\Users\\nattc\\OneDrive\\Desktop\\ศนท สะพานสูง',
    line_group_id: 'c_saphansung_line_grp',
    status: 'ACTIVE',
    budget: 2800000,
    target_cost: 1950000,
    actual_cost: 1850000,
    planned_progress: 90.0,
    actual_progress: 88.0,
    start_date: '2026-08-15',
    end_date: '2026-11-20',
    daily_workers: 8,
    specs_summary: 'สนามฟุตซอลหญ้าเทียม Monofilament 50 มม. และขอบพื้นยาง EPDM กันกระแทก',
    materials_json: JSON.stringify([
      { name: 'หญ้าเทียมฟุตซอล 50 มม.', required: '960 ตร.ม.', delivered: '960 ตร.ม.', status: 'COMPLETED' },
      { name: 'ทรายซิลิกาคัดขนาด', required: '24 ตัน', delivered: '24 ตัน', status: 'COMPLETED' },
      { name: 'เม็ดยางดำ Infill', required: '8 ตัน', delivered: '8 ตัน', status: 'COMPLETED' }
    ]),
    contractors_json: JSON.stringify([
      { role: 'หัวหน้าช่างหญ้าเทียม', name: 'ช่างสมปอง', phone: '085-555-1234', company: 'กรีนฟิลด์ เอ็นจิเนียริ่ง' }
    ]),
    source_files_json: JSON.stringify([
      'TOR_สะพานสูง_Futsal.pdf',
      'ปร4_สะพานสูง.xlsx'
    ]),
    dossier_md: '# โครงการสะพานสูง\n- งานลงทรายและเม็ดยางใกล้เสร็จสมบูรณ์ รอส่งมอบงานงวดสุดท้าย',
    archived: 0
  },
  {
    id: 'PRJ-BANG-KHAE',
    name: 'โครงการบางแค (ลานออกกำลังกายกลางแจ้งและทางเดินยางสังเคราะห์)',
    short_name: 'บางแค',
    folder_path: 'C:\\Users\\nattc\\OneDrive\\Desktop\\ศนท บางแค',
    line_group_id: 'c_bang_khae_line_grp',
    status: 'ACTIVE',
    budget: 1950000,
    target_cost: 1350000,
    actual_cost: 820000,
    planned_progress: 60.0,
    actual_progress: 58.0,
    start_date: '2026-09-15',
    end_date: '2026-11-30',
    daily_workers: 10,
    specs_summary: 'ลานพื้นยาง EPDM 15 มม. สำหรับเครื่องออกกำลังกายกลางแจ้ง พื้นที่ 450 ตร.ม.',
    materials_json: JSON.stringify([]),
    contractors_json: JSON.stringify([]),
    source_files_json: JSON.stringify([]),
    dossier_md: '# โครงการบางแค',
    archived: 0
  },
  {
    id: 'PRJ-CHATUCHAK',
    name: 'โครงการสวนจตุจักร (ลานกิจกรรมและทางวิ่งยาง EPDM)',
    short_name: 'จตุจักร',
    folder_path: 'C:\\Users\\nattc\\OneDrive\\Desktop\\ศนท จตุจักร',
    line_group_id: 'c_chatuchak_line_grp',
    status: 'ACTIVE',
    budget: 5100000,
    target_cost: 3500000,
    actual_cost: 1100000,
    planned_progress: 30.0,
    actual_progress: 28.0,
    start_date: '2026-10-15',
    end_date: '2027-01-30',
    daily_workers: 16,
    specs_summary: 'ลานยาง EPDM กราฟิกลายการ์ตูนสามมิติ และลู่วิ่งความหนา 13 มม. พื้นที่ 1,500 ตร.ม.',
    materials_json: JSON.stringify([]),
    contractors_json: JSON.stringify([]),
    source_files_json: JSON.stringify([]),
    dossier_md: '# โครงการสวนจตุจักร',
    archived: 0
  },
  {
    id: 'PRJ-PRACHIN',
    name: 'โครงการปราจีนบุรี (สนามกีฬาเทศบาลเมืองปราจีนบุรี)',
    short_name: 'ปราจีนบุรี',
    folder_path: 'C:\\Users\\nattc\\OneDrive\\Desktop\\อบต ปราจีน',
    line_group_id: 'c_prachin_line_grp',
    status: 'ACTIVE',
    budget: 6800000,
    target_cost: 4700000,
    actual_cost: 2100000,
    planned_progress: 35.0,
    actual_progress: 32.0,
    start_date: '2026-09-20',
    end_date: '2027-02-28',
    daily_workers: 22,
    specs_summary: 'ลู่วิ่งมาตรฐานกรีฑา 8 ลู่ พื้นยางสังเคราะห์ชนิดแซนด์วิช (Sandwich System) ความหนา 13 มม.',
    materials_json: JSON.stringify([]),
    contractors_json: JSON.stringify([]),
    source_files_json: JSON.stringify([]),
    dossier_md: '# โครงการปราจีนบุรี',
    archived: 0
  },
  {
    id: 'PRJ-MAE-HONG-SON',
    name: 'โครงการแม่ฮ่องสอน (ลานกีฬาโรงเรียนชุมชนแม่ฮ่องสอน)',
    short_name: 'แม่ฮ่องสอน',
    folder_path: 'C:\\Users\\nattc\\OneDrive\\Desktop\\พี่บอม แม่ฮ่องสอน',
    line_group_id: 'c_maehongson_line_grp',
    status: 'PLANNING',
    budget: 1800000,
    target_cost: 1250000,
    actual_cost: 150000,
    planned_progress: 15.0,
    actual_progress: 12.0,
    start_date: '2026-11-01',
    end_date: '2027-01-15',
    daily_workers: 6,
    specs_summary: 'ลานกีฬาอเนกประสงค์ Acrylic Sport Floor 5 ชั้น พื้นที่ 650 ตร.ม.',
    materials_json: JSON.stringify([]),
    contractors_json: JSON.stringify([]),
    source_files_json: JSON.stringify([]),
    dossier_md: '# โครงการแม่ฮ่องสอน',
    archived: 0
  }
];

const FALLBACK_SEED_WBS = [
  { id: 'WBS-LUM-01', project_id: 'PRJ-LUMPHINI', task_code: '1.1', title: 'เตรียมพื้นผิวและทดสอบความชื้นคอนกรีต', weight_percent: 15, progress_percent: 100, status: 'COMPLETED', assignee: 'ช่างทวี', start_date: '2026-09-01', due_date: '2026-09-10' },
  { id: 'WBS-LUM-02', project_id: 'PRJ-LUMPHINI', task_code: '1.2', title: 'ทาน้ำยารองพื้น Primer เพิ่มการยึดเกาะ', weight_percent: 10, progress_percent: 100, status: 'COMPLETED', assignee: 'ช่างสมหมาย', start_date: '2026-09-11', due_date: '2026-09-15' },
  { id: 'WBS-LUM-03', project_id: 'PRJ-LUMPHINI', task_code: '1.3', title: 'ติดตั้งชั้นยางดำ SBR หนา 15 มม.', weight_percent: 30, progress_percent: 100, status: 'COMPLETED', assignee: 'ช่างสมหมาย', start_date: '2026-09-16', due_date: '2026-10-05' },
  { id: 'WBS-LUM-04', project_id: 'PRJ-LUMPHINI', task_code: '1.4', title: 'ปูเม็ดยาง EPDM สีฟ้า/เขียว หนา 10 มม.', weight_percent: 35, progress_percent: 55, status: 'IN_PROGRESS', assignee: 'ช่างสมหมาย', start_date: '2026-10-06', due_date: '2026-11-20' },
  { id: 'WBS-LUM-05', project_id: 'PRJ-LUMPHINI', task_code: '1.5', title: 'เก็บงานรอยต่อ ตรวจสอบระนาบ และส่งมอบงาน', weight_percent: 10, progress_percent: 0, status: 'PENDING', assignee: 'นายช่างทวี', start_date: '2026-11-21', due_date: '2026-12-15' },

  { id: 'WBS-BGN-01', project_id: 'PRJ-BANGNA', task_code: '2.1', title: 'ขัดผิวคอนกรีตด้วยเครื่อง Diamond Grinding', weight_percent: 20, progress_percent: 100, status: 'COMPLETED', assignee: 'ช่างวิชัย', start_date: '2026-10-01', due_date: '2026-10-10' },
  { id: 'WBS-BGN-02', project_id: 'PRJ-BANGNA', task_code: '2.2', title: 'ทา Epoxy Primer ป้องกันความชื้น', weight_percent: 15, progress_percent: 100, status: 'COMPLETED', assignee: 'ช่างวิชัย', start_date: '2026-10-11', due_date: '2026-10-18' },
  { id: 'WBS-BGN-03', project_id: 'PRJ-BANGNA', task_code: '2.3', title: 'ปาดเนื้อยางยืดหยุ่น Silicon PU ชั้นที่ 1', weight_percent: 25, progress_percent: 60, status: 'IN_PROGRESS', assignee: 'ช่างวิชัย', start_date: '2026-10-19', due_date: '2026-11-10' },
  { id: 'WBS-BGN-04', project_id: 'PRJ-BANGNA', task_code: '2.4', title: 'ปาดเนื้อยางชั้นที่ 2 และพ่นเคลือบสี Top Coat', weight_percent: 25, progress_percent: 0, status: 'PENDING', assignee: 'ช่างวิชัย', start_date: '2026-11-11', due_date: '2026-12-05' },
  { id: 'WBS-BGN-05', project_id: 'PRJ-BANGNA', task_code: '2.5', title: 'ตีเส้นสนามมาตรฐานและติดตั้งอุปกรณ์กีฬา', weight_percent: 15, progress_percent: 0, status: 'PENDING', assignee: 'ช่างวิชัย', start_date: '2026-12-06', due_date: '2026-12-30' }
];

const FALLBACK_SEED_ACTION_ITEMS = [
  { id: 'ACT-001', project_id: 'PRJ-LUMPHINI', title: 'ตรวจสอบใบ Certificate กาว PU Binder จากโรงงานก่อนเทยางชั้นบน', assignee: 'ช่างสมหมาย', due_date: '2026-11-08', status: 'IN_PROGRESS', assigned_by: 'พี่นัท', raw_message: 'ช่างสมหมาย อย่าลืมตรวจ cert กาว PU ล็อตใหม่ก่อนลงนะ', created_at: new Date().toISOString() },
  { id: 'ACT-002', project_id: 'PRJ-LUMPHINI', title: 'ประสานงานช่างกทม. ตรวจเช็คระดับท่อระบายน้ำรอบสนาม', assignee: 'นายช่างทวี', due_date: '2026-11-12', status: 'OPEN', assigned_by: 'พี่นัท', raw_message: 'พี่ทวีช่วยประสานช่างเขตดูท่อน้ำทิ้งด่วนครับ', created_at: new Date().toISOString() },
  { id: 'ACT-003', project_id: 'PRJ-BANGNA', title: 'สั่งถังน้ำยา Top Coat UV Resistant เพิ่ม 12 ถัง', assignee: 'ช่างวิชัย', due_date: '2026-11-10', status: 'OPEN', assigned_by: 'พี่นัท', raw_message: 'ช่างวิชัย เช็คสต็อกท็อปโค้ทแล้วสั่งของได้เลยครับ', created_at: new Date().toISOString() }
];

const FALLBACK_SEED_DEFECTS = [
  { id: 'DEF-001', project_id: 'PRJ-LUMPHINI', code: 'DEF-LUM-01', title: 'รอยนูนของยาง SBR บริเวณทางลาดฝั่งทิศตะวันออก', description: 'พบฟองอากาศและรอยนูนเล็กน้อย เกิดจากความชื้นระเหยก่อนกาวแห้ง ต้องขูดซ่อมแซมและบดอัดใหม่', zone: 'โซน A (สไลเดอร์)', severity: 'HIGH', status: 'IN_PROGRESS', assignee: 'ช่างสมหมาย', photo_url: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=400&q=80', due_date: '2026-11-10', created_at: new Date().toISOString() },
  { id: 'DEF-002', project_id: 'PRJ-LUMPHINI', code: 'DEF-LUM-02', title: 'ขอบยาง EPDM สัมผัสขอบปูนมีช่องว่าง 3 มม.', description: 'เก็บขอบยางด้วย PU Sealant ให้แนบสนิทป้องกันน้ำซึม', zone: 'โซน B (ชิงช้า)', severity: 'MEDIUM', status: 'OPEN', assignee: 'ช่างสมหมาย', photo_url: '', due_date: '2026-11-15', created_at: new Date().toISOString() },
  { id: 'DEF-003', project_id: 'PRJ-BANGNA', code: 'DEF-BGN-01', title: 'คราบฝุ่นบนผิวคอนกรีตก่อนลงไพรเมอร์', description: 'ต้องใช้เครื่องดูดฝุ่นอุตสาหกรรมทำความสะอาดซ้ำก่อนปาด PU', zone: 'สนามบาสเกตบอลครึ่งหลัง', severity: 'LOW', status: 'RESOLVED', assignee: 'ช่างวิชัย', photo_url: '', due_date: '2026-10-15', created_at: new Date().toISOString() }
];

const FALLBACK_SEED_DAILY_LOGS = [
  { id: 'LOG-001', project_id: 'PRJ-LUMPHINI', log_date: '2026-11-04', summary: 'เทและรีดยาง EPDM สีฟ้า โซนเครื่องเล่นหลัก เสร็จไป 95 ตร.ม. คนงาน 14 คน อากาศแจ่มใส', area_sqm_done: 95.0, worker_count: 14, sender_name: 'ช่างสมหมาย', photo_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861564?auto=format&fit=crop&w=600&q=80', local_photo_path: '', category: 'WORK_REPORT', synced_to_pc: 1, created_at: '2026-11-04T17:30:00.000Z' },
  { id: 'LOG-002', project_id: 'PRJ-BANGNA', log_date: '2026-11-04', summary: 'ปาด Silicon PU Elastic layer ชั้นที่ 1 โซนกลางสนาม เสร็จ 180 ตร.ม. คนงาน 18 คน', area_sqm_done: 180.0, worker_count: 18, sender_name: 'ช่างวิชัย', photo_url: '', local_photo_path: '', category: 'WORK_REPORT', synced_to_pc: 1, created_at: '2026-11-04T17:45:00.000Z' }
];

const DEFAULT_SETTINGS = [
  { key: 'group_reply_confirm_toggle', value: 'false' }, // Default silent in groups (Zero Spam rule!)
  { key: 'unassigned_groups', value: JSON.stringify([
    { id: 'c_unassigned_demo_1', name: 'กลุ่มผู้รับเหมาปรับพื้นดิน กทม.', joined_at: '2026-11-04T10:00:00.000Z' },
    { id: 'c_unassigned_demo_2', name: 'กลุ่มตรวจสอบมาตรฐานวัสดุ มอก.', joined_at: '2026-11-04T14:30:00.000Z' }
  ])},
  { key: 'bot_name', value: 'อับดุล' },
  { key: 'system_mode', value: 'PRODUCTION' },
  { key: 'last_sync_timestamp', value: new Date().toISOString() }
];

// Helper to load seed_data.js dynamically if created by W-1
async function loadExternalSeedData() {
  try {
    const mod = await import('./seed_data.js');
    return mod.default || mod;
  } catch (e) {
    try {
      const mod = await import('../../seed_data.js');
      return mod.default || mod;
    } catch (e2) {
      return null;
    }
  }
}

// ----------------------------------------------------------------------
// Database Initialization & Auto-Seed
// ----------------------------------------------------------------------
export async function initDatabase(d1) {
  if (!d1) throw new Error('Database instance (d1) is required');

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
    if (d1.exec) {
      await d1.exec(sql);
    } else {
      await d1.prepare(sql).run();
    }
  }

  // Auto-Seed if empty
  await autoSeedIfEmpty(d1);
}

export async function autoSeedIfEmpty(d1) {
  const checkJatujak = await d1.prepare('SELECT id FROM projects WHERE id = ?').bind('PRJ-JATUJAK').first();
  const wbsCountRow = await d1.prepare('SELECT COUNT(*) as count FROM wbs_tasks WHERE project_id IS NOT NULL').first();
  const wbsCount = wbsCountRow ? (wbsCountRow.count || 0) : 0;

  if (checkJatujak && Number(wbsCount) >= 50) {
    return { seeded: false, message: 'Database already populated with 7 genuine projects' };
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
      p.line_group_id || p.lineGroup || '',
      p.status || 'ACTIVE',
      Number(p.budget) || 0,
      Number(p.target_cost) || 0,
      Number(p.actual_cost) || 0,
      parseFloat(p.planned_progress || p.progress || 0) || 0,
      parseFloat(p.actual_progress || p.progress || 0) || 0,
      p.start_date || '2026-01-01',
      p.end_date || '2026-12-31',
      parseInt(p.daily_workers || p.workers || 0, 10) || 0,
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
// Project Operations
// ----------------------------------------------------------------------
export async function getAllProjects(d1, includeArchived = false) {
  const query = includeArchived
    ? 'SELECT * FROM projects ORDER BY updated_at DESC'
    : 'SELECT * FROM projects WHERE archived = 0 ORDER BY updated_at DESC';
  const result = await d1.prepare(query).all();
  return result.results || [];
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
  return await d1.prepare(sql).bind(
    id,
    cleanId,
    'prj-' + normalized,
    normalized,
    id
  ).first();
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

  const [rawProjects, wbsTasks, actionItems, defects, dailyLogs, settings, unassignedGroups] = await Promise.all([
    getAllProjects(d1, true),
    getWbsTasks(d1),
    getActionItems(d1),
    getDefects(d1),
    getDailyLogs(d1),
    getAllSettings(d1),
    getUnassignedGroups(d1)
  ]);

  const projects = rawProjects.map(p => {
    const rawId = p.id || '';
    const projectId = rawId.replace(/^PRJ-/i, '').toLowerCase();
    const pWbs = wbsTasks.filter(t => t.project_id === p.id || t.project_id?.toLowerCase() === projectId);
    const pActions = actionItems.filter(a => a.project_id === p.id || a.project_id?.toLowerCase() === projectId);
    const pDefects = defects.filter(d => d.project_id === p.id || d.project_id?.toLowerCase() === projectId);
    const pLogs = dailyLogs.filter(l => l.project_id === p.id || l.project_id?.toLowerCase() === projectId);
    return {
      ...p,
      projectId,
      wbsTasks: pWbs,
      actionItems: pActions,
      defects: pDefects,
      dailyLogs: pLogs
    };
  });

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

// ======================================================================
// Blucher Project Tracker - Excel Progress Reporter
// Generates standalone _Site_Progress_Auto.xlsx inside AI_สร้าง_ข้อมูลและรูปจาก_LINE
// ======================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as xlsx from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dataFile = path.join(rootDir, 'data', 'projects_master.json');

export const SUBFOLDER_NAME = 'AI_สร้าง_ข้อมูลและรูปจาก_LINE';
export const PHOTOS_FOLDER_NAME = 'รูปหน้างาน';
export const EXCEL_REPORT_NAME = '_Site_Progress_Auto.xlsx';

export function generateSiteExcelReport(project) {
  if (!fs.existsSync(project.folderPath)) {
    console.warn(`⚠️ Target project folder does not exist: ${project.folderPath}`);
    return null;
  }

  // 1. Prepare target AI subfolders
  const aiSubfolder = path.join(project.folderPath, SUBFOLDER_NAME);
  const photosSubfolder = path.join(aiSubfolder, PHOTOS_FOLDER_NAME);

  if (!fs.existsSync(aiSubfolder)) {
    fs.mkdirSync(aiSubfolder, { recursive: true });
  }
  if (!fs.existsSync(photosSubfolder)) {
    fs.mkdirSync(photosSubfolder, { recursive: true });
  }

  // Check if an accidental root _Site_Progress_Auto.xlsx exists, move it into subfolder
  const accidentalRootFile = path.join(project.folderPath, EXCEL_REPORT_NAME);
  if (fs.existsSync(accidentalRootFile)) {
    try {
      const destPath = path.join(aiSubfolder, EXCEL_REPORT_NAME);
      fs.copyFileSync(accidentalRootFile, destPath);
      // Delete temporary misplaced copy
      fs.unlinkSync(accidentalRootFile);
      console.log(` 🚚 Cleaned up root file to ${destPath}`);
    } catch (e) {
      console.warn('Could not relocate root file:', e.message);
    }
  }

  // 2. Build Workbook
  const wb = xlsx.utils.book_new();

  // --- Sheet 1: Summary ---
  const summaryRows = [
    ['หัวข้อ (Field)', 'ข้อมูลโครงการ (Project Details)'],
    ['รหัสโครงการ (Project ID)', project.id],
    ['ชื่อโครงการเต็ม (Full Name)', project.name],
    ['ชื่อย่อ (Short Name)', project.shortName || project.short_name],
    ['โฟลเดอร์หน้างาน (Folder Path)', project.folderPath || project.folder_path],
    ['LINE Group ID', project.lineGroupId || project.line_group_id],
    ['สถานะการก่อสร้าง (Status)', project.status],
    ['มูลค่างาน / สัญญา (Budget THB)', Number(project.budget || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })],
    ['เป้าหมายต้นทุน (Target Cost THB)', Number(project.targetCost || project.target_cost || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })],
    ['ต้นทุนที่เกิดขึ้นจริง (Actual Cost THB)', Number(project.actualCost || project.actual_cost || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })],
    ['ความคืบหน้าตามแผน (Planned %)', `${Number(project.plannedProgress || project.planned_progress || 0).toFixed(1)}%`],
    ['ความคืบหน้าหน้างานจริง (Actual %)', `${Number(project.actualProgress || project.actual_progress || 0).toFixed(1)}%`],
    ['วันเริ่มต้นสัญญา (Start Date)', project.startDate || project.start_date],
    ['วันสิ้นสุดสัญญา (End Date)', project.endDate || project.end_date],
    ['จำนวนคนงานเฉลี่ยต่อวัน (Daily Workers)', project.dailyWorkers || project.daily_workers || 0],
    ['สรุปสเปกและมาตรฐานวัสดุ (Specs Summary)', project.specsSummary || project.specs_summary || '-'],
    ['เวลาอัปเดตรายงานล่าสุด (Last Sync)', new Date().toISOString()]
  ];
  const wsSummary = xlsx.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 35 }, { wch: 80 }];
  xlsx.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // --- Sheet 2: WBS_Tasks ---
  const wbsHeader = [
    'รหัสงาน (Code)',
    'ชื่องาน / กิจกรรม (Task Title)',
    'น้ำหนักงาน (% Weight)',
    'ผลงานจริง (% Progress)',
    'สถานะ (Status)',
    'ผู้รับผิดชอบ (Assignee)',
    'วันเริ่ม (Start)',
    'กำหนดเสร็จ (Due Date)'
  ];
  const wbsRows = [wbsHeader];
  const tasks = project.wbsTasks || [];
  tasks.forEach(t => {
    wbsRows.push([
      t.task_code || t.taskCode || '-',
      t.title || '',
      t.weight_percent || t.weightPercent || 0,
      t.progress_percent || t.progressPercent || 0,
      t.status || 'PENDING',
      t.assignee || '-',
      t.start_date || t.startDate || '-',
      t.due_date || t.dueDate || '-'
    ]);
  });
  if (tasks.length === 0) {
    wbsRows.push(['-', 'ไม่มีรายการงาน WBS บันทึกไว้', 0, 0, '-', '-', '-', '-']);
  }
  const wsWbs = xlsx.utils.aoa_to_sheet(wbsRows);
  wsWbs['!cols'] = [{ wch: 15 }, { wch: 45 }, { wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 22 }, { wch: 14 }, { wch: 14 }];
  xlsx.utils.book_append_sheet(wb, wsWbs, 'WBS_Tasks');

  // --- Sheet 3: Action_Items ---
  const actHeader = [
    'รหัส (ID)',
    'รายการสั่งการ / แอ็กชันไอเทม (Action Item)',
    'ผู้รับผิดชอบ (Assignee)',
    'กำหนดส่ง (Due Date)',
    'สถานะ (Status)',
    'ข้อความจาก LINE / หมายเหตุ (Source / Note)'
  ];
  const actRows = [actHeader];
  const actions = project.actionItems || [];
  actions.forEach(a => {
    actRows.push([
      a.id || '-',
      a.title || '',
      a.assignee || '-',
      a.due_date || a.dueDate || '-',
      a.status || 'OPEN',
      a.raw_message || a.rawMessage || '-'
    ]);
  });
  if (actions.length === 0) {
    actRows.push(['-', 'ไม่มี Action Items ค้าง', '-', '-', 'DONE', '-']);
  }
  const wsAct = xlsx.utils.aoa_to_sheet(actRows);
  wsAct['!cols'] = [{ wch: 15 }, { wch: 45 }, { wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 40 }];
  xlsx.utils.book_append_sheet(wb, wsAct, 'Action_Items');

  // --- Sheet 4: Defects ---
  const defectHeader = [
    'รหัสดีเฟกต์ (Code)',
    'หัวข้อข้อบกพร่อง (Title)',
    'รายละเอียดและการแก้ไข (Description / Resolution)',
    'จุดเกิดเหตุ / โซน (Zone)',
    'ความรุนแรง (Severity)',
    'สถานะ (Status)',
    'ผู้รับผิดชอบแก้ไข (Assignee)'
  ];
  const defectRows = [defectHeader];
  const defects = project.defects || [];
  defects.forEach(d => {
    defectRows.push([
      d.code || d.id || '-',
      d.title || '',
      d.description || '-',
      d.zone || '-',
      d.severity || 'MEDIUM',
      d.status || 'OPEN',
      d.assignee || '-'
    ]);
  });
  if (defects.length === 0) {
    defectRows.push(['-', 'ไม่พบประวัติดีเฟกต์ที่ค้างอยู่', 'ผ่านการตรวจสอบคุณภาพเรียบร้อย', 'ทุกโซน', 'NONE', 'RESOLVED', '-']);
  }
  const wsDefect = xlsx.utils.aoa_to_sheet(defectRows);
  wsDefect['!cols'] = [{ wch: 16 }, { wch: 35 }, { wch: 45 }, { wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 20 }];
  xlsx.utils.book_append_sheet(wb, wsDefect, 'Defects');

  // --- Sheet 5: Daily_Logs ---
  const logHeader = [
    'วันที่ (Date)',
    'หมวดหมู่ (Category)',
    'บันทึกสรุปหน้างาน (Daily Summary)',
    'พื้นที่แล้วเสร็จสะสม (ตร.ม.)',
    'จำนวนคนงาน (Workers)',
    'ผู้รายงาน (Sender)'
  ];
  const logRows = [logHeader];
  const logs = project.dailyLogs || [];
  logs.forEach(l => {
    logRows.push([
      l.log_date || l.logDate || '-',
      l.category || 'WORK_REPORT',
      l.summary || '',
      l.area_sqm_done || l.areaSqmDone || 0,
      l.worker_count || l.workerCount || 0,
      l.sender_name || l.senderName || '-'
    ]);
  });
  if (logs.length === 0) {
    logRows.push(['-', '-', 'ยังไม่มีบันทึกประจำวัน', 0, 0, '-']);
  }
  const wsLogs = xlsx.utils.aoa_to_sheet(logRows);
  wsLogs['!cols'] = [{ wch: 14 }, { wch: 18 }, { wch: 55 }, { wch: 22 }, { wch: 18 }, { wch: 20 }];
  xlsx.utils.book_append_sheet(wb, wsLogs, 'Daily_Logs');

  // 3. Write Excel file
  const targetFilePath = path.join(aiSubfolder, EXCEL_REPORT_NAME);
  xlsx.writeFile(wb, targetFilePath);
  console.log(` 📊 Created/Updated Excel Report: ${targetFilePath}`);
  return targetFilePath;
}

export function generateAllExcelReports() {
  console.log('📑 [Excel Reporter] Generating _Site_Progress_Auto.xlsx for all 7 project folders...');
  if (!fs.existsSync(dataFile)) {
    console.error(`❌ projects_master.json not found at ${dataFile}`);
    return [];
  }

  const masterData = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
  const projects = masterData.projects || [];
  const results = [];

  for (const p of projects) {
    try {
      const generatedPath = generateSiteExcelReport(p);
      if (generatedPath) {
        results.push({ id: p.id, name: p.shortName, path: generatedPath });
      }
    } catch (err) {
      console.error(`❌ Failed to generate report for ${p.shortName}:`, err.message);
    }
  }

  console.log(`✅ [Excel Reporter] Generated ${results.length} reports successfully.`);
  return results;
}

// If executed directly from CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateAllExcelReports();
}

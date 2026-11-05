import fs from 'node:fs';
import path from 'node:path';

const rootDir = 'C:\\Users\\nattc\\OneDrive\\Desktop\\Claude Project\\Project Tracker';
const appJsPath = path.join(rootDir, 'frontend', 'app.js');
let appJs = fs.readFileSync(appJsPath, 'utf8');

// Load master real projects
const dataPath = path.join(rootDir, 'data', 'projects_master.json');
const masterData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Build MASTER_PROJECTS object keyed by canonical ID
const keyMap = {
  'PRJ-JATUJAK': 'prj-chatuchak',
  'PRJ-BANGNA': 'prj-bangna',
  'PRJ-BANGKAE': 'prj-bangkae',
  'PRJ-SAPHANSUNG': 'prj-saphansung',
  'PRJ-LUMPINI': 'prj-lumpini',
  'PRJ-PRACHIN': 'prj-prachin',
  'PRJ-MAEHONGSON': 'prj-maehongson'
};

const newMasterProjects = {};
for (const p of masterData.projects) {
  const canonId = keyMap[p.id] || p.id.toLowerCase();
  let statusBadgeClass = "bg-slate-500/20 text-slate-300 border-slate-400/30";
  if (p.status === "COMPLETED") statusBadgeClass = "bg-emerald-500/20 text-emerald-400 border-emerald-400/30";
  else if (p.status === "IN_PROGRESS" || p.status === "ACTIVE") statusBadgeClass = "bg-sky-500/20 text-sky-300 border-sky-400/30";
  else if (p.status === "SIGNED_PENDING") statusBadgeClass = "bg-amber-500/20 text-amber-300 border-amber-400/30";
  else if (p.status === "SPECIFYING") statusBadgeClass = "bg-purple-500/20 text-purple-300 border-purple-400/30";

  newMasterProjects[canonId] = {
    id: canonId,
    name: p.short_name || p.name,
    shortName: p.short_name || p.name,
    fullName: p.full_name || p.fullName || p.name,
    folderName: p.folderName || p.short_name,
    folderPath: p.folder_path || p.folderPath,
    aiSubfolder: `${p.short_name || p.name}\\AI_สร้าง_ข้อมูลและรูปจาก_LINE\\`,
    lineGroupId: p.line_group_id || null,
    lineGroupName: p.line_group_name || "ยังไม่ได้ผูกกลุ่ม LINE",
    status: p.statusLabel || p.status,
    statusLabel: p.statusLabel || p.status,
    statusBadgeClass: statusBadgeClass,
    period: p.period,
    contractBudget: p.budget || 0,
    targetCost: p.target_cost || 0,
    actualCost: p.actual_cost || 0,
    expectedProfit: p.expectedProfit || 0,
    profitMargin: p.profitMargin || 0,
    progressActual: p.actual_progress || 0,
    progressPlanned: p.planned_progress || 0,
    manpowerToday: 0,
    unreadCount: 0,
    lastMessageText: "ยังไม่ได้ผูกกลุ่ม LINE — กดเพื่อดูวิธีเชิญบอท @395avvfu",
    lastMessageTime: "",
    coreSpecs: p.specs_summary || "",
    chatHistory: [],
    wbsTasks: (p.wbsTasks || []).map((t, idx) => ({
      id: t.id || `wbs-${idx + 1}`,
      name: t.title || t.name,
      category: t.task_code ? `หมวด ${t.task_code}` : 'งานโครงสร้าง',
      period: t.start_date && t.due_date ? `${t.start_date} – ${t.due_date}` : 'ตามแผนงาน',
      weight: Number(t.weight_percent) || 10,
      progress: Number(t.progress_percent) || 0,
      status: t.status === 'COMPLETED' ? 'เสร็จสิ้น' : (t.status === 'IN_PROGRESS' ? 'กำลังทำ' : 'รอดำเนินการ'),
      assignee: t.assignee || 'ทีมช่าง'
    })),
    actionItems: [],
    defects: [],
    photos: [],
    contractors: (p.contractors || []).map(c => ({
      name: c.name,
      role: c.role,
      contact: c.company || c.phone || 'ช่างประจำ',
      milestones: c.milestones || 'ตามงวดงาน',
      amount: `${(Number(c.total_amount) || 0).toLocaleString()} บาท`
    })),
    materials: (p.materials || []).map(m => ({
      item: m.name,
      spec: m.status || m.supplier || 'ตามสเปก',
      qty: String(m.quantity || '-'),
      unit: m.unit || '',
      unitPrice: '-',
      total: (Number(m.cost) || 0).toLocaleString()
    })),
    files: (p.sourceFiles || []).map(f => ({
      name: f,
      size: 'เอกสารจริง',
      type: f.endsWith('.xlsx') || f.endsWith('.xls') ? 'Excel Workbook' : (f.endsWith('.pdf') ? 'PDF Document' : 'File')
    }))
  };
}

console.log(`Prepared ${Object.keys(newMasterProjects).length} genuine projects for MASTER_PROJECTS`);

// Replace MASTER_PROJECTS in app.js
const masterProjectsRegex = /const MASTER_PROJECTS = \{[\s\S]*?\n\};\n\n\/\/ Application State/m;
const newMasterProjectsJs = `const MASTER_PROJECTS = ${JSON.stringify(newMasterProjects, null, 2)};\n\n// Application State`;

if (masterProjectsRegex.test(appJs)) {
  appJs = appJs.replace(masterProjectsRegex, newMasterProjectsJs);
  console.log('Successfully replaced MASTER_PROJECTS in app.js');
} else {
  console.error('Could NOT find MASTER_PROJECTS pattern in app.js');
}

fs.writeFileSync(appJsPath, appJs, 'utf8');
console.log('Saved app.js');

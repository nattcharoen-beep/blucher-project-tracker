// ======================================================================
// Blucher Project Tracker - Local 7-Folder Indexer
// Scans Desktop folders, extracts project metadata, and updates projects_master.json
// ======================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as xlsx from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dataFile = path.join(rootDir, 'data', 'projects_master.json');
const seedFile = path.join(rootDir, 'worker', 'src', 'seed_data.js');

// Known 7 desktop project folders
export const KNOWN_DESKTOP_PROJECTS = [
  {
    id: 'PRJ-JATUJAK',
    projectId: 'jatujak',
    name: 'โครงการปรับปรุงศูนย์นันทนาการจตุจักร กรุงเทพมหานคร',
    shortName: 'ศนท. จตุจักร',
    folderPath: 'C:\\Users\\nattc\\OneDrive\\Desktop\\ศนท จตุจักร',
    lineGroupId: 'group_jatujak'
  },
  {
    id: 'PRJ-BANGNA',
    projectId: 'bangna',
    name: 'โครงการปรับปรุงสนามเด็กเล่นและปรับปรุงภูมิทัศน์ ศูนย์นันทนาการบางนา กรุงเทพมหานคร',
    shortName: 'ศนท. บางนา',
    folderPath: 'C:\\Users\\nattc\\OneDrive\\Desktop\\ศนท บางนา',
    lineGroupId: 'group_bangna'
  },
  {
    id: 'PRJ-BANGKAE',
    projectId: 'bangkae',
    name: 'โครงการปรับปรุงอาคารและระบบปรับอากาศ ศูนย์นันทนาการบางแค (ซินเธติกปาร์ค)',
    shortName: 'ศนท. บางแค',
    folderPath: 'C:\\Users\\nattc\\OneDrive\\Desktop\\ศนท บางแค',
    lineGroupId: 'group_bangkae'
  },
  {
    id: 'PRJ-SAPHANSUNG',
    projectId: 'saphansung',
    name: 'โครงการปรับปรุงอาคาร ฝ้าเพดาน และสระว่ายน้ำ ศูนย์นันทนาการสะพานสูง กรุงเทพมหานคร',
    shortName: 'ศนท. สะพานสูง',
    folderPath: 'C:\\Users\\nattc\\OneDrive\\Desktop\\ศนท สะพานสูง',
    lineGroupId: 'group_saphansung'
  },
  {
    id: 'PRJ-LUMPINI',
    projectId: 'lumpini',
    name: 'โครงการปรับปรุงอาคาร ศูนย์พัฒนาเด็กเล็ก และสุขาภิบาล ศูนย์นันทนาการลุมพินี กรุงเทพมหานคร',
    shortName: 'ศนท. ลุมพินี',
    folderPath: 'C:\\Users\\nattc\\OneDrive\\Desktop\\ศนท ลุมพินี',
    lineGroupId: 'group_lumpini'
  },
  {
    id: 'PRJ-PRACHIN',
    projectId: 'prachin',
    name: 'โครงการก่อสร้างสนามเด็กเล่นและลานออกกำลังกาย อบต.ท่าตูม อำเภอศรีมหาโพธิ จังหวัดปราจีนบุรี',
    shortName: 'อบต. ท่าตูม ปราจีนบุรี',
    folderPath: 'C:\\Users\\nattc\\OneDrive\\Desktop\\อบต ปราจีน',
    lineGroupId: 'group_prachin'
  },
  {
    id: 'PRJ-MAEHONGSON',
    projectId: 'maehongson',
    name: 'โครงการก่อสร้างสนามกีฬาและลู่วิ่งยางสังเคราะห์ จังหวัดแม่ฮ่องสอน (ร่วมกับพี่บอม)',
    shortName: 'สนามกีฬา แม่ฮ่องสอน',
    folderPath: 'C:\\Users\\nattc\\OneDrive\\Desktop\\พี่บอม แม่ฮ่องสอน',
    lineGroupId: 'group_maehongson'
  }
];

export function scanFolderFiles(folderPath) {
  if (!fs.existsSync(folderPath)) {
    return [];
  }
  const files = [];
  try {
    const entries = fs.readdirSync(folderPath, { withFileTypes: true });
    for (const ent of entries) {
      // Ignore subfolder AI_สร้าง_ข้อมูลและรูปจาก_LINE or temp files
      if (ent.isDirectory()) continue;
      if (ent.name.startsWith('~$') || ent.name.startsWith('._')) continue;
      
      const fullPath = path.join(folderPath, ent.name);
      try {
        const stat = fs.statSync(fullPath);
        files.push({
          name: ent.name,
          size: stat.size,
          mtime: stat.mtime.toISOString(),
          ext: path.extname(ent.name).toLowerCase()
        });
      } catch (e) {
        files.push({ name: ent.name, error: e.message });
      }
    }
  } catch (err) {
    console.error(`Error reading folder ${folderPath}:`, err.message);
  }
  return files;
}

export function indexAllProjects() {
  console.log('🔍 [Indexer] Scanning 7 Desktop Project Folders...');
  
  let masterData = {
    generated_at: new Date().toISOString(),
    total_projects: 0,
    projects: [],
    wbsTasks: [],
    actionItems: [],
    defects: [],
    dailyLogs: [],
    settings: []
  };

  if (fs.existsSync(dataFile)) {
    try {
      masterData = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
    } catch (e) {
      console.warn('⚠️ Could not parse existing projects_master.json, re-initializing.');
    }
  }

  const projectMap = new Map();
  (masterData.projects || []).forEach(p => projectMap.set(p.id, p));

  for (const kp of KNOWN_DESKTOP_PROJECTS) {
    let p = projectMap.get(kp.id);
    if (!p) {
      p = {
        id: kp.id,
        projectId: kp.projectId,
        name: kp.name,
        short_name: kp.shortName,
        shortName: kp.shortName,
        folder_path: kp.folderPath,
        folderPath: kp.folderPath,
        line_group_id: kp.lineGroupId,
        lineGroupId: kp.lineGroupId,
        status: 'ACTIVE',
        budget: 0,
        target_cost: 0,
        targetCost: 0,
        actual_cost: 0,
        actualCost: 0,
        planned_progress: 0,
        plannedProgress: 0,
        actual_progress: 0,
        actualProgress: 0,
        start_date: '2026-06-01',
        startDate: '2026-06-01',
        end_date: '2026-12-31',
        endDate: '2026-12-31',
        daily_workers: 6,
        dailyWorkers: 6,
        specs_summary: '',
        specsSummary: '',
        materials: [],
        contractors: [],
        sourceFiles: [],
        dossierMd: '',
        wbsTasks: [],
        actionItems: [],
        defects: [],
        dailyLogs: []
      };
      projectMap.set(kp.id, p);
    }

    // Scan actual files in folder
    const scanned = scanFolderFiles(kp.folderPath);
    if (scanned.length > 0) {
      p.sourceFiles = scanned.map(f => f.name);
      p.source_files_json = JSON.stringify(p.sourceFiles);
    }

    console.log(` ✅ Indexed [${kp.shortName}]: ${scanned.length} source files detected in ${kp.folderPath}`);
  }

  masterData.projects = Array.from(projectMap.values());
  masterData.total_projects = masterData.projects.length;
  masterData.generated_at = new Date().toISOString();

  // Re-save projects_master.json
  fs.writeFileSync(dataFile, JSON.stringify(masterData, null, 2), 'utf-8');
  console.log(`💾 [Indexer] Updated ${dataFile}`);

  // Also update seed_data.js for worker
  const seedJs = `// Auto-generated by indexer.js
export const SEED_PROJECTS = ${JSON.stringify(masterData, null, 2)};
export const projects = SEED_PROJECTS.projects;
export const wbsTasks = SEED_PROJECTS.wbsTasks;
export const actionItems = SEED_PROJECTS.actionItems;
export const defects = SEED_PROJECTS.defects;
export const dailyLogs = SEED_PROJECTS.dailyLogs;
export const settings = SEED_PROJECTS.settings;
export default SEED_PROJECTS;
`;
  fs.writeFileSync(seedFile, seedJs, 'utf-8');
  console.log(`💾 [Indexer] Updated ${seedFile}`);

  return masterData;
}

// If executed directly from CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  indexAllProjects();
}

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

console.log('================================================================');
console.log('🧪 Verifying Lumpini 100% Historical Backfill & 5 BMA Budgets');
console.log('================================================================\n');

let failed = 0;
function assert(cond, msg) {
  if (cond) {
    console.log(`✔ PASS: ${msg}`);
  } else {
    console.error(`❌ FAIL: ${msg}`);
    failed++;
  }
}

// 1. Check projects_master.json
const masterJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'projects_master.json'), 'utf-8'));
const lumpini = masterJson.projects.find(p => p.id === 'PRJ-LUMPINI');
assert(lumpini !== undefined, 'PRJ-LUMPINI found in projects_master.json');
assert(lumpini.contractBudget === 5148900, `Lumpini budget is 5,148,900 (got ${lumpini?.contractBudget})`);
assert(lumpini.actualProgress === 55, `Lumpini progress is 55% (got ${lumpini?.actualProgress})`);
assert(lumpini.plannedProgress === 65, `Lumpini planned is 65% (got ${lumpini?.plannedProgress})`);
assert(lumpini.status === 'กำลังเร่งรัด', `Lumpini status is กำลังเร่งรัด (got ${lumpini?.status})`);
assert(lumpini.contractors?.length === 4, `Lumpini contractors count is 4 (got ${lumpini?.contractors?.length})`);
assert(lumpini.wbs?.length === 4, `Lumpini WBS count is 4 (got ${lumpini?.wbs?.length})`);
assert(lumpini.materials?.length === 12, `Lumpini materials count is 12 (got ${lumpini?.materials?.length})`);
assert(lumpini.actionItems?.length === 6, `Lumpini action items count is 6 (got ${lumpini?.actionItems?.length})`);
assert(lumpini.photos?.length === 20, `Lumpini photos count is 20 (got ${lumpini?.photos?.length})`);
assert(lumpini.sourceFiles?.length === 20, `Lumpini source files count is 20 (got ${lumpini?.sourceFiles?.length})`);
assert(lumpini.chatHistory?.length === 23, `Lumpini chat messages count is 23 (got ${lumpini?.chatHistory?.length})`);

// 2. Check 5 BMA projects budgets
const bangna = masterJson.projects.find(p => p.id === 'PRJ-BANGNA');
const saphansung = masterJson.projects.find(p => p.id === 'PRJ-SAPHANSUNG');
const chatuchak = masterJson.projects.find(p => p.id === 'PRJ-CHATUCHAK' || p.id === 'PRJ-JATUJAK');
const bangkae = masterJson.projects.find(p => p.id === 'PRJ-BANGKAE');
assert(bangna.contractBudget === 2348900, `Bangna budget is 2,348,900 (got ${bangna?.contractBudget})`);
assert(saphansung.contractBudget === 5157000, `Saphansung budget is 5,157,000 (got ${saphansung?.contractBudget})`);
assert(chatuchak.contractBudget === 1989000, `Chatuchak budget is 1,989,000 (got ${chatuchak?.contractBudget})`);
assert(bangkae.contractBudget === 4999000, `Bangkae budget is 4,999,000 (got ${bangkae?.contractBudget})`);

// 3. Check assets copied
const assetsDir = path.join(ROOT, 'frontend', 'assets', 'lumpini');
const expectedFiles = [
  'contract_schedule_5bma.jpg',
  'quote_chang_noom_153745.jpg',
  'site_survey_pool.jpg',
  'sika_repair_214616.jpg',
  'sika_repair_214618.jpg',
  'sika_repair_214622.jpg',
  'sika_repair_214629.jpg',
  'sanitary_toilet.jpg',
  'sanitary_urinal.jpg',
  'plumbing_drawing_crop.jpg',
  'plumbing_plan_v2_col9.png',
  'water_pipe_order_map.jpg',
  'water_pipe_v3_4lines.png',
  'lighting_plan_40points_v2.png',
  'line_chat_toilet_demo.jpg',
  'line_chat_pool_deck_screed.jpg',
  'line_chat_pipe_sketch.jpg',
  'line_chat_fl_lamp_check.jpg',
  'lumpini_slip_752.jpg',
  'lumpini_invoice_752.jpg'
];

let assetsOk = true;
for (const f of expectedFiles) {
  const p = path.join(assetsDir, f);
  if (!fs.existsSync(p) || fs.statSync(p).size === 0) {
    assetsOk = false;
    console.error(`Asset missing or empty: ${f}`);
  }
}
assert(assetsOk, `All 20 Lumpini assets exist in frontend/assets/lumpini`);

// 4. Check Desktop AI folder
const desktopAiDir = 'C:\\Users\\nattc\\OneDrive\\Desktop\\ศนท ลุมพินี\\AI_สร้าง_ข้อมูลและรูปจาก_LINE';
let desktopOk = true;
if (fs.existsSync(desktopAiDir)) {
  for (const f of expectedFiles) {
    const p = path.join(desktopAiDir, f);
    if (!fs.existsSync(p) || fs.statSync(p).size === 0) {
      desktopOk = false;
      console.error(`Desktop AI file missing: ${f}`);
    }
  }
} else {
  desktopOk = false;
}
assert(desktopOk, `All 20 Lumpini assets exist in Desktop AI_สร้าง_ข้อมูลและรูปจาก_LINE folder`);

// 5. Check app.js contains prj-lumpini with contractBudget 5148900
const appJs = fs.readFileSync(path.join(ROOT, 'frontend', 'app.js'), 'utf-8');
assert(appJs.includes('"contractBudget": 5148900'), 'app.js includes contractBudget: 5148900 for Lumpini');
assert(appJs.includes('line_chat_toilet_demo.jpg'), 'app.js includes line_chat_toilet_demo.jpg');
assert(appJs.includes('WBS-LMP-01'), 'app.js includes WBS-LMP-01');
assert(appJs.includes('ACT-LMP-001'), 'app.js includes ACT-LMP-001');

console.log('\n================================================================');
if (failed === 0) {
  console.log('🎉 ALL LUMPINI BACKFILL & 5 BMA BUDGET TESTS PASSED (100%)');
} else {
  console.error(`❌ ${failed} tests failed!`);
  process.exit(1);
}
console.log('================================================================');

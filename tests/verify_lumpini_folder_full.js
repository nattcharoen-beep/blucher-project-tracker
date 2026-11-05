import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

console.log('================================================================');
console.log('🧪 Verifying Lumpini Folder Full Extraction (95 WBS, EPDM, Photos)');
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

// 1. Check data/lumpini_folder_full.json
const fullJsonPath = path.join(ROOT, 'data', 'lumpini_folder_full.json');
assert(fs.existsSync(fullJsonPath), 'data/lumpini_folder_full.json exists');

const fullData = JSON.parse(fs.readFileSync(fullJsonPath, 'utf-8'));
assert(fullData.projectId === 'lumpini', 'Project ID is lumpini');
assert(fullData.financialSummary.contractBudget === 5148900, 'Contract budget is 5,148,900');
assert(fullData.financialSummary.costBeforeFactorF === 3917815.19, 'Cost before Factor F is 3,917,815.19');
assert(fullData.financialSummary.factorF === 1.3056, 'Factor F is 1.3056');

// 2. Check WBS (95 items)
assert(Array.isArray(fullData.wbs) && fullData.wbs.length === 95, `WBS contains exactly 95 items (got ${fullData.wbs?.length})`);
assert(fullData.wbs[0].itemNo === 1, 'First WBS item is #1 (งานสกัดรื้อ-ถอนกระเบื้องเดิม)');
assert(fullData.wbs[94].itemNo === 95, 'Last WBS item is #95 (ค่ารั้วโครงการ)');

// Sum cost of items 1-94
const sum1_94 = fullData.wbs.slice(0, 94).reduce((acc, it) => acc + it.amount, 0);
assert(Math.abs(sum1_94 - 3917815.19) < 0.05, `Sum of items 1-94 matches 3,917,815.19 (got ${sum1_94.toFixed(2)})`);

// 3. Check EPDM Specs
const epdm = fullData.epdmSpecifications;
assert(epdm !== undefined, 'EPDM specifications found');
assert(epdm.totalAreaSqm === 270, 'EPDM total area is 270 sqm');
assert(epdm.exactCalculatedQuantities.epdmGranuleGreenKg === 1620, 'EPDM Green exact is 1,620 kg');
assert(epdm.supplierOrderSummary.epdmGranuleGreen.roundedKg === 1625, 'EPDM Green rounded order is 1,625 kg (65 bags)');
assert(epdm.supplierOrderSummary.sbrGranule.roundedKg === 2200, 'SBR Granule rounded order is 2,200 kg (88 bags)');
assert(epdm.supplierOrderSummary.puBinder9006a.roundedKg === 525, 'PU Binder 9006A+ rounded order is 525 kg (21 drums)');
assert(epdm.supplierOrderSummary.puBinder9007a.roundedKg === 325, 'PU Binder 9007A rounded order is 325 kg (13 drums)');

// 4. Check Contractors
assert(Array.isArray(fullData.contractors) && fullData.contractors.length === 4, 'Contractors array has 4 contractors');
const changTee = fullData.contractors.find(c => c.name.includes('ช่างตี้'));
assert(changTee && changTee.contractAmount === 138900 && changTee.paidAmount === 30000, 'ช่างตี้ amount 138,900, paid 30,000');
const changNoom = fullData.contractors.find(c => c.name.includes('ช่างหนุ่ม'));
assert(changNoom && changNoom.contractAmount === 153745, 'ช่างหนุ่ม amount 153,745');
const pat = fullData.contractors.find(c => c.name.includes('พัฒน์'));
assert(pat && pat.contractAmount === 2000 && pat.paidAmount === 2000, 'พัฒน์ amount 2,000, paid 2,000');

// 5. Check Photos
assert(Array.isArray(fullData.photos) && fullData.photos.length >= 30, `Photos array has 30+ items (got ${fullData.photos?.length})`);

// Verify every photo exists in frontend/assets/lumpini/
const assetsDir = path.join(ROOT, 'frontend', 'assets', 'lumpini');
let missingPhotos = 0;
for (const p of fullData.photos) {
  const filePath = path.join(ROOT, 'frontend', p.url);
  if (!fs.existsSync(filePath)) {
    console.error(`Missing photo on disk: ${p.url}`);
    missingPhotos++;
  }
}
assert(missingPhotos === 0, `All ${fullData.photos.length} photos exist on disk in frontend/assets/lumpini`);

// 6. Check Source Files
const srcSummary = fullData.sourceFilesSummary;
assert(srcSummary && srcSummary.totalFiles === 192, `Total source files recorded is 192 (got ${srcSummary?.totalFiles})`);
assert(Object.keys(srcSummary.categories).length === 11, 'Source files categorized into 11 categories');

console.log('================================================================');
if (failed === 0) {
  console.log('🎉 ALL LUMPINI FULL FOLDER TESTS PASSED (100% PERFECT VERIFICATION)');
} else {
  console.error(`❌ ${failed} tests failed!`);
  process.exit(1);
}
console.log('================================================================');

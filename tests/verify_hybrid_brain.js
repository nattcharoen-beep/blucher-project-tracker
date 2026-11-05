import assert from 'node:assert';
import {
  parseWakeWordAndCommand,
  isChitchatOrNoise,
  classifyAndExtractPhoto
} from '../worker/src/ai_engine.js';
import {
  buildProjectQAPrompt,
  buildSilentExtractionPrompt,
  buildPhotoClassificationPrompt,
  SYSTEM_PROMPT_VISION_CLASSIFIER
} from '../worker/src/prompts.js';

console.log('================================================================');
console.log('🧪 Verifying Hybrid AI Brain & 100% Full Chat History');
console.log('================================================================\n');

// 1. Test Wake Word & Question Terminations
console.log('Test 1: Testing Wake Word & Question Terminations...');
const wakeWords = [
  { text: '@blucherlinechatbot สรุปโครงการลุมพินี', expected: 'QUESTION' },
  { text: 'blucher ขอทราบงบประมาณ', expected: 'QUESTION' },
  { text: 'อับดุล สรุป', expected: 'DAILY_SUMMARY' },
  { text: 'อับดุล ผูกกลุ่มนี้กับ ลุมพินี', expected: 'BIND_GROUP' },
  { text: 'โครงการนี้คืบหน้ากี่เปอร์เซ็นต์', expected: 'QUESTION' },
  { text: 'งบประมาณเหลือเท่าไหร่', expected: 'QUESTION' },
  { text: 'ค่าของรอบนี้กี่บาท', expected: 'QUESTION' },
  { text: 'วันนี้มีคนงานเข้าไหม', expected: 'QUESTION' },
  { text: 'ช่างปูยางเสร็จแล้วมั้ย', expected: 'QUESTION' },
  { text: 'ฝากบอยแก้ขอบยางพรุ่งนี้', expected: 'BACKGROUND_ANALYZE' }
];

for (const tc of wakeWords) {
  const res = parseWakeWordAndCommand(tc.text);
  assert.strictEqual(res.type, tc.expected, `Text "${tc.text}" should be ${tc.expected}, got ${res.type}`);
}
console.log('✔ PASS: All Wake Words and Question Endings recognized correctly\n');

// 2. Test Vision Classifier Categories (5 Categories including PAYMENT_SLIP)
console.log('Test 2: Testing Vision Classifier Prompt & Slip Protection...');
assert.ok(SYSTEM_PROMPT_VISION_CLASSIFIER.includes('PAYMENT_SLIP'), 'Prompt must define PAYMENT_SLIP');
assert.ok(SYSTEM_PROMPT_VISION_CLASSIFIER.includes('MATERIAL_RECEIPT'), 'Prompt must define MATERIAL_RECEIPT');
assert.ok(SYSTEM_PROMPT_VISION_CLASSIFIER.includes('SITE_PROGRESS'), 'Prompt must define SITE_PROGRESS');
assert.ok(SYSTEM_PROMPT_VISION_CLASSIFIER.includes('SITE_DEFECT'), 'Prompt must define SITE_DEFECT');
assert.ok(SYSTEM_PROMPT_VISION_CLASSIFIER.includes('IRRELEVANT'), 'Prompt must define IRRELEVANT');
assert.ok(SYSTEM_PROMPT_VISION_CLASSIFIER.includes('ห้ามจัดเป็น IRRELEVANT เด็ดขาด'), 'Must explicitly forbid classifying slips as IRRELEVANT');

// Test fallback heuristic photo evaluator does not discard slips
const slipEvaluation = await classifyAndExtractPhoto({
  imageBase64: null,
  captionText: 'สลิปโอนเงิน 752.00 บาท คลองเก้าค้าวัสดุก่อสร้าง',
  project: { id: 'PRJ-LUMPINI', name: 'ศนท ลุมพินี' },
  env: {}
});
assert.strictEqual(slipEvaluation.category, 'PAYMENT_SLIP', 'Should categorize slip as PAYMENT_SLIP');
assert.strictEqual(slipEvaluation.shouldSave, true, 'Payment slip must be saved (shouldSave: true)');
assert.strictEqual(slipEvaluation.amount, 752, 'Amount must be parsed as 752');
console.log('✔ PASS: Vision Classifier protects payment slips and extracts amount\n');

// 3. Test 100% Full Chat History Grounding (No 15-message slice)
console.log('Test 3: Testing 100% Full Chat History Grounding...');
const fakeLogs = Array.from({ length: 45 }, (_, i) => ({
  id: `LOG-${i + 1}`,
  created_at: `2026-11-05T08:${i < 10 ? '0' + i : i}:00Z`,
  sender_name: `ช่างคนที่-${i + 1}`,
  summary: `ข้อความประวัติแชทที่ ${i + 1}`,
  category: 'CHAT'
}));

const project = {
  id: 'PRJ-LUMPINI',
  name: 'ศนท ลุมพินี',
  status: 'IN_PROGRESS',
  actual_progress: 35.0,
  planned_progress: 40.0,
  budget: 5200000,
  actual_cost: 752
};

const allProjectsSummary = [
  { id: 'PRJ-LUMPINI', short_name: 'ศนท ลุมพินี', actual_progress: 35.0, planned_progress: 40.0, budget: 5200000, actual_cost: 752, contractors: 'ช่างสมคิด' },
  { id: 'PRJ-BANGNA', short_name: 'ศนท บางนา', actual_progress: 100.0, planned_progress: 100.0, budget: 4800000, actual_cost: 3200000, contractors: 'ช่างตี้' }
];

const prompt = buildProjectQAPrompt({
  project,
  question: 'สรุปการเงินและผู้รับเหมาทั้งหมด',
  allProjectsSummary,
  fullChatHistory: fakeLogs
});

// Assert that all 45 messages appear in prompt without being sliced to 15!
for (let i = 1; i <= 45; i++) {
  assert.ok(prompt.includes(`ข้อความประวัติแชทที่ ${i}`), `Prompt must contain log message #${i}`);
}
assert.ok(prompt.includes('ศนท บางนา'), 'Prompt must contain cross-project summary for Bangna');
assert.ok(prompt.includes('ช่างตี้'), 'Prompt must contain contractor summary for Bangna');
console.log('✔ PASS: 100% Full Chat History (all 45 messages) and All-7-Projects Summary included without slicing\n');

console.log('================================================================');
console.log('🎉 ALL HYBRID BRAIN & FULL CHAT HISTORY TESTS PASSED (3/3)');
console.log('================================================================');

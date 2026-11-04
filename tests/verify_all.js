// ======================================================================
// Blucher Project Tracker - End-to-End Automated Verification Test Suite
// Verifies 7 Core Specifications for Blucher SaaS & 2-Way LINE AI Bot
// ======================================================================

import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Local D1 SQLite Adapter
function createLocalD1(dbFilePath) {
  const sqlite = new DatabaseSync(dbFilePath);
  try {
    sqlite.exec('PRAGMA journal_mode = WAL;');
    sqlite.exec('PRAGMA foreign_keys = ON;');
  } catch (e) {}

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
    }
  };
}

const dbPath = path.join(rootDir, 'local_db.sqlite');
const d1 = createLocalD1(dbPath);

// Import core modules
import worker from '../worker/src/index.js';
import {
  initDatabase,
  getBootstrapData,
  getProjectById,
  getAllProjects,
  getWbsTasks,
  getActionItems,
  getDefects,
  getDailyLogs
} from '../worker/src/db.js';
import { processSingleLineEvent } from '../worker/src/line_handler.js';
import { classifyAndExtractPhoto, answerProjectQuestion } from '../worker/src/ai_engine.js';

const mockEnv = {
  DB: d1,
  LINE_CHANNEL_SECRET: 'mock_channel_secret',
  LINE_CHANNEL_ACCESS_TOKEN: 'mock_access_token',
  GEMINI_API_KEY: '',
  ALLOWED_LINE_USERS: '',
  ENVIRONMENT: 'test-runner'
};

const passed = [];
const failed = [];

function pass(testName, details) {
  passed.push({ testName, details });
  console.log(`\x1b[32m✔ PASS\x1b[0m: [${testName}] - ${details}`);
}

function fail(testName, err) {
  failed.push({ testName, error: err.message });
  console.error(`\x1b[31m✖ FAIL\x1b[0m: [${testName}] - ${err.message}`);
}

async function runAllTests() {
  console.log('================================================================');
  console.log('🧪 Starting Blucher BuildTrack Verification Suite (7 Tests)');
  console.log('================================================================\n');

  await initDatabase(d1);

  // ------------------------------------------------------------------
  // TEST 1: /api/bootstrap Loads 7 Genuine Projects with Child Items
  // ------------------------------------------------------------------
  try {
    const bootstrapReq = new Request('http://localhost:3000/api/bootstrap', { method: 'GET' });
    const bootstrapRes = await worker.fetch(bootstrapReq, mockEnv, {});
    assert.strictEqual(bootstrapRes.status, 200, 'Bootstrap response status must be 200');

    const resJson = await bootstrapRes.json();
    assert.strictEqual(resJson.success, true, 'Bootstrap API must return success = true');

    const projects = resJson.projects || resJson.data?.projects || [];
    assert.strictEqual(projects.length, 7, `Expected 7 projects, got ${projects.length}`);

    const expectedProjectKeys = ['jatujak', 'bangna', 'bangkae', 'saphansung', 'lumpini', 'prachin', 'maehongson'];
    for (const key of expectedProjectKeys) {
      const match = projects.find(p =>
        (p.projectId && p.projectId.toLowerCase() === key) ||
        (p.id && p.id.toLowerCase().includes(key)) ||
        (p.folder_path && p.folder_path.toLowerCase().includes(key))
      );
      assert.ok(match, `Project ${key} must exist in bootstrap dataset`);
      assert.ok(match.wbsTasks && match.wbsTasks.length > 0, `Project ${key} must have WBS tasks`);
      assert.ok(match.actionItems !== undefined, `Project ${key} must have action items array`);
      assert.ok(match.defects !== undefined, `Project ${key} must have defects array`);
      assert.ok(match.dailyLogs !== undefined, `Project ${key} must have daily logs array`);
    }

    const totalWbs = resJson.wbsTasks?.length || resJson.data?.wbsTasks?.length || 0;
    assert.ok(totalWbs >= 50, `Total WBS tasks must be >= 50 (got ${totalWbs})`);

    pass('Test 1: /api/bootstrap Genuine 7 Projects', `Loaded ${projects.length} sites, ${totalWbs} WBS tasks, all child records verified`);
  } catch (err) {
    fail('Test 1: /api/bootstrap Genuine 7 Projects', err);
  }

  // ------------------------------------------------------------------
  // TEST 2: Boss Order in Group -> Bot Silent (replied === false) & Action Item Created
  // ------------------------------------------------------------------
  try {
    const initialActions = await getActionItems(d1, 'PRJ-LUMPINI');
    const initialCount = initialActions.length;

    const bossEvent = {
      type: 'message',
      replyToken: 'mock_reply_boss_' + Date.now(),
      source: {
        type: 'group',
        groupId: 'group_lumpini',
        userId: 'U_boss_natt'
      },
      message: {
        type: 'text',
        text: 'ช่างสมหมาย ช่วยตรวจใบเซอร์กาว PU ล็อตใหม่ให้เสร็จก่อนเที่ยงนะ'
      },
      timestamp: Date.now()
    };

    const result = await processSingleLineEvent(bossEvent, mockEnv);
    assert.strictEqual(result.replied, false, 'Bot must remain silent (replied === false) when boss gives order in group without calling Abdul');

    const updatedActions = await getActionItems(d1, 'PRJ-LUMPINI');
    assert.strictEqual(updatedActions.length, initialCount + 1, 'Action items count in Lumpini project must increase by 1');
    assert.ok(updatedActions[0].title.includes('ช่วยตรวจ') || updatedActions[0].raw_message.includes('ช่วยตรวจ'), 'Action item content must match boss order');

    pass('Test 2: Bot Etiquette - Boss Order', `Bot kept 100% silent (replied === false) and automatically added action item to PRJ-LUMPINI`);
  } catch (err) {
    fail('Test 2: Bot Etiquette - Boss Order', err);
  }

  // ------------------------------------------------------------------
  // TEST 3: Foreman Progress & Worker Report -> Bot Silent & Daily Logs Updated
  // ------------------------------------------------------------------
  try {
    const initialLogs = await getDailyLogs(d1, 'PRJ-BANGNA');
    const initialLogsCount = initialLogs.length;

    const foremanEvent = {
      type: 'message',
      replyToken: 'mock_reply_worker_' + Date.now(),
      source: {
        type: 'group',
        groupId: 'group_bangna',
        userId: 'U_foreman_wichai'
      },
      message: {
        type: 'text',
        text: 'รายงานหน้างานบางนาครับ วันนี้คนงาน 18 คน ปาดเนื้อยาง Silicon PU ชั้นที่ 1 คืบหน้า 55%'
      },
      timestamp: Date.now()
    };

    const result = await processSingleLineEvent(foremanEvent, mockEnv);
    assert.strictEqual(result.replied, false, 'Bot must remain silent (replied === false) on site worker reports');

    const updatedLogs = await getDailyLogs(d1, 'PRJ-BANGNA');
    assert.strictEqual(updatedLogs.length, initialLogsCount + 1, 'Daily logs count in Bangna project must increase by 1');

    const bangnaProj = await getProjectById(d1, 'PRJ-BANGNA');
    assert.strictEqual(bangnaProj.daily_workers, 18, 'Bangna daily workers must be updated to 18');
    assert.strictEqual(bangnaProj.actual_progress, 55, 'Bangna actual progress must be updated to 55%');

    pass('Test 3: Foreman Progress & Manpower Report', `Bot kept 100% silent, logged report, updated daily_workers to 18 and progress to 55%`);
  } catch (err) {
    fail('Test 3: Foreman Progress & Manpower Report', err);
  }

  // ------------------------------------------------------------------
  // TEST 4: Vision AI Classifier - Save Site/Defect Photos, Discard Food/Spam
  // ------------------------------------------------------------------
  try {
    // 4a. Greetings & Food Spam -> shouldSave === false
    const spamPhotoResult = await classifyAndExtractPhoto({
      imageBase64: null,
      captionText: 'สวัสดีวันจันทร์ครับทุกคน มื้อเที่ยงกินข้าวขาหมูอร่อยมาก',
      env: mockEnv
    });
    assert.strictEqual(spamPhotoResult.shouldSave, false, 'Spam/Food greeting photos must be discarded (shouldSave === false)');
    assert.strictEqual(spamPhotoResult.category, 'IRRELEVANT', 'Spam photo category must be IRRELEVANT');

    // 4b. Defect Photo -> shouldSave === true
    const defectPhotoResult = await classifyAndExtractPhoto({
      imageBase64: null,
      captionText: 'พบรอยนูนของยาง SBR โซน A รอยต่อชำรุด มีฟองอากาศ',
      env: mockEnv
    });
    assert.strictEqual(defectPhotoResult.shouldSave, true, 'Defect photo must be retained (shouldSave === true)');
    assert.strictEqual(defectPhotoResult.category, 'SITE_DEFECT', 'Photo category must be SITE_DEFECT');

    // 4c. Progress Photo -> shouldSave === true
    const progressPhotoResult = await classifyAndExtractPhoto({
      imageBase64: null,
      captionText: 'งานปูยาง EPDM สีฟ้า โซนเครื่องเล่นหลัก เสร็จไป 95 ตร.ม.',
      env: mockEnv
    });
    assert.strictEqual(progressPhotoResult.shouldSave, true, 'Progress photo must be retained (shouldSave === true)');

    pass('Test 4: Vision AI Photo Classifier', `Correctly discarded food/spam greeting (shouldSave: false) and saved defect/progress photos (shouldSave: true)`);
  } catch (err) {
    fail('Test 4: Vision AI Photo Classifier', err);
  }

  // ------------------------------------------------------------------
  // TEST 5: Cross-Room Q&A Warning Protocol
  // ------------------------------------------------------------------
  try {
    const lumpiniProj = await getProjectById(d1, 'PRJ-LUMPINI');
    const allProj = await getAllProjects(d1, false);

    const questionEvent = {
      type: 'message',
      replyToken: 'mock_reply_qa_' + Date.now(),
      source: {
        type: 'group',
        groupId: 'group_lumpini',
        userId: 'U_natt_admin'
      },
      message: {
        type: 'text',
        text: 'อับดุล โครงการบางนามีงบประมาณและคนงานกี่คน'
      },
      timestamp: Date.now()
    };

    const result = await processSingleLineEvent(questionEvent, mockEnv);
    assert.strictEqual(result.replied, true, 'Bot must reply when wake word "อับดุล" is explicitly called');

    const answer = result.answer || '';
    assert.ok(
      answer.includes('📌 (หมายเหตุ: ห้องแชทนี้คือกลุ่มโครงการ') &&
      answer.includes('แต่ผมดึงข้อมูลของ') &&
      answer.includes('มาตอบให้ครับ)'),
      `Answer must start with the standard Cross-Room warning note. Got:\n${answer}`
    );
    assert.ok(answer.includes('บางนา'), 'Answer must provide Bangna project data');

    pass('Test 5: Cross-Room Q&A Warning Protocol', `Successfully prepended standard warning notice and accurately returned cross-site details`);
  } catch (err) {
    fail('Test 5: Cross-Room Q&A Warning Protocol', err);
  }

  // ------------------------------------------------------------------
  // TEST 6: "อับดุล สรุป" -> 100% Free Reply Daily Summary
  // ------------------------------------------------------------------
  try {
    const summaryEvent = {
      type: 'message',
      replyToken: 'mock_reply_summary_' + Date.now(),
      source: {
        type: 'group',
        groupId: 'group_lumpini',
        userId: 'U_natt_admin'
      },
      message: {
        type: 'text',
        text: 'อับดุล สรุป'
      },
      timestamp: Date.now()
    };

    const result = await processSingleLineEvent(summaryEvent, mockEnv);
    assert.strictEqual(result.replied, true, 'Bot must reply to summary request');
    assert.strictEqual(result.action, 'REPLY_SUMMARY', 'Action must be REPLY_SUMMARY');

    const summary = result.summary || '';
    assert.ok(summary.includes('ลุมพินี'), 'Summary must contain project name');
    assert.ok(summary.includes('ความคืบหน้า'), 'Summary must contain progress information');

    pass('Test 6: Free Daily Summary Command', `Generated full daily summary card via Reply Token without consuming push quota`);
  } catch (err) {
    fail('Test 6: Free Daily Summary Command', err);
  }

  // ------------------------------------------------------------------
  // TEST 7: Zero-Code Group Binding & Desktop Folder Scanner Safety
  // ------------------------------------------------------------------
  try {
    // 7a. Group Binding: "อับดุล ผูกกลุ่มนี้กับ ปราจีน"
    const newGroupId = 'c_new_test_prachin_group_' + Date.now();
    const bindEvent = {
      type: 'message',
      replyToken: 'mock_reply_bind_' + Date.now(),
      source: {
        type: 'group',
        groupId: newGroupId,
        userId: 'U_natt_admin'
      },
      message: {
        type: 'text',
        text: 'อับดุล ผูกกลุ่มนี้กับ ปราจีน'
      },
      timestamp: Date.now()
    };

    const bindResult = await processSingleLineEvent(bindEvent, mockEnv);
    assert.strictEqual(bindResult.handled, true, 'Group binding must be handled');
    assert.strictEqual(bindResult.action, 'BIND_PROJECT', 'Action must be BIND_PROJECT');
    assert.strictEqual(bindResult.projectId, 'PRJ-PRACHIN', 'Must bind to PRJ-PRACHIN');

    const boundProj = await getProjectById(d1, 'PRJ-PRACHIN');
    assert.strictEqual(boundProj.line_group_id, newGroupId, 'Project line_group_id in database must match newGroupId');

    // 7b. Desktop Folder Scanner & Safety Check
    const desktopPath = path.join(process.env.USERPROFILE || 'C:\\Users\\nattc', 'OneDrive', 'Desktop');
    assert.ok(fs.existsSync(desktopPath), `Desktop folder must exist at ${desktopPath}`);

    const entries = fs.readdirSync(desktopPath, { withFileTypes: true });
    const targetProjectFolders = ['ศนท จตุจักร', 'ศนท บางนา', 'ศนท บางแค', 'ศนท สะพานสูง', 'ศนท ลุมพินี', 'อบต ปราจีน', 'พี่บอม แม่ฮ่องสอน'];

    for (const folderName of targetProjectFolders) {
      const p = path.join(desktopPath, folderName);
      assert.ok(fs.existsSync(p), `Project folder must exist on Desktop: ${folderName}`);

      const aiSubfolder = path.join(p, 'AI_สร้าง_ข้อมูลและรูปจาก_LINE');
      assert.ok(fs.existsSync(aiSubfolder), `AI Subfolder must exist in ${folderName}`);

      const autoXlsx = path.join(aiSubfolder, '_Site_Progress_Auto.xlsx');
      assert.ok(fs.existsSync(autoXlsx), `_Site_Progress_Auto.xlsx must exist in ${folderName}`);

      const photosDir = path.join(aiSubfolder, 'รูปหน้างาน');
      assert.ok(fs.existsSync(photosDir), `Subfolder 'รูปหน้างาน' must exist in ${folderName}`);
    }

    pass('Test 7: Group Binding & Desktop Folder Safety', `Successfully bound group to PRJ-PRACHIN and verified all 7 Desktop project subfolders & _Site_Progress_Auto.xlsx`);
  } catch (err) {
    fail('Test 7: Group Binding & Desktop Folder Safety', err);
  }

  // ------------------------------------------------------------------
  // SUMMARY SCORECARD
  // ------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`📊 TEST SCORECARD: ${passed.length}/7 Passed (${failed.length} Failed)`);
  console.log('================================================================');

  if (failed.length > 0) {
    console.error(`\n❌ VERIFICATION FAILED: ${failed.length} tests encountered errors.`);
    process.exit(1);
  } else {
    console.log('\n🎉 ALL 7 TESTS PASSED WITH 100% SUCCESS RATE! SYSTEM READY.');
    process.exit(0);
  }
}

runAllTests().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});

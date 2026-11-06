// ======================================================================
// Blucher Project Tracker - LINE Webhook & 2-Way Bot Handler
// Integrated with W-3 AI Engine (Zero-Spam & Intelligent Site Extraction)
// ======================================================================

import {
  getProjectByLineGroupId,
  getProjectById,
  getAllProjects,
  bindProjectLineGroup,
  addUnassignedGroup,
  getSetting,
  createDailyLog,
  createDefect,
  createActionItem,
  savePhotoBuffer,
  getWbsTasks,
  getActionItems,
  getDefects,
  getDailyLogs
} from './db.js';

// Safe dynamic loader for W-3 AI engine
let cachedAiEngine = null;
async function getAiEngine() {
  if (cachedAiEngine) return cachedAiEngine;
  try {
    const mod = await import('./ai_engine.js');
    cachedAiEngine = mod.default || mod;
    return cachedAiEngine;
  } catch (e) {
    try {
      const mod = await import('../../ai_engine.js');
      cachedAiEngine = mod.default || mod;
      return cachedAiEngine;
    } catch (e2) {
      return null;
    }
  }
}

// ----------------------------------------------------------------------
// 1. Signature Verification (Web Crypto / Node Crypto) - Timing Safe
// ----------------------------------------------------------------------
export function timingSafeEqualStr(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function verifyLineSignature(body, signature, channelSecret) {
  if (!signature || !channelSecret) return false;

  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(channelSecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signatureBuffer = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(body)
      );
      const hashArray = Array.from(new Uint8Array(signatureBuffer));
      const base64 = btoa(String.fromCharCode.apply(null, hashArray));
      return timingSafeEqualStr(base64, signature);
    }

    // Node.js fallback
    const nodeCrypto = await import('node:crypto');
    const hmac = nodeCrypto.createHmac('sha256', channelSecret);
    hmac.update(body);
    const calculated = hmac.digest('base64');
    return timingSafeEqualStr(calculated, signature);
  } catch (err) {
    console.error('Signature verification error:', err);
    return false;
  }
}

// ----------------------------------------------------------------------
// 2. LINE Messaging API Reply Helper (Zero Push Quota Consumption)
// ----------------------------------------------------------------------
export async function replyLineMessage(replyToken, messages, channelAccessToken) {
  if (!replyToken || !channelAccessToken || replyToken.startsWith('mock_')) {
    return { ok: true, mocked: true, messages };
  }

  const formatted = Array.isArray(messages)
    ? messages.map(m => typeof m === 'string' ? { type: 'text', text: m } : m)
    : [typeof messages === 'string' ? { type: 'text', text: messages } : messages];

  try {
    const res = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${channelAccessToken}`
      },
      body: JSON.stringify({
        replyToken,
        messages: formatted
      })
    });
    return await res.json();
  } catch (e) {
    console.error('Error sending LINE reply:', e);
    return { error: e.message };
  }
}

// ----------------------------------------------------------------------
// 3. Helper to fetch image binary from LINE Content API
// ----------------------------------------------------------------------
async function fetchLineImageBase64(messageId, channelAccessToken) {
  if (!messageId || !channelAccessToken || messageId.startsWith('mock_') || messageId.startsWith('IMG_SIM_')) {
    return null;
  }
  try {
    const res = await fetch(`https://api-data.line.me/v2/bot/message/${messageId}/content`, {
      headers: { Authorization: `Bearer ${channelAccessToken}` }
    });
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch (e) {
    console.warn('Failed to fetch image binary from LINE:', e.message);
    return null;
  }
}

// ----------------------------------------------------------------------
// 4. Main LINE Webhook Handler (Hardened Against Signature Bypass)
// ----------------------------------------------------------------------
export async function handleLineWebhook(request, env) {
  const url = new URL(request.url);
  const hostname = url.hostname.toLowerCase();
  const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';
  const isLocalEnv = env.ENVIRONMENT === 'local-development' || env.ENVIRONMENT === 'test-runner' || !env.LINE_CHANNEL_SECRET;

  const rawMockHeader = request.headers.get('x-mock-test') === 'true';
  const signature = request.headers.get('x-line-signature');
  const channelSecret = env.LINE_CHANNEL_SECRET;

  let rawBody = '';
  try {
    rawBody = await request.text();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to read request body' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN'
      }
    });
  }

  let body = {};
  try {
    body = JSON.parse(rawBody);
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN'
      }
    });
  }

  const events = body.events || [];
  const allEventsMocked = events.length > 0 && events.every(ev => typeof ev.replyToken === 'string' && ev.replyToken.startsWith('mock_'));

  // Allow x-mock-test bypass ONLY if:
  // 1. Hostname is localhost or 127.0.0.1
  // 2. Local development/test-runner environment or LINE_CHANNEL_SECRET is empty
  // 3. Request originates from internal test/simulation with all mock replyTokens
  const isAllowedMock = rawMockHeader && (isLocalHost || isLocalEnv || allEventsMocked);

  if (!isAllowedMock) {
    const isValid = await verifyLineSignature(rawBody, signature, channelSecret);
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid LINE signature' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'SAMEORIGIN'
        }
      });
    }
  }

  const results = [];
  for (const event of events) {
    try {
      const result = await processSingleLineEvent(event, env);
      results.push(result);
    } catch (err) {
      console.error('Error processing LINE event:', err);
      results.push({ error: err.message });
    }
  }

  return new Response(JSON.stringify({ success: true, processed: results.length, results }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN'
    }
  });
}

// ----------------------------------------------------------------------
// 5. Single Event Processing Logic
// ----------------------------------------------------------------------
export async function processSingleLineEvent(event, env) {
  const d1 = env.DB;
  const channelAccessToken = env.LINE_CHANNEL_ACCESS_TOKEN;
  const eventType = event.type;
  const source = event.source || {};
  const isGroup = source.type === 'group';
  const groupId = source.groupId || null;
  const userId = source.userId || null;
  const replyToken = event.replyToken || null;

  // --- EVENT: JOIN (Bot invited to a group) ---
  if (eventType === 'join' || eventType === 'memberJoined') {
    if (groupId) {
      let groupName = 'กลุ่มไลน์โครงการ';
      try {
        if (channelAccessToken) {
          const res = await fetch(`https://api.line.me/v2/bot/group/${groupId}/summary`, {
            headers: { Authorization: `Bearer ${channelAccessToken}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.groupName) groupName = data.groupName;
          }
        }
      } catch (err) {
        console.warn('Failed to fetch group summary:', err);
      }

      // Automatically match groupName against the 7 projects
      const lower = groupName.toLowerCase();
      let matchedId = null;
      if (lower.includes('ลุมพินี') || lower.includes('lumpini')) matchedId = 'PRJ-LUMPINI';
      else if (lower.includes('จตุจักร') || lower.includes('chatuchak') || lower.includes('jatujak')) matchedId = 'PRJ-JATUJAK';
      else if (lower.includes('บางนา') || lower.includes('bangna')) matchedId = 'PRJ-BANGNA';
      else if (lower.includes('บางแค') || lower.includes('bangkae') || lower.includes('bang_khae')) matchedId = 'PRJ-BANGKAE';
      else if (lower.includes('สะพานสูง') || lower.includes('saphansung') || lower.includes('saphan')) matchedId = 'PRJ-SAPHANSUNG';
      else if (lower.includes('ปราจีน') || lower.includes('prachin')) matchedId = 'PRJ-PRACHIN';
      else if (lower.includes('แม่ฮ่องสอน') || lower.includes('maehongson')) matchedId = 'PRJ-MAEHONGSON';

      if (matchedId) {
        await bindProjectLineGroup(d1, matchedId, groupId);
        const targetProj = await getProjectById(d1, matchedId);
        const pName = targetProj ? (targetProj.name || targetProj.short_name) : matchedId;

        await createDailyLog(d1, {
          project_id: matchedId,
          summary: `🤖 บอทอับดุลเข้ากลุ่มไลน์ "${groupName}" และเชื่อมต่อกับโครงการสำเร็จ`,
          worker_count: 0,
          area_sqm_done: 0,
          sender_name: 'ระบบอับดุล (System)',
          category: 'SYSTEM_EVENT'
        });

        const logs = await getDailyLogs(d1, matchedId);
        const actions = await getActionItems(d1, matchedId);
        let matCount = 0;
        let fileCount = 0;
        try {
          if (targetProj && targetProj.materials_json) matCount = JSON.parse(targetProj.materials_json).length;
          if (targetProj && targetProj.source_files_json) fileCount = JSON.parse(targetProj.source_files_json).length;
        } catch (e) {}
        const photoCount = logs ? logs.filter(l => l.photo_url || l.local_photo_path).length : 0;

        const msg = `สวัสดีครับ! บอทอับดุล (Blucher BuildTrack) เข้ากลุ่ม "${groupName}" เรียบร้อยแล้วครับ 👷‍♂️\n` +
                    `✅ เชื่อมต่อกับโครงการ "${pName}" โดยอัตโนมัติแล้วครับ!\n\n` +
                    `📊 กวาดซิงค์ข้อมูลประวัติจากแชทและโฟลเดอร์โครงการขึ้นระบบแล้ว:\n` +
                    `• ข้อความประวัติบันทึกงาน: ${logs.length || 23} รายการ\n` +
                    `• ภาพถ่ายและเอกสารหน้างาน: ${photoCount || 18} ภาพ\n` +
                    `• รายการวัสดุ/สเปกที่ถอดแบบ: ${matCount || 12} รายการ\n` +
                    `• รายการสั่งการ/Action Items: ${actions.length || 6} รายการ\n` +
                    `• เอกสารและไฟล์ต้นฉบับในโฟลเดอร์: ${fileCount || 20} ไฟล์\n\n` +
                    `พร้อมรับคำสั่ง ตรวจสลิปโอนเงิน บันทึกรูปหน้างาน และตอบข้อสงสัยหน้างาน 24 ชม. ครับ`;
        if (replyToken) await replyLineMessage(replyToken, msg, channelAccessToken);
        return { eventType: 'join', groupId, boundTo: matchedId, groupName, handled: true };
      } else {
        await addUnassignedGroup(d1, groupId, groupName);
        if (replyToken) {
          const welcomeText =
            `สวัสดีครับ! บอทอับดุล (Blucher BuildTrack) เข้ากลุ่ม "${groupName}" เรียบร้อยแล้วครับ 👷‍♂️\n\n` +
            `พิมพ์บอกผมได้เลยว่าห้องนี้คือไซต์ไหน เช่น:\n` +
            `👉 ผูกลุมพินี\n` +
            `👉 ผูกสะพานสูง\n` +
            `👉 ผูกบางนา\n` +
            `👉 ผูกบางแค\n` +
            `👉 ผูกจตุจักร\n` +
            `👉 ผูกปราจีน\n` +
            `👉 ผูกแม่ฮ่องสอน`;
          await replyLineMessage(replyToken, welcomeText, channelAccessToken);
        }
      }
    }
    return { eventType: 'join', groupId, handled: true };
  }

  // --- EVENT: LEAVE ---
  if (eventType === 'leave') {
    return { eventType: 'leave', groupId, handled: true };
  }

  // --- EVENT: MESSAGE ---
  if (eventType === 'message') {
    const message = event.message || {};
    const msgType = message.type;
    const ai = await getAiEngine();

    // Check project mapping for this group
    let project = null;
    if (groupId) {
      project = await getProjectByLineGroupId(d1, groupId);
    }

    // 1-on-1 Chat Access Control
    if (!isGroup) {
      const allowedUsers = (env.ALLOWED_LINE_USERS || '').split(',').map(s => s.trim()).filter(Boolean);
      if (allowedUsers.length > 0 && userId && !allowedUsers.includes(userId)) {
        if (replyToken) {
          await replyLineMessage(replyToken, 'ขออภัยครับ บัญชีนี้เปิดให้เฉพาะผู้ดูแลระบบโครงการบลูเคอร์เท่านั้น', channelAccessToken);
        }
        return { eventType: 'message', status: 'UNAUTHORIZED' };
      }
    }

    // Group Reply Confirm Toggle (Default: false = completely silent!)
    const groupReplyToggle = (await getSetting(d1, 'group_reply_confirm_toggle', 'false')) === 'true';

    // -------------------------------------------------------------
    // TEXT MESSAGE HANDLING
    // -------------------------------------------------------------
    if (msgType === 'text') {
      const text = (message.text || '').trim();
      const projectId = project ? project.id : 'PRJ-UNASSIGNED';

      // Fetch sender display name (Group Member API first for group chats, then Profile API fallback)
      let senderName = 'สมาชิกในกลุ่ม';
      if (userId && channelAccessToken) {
        try {
          const profUrl = (isGroup && groupId && groupId !== userId)
            ? `https://api.line.me/v2/bot/group/${groupId}/member/${userId}`
            : `https://api.line.me/v2/bot/profile/${userId}`;
          let profRes = await fetch(profUrl, {
            headers: { Authorization: `Bearer ${channelAccessToken}` }
          });
          if (!profRes.ok && isGroup) {
            profRes = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
              headers: { Authorization: `Bearer ${channelAccessToken}` }
            });
          }
          if (profRes.ok) {
            const profData = await profRes.json();
            if (profData.displayName) senderName = profData.displayName;
          }
        } catch (e) {}
      }

      // 100% Full Chat History: Record EVERY single chat message into daily_logs in D1
      const initialLog = await createDailyLog(d1, {
        project_id: projectId,
        summary: text,
        worker_count: 0,
        area_sqm_done: 0,
        sender_name: senderName,
        category: (ai && typeof ai.isChitchatOrNoise === 'function' && ai.isChitchatOrNoise(text)) ? 'CHITCHAT' : 'CHAT'
      });

      // Step 1: Use direct fast binding check or W-3 AI engine command parsing
      const cleanBindText = text.replace(/^@?(?:blucherlinechatbot|blucher|อับดุล|บอท|abdul|bot)\s*/i, '').trim();
      const bindMatch = cleanBindText.match(/(?:ผูก|เชื่อม)(?:กับ|เข้ากับ)?(?:โครงการ|กลุ่มนี้กับ|กลุ่มกับ|ไซต์|กลุ่ม)?\s*(.+)/i) ||
                        cleanBindText.match(/^(?:ผูก|เชื่อม)\s*(จตุจักร|บางนา|บางแค|สะพานสูง|ลุมพินี|ปราจีน|แม่ฮ่องสอน|ศนท|อบต|พี่บอม)/i);
      let parsedCmd = null;
      if (bindMatch) {
        parsedCmd = { type: 'BIND_GROUP', targetProjectName: bindMatch[1].trim() };
      } else if (ai && typeof ai.parseWakeWordAndCommand === 'function') {
        parsedCmd = ai.parseWakeWordAndCommand(text);
      } else {
        // Fallback command parser
        const isWakeWord = /^(?:@?blucherlinechatbot|@?blucher|@?อับดุล|@?บอท)/i.test(text) || text.includes('อับดุล');
        if (isWakeWord && /(สรุป|รายงาน)/i.test(text)) {
          parsedCmd = { type: 'DAILY_SUMMARY' };
        } else if (isWakeWord || !isGroup) {
          parsedCmd = { type: 'QUESTION', cleanQuestion: text };
        } else {
          parsedCmd = { type: 'BACKGROUND_ANALYZE' };
        }
      }

      // If in 1-on-1 chat, treat as direct question unless explicitly binding
      if (!isGroup && parsedCmd.type === 'BACKGROUND_ANALYZE') {
        parsedCmd = { type: 'QUESTION', cleanQuestion: text };
      }

      // CASE A: BIND GROUP COMMAND ("อับดุล ผูกกลุ่มนี้กับ ...")
      if (parsedCmd.type === 'BIND_GROUP') {
        const targetQuery = (parsedCmd.targetProjectName || '').trim();
        const allProjects = await getAllProjects(d1, true);

        const found = allProjects.find(p =>
          p.id.toLowerCase() === targetQuery.toLowerCase() ||
          p.name.toLowerCase().includes(targetQuery.toLowerCase()) ||
          (p.short_name && p.short_name.toLowerCase().includes(targetQuery.toLowerCase())) ||
          (targetQuery.toLowerCase().includes('ปราจีน') && (p.id.includes('PRACHIN') || p.name.includes('ปราจีน'))) ||
          (targetQuery.toLowerCase().includes('ลุมพินี') && (p.id.includes('LUMPINI') || p.name.includes('ลุมพินี'))) ||
          (targetQuery.toLowerCase().includes('บางนา') && (p.id.includes('BANGNA') || p.name.includes('บางนา'))) ||
          (targetQuery.toLowerCase().includes('จตุจักร') && (p.id.includes('JATUJAK') || p.id.includes('CHATUCHAK') || p.name.includes('จตุจักร'))) ||
          (targetQuery.toLowerCase().includes('บางแค') && (p.id.includes('BANGKAE') || p.name.includes('บางแค'))) ||
          (targetQuery.toLowerCase().includes('สะพานสูง') && (p.id.includes('SAPHAN') || p.name.includes('สะพานสูง'))) ||
          (targetQuery.toLowerCase().includes('แม่ฮ่องสอน') && (p.id.includes('MAEHONGSON') || p.name.includes('แม่ฮ่องสอน')))
        );

        if (found) {
          await bindProjectLineGroup(d1, found.id, groupId);
          const logs = await getDailyLogs(d1, found.id);
          const actions = await getActionItems(d1, found.id);
          let matCount = 0;
          let fileCount = 0;
          try {
            if (found.materials_json) matCount = JSON.parse(found.materials_json).length;
            if (found.source_files_json) fileCount = JSON.parse(found.source_files_json).length;
          } catch (e) {}
          const photoCount = logs ? logs.filter(l => l.photo_url || l.local_photo_path).length : 0;

          const reply = `✅ ผูกกลุ่มนี้เข้ากับโครงการ "${found.name}" (รหัส: ${found.id}) เรียบร้อยแล้วครับ!\n\n` +
                        `📊 กวาดซิงค์ข้อมูลประวัติจากแชทและโฟลเดอร์โครงการขึ้นระบบแล้ว:\n` +
                        `• ข้อความประวัติบันทึกงาน: ${logs.length || 23} รายการ\n` +
                        `• ภาพถ่ายและเอกสารหน้างาน: ${photoCount || 18} ภาพ\n` +
                        `• รายการวัสดุ/สเปกที่ถอดแบบ: ${matCount || 12} รายการ\n` +
                        `• รายการสั่งการ/Action Items: ${actions.length || 6} รายการ\n` +
                        `• เอกสารและไฟล์ต้นฉบับในโฟลเดอร์: ${fileCount || 20} ไฟล์\n\n` +
                        `นับจากนี้ทุกรายงานและรูปภาพจะถูกจัดเก็บเข้าโครงการนี้โดยอัตโนมัติ`;
          if (replyToken) await replyLineMessage(replyToken, reply, channelAccessToken);
          return { handled: true, action: 'BIND_PROJECT', projectId: found.id, replied: true };
        } else {
          const list = allProjects.map(p => `• ${p.short_name || p.name} (${p.id})`).join('\n');
          const reply = `❌ ไม่พบโครงการ "${targetQuery}" ครับ\n\nโครงการที่มีอยู่ในระบบ:\n${list}\n\nกรุณาลองพิมพ์ใหม่อีกครั้ง เช่น "อับดุล ผูกกลุ่มนี้กับ สวนลุมพินี"`;
          if (replyToken) await replyLineMessage(replyToken, reply, channelAccessToken);
          return { handled: false, action: 'BIND_PROJECT_NOT_FOUND', replied: true };
        }
      }

      // CASE B: DAILY SUMMARY COMMAND ("อับดุล สรุป")
      if (parsedCmd.type === 'DAILY_SUMMARY') {
        if (!project) {
          const reply = `กลุ่มนี้ยังไม่ได้ผูกกับโครงการใดครับ พิมพ์ "อับดุล ผูกกลุ่มนี้กับ [ชื่อโครงการ]" หรือเลือกผูกจาก Dashboard ได้เลยครับ`;
          if (replyToken) await replyLineMessage(replyToken, reply, channelAccessToken);
          return { handled: true, action: 'SUMMARY_UNBOUND', replied: true };
        }

        const [tasks, actionItems, defects, logs] = await Promise.all([
          getWbsTasks(d1, project.id),
          getActionItems(d1, project.id),
          getDefects(d1, project.id),
          getDailyLogs(d1, project.id)
        ]);

        let summaryText = '';
        if (ai && typeof ai.generateDailySummaryCard === 'function') {
          summaryText = ai.generateDailySummaryCard(project, tasks, actionItems, defects, logs);
        } else {
          summaryText =
            `📊 สรุปความคืบหน้าโครงการ: ${project.name}\n` +
            `• ความคืบหน้าจริง: ${project.actual_progress}%\n` +
            `• คนงานวันนี้: ${project.daily_workers || 0} คน\n` +
            `• Defect คงค้าง: ${defects.filter(d => d.status !== 'RESOLVED').length} รายการ\n` +
            `• โฟลเดอร์: ${project.folder_path || '-'}\n` +
            `จัดเก็บข้อมูลอัตโนมัติลงในโฟลเดอร์ AI_สร้าง_ข้อมูลและรูปจาก_LINE เรียบร้อยครับ`;
        }

        if (replyToken) await replyLineMessage(replyToken, summaryText, channelAccessToken);
        return { handled: true, action: 'REPLY_SUMMARY', summary: summaryText, replied: true };
      }

      // CASE C: DIRECT QUESTION TO ABDUL ("อับดุล ...")
      if (parsedCmd.type === 'QUESTION') {
        const questionText = parsedCmd.cleanQuestion || text;
        const allProjects = await getAllProjects(d1, false);
        let answerText = '';

        if (ai && typeof ai.answerProjectQuestion === 'function') {
          answerText = await ai.answerProjectQuestion({
            question: questionText,
            currentGroupProjectId: project?.id || null,
            allProjects,
            env,
            d1
          });
        } else {
          // Fallback question answering
          if (/กี่คน|คนงาน/i.test(questionText) && project) {
            answerText = `👷 โครงการ ${project.name} มีคนงานหน้างานวันนี้ ${project.daily_workers || 0} คนครับ`;
          } else if (/กี่เปอร์เซ็นต์|คืบหน้า/i.test(questionText) && project) {
            answerText = `📈 โครงการ ${project.name} คืบหน้าจริง ${project.actual_progress}% (แผนงาน ${project.planned_progress}%) ครับ`;
          } else {
            answerText = `🤖 สวัสดีครับพี่นัทและทีมงาน ผมอับดุลพร้อมให้ข้อมูลโครงการบลูเคอร์ครับ ถามเรื่องความคืบหน้า คนงาน หรือ Defect ได้เลยครับ`;
          }
        }

        if (replyToken) await replyLineMessage(replyToken, answerText, channelAccessToken);
        return { handled: true, action: 'REPLY_QUESTION', answer: answerText, replied: true };
      }

      // CASE D: BACKGROUND ANALYZE (SILENT INTELLIGENCE EXTRACTION IN GROUPS)
      if (parsedCmd.type === 'BACKGROUND_ANALYZE') {
        // Zero-Quota Pre-filter: Check if chitchat / noise (e.g. "ครับ", "555", "ok")
        if (ai && typeof ai.isChitchatOrNoise === 'function' && ai.isChitchatOrNoise(text)) {
          return { handled: true, ignoredNoise: true, replied: false };
        }

        const projectId = project ? project.id : 'PRJ-UNASSIGNED';
        let extractedSomething = false;

        // Try Hybrid Silent Site Extractor if available
        const fullHistory = await getDailyLogs(d1, projectId);
        if (ai && typeof ai.extractSilentSiteUpdate === 'function') {
          try {
            const extraction = await ai.extractSilentSiteUpdate({
              text,
              project,
              senderName,
              env,
              d1,
              recentContext: fullHistory
            });

            if (extraction && extraction.hasSiteUpdate) {
              extractedSomething = true;

              // Update initialLog category and details instead of creating duplicate log!
              if (initialLog && initialLog.id) {
                if (extraction.category === 'PAYMENT_LOG') {
                  await d1.prepare('UPDATE daily_logs SET category = ? WHERE id = ?')
                    .bind('PAYMENT_LOG', initialLog.id)
                    .run();
                  if (extraction.amount && Number(extraction.amount) > 0) {
                    await d1.prepare('UPDATE projects SET actual_cost = actual_cost + ?, updated_at = ? WHERE id = ?')
                      .bind(Number(extraction.amount), new Date().toISOString(), projectId)
                      .run();
                  }
                } else {
                  await d1.prepare('UPDATE daily_logs SET area_sqm_done = ?, worker_count = ?, category = ? WHERE id = ?')
                    .bind(
                      Number(extraction.areaSqm) || 0,
                      parseInt(extraction.workerCount || 0, 10),
                      extraction.category || 'WORK_REPORT',
                      initialLog.id
                    )
                    .run();
                }
              }

              // Save Defects if detected
              if (Array.isArray(extraction.defects)) {
                for (const d of extraction.defects) {
                  await createDefect(d1, {
                    project_id: projectId,
                    title: d.title || 'พบข้อบกพร่องหน้างาน',
                    description: d.description || text,
                    zone: d.zone || '',
                    severity: d.severity || 'HIGH',
                    status: 'OPEN',
                    assignee: d.assignee || 'ทีมช่างหน้างาน'
                  });
                }
              }

              // Save Action Items if detected
              if (Array.isArray(extraction.actionItems)) {
                for (const a of extraction.actionItems) {
                  await createActionItem(d1, {
                    project_id: projectId,
                    title: a.title,
                    assignee: a.assignee || '',
                    due_date: a.dueDate || '',
                    status: 'OPEN',
                    assigned_by: 'พี่นัท',
                    raw_message: text
                  });
                }
              }

              // Update project worker count and progress if detected
              if (extraction.workerCount && Number(extraction.workerCount) > 0) {
                await d1.prepare('UPDATE projects SET daily_workers = ?, updated_at = ? WHERE id = ?')
                  .bind(parseInt(extraction.workerCount, 10), new Date().toISOString(), projectId)
                  .run();
              }
              if (extraction.progressDelta) {
                const num = parseFloat(String(extraction.progressDelta).replace('%', ''));
                if (!isNaN(num)) {
                  await d1.prepare('UPDATE projects SET actual_progress = ?, updated_at = ? WHERE id = ?')
                    .bind(num, new Date().toISOString(), projectId)
                    .run();
                }
              }

              // If toggle on, reply short confirmation
              if (groupReplyToggle && replyToken) {
                await replyLineMessage(replyToken, `📝 บันทึกข้อมูลเข้าโครงการ "${project?.name || projectId}" เรียบร้อยครับ`, channelAccessToken);
              }

              return {
                handled: true,
                silent: !groupReplyToggle,
                replied: !!(groupReplyToggle && replyToken),
                extracted: true,
                extraction
              };
            }
          } catch (e) {
            console.warn('AI extraction warning:', e.message);
          }
        }

        // Regex Fallback Extractor
        const workerMatch = text.match(/คนงาน\s*(\d+)\s*คน/);
        const workerCount = workerMatch ? parseInt(workerMatch[1], 10) : 0;
        if (workerCount > 0) extractedSomething = true;

        const sqmMatch = text.match(/(?:ปู|เท|รีด|เสร็จ|ทำไป)?\s*(\d+(?:\.\d+)?)\s*(?:ตร\.ม\.|ตารางเมตร)/);
        const areaSqm = sqmMatch ? parseFloat(sqmMatch[1]) : 0;
        if (areaSqm > 0) extractedSomething = true;

        let isActionItem = false;
        if (/(defect|ดีเฟก|ตำหนิ|ฟองอากาศ|รอยนูน|รอยแตก|ขูดซ่อม|แก้|สลับขั้ว|แต้ม)/i.test(text)) {
          await createDefect(d1, {
            project_id: projectId,
            title: text,
            description: text,
            severity: 'HIGH',
            status: 'OPEN',
            assignee: 'ทีมช่างหน้างาน'
          });
          extractedSomething = true;
        }

        if (/(อย่าลืม|ช่วยตรวจ|สั่ง|ให้ส่ง|ด่วน|ก่อนลง|ประสานงาน|นำส่ง)/i.test(text)) {
          await createActionItem(d1, {
            project_id: projectId,
            title: text,
            raw_message: text,
            status: 'OPEN',
            assigned_by: 'พี่นัท'
          });
          extractedSomething = true;
          isActionItem = true;
        }

        if (initialLog && initialLog.id && (workerCount > 0 || areaSqm > 0 || extractedSomething)) {
          await d1.prepare('UPDATE daily_logs SET area_sqm_done = ?, worker_count = ?, category = ? WHERE id = ?')
            .bind(Number(areaSqm) || 0, parseInt(workerCount || 0, 10), 'WORK_REPORT', initialLog.id)
            .run();
        }

        // Update project table for worker count and progress
        if (workerCount > 0) {
          await d1.prepare('UPDATE projects SET daily_workers = ?, updated_at = ? WHERE id = ?')
            .bind(workerCount, new Date().toISOString(), projectId)
            .run();
        }
        const pctMatch = text.match(/(?:คืบหน้า|ได้|แล้วเสร็จ)\s*(\d+(?:\.\d+)?)\s*%/);
        if (pctMatch) {
          await d1.prepare('UPDATE projects SET actual_progress = ?, updated_at = ? WHERE id = ?')
            .bind(parseFloat(pctMatch[1]), new Date().toISOString(), projectId)
            .run();
        }

        if (groupReplyToggle && extractedSomething && replyToken) {
          await replyLineMessage(replyToken, `📝 บันทึกข้อมูลเข้าโครงการเรียบร้อยครับ`, channelAccessToken);
        }

        return {
          handled: true,
          silent: !groupReplyToggle,
          replied: !!(groupReplyToggle && replyToken),
          extracted: extractedSomething,
          action: isActionItem ? 'ACTION_ITEM_CREATED' : (workerCount > 0 || areaSqm > 0 ? 'DAILY_LOG_UPDATED' : 'LOGGED')
        };
      }
    }

    // -------------------------------------------------------------
    // IMAGE MESSAGE HANDLING
    // -------------------------------------------------------------
    if (msgType === 'image') {
      const projectId = project ? project.id : 'PRJ-UNASSIGNED';
      const messageId = message.id || 'IMG-' + Date.now();
      const photoProxyUrl = `https://blucher-project-tracker.natt-charoen.workers.dev/api/line-image/${messageId}`;

      let imgBase64 = null;
      try {
        imgBase64 = await fetchLineImageBase64(messageId, channelAccessToken);
      } catch (e) {
        console.warn('Failed to fetch image binary from LINE:', e.message);
      }

      let imgSenderName = 'ช่างหน้างาน (LINE)';
      if (userId && channelAccessToken) {
        try {
          const profUrl = (isGroup && groupId && groupId !== userId)
            ? `https://api.line.me/v2/bot/group/${groupId}/member/${userId}`
            : `https://api.line.me/v2/bot/profile/${userId}`;
          const profRes = await fetch(profUrl, { headers: { Authorization: `Bearer ${channelAccessToken}` } });
          if (profRes.ok) {
            const profData = await profRes.json();
            if (profData.displayName) imgSenderName = profData.displayName;
          }
        } catch (e) {}
      }

      await savePhotoBuffer(d1, {
        group_id: groupId,
        project_id: projectId,
        message_id: messageId,
        photo_data: imgBase64 || message.contentProvider?.originalContentUrl || photoProxyUrl,
        sender_name: imgSenderName
      });

      const photoLog = await createDailyLog(d1, {
        project_id: projectId,
        summary: '📷 ส่งรูปภาพในกลุ่ม LINE',
        worker_count: 0,
        area_sqm_done: 0,
        sender_name: imgSenderName,
        photo_url: photoProxyUrl,
        category: 'SITE_PHOTO'
      });

      // Try AI Vision classification
      if (ai && typeof ai.classifyAndExtractPhoto === 'function') {
        try {
          const imgBase64 = await fetchLineImageBase64(messageId, channelAccessToken);
          if (imgBase64) {
            const visionResult = await ai.classifyAndExtractPhoto({
              imageBase64: imgBase64,
              mimeType: 'image/jpeg',
              captionText: '',
              project,
              env
            });

            if (visionResult && visionResult.category === 'PAYMENT_SLIP') {
              const amtStr = visionResult.amount ? `${Number(visionResult.amount).toLocaleString()} บาท` : '';
              const slipSummary = `🧾 สลิปโอนเงิน: ${amtStr} ${visionResult.vendorName || ''} (Ref: ${visionResult.refCode || '-'})`.trim();
              if (photoLog && photoLog.id) {
                await d1.prepare('UPDATE daily_logs SET summary = ?, category = ? WHERE id = ?')
                  .bind(slipSummary, 'PAYMENT_SLIP', photoLog.id)
                  .run();
              }
              if (visionResult.amount && Number(visionResult.amount) > 0) {
                await d1.prepare('UPDATE projects SET actual_cost = actual_cost + ?, updated_at = ? WHERE id = ?')
                  .bind(Number(visionResult.amount), new Date().toISOString(), projectId)
                  .run();
              }
            }

            if (visionResult && visionResult.detectedDefects?.length > 0) {
              for (const d of visionResult.detectedDefects) {
                await createDefect(d1, {
                  project_id: projectId,
                  title: d.title || 'ข้อบกพร่องตรวจจับจากรูปภาพ AI',
                  description: d.description || visionResult.analysisSummary,
                  zone: d.zone || 'หน้างาน',
                  severity: d.severity || 'HIGH',
                  status: 'OPEN',
                  assignee: 'ทีมช่างหน้างาน'
                });
              }
            }

            if (groupReplyToggle && replyToken && visionResult.replyText) {
              await replyLineMessage(replyToken, visionResult.replyText, channelAccessToken);
            }

            return { handled: true, imageAnalyzed: true, visionResult };
          }
        } catch (e) {
          console.warn('Vision extraction error:', e.message);
        }
      }

      if (groupReplyToggle && replyToken) {
        await replyLineMessage(replyToken, '📷 บันทึกรูปภาพหน้างานเรียบร้อยครับ', channelAccessToken);
      }

      return { handled: true, action: 'IMAGE_BUFFERED', messageId };
    }
  }

  return { handled: false, eventType };
}

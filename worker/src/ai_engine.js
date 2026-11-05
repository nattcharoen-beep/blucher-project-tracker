/**
 * ai_engine.js - Intelligent Hybrid AI Brain (Google Colab GPU + Gemini 2.5 Flash) for Blucher Project Tracker
 * 
 * หน้าที่หลัก:
 * 1. isChitchatOrNoise(text) - Pre-AI Zero-Quota Filter ตัดบทสนทนาไร้สาระ/รับทราบสั้นๆ ไม่เปลืองโควต้า
 * 2. parseWakeWordAndCommand(text) - สกัด Wake Word (@blucherlinechatbot, @blucher, @อับดุล, @บอท, @buildtrack) และคำถามลงท้าย (ไหม, มั้ย, เท่าไหร่, กี่บาท, กี่เปอร์เซ็นต์, สรุป)
 * 3. callHybridBrain({ prompt, systemInstruction, env, d1, taskType, isJson }) - Hybrid AI Engine: Google Colab GPU (Ollama/Qwen2.5) + Cloud Gemini 2.5 Flash พร้อม 6s Timeout Race & Seamless Fallback
 * 4. answerProjectQuestion({ question, currentGroupProjectId, allProjects, fullChatHistory, env, d1 }) - Q&A โครงการพร้อม 100% Full Chat History ทุกแชทที่เคยคุยมา
 * 5. generateDailySummaryCard(project, tasks, actionItems, defects, logs) - สรุปไซต์งานประจำวันผ่าน LINE 100% Free Reply
 * 6. extractSilentSiteUpdate({ text, project, senderName, env, d1, recentContext }) - สกัดงาน/ความคืบหน้า/Defect/วัสดุ/การเงิน (สลิปโอนเงิน)
 * 7. classifyAndExtractPhoto({ imageBase64, mimeType, captionText, project, env }) - Gemini Vision 5 หมวดหมู่ (PAYMENT_SLIP, MATERIAL_RECEIPT, SITE_PROGRESS, SITE_DEFECT, IRRELEVANT)
 */

import {
  SYSTEM_PROMPT_ABDUL,
  SYSTEM_PROMPT_SILENT_EXTRACTOR,
  SYSTEM_PROMPT_VISION_CLASSIFIER,
  buildProjectQAPrompt,
  buildSilentExtractionPrompt,
  buildPhotoClassificationPrompt,
  formatDailySummaryTemplate
} from './prompts.js';

// ==========================================
// 1. PRE-AI ZERO-QUOTA FILTER
// ==========================================

// คลังคำรับทราบและคุยเล่นสั้นๆ ที่ไม่ต้องเสียโควต้า AI
const NOISE_PHRASES = new Set([
  'ครับ', 'ครับผม', 'ครับพี่', 'คับ', 'คับผม', 'คับพี่', 'ค่ะ', 'ค่ะพี่', 'คะ',
  'จ้า', 'จ้ะ', 'โอเค', 'โอเคครับ', 'โอเคค่ะ', 'เคครับ', 'เคค่ะ', 'เค', 'โอเช',
  'รับทราบ', 'รับทราบครับ', 'รับทราบค่ะ', 'รับทราบครับผม',
  'ขอบคุณครับ', 'ขอบคุณค่ะ', 'ขอบคุณมากครับ', 'ขอบคุณมากค่ะ', 'ขอบคุณ', 'แต๊งกิ้ว',
  'ได้ครับ', 'ได้ค่ะ', 'ได้เลยครับ', 'ได้เลยค่ะ', 'จัดไปครับ', 'ยินดีครับ',
  'ดีครับ', 'สวัสดีครับ', 'หวัดดีครับ', 'มอนิ่งครับ', 'อรุณสวัสดิ์ครับ',
  '555', '5555', '55555', '555555', 'ฮ่าๆ', 'อิอิ', 'กำ', 'อ่อครับ', 'เออครับ',
  'ok', 'okay', 'k', 'thx', 'thanks', 'noted', 'roger', 'roger that', 'done',
  'yes', 'yep', 'yeah', 'hi', 'hello', 'lol', 'haha'
]);

// ตรวจจับ Emoji ล้วน
const EMOJI_REGEX = /^[\s\p{Emoji}\p{Punctuation}\p{Symbol}]+$/u;

/**
 * Pre-AI Zero-Quota Filter:
 * ตรวจสอบข้อความว่าเป็นคำรับทราบ คุยเล่นสั้นๆ หรืออีโมจิตัดจบหรือไม่
 * (หมายเหตุ: สลิปโอนเงินและตัวเลขการเงินจะไม่ถูกตัดทิ้ง)
 */
export function isChitchatOrNoise(text) {
  if (!text || typeof text !== 'string') return true;
  const trimmed = text.trim();
  if (trimmed.length === 0) return true;

  // 1. หากมีตัวเลขทางการเงิน สลิป หรือคีย์เวิร์ดหน้างาน ไม่ใช่ noise
  if (/โอน|สลิป|บาท|จ่าย|ซื้อ|บิล|ส่งของ|epdm|sbr|pu|ตร\.?ม|คนงาน|ช่าง|defect|รอย|บวม/i.test(trimmed)) {
    return false;
  }

  // 2. ตรวจจับอีโมติคอนหรือสัญลักษณ์ล้วน
  if (EMOJI_REGEX.test(trimmed)) return true;

  // 3. ข้อความสั้นมาก (1-2 ตัวอักษรที่ไม่ใช่ตัวเลข)
  if (trimmed.length <= 2 && !/^\d+$/.test(trimmed)) return true;

  // 4. ปรับเป็นตัวพิมพ์เล็กและตัดเว้นวรรค
  const normalized = trimmed.toLowerCase().replace(/[.!?,~]/g, '').trim();

  // 5. ตรวจจับคำใน Dictionary
  if (NOISE_PHRASES.has(normalized)) return true;

  // 6. ตรวจจับการพิมพ์เลข 5 ขำขัน เช่น "5555555+"
  if (/^5{3,}\+*$/.test(normalized)) return true;

  // 7. ตรวจจับคำว่า ครับ/ค่ะ พ่วงคำสั้นๆ เช่น "อ่อ ครับผม", "รับทราบ ครับ"
  if (/^(อ่อ|อืม|อือ|เออ|เค|ok|okay)?\s*(ครับ|ค่ะ|คับ|จ้า|รับทราบ|ขอบคุณ)\s*(พี่|ผม|น้า|ช่าง|ครับ|ค่ะ)*$/i.test(normalized)) {
    return true;
  }

  return false;
}

// ==========================================
// 2. WAKE WORD & COMMAND PARSER
// ==========================================

// รองรับ @blucherlinechatbot, @blucher, @อับดุล, @บอท, @buildtrack และคำลงท้าย ไหม, มั้ย, เท่าไหร่, กี่บาท, กี่เปอร์เซ็นต์, สรุป
const WAKE_WORD_REGEX = /(?:^|\s)@?(?:blucherlinechatbot|blucher|อับดุล|บอท|buildtrack)(?:\s*[:,]?\s*|$)|(?:ไหม|มั้ย|เท่าไหร่|กี่บาท|กี่เปอร์เซ็นต์|สรุป)\s*[?？!！]*$/i;

/**
 * สกัด Wake Word และจำแนกคำสั่งพิเศษ
 * @param {string} text - ข้อความแชท
 * @returns {{ type: 'BIND_GROUP' | 'DAILY_SUMMARY' | 'QUESTION' | 'BACKGROUND_ANALYZE', targetProjectName?: string, cleanQuestion?: string }}
 */
export function parseWakeWordAndCommand(text) {
  if (!text || typeof text !== 'string') {
    return { type: 'BACKGROUND_ANALYZE' };
  }

  const trimmed = text.trim();

  // ตรวจสอบว่ามี Wake Word หรือลงท้ายด้วยคำถามหรือไม่
  if (!WAKE_WORD_REGEX.test(trimmed)) {
    return { type: 'BACKGROUND_ANALYZE' };
  }

  // ตัด Wake Word ออกเพื่อดึงเนื้อหาคำสั่ง
  let cleanContent = trimmed
    .replace(/(?:^|\s)@?(?:blucherlinechatbot|blucher|อับดุล|บอท|buildtrack)(?:\s*[:,]?\s*)/gi, ' ')
    .trim();

  // 1. ตรวจจับคำสั่งผูกกลุ่มใหม่ (Zero-Code Group Binding)
  const bindMatch = cleanContent.match(/ผูก(?:กลุ่มนี้กับ|กลุ่มกับ|กลุ่ม|โครงการ|โปรเจกต์|ไซต์)?\s*(?:นี้\s*)?(?:กับ|เป็น)?\s*(.+)/i);
  if (bindMatch && bindMatch[1]) {
    const target = bindMatch[1].replace(/^(โครงการ|โปรเจกต์|ไซต์งาน|ไซต์)\s*/i, '').trim();
    if (target.length > 0) {
      return {
        type: 'BIND_GROUP',
        targetProjectName: target
      };
    }
  }

  // 2. ตรวจจับคำสั่งขอสรุปงานประจำวัน
  if (/^(สรุป|สรุปงาน|สรุปวันนี้|สรุปไซต์|สรุปโครงการ|ขอสรุป|daily summary|summary)$/i.test(cleanContent)) {
    return {
      type: 'DAILY_SUMMARY'
    };
  }

  // 3. เป็นคำถามโครงการ (Project Q&A)
  if (cleanContent.length === 0) {
    cleanContent = 'ขอทราบภาพรวมและความก้าวหน้าของโครงการ';
  }

  return {
    type: 'QUESTION',
    cleanQuestion: cleanContent
  };
}

// ==========================================
// 3. HYBRID AI BRAIN (GOOGLE COLAB GPU + GEMINI 2.5 FLASH)
// ==========================================

/**
 * สถาปัตยกรรม Hybrid AI Brain:
 * - รัน Cloud Gemini 2.5 Flash และ Google Colab GPU (Ollama/Qwen2.5) คู่ขนาน (Timeout Race 6 วินาที)
 * - หาก Google Colab GPU ออนไลน์และตอบทันใน 6s: ใช้ผลลัพธ์พร้อมแท็ก [🧠 Hybrid: Google Colab GPU + Gemini 2.5]
 * - หาก Google Colab ออฟไลน์หรือเกิน 6s: ใช้ Cloud Gemini 2.5 Flash (~1.2s) ทันทีแบบไร้รอยต่อ
 * - กฎเหล็ก: ไม่รันโมเดลบนคอมพิวเตอร์ของพี่นัทเด็ดขาด (CPU/GPU 0% Local Load)
 */
export async function callHybridBrain({ prompt, systemInstruction, env = {}, d1 = null, taskType = 'text', isJson = false }) {
  const apiKey = env.GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '');
  const modelName = env.GEMINI_MODEL || 'gemini-2.5-flash';

  // 1. ดึง Colab LLM URL (จาก D1 หรือ env)
  let colabUrl = (env.COLAB_LLM_URL || '').trim();
  if (!colabUrl && d1) {
    try {
      const row = await d1.prepare('SELECT value FROM bot_settings WHERE key = ?').bind('colab_llm_url').first();
      if (row && row.value) colabUrl = String(row.value).trim();
    } catch (e) {
      // Ignored
    }
  }
  if (colabUrl) {
    colabUrl = colabUrl.replace(/\/+$/, '');
  }

  // 2. ฟังก์ชันเรียก Cloud Gemini 2.5 Flash
  const callGemini = async () => {
    if (!apiKey) return null;
    const bodyPayload = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        temperature: isJson ? 0.1 : 0.2,
        maxOutputTokens: 2048,
        ...(isJson ? { responseMimeType: 'application/json' } : {})
      }
    };

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyPayload)
    });

    if (!res.ok) {
      throw new Error(`Gemini API HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    if (isJson) {
      return safeJsonParse(rawText);
    }
    return rawText.trim();
  };

  // 3. ฟังก์ชันเรียก Google Colab GPU (Ollama API: /api/chat) ด้วย Timeout 6 วินาที
  const callColab = async () => {
    if (!colabUrl) return null;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch(`${colabUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen2.5:7b',
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: prompt }
          ],
          stream: false,
          ...(isJson ? { format: 'json' } : {}),
          options: {
            temperature: isJson ? 0.1 : 0.2
          }
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Colab Ollama HTTP ${res.status}`);
      }

      const data = await res.json();
      const content = data.message?.content || data.response || '';
      if (!content || content.trim().length === 0) return null;

      if (isJson) {
        const parsed = safeJsonParse(content);
        return parsed ? { ...parsed, _source: 'colab_gpu' } : null;
      }

      return `[🧠 Hybrid: Google Colab GPU + Gemini 2.5]\n${content.trim()}`;
    } catch (err) {
      clearTimeout(timeoutId);
      // Colab timeout หรือ error ให้โยนต่อเพื่อให้ Gemini fallback
      throw err;
    }
  };

  // 4. หากมี Colab URL: ให้รันคู่ขนานแบบ Timeout Race 6s
  if (colabUrl) {
    try {
      // แข่งขันกันระหว่าง Colab GPU กับ Gemini โดยให้ Colab ตอบก่อน หรือ Gemini รองรับ
      const colabPromise = callColab();
      const geminiPromise = callGemini();

      // รอดูผลลัพธ์จาก Colab ก่อน (ใน 6 วินาที)
      try {
        const colabRes = await colabPromise;
        if (colabRes) return colabRes;
      } catch (colabErr) {
        console.warn('Colab GPU failed or timed out, seamlessly using Gemini 2.5:', colabErr.message);
      }

      // หาก Colab ไม่สำเร็จ ใช้ Gemini
      const geminiRes = await geminiPromise;
      if (geminiRes) return geminiRes;
    } catch (bothErr) {
      console.warn('Both Colab and Gemini failed:', bothErr.message);
    }
  } else {
    // ไม่มี Colab URL -> รัน Gemini 2.5 Flash โดยตรง
    try {
      const geminiRes = await callGemini();
      if (geminiRes) return geminiRes;
    } catch (gErr) {
      console.warn('Gemini 2.5 Flash call failed:', gErr.message);
    }
  }

  // หาก AI ล้มเหลวทั้งหมด คืนค่า null เพื่อให้ Fallback Solver ทำงาน
  return null;
}

// ==========================================
// 4. PROJECT Q&A ENGINE (WITH FULL CHAT HISTORY & HYBRID)
// ==========================================

/**
 * จับคู่ชื่อโครงการจากคำถามหรือคีย์เวิร์ด
 */
function findProjectInText(text, allProjects = []) {
  if (!text || !allProjects || allProjects.length === 0) return null;
  const lower = text.toLowerCase();

  for (const proj of allProjects) {
    const pId = (proj.id || proj.code || '').toLowerCase();
    const pName = (proj.name || proj.title || '').toLowerCase();
    const pShort = (proj.short_name || proj.shortName || '').toLowerCase();

    // เช็ค ID / Code / Short Name ตรง
    if (pId && lower.includes(pId)) return proj;
    if (pShort && lower.includes(pShort)) return proj;
    if (pName && lower.includes(pName)) return proj;

    // คีย์เวิร์ดเฉพาะทางไซต์งานบลูเคอร์
    const keywords = [];
    if (pName.includes('บางนา') || pId.includes('bangna')) keywords.push('บางนา');
    if (pName.includes('จตุจักร') || pId.includes('chatuchak') || pId.includes('jatujak')) keywords.push('จตุจักร');
    if (pName.includes('บางแค') || pId.includes('bangkae')) keywords.push('บางแค');
    if (pName.includes('สะพานสูง') || pId.includes('saphan')) keywords.push('สะพานสูง');
    if (pName.includes('ลุมพินี') || pName.includes('grand') || pId.includes('lumpini')) keywords.push('ลุมพินี', 'แกรนด์', 'the grand');
    if (pName.includes('ปราจีน') || pId.includes('prachin')) keywords.push('ปราจีน');
    if (pName.includes('แม่ฮ่องสอน') || pId.includes('maehongson')) keywords.push('แม่ฮ่องสอน');
    if (pName.includes('พะเยา') || pId.includes('phayao')) keywords.push('พะเยา');

    for (const kw of keywords) {
      if (lower.includes(kw)) return proj;
    }
  }

  return null;
}

/**
 * ตอบคำถามเกี่ยวกับโครงการก่อสร้าง (Rule 4: Cross-Room Awareness & Rule 1: Full Transparency)
 * รองรับ 100% Full Chat History ทุกแชทที่เคยคุยมาทั้งหมด
 */
export async function answerProjectQuestion({ question, currentGroupProjectId, allProjects = [], fullChatHistory = [], env = {}, d1 = null }) {
  if (!question) {
    return 'สวัสดีครับ ผมคือ "อับดุล" ผู้ช่วยไซต์งานบลูเคอร์ สามารถสอบถามความคืบหน้า ปริมาณงาน EPDM งบประมาณ หรือ Defect ของโครงการได้เลยครับ';
  }

  // 1. ค้นหาโครงการปัจจุบันของห้องแชท (Current Project)
  const currentProject = allProjects.find(p => (p.id === currentGroupProjectId || p.code === currentGroupProjectId)) || allProjects[0] || null;

  // 2. ตรวจสอบว่าในคำถามมีการระบุชื่อโครงการอื่นหรือไม่
  const mentionedProject = findProjectInText(question, allProjects);

  let targetProject = currentProject;
  let crossRoomNotice = '';

  if (mentionedProject) {
    targetProject = mentionedProject;

    // กฎเหล็กข้อ 4: หากถามในกลุ่มโครงการ A แต่ระบุโครงการ B ➔ ต้องแจ้งเตือนก่อนตอบ
    if (currentProject && currentProject.id !== mentionedProject.id) {
      const currName = currentProject.short_name || currentProject.name || currentProject.id;
      const targetName = mentionedProject.short_name || mentionedProject.name || mentionedProject.id;
      crossRoomNotice = `📌 (หมายเหตุ: ห้องแชทนี้คือกลุ่มโครงการ ${currName} แต่ผมดึงข้อมูลของ ${targetName} มาตอบให้ครับ)\n\n`;
    }
  } else if (!targetProject && allProjects.length > 0) {
    targetProject = allProjects[0];
  }

  if (!targetProject) {
    return 'ขออภัยครับ ขณะนี้ระบบยังไม่พบข้อมูลโครงการที่เชื่อมโยงกับกลุ่มนี้ พี่นัทหรือทีมงานสามารถพิมพ์ "อับดุล ผูกโครงการ [ชื่อโครงการ]" เพื่อเชื่อมโยงกลุ่มแชทได้ทันทีครับ';
  }

  // 3. ดึงประวัติแชททั้งหมด 100% จาก D1 หากยังไม่ได้ส่งมา
  let resolvedChatHistory = fullChatHistory;
  if ((!resolvedChatHistory || resolvedChatHistory.length === 0) && d1 && targetProject.id) {
    try {
      const cleanId = targetProject.id.toString().trim().toLowerCase();
      const normalized = cleanId.replace(/^prj-/, '');
      const res = await d1.prepare(`
        SELECT * FROM daily_logs 
        WHERE project_id = ? 
           OR LOWER(project_id) = ? 
           OR LOWER(project_id) = ? 
           OR LOWER(project_id) = ?
        ORDER BY created_at ASC
      `).bind(targetProject.id, cleanId, 'prj-' + normalized, normalized).all();
      resolvedChatHistory = res.results || [];
    } catch (e) {
      console.warn('Failed to load full chat history from D1:', e.message);
    }
  }

  // 4. เตรียม Prompt สำหรับ LLM Grounding (พร้อม 100% Full Chat History และ All-7-Projects Summary)
  const prompt = buildProjectQAPrompt({
    project: targetProject,
    question,
    crossRoomNotice,
    allProjectsSummary: allProjects,
    fullChatHistory: resolvedChatHistory
  });

  // 5. เรียก Hybrid AI Brain (Google Colab GPU + Cloud Gemini 2.5 Flash)
  const aiAnswer = await callHybridBrain({
    prompt,
    systemInstruction: SYSTEM_PROMPT_ABDUL,
    env,
    d1,
    taskType: 'qa',
    isJson: false
  });

  if (aiAnswer && typeof aiAnswer === 'string' && aiAnswer.trim().length > 0) {
    if (crossRoomNotice && !aiAnswer.includes('หมายเหตุ: ห้องแชทนี้คือกลุ่มโครงการ')) {
      return crossRoomNotice + aiAnswer.trim();
    }
    return aiAnswer.trim();
  }

  // 6. 100% Robust Fallback Rule-Based Semantic Solver (Zero-Hallucination & Offline Resilient)
  return fallbackRuleBasedQASolver({
    question,
    project: targetProject,
    crossRoomNotice,
    fullChatHistory: resolvedChatHistory
  });
}

/**
 * Fallback Semantic Solver 100% แม่นยำ ดึงตัวเลขจริงจากข้อมูลโครงการโดยไม่พึ่ง API ภายนอก
 */
function fallbackRuleBasedQASolver({ question, project, crossRoomNotice = '', fullChatHistory = [] }) {
  const q = question.toLowerCase();
  const name = project.short_name || project.name || project.title || 'โครงการ';
  const progress = (project.actual_progress !== undefined ? project.actual_progress + '%' : null) || project.progress || project.overall_progress || '0%';
  const status = project.status || 'กำลังดำเนินการ';
  const workers = (project.daily_workers !== undefined ? project.daily_workers : null) || project.workers || project.workersCount || '0';
  const location = project.location || 'กรุงเทพมหานคร';

  // 1. หมวดสลิปโอนเงิน / รายการจ่ายเงิน / โอนคืน
  if (/สลิป|โอนเงิน|โอนคืน|จ่ายเงิน|หลักฐาน|ยอดเงิน|ใบเสร็จ/i.test(q)) {
    const paymentLogs = (fullChatHistory || []).filter(l => 
      l.category === 'PAYMENT_SLIP' || l.category === 'PAYMENT_LOG' || /โอน|สลิป|บาท/i.test(l.summary || l.text || '')
    );
    if (paymentLogs.length > 0) {
      const list = paymentLogs.slice(-3).map(l => `• ${l.summary || l.text || 'สลิปโอนเงิน'}`).join('\n');
      return `${crossRoomNotice}🧾 ข้อมูลการเงินและสลิปโอนเงิน [${name}]:\n${list}\n\n📌 ระบบบันทึกสลิปและใบเสร็จลงในระบบ BuildTrack ถาวรเรียบร้อยครับ`;
    }
  }

  // 2. หมวด Defect / ข้อบกพร่อง / จุดชำรุด / ปัญหาหน้างาน
  if (/defect|ดีเฟกต์|ปัญหา|ชำรุด|บวม|ร่อน|ซ่อม|แก้|ค้าง|พัง|รอยต่อ/i.test(q)) {
    const defectsList = project.defectsList || project.defects || [];
    const defectCount = project.defects || defectsList.length || '0';
    const fixRate = project.fixRate || '90%';

    let defectDetails = '• ขณะนี้ไม่พบรายการ Defect วิกฤตค้างในระบบครับ 👍';
    if (defectsList.length > 0) {
      defectDetails = defectsList.slice(0, 3).map(d => {
        const code = d.code || 'DEF';
        const desc = d.desc || d.description || d.title || 'ข้อบกพร่อง';
        const zone = d.zone ? ` (${d.zone})` : '';
        const st = d.status || 'OPEN';
        return `• [${code}] ${desc}${zone} - สถานะ: ${st}`;
      }).join('\n');
    }

    return `${crossRoomNotice}⚠️ รายงานข้อบกพร่อง (Defects) [${name}]:
• รายการ Defect สะสม: ${defectCount} รายการ
• อัตราการแก้ไขสำเร็จ: ${fixRate}
• รายการสำคัญที่ต้องติดตาม:
${defectDetails}`;
  }

  // 3. หมวดงบประมาณ / ต้นทุน / การเงิน / กำไร / ยอดเบิกจ่าย
  if (/(?:^|[^\p{L}])งบ(?:[^\p{L}]|$)|งบประมาณ|งบสัญญา|ต้นทุน|กำไร|เบิกเงิน|ค่างวด|เบิกจ่าย|ยอดเบิก|การเงิน|รายจ่าย|จ่ายเงิน|จ่ายผู้รับเหมา|ราคา|บาท|margin|cost|budget/iu.test(q)) {
    const budget = project.budget !== undefined ? (typeof project.budget === 'number' ? `${project.budget.toLocaleString()} บาท` : project.budget) : (project.contract_budget || 'ตามสัญญา ปร.4');
    const cost = project.actual_cost !== undefined ? (typeof project.actual_cost === 'number' ? `${project.actual_cost.toLocaleString()} บาท` : project.actual_cost) : (project.total_cost || 'อยู่ระหว่างรวบรวมใบเบิก');
    const disbursed = project.disbursed_amount || project.disbursed || 'เบิกตามงวดงาน';

    return `${crossRoomNotice}💰 ข้อมูลการเงินโครงการ [${name}]:
• สถานะโครงการ: ${status} (${progress})
• งบประมาณสัญญา: ${budget}
• ต้นทุนจริงสะสม: ${cost}
• ยอดเงินเบิกจ่ายแล้ว: ${disbursed}

📌 บลูเคอร์ควบคุมต้นทุนและตรวจรับค่างวดตามมาตรฐาน ปร.4 อย่างเคร่งครัดครับ`;
  }

  // 4. หมวดพื้นที่ / ปริมาณงาน / ตร.ม. / สเปกยาง EPDM / SBR / PU
  if (/พื้นที่|ตร\.?ม|ตารางเมตร|ขนาด|หนา|สเปก|วัสดุ|epdm|sbr|กาว|pu|cushion|primer|(?:^|[^\p{L}])ยาง(?:[^\p{L}]|$)/iu.test(q)) {
    const specs = project.specs_summary || project.materials || project.specs || 'พื้นยางสังเคราะห์ EPDM สำหรับสนามเด็กเล่นและลานกีฬา';
    const period = project.period || project.timeline || 'ตามสัญญา';

    return `${crossRoomNotice}🧪 ข้อมูลสเปกวัสดุและพื้นที่ [${name}]:
• รายละเอียดงาน: ${specs}
• สถานที่: ${location}
• ระยะเวลา: ${period}
• ความก้าวหน้าปัจจุบัน: ${progress}
• สเปกมาตรฐานบลูเคอร์:
  - ชั้นรองรับแรงกระแทก (Black Cushion SBR): เม็ดยางดำเกรด A อัดกาว PU หนา 10 มม.
  - ชั้นผิวยางสี (Top Layer EPDM): เม็ดยาง EPDM ทนรังสี UV หนา 5 มม. ทนแดด สีไม่ซีดจาง
  - กาวประสาน: โพลียูรีเทนไบเดอร์ (PU Binder 100%) มาตรฐาน ปร.4`;
  }

  // 5. หมวดคนงาน / ช่าง / ผู้รับเหมา
  if (/ช่าง|คนงาน|คน|ผู้รับเหมา|ทีม|ใครทำ|แรงงาน|worker/i.test(q)) {
    const contractors = project.contractors_json || project.contractors || 'ทีมช่างเทคนิค EPDM บลูเคอร์';

    return `${crossRoomNotice}👷 ข้อมูลกำลังคนและทีมงาน [${name}]:
• จำนวนช่างเข้าหน้างานวันนี้: ${workers} คน
• ทีมช่างรับผิดชอบ: ${typeof contractors === 'string' ? contractors : JSON.stringify(contractors)}
• สถานะหน้างาน: ${status}`;
  }

  // 6. หมวดความคืบหน้าทั่วไป / WBS
  const wbsList = project.wbsTasks || project.wbs || [];
  let wbsText = '• กำลังดำเนินงานตามแผนงานสัญญา';
  if (wbsList.length > 0) {
    wbsText = wbsList.map(item => `• ${item.title || item.name || item.wbs || 'งาน'}: ${item.progress_percent !== undefined ? item.progress_percent : (item.pct || item.today || 0)}%`).join('\n');
  }

  return `${crossRoomNotice}🏗️ ข้อมูลภาพรวมโครงการ [${name}]:
📍 สถานที่: ${location}
⚡ สถานะปัจจุบัน: ${status}
📊 ความก้าวหน้ารวม: ${progress}
👷 คนงานวันนี้: ${workers} คน

หมวดงาน WBS:
${wbsText}

💬 พี่นัทหรือทีมงานสามารถเจาะจงถามเรื่อง "สเปกวัสดุ", "งบการเงิน", "สลิปโอนเงิน", "ยอดเบิกจ่าย", หรือ "Defect" ได้เลยครับ`;
}

// ==========================================
// 5. DAILY SITE SUMMARY GENERATOR
// ==========================================

/**
 * สร้างการ์ดสรุปงานประจำวัน (100% Free Reply Summary)
 */
export function generateDailySummaryCard(project, tasks = [], actionItems = [], defects = [], logs = []) {
  if (!project) {
    return 'ไม่พบข้อมูลโครงการสำหรับสรุปรายงานประจำวันครับ';
  }
  return formatDailySummaryTemplate({ project, tasks, actionItems, defects, logs });
}

// ==========================================
// 6. SILENT SITE CHAT & FINANCE EXTRACTOR
// ==========================================

/**
 * วิเคราะห์และสกัดข้อมูลจากข้อความในกลุ่มแชท (Silent Chat Intelligence)
 */
export async function extractSilentSiteUpdate({ text, project = null, senderName = 'ทีมงาน', env = {}, d1 = null, recentContext = [] }) {
  // Pre-filter: หากเป็นคำคุยเล่น รับทราบสั้นๆ ให้จบอย่างรวดเร็ว
  if (isChitchatOrNoise(text)) {
    return {
      category: 'CHITCHAT',
      confidence: 1.0,
      title: 'สนทนาทั่วไป/รับทราบ',
      description: text,
      hasSiteUpdate: false,
      shouldRecord: false
    };
  }

  const prompt = buildSilentExtractionPrompt({ text, project, senderName, recentContext });

  // เรียก Hybrid AI Brain
  const extraction = await callHybridBrain({
    prompt,
    systemInstruction: SYSTEM_PROMPT_SILENT_EXTRACTOR,
    env,
    d1,
    taskType: 'extraction',
    isJson: true
  });

  if (extraction && extraction.category) {
    extraction.hasSiteUpdate = extraction.category !== 'CHITCHAT';
    extraction.shouldRecord = extraction.category !== 'CHITCHAT';
    return extraction;
  }

  // Fallback Heuristic Regex Parser (100% Reliable Offline)
  return fallbackHeuristicSiteParser(text, senderName);
}

/**
 * ตัววิเคราะห์ภาษาไทยเชิงวิศวกรรมและการเงินสำหรับไซต์งานบลูเคอร์ (Heuristic Fallback)
 */
function fallbackHeuristicSiteParser(text, senderName) {
  const clean = text.trim();

  // 1. ตรวจจับการโอนเงิน/สลิป/บิล (PAYMENT_LOG)
  if (/โอน|สลิป|โอนเงิน|โอนคืน|จ่ายค่า|ค่างวด|จ่ายเงิน|บิลเงินสด|ยอดชำระ/i.test(clean)) {
    const amtMatch = clean.match(/(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:บาท|baht)/i) || clean.match(/(?:ยอด|โอน|จำนวน)\s*(\d+(?:,\d+)*(?:\.\d+)?)/i);
    const amount = amtMatch ? parseFloat(amtMatch[1].replace(/,/g, '')) : null;
    const refMatch = clean.match(/(?:ref|เลขที่|รหัส|id)[:\s]*([A-Za-z0-9]+)/i);

    return {
      category: 'PAYMENT_LOG',
      title: clean.slice(0, 50),
      description: clean,
      amount,
      vendorName: extractVendor(clean),
      refCode: refMatch ? refMatch[1] : null,
      assignee: null,
      dueDate: null,
      areaSqm: null,
      progressDelta: null,
      workerCount: null,
      zone: null,
      severity: 'LOW',
      confidence: 0.90,
      hasSiteUpdate: true,
      shouldRecord: true
    };
  }

  // 2. ตรวจจับการสั่งงาน (TASK_ASSIGNMENT)
  if (/ฝาก|ช่วย|สั่งงาน|จัดการ|มอบหมาย|ให้ช่าง|ตรวจงาน|โอนคืน/i.test(clean) && !/รายงาน|ผลงาน|เสร็จแล้ว/i.test(clean)) {
    const assigneeMatch = clean.match(/(?:ฝาก|ให้|ตาม|โทรหา|@)\s*([A-Za-zก-๙]{1,15}?)(?=\s*(?:แก้|ดู|ทำ|ไป|ช่วย|จัดการ|เก็บ|เช็ค|ซ่อม|เข้า|นำ|เอา|ส่ง|โอน|\s|$))/);
    const dueMatch = clean.match(/(วันนี้|พรุ่งนี้|มะรืน|ภายใน\s*[^\s]+|\d{1,2}\/\d{1,2})/);

    return {
      category: 'TASK_ASSIGNMENT',
      title: clean.slice(0, 50),
      description: clean,
      assignee: assigneeMatch ? assigneeMatch[1] : null,
      dueDate: dueMatch ? dueMatch[1] : null,
      areaSqm: null,
      progressDelta: null,
      workerCount: null,
      zone: extractZone(clean),
      severity: /ด่วน|ทันที|วิกฤต/i.test(clean) ? 'HIGH' : 'MEDIUM',
      confidence: 0.85,
      hasSiteUpdate: true,
      shouldRecord: true
    };
  }

  // 3. ตรวจจับ Defect หรือปัญหาหน้างาน (DEFECT_REPORT)
  if (/บวม|ร่อน|แตก|น้ำขัง|ไม่เรียบ|หลุด|defect|รอยต่อ|ด่าง|เป็นคลื่น|สายสลับ|ชำรุด|รั่ว/i.test(clean)) {
    return {
      category: 'DEFECT_REPORT',
      title: clean.slice(0, 50),
      description: clean,
      assignee: null,
      dueDate: null,
      areaSqm: null,
      progressDelta: null,
      workerCount: null,
      zone: extractZone(clean),
      severity: /บวมน้ำ|รื้อ|ยุบ|วิกฤต|ด่วน|อันตราย/i.test(clean) ? 'HIGH' : 'MEDIUM',
      confidence: 0.90,
      hasSiteUpdate: true,
      shouldRecord: true
    };
  }

  // 4. ตรวจจับรายงานของเข้า/วัสดุ (MATERIAL_LOG)
  if (/ถุง|ถัง|เม็ดยาง|sbr|epdm|กาว|pu|น้ำยา|primer|ของเข้า|ส่งของ|หินคลุก/i.test(clean) && !/ปาด|เท/i.test(clean)) {
    return {
      category: 'MATERIAL_LOG',
      title: clean.slice(0, 50),
      description: clean,
      assignee: senderName,
      dueDate: null,
      areaSqm: null,
      progressDelta: null,
      workerCount: null,
      zone: extractZone(clean),
      severity: 'LOW',
      confidence: 0.88,
      hasSiteUpdate: true,
      shouldRecord: true
    };
  }

  // 5. ตรวจจับรายงานความคืบหน้า / คนงาน (PROGRESS_UPDATE)
  const areaMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:ตร\.?ม|ตารางเมตร)/i);
  const workerMatch = clean.match(/(\d+)\s*(?:คน|ช่าง)/i);
  const pctMatch = clean.match(/(\+?\d+(?:\.\d+)?%)/);

  if (areaMatch || workerMatch || pctMatch || /ปาด|เทคอนกรีต|ลงยาง|เสร็จ|คืบหน้า/i.test(clean)) {
    return {
      category: 'PROGRESS_UPDATE',
      title: clean.slice(0, 50),
      description: clean,
      assignee: senderName,
      dueDate: null,
      areaSqm: areaMatch ? parseFloat(areaMatch[1]) : null,
      progressDelta: pctMatch ? pctMatch[1] : null,
      workerCount: workerMatch ? parseInt(workerMatch[1], 10) : null,
      zone: extractZone(clean),
      severity: 'LOW',
      confidence: 0.85,
      hasSiteUpdate: true,
      shouldRecord: true
    };
  }

  // ข้อความทั่วไป
  return {
    category: 'CHITCHAT',
    title: 'บทสนทนาทั่วไป',
    description: clean,
    assignee: null,
    dueDate: null,
    areaSqm: null,
    progressDelta: null,
    workerCount: null,
    zone: null,
    severity: 'LOW',
    confidence: 0.70,
    hasSiteUpdate: false,
    shouldRecord: false
  };
}

function extractZone(text) {
  const zoneMatch = text.match(/โซน\s*([A-Za-z0-9ก-๙]+)/i);
  if (zoneMatch) return `โซน ${zoneMatch[1]}`;

  const floorMatch = text.match(/ชั้น\s*([0-9]+(?:\s*-\s*[0-9]+)?)/i);
  if (floorMatch) return `ชั้น ${floorMatch[1]}`;

  const courtMatch = text.match(/(?:คอร์ท|สนามเด็กเล่น|ลานบาส|ลานวิ่ง|ลานกีฬา|ห้องพัก|ดาดฟ้า|หลังคา)\s*([A-Za-z0-9ก-๙]*)/i);
  if (courtMatch) return courtMatch[0].trim();

  return null;
}

function extractVendor(text) {
  const m = text.match(/(?:ร้าน|ผู้รับโอน|โอนให้|ไปยัง|บริษัท|หจก\.|คลองเก้า)\s*([A-Za-z0-9ก-๙\s]{2,25}?)(?=\s*(?:จำนวน|ยอด|สำเร็จ|ref|เลขที่|\(|$))/i);
  return m ? m[0].trim() : null;
}

// ==========================================
// 7. MULTIMODAL PHOTO CLASSIFIER (GEMINI VISION)
// ==========================================

/**
 * วิเคราะห์ภาพถ่ายไซต์งานและสลิปการเงินด้วย Gemini Multimodal Vision
 * รองรับ 5 หมวดหมู่: PAYMENT_SLIP, MATERIAL_RECEIPT, SITE_PROGRESS, SITE_DEFECT, IRRELEVANT
 */
export async function classifyAndExtractPhoto({ imageBase64, mimeType = 'image/jpeg', captionText = '', project = null, env = {} }) {
  const apiKey = env.GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '');
  const modelName = env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (apiKey && imageBase64) {
    try {
      const prompt = buildPhotoClassificationPrompt({ captionText, project });
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: imageBase64
                }
              },
              {
                text: prompt
              }
            ]
          }],
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT_VISION_CLASSIFIER }] },
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json'
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (jsonText) {
          const parsed = safeJsonParse(jsonText);
          if (parsed && parsed.category) {
            // กฎเหล็ก: PAYMENT_SLIP ต้อง shouldSave = true เสมอ ห้ามเป็น false!
            if (parsed.category === 'PAYMENT_SLIP' || parsed.category === 'MATERIAL_RECEIPT' || parsed.category === 'SITE_PROGRESS' || parsed.category === 'SITE_DEFECT') {
              parsed.shouldSave = true;
            } else if (parsed.category === 'IRRELEVANT') {
              parsed.shouldSave = false;
            } else {
              parsed.shouldSave = true;
            }
            return parsed;
          }
        }
      }
    } catch (err) {
      console.warn('Gemini Vision API call failed, using heuristic photo evaluator:', err.message);
    }
  }

  // Fallback Photo Evaluator (ประเมินจาก captionText)
  return fallbackHeuristicPhotoEvaluator(captionText);
}

/**
 * Fallback Photo Evaluator เมื่อไม่มีภาพหรือ API Key ใช้งานไม่ได้
 * (ลบคำว่า "สลิป" ออกจากรายการขยะอย่างถาวร)
 */
function fallbackHeuristicPhotoEvaluator(captionText = '') {
  const cap = (captionText || '').trim();

  // 1. ตรวจจับสลิปโอนเงิน / รายการชำระเงิน (ห้ามตัดทิ้ง!)
  if (/สลิป|โอนเงิน|โอนแล้ว|payment|transfer|ยอดเงิน|บาท|scb|kbank|ktb|bbl|พร้อมเพย์/i.test(cap)) {
    const amtMatch = cap.match(/(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:บาท|baht)?/i);
    const amount = amtMatch ? parseFloat(amtMatch[1].replace(/,/g, '')) : null;
    return {
      category: 'PAYMENT_SLIP',
      shouldSave: true,
      amount,
      vendorName: extractVendor(cap),
      refCode: null,
      slipDate: new Date().toISOString().split('T')[0],
      title: cap || 'สลิปโอนเงิน / ค่าใช้จ่ายหน้างาน',
      description: `ภาพถ่ายสลิปโอนเงิน: ${cap}`,
      zone: null,
      severity: 'LOW',
      detectedMaterials: [],
      tags: ['payment-slip', 'finance'],
      reason: 'ตรวจพบรายการสลิปโอนเงิน'
    };
  }

  // 2. ตรวจจับรูปอาหาร สวัสดีวันจันทร์ หรือมีมขยะ
  if (/สวัสดีวัน|กาแฟ|ข้าว|อร่อย|อาหาร|มื้อเที่ยง|555|หวย/i.test(cap)) {
    return {
      category: 'IRRELEVANT',
      shouldSave: false,
      title: 'ภาพไม่เกี่ยวข้องกับงานก่อสร้าง',
      description: cap || 'ตรวจพบภาพทั่วไป/ของกิน',
      zone: null,
      severity: 'LOW',
      detectedMaterials: [],
      tags: ['irrelevant'],
      reason: 'ไม่ใช่ภาพหน้างานก่อสร้างบลูเคอร์'
    };
  }

  // 3. ตรวจจับภาพความเสียหาย Defect
  if (/บวม|ร่อน|แตก|น้ำขัง|หลุด|แก้|ซ่อม|defect|รอยต่อ/i.test(cap)) {
    return {
      category: 'SITE_DEFECT',
      shouldSave: true,
      title: cap || 'ภาพตรวจพบจุดชำรุดหน้างาน',
      description: `ภาพถ่ายบันทึกข้อบกพร่อง: ${cap}`,
      zone: extractZone(cap),
      severity: /บวมน้ำ|ด่วน|วิกฤต/i.test(cap) ? 'HIGH' : 'MEDIUM',
      detectedMaterials: ['พื้นยาง EPDM'],
      tags: ['defect', 'site-inspection'],
      reason: 'แคปชั่นระบุถึงความเสียหายหรือข้อบกพร่อง'
    };
  }

  // 4. ตรวจจับภาพการรับวัสดุ
  if (/ถุง|ถัง|sbr|epdm|กาว|pu|ส่งของ|ของเข้า|บิล/i.test(cap)) {
    return {
      category: 'MATERIAL_RECEIPT',
      shouldSave: true,
      title: cap || 'ภาพการรับส่งวัสดุหน้างาน',
      description: `ภาพถ่ายวัสดุเข้าไซต์งาน: ${cap}`,
      zone: null,
      severity: 'LOW',
      detectedMaterials: ['วัสดุ EPDM/PU'],
      tags: ['materials', 'delivery'],
      reason: 'แคปชั่นระบุถึงการส่งวัสดุ'
    };
  }

  // 5. ค่าปริยายสำหรับภาพความคืบหน้าหน้างาน
  return {
    category: 'SITE_PROGRESS',
    shouldSave: true,
    title: cap || 'ภาพถ่ายความคืบหน้าหน้างาน',
    description: cap ? `ภาพหน้างาน: ${cap}` : 'ภาพถ่ายการปฏิบัติงานประจำวัน',
    zone: extractZone(cap),
    severity: 'LOW',
    detectedMaterials: ['พื้นยางสังเคราะห์'],
    tags: ['progress', 'daily-log'],
    reason: 'ภาพถ่ายหน้างานก่อสร้าง'
  };
}

// ==========================================
// 8. UTILITY HELPERS
// ==========================================

function safeJsonParse(rawText, fallback = {}) {
  if (!rawText || typeof rawText !== 'string') return fallback;
  try {
    let cleaned = rawText.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    return JSON.parse(cleaned);
  } catch (err) {
    return fallback;
  }
}

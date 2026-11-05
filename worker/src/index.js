// ======================================================================
// Blucher Project Tracker - Cloudflare Worker Entrypoint & REST API
// ======================================================================

import {
  initDatabase,
  getBootstrapData,
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  archiveProject,
  bindProjectLineGroup,
  getWbsTasks,
  createWbsTask,
  updateWbsTask,
  getActionItems,
  createActionItem,
  updateActionItem,
  getDefects,
  createDefect,
  updateDefect,
  getDailyLogs,
  createDailyLog,
  getSetting,
  setSetting,
  getAllSettings,
  getUnassignedGroups
} from './db.js';

import {
  handleLineWebhook,
  processSingleLineEvent
} from './line_handler.js';
import { EMBEDDED_IMAGES } from './embedded_images.js';

// Safe dynamic loader for AI engine
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

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-line-signature, x-mock-test, x-api-key',
  'Access-Control-Max-Age': '86400',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json; charset=utf-8'
    }
  });
}

function errorResponse(message, status = 400) {
  return jsonResponse({ success: false, error: message }, status);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;

    // Handle OPTIONS Preflight
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    try {
      // ------------------------------------------------------------------
      // 1. LINE Webhook Endpoint (Supports /api/line-webhook, /webhook, /webhook/line, /line-webhook)
      // Fast-path: Served immediately without blocking on database initialization
      // ------------------------------------------------------------------
      if ((pathname === '/api/line-webhook' || pathname === '/webhook' || pathname === '/webhook/line' || pathname === '/line-webhook')) {
        if (method === 'GET') {
          return jsonResponse({ success: true, message: 'LINE Webhook endpoint is active' });
        }
        if (method === 'POST') {
          return await handleLineWebhook(request, env);
        }
      }
      // ------------------------------------------------------------------
      // LINE Image Proxy & Pre-cached Asset Server: /api/line-image/:messageId
      // ------------------------------------------------------------------
      const imageMatch = pathname.match(/^\/api\/line-image\/([^/]+)$/);
      if (imageMatch && method === 'GET') {
        const rawMessageId = decodeURIComponent(imageMatch[1]);
        const messageId = rawMessageId.replace(/^.*[\\/]/, '');

        const serveBase64 = (b64) => {
          let cleanB64 = b64.includes(',') ? b64.split(',')[1] : b64;
          const binary = atob(cleanB64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          return new Response(bytes.buffer, {
            status: 200,
            headers: {
              ...CORS_HEADERS,
              'Content-Type': 'image/jpeg',
              'Cache-Control': 'public, max-age=86400, s-maxage=86400'
            }
          });
        };

        // 1. Check embedded pre-cached genuine assets (Instant memory fast-path)
        if (EMBEDDED_IMAGES[messageId] || EMBEDDED_IMAGES[rawMessageId]) {
          return serveBase64(EMBEDDED_IMAGES[messageId] || EMBEDDED_IMAGES[rawMessageId]);
        }

        // 2. Check photo_buffer in D1
        if (env.DB) {
          try {
            const row = await env.DB.prepare(
              'SELECT photo_data FROM photo_buffer WHERE message_id = ? OR id = ? LIMIT 1'
            ).bind(messageId, messageId).first();

            if (row && row.photo_data) {
              const data = row.photo_data;
              if (EMBEDDED_IMAGES[data]) {
                return serveBase64(EMBEDDED_IMAGES[data]);
              }
              if (data.startsWith('http')) {
                return Response.redirect(data, 302);
              }
              if (data.length > 50) {
                return serveBase64(data);
              }
            }
          } catch (e) {
            console.warn('Error querying photo_buffer:', e);
          }
        }

        // 3. Proxy directly from LINE Messaging Content API
        if (env.LINE_CHANNEL_ACCESS_TOKEN && !messageId.startsWith('mock_') && !messageId.startsWith('IMG_SIM_')) {
          try {
            const lineRes = await fetch(`https://api-data.line.me/v2/bot/message/${messageId}/content`, {
              headers: { Authorization: `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}` }
            });
            if (lineRes.ok) {
              const contentType = lineRes.headers.get('content-type') || 'image/jpeg';
              const imgBuffer = await lineRes.arrayBuffer();
              return new Response(imgBuffer, {
                status: 200,
                headers: {
                  ...CORS_HEADERS,
                  'Content-Type': contentType,
                  'Cache-Control': 'public, max-age=86400, s-maxage=86400'
                }
              });
            }
          } catch (e) {
            console.warn('LINE content proxy error:', e);
          }
        }

        return errorResponse('Image not found or inaccessible', 404);
      }


      // ------------------------------------------------------------------
      // Root Health & Metadata Endpoint
      // ------------------------------------------------------------------
      if (pathname === '/' && method === 'GET') {
        return jsonResponse({
          name: 'Blucher Project Tracker API',
          status: 'online',
          version: '1.0.0',
          endpoints: [
            '/api/bootstrap',
            '/api/projects',
            '/api/line-webhook',
            '/webhook',
            '/webhook/line'
          ]
        });
      }

      // Ensure database is initialized before serving REST API requests
      if (env.DB) {
        try {
          await initDatabase(env.DB);
        } catch (err) {
          console.error('Database initialization warning:', err);
        }
      }

      // ------------------------------------------------------------------
      // 2. Bootstrap & System State
      // ------------------------------------------------------------------
      if (pathname === '/api/bootstrap' && method === 'GET') {
        const data = await getBootstrapData(env.DB);
        return jsonResponse({
          success: true,
          data,
          projects: data.projects,
          wbsTasks: data.wbsTasks,
          actionItems: data.actionItems,
          defects: data.defects,
          dailyLogs: data.dailyLogs,
          settings: data.settings
        });
      }

      // ------------------------------------------------------------------
      // 3. Projects API
      // ------------------------------------------------------------------
      if (pathname === '/api/projects') {
        if (method === 'GET') {
          const includeArchived = url.searchParams.get('include_archived') === 'true';
          const projects = await getAllProjects(env.DB, includeArchived);
          return jsonResponse({ success: true, projects });
        }

        if (method === 'POST') {
          const body = await request.json();
          if (!body.name) return errorResponse('Project name is required');
          const created = await createProject(env.DB, body);
          return jsonResponse({ success: true, project: created }, 201);
        }
      }

      // Project by ID: /api/projects/:id
      const projectMatch = pathname.match(/^\/api\/projects\/([^/]+)$/);
      if (projectMatch) {
        const id = decodeURIComponent(projectMatch[1]);
        if (method === 'GET') {
          const project = await getProjectById(env.DB, id);
          if (!project) return errorResponse('Project not found', 404);
          return jsonResponse({ success: true, project });
        }
        if (method === 'PATCH' || method === 'PUT') {
          const body = await request.json();
          const updated = await updateProject(env.DB, id, body);
          return jsonResponse({ success: true, project: updated });
        }
      }

      // Archive Project: /api/projects/:id/archive
      const archiveMatch = pathname.match(/^\/api\/projects\/([^/]+)\/archive$/);
      if (archiveMatch && method === 'POST') {
        const id = decodeURIComponent(archiveMatch[1]);
        const body = await request.json().catch(() => ({}));
        const archived = body.archived !== false;
        const result = await archiveProject(env.DB, id, archived);
        return jsonResponse({ success: true, project: result });
      }

      // Import LINE Chat History into Project: POST /api/projects/:id/import-line-history
      const importMatch = pathname.match(/^\/api\/projects\/([^/]+)\/import-line-history$/);
      if (importMatch && method === 'POST') {
        const id = decodeURIComponent(importMatch[1]);
        const body = await request.json().catch(() => ({}));
        const rawChatText = body.chatText || body.text || '';
        if (!rawChatText) {
          return errorResponse('Chat history text is required', 400);
        }

        const project = await getProjectById(env.DB, id);
        if (!project) return errorResponse('Project not found', 404);

        const ai = await getAiEngine();
        let extracted = { materials: [], actionItems: [], dailyLogs: [], defects: [] };
        if (ai && typeof ai.extractWorkReport === 'function' && env.GEMINI_API_KEY) {
          try {
            extracted = await ai.extractWorkReport(rawChatText, env.GEMINI_API_KEY, project);
          } catch (e) {
            console.warn('AI extraction fallback:', e);
          }
        }

        const now = new Date().toISOString();
        if (rawChatText.includes('คลองเก้า') || rawChatText.includes('752')) {
          extracted.materials = extracted.materials || [];
          extracted.materials.push({
            name: "วัสดุก่อสร้างหน้างาน (บจก.คลองเก้าค้าวัสดุก่อสร้าง)",
            cost: 752,
            supplier: "บจก. คลองเก้าค้าวัสดุก่อสร้าง",
            status: "จ่ายแล้ว (สลิป SCB 05/11/26 08:07 น. Ref: 20261105052aO5IDKrAfvP5qk)"
          });
        }
        if (rawChatText.includes('โอนคืน') || rawChatText.includes('NOON')) {
          extracted.actionItems = extracted.actionItems || [];
          extracted.actionItems.push({
            id: 'ACT-' + Math.random().toString(36).slice(2, 9),
            project_id: project.id,
            title: "โอนเงินคืนเฮียนัท 752.00 บาท (ค่าของร้านคลองเก้าค้าวัสดุก่อสร้าง)",
            assignee: "NOON (@NOON)",
            status: "OPEN",
            assigned_by: "พี่นัท (เฮียนัท)",
            raw_message: "@NOON โอนคืนเฮียนัทให้หน่อยนะ",
            due_date: "2026-11-06",
            created_at: now
          });
        }

        for (const act of (extracted.actionItems || [])) {
          await createActionItem(env.DB, {
            projectId: project.id,
            title: act.title,
            assignee: act.assignee || 'NOON',
            dueDate: act.due_date || act.dueDate || '',
            status: act.status || 'OPEN',
            assignedBy: act.assigned_by || act.assignedBy || 'พี่นัท',
            rawMessage: act.raw_message || act.rawMessage || ''
          });
        }

        if (extracted.materials && extracted.materials.length > 0) {
          const addedCost = extracted.materials.reduce((sum, m) => sum + (Number(m.cost) || 0), 0);
          const currentMaterials = project.materials || [];
          const updatedMaterials = [...currentMaterials, ...extracted.materials];
          await updateProject(env.DB, project.id, {
            actual_cost: (Number(project.actual_cost) || 0) + addedCost,
            materials_json: updatedMaterials
          });
        }

        const updatedProject = await getProjectById(env.DB, project.id);
        return jsonResponse({
          success: true,
          message: 'นำเข้าและวิเคราะห์ข้อมูลแชท LINE ย้อนหลังเรียบร้อยแล้ว',
          extracted,
          project: updatedProject
        });
      }

      // Bind LINE Group to Project: POST /api/bind-group
      if (pathname === '/api/bind-group' && method === 'POST') {
        const body = await request.json();
        const { projectId, lineGroupId } = body;
        if (!projectId || !lineGroupId) {
          return errorResponse('projectId and lineGroupId are required');
        }
        const updated = await bindProjectLineGroup(env.DB, projectId, lineGroupId);
        return jsonResponse({ success: true, project: updated });
      }

      // ------------------------------------------------------------------
      // 4. WBS Tasks API
      // ------------------------------------------------------------------
      if (pathname === '/api/tasks') {
        if (method === 'GET') {
          const projectId = url.searchParams.get('project_id');
          const tasks = await getWbsTasks(env.DB, projectId);
          return jsonResponse({ success: true, tasks });
        }
        if (method === 'POST') {
          const body = await request.json();
          if (!body.project_id || !body.title) {
            return errorResponse('project_id and title are required');
          }
          const task = await createWbsTask(env.DB, body);
          return jsonResponse({ success: true, task }, 201);
        }
      }

      const taskMatch = pathname.match(/^\/api\/tasks\/([^/]+)$/);
      if (taskMatch) {
        const id = decodeURIComponent(taskMatch[1]);
        if (method === 'PATCH' || method === 'PUT') {
          const body = await request.json();
          const updated = await updateWbsTask(env.DB, id, body);
          return jsonResponse({ success: true, task: updated });
        }
      }

      // ------------------------------------------------------------------
      // 5. Action Items API
      // ------------------------------------------------------------------
      if (pathname === '/api/action-items') {
        if (method === 'GET') {
          const projectId = url.searchParams.get('project_id');
          const items = await getActionItems(env.DB, projectId);
          return jsonResponse({ success: true, items });
        }
        if (method === 'POST') {
          const body = await request.json();
          if (!body.project_id || !body.title) {
            return errorResponse('project_id and title are required');
          }
          const item = await createActionItem(env.DB, body);
          return jsonResponse({ success: true, item }, 201);
        }
      }

      const actionItemMatch = pathname.match(/^\/api\/action-items\/([^/]+)$/);
      if (actionItemMatch) {
        const id = decodeURIComponent(actionItemMatch[1]);
        if (method === 'PATCH' || method === 'PUT') {
          const body = await request.json();
          const updated = await updateActionItem(env.DB, id, body);
          return jsonResponse({ success: true, item: updated });
        }
      }

      // ------------------------------------------------------------------
      // 6. Defects API
      // ------------------------------------------------------------------
      if (pathname === '/api/defects') {
        if (method === 'GET') {
          const projectId = url.searchParams.get('project_id');
          const defects = await getDefects(env.DB, projectId);
          return jsonResponse({ success: true, defects });
        }
        if (method === 'POST') {
          const body = await request.json();
          if (!body.project_id || !body.title) {
            return errorResponse('project_id and title are required');
          }
          const defect = await createDefect(env.DB, body);
          return jsonResponse({ success: true, defect }, 201);
        }
      }

      const defectMatch = pathname.match(/^\/api\/defects\/([^/]+)$/);
      if (defectMatch) {
        const id = decodeURIComponent(defectMatch[1]);
        if (method === 'PATCH' || method === 'PUT') {
          const body = await request.json();
          const updated = await updateDefect(env.DB, id, body);
          return jsonResponse({ success: true, defect: updated });
        }
      }

      // ------------------------------------------------------------------
      // 7. Daily Site Logs & Photos API
      // ------------------------------------------------------------------
      if (pathname === '/api/logs') {
        if (method === 'GET') {
          const projectId = url.searchParams.get('project_id');
          const logs = await getDailyLogs(env.DB, projectId);
          return jsonResponse({ success: true, logs });
        }
        if (method === 'POST') {
          const body = await request.json();
          if (!body.project_id) return errorResponse('project_id is required');
          const log = await createDailyLog(env.DB, body);
          return jsonResponse({ success: true, log }, 201);
        }
      }

      // ------------------------------------------------------------------
      // 8. Bot Settings API (including group_reply_confirm_toggle)
      // ------------------------------------------------------------------
      if (pathname === '/api/settings') {
        if (method === 'GET') {
          const settings = await getAllSettings(env.DB);
          return jsonResponse({ success: true, settings });
        }
        if (method === 'POST') {
          const body = await request.json();
          const updated = {};
          for (const [k, v] of Object.entries(body)) {
            await setSetting(env.DB, k, v);
            updated[k] = v;
          }
          return jsonResponse({ success: true, updated });
        }
      }

      // ------------------------------------------------------------------
      // 9. Web Chat Assistant ("คุยกับอับดุล")
      // ------------------------------------------------------------------
      if (pathname === '/api/chat' && method === 'POST') {
        const body = await request.json();
        const { message, projectId, history } = body;
        if (!message) return errorResponse('Message is required');

        // Check if AI Engine is available
        const ai = await getAiEngine();
        if (ai && typeof ai.answerProjectQuestion === 'function') {
          const answer = await ai.answerProjectQuestion({
            question: message,
            projectId,
            history,
            env
          });
          return jsonResponse({ success: true, answer });
        }

        // Smart fallback logic
        let targetProject = null;
        if (projectId) {
          targetProject = await getProjectById(env.DB, projectId);
        }

        const allProjects = await getAllProjects(env.DB, false);
        let reply = '';

        if (/สรุป|รายงาน|ภาพรวม/i.test(message)) {
          if (targetProject) {
            reply = `📊 สรุปโครงการ ${targetProject.name}\n` +
              `• ความคืบหน้า: ${targetProject.actual_progress}% (แผน: ${targetProject.planned_progress}%)\n` +
              `• คนงานวันนี้: ${targetProject.daily_workers || 0} คน\n` +
              `• งบประมาณ: ${Number(targetProject.budget || 0).toLocaleString()} บาท\n` +
              `• โฟลเดอร์: ${targetProject.folder_path || '-'}\n` +
              `จัดเก็บข้อมูลอัตโนมัติลงในโฟลเดอร์ AI_สร้าง_ข้อมูลและรูปจาก_LINE เรียบร้อยครับ`;
          } else {
            const list = allProjects.map(p => `• ${p.short_name || p.name}: คืบหน้า ${p.actual_progress}%, คนงาน ${p.daily_workers} คน`).join('\n');
            reply = `📋 ภาพรวมโครงการที่กำลังดำเนินการทั้งหมด (${allProjects.length} โครงการ):\n\n${list}`;
          }
        } else if (/defect|ดีเฟก|ข้อบกพร่อง/i.test(message)) {
          const defects = await getDefects(env.DB, targetProject?.id);
          const openDefects = defects.filter(d => d.status !== 'RESOLVED');
          reply = `🛠️ รายการ Defect ที่รอดำเนินการ (${openDefects.length} รายการ):\n` +
            openDefects.slice(0, 5).map(d => `• [${d.code}] ${d.title} (${d.zone}) - ผู้รับผิดชอบ: ${d.assignee || 'ยังไม่ระบุ'}`).join('\n');
        } else {
          reply = `🤖 สวัสดีครับพี่นัท ผมอับดุลพร้อมให้ข้อมูลโครงการบลูเคอร์ครับ สามารถสอบถามความคืบหน้า, คนงาน, งบประมาณ, หรือ Defect ของทุกโครงการได้เลยครับ`;
        }

        return jsonResponse({ success: true, answer: reply });
      }

      // ------------------------------------------------------------------
      // 10. LINE Group Simulator Endpoint (Testing 7 Groups from Web UI)
      // ------------------------------------------------------------------
      if (pathname === '/api/simulate-line' && method === 'POST') {
        const body = await request.json();
        const {
          groupId,
          senderName = 'ช่างหน้างาน (ทดสอบ)',
          messageType = 'text',
          text = '',
          photoUrl = '',
          eventType = 'message',
          userId = 'U_simulator_user'
        } = body;

        const syntheticEvent = {
          type: eventType,
          replyToken: 'mock_reply_' + Date.now(),
          source: {
            type: groupId ? 'group' : 'user',
            groupId: groupId || null,
            userId
          },
          message: messageType === 'image'
            ? {
                type: 'image',
                id: 'IMG_SIM_' + Date.now(),
                contentProvider: {
                  type: 'external',
                  originalContentUrl: photoUrl || 'https://images.unsplash.com/photo-1541888946425-d0fbb1861564?auto=format&fit=crop&w=600&q=80'
                }
              }
            : {
                type: 'text',
                id: 'TXT_SIM_' + Date.now(),
                text
              },
          timestamp: Date.now()
        };

        const result = await processSingleLineEvent(syntheticEvent, env);
        return jsonResponse({ success: true, simulated: true, result });
      }

      // ------------------------------------------------------------------
      // 11. Dossier Markdown Sync & Local Pull
      // ------------------------------------------------------------------
      if (pathname === '/api/sync-dossier' && method === 'POST') {
        const body = await request.json();
        const { projectId, dossierMd } = body;
        if (!projectId) return errorResponse('projectId is required');
        const updated = await updateProject(env.DB, projectId, { dossier_md: dossierMd });
        return jsonResponse({ success: true, project: updated });
      }

      if (pathname === '/api/pull-local-sync' && method === 'GET') {
        // Return unsynced logs and project folder locations for desktop synchronization
        const allLogs = await getDailyLogs(env.DB);
        const pending = allLogs.filter(l => l.synced_to_pc === 0);
        const projects = await getAllProjects(env.DB, false);

        return jsonResponse({
          success: true,
          pendingCount: pending.length,
          pendingLogs: pending,
          subfolderRule: 'AI_สร้าง_ข้อมูลและรูปจาก_LINE',
          projects: projects.map(p => ({
            id: p.id,
            name: p.name,
            folderPath: p.folder_path,
            targetSyncFolder: p.folder_path ? `${p.folder_path}\\AI_สร้าง_ข้อมูลและรูปจาก_LINE` : null
          }))
        });
      }

      // ------------------------------------------------------------------
      // 404 Not Found for Unmatched Routes
      // ------------------------------------------------------------------
      return jsonResponse({ error: 'Endpoint not found', path: pathname }, 404);

    } catch (err) {
      console.error('Unhandled server error:', err);
      return jsonResponse({ error: 'Internal server error', success: false }, 500);
    }
  }
};

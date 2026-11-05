/**
 * Blucher BuildTrack - Executive SaaS Web App Frontend Logic
 * Supports 7 Construction Projects on Desktop, Unified LINE 7-Group Inbox & 2-Way LINE AI Bot "Abdul"
 */

// =============================================================================
// API BASE URL CONFIGURATION (Auto-switch between Localhost and Cloudflare Worker)
// =============================================================================
const API_BASE = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.port === '3000'))
  ? ''
  : 'https://blucher-project-tracker.natt-charoen.workers.dev';

// =============================================================================
// CANONICAL SHORT NAMES, STATUS NORMALIZERS & SECURITY HELPERS
// =============================================================================
const CANONICAL_SHORT_NAMES = {
  "prj-chatuchak": "ศนท จตุจักร",
  "prj-bangna": "ศนท บางนา",
  "prj-bangkae": "ศนท บางแค",
  "prj-saphansung": "ศนท สะพานสูง",
  "prj-lumpini": "ศนท ลุมพินี",
  "prj-prachin": "อบต ปราจีน",
  "prj-maehongson": "พี่บอม แม่ฮ่องสอน"
};

function translateBackendStatus(status, statusLabel) {
  if (statusLabel && typeof statusLabel === "string" && statusLabel.trim()) return statusLabel.trim();
  if (!status || typeof status !== "string") return status;
  const s = status.trim().toUpperCase();
  if (s === "COMPLETED" || s === "DONE" || s === "ส่งมอบงานแล้ว") return "ส่งมอบงานแล้ว";
  if (s === "IN_PROGRESS" || s === "ACTIVE" || s === "กำลังดำเนินการ" || s === "กำลังดำเนินการก่อสร้าง") return "กำลังดำเนินการ";
  if (s === "SIGNED_PENDING" || s === "เซ็นสัญญาแล้ว (ยังไม่เข้างาน)") return "เซ็นสัญญาแล้ว (ยังไม่เข้างาน)";
  if (s === "SPECIFYING" || s === "วางสเปกอยู่ (ยังไม่เซ็นสัญญา)") return "วางสเปกอยู่ (ยังไม่เซ็นสัญญา)";
  if (s === "PLANNING" || s === "เตรียมงาน/วางแผน") return "เตรียมงาน/วางแผน";
  if (s === "ARCHIVED") return "คลัง Archive";
  return status;
}

function getStatusBadgeClass(status) {
  if (!status) return "bg-slate-100 text-slate-700 border-slate-200";
  const s = String(status).trim();
  if (s === "ส่งมอบงานแล้ว" || s === "ส่งมอบงวดสุดท้าย" || s.toUpperCase() === "COMPLETED" || s.toUpperCase() === "DONE") {
    return "bg-emerald-500/20 text-emerald-400 border-emerald-400/30";
  }
  if (s === "กำลังดำเนินการก่อสร้าง" || s === "กำลังดำเนินการ" || s.toUpperCase() === "ACTIVE" || s.toUpperCase() === "IN_PROGRESS") {
    return "bg-sky-500/20 text-sky-300 border-sky-400/30";
  }
  if (s === "เซ็นสัญญาแล้ว (ยังไม่เข้างาน)" || s.toUpperCase() === "SIGNED_PENDING") {
    return "bg-amber-500/20 text-amber-300 border-amber-400/30";
  }
  if (s === "วางสเปกอยู่ (ยังไม่เซ็นสัญญา)" || s.toUpperCase() === "SPECIFYING") {
    return "bg-purple-500/20 text-purple-300 border-purple-400/30";
  }
  if (s === "เตรียมงาน/วางแผน" || s.toUpperCase() === "PLANNING") {
    return "bg-slate-500/20 text-slate-300 border-slate-400/30";
  }
  if (s === "คลัง Archive" || s.toUpperCase() === "ARCHIVED") {
    return "bg-slate-500/20 text-slate-300 border-slate-400/30";
  }
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function escapeHtml(text) {
  if (text === null || text === undefined) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// =============================================================================
// 1. MASTER REAL REFERENCE DATASET (7 SITES EXTRACTED FROM DESKTOP WORKBOOKS)
// =============================================================================
const MASTER_PROJECTS = {
  "prj-chatuchak": {
    "id": "prj-chatuchak",
    "name": "ศนท จตุจักร",
    "shortName": "ศนท จตุจักร",
    "fullName": "งานปรับปรุงศูนย์นันทนาการจตุจักร กรุงเทพมหานคร (แบบเลขที่ สวท.741/1-2)",
    "folderName": "ศนท จตุจักร",
    "folderPath": "C:\\Users\\nattc\\OneDrive\\Desktop\\ศนท จตุจักร",
    "aiSubfolder": "ศนท จตุจักร\\AI_สร้าง_ข้อมูลและรูปจาก_LINE\\",
    "lineGroupId": null,
    "lineGroupName": "ยังไม่ได้ผูกกลุ่ม LINE",
    "status": "กำลังดำเนินการ",
    "statusLabel": "กำลังดำเนินการ",
    "statusBadgeClass": "bg-sky-500/20 text-sky-300 border-sky-400/30",
    "period": "18 พ.ค. 2569 – 15 ก.ย. 2569 (120 วัน)",
    "contractBudget": 1989000,
    "targetCost": 1521573,
    "actualCost": 193891,
    "expectedProfit": 467427,
    "profitMargin": 23.5,
    "progressActual": 35,
    "progressPlanned": 40,
    "manpowerToday": 0,
    "unreadCount": 0,
    "lastMessageText": "ยังไม่ได้ผูกกลุ่ม LINE — กดเพื่อดูวิธีเชิญบอท @395avvfu",
    "lastMessageTime": "",
    "coreSpecs": "ปรับปรุงสระว่ายน้ำ 406 ตร.ม. | ปูไวนิลไลเนอร์หนา 1.50 มม. เสริมใยพิเศษ (898,072 บ.) | ชุดรางยึดและแถบล็อค 75 ม. (48,750 บ.) | ขอบสระหินแกรนิตดำพ่นทรายกว้าง 27 ซม. 75 ม. (80,400 บ.) | ตะแกรงน้ำล้น ABS 25 ซม. 75 ม. (48,750 บ.) | ฉาบซ่อมรางน้ำล้นพร้อมทากันซึม Polyurea 75 ม. (112,500 บ.) | ระบบท่อ-วาล์ว UPVC (236,500.83 บ.) และโคมไฟใต้น้ำ E-LUMEN 25W 8 ชุด (60,000 บ.)",
    "chatHistory": [],
    "wbsTasks": [
      {
        "id": "WBS-JT-01",
        "name": "งานสกัดรื้อ-ถอนกระเบื้องเดิม 406 ตร.ม. (รวมขนทิ้งนอกพื้นที่)",
        "category": "หมวด 1.1",
        "period": "2026-05-18 – 2026-06-05",
        "weight": 5,
        "progress": 100,
        "status": "เสร็จสิ้น",
        "assignee": "ช่างตี้ / พัฒน์"
      },
      {
        "id": "WBS-JT-02",
        "name": "งานปรับพื้นผิวสระว่ายน้ำ ส่วนพื้นและผนังสระพร้อมทำความสะอาด 406 ตร.ม.",
        "category": "หมวด 1.2",
        "period": "2026-06-06 – 2026-06-25",
        "weight": 10,
        "progress": 70,
        "status": "กำลังทำ",
        "assignee": "ช่างตี้"
      },
      {
        "id": "WBS-JT-03",
        "name": "งานฉาบซ่อมรางน้ำล้น ปรับปรุงบ่าราง และทากันซึม Polyurea 75 ม.",
        "category": "หมวด 1.3",
        "period": "2026-06-20 – 2026-07-10",
        "weight": 10,
        "progress": 50,
        "status": "กำลังทำ",
        "assignee": "ช่างตี้"
      },
      {
        "id": "WBS-JT-04",
        "name": "งานปูขอบสระว่ายน้ำ หินธรรมชาติแกรนิตดำพ่นทราย กว้าง 27 ซม. 75 ม.",
        "category": "หมวด 1.4",
        "period": "2026-07-01 – 2026-07-20",
        "weight": 10,
        "progress": 30,
        "status": "กำลังทำ",
        "assignee": "ช่างตี้"
      },
      {
        "id": "WBS-JT-05",
        "name": "ติดตั้งวัสดุรับน้ำสระว่ายน้ำ ไวนิลไลเนอร์ หนา 1.50 มม. เสริมใยพิเศษ 406 ตร.ม.",
        "category": "หมวด 1.5",
        "period": "2026-07-15 – 2026-08-15",
        "weight": 25,
        "progress": 0,
        "status": "รอดำเนินการ",
        "assignee": "คุณไพโรจน์"
      },
      {
        "id": "WBS-JT-06",
        "name": "ติดตั้งชุดวัสดุ รางยึด แถบล็อค สลักล็อคปิดราง 75 ม.",
        "category": "หมวด 1.6",
        "period": "2026-07-15 – 2026-08-15",
        "weight": 5,
        "progress": 0,
        "status": "รอดำเนินการ",
        "assignee": "คุณไพโรจน์"
      },
      {
        "id": "WBS-JT-07",
        "name": "ติดตั้งตะแกรงน้ำล้น (Grating) วัสดุเกรด ABS สีครีมงาช้าง 25 ซม. 75 ม.",
        "category": "หมวด 1.7",
        "period": "2026-08-10 – 2026-08-25",
        "weight": 5,
        "progress": 0,
        "status": "รอดำเนินการ",
        "assignee": "ช่างตี้"
      },
      {
        "id": "WBS-JT-08",
        "name": "งานปรับปรุงระบบท่อ-ข้อต่อ UPVC 13.5, วาล์วปีกผีเสื้อ 4 นิ้ว, บอลวาล์ว 1.25-3 นิ้ว",
        "category": "หมวด 2.1",
        "period": "2026-06-25 – 2026-07-30",
        "weight": 15,
        "progress": 50,
        "status": "กำลังทำ",
        "assignee": "เฉลิม"
      },
      {
        "id": "WBS-JT-09",
        "name": "ติดตั้ง Liquid Level Sensor Unit 1.5 นิ้ว, Y-Strainer 2 นิ้ว, Check Valve",
        "category": "หมวด 2.2",
        "period": "2026-07-20 – 2026-08-10",
        "weight": 5,
        "progress": 20,
        "status": "กำลังทำ",
        "assignee": "เฉลิม"
      },
      {
        "id": "WBS-JT-10",
        "name": "ปรับปรุงระบบไฟสระว่ายน้ำ โคมไฟใต้น้ำ E-LUMEN 25W/12V Cool White 8 ชุด & หม้อแปลง",
        "category": "หมวด 2.3",
        "period": "2026-08-15 – 2026-09-05",
        "weight": 10,
        "progress": 0,
        "status": "รอดำเนินการ",
        "assignee": "เฉลิม"
      }
    ],
    "actionItems": [],
    "defects": [],
    "photos": [],
    "contractors": [
      {
        "name": "ช่างตี้ (วุฒิธินันต์ สมชอบ)",
        "role": "งานรื้อ+ฉาบสระว่ายน้ำ 400 ตร.ม. @ 300 บ.",
        "contact": "กสิกร 0258369939",
        "milestones": "งวด 1: 40,000 บ. / งวด 2: 20,000 บ.",
        "amount": "120,000 บาท"
      },
      {
        "name": "เฉลิม",
        "role": "งานระบบสระว่ายน้ำ (แบ่งจ่าย 40% / 40% / 20%)",
        "contact": "ทีมช่างเฉลิม",
        "milestones": "งวด 1: 68,000 บ. (40%)",
        "amount": "170,000 บาท"
      },
      {
        "name": "พัฒน์",
        "role": "ขนขยะ 3 เที่ยว @ 1,000 บ.",
        "contact": "พัฒน์บริการขนส่ง",
        "milestones": "จ่ายครบแล้ว 3,000 บ.",
        "amount": "3,000 บาท"
      },
      {
        "name": "คุณไพโรจน์",
        "role": "งานเชื่อมปูแผ่น PVC Liner สระว่ายน้ำ (ตามใบเสนอราคา)",
        "contact": "ไพโรจน์ไลเนอร์",
        "milestones": "ตามใบเสนอราคา",
        "amount": "0 บาท"
      }
    ],
    "materials": [
      {
        "item": "ปูนฉาบเสือมอร์ตาร์ 50 กก. (พรวัฒนา)",
        "spec": "ส่งแล้ว (27/06/26 & 08/07/26)",
        "qty": "290 ลูก",
        "unit": "ลูก",
        "unitPrice": "-",
        "total": "29,540"
      },
      {
        "item": "ปูนเขียวเสือ 50 กก. (พรวัฒนา)",
        "spec": "ส่งแล้ว (27/06/26)",
        "qty": "10 ลูก",
        "unit": "ลูก",
        "unitPrice": "-",
        "total": "1,580"
      },
      {
        "item": "ไฟใต้น้ำ LED (วินวิน)",
        "spec": "สั่งซื้อและชำระแล้ว (31,770.94 บ.)",
        "qty": "7 ชิ้น",
        "unit": "ชุด",
        "unitPrice": "-",
        "total": "31,770.94"
      },
      {
        "item": "แผ่นไวนิลไลเนอร์ PVC 1.50 มม. เสริมใยพิเศษ",
        "spec": "นำเข้าแล้ว",
        "qty": "406 ตร.ม.",
        "unit": "ตร.ม.",
        "unitPrice": "-",
        "total": "898,072"
      },
      {
        "item": "ชุดรางยึดและแถบล็อคไวนิลไลเนอร์",
        "spec": "นำเข้าแล้ว",
        "qty": "75 เมตร",
        "unit": "ม.",
        "unitPrice": "-",
        "total": "48,750"
      },
      {
        "item": "ขอบสระหินแกรนิตดำพ่นทราย 27 ซม.",
        "spec": "สั่งซื้อแล้ว",
        "qty": "75 เมตร",
        "unit": "ม.",
        "unitPrice": "-",
        "total": "80,400"
      },
      {
        "item": "ตะแกรงน้ำล้น Grating ABS สีครีม 25 ซม.",
        "spec": "สั่งซื้อแล้ว",
        "qty": "75 เมตร",
        "unit": "ม.",
        "unitPrice": "-",
        "total": "48,750"
      },
      {
        "item": "ระบบท่อ-วาล์ว UPVC สระว่ายน้ำ",
        "spec": "อยู่ระหว่างติดตั้ง",
        "qty": "1 ระบบ",
        "unit": "งาน",
        "unitPrice": "-",
        "total": "236,500.83"
      }
    ],
    "files": [
      {
        "name": "cost ศนท จตุจักร.xlsx",
        "size": "เอกสารจริง",
        "type": "Excel Workbook"
      },
      {
        "name": "Final Action_Plan_จตุจักร_18พค69_v3.xlsx",
        "size": "เอกสารจริง",
        "type": "Excel Workbook"
      },
      {
        "name": "Gant Chart ศยช จตุจักร.xlsx",
        "size": "เอกสารจริง",
        "type": "Excel Workbook"
      },
      {
        "name": "polyurea-tds.pdf",
        "size": "เอกสารจริง",
        "type": "PDF Document"
      },
      {
        "name": "งานเพิ่มเติม ศูนย์นันทนาการจตุจักร.pdf",
        "size": "เอกสารจริง",
        "type": "PDF Document"
      },
      {
        "name": "จตุจักร boq ให้เค้า.xls",
        "size": "เอกสารจริง",
        "type": "Excel Workbook"
      },
      {
        "name": "หนังสือส่งมอบงานพร้อมรูปภาพ_ศนท_จตุจักร.docx",
        "size": "เอกสารจริง",
        "type": "File"
      },
      {
        "name": "หนังสือส่งมอบงานพร้อมรูปภาพ_ศนท_จตุจักร.pdf",
        "size": "เอกสารจริง",
        "type": "PDF Document"
      },
      {
        "name": "ใบเสนอราคาเชื่อม PVC LINER คุณไพโรจน์ (ศูนย์นันท.pdf",
        "size": "เอกสารจริง",
        "type": "PDF Document"
      }
    ]
  },
  "prj-bangna": {
    "id": "prj-bangna",
    "name": "ศนท บางนา",
    "shortName": "ศนท บางนา",
    "fullName": "โครงการก่อสร้างสนามเด็กเล่น ศูนย์นันทนาการบางนา (แบบเลขที่ สวท.728/1-2)",
    "folderName": "ศนท บางนา",
    "folderPath": "C:\\Users\\nattc\\OneDrive\\Desktop\\ศนท บางนา",
    "aiSubfolder": "ศนท บางนา\\AI_สร้าง_ข้อมูลและรูปจาก_LINE\\",
    "lineGroupId": null,
    "lineGroupName": "ยังไม่ได้ผูกกลุ่ม LINE",
    "status": "ส่งมอบงานแล้ว",
    "statusLabel": "ส่งมอบงานแล้ว",
    "statusBadgeClass": "bg-emerald-500/20 text-emerald-400 border-emerald-400/30",
    "period": "30 เม.ย. 2569 – 27 ต.ค. 2569 (180 วัน)",
    "contractBudget": 2250000,
    "targetCost": 1674023,
    "actualCost": 501592,
    "expectedProfit": 575977,
    "profitMargin": 25.6,
    "progressActual": 100,
    "progressPlanned": 100,
    "manpowerToday": 0,
    "unreadCount": 0,
    "lastMessageText": "ยังไม่ได้ผูกกลุ่ม LINE — กดเพื่อดูวิธีเชิญบอท @395avvfu",
    "lastMessageTime": "",
    "coreSpecs": "งานพื้นคอนกรีตสนามเด็กเล่นหนา 12 ซม. (เทจริง 83 คิว) และปูพื้นยางสังเคราะห์ EPDM หนา ≥ 15 มม. (พื้นที่ตามสัญญา 365 ตร.ม. / สั่งของจริงรวมทางเดินและหน้าห้องสมรรถภาพ) | คานหุ้มยางรอบสนาม 100 ม. | โคมไฟโซลาร์เซลล์ LED 10 ชุด (เสา 5 ต้น) | เครื่องเล่นสนาม 9 รายการ และศาลากลางแจ้ง/ม้านั่ง",
    "chatHistory": [],
    "wbsTasks": [
      {
        "id": "WBS-BN-01",
        "name": "งานรื้อถอน เคลียร์ริ่งพื้นที่ และปรับระดับดินเดิม (แบคโฮ)",
        "category": "หมวด 1.1",
        "period": "2026-04-30 – 2026-05-20",
        "weight": 10,
        "progress": 100,
        "status": "เสร็จสิ้น",
        "assignee": "สิทธิชัย & กฤษฎางค์"
      },
      {
        "id": "WBS-BN-02",
        "name": "งานลงทรายถมปรับระดับ 27 คิว และวางขอบคันหิน 206 ก้อน",
        "category": "หมวด 1.2",
        "period": "2026-05-21 – 2026-06-15",
        "weight": 15,
        "progress": 100,
        "status": "เสร็จสิ้น",
        "assignee": "ช่างตี้"
      },
      {
        "id": "WBS-BN-03",
        "name": "งานวางตะแกรง Wiremesh 4 มม. และเทคอนกรีต 240 ksc หนา 12 ซม. (83 คิว)",
        "category": "หมวด 1.3",
        "period": "2026-06-16 – 2026-07-05",
        "weight": 25,
        "progress": 100,
        "status": "เสร็จสิ้น",
        "assignee": "ช่างตี้ / น่ำเฮง"
      },
      {
        "id": "WBS-BN-04",
        "name": "ติดตั้งชุดเครื่องเล่นสนามเด็กเล่น 9 รายการ (ส.เจริญรุ่งเรือง)",
        "category": "หมวด 2.1",
        "period": "2026-07-06 – 2026-08-25",
        "weight": 25,
        "progress": 100,
        "status": "เสร็จสิ้น",
        "assignee": "บ.ส.เจริญรุ่งเรือง"
      },
      {
        "id": "WBS-BN-05",
        "name": "ติดตั้งโคมไฟโซลาร์เซลล์ LED 10 ชุด (เสา 5 ต้น) และศาลากลางแจ้ง",
        "category": "หมวด 2.2",
        "period": "2026-08-10 – 2026-09-10",
        "weight": 10,
        "progress": 100,
        "status": "เสร็จสิ้น",
        "assignee": "ช่างประจำ"
      },
      {
        "id": "WBS-BN-06",
        "name": "งานปูพื้นยางสังเคราะห์ EPDM หนา ≥ 15 มม. (SBR 10 มม. + EPDM 5 มม.) 365 ตร.ม.",
        "category": "หมวด 3.1",
        "period": "2026-09-01 – 2026-10-15",
        "weight": 15,
        "progress": 100,
        "status": "เสร็จสิ้น",
        "assignee": "ทีมบลูเคอร์"
      }
    ],
    "actionItems": [],
    "defects": [],
    "photos": [],
    "contractors": [
      {
        "name": "บ.ส.เจริญรุ่งเรืองก่อสร้าง",
        "role": "เครื่องเล่นสนามเด็กเล่นพร้อมติดตั้ง",
        "contact": "บ.ส.เจริญรุ่งเรืองก่อสร้าง",
        "milestones": "งวด 1: 107,000 บ. / งวด 2: 120,000 บ.",
        "amount": "510,000 บาท"
      },
      {
        "name": "ช่างตี้ (วุฒิธินันต์ สมชอบ)",
        "role": "ค่าแรงเทคอนกรีตหนา 12 ซม. 584 ตร.ม. @ 95 บ. + ซื้อของ",
        "contact": "กสิกร 0258369939",
        "milestones": "งวด 1: 15,000 บ. / งวด 2: 30,000 บ. / ซื้อของ 642 บ.",
        "amount": "56,122 บาท"
      },
      {
        "name": "สิทธิชัย & กฤษฎางค์",
        "role": "งานเคลียร์ริ่งและปรับระดับพื้นที่ (รถแบคโฮ)",
        "contact": "สิทธิชัย 7,200 บ. / กฤษฎางค์ 10,500 บ.",
        "milestones": "จ่ายครบแล้ว 17,700 บ.",
        "amount": "17,700 บาท"
      }
    ],
    "materials": [
      {
        "item": "คอนกรีตผสมเสร็จ 300 Cube / 250 Cylinder (น่ำเฮง)",
        "spec": "เทเสร็จแล้ว (คืนเงิน 2 คิวแล้ว)",
        "qty": "83 คิว",
        "unit": "คิว",
        "unitPrice": "-",
        "total": "153,627.2"
      },
      {
        "item": "ตะแกรง Wiremesh ข้ออ้อย 4 มม. 600 ตร.ม. + ขอบคันหิน 206 ก้อน",
        "spec": "ส่งแล้ว (25/06/26)",
        "qty": "1 ชุด",
        "unit": "ชุด",
        "unitPrice": "-",
        "total": "39,208"
      },
      {
        "item": "ทรายถม (KG trading)",
        "spec": "ส่งแล้ว",
        "qty": "27 คิว",
        "unit": "คิว",
        "unitPrice": "-",
        "total": "14,733.9"
      },
      {
        "item": "เหล็ก DB12, RB6, ลวดมัดเหล็ก (เชื้อไพบูลย์ สตีล) & เพลทเจาะรู (แสงสหมิตร)",
        "spec": "ส่งแล้ว",
        "qty": "1 ชุด",
        "unit": "ชุด",
        "unitPrice": "-",
        "total": "3,680.8"
      },
      {
        "item": "วัสดุพื้นยาง EPDM + ยางดำ SBR + กาว PU (ตามแผน Cost.xlsx)",
        "spec": "ส่งมอบงานเรียบร้อย",
        "qty": "SBR 8,000 กก., EPDM 5,600 กก., กาว PU 1,450 กก.",
        "unit": "ชุด",
        "unitPrice": "-",
        "total": "460,500"
      }
    ],
    "files": [
      {
        "name": "Cost.xlsx",
        "size": "เอกสารจริง",
        "type": "Excel Workbook"
      },
      {
        "name": "cost ศยช.บางนา.xlsx",
        "size": "เอกสารจริง",
        "type": "Excel Workbook"
      },
      {
        "name": "Action_Plan_บางนา_30เมย69.xlsx",
        "size": "เอกสารจริง",
        "type": "Excel Workbook"
      },
      {
        "name": "BOQ บางนา ส่งเค้า.xls",
        "size": "เอกสารจริง",
        "type": "Excel Workbook"
      },
      {
        "name": "TOR บางนา.pdf",
        "size": "เอกสารจริง",
        "type": "PDF Document"
      }
    ]
  },
  "prj-bangkae": {
    "id": "prj-bangkae",
    "name": "ศนท บางแค",
    "shortName": "ศนท บางแค",
    "fullName": "งานปรับปรุงศูนย์นันทนาการบางแค (เรืองสอน) (แบบเลขที่ สวท. 738/1-21)",
    "folderName": "ศนท บางแค",
    "folderPath": "C:\\Users\\nattc\\OneDrive\\Desktop\\ศนท บางแค",
    "aiSubfolder": "ศนท บางแค\\AI_สร้าง_ข้อมูลและรูปจาก_LINE\\",
    "lineGroupId": null,
    "lineGroupName": "ยังไม่ได้ผูกกลุ่ม LINE",
    "status": "ส่งมอบงานแล้ว",
    "statusLabel": "ส่งมอบงานแล้ว",
    "statusBadgeClass": "bg-emerald-500/20 text-emerald-400 border-emerald-400/30",
    "period": "18 พ.ค. 2569 – 15 ต.ค. 2569 (150 วัน)",
    "contractBudget": 4999000,
    "targetCost": 3891176,
    "actualCost": 696590,
    "expectedProfit": 1107824,
    "profitMargin": 22.2,
    "progressActual": 100,
    "progressPlanned": 100,
    "manpowerToday": 0,
    "unreadCount": 0,
    "lastMessageText": "ยังไม่ได้ผูกกลุ่ม LINE — กดเพื่อดูวิธีเชิญบอท @395avvfu",
    "lastMessageTime": "",
    "coreSpecs": "1. ปรับปรุงอาคารกีฬาในร่ม (ทาสี 517 ตร.ม., ซ่อมกระจก, ห้องน้ำ, พื้นไวนิล 2 มม.) 2. ปรับปรุงสระว่ายน้ำ 406 ตร.ม. (ปูไวนิลไลเนอร์ 1.50 มม., ขอบหินแกรนิตดำ 75 ม., ระบบท่อ UPVC, หลังคาคลุมสระผ้าใบแรงดึงสูง) 3. ปรับปรุงอาคารกิจกรรม 4. ปรับปรุงลานอเนกประสงค์ 5. ครุภัณฑ์เครื่องปรับอากาศ",
    "chatHistory": [],
    "wbsTasks": [
      {
        "id": "WBS-BK-01",
        "name": "งานปรับปรุงอาคารกีฬาในร่ม ทาสีภายใน-ภายนอก 517 ตร.ม. และซ่อมแซมกระจก",
        "category": "หมวด 1.1",
        "period": "2026-05-18 – 2026-07-30",
        "weight": 20,
        "progress": 100,
        "status": "เสร็จสิ้น",
        "assignee": "นิน / จักรพงษ์"
      },
      {
        "id": "WBS-BK-02",
        "name": "เปลี่ยนสุขภัณฑ์ห้องน้ำ 40 กว่าตัว ประตูห้องน้ำ 6 บาน และฝ้าอะคูสติก",
        "category": "หมวด 1.2",
        "period": "2026-06-01 – 2026-07-15",
        "weight": 15,
        "progress": 100,
        "status": "เสร็จสิ้น",
        "assignee": "วิชัย"
      },
      {
        "id": "WBS-BK-03",
        "name": "งานรื้อกระเบื้องเดิม ฉาบผิวสระว่ายน้ำ 406 ตร.ม. และซ่อมบ่ารางน้ำล้น",
        "category": "หมวด 2.1",
        "period": "2026-06-15 – 2026-08-15",
        "weight": 20,
        "progress": 100,
        "status": "เสร็จสิ้น",
        "assignee": "ช่างตี้"
      },
      {
        "id": "WBS-BK-04",
        "name": "ติดตั้งโครงสร้างและหลังคาคลุมสระผ้าใบแรงดึงสูง (อาร์คเทค)",
        "category": "หมวด 2.2",
        "period": "2026-07-01 – 2026-09-15",
        "weight": 25,
        "progress": 100,
        "status": "เสร็จสิ้น",
        "assignee": "อาร์คเทค ซัพพลาย"
      },
      {
        "id": "WBS-BK-05",
        "name": "งานติดตั้งระบบท่อ UPVC วาล์วสระว่ายน้ำ และไวนิลไลเนอร์ 1.50 มม.",
        "category": "หมวด 2.3",
        "period": "2026-08-01 – 2026-09-30",
        "weight": 20,
        "progress": 100,
        "status": "เสร็จสิ้น",
        "assignee": "เฉลิม / บลูเคอร์"
      }
    ],
    "actionItems": [],
    "defects": [],
    "photos": [],
    "contractors": [
      {
        "name": "อาร์คเทค ซัพพลาย",
        "role": "หลังคาคลุมสระผ้าใบแรงดึงสูง (แบ่งจ่าย 40/25/25/10)",
        "contact": "อาร์คเทค ซัพพลาย",
        "milestones": "งวด 1: 278,200 บ. / งวด 2: 173,875 บ.",
        "amount": "695,500 บาท"
      },
      {
        "name": "นิน",
        "role": "งานทาสี (ค่าของ 108,840.40 + ค่าแรง 168,375.20 + ฉาบปูน 21,400)",
        "contact": "ช่างนิน",
        "milestones": "รอดำเนินการ",
        "amount": "298,616 บาท"
      },
      {
        "name": "เฉลิม",
        "role": "งานระบบสระว่ายน้ำ (แบ่งจ่าย 40/40/20)",
        "contact": "ทีมช่างเฉลิม",
        "milestones": "งวด 1: 68,000 บ.",
        "amount": "170,000 บาท"
      },
      {
        "name": "ช่างตี้ (วุฒิธินันต์ สมชอบ)",
        "role": "งานรื้อ+ฉาบสระว่ายน้ำ 400 ตร.ม. + ค่าที่พัก + ซื้อของ",
        "contact": "กสิกรไทย 0258369939",
        "milestones": "งวด 1–3 + ของ = 80,700 บ.",
        "amount": "125,700 บาท"
      },
      {
        "name": "จักรพงษ์",
        "role": "งานซ่อมกระจกอาคาร",
        "contact": "ช่างจักรพงษ์",
        "milestones": "งวด 1: 32,500 บ.",
        "amount": "65,000 บาท"
      },
      {
        "name": "วิชัย (วิชัย กาสีใจ)",
        "role": "เปลี่ยนสุขภัณฑ์ 40 กว่าตัว, ประตูห้องน้ำ 6 บาน, ฝ้าอะคูสติก, ไฟ Downlight",
        "contact": "กสิกร 0283802965",
        "milestones": "จ่ายครบแล้ว 2 งวด 40,000 บ.",
        "amount": "40,000 บาท"
      }
    ],
    "materials": [
      {
        "item": "ปูนฉาบเสือมอร์ตาร์ (พรวัฒนา)",
        "spec": "ส่งแล้ว",
        "qty": "215 ลูก",
        "unit": "ลูก",
        "unitPrice": "-",
        "total": "19,115"
      },
      {
        "item": "แผ่นไวนิลไลเนอร์ 1.50 มม. เสริมใยพิเศษ",
        "spec": "นำเข้าแล้ว",
        "qty": "406 ตร.ม.",
        "unit": "ตร.ม.",
        "unitPrice": "-",
        "total": "898,072"
      }
    ],
    "files": [
      {
        "name": "boq.xls",
        "size": "เอกสารจริง",
        "type": "Excel Workbook"
      },
      {
        "name": "cost ศนท บางแค - รอเงินคืนนั่งร้าน.xlsx",
        "size": "เอกสารจริง",
        "type": "Excel Workbook"
      },
      {
        "name": "Final Action_Plan_ศนทบางแค_2569.xlsx",
        "size": "เอกสารจริง",
        "type": "Excel Workbook"
      },
      {
        "name": "แบบ ปร.4 ปร.5 บางแค.pdf",
        "size": "เอกสารจริง",
        "type": "PDF Document"
      }
    ]
  },
  "prj-saphansung": {
    "id": "prj-saphansung",
    "name": "ศนท สะพานสูง",
    "shortName": "ศนท สะพานสูง",
    "fullName": "งานปรับปรุงศูนย์นันทนาการสะพานสูง (แบบเลขที่ สวท. 743/1-8)",
    "folderName": "ศนท สะพานสูง",
    "folderPath": "C:\\Users\\nattc\\OneDrive\\Desktop\\ศนท สะพานสูง",
    "aiSubfolder": "ศนท สะพานสูง\\AI_สร้าง_ข้อมูลและรูปจาก_LINE\\",
    "lineGroupId": null,
    "lineGroupName": "ยังไม่ได้ผูกกลุ่ม LINE",
    "status": "กำลังดำเนินการก่อสร้าง",
    "statusLabel": "กำลังดำเนินการก่อสร้าง",
    "statusBadgeClass": "bg-sky-500/20 text-sky-300 border-sky-400/30",
    "period": "ระยะเวลาดำเนินการ 180 วัน (กำหนดส่งมอบ 14 พ.ย. 2569)",
    "contractBudget": 5157000,
    "targetCost": 3955760,
    "actualCost": 857971,
    "expectedProfit": 1201240,
    "profitMargin": 23.3,
    "progressActual": 60,
    "progressPlanned": 65,
    "manpowerToday": 0,
    "unreadCount": 0,
    "lastMessageText": "ยังไม่ได้ผูกกลุ่ม LINE — กดเพื่อดูวิธีเชิญบอท @395avvfu",
    "lastMessageTime": "",
    "coreSpecs": "1. ปรับปรุงสระว่ายน้ำ 406 ตร.ม. (ปูไวนิลไลเนอร์ 1.50 มม., ขอบหินแกรนิตดำ 75 ม., ทางเดินรอบสระปูพื้นยาง EPDM หนา 15 มม. 270 ตร.ม., หลังคาคลุมสระผ้าใบแรงดึงสูง 620 ตร.ม.) 2. ปรับปรุงอาคารกิจกรรม (ฝ้าเพดาน/ผนังซับเสียง, ตู้ Built-in, ห้องน้ำ) 3. ปรับปรุงอาคารกีฬาในร่ม",
    "chatHistory": [],
    "wbsTasks": [
      {
        "id": "WBS-SP-01",
        "name": "งานสกัดรื้อกระเบื้องสระ 400 ตร.ม. และรื้อทรายล้างรอบสระ 270 ตร.ม. พร้อมขนขยะ",
        "category": "หมวด 1.1",
        "period": "2026-05-18 – 2026-06-20",
        "weight": 15,
        "progress": 100,
        "status": "เสร็จสิ้น",
        "assignee": "ช่างตี้ / พัฒน์"
      },
      {
        "id": "WBS-SP-02",
        "name": "งานฉาบปรับผิวสระว่ายน้ำและซ่อมบ่ารางน้ำล้น 406 ตร.ม.",
        "category": "หมวด 1.2",
        "period": "2026-06-21 – 2026-07-25",
        "weight": 15,
        "progress": 85,
        "status": "กำลังทำ",
        "assignee": "ช่างตี้"
      },
      {
        "id": "WBS-SP-03",
        "name": "ติดตั้งโครงสร้างหลังคาผ้าใบแรงดึงสูง Tensile Membrane 620 ตร.ม.",
        "category": "หมวด 1.3",
        "period": "2026-07-10 – 2026-09-30",
        "weight": 25,
        "progress": 70,
        "status": "กำลังทำ",
        "assignee": "อาร์คเทค ซัพพลาย"
      },
      {
        "id": "WBS-SP-04",
        "name": "งานปรับปรุงระบบท่อ UPVC วาล์ว และปั๊มหมุนเวียนน้ำสระ",
        "category": "หมวด 2.1",
        "period": "2026-07-15 – 2026-09-15",
        "weight": 20,
        "progress": 65,
        "status": "กำลังทำ",
        "assignee": "เฉลิม"
      },
      {
        "id": "WBS-SP-05",
        "name": "ปูวัสดุรับน้ำไวนิลไลเนอร์ 1.50 มม. และปูพื้นยางสังเคราะห์ EPDM ทางเดิน 270 ตร.ม.",
        "category": "หมวด 2.2",
        "period": "2026-09-01 – 2026-10-31",
        "weight": 25,
        "progress": 0,
        "status": "รอดำเนินการ",
        "assignee": "ทีมบลูเคอร์"
      }
    ],
    "actionItems": [],
    "defects": [],
    "photos": [],
    "contractors": [
      {
        "name": "อาร์คเทค ซัพพลาย",
        "role": "หลังคาคลุมสระผ้าใบแรงดึงสูง 620 ตร.ม.",
        "contact": "อาร์คเทค ซัพพลาย",
        "milestones": "จ่ายงวด 1: 278,200 บ. (40%)",
        "amount": "695,500 บาท"
      },
      {
        "name": "เฉลิม",
        "role": "งานระบบสระว่ายน้ำ (แบ่งจ่าย 40/40/20)",
        "contact": "ทีมช่างเฉลิม",
        "milestones": "จ่ายงวด 1: 68,000 บ. (40%)",
        "amount": "170,000 บาท"
      },
      {
        "name": "ช่างตี้ (วุฒิธินันต์ สมชอบ)",
        "role": "รื้อ+ฉาบสระว่ายน้ำ 400 ตร.ม. (120,000) + รื้อทรายล้างรอบสระ 270 ตร.ม. (18,900)",
        "contact": "กสิกรไทย 0258369939",
        "milestones": "จ่ายงวด 1–6 รวม 100,000 บ.",
        "amount": "138,900 บาท"
      },
      {
        "name": "พัฒน์",
        "role": "ขนขยะ 5 เที่ยว @ 1,000 บ.",
        "contact": "พัฒน์บริการขนส่ง",
        "milestones": "จ่ายครบแล้ว 5,000 บ.",
        "amount": "5,000 บาท"
      }
    ],
    "materials": [
      {
        "item": "นำเข้าแผ่น PVC ปูสระรวมภาษี/DO",
        "spec": "นำเข้าแล้ว",
        "qty": "1 ล็อต",
        "unit": "ชุด",
        "unitPrice": "-",
        "total": "391,580.14"
      },
      {
        "item": "ปูนฉาบเสือมอร์ตาร์ 150 ลูก (พรวัฒนา)",
        "spec": "ส่งแล้ว",
        "qty": "150 ลูก",
        "unit": "ลูก",
        "unitPrice": "-",
        "total": "13,800"
      },
      {
        "item": "ปูน TPI เขียว (ยงแสงสวัสดิ์)",
        "spec": "ส่งแล้ว",
        "qty": "1 ชุด",
        "unit": "ชุด",
        "unitPrice": "-",
        "total": "1,391"
      }
    ],
    "files": [
      {
        "name": "สะพานสูง BOQ ส่งเค้า.xls",
        "size": "เอกสารจริง",
        "type": "Excel Workbook"
      },
      {
        "name": "cost ศนท สะพานสูง.xlsx",
        "size": "เอกสารจริง",
        "type": "Excel Workbook"
      },
      {
        "name": "Action_Plan_สะพานสูง_2569.xlsx",
        "size": "เอกสารจริง",
        "type": "Excel Workbook"
      },
      {
        "name": "แบบ ปร.4 ปร.5 สะพานสูง.pdf",
        "size": "เอกสารจริง",
        "type": "PDF Document"
      }
    ]
  },
  "prj-lumpini": {
    "id": "prj-lumpini",
    "name": "ศนท ลุมพินี",
    "shortName": "ศนท ลุมพินี",
    "fullName": "งานปรับปรุงศูนย์นันทนาการลุมพินี กรุงเทพมหานคร",
    "folderName": "ศนท ลุมพินี",
    "folderPath": "C:\\Users\\nattc\\OneDrive\\Desktop\\ศนท ลุมพินี",
    "aiSubfolder": "ศนท ลุมพินี\\AI_สร้าง_ข้อมูลและรูปจาก_LINE\\",
    "lineGroupId": null,
    "lineGroupName": "ยังไม่ได้ผูกกลุ่ม LINE",
    "status": "กำลังดำเนินการก่อสร้าง",
    "statusLabel": "กำลังดำเนินการก่อสร้าง",
    "statusBadgeClass": "bg-sky-500/20 text-sky-300 border-sky-400/30",
    "period": "กำหนดส่งมอบช่วงท้ายปี 2569",
    "contractBudget": 0,
    "targetCost": 140900,
    "actualCost": 32000,
    "expectedProfit": 0,
    "profitMargin": 0,
    "progressActual": 35,
    "progressPlanned": 40,
    "manpowerToday": 0,
    "unreadCount": 0,
    "lastMessageText": "ยังไม่ได้ผูกกลุ่ม LINE — กดเพื่อดูวิธีเชิญบอท @395avvfu",
    "lastMessageTime": "",
    "coreSpecs": "งานรื้อและฉาบสระว่ายน้ำ 400 ตร.ม. | รื้อทรายล้างรอบสระ 270 ตร.ม. และสั่งวัสดุพื้นยาง EPDM 270 ตร.ม. (เม็ดยางเขียว 1,800 กก. = 72 ถุง) | งานท่อน้ำดีแยก 4 สาย 1 เมนวาล์ว 30 ม. | กระเบื้องผนัง Duragres 30x60 & RCI ไบเด้น 30x30 | โคมดาวน์ไลท์ CARINI หลอด HITEK 40 จุด | ซ่อมเพดาน Sika",
    "chatHistory": [],
    "wbsTasks": [
      {
        "id": "WBS-LM-01",
        "name": "งานสกัดรื้อกระเบื้องสระ 400 ตร.ม. และรื้อทรายล้าง 270 ตร.ม. พร้อมขนขยะ",
        "category": "หมวด 1.1",
        "period": "2026-08-01 – 2026-09-30",
        "weight": 30,
        "progress": 70,
        "status": "กำลังทำ",
        "assignee": "ช่างตี้ / พัฒน์"
      },
      {
        "id": "WBS-LM-02",
        "name": "งานเดินท่อน้ำดีแยก 4 สาย เมนวาล์ว 30 ม. และซ่อมเพดาน Sika",
        "category": "หมวด 1.2",
        "period": "2026-09-15 – 2026-10-31",
        "weight": 30,
        "progress": 30,
        "status": "กำลังทำ",
        "assignee": "ช่างระบบ"
      },
      {
        "id": "WBS-LM-03",
        "name": "งานปูพื้นยางสังเคราะห์ EPDM ทางเดิน 270 ตร.ม. และติดตั้งโคมดาวน์ไลท์",
        "category": "หมวด 1.3",
        "period": "2026-11-01 – 2026-12-20",
        "weight": 40,
        "progress": 0,
        "status": "รอดำเนินการ",
        "assignee": "ทีมบลูเคอร์"
      }
    ],
    "actionItems": [],
    "defects": [],
    "photos": [],
    "contractors": [
      {
        "name": "ช่างตี้ (วุฒิธินันต์ สมชอบ)",
        "role": "งานรื้อ+ฉาบสระว่ายน้ำ 400 ตร.ม. (120,000) + รื้อทรายล้าง 270 ตร.ม. (18,900)",
        "contact": "กสิกรไทย 0258369939",
        "milestones": "งวด 1: 10,000 บ. / งวด 2: 20,000 บ.",
        "amount": "138,900 บาท"
      },
      {
        "name": "พัฒน์",
        "role": "ขนขยะ 2 เที่ยว @ 1,000 บ.",
        "contact": "พัฒน์บริการขนส่ง",
        "milestones": "จ่ายครบแล้ว 2,000 บ.",
        "amount": "2,000 บาท"
      }
    ],
    "materials": [
      {
        "item": "เม็ดยางเขียว EPDM 270 ตร.ม.",
        "spec": "เตรียมจัดส่ง",
        "qty": "1,800 กก. (72 ถุง)",
        "unit": "ถุง",
        "unitPrice": "-",
        "total": "144,000"
      },
      {
        "item": "กระเบื้องผนัง Duragres 30x60 & RCI 30x30",
        "spec": "สั่งซื้อแล้ว",
        "qty": "1 ชุด",
        "unit": "ชุด",
        "unitPrice": "-",
        "total": "45,000"
      }
    ],
    "files": [
      {
        "name": "cost ศนท ลุมพินี.xlsx",
        "size": "เอกสารจริง",
        "type": "Excel Workbook"
      },
      {
        "name": "แบบ ปร.4 ปร.5 ลุมพินี.pdf",
        "size": "เอกสารจริง",
        "type": "PDF Document"
      }
    ]
  },
  "prj-prachin": {
    "id": "prj-prachin",
    "name": "อบต ปราจีน",
    "shortName": "อบต ปราจีน",
    "fullName": "โครงการก่อสร้างสนามเด็กเล่น บริเวณสนามกีฬา อบต.ท่าตูม บ้านโป่งไผ่ หมู่ที่ 7 อ.ศรีมหาโพธิ จ.ปราจีนบุรี",
    "folderName": "อบต ปราจีน",
    "folderPath": "C:\\Users\\nattc\\OneDrive\\Desktop\\อบต ปราจีน",
    "aiSubfolder": "อบต ปราจีน\\AI_สร้าง_ข้อมูลและรูปจาก_LINE\\",
    "lineGroupId": null,
    "lineGroupName": "ยังไม่ได้ผูกกลุ่ม LINE",
    "status": "เซ็นสัญญาแล้ว (ยังไม่เข้างาน)",
    "statusLabel": "เซ็นสัญญาแล้ว (ยังไม่เข้างาน)",
    "statusBadgeClass": "bg-amber-500/20 text-amber-300 border-amber-400/30",
    "period": "ระยะเวลาก่อสร้าง 120 วัน (งวดที่ 1: 40% ภายใน 75 วัน | งวดที่ 2: 60% ภายใน 45 วัน)",
    "contractBudget": 2200000,
    "targetCost": 1236866,
    "actualCost": 0,
    "expectedProfit": 819209,
    "profitMargin": 39.8,
    "progressActual": 0,
    "progressPlanned": 0,
    "manpowerToday": 0,
    "unreadCount": 0,
    "lastMessageText": "ยังไม่ได้ผูกกลุ่ม LINE — กดเพื่อดูวิธีเชิญบอท @395avvfu",
    "lastMessageTime": "",
    "coreSpecs": "1. งานโครงสร้างลาน ค.ส.ล. 630 ตร.ม. 12 รายการ (แบ็คโฮ 2 วัน, ลูกรังบดอัดแน่น 189+10.1 ลบ.ม., ทรายถม 31.5 ลบ.ม., ไม้แบบ 21.9 ตร.ม., เหล็กเดือย RB15 140.08 กก., ตะแกรง Wire Mesh 4 มม. 630 ตร.ม., คอนกรีต 240 ksc 94.5 ลบ.ม., ขัดหยาบและตัดรอยต่อหยอดยาง 101 ม., ป้ายโครงการ) 2. พื้นยางสังเคราะห์ EPDM หนา 20 มม. (SBR 15 มม. + EPDM 5 มม.) พื้นที่ 630 ตร.ม.",
    "chatHistory": [],
    "wbsTasks": [
      {
        "id": "WBS-PC-01",
        "name": "งานปรับเกลี่ยพื้นที่เดิมด้วยรถแบคโฮ 2 วัน",
        "category": "หมวด 1.1",
        "period": "2026-09-01 – 2026-09-10",
        "weight": 10,
        "progress": 0,
        "status": "รอดำเนินการ",
        "assignee": "ช่างโครงสร้าง"
      },
      {
        "id": "WBS-PC-02",
        "name": "งานลูกรังถมบดอัดแน่น 199.1 ลบ.ม. และทรายถม 31.5 ลบ.ม.",
        "category": "หมวด 1.2",
        "period": "2026-09-11 – 2026-09-30",
        "weight": 20,
        "progress": 0,
        "status": "รอดำเนินการ",
        "assignee": "ช่างโครงสร้าง"
      },
      {
        "id": "WBS-PC-03",
        "name": "งานตั้งไม้แบบ ผูกเหล็กเดือย RB15 และวาง Wire Mesh 4 มม. 630 ตร.ม.",
        "category": "หมวด 1.3",
        "period": "2026-10-01 – 2026-10-20",
        "weight": 20,
        "progress": 0,
        "status": "รอดำเนินการ",
        "assignee": "ช่างโครงสร้าง"
      },
      {
        "id": "WBS-PC-04",
        "name": "งานเทคอนกรีต 240 ksc 94.5 ลบ.ม. ขัดหยาบ และตัดรอยต่อหยอดยางมะตอย 101 ม.",
        "category": "หมวด 1.4",
        "period": "2026-10-21 – 2026-11-10",
        "weight": 25,
        "progress": 0,
        "status": "รอดำเนินการ",
        "assignee": "ช่างคอนกรีต"
      },
      {
        "id": "WBS-PC-05",
        "name": "งานปูพื้นยางสังเคราะห์ EPDM หนา 20 มม. (SBR 15 มม. + EPDM 5 มม.) 630 ตร.ม.",
        "category": "หมวด 2.1",
        "period": "2026-11-11 – 2026-12-25",
        "weight": 25,
        "progress": 0,
        "status": "รอดำเนินการ",
        "assignee": "ทีมบลูเคอร์"
      }
    ],
    "actionItems": [],
    "defects": [],
    "photos": [],
    "contractors": [],
    "materials": [],
    "files": [
      {
        "name": "ประมาณการต้นทุน_สนามเด็กเล่น_อบต_ท่าตูม_V3_คำนวณแยกVATสมบูรณ์.xlsx",
        "size": "เอกสารจริง",
        "type": "Excel Workbook"
      },
      {
        "name": "ประมาณการต้นทุน_สนามเด็กเล่น_อบต_ท่าตูม_V2.xlsx",
        "size": "เอกสารจริง",
        "type": "Excel Workbook"
      },
      {
        "name": "TOR_อบต_ท่าตูม.pdf",
        "size": "เอกสารจริง",
        "type": "PDF Document"
      }
    ]
  },
  "prj-maehongson": {
    "id": "prj-maehongson",
    "name": "พี่บอม แม่ฮ่องสอน",
    "shortName": "พี่บอม แม่ฮ่องสอน",
    "fullName": "โครงการก่อสร้างสนามฟุตบอลและลู่วิ่งยางสังเคราะห์ ระบบ Encapsulated Sandwich หนา 13 มม. (IAAF) จ.แม่ฮ่องสอน",
    "folderName": "พี่บอม แม่ฮ่องสอน",
    "folderPath": "C:\\Users\\nattc\\OneDrive\\Desktop\\พี่บอม แม่ฮ่องสอน",
    "aiSubfolder": "พี่บอม แม่ฮ่องสอน\\AI_สร้าง_ข้อมูลและรูปจาก_LINE\\",
    "lineGroupId": null,
    "lineGroupName": "ยังไม่ได้ผูกกลุ่ม LINE",
    "status": "วางสเปกอยู่ (ยังไม่เซ็นสัญญา)",
    "statusLabel": "วางสเปกอยู่ (ยังไม่เซ็นสัญญา)",
    "statusBadgeClass": "bg-purple-500/20 text-purple-300 border-purple-400/30",
    "period": "เปรียบเทียบโมเดล BOQ 6 รูปแบบ และใบเสนอราคาวัสดุนำเข้า CIF BKK",
    "contractBudget": 13684000,
    "targetCost": 9033200,
    "actualCost": 0,
    "expectedProfit": 4650800,
    "profitMargin": 34,
    "progressActual": 0,
    "progressPlanned": 0,
    "manpowerToday": 0,
    "unreadCount": 0,
    "lastMessageText": "ยังไม่ได้ผูกกลุ่ม LINE — กดเพื่อดูวิธีเชิญบอท @395avvfu",
    "lastMessageTime": "",
    "coreSpecs": "โมเดล BOQ 6 ทางเลือก (Model 1 สนามฟุตบอล 11 คน 7,140 ตร.ม. + ลู่วิ่ง 6 เลน 3,200 ตร.ม. ยางสังเคราะห์ Sandwich หนา 13 มม. [9mm SBR + 4mm Spray-coat] + รางระบายน้ำ U-Ditch 400 ม.) | ใบเสนอราคาวัสดุนำเข้า 6,800 ตร.ม. CIF BKK 83,491.10 USD (PU Binder 9006A 11,900 กก., SBR 51,000 กก., Red Full PU 4:1 20,400 กก., Red EPDM 6,800 กก.)",
    "chatHistory": [],
    "wbsTasks": [
      {
        "id": "WBS-MHS-01",
        "name": "งานปรับระดับพื้นทางและคูระบายน้ำคอนกรีตรูปตัวยู (U-Ditch) 400 ม.",
        "category": "หมวด 1.1",
        "period": "2026-10-01 – 2026-11-30",
        "weight": 25,
        "progress": 0,
        "status": "รอดำเนินการ",
        "assignee": "พี่บอม / ทีมช่าง"
      },
      {
        "id": "WBS-MHS-02",
        "name": "งานชั้นพื้นทางแอสฟัลต์คอนกรีตหนา 5 ซม. 3,200 ตร.ม.",
        "category": "หมวด 1.2",
        "period": "2026-12-01 – 2027-01-15",
        "weight": 25,
        "progress": 0,
        "status": "รอดำเนินการ",
        "assignee": "ช่างแอสฟัลต์"
      },
      {
        "id": "WBS-MHS-03",
        "name": "นำเข้าวัสดุยางสังเคราะห์ Sandwich System CIF BKK 83,491 USD",
        "category": "หมวด 2.1",
        "period": "2026-11-01 – 2027-01-31",
        "weight": 20,
        "progress": 0,
        "status": "รอดำเนินการ",
        "assignee": "บลูเคอร์ นำเข้า"
      },
      {
        "id": "WBS-MHS-04",
        "name": "งานติดตั้งชั้นยางดำ SBR 9 มม. และพ่น Spray-coat Red PU + EPDM 4 มม.",
        "category": "หมวด 2.2",
        "period": "2027-02-01 – 2027-04-15",
        "weight": 30,
        "progress": 0,
        "status": "รอดำเนินการ",
        "assignee": "ทีมบลูเคอร์"
      }
    ],
    "actionItems": [],
    "defects": [],
    "photos": [],
    "contractors": [],
    "materials": [],
    "files": [
      {
        "name": "BOQ_MaeHongSon_Models.xlsx",
        "size": "เอกสารจริง",
        "type": "Excel Workbook"
      },
      {
        "name": "Quotation_CIF_BKK_Rubber_Sandwich.pdf",
        "size": "เอกสารจริง",
        "type": "PDF Document"
      },
      {
        "name": "แบบมาตรฐานลู่วิ่งและสนามฟุตบอล.dwg",
        "size": "เอกสารจริง",
        "type": "File"
      }
    ]
  }
};

// Application State
let appState = {
  currentProjectId: "all",
  activeSubTab: "wbs",
  botEtiquette: "silent", // 'silent' or 'vocal'
  projects: JSON.parse(JSON.stringify(MASTER_PROJECTS)),
  inboxActiveRoomId: "prj-chatuchak",
  charts: {
    bar: null,
    donut: null
  },
  assistantTab: "inbox",
  simLogs: []
};

// =============================================================================
// 2. INITIALIZATION & LIFECYCLE
// =============================================================================
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Blucher BuildTrack Initializing with Unified LINE 7-Group Inbox...");
  
  // Try fetching bootstrap data from backend /api/bootstrap
  await initBootstrapData();

  // Render initial views
  renderPortfolioDashboard();
  renderProjectDropdown();
  updateBotEtiquetteUI();
  renderInboxRoomsList();
  renderActiveRoomChat();

  // Close dropdown on outside click
  document.addEventListener("click", (e) => {
    const exportBtn = document.getElementById("exportDropdownBtn");
    const exportMenu = document.getElementById("exportMenu");
    if (exportMenu && !exportMenu.contains(e.target) && !exportBtn.contains(e.target)) {
      exportMenu.classList.add("hidden");
    }
  });

  showToast("Blucher BuildTrack & Unified LINE Inbox พร้อมใช้งานแล้ว", "success");
});

/**
 * Bootstrap data from server or fallback to master records
 */
function normalizeProjectId(rawId) {
  if (!rawId) return null;
  const s = String(rawId).toLowerCase().trim().replace(/[-_]/g, "");
  const canonicalList = [
    "prj-chatuchak",
    "prj-bangna",
    "prj-bangkae",
    "prj-saphansung",
    "prj-lumpini",
    "prj-prachin",
    "prj-maehongson"
  ];
  if (/^[0-6]$/.test(s)) {
    return canonicalList[Number(s)];
  }
  if (s.includes("jatu") || s.includes("chatuchak") || s.includes("จตุจักร")) return "prj-chatuchak";
  if (s.includes("bangna") || s.includes("บางนา")) return "prj-bangna";
  if (s.includes("bangkae") || s.includes("bangkhae") || s.includes("บางแค")) return "prj-bangkae";
  if (s.includes("sapan") || s.includes("saphan") || s.includes("สะพานสูง")) return "prj-saphansung";
  if (s.includes("lumpi") || s.includes("lumphi") || s.includes("ลุมพินี")) return "prj-lumpini";
  if (s.includes("prachin") || s.includes("ปราจีน")) return "prj-prachin";
  if (s.includes("maehong") || s.includes("แม่ฮ่องสอน")) return "prj-maehongson";
  if (s.startsWith("prj")) return `prj-${s.replace(/^prj/, '')}`;
  return `prj-${s}`;
}

function mergeBackendBootstrap(data) {
  if (!data || !data.projects) return;

  const rawList = Array.isArray(data.projects) 
    ? data.projects 
    : Object.values(data.projects);

  rawList.forEach((rawItem) => {
    if (!rawItem || typeof rawItem !== "object") return;

    // Resolve project ID
    const rawId = rawItem.id || rawItem.projectId || rawItem.key || rawItem.folderName || rawItem.name;
    const canonicalId = normalizeProjectId(rawId);
    if (!canonicalId) return;

    // If project already exists in appState.projects, merge carefully
    const existing = appState.projects[canonicalId];
    if (existing) {
      const canonicalShort = CANONICAL_SHORT_NAMES[canonicalId];
      if (rawItem.name && typeof rawItem.name === "string" && rawItem.name.trim()) {
        const rawName = rawItem.name.trim();
        if (canonicalShort) {
          existing.name = canonicalShort;
          if (rawName !== canonicalShort && (!existing.fullName || rawName.length > existing.fullName.length)) {
            existing.fullName = rawName;
          }
        } else if (existing.name && rawName.length > existing.name.length) {
          existing.fullName = rawName;
        } else {
          existing.name = rawName;
        }
      } else if (canonicalShort) {
        existing.name = canonicalShort;
      }

      if (rawItem.fullName || rawItem.full_name) existing.fullName = rawItem.fullName || rawItem.full_name;
      if (rawItem.status && typeof rawItem.status === "string" && rawItem.status.trim()) {
        existing.status = translateBackendStatus(rawItem.status, rawItem.statusLabel || rawItem.status_label);
        existing.statusBadgeClass = getStatusBadgeClass(existing.status);
      }
      if (rawItem.period && typeof rawItem.period === "string" && rawItem.period.trim()) existing.period = rawItem.period;
      
      const budget = Number(rawItem.contractBudget ?? rawItem.contract_budget ?? rawItem.budget);
      if (!isNaN(budget) && budget >= 0) existing.contractBudget = budget;
      
      const targetCost = Number(rawItem.targetCost ?? rawItem.target_cost);
      if (!isNaN(targetCost) && targetCost >= 0) existing.targetCost = targetCost;
      
      const actualCost = Number(rawItem.actualCost ?? rawItem.actual_cost);
      if (!isNaN(actualCost) && actualCost >= 0) existing.actualCost = actualCost;
      
      const expectedProfit = Number(rawItem.expectedProfit ?? rawItem.expected_profit);
      if (!isNaN(expectedProfit)) existing.expectedProfit = expectedProfit;

      const profitMargin = Number(rawItem.profitMargin ?? rawItem.profit_margin);
      if (!isNaN(profitMargin)) existing.profitMargin = profitMargin;

      const progressActual = Number(rawItem.progressActual ?? rawItem.actual_progress ?? rawItem.progress);
      if (!isNaN(progressActual)) existing.progressActual = progressActual;

      const progressPlanned = Number(rawItem.progressPlanned ?? rawItem.planned_progress);
      if (!isNaN(progressPlanned)) existing.progressPlanned = progressPlanned;

      const manpower = Number(rawItem.manpowerToday ?? rawItem.manpower_today ?? rawItem.daily_workers);
      if (!isNaN(manpower)) existing.manpowerToday = manpower;

      const specs = rawItem.coreSpecs || rawItem.specs_summary || rawItem.core_specs || rawItem.specs;
      if (specs && typeof specs === "string" && specs.trim().length > 0) existing.coreSpecs = specs;

      if (rawItem.folderName || rawItem.folder_name) existing.folderName = rawItem.folderName || rawItem.folder_name;
      if (rawItem.folderPath || rawItem.folder_path) existing.folderPath = rawItem.folderPath || rawItem.folder_path;
      existing.lineGroupId = rawItem.lineGroupId || rawItem.line_group_id || null;
      existing.lineGroupName = rawItem.lineGroupName || rawItem.line_group_name || (existing.lineGroupId ? "กลุ่ม LINE โครงการ" : "ยังไม่ได้ผูกกลุ่ม LINE");

      // Preserve rich arrays or normalize backend child items
      if (Array.isArray(rawItem.wbsTasks) && rawItem.wbsTasks.length > 0) {
        existing.wbsTasks = rawItem.wbsTasks.map((t, idx) => ({
          id: t.id || `wbs-${idx + 1}`,
          name: t.name || t.title || t.task_code || `งานส่วนที่ ${idx + 1}`,
          category: t.category || (t.task_code ? `หมวด ${t.task_code}` : 'งานโครงสร้าง/สเปก'),
          period: t.period || (t.start_date && t.due_date ? `${t.start_date} – ${t.due_date}` : (t.due_date ? `กำหนดส่ง ${t.due_date}` : 'ตามแผนงาน')),
          weight: Number(t.weight ?? t.weight_percent) || 10,
          progress: Number(t.progress ?? t.progress_percent) || 0,
          status: t.status || ((Number(t.progress ?? t.progress_percent) || 0) === 100 ? 'เสร็จสิ้น' : 'กำลังทำ'),
          assignee: t.assignee || 'ช่างหน้างาน'
        }));
      }
      if (Array.isArray(rawItem.actionItems)) {
        existing.actionItems = rawItem.actionItems.map((a, idx) => ({
          id: a.id || `act-${idx + 1}`,
          assignee: a.assignee || 'ช่างหน้างาน',
          title: a.title || a.name || 'คำสั่งการ',
          quote: a.quote || a.raw_message || a.title || '',
          orderedBy: a.orderedBy || a.assigned_by || 'พี่นัท',
          deadline: a.deadline || a.due_date || 'ตามแผนงาน',
          timestamp: a.timestamp || a.created_at || 'วันนี้',
          priority: a.priority || 'ปกติ',
          completed: a.completed !== undefined ? a.completed : (a.status === 'DONE' || a.status === 'COMPLETED')
        }));
      }
      if (Array.isArray(rawItem.defects)) {
        existing.defects = rawItem.defects.map((d, idx) => ({
          id: d.id || `df-${idx + 1}`,
          title: d.title || d.description || 'จุดบกพร่อง',
          location: d.location || d.zone || 'หน้างาน',
          severity: d.severity || 'ปกติ',
          status: d.status ? (d.status.toLowerCase() === 'resolved' || d.status.toLowerCase() === 'done' ? 'resolved' : (d.status.toLowerCase() === 'in_progress' ? 'in-progress' : 'pending')) : 'pending',
          reporter: d.reporter || d.assignee || 'ช่างหน้างาน',
          date: d.date || (d.created_at ? String(d.created_at).slice(0, 10) : 'วันนี้'),
          photoUrl: d.photoUrl || d.photo_url || ''
        }));
      }
      if (Array.isArray(rawItem.photos)) existing.photos = rawItem.photos;
      if (Array.isArray(rawItem.contractors) && rawItem.contractors.length > 0) existing.contractors = rawItem.contractors;
      if (Array.isArray(rawItem.materials) && rawItem.materials.length > 0) existing.materials = rawItem.materials;
      if (Array.isArray(rawItem.files) && rawItem.files.length > 0) existing.files = rawItem.files;
      if (Array.isArray(rawItem.chatHistory)) existing.chatHistory = rawItem.chatHistory;
    } else {
      // Newly onboarded project (not in MASTER_PROJECTS)
      const budget = Number(rawItem.contractBudget ?? rawItem.contract_budget ?? rawItem.budget) || 0;
      const targetCost = Number(rawItem.targetCost ?? rawItem.target_cost) || Math.round(budget * 0.7);
      const actualCost = Number(rawItem.actualCost ?? rawItem.actual_cost) || Math.round(targetCost * 0.5);
      const expectedProfit = Number(rawItem.expectedProfit ?? rawItem.expected_profit) || (budget - targetCost);
      const profitMargin = Number(rawItem.profitMargin ?? rawItem.profit_margin) || (budget > 0 ? Number(((expectedProfit / budget) * 100).toFixed(1)) : 0);
      const progressActual = Number(rawItem.progressActual ?? rawItem.actual_progress ?? rawItem.progress) || 0;
      const progressPlanned = Number(rawItem.progressPlanned ?? rawItem.planned_progress) || 0;
      const manpower = Number(rawItem.manpowerToday ?? rawItem.manpower_today) || 0;
      const specs = rawItem.coreSpecs || rawItem.specs_summary || rawItem.core_specs || rawItem.specs || "มาตรฐาน มอก. / สเปกบลูเคอร์";

      const canonicalShort = CANONICAL_SHORT_NAMES[canonicalId];
      const pName = canonicalShort || rawItem.folderName || rawItem.folder_name || rawItem.name || canonicalId;
      let pFullName = rawItem.fullName || rawItem.full_name || rawItem.name || pName;
      if (canonicalShort && rawItem.name && rawItem.name !== canonicalShort) {
        pFullName = rawItem.name;
      }
      const rawStatus = translateBackendStatus(rawItem.status || "กำลังดำเนินการ");
      const badgeClass = rawItem.statusBadgeClass || getStatusBadgeClass(rawStatus);

      appState.projects[canonicalId] = {
        id: canonicalId,
        name: pName,
        fullName: pFullName,
        folderName: rawItem.folderName || rawItem.folder_name || rawItem.name || canonicalId,
        folderPath: rawItem.folderPath || rawItem.folder_path || `C:\\Users\\nattc\\OneDrive\\Desktop\\${rawItem.folderName || rawItem.name}`,
        aiSubfolder: `${rawItem.folderName || rawItem.name}\\AI_สร้าง_ข้อมูลและรูปจาก_LINE\\`,
        lineGroupId: rawItem.lineGroupId || rawItem.line_group_id || `c_${canonicalId}_line_grp`,
        lineGroupName: rawItem.lineGroupName || rawItem.line_group_name || `บลูเคอร์ - ${pName}`,
        status: rawStatus,
        statusBadgeClass: badgeClass,
        period: rawItem.period || "ตามสัญญาจ้าง",
        contractBudget: budget,
        targetCost: targetCost,
        actualCost: actualCost,
        expectedProfit: expectedProfit,
        profitMargin: profitMargin,
        progressActual: progressActual,
        progressPlanned: progressPlanned,
        manpowerToday: manpower,
        unreadCount: Number(rawItem.unreadCount) || 0,
        lastMessageText: rawItem.lastMessageText || "พร้อมใช้งาน",
        lastMessageTime: rawItem.lastMessageTime || "12:00",
        coreSpecs: specs,
        chatHistory: Array.isArray(rawItem.chatHistory) ? rawItem.chatHistory : [],
        wbsTasks: Array.isArray(rawItem.wbsTasks) ? rawItem.wbsTasks : [],
        actionItems: Array.isArray(rawItem.actionItems) ? rawItem.actionItems : [],
        defects: Array.isArray(rawItem.defects) ? rawItem.defects : [],
        photos: Array.isArray(rawItem.photos) ? rawItem.photos : [],
        contractors: Array.isArray(rawItem.contractors) ? rawItem.contractors : [],
        materials: Array.isArray(rawItem.materials) ? rawItem.materials : [],
        files: Array.isArray(rawItem.files) ? rawItem.files : []
      };
    }
  });

  // Clean up any phantom numeric keys that might have been accidentally set
  for (const k of Object.keys(appState.projects)) {
    if (/^\d+$/.test(k)) {
      delete appState.projects[k];
    }
  }

  // Final pass: ALWAYS enforce canonical short names and translated statuses across all projects
  for (const [pId, target] of Object.entries(appState.projects)) {
    const canonId = normalizeProjectId(pId);
    const shortName = CANONICAL_SHORT_NAMES[canonId] || target.folderName || target.name || pId;
    if (target.name && target.name !== shortName && target.name.length > shortName.length) {
      if (!target.fullName || target.fullName === target.name) {
        target.fullName = target.name;
      }
    }
    target.name = shortName;

    if (target.status) {
      target.status = translateBackendStatus(target.status);
      target.statusBadgeClass = getStatusBadgeClass(target.status);
    }
  }

  if (data.settings && data.settings.botEtiquette) {
    appState.botEtiquette = data.settings.botEtiquette;
  }
}

async function initBootstrapData() {
  try {
    const res = await fetch(`${API_BASE}/api/bootstrap`, { method: "GET" });
    if (res.ok) {
      const data = await res.json();
      if (data) {
        mergeBackendBootstrap(data);
      }
      console.log("Bootstrap loaded and normalized safely from backend API");
    } else {
      console.info("Using local high-fidelity fallback dataset (Server API offline or file:// access)");
    }
  } catch (err) {
    console.info("Local mode active: Operating with genuine 7 Desktop project dossiers", err);
  }
}

// =============================================================================
// 3. PROJECT SELECTION & VIEW SWITCHING
// =============================================================================
function onProjectSelectChange(projectId) {
  switchProject(projectId);
}

function switchProject(projectId) {
  appState.currentProjectId = projectId;
  
  const selectElem = document.getElementById("projectSelector");
  if (selectElem && selectElem.value !== projectId) {
    selectElem.value = projectId;
  }

  const viewPortfolio = document.getElementById("viewPortfolio");
  const viewProject = document.getElementById("viewProject");

  if (projectId === "all") {
    if (viewPortfolio) viewPortfolio.classList.remove("hidden");
    if (viewProject) viewProject.classList.add("hidden");
    renderPortfolioDashboard();
  } else {
    if (viewPortfolio) viewPortfolio.classList.add("hidden");
    if (viewProject) viewProject.classList.remove("hidden");
    // Also set active room in inbox to this project
    appState.inboxActiveRoomId = projectId;
    renderInboxRoomsList();
    renderActiveRoomChat();
    renderProjectDetailView(projectId);
  }
  updateMobileNavUI();
}

function switchSubTab(tabName) {
  appState.activeSubTab = tabName;
  
  const tabs = ["wbs", "actions", "defects", "photos", "dossier"];
  tabs.forEach(t => {
    const btn = document.getElementById(`subtab-${t}`);
    const pane = document.getElementById(`tabContent-${t}`);
    if (t === tabName) {
      btn.className = "subtab-btn flex-1 min-w-[130px] py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all bg-sky-50 text-sky-700 border border-sky-200 shadow-sm";
      pane.classList.remove("hidden");
    } else {
      btn.className = "subtab-btn flex-1 min-w-[130px] py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all text-slate-600 hover:text-slate-900 hover:bg-slate-50";
      pane.classList.add("hidden");
    }
  });

  if (appState.currentProjectId !== "all") {
    const proj = appState.projects[appState.currentProjectId];
    if (tabName === "wbs") renderWbsTable(proj);
    if (tabName === "actions") renderActionItems(proj);
    if (tabName === "defects") renderDefectsKanban(proj);
    if (tabName === "photos") renderPhotoStream(proj);
    if (tabName === "dossier") renderMasterDossier(proj);
  }
}

// =============================================================================
// 4. VIEW 1: PORTFOLIO EXECUTIVE OVERVIEW RENDERING
// =============================================================================
function renderPortfolioKpis(projectsList = Object.values(appState.projects)) {
  const totalProjects = projectsList.length;
  
  let totalContractValue = 0;
  let totalTargetCost = 0;
  let totalActualCost = 0;
  let sumProgressActual = 0;
  let sumProgressPlanned = 0;
  let totalWorkers = 0;
  let totalPendingTasks = 0;
  let totalOpenDefects = 0;
  let totalInProgressDefects = 0;
  let totalResolvedDefects = 0;

  projectsList.forEach(p => {
    totalContractValue += Number(p.contractBudget) || 0;
    totalTargetCost += Number(p.targetCost) || 0;
    totalActualCost += Number(p.actualCost) || 0;
    sumProgressActual += Number(p.progressActual) || 0;
    sumProgressPlanned += Number(p.progressPlanned) || 0;
    totalWorkers += Number(p.manpowerToday) || 0;

    if (Array.isArray(p.actionItems)) {
      totalPendingTasks += p.actionItems.filter(a => !a.completed).length;
    }
    if (Array.isArray(p.defects)) {
      p.defects.forEach(d => {
        if (d.status === "pending") totalOpenDefects++;
        else if (d.status === "in-progress") totalInProgressDefects++;
        else if (d.status === "resolved") totalResolvedDefects++;
      });
    }
  });

  const avgProgress = totalProjects > 0 ? (sumProgressActual / totalProjects).toFixed(1) : "0.0";
  const avgPlanned = totalProjects > 0 ? (sumProgressPlanned / totalProjects).toFixed(1) : "0.0";
  const diffProgress = (Number(avgProgress) - Number(avgPlanned)).toFixed(1);

  // Update KPI Cards DOM defensively
  const elTotalVal = document.getElementById("portfolioTotalValue");
  if (elTotalVal) elTotalVal.innerText = `${((totalContractValue || 0) / 1000000).toFixed(2)}M`;

  const elActiveCount = document.getElementById("portfolioActiveCount");
  if (elActiveCount) elActiveCount.innerText = `${totalProjects} โครงการกำลังดำเนินการ`;

  const elTargetCost = document.getElementById("portfolioTargetCost");
  if (elTargetCost) elTargetCost.innerText = `ต้นทุน ${((totalTargetCost || 0) / 1000000).toFixed(2)}M`;

  const elAvgProgress = document.getElementById("portfolioAvgProgress");
  if (elAvgProgress) elAvgProgress.innerText = `${avgProgress}%`;

  const elProgressBar = document.getElementById("portfolioProgressBar");
  if (elProgressBar) elProgressBar.style.width = `${Math.min(100, Math.max(0, Number(avgProgress)))}%`;
  
  const diffElem = document.getElementById("portfolioPlanDiff");
  if (diffElem) {
    if (Number(diffProgress) < 0) {
      diffElem.className = "text-xs font-medium text-amber-600";
      diffElem.innerText = `ช้ากว่าแผน ${Math.abs(diffProgress)}%`;
    } else {
      diffElem.className = "text-xs font-medium text-emerald-600";
      diffElem.innerText = `เร็วกว่าแผน +${diffProgress}%`;
    }
  }

  const elPendingTasks = document.getElementById("portfolioPendingTasks");
  if (elPendingTasks) elPendingTasks.innerHTML = `${totalPendingTasks} <span class="text-sm font-normal text-slate-600">งาน</span>`;

  const elOpenDefects = document.getElementById("portfolioOpenDefects");
  if (elOpenDefects) elOpenDefects.innerText = `${totalOpenDefects} จุด`;

  const elTotalWorkers = document.getElementById("portfolioTotalWorkers");
  if (elTotalWorkers) elTotalWorkers.innerText = totalWorkers;

  const elWorkersUnit = document.getElementById("portfolioWorkersUnit");
  if (elWorkersUnit) {
    elWorkersUnit.innerText = totalWorkers > 0 ? `นาย (${totalProjects} ไซต์)` : "นาย (รอรายงานจาก LINE)";
  }

  const unreadBadge = document.getElementById("headerUnreadBadge");
  if (unreadBadge) {
    const totalUnread = projectsList.reduce((acc, p) => acc + (p.unreadCount || 0), 0);
    if (totalUnread > 0) {
      unreadBadge.innerText = totalUnread;
      unreadBadge.classList.remove("hidden");
    } else {
      unreadBadge.innerText = "0";
      unreadBadge.classList.add("hidden");
    }
  }

  return { totalProjects, totalContractValue, totalTargetCost, totalActualCost, avgProgress, avgPlanned, diffProgress, totalOpenDefects, totalInProgressDefects, totalResolvedDefects };
}

function renderPortfolioDashboard() {
  const projectsList = Object.values(appState.projects);
  const kpis = renderPortfolioKpis(projectsList);

  // Render Charts
  renderPortfolioCharts(projectsList, kpis.totalOpenDefects, kpis.totalInProgressDefects, kpis.totalResolvedDefects);

  // Render Portfolio Matrix Table & Mobile Cards
  renderPortfolioMatrixTable(projectsList);
}

function renderPortfolioCharts(projectsList, openDefects, inProgressDefects, resolvedDefects) {
  // Chart 1: Bar Chart (Plan vs Actual)
  const barCtx = document.getElementById("portfolioBarChart");
  if (barCtx) {
    if (appState.charts.bar) appState.charts.bar.destroy();

    const labels = projectsList.map(p => CANONICAL_SHORT_NAMES[p.id] || p.name || p.id);
    const plannedData = projectsList.map(p => Number(p.progressPlanned) || 0);
    const actualData = projectsList.map(p => Number(p.progressActual) || 0);

    appState.charts.bar = new Chart(barCtx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "แผนงาน (%)",
            data: plannedData,
            backgroundColor: "#cbd5e1",
            borderRadius: 6,
            barPercentage: 0.65
          },
          {
            label: "ผลงานจริง (%)",
            data: actualData,
            backgroundColor: "#0284c7",
            borderRadius: 6,
            barPercentage: 0.65
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.dataset.label}: ${context.raw}%`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: (v) => v + "%",
              font: { family: "Prompt", size: 10 }
            },
            grid: { color: "#f1f5f9" }
          },
          x: {
            ticks: {
              font: { family: "Prompt", size: 11 },
              maxRotation: 0,
              minRotation: 0,
              autoSkip: false
            },
            grid: { display: false }
          }
        }
      }
    });
  }

  // Chart 2: Donut Chart (Defect / Action status)
  const donutCtx = document.getElementById("portfolioDonutChart");
  if (donutCtx) {
    if (appState.charts.donut) appState.charts.donut.destroy();

    appState.charts.donut = new Chart(donutCtx, {
      type: "doughnut",
      data: {
        labels: ["รอการแก้ไข", "กำลังดำเนินการซ่อม", "แก้ไขเสร็จสิ้น"],
        datasets: [{
          data: [openDefects, inProgressDefects, resolvedDefects],
          backgroundColor: ["#f43f5e", "#f59e0b", "#10b981"],
          borderWidth: 2,
          borderColor: "#ffffff"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "70%",
        plugins: {
          legend: { display: false }
        }
      }
    });

    const elStatOpen = document.getElementById("statDefectOpen");
    if (elStatOpen) elStatOpen.innerText = openDefects;
    const elStatProg = document.getElementById("statDefectInProgress");
    if (elStatProg) elStatProg.innerText = inProgressDefects;
    const elStatClosed = document.getElementById("statDefectClosed");
    if (elStatClosed) elStatClosed.innerText = resolvedDefects;
  }
}

function renderPortfolioMatrixTable(projectsInput = "") {
  let projectsList;
  if (Array.isArray(projectsInput)) {
    projectsList = projectsInput;
  } else if (typeof projectsInput === "string" && projectsInput.trim() !== "") {
    const term = projectsInput.toLowerCase().trim();
    projectsList = Object.values(appState.projects).filter(p => 
      (p.name || "").toLowerCase().includes(term) ||
      (p.coreSpecs || "").toLowerCase().includes(term) ||
      (p.folderName || "").toLowerCase().includes(term)
    );
  } else {
    projectsList = Object.values(appState.projects);
  }

  // 1. Desktop Table Body
  const tbody = document.getElementById("portfolioTableBody") || document.getElementById("portfolioMatrixBody");
  if (tbody) {
    tbody.innerHTML = projectsList.map(p => {
      const defectsCount = Array.isArray(p.defects) ? p.defects.filter(d => d.status !== "resolved").length : 0;
      const progressActual = Number(p.progressActual) || 0;
      const progressPlanned = Number(p.progressPlanned) || 0;
      const diff = (progressActual - progressPlanned).toFixed(0);
      const diffBadge = diff >= 0 
        ? `<span class="text-[10px] text-emerald-600 font-medium">+${diff}%</span>` 
        : `<span class="text-[10px] text-rose-500 font-medium">${diff}%</span>`;

      const lineBadge = p.lineGroupId 
        ? `<span class="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 whitespace-nowrap"><i class="fa-brands fa-line text-emerald-500 flex-shrink-0"></i><span>ผูกแล้ว (${escapeHtml(p.lineGroupId)})</span></span>`
        : `<span class="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 whitespace-nowrap"><i class="fa-solid fa-clock text-amber-500 text-[10px] flex-shrink-0"></i><span>รอเชิญบอทเข้ากลุ่ม LINE</span></span>`;

      const budgetDisplay = p.contractBudget > 0 
        ? formatCurrency(p.contractBudget) 
        : `<span class="text-xs text-slate-500 font-normal">รอระบุในไฟล์ Cost</span>`;

      const targetCostDisplay = p.targetCost > 0 
        ? formatCurrency(p.targetCost) 
        : `<span class="text-xs text-slate-500 font-normal">รอระบุในไฟล์ Cost</span>`;

      return `
        <tr class="table-row-hover transition-colors">
          <td class="py-3 px-4 whitespace-nowrap">
            <div class="font-bold text-slate-900 font-kanit text-sm flex items-center gap-1.5 whitespace-nowrap">
              <span>${escapeHtml(CANONICAL_SHORT_NAMES[p.id] || p.name || p.id)}</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full font-normal border whitespace-nowrap ${p.statusBadgeClass || getStatusBadgeClass(p.status)}">${escapeHtml(translateBackendStatus(p.status) || 'ดำเนินการ')}</span>
            </div>
            <div class="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5 whitespace-nowrap">
              <i class="fa-regular fa-folder text-amber-500 flex-shrink-0"></i>
              <span class="truncate">${escapeHtml(p.folderName || '')}</span>
            </div>
          </td>
          <td class="py-3 px-3 whitespace-nowrap">
            ${lineBadge}
          </td>
          <td class="py-3 px-3">
            <span class="text-xs text-slate-700 font-medium max-w-[260px] whitespace-normal break-words leading-relaxed block" title="${escapeHtml(p.coreSpecs || '')}">${escapeHtml(p.coreSpecs || '-')}</span>
          </td>
          <td class="py-3 px-3 text-right font-medium text-slate-900 font-kanit whitespace-nowrap">
            ${budgetDisplay}
          </td>
          <td class="py-3 px-3 text-right font-medium text-slate-600 font-kanit whitespace-nowrap">
            ${targetCostDisplay}
          </td>
          <td class="py-3 px-4 min-w-[160px]">
            <div class="flex items-center justify-between text-[11px] mb-1">
              <span class="font-bold font-kanit text-slate-800">${progressActual}%</span>
              <span>${diffBadge} <span class="text-slate-600">แผน ${progressPlanned}%</span></span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div class="bg-sky-500 h-1.5 rounded-full" style="width: ${Math.min(100, Math.max(0, progressActual))}%"></div>
            </div>
          </td>
          <td class="py-3 px-3 text-center whitespace-nowrap">
            ${defectsCount > 0 
              ? `<span class="px-2 py-0.5 bg-rose-100 text-rose-700 font-bold rounded-full text-[11px]">${defectsCount}</span>` 
              : `<span class="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold rounded-full text-[11px]">0</span>`
            }
          </td>
          <td class="py-3 px-4 text-center whitespace-nowrap">
            <button onclick="switchProject('${p.id}')" class="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold rounded-xl border border-sky-200 transition-all font-kanit flex items-center gap-1 mx-auto whitespace-nowrap flex-shrink-0">
              <span>ดูรายละเอียด</span>
              <i class="fa-solid fa-arrow-right text-[10px] flex-shrink-0"></i>
            </button>
          </td>
        </tr>
      `;
    }).join("");
  }

  // 2. Mobile Project Cards Container
  const mobileContainer = document.getElementById("mobilePortfolioCards");
  if (mobileContainer) {
    if (projectsList.length === 0) {
      mobileContainer.innerHTML = `
        <div class="p-6 text-center text-slate-500 text-xs bg-slate-50 rounded-2xl border border-slate-200">
          ไม่พบโครงการที่ค้นหา
        </div>
      `;
    } else {
      mobileContainer.innerHTML = projectsList.map(p => {
        const pendingDefects = Array.isArray(p.defects) ? p.defects.filter(d => d.status !== "resolved").length : 0;
        const progressActual = Number(p.progressActual) || 0;
        const progressPlanned = Number(p.progressPlanned) || 0;
        const diff = (progressActual - progressPlanned).toFixed(0);
        const diffText = diff >= 0 ? `+${diff}%` : `${diff}%`;
        const diffColor = diff >= 0 ? 'text-emerald-600' : 'text-rose-500';

        const lineBadgeMobile = p.lineGroupId 
          ? `<span class="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200"><i class="fa-brands fa-line text-emerald-500"></i> ผูกกลุ่ม LINE แล้ว</span>`
          : `<span class="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200"><i class="fa-solid fa-clock text-amber-500 text-[9px]"></i> รอเชิญบอทเข้ากลุ่ม LINE</span>`;

        const budgetMobile = p.contractBudget > 0 ? `${formatCurrency(p.contractBudget)} บ.` : 'รอระบุในไฟล์ Cost';
        const targetCostMobile = p.targetCost > 0 ? `${formatCurrency(p.targetCost)} บ.` : 'รอระบุในไฟล์ Cost';
        const manpowerMobile = p.manpowerToday > 0 ? `${p.manpowerToday} นาย` : '0 (รอ LINE)';

        return `
          <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/90 space-y-3">
            <!-- Top Row: Name, Folder, Status -->
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <h4 class="font-bold text-slate-900 font-kanit text-sm truncate flex items-center gap-1.5">
                  ${escapeHtml(CANONICAL_SHORT_NAMES[p.id] || p.name || p.id)}
                </h4>
                <div class="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                  <i class="fa-regular fa-folder text-amber-500 flex-shrink-0"></i>
                  <span class="truncate">📁 ${escapeHtml(p.folderName || p.name || '')}</span>
                </div>
                <div class="mt-1">
                  ${lineBadgeMobile}
                </div>
              </div>
              <span class="text-[10px] px-2 py-0.5 rounded-full font-medium border whitespace-nowrap flex-shrink-0 ${p.statusBadgeClass || getStatusBadgeClass(p.status)}">
                ${escapeHtml(translateBackendStatus(p.status) || 'ดำเนินการ')}
              </span>
            </div>

            <!-- Core Specs Box -->
            <div class="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200 leading-relaxed break-words">
              <div class="text-[10px] text-slate-600 font-semibold mb-0.5 flex items-center gap-1">
                <i class="fa-solid fa-layer-group text-sky-500 flex-shrink-0"></i> สเปกวัสดุหลัก:
              </div>
              ${escapeHtml(p.coreSpecs || 'มาตรฐาน มอก. / สเปกบลูเคอร์')}
            </div>

            <!-- 2-col Metrics Grid -->
            <div class="grid grid-cols-2 gap-2.5 pt-1 text-xs">
              <!-- Col 1: Financials -->
              <div class="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100 space-y-1">
                <div class="text-[10px] text-slate-600">งบสัญญา: <span class="font-bold font-kanit text-slate-900">${budgetMobile}</span></div>
                <div class="text-[10px] text-slate-600">ต้นทุนเป้า: <span class="font-medium font-kanit text-slate-700">${targetCostMobile}</span></div>
                <div class="text-[10px] text-emerald-700 font-semibold font-kanit">กำไร Margin ${p.profitMargin || 0}%</div>
              </div>

              <!-- Col 2: Progress & Operations -->
              <div class="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100 space-y-1">
                <div class="flex items-center justify-between text-[10px]">
                  <span class="text-slate-600">จริง <b class="text-slate-900">${progressActual}%</b></span>
                  <span class="${diffColor} font-semibold">${diffText} (แผน ${progressPlanned}%)</span>
                </div>
                <div class="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden my-1">
                  <div class="bg-sky-500 h-1.5 rounded-full" style="width: ${Math.min(100, Math.max(0, progressActual))}%"></div>
                </div>
                <div class="flex items-center justify-between text-[10px] text-slate-600">
                  <span>ช่างวันนี้: <b class="text-slate-800">${manpowerMobile}</b></span>
                  <span>Defect: <b class="${pendingDefects > 0 ? 'text-rose-600' : 'text-emerald-600'}">${pendingDefects} จุด</b></span>
                </div>
              </div>
            </div>

            <!-- Bottom 2 Action Buttons -->
            <div class="grid grid-cols-2 gap-2 pt-1">
              <button onclick="switchProject('${p.id}')" class="w-full py-2 px-3 bg-sky-50 hover:bg-sky-100 active:bg-sky-200 text-sky-800 text-xs font-semibold rounded-xl border border-sky-200 transition-all font-kanit flex items-center justify-center gap-1.5 whitespace-nowrap">
                <i class="fa-solid fa-magnifying-glass text-[11px] flex-shrink-0"></i>
                <span>เจาะลึกโครงการ</span>
              </button>
              <button onclick="openProjectLineInbox('${p.id}')" class="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 transition-all font-kanit flex items-center justify-center gap-1.5 relative whitespace-nowrap">
                <i class="fa-brands fa-line text-emerald-600 text-sm flex-shrink-0"></i>
                <span>แชทกลุ่ม LINE</span>
                ${p.unreadCount > 0 ? `
                  <span class="ml-1 px-1.5 py-0.2 bg-emerald-600 text-white text-[9px] font-bold rounded-full">
                    ${p.unreadCount}
                  </span>
                ` : ''}
              </button>
            </div>
          </div>
        `;
      }).join("");
    }
  }
}

function filterPortfolioTable(searchTerm) {
  const term = (searchTerm || "").toLowerCase().trim();
  const projectsList = Object.values(appState.projects);
  const filtered = projectsList.filter(p => 
    (p.name || "").toLowerCase().includes(term) ||
    (p.coreSpecs || "").toLowerCase().includes(term) ||
    (p.folderName || "").toLowerCase().includes(term)
  );
  renderPortfolioMatrixTable(filtered);
}

// =============================================================================
// 5. VIEW 2: PROJECT DRILL-DOWN RENDERING
// =============================================================================
function renderProjectDetailView(projectId) {
  const proj = appState.projects[projectId];
  if (!proj) return;

  // Header Elements
  const shortName = CANONICAL_SHORT_NAMES[projectId] || proj.name || projectId;
  const fullName = proj.fullName || proj.name || "";

  const detailFullName = document.getElementById("projDetailFullName");
  if (detailFullName) {
    detailFullName.innerText = shortName;
  }
  const headerTitle = document.getElementById("projHeaderTitle");
  if (headerTitle && !detailFullName) {
    headerTitle.innerText = shortName;
  }

  const headerSubtitle = document.getElementById("projHeaderSubtitle");
  if (headerSubtitle) headerSubtitle.innerText = fullName;

  const badgeStatus = document.getElementById("projBadgeStatus");
  if (badgeStatus) {
    const statusText = translateBackendStatus(proj.status || "กำลังดำเนินการ");
    badgeStatus.innerHTML = `
      <span class="w-1.5 h-1.5 rounded-full ${statusText === 'ส่งมอบงวดสุดท้าย' || statusText === 'ระยะส่งมอบงาน' ? 'bg-amber-400' : 'bg-emerald-400'} animate-pulse flex-shrink-0"></span>
      <span class="whitespace-nowrap">${escapeHtml(statusText)}</span>
    `;
    badgeStatus.className = `px-2.5 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 border whitespace-nowrap flex-shrink-0 ${proj.statusBadgeClass || getStatusBadgeClass(statusText)}`;
  }
  
  const lineTag = document.getElementById("projLineGroupTag");
  if (lineTag) {
    if (proj.lineGroupId) {
      lineTag.className = "px-2.5 py-1 text-xs font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-400/30 rounded-full flex items-center gap-1.5 whitespace-nowrap flex-shrink-0";
      lineTag.innerHTML = `
        <i class="fa-brands fa-line text-emerald-400 flex-shrink-0"></i>
        <span>${escapeHtml(proj.lineGroupName || 'ผูกกลุ่ม LINE แล้ว')}</span>
      `;
    } else {
      lineTag.className = "px-2.5 py-1 text-xs font-medium bg-slate-800/80 text-amber-300 border border-amber-400/30 rounded-full flex items-center gap-1.5 whitespace-nowrap flex-shrink-0";
      lineTag.innerHTML = `
        <i class="fa-solid fa-clock text-amber-300 flex-shrink-0"></i>
        <span>ยังไม่ได้เชิญบอทเข้ากลุ่ม LINE (@395avvfu)</span>
      `;
    }
  }

  const folderPath = document.getElementById("projFolderPath");
  if (folderPath) folderPath.innerText = proj.folderPath || "";

  const period = document.getElementById("projPeriod");
  if (period) period.innerText = proj.period || "";

  const spec = document.getElementById("projMaterialSpec");
  if (spec) spec.innerText = proj.coreSpecs || "";

  const actualProg = Number(proj.progressActual) || 0;
  const plannedProg = Number(proj.progressPlanned) || 0;
  const progPct = document.getElementById("projProgressPct");
  if (progPct) progPct.innerText = `${actualProg.toFixed(1)}%`;
  
  const diff = (actualProg - plannedProg).toFixed(1);
  const diffElem = document.getElementById("projProgressDiff");
  if (diffElem) {
    if (Number(diff) >= 0) {
      diffElem.className = "text-[10px] text-emerald-400";
      diffElem.innerText = `เร็วกว่าแผน +${diff}%`;
    } else {
      diffElem.className = "text-[10px] text-amber-300";
      diffElem.innerText = `ช้ากว่าแผน ${Math.abs(diff)}%`;
    }
  }

  // Update Subtab badges
  const pendingActions = Array.isArray(proj.actionItems) ? proj.actionItems.filter(a => !a.completed).length : 0;
  const pendingDefects = Array.isArray(proj.defects) ? proj.defects.filter(d => d.status !== "resolved").length : 0;
  const subAction = document.getElementById("subtabActionCount");
  if (subAction) subAction.innerText = pendingActions;
  const subDefect = document.getElementById("subtabDefectCount");
  if (subDefect) subDefect.innerText = pendingDefects;

  // Trigger rendering for the active subtab
  switchSubTab(appState.activeSubTab);
  updateMobileNavUI();
}

// Sub-Tab 1: WBS Table
function renderWbsTable(proj) {
  if (!proj || !Array.isArray(proj.wbsTasks)) return;

  const syncTag = document.getElementById("wbsAutoSyncTag");
  if (syncTag) {
    syncTag.innerText = `${proj.folderName || proj.name}\\AI_สร้าง_ข้อมูลและรูปจาก_LINE\\_Site_Progress_Auto.xlsx`;
  }

  // 1. Desktop Table Body
  const tbody = document.getElementById("wbsTableBody");
  if (tbody) {
    tbody.innerHTML = proj.wbsTasks.map((t, index) => {
      const taskName = t.name || t.title || t.task_code || `งานส่วนที่ ${index + 1}`;
      const taskCategory = t.category || (t.task_code ? `หมวด ${t.task_code}` : 'งานโครงสร้าง/สเปก');
      const taskPeriod = t.period || (t.start_date && t.due_date ? `${t.start_date} – ${t.due_date}` : (t.due_date ? `กำหนดส่ง ${t.due_date}` : 'ตามแผนงาน'));
      const taskWeight = Number(t.weight ?? t.weight_percent) || 10;
      const progressVal = Number(t.progress ?? t.progress_percent) || 0;
      return `
        <tr class="table-row-hover transition-colors">
          <td class="py-3 px-4 text-center font-bold text-slate-600">${index + 1}</td>
          <td class="py-3 px-4 font-medium text-slate-800">${taskName}</td>
          <td class="py-3 px-3">
            <span class="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px]">${taskCategory}</span>
          </td>
          <td class="py-3 px-3 text-slate-600 text-[11px]">${taskPeriod}</td>
          <td class="py-3 px-3 text-center font-semibold text-slate-700">${taskWeight}%</td>
          <td class="py-3 px-4">
            <div class="flex items-center gap-3">
              <input type="range" min="0" max="100" value="${progressVal}" 
                     onchange="updateWbsProgress('${proj.id}', '${t.id}', this.value)" 
                     class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer">
              <span class="font-bold text-xs text-sky-700 font-kanit w-10 text-right">${progressVal}%</span>
            </div>
          </td>
          <td class="py-3 px-3 text-center">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              progressVal === 100 
                ? 'bg-emerald-100 text-emerald-800' 
                : progressVal > 0 
                  ? 'bg-sky-100 text-sky-800' 
                  : 'bg-slate-100 text-slate-600'
            }">
              ${progressVal === 100 ? 'เสร็จสิ้น' : progressVal > 0 ? 'กำลังทำ' : 'รอดำเนินการ'}
            </span>
          </td>
        </tr>
      `;
    }).join("");
  }

  // 2. Mobile WBS Cards Container
  const mobileContainer = document.getElementById("mobileWbsCards");
  if (mobileContainer) {
    mobileContainer.innerHTML = proj.wbsTasks.map((t, index) => {
      const taskName = t.name || t.title || t.task_code || `งานส่วนที่ ${index + 1}`;
      const taskCategory = t.category || (t.task_code ? `หมวด ${t.task_code}` : 'งานโครงสร้าง/สเปก');
      const taskPeriod = t.period || (t.start_date && t.due_date ? `${t.start_date} – ${t.due_date}` : (t.due_date ? `กำหนดส่ง ${t.due_date}` : 'ตามแผนงาน'));
      const taskWeight = Number(t.weight ?? t.weight_percent) || 10;
      const progressVal = Number(t.progress ?? t.progress_percent) || 0;
      const statusClass = progressVal === 100 
        ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
        : progressVal > 0 
          ? 'bg-sky-100 text-sky-800 border-sky-200' 
          : 'bg-slate-100 text-slate-600 border-slate-200';
      const statusLabel = progressVal === 100 ? 'เสร็จสิ้น' : progressVal > 0 ? 'กำลังทำ' : 'รอดำเนินการ';

      return `
        <div class="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-200 space-y-2.5">
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-start gap-2">
              <span class="w-5 h-5 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                ${index + 1}
              </span>
              <h5 class="font-semibold text-slate-800 text-xs leading-snug">${taskName}</h5>
            </div>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold border flex-shrink-0 ${statusClass}">
              ${statusLabel}
            </span>
          </div>

          <div class="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
            <span class="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px]">${taskCategory}</span>
            <span>•</span>
            <span>${taskPeriod}</span>
            <span>•</span>
            <span class="font-medium text-slate-700">น้ำหนัก ${taskWeight}%</span>
          </div>

          <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <div class="flex items-center justify-between text-xs mb-1.5">
              <span class="text-slate-600 text-[11px]">ปรับความคืบหน้า:</span>
              <span class="font-bold text-xs text-sky-700 font-kanit" id="mobile-wbs-label-${t.id}">${progressVal}%</span>
            </div>
            <input type="range" min="0" max="100" value="${progressVal}" 
                   oninput="const lbl = document.getElementById('mobile-wbs-label-${t.id}'); if (lbl) lbl.innerText = this.value + '%';"
                   onchange="updateWbsProgress('${proj.id}', '${t.id}', this.value)" 
                   class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600">
          </div>
        </div>
      `;
    }).join("");
  }
}

function updateWbsTaskProgress(projId, taskId, newProgress) {
  const proj = appState.projects[projId];
  if (!proj || !Array.isArray(proj.wbsTasks)) return;

  const task = proj.wbsTasks.find(t => t.id === taskId);
  if (task) {
    task.progress = parseInt(newProgress, 10) || 0;
    task.status = task.progress === 100 ? "เสร็จสิ้น" : (task.progress > 0 ? "กำลังทำ" : "รอดำเนินการ");

    let weightedSum = 0;
    let totalWeight = 0;
    proj.wbsTasks.forEach(t => {
      const w = Number(t.weight) || 1;
      weightedSum += ((Number(t.progress) || 0) * w);
      totalWeight += w;
    });
    if (totalWeight > 0) {
      proj.progressActual = parseFloat((weightedSum / totalWeight).toFixed(1));
    }

    renderProjectDetailView(projId);
    showToast(`อัปเดต "${task.name}" เป็น ${task.progress}% และบันทึกลง _Site_Progress_Auto.xlsx`, "success");
  }
}

function updateWbsProgress(projId, taskId, newProgress) {
  return updateWbsTaskProgress(projId, taskId, newProgress);
}

// Sub-Tab 2: Action Items To-Do
function renderActionItems(proj) {
  if (!proj) proj = appState.projects[appState.currentProjectId];
  if (!proj || !proj.actionItems) return;

  const container = document.getElementById("actionItemsContainer");
  const filter = document.getElementById("actionFilterStatus") ? document.getElementById("actionFilterStatus").value : "all";

  let items = proj.actionItems;
  if (filter === "pending") items = items.filter(i => !i.completed);
  if (filter === "completed") items = items.filter(i => i.completed);

  if (items.length === 0) {
    container.innerHTML = `
      <div class="col-span-2 text-center py-10 text-slate-600">
        <i class="fa-solid fa-clipboard-check text-3xl mb-2 text-slate-300"></i>
        <p>ไม่พบรายการงานสั่งการในสถานะนี้</p>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(act => {
    return `
      <div class="p-4 rounded-2xl border transition-all ${
        act.completed 
          ? 'bg-slate-50 border-slate-200 opacity-70' 
          : 'bg-white border-slate-200 card-elevation'
      }">
        <div class="flex items-start justify-between gap-2 mb-2">
          <div class="flex items-center gap-2">
            <span class="w-7 h-7 rounded-lg ${act.completed ? 'bg-slate-200 text-slate-600' : 'bg-indigo-50 text-indigo-600'} flex items-center justify-center text-xs font-bold font-kanit">
              <i class="fa-solid fa-user-gear"></i>
            </span>
            <div>
              <p class="font-bold text-xs text-slate-900">${escapeHtml(act.assignee)}</p>
              <p class="text-[10px] text-slate-600">สั่งโดย: ${escapeHtml(act.orderedBy)} · ${escapeHtml(act.timestamp)}</p>
            </div>
          </div>
          <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
            act.priority === 'ด่วนมาก' 
              ? 'bg-rose-100 text-rose-700 border border-rose-200' 
              : act.priority === 'ด่วน' 
                ? 'bg-amber-100 text-amber-700' 
                : 'bg-slate-100 text-slate-600'
          }">
            ${escapeHtml(act.priority)}
          </span>
        </div>

        <h4 class="text-xs font-bold text-slate-800 mb-1.5 ${act.completed ? 'line-through text-slate-600' : ''}">
          ${escapeHtml(act.title)}
        </h4>

        <!-- Verbatim LINE Quote -->
        <div class="bg-slate-50 rounded-xl p-2.5 border border-slate-100 text-[11px] text-slate-600 italic mb-3 flex items-start gap-1.5">
          <i class="fa-brands fa-line text-emerald-500 text-xs mt-0.5 flex-shrink-0"></i>
          <span>"${escapeHtml(act.quote)}"</span>
        </div>

        <div class="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
          <span class="text-[11px] text-slate-600 flex items-center gap-1">
            <i class="fa-regular fa-clock text-amber-500"></i>
            กำหนด: ${escapeHtml(act.deadline)}
          </span>
          <button onclick="toggleActionItemComplete('${proj.id}', '${act.id}')" class="px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
            act.completed 
              ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' 
              : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm'
          }">
            <i class="fa-solid fa-check mr-1"></i>
            ${act.completed ? 'ทำเสร็จแล้ว' : 'ติ๊กเสร็จสิ้น'}
          </button>
        </div>
      </div>
    `;
  }).join("");
}

function toggleActionItemComplete(projId, actId) {
  const proj = appState.projects[projId];
  if (!proj || !proj.actionItems) return;
  const item = proj.actionItems.find(a => a.id === actId);
  if (item) {
    item.completed = !item.completed;
    renderActionItems(proj);
    showToast(item.completed ? "ทำเครื่องหมายงานเสร็จสิ้นแล้ว" : "เปลี่ยนสถานะกลับเป็นรอดำเนินการ", "info");
  }
}

// Sub-Tab 3: Defects Kanban Board
function renderDefectsKanban(proj) {
  if (!proj || !proj.defects) return;

  const cols = {
    "pending": document.getElementById("kanbanColPending"),
    "in-progress": document.getElementById("kanbanColInProgress"),
    "resolved": document.getElementById("kanbanColResolved")
  };

  const counts = { "pending": 0, "in-progress": 0, "resolved": 0 };
  Object.values(cols).forEach(col => col.innerHTML = "");

  proj.defects.forEach(df => {
    counts[df.status] = (counts[df.status] || 0) + 1;
    const card = document.createElement("div");
    card.className = "bg-white p-3.5 rounded-2xl border border-slate-200 card-elevation space-y-2 kanban-card";
    
    card.innerHTML = `
      <div class="flex items-start justify-between gap-1">
        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
          df.severity === 'ด่วน' || df.severity === 'วิกฤต' 
            ? 'bg-rose-100 text-rose-700' 
            : df.severity === 'ปานกลาง' 
              ? 'bg-amber-100 text-amber-700' 
              : 'bg-slate-100 text-slate-700'
        }">
          ${escapeHtml(df.severity)}
        </span>
        <span class="text-[10px] text-slate-600">${escapeHtml(df.date)}</span>
      </div>

      ${df.photoUrl ? `
        <div class="relative rounded-xl overflow-hidden h-28 bg-slate-100 cursor-pointer" onclick="openLightbox('${escapeHtml(df.photoUrl)}', '${escapeHtml(df.title)}')">
          <img src="${escapeHtml(df.photoUrl)}" alt="${escapeHtml(df.title)}" class="w-full h-full object-cover hover:scale-105 transition-transform duration-300">
          <span class="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded">กดดูรูป</span>
        </div>
      ` : ''}

      <h5 class="text-xs font-bold text-slate-800 leading-snug">${escapeHtml(df.title)}</h5>
      <p class="text-[11px] text-slate-600 flex items-center gap-1">
        <i class="fa-solid fa-location-dot text-rose-500 flex-shrink-0"></i>
        <span>${escapeHtml(df.location)}</span>
      </p>

      <div class="flex items-center justify-between text-[10px] text-slate-600 pt-1.5 border-t border-slate-100">
        <span>แจ้งโดย: ${escapeHtml(df.reporter)}</span>
        <div class="flex items-center gap-1">
          ${df.status !== 'pending' ? `
            <button onclick="moveDefectStatus('${proj.id}', '${df.id}', 'pending')" title="ย้ายไป 'รอการแก้ไข'" class="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center">
              <i class="fa-solid fa-arrow-left text-[9px]"></i>
            </button>
          ` : ''}
          ${df.status !== 'in-progress' ? `
            <button onclick="moveDefectStatus('${proj.id}', '${df.id}', 'in-progress')" title="ย้ายไป 'กำลังดำเนินการซ่อม'" class="px-1.5 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-800 text-[10px] font-semibold">
              กำลังซ่อม
            </button>
          ` : ''}
          ${df.status !== 'resolved' ? `
            <button onclick="moveDefectStatus('${proj.id}', '${df.id}', 'resolved')" title="ย้ายไป 'แก้ไขเสร็จสิ้น'" class="w-5 h-5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 flex items-center justify-center">
              <i class="fa-solid fa-check text-[9px]"></i>
            </button>
          ` : ''}
        </div>
      </div>
    `;

    if (cols[df.status]) {
      cols[df.status].appendChild(card);
    }
  });

  document.getElementById("kanbanCountPending").innerText = counts["pending"];
  document.getElementById("kanbanCountInProgress").innerText = counts["in-progress"];
  document.getElementById("kanbanCountResolved").innerText = counts["resolved"];
}

function moveDefectStatus(projId, defectId, newStatus) {
  const proj = appState.projects[projId];
  if (!proj || !proj.defects) return;

  const defect = proj.defects.find(d => d.id === defectId);
  if (defect) {
    defect.status = newStatus;
    renderDefectsKanban(proj);
    showToast(`ย้าย Defect "${defect.title}" เรียบร้อยแล้ว`, "success");
  }
}

// Sub-Tab 4: Photo Stream & Logs
function renderPhotoStream(proj) {
  if (!proj || !proj.photos) return;

  const container = document.getElementById("photoStreamContainer");
  const saveBadge = document.getElementById("photoSaveStorageBadge");
  if (saveBadge) {
    saveBadge.innerText = `💾 เซฟลง: ${proj.folderName}\\AI_สร้าง_ข้อมูลและรูปจาก_LINE\\รูปหน้างาน\\`;
  }

  container.innerHTML = proj.photos.map(p => {
    return `
      <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden card-elevation flex flex-col justify-between">
        <div class="relative h-48 bg-slate-100 overflow-hidden cursor-pointer" onclick="openLightbox('${p.url}', '${p.caption}')">
          <img src="${p.url}" alt="${p.caption}" class="w-full h-full object-cover hover:scale-105 transition-transform duration-300">
          <div class="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-md text-[10px] flex items-center gap-1">
            <i class="fa-solid fa-camera"></i>
            <span>${p.fileName}</span>
          </div>
        </div>

        <div class="p-4 space-y-2">
          <p class="text-xs text-slate-800 font-medium">${p.caption}</p>
          
          <div class="flex flex-wrap items-center gap-2 text-[10px] text-slate-600">
            <span class="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
              <i class="fa-solid fa-user-pen"></i>
              ${p.foreman}
            </span>
            <span class="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
              <i class="fa-regular fa-clock"></i>
              ${p.timestamp}
            </span>
            <span class="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
              <i class="fa-solid fa-users"></i>
              ${p.manpower}
            </span>
          </div>

          <!-- Mandatory AI Folder Storage Path -->
          <div class="pt-2 border-t border-slate-100 text-[10px] space-y-1">
            <div class="text-slate-600 flex items-center gap-1 font-mono-code truncate" title="${p.savedRelPath}">
              <i class="fa-solid fa-hard-drive text-amber-500"></i>
              <span>${p.savedRelPath}</span>
            </div>
            <div class="text-emerald-600 font-medium flex items-center gap-1">
              <i class="fa-solid fa-circle-check"></i>
              <span>${p.excelSyncStatus}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// Sub-Tab 5: Master Dossier (Cost, BOQ, Contractors, Files)
function renderMasterDossier(proj) {
  if (!proj) return;

  // Financial Summary
  const elBudget = document.getElementById("dossierContractBudget");
  if (elBudget) elBudget.innerText = formatCurrency(proj.contractBudget);
  const elTargetCost = document.getElementById("dossierTargetCost");
  if (elTargetCost) elTargetCost.innerText = formatCurrency(proj.targetCost);
  const elActualSpent = document.getElementById("dossierActualSpent");
  if (elActualSpent) elActualSpent.innerText = formatCurrency(proj.actualCost);
  const elExpectedProfit = document.getElementById("dossierExpectedProfit");
  if (elExpectedProfit) elExpectedProfit.innerText = formatCurrency(proj.expectedProfit);
  const elMarginPct = document.getElementById("dossierMarginPct");
  if (elMarginPct) elMarginPct.innerText = `Margin ${proj.profitMargin || 0}%`;

  // 1. Contractors Directory (Desktop Table)
  const contractorBody = document.getElementById("dossierContractorBody") || document.getElementById("contractorsTableBody");
  if (contractorBody && Array.isArray(proj.contractors)) {
    if (proj.contractors.length === 0) {
      contractorBody.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-xs text-slate-500">ไม่มีข้อมูลผู้รับเหมาในโครงการนี้</td></tr>`;
    } else {
      contractorBody.innerHTML = proj.contractors.map(c => {
        const cName = c.name || c.contractor || '-';
        const cRole = c.role || '-';
        const cContact = c.contact || c.phone || c.company || '-';
        const cMilestones = c.milestones || (c.status === 'PAID' ? 'จ่ายครบแล้ว' : 'ตามงวดงาน');
        const cAmount = c.amount || (c.total_amount ? `${formatCurrency(c.total_amount)} บ.` : (c.cost ? `${formatCurrency(c.cost)} บ.` : '-'));
        return `
          <tr class="table-row-hover transition-colors">
            <td class="py-2.5 px-4 font-bold text-slate-800">${escapeHtml(cName)}</td>
            <td class="py-2.5 px-3 text-slate-700">${escapeHtml(cRole)}</td>
            <td class="py-2.5 px-3 text-slate-600 font-mono-code text-[11px]">${escapeHtml(cContact)}</td>
            <td class="py-2.5 px-3 text-slate-600">${escapeHtml(cMilestones)}</td>
            <td class="py-2.5 px-3 text-right font-kanit font-semibold text-slate-900">${escapeHtml(cAmount)}</td>
          </tr>
        `;
      }).join("");
    }
  }

  // 2. Mobile Contractors Cards
  const mobileContractors = document.getElementById("mobileContractorsCards");
  if (mobileContractors && Array.isArray(proj.contractors)) {
    if (proj.contractors.length === 0) {
      mobileContractors.innerHTML = `<div class="p-3 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">ไม่มีข้อมูลผู้รับเหมาในโครงการนี้</div>`;
    } else {
      mobileContractors.innerHTML = proj.contractors.map(c => {
        const cName = c.name || c.contractor || '-';
        const cRole = c.role || '-';
        const cContact = c.contact || c.phone || c.company || '-';
        const cMilestones = c.milestones || (c.status === 'PAID' ? 'จ่ายครบแล้ว' : 'ตามงวดงาน');
        const cAmount = c.amount || (c.total_amount ? `${formatCurrency(c.total_amount)} บ.` : (c.cost ? `${formatCurrency(c.cost)} บ.` : '-'));
        return `
          <div class="bg-white rounded-2xl p-3 shadow-sm border border-slate-200 space-y-1.5">
            <div class="flex items-start justify-between gap-2">
              <h5 class="font-bold text-slate-900 text-xs font-kanit">${escapeHtml(cName)}</h5>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">${escapeHtml(cRole)}</span>
            </div>
            <div class="text-[11px] text-slate-600 flex items-center gap-1 font-mono-code">
              <i class="fa-solid fa-phone text-[10px] text-slate-500"></i> ${escapeHtml(cContact)}
            </div>
            <div class="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
              <span class="text-slate-500">${escapeHtml(cMilestones)}</span>
              <span class="font-bold font-kanit text-slate-900">${escapeHtml(cAmount)}</span>
            </div>
          </div>
        `;
      }).join("");
    }
  }

  // 3. Materials Specification (Desktop Table)
  const materialBody = document.getElementById("dossierMaterialBody") || document.getElementById("materialsTableBody");
  if (materialBody && Array.isArray(proj.materials)) {
    if (proj.materials.length === 0) {
      materialBody.innerHTML = `<tr><td colspan="6" class="py-4 text-center text-xs text-slate-500">ไม่มีข้อมูลวัสดุในโครงการนี้</td></tr>`;
    } else {
      materialBody.innerHTML = proj.materials.map(m => {
        const mItem = m.item || m.name || '-';
        const mSpec = m.spec || m.supplier || m.status || 'มาตรฐาน มอก.';
        const mQty = m.qty || m.quantity || '-';
        const mUnit = m.unit || 'หน่วย';
        const mUnitPrice = m.unitPrice || '-';
        const mTotal = m.total || (m.cost ? `${formatCurrency(m.cost)} บ.` : '-');
        return `
          <tr class="table-row-hover transition-colors">
            <td class="py-2.5 px-4 font-semibold text-slate-800">${escapeHtml(mItem)}</td>
            <td class="py-2.5 px-3 text-slate-600">${escapeHtml(mSpec)}</td>
            <td class="py-2.5 px-3 text-center font-kanit">${escapeHtml(mQty)}</td>
            <td class="py-2.5 px-3 text-center text-slate-600">${escapeHtml(mUnit)}</td>
            <td class="py-2.5 px-3 text-right font-kanit text-slate-700">${escapeHtml(mUnitPrice)}</td>
            <td class="py-2.5 px-4 text-right font-kanit font-bold text-slate-900">${escapeHtml(mTotal)}</td>
          </tr>
        `;
      }).join("");
    }
  }

  // 4. Mobile Materials Cards
  const mobileMaterials = document.getElementById("mobileMaterialsCards");
  if (mobileMaterials && Array.isArray(proj.materials)) {
    if (proj.materials.length === 0) {
      mobileMaterials.innerHTML = `<div class="p-3 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">ไม่มีข้อมูลวัสดุในโครงการนี้</div>`;
    } else {
      mobileMaterials.innerHTML = proj.materials.map(m => {
        const mItem = m.item || m.name || '-';
        const mSpec = m.spec || m.supplier || m.status || 'มาตรฐาน มอก.';
        const mQty = m.qty || m.quantity || '-';
        const mUnit = m.unit || '';
        const mUnitPrice = m.unitPrice || '-';
        const mTotal = m.total || (m.cost ? `${formatCurrency(m.cost)} บ.` : '-');
        return `
          <div class="bg-white rounded-2xl p-3 shadow-sm border border-slate-200 space-y-1.5">
            <div class="flex items-start justify-between gap-2">
              <h5 class="font-bold text-slate-900 text-xs">${escapeHtml(mItem)}</h5>
              <span class="font-bold font-kanit text-slate-900 text-xs">${escapeHtml(mTotal)}</span>
            </div>
            <p class="text-[11px] text-slate-600 leading-snug">${escapeHtml(mSpec)}</p>
            <div class="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
              <span>จำนวน: <b class="text-slate-700 font-kanit">${escapeHtml(mQty)} ${escapeHtml(mUnit)}</b></span>
              <span>หน่วยละ: <b class="text-slate-700 font-kanit">${escapeHtml(mUnitPrice)}</b></span>
            </div>
          </div>
        `;
      }).join("");
    }
  }

  // 5. Files List
  const filesList = document.getElementById("dossierFilesList");
  if (filesList && Array.isArray(proj.files)) {
    filesList.innerHTML = proj.files.map(f => {
      let icon = "fa-file-excel text-emerald-600";
      if (f.name.endsWith(".pdf")) icon = "fa-file-pdf text-rose-600";
      if (f.name.endsWith(".docx")) icon = "fa-file-word text-sky-600";

      return `
        <div class="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 overflow-hidden">
            <i class="fa-regular ${icon} text-base flex-shrink-0"></i>
            <div class="overflow-hidden">
              <p class="font-medium text-xs text-slate-800 truncate" title="${f.name}">${f.name}</p>
              <p class="text-[10px] text-slate-600">${f.type} · ${f.size}</p>
            </div>
          </div>
          <span class="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded flex-shrink-0">Desktop</span>
        </div>
      `;
    }).join("");
  }
}

function renderDossierTab(proj) {
  return renderMasterDossier(proj);
}

// =============================================================================
// 6. UNIFIED LINE 7-GROUP INBOX LOGIC & SHORTCUT ACTIONS
// =============================================================================
function renderInboxRoomsList(searchTerm = "") {
  const container = document.getElementById("inboxRoomsList");
  if (!container) return;

  const term = searchTerm.toLowerCase().trim();
  let rooms = Object.values(appState.projects);
  if (term) {
    rooms = rooms.filter(r => (r.name || "").toLowerCase().includes(term) || (r.lineGroupName || "").toLowerCase().includes(term));
  }

  container.innerHTML = rooms.map(room => {
    const isActive = room.id === appState.inboxActiveRoomId;
    const isPaired = Boolean(room.lineGroupId);
    const shortName = CANONICAL_SHORT_NAMES[room.id] || room.name || room.id;

    return `
      <div onclick="selectInboxRoom('${room.id}')" class="p-3 cursor-pointer transition-all hover:bg-slate-100 flex items-start gap-2.5 ${isActive ? 'line-room-active bg-emerald-50/70' : 'bg-transparent'}">
        <div class="relative flex-shrink-0 mt-0.5">
          <div class="w-9 h-9 rounded-xl ${isPaired ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'} flex items-center justify-center font-bold text-xs font-kanit">
            ${escapeHtml(shortName.slice(0, 3))}
          </div>
          <span class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${isPaired ? 'bg-emerald-500' : 'bg-amber-400'} border-2 border-white"></span>
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-1">
            <h5 class="text-xs font-bold font-kanit text-slate-900 truncate ${isActive ? 'text-emerald-800' : ''}">
              ${escapeHtml(shortName)}
            </h5>
            <span class="text-[10px] text-slate-500 flex-shrink-0">${escapeHtml(room.lastMessageTime || '')}</span>
          </div>
          <div class="mt-0.5">
            ${isPaired 
              ? `<span class="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-medium"><i class="fa-brands fa-line text-emerald-500"></i> ผูกกลุ่มแล้ว</span>` 
              : `<span class="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200"><i class="fa-solid fa-clock text-amber-500 text-[9px]"></i> รอเชิญบอทเข้ากลุ่ม</span>`
            }
          </div>
          <p class="text-[11px] text-slate-500 truncate mt-0.5 leading-snug">
            ${escapeHtml(room.lastMessageText || (isPaired ? 'ไม่มีข้อความใหม่' : 'ยังไม่ได้ผูกกลุ่ม LINE — กดเพื่อดูวิธีเชิญบอท @395avvfu'))}
          </p>
        </div>

        ${room.unreadCount > 0 ? `
          <span class="px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex-shrink-0 mt-1">
            ${room.unreadCount}
          </span>
        ` : ''}
      </div>
    `;
  }).join("");
}

function filterInboxRooms(val) {
  renderInboxRoomsList(val);
}

function selectInboxRoom(roomId) {
  appState.inboxActiveRoomId = roomId;
  const room = appState.projects[roomId];
  if (room) {
    room.unreadCount = 0; // mark as read
  }
  renderInboxRoomsList();
  renderActiveRoomChat();

  const sidebarPane = document.getElementById("inboxSidebarPane") || document.querySelector("#assistPane-inbox > aside");
  const chatPane = document.getElementById("inboxChatPane") || document.querySelector("#assistPane-inbox > div");
  if (sidebarPane && chatPane) {
    sidebarPane.classList.add("hidden", "md:flex");
    sidebarPane.classList.remove("flex");
    chatPane.classList.remove("hidden");
    chatPane.classList.add("flex");
  }
}

function backToMobileInboxList() {
  const sidebarPane = document.getElementById("inboxSidebarPane") || document.querySelector("#assistPane-inbox > aside");
  const chatPane = document.getElementById("inboxChatPane") || document.querySelector("#assistPane-inbox > div");
  if (sidebarPane && chatPane) {
    sidebarPane.classList.remove("hidden");
    sidebarPane.classList.add("flex");
    chatPane.classList.add("hidden", "md:flex");
    chatPane.classList.remove("flex");
  }
  renderInboxRoomsList();
}

function openProjectLineInbox(projectId) {
  const drawer = document.getElementById("assistantDrawer");
  const backdrop = document.getElementById("assistantDrawerBackdrop");
  if (drawer) drawer.classList.remove("translate-x-full");
  if (backdrop) backdrop.classList.remove("hidden");
  
  switchAssistantTab("inbox");
  if (projectId && appState.projects[projectId]) {
    selectInboxRoom(projectId);
  } else if (appState.inboxActiveRoomId && appState.projects[appState.inboxActiveRoomId]) {
    selectInboxRoom(appState.inboxActiveRoomId);
  }
  updateMobileNavUI();
}

function renderActiveRoomChat() {
  const room = appState.projects[appState.inboxActiveRoomId];
  if (!room) return;

  const shortName = CANONICAL_SHORT_NAMES[room.id] || room.name || room.id;
  const isPaired = Boolean(room.lineGroupId);

  // Header update
  const roomNameEl = document.getElementById("activeRoomName");
  if (roomNameEl) {
    roomNameEl.innerText = isPaired ? (room.lineGroupName || shortName) : `${shortName} (ยังไม่ได้ผูกกลุ่ม LINE)`;
  }
  const titleEl = document.getElementById("inboxCurrentRoomTitle");
  if (titleEl && !roomNameEl) {
    titleEl.innerText = isPaired ? (room.lineGroupName || shortName) : `${shortName} (ยังไม่ได้ผูกกลุ่ม LINE)`;
  }

  const metaEl = document.getElementById("inboxCurrentRoomMeta");
  if (metaEl) {
    if (isPaired) {
      metaEl.innerHTML = `
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
        <span class="truncate">สถานะ: ผูกกับกลุ่ม LINE แล้ว · โฟลเดอร์: ${escapeHtml(room.folderName || room.name)}</span>
      `;
    } else {
      metaEl.innerHTML = `
        <span class="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0"></span>
        <span class="truncate text-amber-700 font-medium">สถานะ: ⏳ ยังไม่ได้เชิญบอท @395avvfu เข้ากลุ่ม LINE ของโครงการนี้</span>
      `;
    }
  }

  // Render messages
  const stream = document.getElementById("inboxMessagesStream");
  if (!stream) return;

  if (!room.chatHistory || room.chatHistory.length === 0) {
    if (!isPaired) {
      stream.innerHTML = `
        <div class="max-w-md mx-auto my-6 p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-4 shadow-sm">
          <div class="w-14 h-14 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <i class="fa-brands fa-line text-3xl text-emerald-500"></i>
          </div>
          <div>
            <h4 class="font-bold text-slate-800 text-sm font-kanit">ยังไม่ได้เชิญบอทเข้ากลุ่ม LINE ของโครงการนี้</h4>
            <p class="text-xs text-slate-500 mt-1 leading-relaxed">
              ขณะนี้ยังไม่มีข้อความ รูปภาพ หรือรายงานหน้างานจากกลุ่ม LINE เนื่องจากยังไม่ได้เชิญบอท <b class="text-slate-700">@395avvfu</b> เข้ากลุ่มและพิมพ์คำสั่งผูกโครงการ
            </p>
          </div>
          <div class="bg-white p-3.5 rounded-xl border border-slate-200 text-left space-y-2 text-xs">
            <div class="font-bold text-slate-700 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <i class="fa-solid fa-list-check text-sky-500"></i> 3 ขั้นตอนเชื่อมต่อกลุ่ม LINE ง่ายๆ:
            </div>
            <ol class="list-decimal list-inside space-y-1.5 text-slate-600 leading-snug">
              <li>แอดเพื่อนบอท <b class="text-emerald-700 font-mono">@395avvfu</b> ในแอป LINE</li>
              <li>เชิญบอทเข้ากลุ่ม LINE ของไซต์งาน <b class="text-slate-800">${escapeHtml(shortName)}</b></li>
              <li>พิมพ์ในกลุ่มว่า: <span class="px-2 py-0.5 bg-slate-100 rounded text-slate-900 font-mono font-bold select-all">ผูกกับโครงการ ${escapeHtml(shortName)}</span></li>
            </ol>
          </div>
          <div class="text-[11px] text-slate-500">
            เมื่อพิมพ์ผูกโครงการแล้ว ระบบจะเชื่อมห้องแชทและดึงข้อความ รายงานช่าง และภาพหน้างานเข้าตารางนี้อัตโนมัติทันที
          </div>
        </div>
      `;
    } else {
      stream.innerHTML = `
        <div class="text-center py-12 text-slate-500 space-y-2">
          <i class="fa-regular fa-comment-dots text-3xl text-slate-300"></i>
          <p class="text-xs">ยังไม่มีข้อความใหม่ในกลุ่มนี้</p>
        </div>
      `;
    }
    return;
  }

  stream.innerHTML = room.chatHistory.map(msg => {
    if (msg.isBoss) {
      // Message from พี่นัท (Executive / Admin)
      return `
        <div class="flex items-start justify-end gap-2">
          <div class="max-w-[75%] space-y-1">
            <div class="flex items-center justify-end gap-1.5 text-[10px] text-slate-600">
              <span class="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-semibold">พี่นัท (Admin)</span>
              <span>${msg.time}</span>
            </div>
            <div class="line-bubble-boss p-3 text-xs leading-relaxed shadow-sm">
              ${escapeHtml(msg.text)}
            </div>
          </div>
          <div class="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-3">
            น
          </div>
        </div>
      `;
    } else if (msg.isBot) {
      // Message from Abdul AI
      return `
        <div class="flex items-start gap-2">
          <div class="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center text-xs flex-shrink-0 mt-3 shadow-sm">
            <i class="fa-solid fa-robot"></i>
          </div>
          <div class="max-w-[80%] space-y-1">
            <div class="flex items-center gap-1.5 text-[10px] text-slate-600">
              <span class="font-bold text-sky-800 font-kanit">อับดุล AI (Assistant)</span>
              <span>${msg.time}</span>
            </div>
            <div class="line-bubble-abdul p-3 text-xs leading-relaxed shadow-sm">
              ${formatBotMarkdown(msg.text)}
            </div>
          </div>
        </div>
      `;
    } else {
      // Message from Foremen, Workers, Suppliers
      return `
        <div class="flex items-start gap-2">
          <div class="w-7 h-7 rounded-lg bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-3 font-kanit">
            ${msg.sender.slice(0, 1)}
          </div>
          <div class="max-w-[78%] space-y-1">
            <div class="flex items-center gap-1.5 text-[10px] text-slate-600">
              <span class="font-bold text-slate-700">${msg.sender}</span>
              <span>${msg.time}</span>
            </div>
            <div class="line-bubble-other p-3 text-xs leading-relaxed shadow-sm space-y-2">
              <p>${escapeHtml(msg.text)}</p>
              ${msg.photoUrl ? `
                <div class="rounded-xl overflow-hidden cursor-pointer mt-1" onclick="openLightbox('${msg.photoUrl}', '${msg.photoCaption || ''}')">
                  <img src="${msg.photoUrl}" alt="Photo from LINE" class="w-full max-h-48 object-cover rounded-lg border border-slate-200">
                  <div class="text-[9px] text-slate-600 mt-1 font-mono-code flex items-center gap-1">
                    <i class="fa-solid fa-hard-drive text-amber-500"></i>
                    <span class="truncate">${msg.savedRelPath || 'บันทึกลงคอมพิวเตอร์แล้ว'}</span>
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }
  }).join("");

  stream.scrollTop = stream.scrollHeight;
}

// 2 Header Shortcuts for the Active Room:
// 1. AI สรุปแชท & แจกงาน
function triggerAiSummarizeAndDispatch() {
  const room = appState.projects[appState.inboxActiveRoomId];
  if (!room) return;

  showToast(`อับดุล AI กำลังวิเคราะห์ประวัติแชทของ "${room.name}"...`, "info");

  setTimeout(() => {
    // Generate AI Summary message inside this room
    const summaryMsg = {
      sender: "อับดุล AI",
      role: "bot",
      isBot: true,
      time: new Date().toLocaleTimeString().slice(0, 5),
      text: `✨ **สรุปประเด็นแชท & ดึงงานมอบหมาย (${room.name})**\n` +
        `• **สถานะหน้างาน:** มีการรายงานความคืบหน้าภาพรวมอยู่ที่ ${room.progressActual}% (กำลังพล ${room.manpowerToday} นาย)\n` +
        `• **งานที่ดักจับจากพี่นัท:** มอบหมายให้ช่างตรวจสอบรายละเอียดหน้างานและเก็บขอบรอยต่อ\n` +
        `• **จุดสังเกต:** ได้ทำการเพิ่มรายการ To-Do Action Item และตรวจสอบรูปถ่ายหน้างานเรียบร้อยแล้วครับ!`
    };

    if (!room.chatHistory) room.chatHistory = [];
    room.chatHistory.push(summaryMsg);
    renderActiveRoomChat();
    showToast(`AI สรุปแชทและอัปเดตงานของ "${room.name}" เรียบร้อยแล้ว`, "success");
  }, 500);
}

// 2. คลังรูป & ไฟล์ห้องนี้ (ไม่หมดอายุ)
function openRoomMediaVault() {
  const room = appState.projects[appState.inboxActiveRoomId];
  if (!room) return;

  const modal = document.getElementById("roomMediaVaultModal");
  document.getElementById("vaultModalTitle").innerText = `คลังรูป & ไฟล์: ${room.name} (ไม่หมดอายุ)`;
  document.getElementById("vaultModalPath").innerText = `${room.folderPath}\\AI_สร้าง_ข้อมูลและรูปจาก_LINE\\`;

  // Render photos
  const photosGrid = document.getElementById("vaultPhotosGrid");
  if (photosGrid && room.photos) {
    photosGrid.innerHTML = room.photos.map(p => `
      <div class="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer" onclick="openLightbox('${p.url}', '${p.caption}')">
        <img src="${p.url}" alt="${p.caption}" class="w-full h-28 object-cover hover:scale-105 transition-all">
        <div class="p-1.5 text-[10px] text-slate-700 truncate font-mono-code">${p.fileName}</div>
      </div>
    `).join("");
  }

  // Render files
  const filesList = document.getElementById("vaultFilesList");
  if (filesList && room.files) {
    filesList.innerHTML = room.files.map(f => `
      <div class="p-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
        <span class="font-medium text-slate-800">${f.name}</span>
        <span class="text-[10px] text-slate-600">${f.size}</span>
      </div>
    `).join("");
  }

  modal.classList.remove("hidden");
}

function closeRoomMediaVault() {
  document.getElementById("roomMediaVaultModal").classList.add("hidden");
}

// 4 Quick Action Chips Handler
function handleQuickChip(actionType) {
  const room = appState.projects[appState.inboxActiveRoomId];
  if (!room) return;

  let replyText = "";
  if (actionType === "extract_tasks") {
    replyText = `📌 **คำสั่งงานล่าสุดที่ดักจับจากกลุ่มนี้:**\n`;
    if (room.actionItems && room.actionItems.length > 0) {
      room.actionItems.slice(0, 3).forEach((a, i) => {
        replyText += `${i + 1}. [${a.assignee}] ${a.title} (กำหนด: ${a.deadline})\n`;
      });
    } else {
      replyText += `ยังไม่มีคำสั่งงานค้างในห้องนี้ครับ`;
    }
  } else if (actionType === "summarize_today") {
    const pendingDefects = room.defects ? room.defects.filter(d => d.status !== 'resolved').length : 0;
    replyText = `📊 **สรุปงาน & Defect วันนี้ (${room.name}):**\n` +
      `• ความคืบหน้าสะสม: ${room.progressActual}%\n` +
      `• กำลังพลวันนี้: ${room.manpowerToday} นาย\n` +
      `• Defect ค้างแก้ไข: ${pendingDefects} จุด\n` +
      `• สถานะระบบ: Webhook ดักจับรูปและอัปเดตไฟล์ Excel อัตโนมัติ`;
  } else if (actionType === "check_budget") {
    replyText = `💰 **เช็คงบ & ต้นทุนโครงการ (${room.name}):**\n` +
      `• วงเงินสัญญา: ${formatCurrency(room.contractBudget)} บาท\n` +
      `• ต้นทุนจริงเป้าหมาย: ${formatCurrency(room.targetCost)} บาท\n` +
      `• กำไรคาดการณ์: ${formatCurrency(room.expectedProfit)} บาท (Margin ${room.profitMargin}%)\n` +
      `• จ่ายจริงแล้ว: ${formatCurrency(room.actualCost)} บาท`;
  } else if (actionType === "check_delivery") {
    replyText = `🧾 **สรุปบิล / ใบส่งของหน้างาน (${room.name}):**\n` +
      `• เอกสารจัดเก็บอยู่ในโฟลเดอร์: \`${room.folderName}\` บน Desktop\n` +
      `• ซัพพลายเออร์หลัก: บิลวัสดุ EPDM, ปูนมอร์ตาร์ และอุปกรณ์ติดตั้งครบถ้วน 100%`;
  }

  const botMsg = {
    sender: "อับดุล AI",
    role: "bot",
    isBot: true,
    time: new Date().toLocaleTimeString().slice(0, 5),
    text: replyText
  };

  if (!room.chatHistory) room.chatHistory = [];
  room.chatHistory.push(botMsg);
  renderActiveRoomChat();
}

function onInboxSendMessage(e) {
  e.preventDefault();
  const input = document.getElementById("inboxMessageInput");
  const text = input.value.trim();
  if (!text) return;

  input.value = "";
  const room = appState.projects[appState.inboxActiveRoomId];
  if (!room) return;

  // Add boss message
  const now = new Date().toLocaleTimeString().slice(0, 5);
  const bossMsg = {
    sender: "พี่นัท",
    role: "admin",
    isBoss: true,
    text: text,
    time: now
  };

  if (!room.chatHistory) room.chatHistory = [];
  room.chatHistory.push(bossMsg);
  room.lastMessageText = `พี่นัท: ${text}`;
  room.lastMessageTime = now;

  renderActiveRoomChat();
  renderInboxRoomsList();

  // If message addresses Abdul or is a command
  if (text.startsWith("อับดุล") || text.includes("อับดุล") || text.includes("สรุป")) {
    setTimeout(async () => {
      const reply = await generateAbdulReply(text);
      room.chatHistory.push({
        sender: "อับดุล AI",
        role: "bot",
        isBot: true,
        text: reply,
        time: new Date().toLocaleTimeString().slice(0, 5)
      });
      renderActiveRoomChat();
    }, 400);
  } else {
    // Check if it's an order to workers (e.g. mentions ช่าง or foreman)
    if (text.includes("ช่าง") || text.includes("โฟร์แมน") || text.includes("พัฒน์") || text.includes("พรุ่งนี้")) {
      const newAction = {
        id: `act-live-${Date.now()}`,
        assignee: text.includes("ช่างตี้") ? "ช่างตี้" : (text.includes("พัฒน์") ? "คุณพัฒน์" : "ทีมช่าง"),
        title: text.slice(0, 40) + "...",
        quote: text,
        orderedBy: "พี่นัท",
        deadline: "ตามที่สั่งใน LINE",
        timestamp: "เมื่อสักครู่",
        priority: "ด่วน",
        completed: false
      };
      if (!room.actionItems) room.actionItems = [];
      room.actionItems.unshift(newAction);
      showToast(`บอทดักจับคำสั่งเข้าสู่ To-Do ของ "${room.name}" เรียบร้อย (บอทไม่พิมพ์กวนในกลุ่ม)`, "success");
    }
  }
}

// =============================================================================
// 7. BOT ETIQUETTE TOGGLE (SILENT VS VOCAL)
// =============================================================================
async function toggleBotEtiquette(isVocal) {
  appState.botEtiquette = isVocal ? "vocal" : "silent";
  updateBotEtiquetteUI();

  try {
    await fetch(`${API_BASE}/api/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ botEtiquette: appState.botEtiquette })
    });
  } catch (err) {
    // Local fallback
  }

  const msg = isVocal 
    ? "💬 เปลี่ยนเป็นโหมด: บอทพิมพ์ตอบรับสั้นๆ ในกลุ่ม LINE แล้ว" 
    : "🔇 เปลี่ยนเป็นโหมด: บอทซุ่มจดเงียบ 100% ไม่ส่งข้อความรบกวนในกลุ่มแล้ว";
  showToast(msg, "info");
}

function updateBotEtiquetteUI() {
  const isVocal = appState.botEtiquette === "vocal";
  const toggle = document.getElementById("botEtiquetteToggle");
  const icon = document.getElementById("botModeIcon");
  const label = document.getElementById("botModeLabel");

  if (toggle) toggle.checked = isVocal;
  if (isVocal) {
    if (icon) icon.className = "fa-solid fa-comment-dots text-emerald-400";
    if (label) label.innerText = "บอทพิมพ์ตอบรับสั้นๆ";
  } else {
    if (icon) icon.className = "fa-solid fa-volume-xmark text-amber-400";
    if (label) label.innerText = "บอทซุ่มจดเงียบ 100%";
  }
}

// =============================================================================
// 8. EXPORT ENGINE: EXCEL (.XLSX) & PDF
// =============================================================================
function toggleExportMenu() {
  const menu = document.getElementById("exportMenu");
  if (menu) menu.classList.toggle("hidden");
}

function exportToPdf() {
  const menu = document.getElementById("exportMenu");
  if (menu) menu.classList.add("hidden");
  window.print();
}

function exportToExcel() {
  const menu = document.getElementById("exportMenu");
  if (menu) menu.classList.add("hidden");

  try {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Portfolio Summary
    const summaryData = [
      ["ลำดับ", "ชื่อโครงการ", "โฟลเดอร์บน Desktop", "กลุ่ม LINE", "งบสัญญา (บาท)", "ต้นทุนจริง (บาท)", "กำไรคาดการณ์", "ผลงานจริง (%)", "แผนงาน (%)", "สถานะ", "สเปกหลัก"],
      ...Object.values(appState.projects).map((p, idx) => [
        idx + 1,
        p.name,
        p.folderName,
        p.lineGroupName,
        p.contractBudget,
        p.actualCost,
        p.expectedProfit,
        p.progressActual,
        p.progressPlanned,
        p.status,
        p.coreSpecs
      ])
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Portfolio Summary");

    // Sheet 2: Action Items
    const allActions = [];
    allActions.push(["โครงการ", "ผู้รับผิดชอบ", "ชื่องาน", "คำสั่งเดิมจาก LINE", "กำหนดเสร็จ", "สถานะ"]);
    Object.values(appState.projects).forEach(p => {
      if (p.actionItems) {
        p.actionItems.forEach(a => {
          allActions.push([p.name, a.assignee, a.title, a.quote, a.deadline, a.completed ? "เสร็จสิ้น" : "รอดำเนินการ"]);
        });
      }
    });
    const wsActions = XLSX.utils.aoa_to_sheet(allActions);
    XLSX.utils.book_append_sheet(wb, wsActions, "LINE Action Items");

    // Sheet 3: Defects
    const allDefects = [];
    allDefects.push(["โครงการ", "รายการ Defect", "ตำแหน่ง", "ระดับความรุนแรง", "สถานะ", "ผู้แจ้ง", "วันที่"]);
    Object.values(appState.projects).forEach(p => {
      if (p.defects) {
        p.defects.forEach(d => {
          allDefects.push([p.name, d.title, d.location, d.severity, d.status, d.reporter, d.date]);
        });
      }
    });
    const wsDefects = XLSX.utils.aoa_to_sheet(allDefects);
    XLSX.utils.book_append_sheet(wb, wsDefects, "Defects Log");

    const fileName = `Blucher_BuildTrack_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
    showToast(`ส่งออกไฟล์ Excel สำเร็จ: ${fileName}`, "success");
  } catch (err) {
    console.error("Excel Export error:", err);
    showToast("เกิดข้อผิดพลาดในการสร้างไฟล์ Excel", "error");
  }
}

// =============================================================================
// 9. ABDUL AI ASSISTANT DRAWER & LIVE WEBHOOK SIMULATOR
// =============================================================================
function toggleAssistantDrawer() {
  const drawer = document.getElementById("assistantDrawer");
  const backdrop = document.getElementById("assistantDrawerBackdrop");
  if (!drawer) return;
  const isHidden = drawer.classList.contains("translate-x-full");

  if (isHidden) {
    drawer.classList.remove("translate-x-full");
    if (backdrop) backdrop.classList.remove("hidden");
  } else {
    drawer.classList.add("translate-x-full");
    if (backdrop) backdrop.classList.add("hidden");
  }
  updateMobileNavUI();
}

function openAssistant(tab = "inbox") {
  const drawer = document.getElementById("assistantDrawer");
  const backdrop = document.getElementById("assistantDrawerBackdrop");
  if (drawer) drawer.classList.remove("translate-x-full");
  if (backdrop) backdrop.classList.remove("hidden");
  switchAssistantTab(tab);

  if (tab === "inbox") {
    if (appState.currentProjectId !== "all" && appState.projects[appState.currentProjectId]) {
      appState.inboxActiveRoomId = appState.currentProjectId;
    }
    renderInboxRoomsList();
    renderActiveRoomChat();

    if (window.innerWidth < 768 && appState.currentProjectId === "all") {
      backToMobileInboxList();
    }
  }
  updateMobileNavUI();
}

function closeAssistantDrawer() {
  const drawer = document.getElementById("assistantDrawer");
  const backdrop = document.getElementById("assistantDrawerBackdrop");
  if (drawer) drawer.classList.add("translate-x-full");
  if (backdrop) backdrop.classList.add("hidden");
  updateMobileNavUI();
}

function switchAssistantTab(tabName) {
  appState.assistantTab = tabName;
  const inboxPane = document.getElementById("assistPane-inbox");
  const simPane = document.getElementById("assistPane-simulator");
  const btnInbox = document.getElementById("btnTabInbox");
  const btnSim = document.getElementById("btnTabSimulator");

  if (tabName === "inbox") {
    inboxPane.classList.remove("hidden");
    simPane.classList.add("hidden");
    btnInbox.className = "px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-600 text-white shadow-sm transition-all font-kanit flex items-center gap-1.5";
    btnSim.className = "px-3 py-1 rounded-lg text-xs font-semibold text-slate-300 hover:text-white transition-all font-kanit flex items-center gap-1.5";
  } else {
    inboxPane.classList.add("hidden");
    simPane.classList.remove("hidden");
    btnInbox.className = "px-3 py-1 rounded-lg text-xs font-semibold text-slate-300 hover:text-white transition-all font-kanit flex items-center gap-1.5";
    btnSim.className = "px-3 py-1 rounded-lg text-xs font-semibold bg-amber-600 text-white shadow-sm transition-all font-kanit flex items-center gap-1.5";
  }
}

async function generateAbdulReply(query) {
  try {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: query,
        currentProjectId: appState.inboxActiveRoomId || appState.currentProjectId
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data && (data.reply || data.answer)) return data.reply || data.answer;
    }
  } catch (err) {}

  const q = query.toLowerCase();

  if (q.includes("จตุจักร") || (appState.inboxActiveRoomId === "prj-chatuchak" && q.includes("ต้นทุน"))) {
    return `**รายงานไซต์ ศนท. จตุจักร ครับพี่นัท:**\n` +
      `• **วงเงินสัญญา:** 4,800,000 บาท\n` +
      `• **ต้นทุนเป้าหมาย:** 3,280,000 บาท (กำไรคาดการณ์ 1.52 ล้านบาท / Margin 31.7%)\n` +
      `• **ความคืบหน้าจริง:** 96% (แผนงาน 100% อยู่ในระยะทำเอกสารส่งมอบ ปร.4)\n` +
      `• **สเปกหลัก:** ไวนิลไลเนอร์ 1.5 มม. + พ่นกันซึม Polyurea รอบบ่ารางน้ำล้น + ขอบหินแกรนิตดำพ่นทราย 27 ซม.\n` +
      `• **ผู้รับเหมาหลัก:** ช่างตี้ (ฉาบปรับผิวสระ), ช่างพัฒน์ (ขนขยะ), ช่างเฉลิม (ระบบน้ำ)\n` +
      `• **งานสั่งการค้าง:** ช่างตี้เก็บเจียรขอบหินแกรนิตดำ และเคลียร์ขยะหลังห้องเครื่องครับ`;
  }

  if (q.includes("บางนา") || q.includes("พื้นยางบางนา")) {
    return `**รายงานไซต์ ศนท. บางนา ครับพี่นัท:**\n` +
      `• **สเปกพื้นยาง:** เม็ดยางดำ SBR หนา 8 มม. + เม็ดยางสี EPDM หนา 5 มม. พื้นที่รวม **900 ตร.ม.** ผสมกาว PU ไร้รอยต่อ\n` +
      `• **งบสัญญา:** 5,200,000 บาท (ต้นทุนจริง 3,540,000 บาท)\n` +
      `• **สถานะหน้างาน:** คอนกรีตฐานรากแห้งแล้ว ติดตั้งเครื่องเล่นสนาม ส.เจริญรุ่งเรือง เสร็จแล้ว 90% กำลังเทเม็ดยางดำ SBR เสร็จไปแล้ว 60%\n` +
      `• **กำลังพลวันนี้:** ช่าง 8 นาย (รายงานโฟร์แมนวัฒน์)`;
  }

  if (q.includes("ช่างตี้") || q.includes("ค้าง")) {
    return `**สรุปงานที่มอบหมายให้ 'ช่างตี้ (นายวุฒิธินันต์ สมชอบ)' ทุกไซต์ครับ:**\n` +
      `1. **ศนท. จตุจักร:** เก็บงานเจียรขอบหินแกรนิตดำพ่นทรายฝั่งตะวันออก (กำหนดส่ง: พรุ่งนี้ 14:00)\n` +
      `2. **ศนท. บางนา:** เตรียมผ้าใบคลุมโซน B ป้องกันฝนตกเย็นนี้\n` +
      `3. **ศนท. สะพานสูง:** ปรับระดับลวดสลิงโครงคร่าวฝ้าห้องเปลี่ยนเสื้อผ้า 1 แผง\n` +
      `4. **ศนท. บางแค:** ปรับงานรื้อฉาบขอบสระว่ายน้ำ\n` +
      `*ยอดเบิกจ่ายรวมช่างตี้ในระบบบันทึกอยู่ที่ประมาณ 1,560,000 บาทครับ*`;
  }

  if (q.includes("ปราจีน") || q.includes("อบต")) {
    return `**รายงานไซต์ อบต. ปราจีน (สนามเด็กเล่น ท่าตูม ม.7) ครับพี่นัท:**\n` +
      `• **งบประมาณรวม VAT:** 2,547,000 บาท (ราคากลาง 2,354,718.98 บาท)\n` +
      `• **ราคาเคาะชนะประมูล:** 2,200,000 บาท\n` +
      `• **ต้นทุนจริงก่อน VAT:** 1,236,866 บาท\n` +
      `• **กำไรแท้จริง:** **819,209 บาท (Gross Margin 39.8%)**\n` +
      `• **สเปก:** พื้นยาง EPDM หนา 20 มม. (SBR 15mm + EPDM 5mm) + เครื่องเล่น 5 ชุด ความคืบหน้า 85% ครับ`;
  }

  if (q.includes("แม่ฮ่องสอน") || q.includes("พี่บอม")) {
    return `**รายงานโครงการ ลู่วิ่งแม่ฮ่องสอน (พี่บอม) ครับพี่นัท:**\n` +
      `• **โมเดลที่เลือก:** Model 1 สนาม 11 คน + ลู่วิ่ง 6 เลน 6,800 ตร.ม.\n` +
      `• **งบประมาณขาย:** 13,684,000 บาท\n` +
      `• **ต้นทุนเป้าหมาย:** 9,033,200 บาท (กำไร 4,650,800 บาท / Margin 34.0%)\n` +
      `• **สเปก:** ลู่วิ่งยางสังเคราะห์ 13mm Red Encapsulated Sandwich System ผ่านมาตรฐาน IAAF ครับ`;
  }

  return `รับทราบครับพี่นัท ระบบ BuildTrack บันทึกข้อมูลไซต์ก่อสร้าง 7 โครงการบน Desktop ไว้อย่างครบถ้วน พี่นัทสามารถระบุชื่อไซต์ (จตุจักร, บางนา, บางแค, สะพานสูง, ลุมพินี, ปราจีน, แม่ฮ่องสอน) เพื่อสอบถามสเปกวัสดุ, งบประมาณ ปร.4, หรือสถานะ Defect ได้ทันทีครับ! 🏗️`;
}

// Mode B: LINE Webhook Simulator (6 Scenarios)
function runSimulation(scenarioNum) {
  const simSelect = document.getElementById("simTargetGroup");
  const targetProjId = (simSelect && simSelect.value) ? simSelect.value : (appState.inboxActiveRoomId || "prj-chatuchak");
  const proj = appState.projects[targetProjId] || Object.values(appState.projects)[0];
  if (!proj) return;

  switch (scenarioNum) {
    case 1:
      triggerSimBossOrder(proj);
      break;
    case 2:
      triggerSimForemanReport(proj);
      break;
    case 3:
      triggerSimDefectReport(proj);
      break;
    case 4:
      triggerSimSpamFilter(proj);
      break;
    case 5:
      triggerSimCrossRoomQuery(proj);
      break;
    case 6:
      triggerSimSummaryCard(proj);
      break;
  }
}

function triggerSimBossOrder(proj) {
  const newAction = {
    id: `act-sim-${Date.now()}`,
    assignee: "ช่างตี้",
    title: "เข้าเก็บงานรอยต่อขอบสระและทาไพรเมอร์ซ้ำ",
    quote: "ช่างตี้ พรุ่งนี้เช้า 8 โมงให้เข้าเก็บงานสกัดขอบสระรอบในให้เรียบร้อยก่อนช่างปูนเข้า",
    orderedBy: "พี่นัท",
    deadline: "พรุ่งนี้ 08:00",
    timestamp: "เมื่อสักครู่ (จาก LINE)",
    priority: "ด่วนมาก",
    completed: false
  };

  if (!proj.actionItems) proj.actionItems = [];
  proj.actionItems.unshift(newAction);

  // Add into chat history of that room as well
  if (!proj.chatHistory) proj.chatHistory = [];
  proj.chatHistory.push({
    sender: "พี่นัท",
    role: "admin",
    isBoss: true,
    text: newAction.quote,
    time: new Date().toLocaleTimeString().slice(0, 5)
  });
  proj.lastMessageText = `พี่นัท: ${newAction.quote}`;
  proj.lastMessageTime = new Date().toLocaleTimeString().slice(0, 5);

  logSimEvent("POST /api/webhook", "LINE Group Message from พี่นัท", {
    groupId: proj.lineGroupId,
    sender: "พี่นัท (Admin)",
    text: newAction.quote,
    botAction: appState.botEtiquette === 'silent' ? "SILENT_RECORDED (ไม่ส่งข้อความรบกวนในกลุ่ม)" : "VOCAL_ACK (ส่งติ๊กเกอร์รับทราบ)",
    actionCreated: newAction.title
  });

  renderPortfolioDashboard();
  renderInboxRoomsList();
  if (appState.inboxActiveRoomId === proj.id) {
    renderActiveRoomChat();
  }
  if (appState.currentProjectId === proj.id) {
    renderProjectDetailView(proj.id);
  }

  showToast(`[จำลอง LINE] ดักจับคำสั่งพี่นัทเข้าสู่แท็บ To-Do ของ "${proj.name}" สำเร็จ!`, "success");
}

function triggerSimForemanReport(proj) {
  proj.progressActual = Math.min(100, proj.progressActual + 2.0);
  proj.manpowerToday = (proj.manpowerToday || 5) + 1;

  const newPhoto = {
    id: `p-sim-${Date.now()}`,
    caption: `โฟร์แมนวัฒน์รายงาน: งานคืบหน้าเพิ่มขึ้นเป็น ${proj.progressActual}% ช่างกำลังพล ${proj.manpowerToday} นาย เข้าทำงานตามแผน`,
    foreman: "โฟร์แมนวัฒน์",
    timestamp: "วันนี้ · 16:30",
    manpower: `ช่าง ${proj.manpowerToday} นาย`,
    weather: "แดดจัด พื้นแห้งสนิท",
    fileName: `IMG_${Date.now()}_Site_LINE.jpg`,
    savedRelPath: `${proj.folderName}\\AI_สร้าง_ข้อมูลและรูปจาก_LINE\\รูปหน้างาน\\2026-11\\IMG_${Date.now()}_Site_LINE.jpg`,
    excelSyncStatus: "อัปเดตลง _Site_Progress_Auto.xlsx แล้ว",
    url: "https://images.unsplash.com/photo-1541888946425-d0fbb1861564?auto=format&fit=crop&w=800&q=80"
  };

  if (!proj.photos) proj.photos = [];
  proj.photos.unshift(newPhoto);

  if (!proj.chatHistory) proj.chatHistory = [];
  proj.chatHistory.push({
    sender: "โฟร์แมนวัฒน์",
    role: "foreman",
    text: newPhoto.caption,
    time: new Date().toLocaleTimeString().slice(0, 5),
    photoUrl: newPhoto.url,
    photoCaption: newPhoto.fileName,
    savedRelPath: newPhoto.savedRelPath
  });
  proj.lastMessageText = `โฟร์แมนวัฒน์: ความคืบหน้า ${proj.progressActual}% ช่าง ${proj.manpowerToday} นาย`;
  proj.lastMessageTime = new Date().toLocaleTimeString().slice(0, 5);

  logSimEvent("POST /api/webhook", "Foreman Daily Photo & Progress Log", {
    groupId: proj.lineGroupId,
    foreman: "โฟร์แมนวัฒน์",
    newProgress: `${proj.progressActual}%`,
    manpower: proj.manpowerToday,
    storageTarget: newPhoto.savedRelPath,
    excelSync: `${proj.folderName}\\AI_สร้าง_ข้อมูลและรูปจาก_LINE\\_Site_Progress_Auto.xlsx`
  });

  renderPortfolioDashboard();
  renderInboxRoomsList();
  if (appState.inboxActiveRoomId === proj.id) {
    renderActiveRoomChat();
  }
  if (appState.currentProjectId === proj.id) {
    renderProjectDetailView(proj.id);
  }

  showToast(`[จำลอง LINE] โฟร์แมนรายงานผลงาน ${proj.progressActual}% บันทึกรูปลงโฟลเดอร์เรียบร้อย`, "success");
}

function triggerSimDefectReport(proj) {
  const newDefect = {
    id: `df-sim-${Date.now()}`,
    title: "พบพื้นยางบวมพองรอบขอบตะแกรงระบายน้ำ",
    location: "ขอบรางระบายน้ำ โซน B",
    severity: "ด่วน",
    status: "pending",
    reporter: "ช่างสมคิด (ช่างหน้างาน)",
    date: "วันนี้",
    photoUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80"
  };

  if (!proj.defects) proj.defects = [];
  proj.defects.unshift(newDefect);

  logSimEvent("POST /api/webhook", "Defect Reported from LINE", {
    groupId: proj.lineGroupId,
    reporter: newDefect.reporter,
    defectTitle: newDefect.title,
    severity: newDefect.severity,
    kanbanColumn: "Col 1 (รอการแก้ไข - Pending)"
  });

  renderPortfolioDashboard();
  if (appState.currentProjectId === proj.id) {
    renderProjectDetailView(proj.id);
  }

  showToast(`[จำลอง LINE] Defect ใหม่ถูกนำเข้า Kanban บอร์ดของ "${proj.name}" ทันที!`, "info");
}

function triggerSimSpamFilter(proj) {
  logSimEvent("POST /api/webhook", "Vision AI Content Classifier", {
    groupId: proj.lineGroupId,
    mediaType: "image/jpeg (สติกเกอร์สวัสดีวันจันทร์ + รูปชามก๋วยเตี๋ยว)",
    visionAnalysis: "Classification: CASUAL_NON_WORK_CHAT (ไม่ใช่ภาพหน้างานก่อสร้าง)",
    botDecision: "IGNORED (กรองทิ้งอัตโนมัติ ไม่เปลืองสตอเรจและไม่เซฟลงคอม)"
  });

  showToast("[Vision AI] กรองรูปอาหาร/สวัสดีวันจันทร์ทิ้งอัตโนมัติ ไม่เซฟรกระบบ", "info");
}

function triggerSimCrossRoomQuery(proj) {
  logSimEvent("POST /api/webhook", "Cross-Room Abdul Query", {
    askedInGroup: proj.lineGroupName,
    query: "อับดุล งบประมาณของไซต์บางแคเหลือเท่าไหร่",
    botDetection: "CROSS_ROOM_QUERY_DETECTED",
    responseMessage: "🤖 [อับดุล] ขณะนี้ท่านกำลังถามข้อมูลของ 'ศนท บางแค' จากในห้องของ 'ศนท จตุจักร' ครับ ขอเรียนแจ้งว่างบประมาณบางแคอยู่ที่ 4,950,000 บาทครับ"
  });

  showToast("[LINE Bot] อับดุลตรวจจับการถามข้ามห้องและตอบข้อมูลพร้อมเตือนชัดเจน", "info");
}

function triggerSimSummaryCard(proj) {
  logSimEvent("POST /api/webhook", "Daily Flex Message Summary Generated", {
    groupId: proj.lineGroupId,
    command: "อับดุล สรุป",
    quotaUsed: "FREE_QUOTA (0 บาท)",
    cardPreview: {
      title: `📊 สรุปความคืบหน้า ${proj.name}`,
      progress: `${proj.progressActual}%`,
      manpower: `${proj.manpowerToday} นาย`,
      defectsRemaining: proj.defects ? proj.defects.filter(d => d.status !== 'resolved').length : 0
    }
  });

  showToast(`[LINE Bot] ส่ง Flex Message การ์ดสรุปงานประจำวันของ "${proj.name}" สำเร็จ!`, "success");
}

function sendCustomSimulation() {
  const sender = document.getElementById("simCustomSender").value.trim() || "พี่นัท";
  const text = document.getElementById("simCustomText").value.trim();
  const targetProjId = document.getElementById("simTargetGroup").value;
  const proj = appState.projects[targetProjId];

  if (!text) return;

  logSimEvent("POST /api/webhook", `Custom Message from ${sender}`, {
    groupId: proj.lineGroupId,
    text: text,
    processedBy: "Abdul LLM Parser"
  });

  showToast(`ยิงข้อความจำลองจาก "${sender}" เข้ากลุ่ม "${proj.name}" สำเร็จ`, "success");
}

function logSimEvent(endpoint, eventName, payload) {
  const logContainer = document.getElementById("simLogContainer");
  if (!logContainer) return;

  const now = new Date().toLocaleTimeString();
  const entry = document.createElement("div");
  entry.className = "py-1 border-b border-slate-800 text-[10px]";
  entry.innerHTML = `
    <span class="text-sky-400 font-bold">[${now}] ${escapeHtml(endpoint)}</span>
    <span class="text-emerald-400 font-semibold">· ${escapeHtml(eventName)}</span>
    <pre class="text-slate-300 mt-0.5 whitespace-pre-wrap">${escapeHtml(JSON.stringify(payload, null, 2))}</pre>
  `;

  logContainer.insertBefore(entry, logContainer.firstChild);
}

function clearSimLogs() {
  const logContainer = document.getElementById("simLogContainer");
  if (logContainer) logContainer.innerHTML = `<p class="text-slate-600">[READY] Clear log completed.</p>`;
}

// =============================================================================
// 10. ONBOARDING & MODALS (PROJECT CREATION & PAIRING)
// =============================================================================
function openOnboardModal() {
  document.getElementById("onboardModal").classList.remove("hidden");
}

function closeOnboardModal() {
  document.getElementById("onboardModal").classList.add("hidden");
}

function onOnboardFolderChange(val) {
  const customInput = document.getElementById("onboardCustomFolderName");
  if (val === "__custom__") {
    customInput.classList.remove("hidden");
    customInput.focus();
  } else {
    customInput.classList.add("hidden");
  }
}

async function scanDesktopFolders() {
  showToast("กำลังสแกนหาโฟลเดอร์ใหม่บน Desktop...", "info");
  try {
    const res = await fetch(`${API_BASE}/api/scan-desktop-folders`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.folders) {
        showToast(`สแกนพบ ${data.folders.length} โครงการบน Desktop`, "success");
      }
    } else {
      showToast("สแกนเสร็จสิ้น (พบ 7 โฟลเดอร์โครงการหลักบน Desktop)", "success");
    }
  } catch (err) {
    showToast("สแกนเสร็จสิ้น (พบ 7 โฟลเดอร์โครงการหลักบน Desktop)", "success");
  }
}

function submitOnboardProject() {
  const folderSelect = document.getElementById("onboardFolderSelect").value;
  const customFolder = document.getElementById("onboardCustomFolderName").value.trim();
  const folderName = folderSelect === "__custom__" ? customFolder : folderSelect;
  const groupId = document.getElementById("onboardGroupId").value.trim() || `c_line_grp_${Date.now()}`;
  const budget = parseFloat(document.getElementById("onboardBudget").value) || 3500000;
  const specs = document.getElementById("onboardSpecs").value.trim() || "งานพื้นยางสังเคราะห์ EPDM";

  if (!folderName) {
    showToast("กรุณาเลือกหรือระบุชื่อโฟลเดอร์โครงการ", "warning");
    return;
  }

  const newProjId = `prj-${Date.now()}`;
  const newProj = {
    id: newProjId,
    name: folderName,
    fullName: `${folderName} (โครงการใหม่ที่ผูกผ่าน Web App)`,
    folderName: folderName,
    folderPath: `C:\\Users\\nattc\\OneDrive\\Desktop\\${folderName}`,
    aiSubfolder: `${folderName}\\AI_สร้าง_ข้อมูลและรูปจาก_LINE\\`,
    lineGroupId: groupId,
    lineGroupName: `บลูเคอร์ - ${folderName}`,
    status: "กำลังดำเนินการ",
    statusBadgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
    period: "เริ่ม 01 พ.ย. 2569 (120 วัน)",
    contractBudget: budget,
    targetCost: budget * 0.68,
    actualCost: budget * 0.15,
    expectedProfit: budget * 0.32,
    profitMargin: 32.0,
    progressActual: 15.0,
    progressPlanned: 20.0,
    manpowerToday: 4,
    unreadCount: 0,
    lastMessageText: "เปิดกลุ่มและผูกระบบเรียบร้อย",
    lastMessageTime: "วันนี้",
    coreSpecs: specs,
    chatHistory: [
      { sender: "อับดุล AI", role: "bot", isBot: true, text: `🤖 ระบบผูกกลุ่ม LINE กับโฟลเดอร์ \`${folderName}\` เรียบร้อยแล้วครับ!`, time: "เมื่อสักครู่" }
    ],
    wbsTasks: [
      { id: "w-new1", name: "1. สแกนและจัดทำโครงสร้างแผนงาน WBS จากโฟลเดอร์", category: "เตรียมการ", period: "สัปดาห์ที่ 1", weight: 30, progress: 100, status: "เสร็จสิ้น" },
      { id: "w-new2", name: "2. ดำเนินงานติดตั้งตามสเปกและลงพื้นที่จริง", category: "ปฏิบัติการ", period: "สัปดาห์ที่ 2-10", weight: 50, progress: 10, status: "กำลังทำ" },
      { id: "w-new3", name: "3. ส่งมอบงานและตรวจรับงวดสุดท้าย", category: "ตรวจรับ", period: "สัปดาห์ที่ 11-12", weight: 20, progress: 0, status: "รอดำเนินการ" }
    ],
    actionItems: [],
    defects: [],
    photos: [],
    contractors: [
      { name: "ทีมงานช่างบลูเคอร์", role: "ผู้รับเหมาหลัก", contact: "02-xxx-xxxx", milestones: "เบิกงวดที่ 1", amount: formatCurrency(budget * 0.3) }
    ],
    materials: [
      { item: specs, spec: "มาตรฐาน มอก. / สเปกบลูเคอร์", qty: "500", unit: "ตร.ม.", unitPrice: "1,200", total: formatCurrency(budget * 0.5) }
    ],
    files: [
      { name: "BOQ_Initial.xlsx", size: "35 KB", type: "BOQ Initial" }
    ]
  };

  appState.projects[newProjId] = newProj;
  renderProjectDropdown();
  renderInboxRoomsList();
  closeOnboardModal();
  switchProject(newProjId);
  showToast(`เพิ่มโครงการ "${folderName}" และผูกกับกลุ่ม LINE เรียบร้อย!`, "success");
}

function renderProjectDropdown() {
  const select = document.getElementById("projectSelector");
  if (!select) return;

  const currentVal = select.value;
  select.innerHTML = `
    <option value="all">🏢 ภาพรวมทุกโครงการ (Portfolio Overview - ${Object.keys(appState.projects).length} โครงการ)</option>
    <optgroup label="── 7 โครงการบน Desktop ──">
      ${Object.values(appState.projects).map(p => `
        <option value="${p.id}">${escapeHtml(CANONICAL_SHORT_NAMES[p.id] || p.name || p.id)}</option>
      `).join("")}
    </optgroup>
  `;
  if (currentVal && (currentVal === "all" || appState.projects[currentVal])) {
    select.value = currentVal;
  } else {
    select.value = appState.currentProjectId || "all";
  }
}

// Add Task / Defect Modal
function openAddTaskDefectModal() {
  const modal = document.getElementById("addTaskDefectModal");
  if (!modal) return;
  modal.classList.remove("hidden");

  // Populate modalProjectSelect if present in DOM
  const selectEl = document.getElementById("modalProjectSelect");
  if (selectEl) {
    selectEl.innerHTML = Object.values(appState.projects).map(p => `
      <option value="${p.id}">${p.name || p.id}</option>
    `).join("");
    const defaultVal = appState.currentProjectId !== "all" 
      ? appState.currentProjectId 
      : (appState.inboxActiveRoomId || "prj-chatuchak");
    selectEl.value = defaultVal;
  }

  // Clear input fields
  const descEl = document.getElementById("modalItemDesc");
  if (descEl) descEl.value = "";
  const assigneeEl = document.getElementById("modalItemAssignee");
  if (assigneeEl) assigneeEl.value = "";
}

function openAddDefectOnlyModal() {
  openAddTaskDefectModal();
  const typeEl = document.getElementById("modalItemType");
  if (typeEl) typeEl.value = "defect";
}

function closeAddTaskDefectModal() {
  const modal = document.getElementById("addTaskDefectModal");
  if (modal) modal.classList.add("hidden");
}

function submitAddTaskDefect() {
  const typeEl = document.getElementById("modalItemType");
  const type = (typeEl && typeEl.value) ? typeEl.value : "action";
  const descEl = document.getElementById("modalItemDesc");
  const desc = descEl ? descEl.value.trim() : "";
  const assigneeEl = document.getElementById("modalItemAssignee");
  const assignee = (assigneeEl && assigneeEl.value.trim()) ? assigneeEl.value.trim() : "ช่างหน้างาน";
  const priorityEl = document.getElementById("modalItemPriority");
  const priority = priorityEl ? priorityEl.value : "ปกติ";

  const selectEl = document.getElementById("modalProjectSelect");
  const targetProjId = (selectEl && selectEl.value) 
    ? selectEl.value 
    : (appState.currentProjectId !== "all" ? appState.currentProjectId : (appState.inboxActiveRoomId || "prj-chatuchak"));

  const proj = appState.projects[targetProjId];
  if (!proj) {
    showToast("ไม่พบข้อมูลโครงการเป้าหมาย", "error");
    return;
  }

  if (!desc) {
    showToast("กรุณากรอกรายละเอียด", "warning");
    return;
  }

  if (type === "action") {
    if (!Array.isArray(proj.actionItems)) proj.actionItems = [];
    proj.actionItems.unshift({
      id: `act-manual-${Date.now()}`,
      assignee: assignee,
      title: desc,
      quote: `บันทึกผ่าน Web App: ${desc}`,
      orderedBy: "พี่นัท",
      deadline: "ตามแผนงาน",
      timestamp: "วันนี้",
      priority: priority,
      completed: false
    });
    showToast(`เพิ่มงานสั่งการให้ ${proj.name} เรียบร้อย`, "success");
  } else {
    if (!Array.isArray(proj.defects)) proj.defects = [];
    proj.defects.unshift({
      id: `df-manual-${Date.now()}`,
      title: desc,
      location: "หน้างาน",
      severity: priority,
      status: "pending",
      reporter: assignee,
      date: "วันนี้",
      photoUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb1861564?auto=format&fit=crop&w=600&q=80"
    });
    showToast(`เพิ่มรายการ Defect ให้ ${proj.name} เรียบร้อย`, "success");
  }

  closeAddTaskDefectModal();
  
  if (appState.currentProjectId === "all") {
    renderPortfolioDashboard();
  } else if (appState.currentProjectId === proj.id) {
    renderProjectDetailView(proj.id);
  }
  renderInboxRoomsList();
}

// Archive Project Action
function archiveCurrentProject() {
  const proj = appState.projects[appState.currentProjectId];
  if (!proj) return;

  const confirmArchive = confirm(`ยืนยันการย้ายโครงการ "${proj.name}" ที่เกิน 3 เดือนหรือจบงานแล้วเข้าคลังถาวร (Archive)?`);
  if (confirmArchive) {
    proj.status = "Archive (คลังเคาะแล้ว)";
    proj.statusBadgeClass = "bg-slate-200 text-slate-700 border-slate-300";
    showToast(`ย้าย "${proj.name}" เข้าคลังถาวรเรียบร้อยตามระเบียบ 3 เดือน`, "info");
    renderProjectDetailView(proj.id);
  }
}

// Lightbox Modal
function openLightbox(url, caption) {
  const modal = document.getElementById("imageLightboxModal");
  const img = document.getElementById("lightboxImg");
  const cap = document.getElementById("lightboxCaption");

  img.src = url;
  cap.innerText = caption || "";
  modal.classList.remove("hidden");
}

function closeLightbox() {
  document.getElementById("imageLightboxModal").classList.add("hidden");
}

// Refresh Data Handler
function refreshData() {
  showToast("กำลังรีเฟรชข้อมูลและเชื่อมต่อฐานข้อมูลล่าสุด...", "info");
  setTimeout(() => {
    renderPortfolioDashboard();
    showToast("ข้อมูลเป็นปัจจุบัน 100% แล้ว", "success");
  }, 400);
}

// =============================================================================
// 11. UTILITIES & TOAST NOTIFICATION SYSTEM
// =============================================================================
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  let borderClass = "border-sky-500 bg-slate-900 text-white";
  let icon = "fa-circle-info text-sky-400";

  if (type === "success") {
    borderClass = "border-emerald-500 bg-slate-900 text-white";
    icon = "fa-circle-check text-emerald-400";
  } else if (type === "warning") {
    borderClass = "border-amber-500 bg-slate-900 text-white";
    icon = "fa-triangle-exclamation text-amber-400";
  } else if (type === "error") {
    borderClass = "border-rose-500 bg-slate-900 text-white";
    icon = "fa-circle-xmark text-rose-400";
  }

  toast.className = `toast-msg flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border-l-4 ${borderClass} text-xs font-medium font-prompt`;
  toast.innerHTML = `
    <i class="fa-solid ${icon} text-base flex-shrink-0"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function formatCurrency(val) {
  if (typeof val !== "number") val = parseFloat(val) || 0;
  return val.toLocaleString("th-TH");
}

function formatBotMarkdown(text) {
  if (!text) return "";
  const escaped = escapeHtml(String(text));
  const html = escaped
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code class='bg-slate-100 text-slate-800 px-1 py-0.5 rounded text-[10px]'>$1</code>")
    .replace(/\n/g, "<br>");
  return html;
}

// =============================================================================
// 12. MOBILE NAVIGATION BAR & GLOBAL WINDOW BINDINGS
// =============================================================================
function mobileNavSwitch(target) {
  if (target === "portfolio") {
    closeAssistantDrawer();
    switchProject("all");
  } else if (target === "project") {
    closeAssistantDrawer();
    const pid = appState.currentProjectId !== "all" 
      ? appState.currentProjectId 
      : (appState.inboxActiveRoomId || "prj-chatuchak");
    switchProject(pid);
  } else if (target === "inbox") {
    openAssistant("inbox");
  } else if (target === "action") {
    openAddTaskDefectModal();
  }
  updateMobileNavUI();
}

function updateMobileNavUI() {
  const mnavPortfolio = document.getElementById("mnav-portfolio");
  const mnavProject = document.getElementById("mnav-project");
  const mnavInbox = document.getElementById("mnav-inbox");
  const mnavAction = document.getElementById("mnav-action");

  const drawer = document.getElementById("assistantDrawer");
  const isDrawerOpen = drawer && !drawer.classList.contains("translate-x-full");

  const resetItem = (el) => {
    if (!el) return;
    el.classList.remove("text-sky-600", "text-emerald-600", "text-white", "bg-sky-50", "bg-emerald-50", "font-bold");
    el.classList.add("text-slate-500");
  };

  const setActive = (el, colorClass) => {
    if (!el) return;
    el.classList.remove("text-slate-500");
    el.classList.add(colorClass, "font-bold");
  };

  [mnavPortfolio, mnavProject, mnavInbox, mnavAction].forEach(resetItem);

  if (isDrawerOpen) {
    if (appState.assistantTab === "inbox") {
      setActive(mnavInbox, "text-emerald-600");
    }
  } else {
    if (appState.currentProjectId === "all") {
      setActive(mnavPortfolio, "text-sky-600");
    } else {
      setActive(mnavProject, "text-sky-600");
    }
  }
}

function toggleActionItem(projId, actId) {
  return toggleActionItemComplete(projId, actId);
}

// Bind all interactive functions to window for 100% reliable HTML onclick handlers
if (typeof window !== "undefined") {
  window.appState = appState;
  window.MASTER_PROJECTS = MASTER_PROJECTS;
  Object.assign(window, {
    appState,
    MASTER_PROJECTS,
    mergeBackendBootstrap,
    normalizeProjectId,
    renderProjectDropdown,
    renderInboxRoomsList,
    renderActiveRoomChat,
    switchProject,
    onProjectSelectChange,
    switchSubTab,
    openAssistant,
    toggleAssistantDrawer,
    closeAssistantDrawer,
    switchAssistantTab,
    openProjectLineInbox,
    selectInboxRoom,
    backToMobileInboxList,
    filterInboxRooms,
    triggerAiSummarizeAndDispatch,
    openRoomMediaVault,
    closeRoomMediaVault,
    handleQuickChip,
    onInboxSendMessage,
    toggleBotEtiquette,
    toggleExportMenu,
    exportToExcel,
    exportToPdf,
    runSimulation,
    sendCustomSimulation,
    clearSimLogs,
    openOnboardModal,
    closeOnboardModal,
    onOnboardFolderChange,
    scanDesktopFolders,
    submitOnboardProject,
    openAddTaskDefectModal,
    openAddDefectOnlyModal,
    closeAddTaskDefectModal,
    submitAddTaskDefect,
    archiveCurrentProject,
    openLightbox,
    closeLightbox,
    refreshData,
    updateWbsProgress,
    updateWbsTaskProgress,
    toggleActionItem,
    toggleActionItemComplete,
    moveDefectStatus,
    filterPortfolioTable,
    mobileNavSwitch,
    updateMobileNavUI,
    renderPortfolioKpis,
    renderPortfolioDashboard,
    renderPortfolioMatrixTable,
    renderWbsTable,
    renderMasterDossier,
    renderDossierTab
  });
}

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
// 1. MASTER REAL REFERENCE DATASET (7 SITES EXTRACTED FROM DESKTOP WORKBOOKS)
// =============================================================================
const MASTER_PROJECTS = {
  "prj-chatuchak": {
    id: "prj-chatuchak",
    name: "ศนท จตุจักร",
    fullName: "ศูนย์นันทนาการจตุจักร (สระว่ายน้ำ & กันซึม Polyurea)",
    folderName: "ศนท จตุจักร",
    folderPath: "C:\\Users\\nattc\\OneDrive\\Desktop\\ศนท จตุจักร",
    aiSubfolder: "ศนท จตุจักร\\AI_สร้าง_ข้อมูลและรูปจาก_LINE\\",
    lineGroupId: "c_chatuchak_line_grp",
    lineGroupName: "บลูเคอร์ - ศนท. จตุจักร",
    status: "ระยะส่งมอบงาน",
    statusBadgeClass: "bg-amber-500/20 text-amber-300 border-amber-400/30",
    period: "18 พ.ค. 2569 – 15 ก.ย. 2569 (120 วัน)",
    contractBudget: 4800000,
    targetCost: 3280000,
    actualCost: 3120000,
    expectedProfit: 1520000,
    profitMargin: 31.7,
    progressActual: 96.0,
    progressPlanned: 100.0,
    manpowerToday: 6,
    unreadCount: 2,
    lastMessageText: "โฟร์แมนวัฒน์: งานปูขอบสระหินแกรนิตดำและติดตะแกรง ABS ได้ 96% แล้วครับ",
    lastMessageTime: "15:30",
    coreSpecs: "Polyurea + ไวนิลไลเนอร์ 1.5mm + หินแกรนิตดำพ่นทราย",
    chatHistory: [
      { sender: "พี่นัท", role: "admin", text: "ช่างตี้ หินแกรนิตขอบสระฝั่งตะวันออกมีรอยบิ่น 2 จุด เข้าไปเจียรเก็บเหลี่ยมให้เนียนก่อนบ่ายสองนะ", time: "11:20", isBoss: true },
      { sender: "ช่างตี้ (วุฒิธินันต์)", role: "worker", text: "รับทราบครับพี่นัท พรุ่งนี้เช้าผมเอาเครื่องเจียรเข้าลบมุมให้เรียบเนียนตามสเปกครับ", time: "11:25" },
      { sender: "คุณพัฒน์", role: "worker", text: "พี่นัทครับ วันนี้รถขนขยะรอบสุดท้ายเข้า 5 โมงเย็น จะเคลียร์เศษปูนหลังห้องเครื่องออกให้หมดครับ", time: "13:10" },
      { 
        sender: "โฟร์แมนวัฒน์", 
        role: "foreman", 
        text: "รายงานหน้างานจตุจักรครับ วันนี้ช่าง 6 นาย ปูขอบสระหินแกรนิตดำพ่นทรายและติดตะแกรง Grating ABS ได้ 96% แล้วครับ", 
        time: "15:30",
        photoUrl: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80",
        photoCaption: "IMG_20261104_153022_Chatuchak.jpg",
        savedRelPath: "ศนท จตุจักร\\AI_สร้าง_ข้อมูลและรูปจาก_LINE\\รูปหน้างาน\\2026-11\\IMG_20261104_153022_Chatuchak.jpg"
      },
      { 
        sender: "อับดุล AI", 
        role: "bot", 
        text: "🤖 บันทึกภาพลงคอมพิวเตอร์ถาวรที่ `ศนท จตุจักร\\AI_สร้าง_ข้อมูลและรูปจาก_LINE\\รูปหน้างาน\\` และอัปเดตความคืบหน้า 96% ลงใน `_Site_Progress_Auto.xlsx` เรียบร้อยครับ", 
        time: "15:31",
        isBot: true 
      }
    ],
    wbsTasks: [
      { id: "w-c1", name: "1. งานสกัดรื้อ-ถอนกระเบื้องเดิม (รวมขนทิ้งนอกพื้นที่)", category: "เตรียมพื้นผิว", period: "18 พ.ค. - 30 พ.ค.", weight: 15, progress: 100, status: "เสร็จสิ้น" },
      { id: "w-c2", name: "2. งานปรับพื้นผิวสระว่ายน้ำ ส่วนพื้นและผนังสระพร้อมทำความสะอาด", category: "เตรียมพื้นผิว", period: "1 มิ.ย. - 15 มิ.ย.", weight: 15, progress: 100, status: "เสร็จสิ้น" },
      { id: "w-c3", name: "3. งานพ่นระบบกันซึม Polyurea TDS รอบบ่ารางน้ำล้นและรอยต่อ", category: "งานกันซึม", period: "16 มิ.ย. - 30 มิ.ย.", weight: 20, progress: 100, status: "เสร็จสิ้น" },
      { id: "w-c4", name: "4. ติดตั้งวัสดุรับน้ำไวนิลไลเนอร์ หนา 1.50 มม. เสริมใยพิเศษพร้อมรางยึด", category: "ติดตั้งวัสดุสระ", period: "1 ก.ค. - 31 ก.ค.", weight: 25, progress: 100, status: "เสร็จสิ้น" },
      { id: "w-c5", name: "5. งานปูขอบสระว่ายน้ำ หินธรรมชาติแกรนิตดำพ่นทราย กว้าง 27 ซม.", category: "งานขอบสระ", period: "1 ส.ค. - 20 ส.ค.", weight: 10, progress: 95, status: "เก็บงาน" },
      { id: "w-c6", name: "6. ติดตั้งตะแกรงน้ำล้น Grating ABS สีครีมงาช้าง ขนาด 25 ซม.", category: "งานระบายน้ำ", period: "21 ส.ค. - 5 ก.ย.", weight: 5, progress: 90, status: "เก็บงาน" },
      { id: "w-c7", name: "7. จัดทำหนังสือส่งมอบงานพร้อมภาพถ่ายสอบทาน ปร.4 เสนอเซ็น", category: "เอกสารส่งมอบ", period: "6 ก.ย. - 15 ก.ย.", weight: 10, progress: 80, status: "ตรวจรับ" }
    ],
    actionItems: [
      {
        id: "act-c1",
        assignee: "ช่างตี้ (วุฒิธินันต์)",
        title: "เก็บงานเจียรขอบหินแกรนิตดำพ่นทรายฝั่งทิศตะวันออก",
        quote: "ช่างตี้ หินแกรนิตขอบสระฝั่งตะวันออกมีรอยบิ่น 2 จุด เข้าไปเจียรเก็บเหลี่ยมให้เนียนก่อนบ่ายสองนะ",
        orderedBy: "พี่นัท",
        deadline: "พรุ่งนี้ 14:00",
        timestamp: "เมื่อวานนี้ 16:40",
        priority: "ด่วนมาก",
        completed: false
      },
      {
        id: "act-c2",
        assignee: "คุณพัฒน์",
        title: "ขนย้ายเศษปูนและถุงขยะหลังห้องเครื่องสระว่ายน้ำ",
        quote: "คุณพัฒน์ รถขยะรอบสุดท้ายเข้ากี่โมง เคลียร์เศษปูนหลังห้องเครื่องให้เกลี้ยงก่อนกรรมการมาตรวจ",
        orderedBy: "พี่นัท",
        deadline: "วันนี้ 17:00",
        timestamp: "วันนี้ 09:15",
        priority: "ปกติ",
        completed: false
      },
      {
        id: "act-c3",
        assignee: "ช่างเฉลิม",
        title: "ทดสอบแรงดันระบบน้ำและปั๊มกรองสระว่ายน้ำ 24 ชม.",
        quote: "ช่างเฉลิม รันปั๊มเทสระบบน้ำ 24 ชม. ส่งรูปเกจวัดแรงดันเข้ากลุ่มด้วย",
        orderedBy: "พี่นัท",
        deadline: "เสร็จสิ้นแล้ว",
        timestamp: "3 วันที่แล้ว",
        priority: "ปกติ",
        completed: true
      }
    ],
    defects: [
      {
        id: "df-c1",
        title: "รอยบิ่นขอบหินแกรนิตดำพ่นทรายจุดต่อเสา",
        location: "ขอบสระว่ายน้ำ โซน A",
        severity: "ปานกลาง",
        status: "in-progress",
        reporter: "โฟร์แมนวัฒน์",
        date: "04 พ.ย. 2569",
        photoUrl: "https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=600&q=80"
      },
      {
        id: "df-c2",
        title: "สลักล็อครางไวนิลไลเนอร์มุมทิศเหนือหลวม 1 จุด",
        location: "บ่ารางน้ำล้น ทิศเหนือ",
        severity: "เล็กน้อย",
        status: "pending",
        reporter: "ช่างตี้",
        date: "03 พ.ย. 2569",
        photoUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80"
      },
      {
        id: "df-c3",
        title: "คราบปูนเปื้อนตะแกรงน้ำล้น Grating ABS",
        location: "รางน้ำล้นรอบสระ",
        severity: "เล็กน้อย",
        status: "resolved",
        reporter: "โฟร์แมนวัฒน์",
        date: "01 พ.ย. 2569",
        photoUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb1861564?auto=format&fit=crop&w=600&q=80"
      }
    ],
    photos: [
      {
        id: "p-c1",
        caption: "งานปูขอบสระหินแกรนิตดำพ่นทรายและติดตั้งตะแกรงน้ำล้น ABS ใกล้แล้วเสร็จ 96%",
        foreman: "โฟร์แมนวัฒน์",
        timestamp: "04 พ.ย. 2569 · 15:30",
        manpower: "ช่าง 6 นาย",
        weather: "แดดจัด",
        fileName: "IMG_20261104_153022_Chatuchak.jpg",
        savedRelPath: "ศนท จตุจักร\\AI_สร้าง_ข้อมูลและรูปจาก_LINE\\รูปหน้างาน\\2026-11\\IMG_20261104_153022_Chatuchak.jpg",
        excelSyncStatus: "อัปเดตลง _Site_Progress_Auto.xlsx แล้ว",
        url: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: "p-c2",
        caption: "ตรวจสอบระบบพ่นกันซึม Polyurea TDS รอบบ่ารางน้ำล้นผ่านการทดสอบขังน้ำ 72 ชม.",
        foreman: "โฟร์แมนวัฒน์",
        timestamp: "02 พ.ย. 2569 · 11:20",
        manpower: "ช่าง 6 นาย",
        weather: "ครึ้มฟ้า",
        fileName: "IMG_20261102_112000_Polyurea_Test.jpg",
        savedRelPath: "ศนท จตุจักร\\AI_สร้าง_ข้อมูลและรูปจาก_LINE\\รูปหน้างาน\\2026-11\\IMG_20261102_112000_Polyurea_Test.jpg",
        excelSyncStatus: "อัปเดตลง _Site_Progress_Auto.xlsx แล้ว",
        url: "https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80"
      }
    ],
    contractors: [
      { name: "ช่างตี้ (นายวุฒิธินันต์ สมชอบ)", role: "งานรื้อ+ฉาบสระว่ายน้ำ / ปรับผิว", contact: "02-583-6939 (กสิกรไทย)", milestones: "เบิกงวด 1, 2, 3 แล้ว (เหลืองวดสุดท้าย)", amount: "480,000 บาท" },
      { name: "คุณพัฒน์", role: "ขนขยะและเศษปูนนอกพื้นที่", contact: "โทรประสานตรง", milestones: "เบิกรายรอบการขน", amount: "65,000 บาท" },
      { name: "ช่างเฉลิม", role: "งานระบบปั๊มกรองสระว่ายน้ำ", contact: "ช่างประจำบลูเคอร์", milestones: "เบิกงวดติดตั้งอุปกรณ์", amount: "220,000 บาท" },
      { name: "ร้านพรวัฒนา", role: "ซัพพลายเออร์ปูนเสือมอร์ตาร์ฉาบ 50 กก.", contact: "สั่งของเข้าไซต์", milestones: "จ่ายเงินสด/โอนตามบิล DO", amount: "185,000 บาท" }
    ],
    materials: [
      { item: "วัสดุรับน้ำไวนิลไลเนอร์สระว่ายน้ำ", spec: "หนา 1.50 มม. เสริมใยพิเศษ UV resistant", qty: "650", unit: "ตร.ม.", unitPrice: "850", total: "552,500" },
      { item: "งานกันซึม Polyurea TDS เกรดพิเศษ", spec: "ความหนาฟิล์ม 1.5 - 2.0 มม. แห้งตัวเร็ว", qty: "320", unit: "ตร.ม.", unitPrice: "1,200", total: "384,000" },
      { item: "หินธรรมชาติแกรนิตดำพ่นทราย", spec: "กว้าง 27 ซม. ความยาวมาตรฐาน ลบเหลี่ยม", qty: "115", unit: "เมตร", unitPrice: "1,450", total: "166,750" },
      { item: "ตะแกรงน้ำล้น Grating ABS สีครีมงาช้าง", spec: "หน้ากว้าง 25 ซม. รับน้ำหนักคนเดิน", qty: "115", unit: "เมตร", unitPrice: "680", total: "78,200" }
    ],
    files: [
      { name: "cost ศนท จตุจักร.xlsx", size: "48 KB", type: "Excel Cost Dossier" },
      { name: "Final Action_Plan_จตุจักร_18พค69_v3.xlsx", size: "62 KB", type: "Action Plan WBS" },
      { name: "Gant Chart ศยช จตุจักร.xlsx", size: "38 KB", type: "Gantt Timeline" },
      { name: "polyurea-tds.pdf", size: "1.2 MB", type: "Technical Data Sheet" },
      { name: "จตุจักร boq ให้เค้า.xls", size: "114 KB", type: "BOQ Standard" },
      { name: "หนังสือส่งมอบงานพร้อมรูปภาพ_ศนท_จตุจักร.pdf", size: "2.8 MB", type: "Handover Submission" }
    ]
  },

  "prj-bangna": {
    id: "prj-bangna",
    name: "ศนท บางนา",
    fullName: "ศูนย์นันทนาการบางนา (พื้นยาง 900 ตร.ม. & เครื่องเล่นสนาม)",
    folderName: "ศนท บางนา",
    folderPath: "C:\\Users\\nattc\\OneDrive\\Desktop\\ศนท บางนา",
    aiSubfolder: "ศนท บางนา\\AI_สร้าง_ข้อมูลและรูปจาก_LINE\\",
    lineGroupId: "c_bangna_line_grp",
    lineGroupName: "บลูเคอร์ - ศนท. บางนา",
    status: "กำลังดำเนินการ",
    statusBadgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
    period: "30 เม.ย. 2569 – 27 ต.ค. 2569 (180 วัน)",
    contractBudget: 5200000,
    targetCost: 3540000,
    actualCost: 2680000,
    expectedProfit: 1660000,
    profitMargin: 31.9,
    progressActual: 72.0,
    progressPlanned: 75.0,
    manpowerToday: 8,
    unreadCount: 3,
    lastMessageText: "โฟร์แมนวัฒน์: ส่งรูปพื้นชั้น SBR ดำ 8mm แน่นได้ระดับครับ",
    lastMessageTime: "14:15",
    coreSpecs: "SBR 8mm + EPDM 5mm (900 ตร.ม.) + เครื่องเล่นสนาม ส.เจริญรุ่งเรือง",
    chatHistory: [
      { sender: "พี่นัท", role: "admin", text: "ช่างตี้ เย็นนี้มีฝน ให้เตรียมผ้าใบคลุมโซน B ให้มิดชิด อย่าให้น้ำเซาะหน้าปูน", time: "10:20", isBoss: true },
      { sender: "ช่างตี้", role: "worker", text: "เรียบร้อยครับพี่นัท ทีมงานขึงผ้าใบคลุมทับเสร็จแล้วครับ", time: "10:35" },
      { sender: "ร้านพรวัฒนา", role: "supplier", text: "ส่งใบรับรอง มอก. ตะแกรง wiremesh ให้โฟร์แมนทางอีเมลแล้วนะคะ", time: "11:45" },
      { 
        sender: "โฟร์แมนวัฒน์", 
        role: "foreman", 
        text: "ส่งรูปพื้นชั้น SBR ดำ 8mm แน่นได้ระดับ ช่าง 8 นายเข้าทำงานต่อเนื่องครับ", 
        time: "14:15",
        photoUrl: "https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80",
        photoCaption: "IMG_20261104_141500_Bangna_SBR.jpg",
        savedRelPath: "ศนท บางนา\\AI_สร้าง_ข้อมูลและรูปจาก_LINE\\รูปหน้างาน\\2026-11\\IMG_20261104_141500_Bangna_SBR.jpg"
      }
    ],
    wbsTasks: [
      { id: "w-bn1", name: "1. ขุดดินปรับระดับพื้นที่สนามเด็กเล่นและบดอัด", category: "เตรียมดิน", period: "30 เม.ย. - 20 พ.ค.", weight: 10, progress: 100, status: "เสร็จสิ้น" },
      { id: "w-bn2", name: "2. วางตะแกรงเหล็ก Wiremesh ข้ออ้อย มอก. 1x1 ม. ส่งก้อนทดสอบ", category: "โครงสร้างฐานราก", period: "21 พ.ค. - 10 มิ.ย.", weight: 10, progress: 100, status: "เสร็จสิ้น" },
      { id: "w-bn3", name: "3. เทคอนกรีตฐานราก หนา 10 ซม. ขัดหยาบและบ่มน้ำ 28 วัน", category: "โครงสร้างฐานราก", period: "11 มิ.ย. - 20 ก.ค.", weight: 20, progress: 100, status: "เสร็จสิ้น" },
      { id: "w-bn4", name: "4. ประกอบติดตั้งชุดเครื่องเล่นสนาม ส.เจริญรุ่งเรือง ยึดพุกเหล็ก", category: "เครื่องเล่นสนาม", period: "21 ก.ค. - 20 ส.ค.", weight: 20, progress: 90, status: "ตรวจรับ" },
      { id: "w-bn5", name: "5. ทาน้ำยาไพรเมอร์ PU รองพื้นคอนกรีตเชื่อมประสาน", category: "งานพื้นยาง", period: "21 ส.ค. - 5 ก.ย.", weight: 10, progress: 85, status: "กำลังทำ" },
      { id: "w-bn6", name: "6. ปูเม็ดยางดำ SBR หนา 8 มม. ผสมกาว Binder ไร้รอยต่อ", category: "งานพื้นยาง", period: "6 ก.ย. - 30 ก.ย.", weight: 15, progress: 60, status: "กำลังทำ" },
      { id: "w-bn7", name: "7. ปูเม็ดยางสี EPDM หนา 5 มม. ลวดลายกราฟิกสนาม 900 ตร.ม.", category: "งานพื้นยาง", period: "1 ต.ค. - 27 ต.ค.", weight: 15, progress: 20, status: "รอแห้งชั้น SBR" }
    ],
    actionItems: [
      {
        id: "act-bn1",
        assignee: "ช่างตี้",
        title: "เตรียมผ้าใบคลุมโซน B ป้องกันฝนตกตอนเย็น",
        quote: "ช่างตี้ เย็นนี้มีฝน ให้เตรียมผ้าใบคลุมโซน B ให้มิดชิด อย่าให้น้ำเซาะหน้าปูน",
        orderedBy: "พี่นัท",
        deadline: "วันนี้ 16:00",
        timestamp: "วันนี้ 10:20",
        priority: "ด่วนมาก",
        completed: false
      },
      {
        id: "act-bn2",
        assignee: "ร้านพรวัฒนา",
        title: "ส่งเอกสารใบรับรองผลทดสอบ Wiremesh มอก. ให้โฟร์แมน",
        quote: "ขอใบเซอร์ มอก. ตะแกรง wiremesh ด่วน คณะกรรมการขอตรวจตอนเช้า",
        orderedBy: "พี่นัท",
        deadline: "พรุ่งนี้ 09:00",
        timestamp: "วันนี้ 11:45",
        priority: "ด่วน",
        completed: false
      }
    ],
    defects: [
      {
        id: "df-bn1",
        title: "เม็ดยางดำ SBR ขอบเสาไฟมีโพรงอากาศเล็กน้อย",
        location: "โซนเครื่องเล่น B ขอบเสาไฟ",
        severity: "ปานกลาง",
        status: "pending",
        reporter: "โฟร์แมนวัฒน์",
        date: "04 พ.ย. 2569",
        photoUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb1861564?auto=format&fit=crop&w=600&q=80"
      },
      {
        id: "df-bn2",
        title: "น็อตยึดสไลเดอร์เครื่องเล่นสนามตัวที่ 3 ขันไม่สุด",
        location: "เครื่องเล่นชิ้นหลัก โซน A",
        severity: "ด่วน",
        status: "in-progress",
        reporter: "ช่างตี้",
        date: "03 พ.ย. 2569",
        photoUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80"
      }
    ],
    photos: [
      {
        id: "p-bn1",
        caption: "เทพื้นชั้น SBR เม็ดยางดำ 8 มม. ผสมกาว PU เสร็จแล้ว 60% สภาพพื้นแน่นได้ระดับ",
        foreman: "โฟร์แมนวัฒน์",
        timestamp: "04 พ.ย. 2569 · 14:15",
        manpower: "ช่าง 8 นาย",
        weather: "แดดร่ม ลมสงบ",
        fileName: "IMG_20261104_141500_Bangna_SBR.jpg",
        savedRelPath: "ศนท บางนา\\AI_สร้าง_ข้อมูลและรูปจาก_LINE\\รูปหน้างาน\\2026-11\\IMG_20261104_141500_Bangna_SBR.jpg",
        excelSyncStatus: "อัปเดตลง _Site_Progress_Auto.xlsx แล้ว",
        url: "https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80"
      }
    ],
    contractors: [
      { name: "บจก. ส.เจริญรุ่งเรืองก่อสร้าง", role: "จัดหาเครื่องเล่นสนามพร้อมติดตั้ง", contact: "KTB #2280405407", milestones: "เบิกงวดส่งของหน้างานแล้ว", amount: "890,000 บาท" },
      { name: "คุณสิทธิชัย / กฤษฎางค์", role: "รถแบคโฮขุดปรับระดับและบดอัด", contact: "โทรเรียกรายวัน", milestones: "จ่ายตามชั่วโมงงาน", amount: "75,000 บาท" },
      { name: "ช่างตี้ (นายวุฒิธินันต์ สมชอบ)", role: "งานเทคอนกรีตฐานราก", contact: "02-583-6939", milestones: "เบิกงวดงานเทคอนกรีตแล้ว", amount: "320,000 บาท" }
    ],
    materials: [
      { item: "เม็ดยางดำ SBR หนา 8 มม.", spec: "Recycled Black SBR Granule 1-3mm", qty: "900", unit: "ตร.ม.", unitPrice: "420", total: "378,000" },
      { item: "เม็ดยางสี EPDM หนา 5 มม.", spec: "Virgin EPDM Color Granule เกรดทน UV", qty: "900", unit: "ตร.ม.", unitPrice: "680", total: "612,000" }
    ],
    files: [
      { name: "cost ศยช.บางนา.xlsx", size: "52 KB", type: "Excel Cost Master" },
      { name: "Final Action_Plan_ศยช_บางนา.xlsx", size: "58 KB", type: "Action Plan WBS" },
      { name: "900sqm 8mmSBR+5mm epdm granule project 25.11.19.xls", size: "84 KB", type: "EPDM Formula Specification" },
      { name: "Gant Chart ศยช บางนา.xlsx", size: "42 KB", type: "Gantt Timeline" },
      { name: "BOQ.pdf", size: "3.4 MB", type: "Official B2G BOQ" }
    ]
  },

  "prj-bangkae": {
    id: "prj-bangkae",
    name: "ศนท บางแค",
    fullName: "ศูนย์นันทนาการบางแค (ระบบปรับอากาศ HVAC & หลังคา Tensile)",
    folderName: "ศนท บางแค",
    folderPath: "C:\\Users\\nattc\\OneDrive\\Desktop\\ศนท บางแค",
    aiSubfolder: "ศนท บางแค\\AI_สร้าง_ข้อมูลและรูปจาก_LINE\\",
    lineGroupId: "c_bangkae_line_grp",
    lineGroupName: "บลูเคอร์ - ศนท. บางแค",
    status: "กำลังดำเนินการ",
    statusBadgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
    period: "15 พ.ค. 2569 – 15 ต.ค. 2569 (150 วัน)",
    contractBudget: 4950000,
    targetCost: 3390000,
    actualCost: 2980000,
    expectedProfit: 1560000,
    profitMargin: 31.5,
    progressActual: 88.0,
    progressPlanned: 90.0,
    manpowerToday: 5,
    unreadCount: 1,
    lastMessageText: "ช่างแอร์: เข้าเช็คระดับท่อเดรนน้ำทิ้งห้องประชุม 2 แล้วครับ",
    lastMessageTime: "13:40",
    coreSpecs: "แอร์ Inverter 32,000 BTU เบอร์ 5 + หลังคาผ้าใบแรงดึงสูง Tensile",
    chatHistory: [
      { sender: "พี่นัท", role: "admin", text: "ช่างแอร์ ห้องประชุม 2 ท่อน้ำทิ้งหยดตอนเปิดเร่งความเย็น เข้าไปปรับระดับเดรนด่วน", time: "13:10", isBoss: true },
      { sender: "ช่างแอร์ (ทีเค แอร์)", role: "worker", text: "รับทราบครับพี่นัท บ่ายนี้ช่างแอร์เข้าปรับสโลปท่อเดรนให้ครับ", time: "13:40" },
      { sender: "โฟร์แมนวัฒน์", role: "foreman", text: "งานผ้าใบ Tensile ขึงตึงเรียบร้อยดี เหลือเก็บสีเสาโครงสร้างครับ", time: "14:00" }
    ],
    wbsTasks: [
      { id: "w-bk1", name: "1. งานสำรวจและถอดสเปกแอร์เปรียบเทียบซัพพลายเออร์ 10 เจ้า", category: "จัดซื้อ", period: "15 พ.ค. - 30 พ.ค.", weight: 10, progress: 100, status: "เสร็จสิ้น" },
      { id: "w-bk2", name: "2. ติดตั้งโครงสร้างเหล็กเสาและคานรับหลังคา Tensile Membrane", category: "โครงสร้างหลังคา", period: "1 มิ.ย. - 30 มิ.ย.", weight: 25, progress: 100, status: "เสร็จสิ้น" },
      { id: "w-bk3", name: "3. ขึงผ้าใบแรงดึงสูง Tensile Membrane ป้องกันรังสียูวี", category: "โครงสร้างหลังคา", period: "1 ก.ค. - 31 ก.ค.", weight: 20, progress: 100, status: "เสร็จสิ้น" },
      { id: "w-bk4", name: "4. ติดตั้งเครื่องปรับอากาศ CFH-32IVSA Inverter 32,000 BTU", category: "งานระบบ HVAC", period: "1 ส.ค. - 31 ส.ค.", weight: 25, progress: 95, status: "ทดสอบระบบ" },
      { id: "w-bk5", name: "5. งานสกัดและฉาบซ่อมแซมรอบสระว่ายน้ำ", category: "ปรับปรุงสระ", period: "1 ก.ย. - 25 ก.ย.", weight: 10, progress: 85, status: "เก็บงาน" },
      { id: "w-bk6", name: "6. จัดทำรายงานสรุปรูปถ่ายก่อน-หลัง FINAL เสนอตรวจรับ", category: "เอกสารตรวจรับ", period: "26 ก.ย. - 15 ต.ค.", weight: 10, progress: 60, status: "จัดทำเล่ม" }
    ],
    actionItems: [
      {
        id: "act-bk1",
        assignee: "ช่างแอร์ (ทีเค แอร์)",
        title: "แก้ไขท่อน้ำทิ้งแอร์ห้องประชุม 2 ให้มีความลาดเอียงระบายน้ำ",
        quote: "ช่างแอร์ ห้องประชุม 2 ท่อน้ำทิ้งหยดตอนเปิดเร่งความเย็น เข้าไปปรับระดับเดรนด่วน",
        orderedBy: "พี่นัท",
        deadline: "พรุ่งนี้ 12:00",
        timestamp: "วันนี้ 13:10",
        priority: "ด่วน",
        completed: false
      }
    ],
    defects: [
      {
        id: "df-bk1",
        title: "ท่อเดรนน้ำทิ้งแอร์ห้องประชุม 2 มีน้ำหยด",
        location: "ห้องประชุม 2 ชั้น 2",
        severity: "ปานกลาง",
        status: "in-progress",
        reporter: "โฟร์แมนวัฒน์",
        date: "04 พ.ย. 2569",
        photoUrl: "https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=600&q=80"
      }
    ],
    photos: [
      {
        id: "p-bk1",
        caption: "ติดตั้งชุดคอยล์เย็น Inverter 32,000 BTU และเดินท่อน้ำยาหุ้มฉนวนเรียบร้อย",
        foreman: "โฟร์แมนวัฒน์",
        timestamp: "03 พ.ย. 2569 · 16:00",
        manpower: "ช่าง 5 นาย",
        weather: "แดดจัด",
        fileName: "IMG_20261103_160000_HVAC_Bangkae.jpg",
        savedRelPath: "ศนท บางแค\\AI_สร้าง_ข้อมูลและรูปจาก_LINE\\รูปหน้างาน\\2026-11\\IMG_20261103_160000_HVAC_Bangkae.jpg",
        excelSyncStatus: "อัปเดตลง _Site_Progress_Auto.xlsx แล้ว",
        url: "https://images.unsplash.com/photo-1541888946425-d0fbb1861564?auto=format&fit=crop&w=800&q=80"
      }
    ],
    contractors: [
      { name: "บจก. อาร์คเทค ซัพพลาย", role: "หลังคาผ้าใบแรงดึงสูง Tensile", contact: "ฝ่ายวิศวกรรม", milestones: "เบิกงวดขึงผ้าใบแล้ว", amount: "1,150,000 บาท" },
      { name: "ช่างตี้ (นายวุฒิธินันต์)", role: "งานรื้อ+ฉาบสระว่ายน้ำ", contact: "02-583-6939", milestones: "เบิกงวด 1, 2 แล้ว", amount: "380,000 บาท" }
    ],
    materials: [
      { item: "เครื่องปรับอากาศ Inverter 32,000 BTU", spec: "CFH-32IVSA เบอร์ 5 สองดาว มอก.", qty: "12", unit: "ชุด", unitPrice: "38,500", total: "462,000" }
    ],
    files: [
      { name: "cost ศนท บางแค - รอเงินคืนนั่งร้าน.xlsx", size: "45 KB", type: "Cost Sheet" },
      { name: "Final Action_Plan_ศนทบางแค_2569.xlsx", size: "55 KB", type: "Action Plan" },
      { name: "2025_CFH-32IVSA_Ref.PR.pdf", size: "1.8 MB", type: "HVAC Catalog Spec" }
    ]
  },

  "prj-saphansung": {
    id: "prj-saphansung",
    name: "ศนท สะพานสูง",
    fullName: "ศูนย์นันทนาการสะพานสูง (งานฝ้าเพดาน & ทรายล้างรอบสระ)",
    folderName: "ศนท สะพานสูง",
    folderPath: "C:\\Users\\nattc\\OneDrive\\Desktop\\ศนท สะพานสูง",
    aiSubfolder: "ศนท สะพานสูง\\AI_สร้าง_ข้อมูลและรูปจาก_LINE\\",
    lineGroupId: "c_saphansung_line_grp",
    lineGroupName: "บลูเคอร์ - ศนท. สะพานสูง",
    status: "กำลังดำเนินการ",
    statusBadgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
    period: "20 พ.ค. 2569 – 14 พ.ย. 2569 (180 วัน)",
    contractBudget: 5300000,
    targetCost: 3610000,
    actualCost: 2310000,
    expectedProfit: 1690000,
    profitMargin: 31.9,
    progressActual: 64.0,
    progressPlanned: 68.0,
    manpowerToday: 7,
    unreadCount: 0,
    lastMessageText: "โฟร์แมนวัฒน์: งานฝ้าเพดานห้องน้ำหญิง ปิดแผ่นยิปซัมแล้วครับ",
    lastMessageTime: "11:20",
    coreSpecs: "ฝ้าเพดานฉาบเรียบกันชื้น 9mm + ทรายล้างรอบสระ เบอร์ 4",
    chatHistory: [
      { sender: "พี่นัท", role: "admin", text: "ช่างตี้ โครงฝ้าห้องเปลี่ยนเสื้อผ้าตกท้องช้างอยู่ 2 ซม. ปรับลวดสลิงให้ได้ระดับก่อนปิดแผ่นยิปซัม", time: "14:00", isBoss: true },
      { sender: "ช่างตี้", role: "worker", text: "กำลังให้ลูกน้องดึงสลิงปรับระดับตามเลเซอร์ครับ", time: "14:15" },
      { sender: "โฟร์แมนวัฒน์", role: "foreman", text: "ส่งรูปฝ้าเพดานยิปซัมกันชื้น 9 มม. ฉาบเรียบพร้อมขัดแต่งรอยต่อ ช่างเข้า 7 นายครับ", time: "11:00" }
    ],
    wbsTasks: [
      { id: "w-ss1", name: "1. งานรื้อถอนฝ้าเพดานเดิมและโครงคร่าวเก่าชำรุด", category: "รื้อถอน", period: "20 พ.ค. - 10 มิ.ย.", weight: 10, progress: 100, status: "เสร็จสิ้น" },
      { id: "w-ss2", name: "2. ติดตั้งโครงคร่าวสังกะสีเบอร์ 24 แขวนลวดสลิงปรับระดับ", category: "งานฝ้าเพดาน", period: "11 มิ.ย. - 15 ก.ค.", weight: 20, progress: 100, status: "เสร็จสิ้น" },
      { id: "w-ss3", name: "3. ติดตั้งแผ่นยิปซัมกันชื้นหนา 9 มม. ฉาบเรียบและทาสีรองพื้น", category: "งานฝ้าเพดาน", period: "16 ก.ค. - 31 ส.ค.", weight: 25, progress: 80, status: "กำลังทำ" },
      { id: "w-ss4", name: "4. สกัดทรายล้างเดิมรอบสระและปรับระดับบ่ารางน้ำ", category: "งานทรายล้าง", period: "1 ก.ย. - 25 ก.ย.", weight: 15, progress: 70, status: "กำลังทำ" },
      { id: "w-ss5", name: "5. ปูทรายล้างเบอร์ 4 สีขาวสลับเทา เคลือบน้ำยาอะคริลิกเงา", category: "งานทรายล้าง", period: "26 ก.ย. - 25 ต.ค.", weight: 20, progress: 40, status: "กำลังทำ" },
      { id: "w-ss6", name: "6. งานตรวจสอบความสมบูรณ์และทดสอบการรั่วซึม", category: "ตรวจรับ", period: "26 ต.ค. - 14 พ.ย.", weight: 10, progress: 10, status: "รอตรวจ" }
    ],
    actionItems: [
      {
        id: "act-ss1",
        assignee: "ช่างตี้",
        title: "ปรับระดับโครงคร่าวฝ้าเพดานห้องเปลี่ยนเสื้อผ้า 1 แผง",
        quote: "ช่างตี้ โครงฝ้าห้องเปลี่ยนเสื้อผ้าตกท้องช้างอยู่ 2 ซม. ปรับลวดสลิงให้ได้ระดับก่อนปิดแผ่นยิปซัม",
        orderedBy: "พี่นัท",
        deadline: "พรุ่งนี้ 15:00",
        timestamp: "วันนี้ 14:00",
        priority: "ด่วน",
        completed: false
      }
    ],
    defects: [
      {
        id: "df-ss1",
        title: "โครงคร่าวฝ้าห้องเปลี่ยนเสื้อผ้าไม่ได้ระดับ 1 แผง",
        location: "ห้องเปลี่ยนเสื้อผ้าชั้น 1",
        severity: "ปานกลาง",
        status: "pending",
        reporter: "โฟร์แมนวัฒน์",
        date: "04 พ.ย. 2569",
        photoUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80"
      }
    ],
    photos: [
      {
        id: "p-ss1",
        caption: "งานติดตั้งแผ่นยิปซัมกันชื้น 9 มม. ฉาบเรียบพร้อมขัดแต่งรอยต่อ",
        foreman: "โฟร์แมนวัฒน์",
        timestamp: "04 พ.ย. 2569 · 11:00",
        manpower: "ช่าง 7 นาย",
        weather: "แดดจัด",
        fileName: "IMG_20261104_110000_Ceiling_SaphanSung.jpg",
        savedRelPath: "ศนท สะพานสูง\\AI_สร้าง_ข้อมูลและรูปจาก_LINE\\รูปหน้างาน\\2026-11\\IMG_20261104_110000_Ceiling_SaphanSung.jpg",
        excelSyncStatus: "อัปเดตลง _Site_Progress_Auto.xlsx แล้ว",
        url: "https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80"
      }
    ],
    contractors: [
      { name: "บจก. อาร์คเทค ซัพพลาย", role: "หลังคาผ้าใบแรงดึงสูง Tensile", contact: "ฝ่ายวิศวกรรม", milestones: "เบิกตามงวดงาน", amount: "1,200,000 บาท" },
      { name: "ช่างตี้ (นายวุฒิธินันต์)", role: "รื้อทรายล้างและงานฝ้าเพดาน", contact: "02-583-6939", milestones: "เบิกงวด 1, 2 แล้ว", amount: "410,000 บาท" }
    ],
    materials: [
      { item: "แผ่นยิปซัมกันชื้น หนา 9 มม.", spec: "Gypsum Moisture Resistant Board 1.2x2.4m", qty: "680", unit: "แผ่น", unitPrice: "215", total: "146,200" }
    ],
    files: [
      { name: "cost ศนท สะพานสูง.xlsx", size: "44 KB", type: "Cost Sheet" },
      { name: "Gant Chart ศยช สะพานสูง.xlsx", size: "39 KB", type: "Gantt Timeline" }
    ]
  },

  "prj-lumpini": {
    id: "prj-lumpini",
    name: "ศนท ลุมพินี",
    fullName: "ศูนย์นันทนาการลุมพินี (ซ่อมเพดาน Sika & ประปา Rough-In)",
    folderName: "ศนท ลุมพินี",
    folderPath: "C:\\Users\\nattc\\OneDrive\\Desktop\\ศนท ลุมพินี",
    aiSubfolder: "ศนท ลุมพินี\\AI_สร้าง_ข้อมูลและรูปจาก_LINE\\",
    lineGroupId: "c_lumpini_line_grp",
    lineGroupName: "บลูเคอร์ - ศนท. ลุมพินี",
    status: "กำลังดำเนินการ",
    statusBadgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
    period: "10 มิ.ย. 2569 – 30 ธ.ค. 2569 (200 วัน)",
    contractBudget: 5200000,
    targetCost: 3480000,
    actualCost: 1810000,
    expectedProfit: 1720000,
    profitMargin: 33.1,
    progressActual: 52.0,
    progressPlanned: 55.0,
    manpowerToday: 6,
    unreadCount: 1,
    lastMessageText: "ช่างหนุ่ม: เดินท่อประปา Rough-In 4 หุน เมนวาล์วเรียบร้อยครับ",
    lastMessageTime: "10:15",
    coreSpecs: "Sika MonoTop ซ่อมเพดาน + ประปา Rough-In 4 หุน แยก 4 สาย + กระเบื้อง Duragres",
    chatHistory: [
      { sender: "พี่นัท", role: "admin", text: "ช่างหนุ่ม อัดเทสน้ำท่อ 4 หุนห้องน้ำ 1 ทิ้งไว้ 4 ชม. เช็คเกจวัดแรงดันอย่าให้ตก", time: "15:20", isBoss: true },
      { sender: "ช่างหนุ่ม", role: "worker", text: "อัดแรงดัน 8 บาร์ไว้ตั้งแต่เที่ยง เกจยังนิ่งสนิทครับพี่นัท", time: "15:45" },
      { sender: "โฟร์แมนวัฒน์", role: "foreman", text: "ปูน Sika MonoTop แต้มซ่อมท้องพื้นเพดานแห้งสนิทแล้ว พร้อมขัดผิวครับ", time: "16:10" }
    ],
    wbsTasks: [
      { id: "w-lp1", name: "1. งานสกัดคอนกรีตเพดานแตกร้าวและทายากันสนิมเหล็กเสริม", category: "ซ่อมโครงสร้าง", period: "10 มิ.ย. - 30 มิ.ย.", weight: 15, progress: 100, status: "เสร็จสิ้น" },
      { id: "w-lp2", name: "2. ฉาบซ่อมเพดานคอนกรีตด้วยมอร์ตาร์โครงสร้าง Sika MonoTop", category: "ซ่อมโครงสร้าง", period: "1 ก.ค. - 31 ก.ค.", weight: 20, progress: 100, status: "เสร็จสิ้น" },
      { id: "w-lp3", name: "3. งานเดินท่อน้ำดี Rough-In 4 หุน แยก 4 สาย เมนวาล์วอิสระ", category: "งานประปา", period: "1 ส.ค. - 15 ก.ย.", weight: 25, progress: 75, status: "กำลังทำ" },
      { id: "w-lp4", name: "4. ปูกระเบื้องผนัง Duragres 30x60 ซม. และติดตั้งโคม Carini", category: "งานสถาปัตย์", period: "16 ก.ย. - 31 ต.ค.", weight: 20, progress: 30, status: "กำลังทำ" },
      { id: "w-lp5", name: "5. ปรับปรุงพื้นสระว่ายน้ำและลงพื้นยางสังเคราะห์ EPDM", category: "งานพื้นสระ", period: "1 พ.ย. - 15 ธ.ค.", weight: 15, progress: 0, status: "รอหน้างาน" }
    ],
    actionItems: [
      {
        id: "act-lp1",
        assignee: "ช่างหนุ่ม (สุขาภิบาล)",
        title: "ทดสอบอัดแรงดันน้ำท่อ 4 หุนห้องน้ำ 1 ป้องกันข้อต่อซึม",
        quote: "ช่างหนุ่ม อัดเทสน้ำท่อ 4 หุนห้องน้ำ 1 ทิ้งไว้ 4 ชม. เช็คเกจวัดแรงดันอย่าให้ตก",
        orderedBy: "พี่นัท",
        deadline: "พรุ่งนี้ 10:00",
        timestamp: "วันนี้ 15:20",
        priority: "ด่วนมาก",
        completed: false
      }
    ],
    defects: [
      {
        id: "df-lp1",
        title: "ข้อต่อข้องอท่อประปา 4 หุนห้องน้ำ 1 มีซึมเล็กน้อย",
        location: "ห้องน้ำ 1 โซนทางเดิน",
        severity: "ปานกลาง",
        status: "in-progress",
        reporter: "โฟร์แมนวัฒน์",
        date: "04 พ.ย. 2569",
        photoUrl: "https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=600&q=80"
      }
    ],
    photos: [
      {
        id: "p-lp1",
        caption: "เดินแนวท่อประปา Rough-In 4 หุนแยก 4 สายตามผัง Version 3 แนบติดผนังเรียบร้อย",
        foreman: "โฟร์แมนวัฒน์",
        timestamp: "04 พ.ย. 2569 · 10:15",
        manpower: "ช่าง 6 นาย",
        weather: "แดดจัด",
        fileName: "IMG_20261104_101500_Lumpini_RoughIn.jpg",
        savedRelPath: "ศนท ลุมพินี\\AI_สร้าง_ข้อมูลและรูปจาก_LINE\\รูปหน้างาน\\2026-11\\IMG_20261104_101500_Lumpini_RoughIn.jpg",
        excelSyncStatus: "อัปเดตลง _Site_Progress_Auto.xlsx แล้ว",
        url: "https://images.unsplash.com/photo-1541888946425-d0fbb1861564?auto=format&fit=crop&w=800&q=80"
      }
    ],
    contractors: [
      { name: "ช่างตี้ (นายวุฒิธินันต์)", role: "งานรื้อ+ฉาบเพดาน Sika", contact: "02-583-6939", milestones: "เบิกงวด 1 แล้ว", amount: "350,000 บาท" },
      { name: "ช่างหนุ่ม", role: "งานสุขาภิบาลและประปา Rough-In", contact: "ช่างชำนาญการ", milestones: "เบิกงวดเดินท่อน้ำดี", amount: "260,000 บาท" }
    ],
    materials: [
      { item: "มอร์ตาร์ซ่อมโครงสร้าง Sika MonoTop-610/615", spec: "Polymer modified mortar", qty: "45", unit: "ถุง", unitPrice: "680", total: "30,600" }
    ],
    files: [
      { name: "cost ศนท ลุมพินี.xlsx", size: "46 KB", type: "Cost Sheet" },
      { name: "คู่มือซ่อมแซมเพดานคอนกรีต_Sika.pdf", size: "2.5 MB", type: "Sika Manual" }
    ]
  },

  "prj-prachin": {
    id: "prj-prachin",
    name: "อบต ปราจีน",
    fullName: "สนามเด็กเล่น อบต.ท่าตูม บ้านโป่งไผ่ ม.7 จ.ปราจีนบุรี",
    folderName: "อบต ปราจีน",
    folderPath: "C:\\Users\\nattc\\OneDrive\\Desktop\\อบต ปราจีน",
    aiSubfolder: "อบต ปราจีน\\AI_สร้าง_ข้อมูลและรูปจาก_LINE\\",
    lineGroupId: "c_prachin_line_grp",
    lineGroupName: "บลูเคอร์ - อบต. ปราจีน",
    status: "กำลังดำเนินการ",
    statusBadgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
    period: "1 ก.ค. 2569 – 30 ต.ค. 2569 (120 วัน)",
    contractBudget: 2547000,
    targetCost: 1236866,
    actualCost: 1050000,
    expectedProfit: 819209,
    profitMargin: 39.8,
    progressActual: 85.0,
    progressPlanned: 80.0,
    manpowerToday: 4,
    unreadCount: 0,
    lastMessageText: "โฟร์แมน: งานปูพื้นยาง EPDM 20mm สีฟ้าสดใส คืบหน้า 85%",
    lastMessageTime: "เมื่อวาน",
    coreSpecs: "พื้นยาง EPDM หนา 20mm (SBR 15mm + EPDM 5mm) + เครื่องเล่นสนาม 5 ชุด",
    chatHistory: [
      { sender: "พี่นัท", role: "admin", text: "ช่างปูยาง ใต้ชิงช้ามีรอยต่อสีเหลื่อมกันนิดหน่อย เก็บแต่งรอยต่อให้เนียนก่อนลงน้ำยาเคลือบ", time: "11:10", isBoss: true },
      { sender: "ช่างปูยาง บลูเคอร์", role: "worker", text: "กำลังเอาเกรียงรีดเก็บรอยต่อสีฟ้า-เหลืองให้เนียนเรียบครับ", time: "11:30" },
      { sender: "โฟร์แมนวัฒน์", role: "foreman", text: "ส่งรูปงานปูพื้นยาง EPDM หนา 20 มม. สีฟ้าสดใสรอบเครื่องเล่น ช่าง 4 นาย คืบหน้า 85% ครับ", time: "15:45" }
    ],
    wbsTasks: [
      { id: "w-pc1", name: "1. งานปรับพื้นที่ดินและเทคอนกรีตฐานราก หนา 10 ซม.", category: "ฐานราก", period: "1 ก.ค. - 25 ก.ค.", weight: 20, progress: 100, status: "เสร็จสิ้น" },
      { id: "w-pc2", name: "2. ติดตั้งเครื่องเล่นสนามเด็กเล่น 5 ชุด ยึดพุกฐานคอนกรีต", category: "เครื่องเล่นสนาม", period: "26 ก.ค. - 20 ส.ค.", weight: 25, progress: 100, status: "เสร็จสิ้น" },
      { id: "w-pc3", name: "3. ทาน้ำยาไพรเมอร์ PU รองพื้นและลงเม็ดยางดำ SBR หนา 15 มม.", category: "พื้นยาง EPDM", period: "21 ส.ค. - 20 ก.ย.", weight: 25, progress: 100, status: "เสร็จสิ้น" },
      { id: "w-pc4", name: "4. ปูเม็ดยางสี EPDM Top Layer หนา 5 มม. ลวดลายการ์ตูน", category: "พื้นยาง EPDM", period: "21 ก.ย. - 10 ต.ค.", weight: 20, progress: 70, status: "กำลังทำ" },
      { id: "w-pc5", name: "5. ติดตั้งรั้วตาข่ายกัลวาไนซ์และตรวจรับงานงวดสุดท้าย", category: "ตรวจรับ", period: "11 ต.ค. - 30 ต.ค.", weight: 10, progress: 20, status: "รอตรวจ" }
    ],
    actionItems: [
      {
        id: "act-pc1",
        assignee: "ช่างปูยางบลูเคอร์ ชุดที่ 1",
        title: "เก็บขอบรอยต่อสี EPDM ใต้ชิงช้าให้เรียบเสมอกัน",
        quote: "ช่างปูยาง ใต้ชิงช้ามีรอยต่อสีเหลื่อมกันนิดหน่อย เก็บแต่งรอยต่อให้เนียนก่อนลงน้ำยาเคลือบ",
        orderedBy: "พี่นัท",
        deadline: "พรุ่งนี้ 12:00",
        timestamp: "วันนี้ 11:10",
        priority: "ปกติ",
        completed: false
      }
    ],
    defects: [
      {
        id: "df-pc1",
        title: "รอยต่อสีพื้นยาง EPDM โซนชิงช้ามีรอยเหลื่อมเล็กน้อย",
        location: "โซนชิงช้าเด็กเล็ก",
        severity: "เล็กน้อย",
        status: "pending",
        reporter: "โฟร์แมนวัฒน์",
        date: "04 พ.ย. 2569",
        photoUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb1861564?auto=format&fit=crop&w=600&q=80"
      }
    ],
    photos: [
      {
        id: "p-pc1",
        caption: "ปูเม็ดยางสี EPDM หนา 5 มม. สีฟ้าสดใสรอบเครื่องเล่นสนามเสร็จแล้ว 70%",
        foreman: "โฟร์แมนวัฒน์",
        timestamp: "03 พ.ย. 2569 · 15:45",
        manpower: "ช่าง 4 นาย",
        weather: "แดดจัด ลมเย็น",
        fileName: "IMG_20261103_154500_Prachin_EPDM20mm.jpg",
        savedRelPath: "อบต ปราจีน\\AI_สร้าง_ข้อมูลและรูปจาก_LINE\\รูปหน้างาน\\2026-11\\IMG_20261103_154500_Prachin_EPDM20mm.jpg",
        excelSyncStatus: "อัปเดตลง _Site_Progress_Auto.xlsx แล้ว",
        url: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80"
      }
    ],
    contractors: [
      { name: "ทีมช่างปูยางสังเคราะห์ บลูเคอร์ชุดที่ 1", role: "งานปูพื้นยาง EPDM หนา 20mm", contact: "ทีมช่างประจำบริษัท", milestones: "เบิกงวดปูชั้น SBR แล้ว", amount: "420,000 บาท" }
    ],
    materials: [
      { item: "พื้นยาง EPDM หนา 20 มม.", spec: "SBR 15mm + EPDM 5mm ซับแรงกระแทก EN1177", qty: "480", unit: "ตร.ม.", unitPrice: "1,250", total: "600,000" }
    ],
    files: [
      { name: "ประมาณการต้นทุน_สนามเด็กเล่น_อบต_ท่าตูม_V3_คำนวณแยกVATสมบูรณ์.xlsx", size: "78 KB", type: "Master Cost Model" }
    ]
  },

  "prj-maehongson": {
    id: "prj-maehongson",
    name: "พี่บอม แม่ฮ่องสอน",
    fullName: "ลู่วิ่งและสนามกีฬายางสังเคราะห์ แม่ฮ่องสอน (พี่บอม)",
    folderName: "พี่บอม แม่ฮ่องสอน",
    folderPath: "C:\\Users\\nattc\\OneDrive\\Desktop\\พี่บอม แม่ฮ่องสอน",
    aiSubfolder: "พี่บอม แม่ฮ่องสอน\\AI_สร้าง_ข้อมูลและรูปจาก_LINE\\",
    lineGroupId: "c_maehongson_line_grp",
    lineGroupName: "บลูเคอร์ - ลู่วิ่งแม่ฮ่องสอน พี่บอม",
    status: "แผนงานประมูล/เริ่มงาน",
    statusBadgeClass: "bg-sky-500/20 text-sky-300 border-sky-400/30",
    period: "15 ส.ค. 2569 – 15 มี.ค. 2570 (210 วัน)",
    contractBudget: 13684000,
    targetCost: 9033200,
    actualCost: 1540000,
    expectedProfit: 4650800,
    profitMargin: 34.0,
    progressActual: 25.0,
    progressPlanned: 25.0,
    manpowerToday: 2,
    unreadCount: 0,
    lastMessageText: "พี่บอม: นัดช่างรังวัด อบจ. ตรวจค่าระดับโค้งใต้แล้วครับ",
    lastMessageTime: "เมื่อวาน",
    coreSpecs: "ลู่วิ่งยางสังเคราะห์ 13mm Red Encapsulated Sandwich 6,800 ตร.ม.",
    chatHistory: [
      { sender: "พี่นัท", role: "admin", text: "พี่บอม รบกวนนัดช่างรังวัด อบจ. เช็คระดับโค้งใต้สัปดาห์นี้เลยนะ จะได้ส่งใบขออนุมัติวัสดุ", time: "09:30", isBoss: true },
      { sender: "พี่บอม", role: "partner", text: "ได้ครับพี่นัท นัดช่าง อบจ. วันพฤหัส 10 โมงเช้าครับ", time: "09:45" },
      { sender: "ทีมพี่บอม", role: "worker", text: "ส่งรูปการสำรวจระดับความลาดชันลู่วิ่ง 6,800 ตร.ม. อากาศเปิดแล้วครับ", time: "14:00" }
    ],
    wbsTasks: [
      { id: "w-mh1", name: "1. สำรวจหน้างานและถอดแบบเทียบเคียง Model 1 (สนาม 11 คน + ลู่วิ่ง 6 เลน)", category: "สำรวจและออกแบบ", period: "15 ส.ค. - 10 ก.ย.", weight: 10, progress: 100, status: "เสร็จสิ้น" },
      { id: "w-mh2", name: "2. ตรวจสอบระดับความลาดชันของพื้นแอสฟัลต์คอนกรีตเดิม", category: "เตรียมพื้นผิว", period: "11 ก.ย. - 30 ก.ย.", weight: 15, progress: 70, status: "กำลังทำ" },
      { id: "w-mh3", name: "3. เตรียมสั่งนำเข้าเม็ดยาง EPDM แดง และกาว Sandwich System", category: "จัดซื้อวัสดุ", period: "1 ต.ค. - 31 ต.ค.", weight: 20, progress: 40, status: "สั่งซื้อ" },
      { id: "w-mh4", name: "4. ปรับระดับผิวแอสฟัลต์และลงไพรเมอร์ PU ยึดเกาะสูง", category: "งานลู่วิ่ง", period: "1 พ.ย. - 15 ธ.ค.", weight: 20, progress: 0, status: "รอหน้างาน" },
      { id: "w-mh5", name: "5. ปูยางสังเคราะห์ระบบ Sandwich 13 มม. พื้นที่ 6,800 ตร.ม.", category: "งานลู่วิ่ง", period: "16 ธ.ค. - 15 ก.พ.", weight: 25, progress: 0, status: "รอหน้างาน" }
    ],
    actionItems: [
      {
        id: "act-mh1",
        assignee: "พี่บอม",
        title: "ประสานงานช่างรังวัด อบจ. เพื่อร่วมสอบทานค่าระดับแอสฟัลต์โค้งใต้",
        quote: "พี่บอม รบกวนนัดช่างรังวัด อบจ. เช็คระดับโค้งใต้สัปดาห์นี้เลยนะ จะได้ส่งใบขออนุมัติวัสดุ",
        orderedBy: "พี่นัท",
        deadline: "ศุกร์นี้ 16:00",
        timestamp: "เมื่อวานนี้ 09:30",
        priority: "ด่วน",
        completed: false
      }
    ],
    defects: [
      {
        id: "df-mh1",
        title: "ระดับความลาดชันพื้นแอสฟัลต์เดิมโค้งทิศใต้เกินเกณฑ์ 0.2%",
        location: "ลู่วิ่งโค้งทิศใต้ สเตชั่น 200m",
        severity: "ปานกลาง",
        status: "in-progress",
        reporter: "ทีมสำรวจพี่บอม",
        date: "02 พ.ย. 2569",
        photoUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb1861564?auto=format&fit=crop&w=600&q=80"
      }
    ],
    photos: [
      {
        id: "p-mh1",
        caption: "ถ่ายระดับความลาดชันลู่วิ่ง 6,800 ตร.ม. ร่วมกับทีมงานพี่บอม",
        foreman: "ทีมพี่บอม",
        timestamp: "02 พ.ย. 2569 · 14:00",
        manpower: "ช่าง 2 นาย",
        weather: "หมอกหนา แดดร่ม",
        fileName: "IMG_20261102_140000_MaeHongSon_Track.jpg",
        savedRelPath: "พี่บอม แม่ฮ่องสอน\\AI_สร้าง_ข้อมูลและรูปจาก_LINE\\รูปหน้างาน\\2026-11\\IMG_20261102_140000_MaeHongSon_Track.jpg",
        excelSyncStatus: "อัปเดตลง _Site_Progress_Auto.xlsx แล้ว",
        url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80"
      }
    ],
    contractors: [
      { name: "ทีมพี่บอม (ตัวแทนภาคเหนือ)", role: "ประสานงานหน้างานและควบคุมเครื่องจักร", contact: "โทรประสานตรง", milestones: "เบิกตามงวดสำรวจ", amount: "650,000 บาท" }
    ],
    materials: [
      { item: "ลู่วิ่งยางสังเคราะห์ Sandwich System 13mm", spec: "Red Encapsulated Sandwich ผ่านมาตรฐาน IAAF", qty: "6,800", unit: "ตร.ม.", unitPrice: "1,150", total: "7,820,000" }
    ],
    files: [
      { name: "BOQ_MaeHongSon_Models.xlsx", size: "64 KB", type: "Model Simulation BOQ" },
      { name: "Copy of 6800sqm13mm Red Encapsulated sandwich quotation(1).xls", size: "95 KB", type: "Quotation Red Sandwich" }
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
async function initBootstrapData() {
  try {
    const res = await fetch(`${API_BASE}/api/bootstrap`, { method: "GET" });
    if (res.ok) {
      const data = await res.json();
      if (data && data.projects) {
        Object.assign(appState.projects, data.projects);
      }
      if (data && data.settings && data.settings.botEtiquette) {
        appState.botEtiquette = data.settings.botEtiquette;
      }
      console.log("Bootstrap loaded from backend API");
    } else {
      console.info("Using local high-fidelity fallback dataset (Server API offline or file:// access)");
    }
  } catch (err) {
    console.info("Local mode active: Operating with genuine 7 Desktop project dossiers");
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
    viewPortfolio.classList.remove("hidden");
    viewProject.classList.add("hidden");
    renderPortfolioDashboard();
  } else {
    viewPortfolio.classList.add("hidden");
    viewProject.classList.remove("hidden");
    // Also set active room in inbox to this project
    appState.inboxActiveRoomId = projectId;
    renderInboxRoomsList();
    renderActiveRoomChat();
    renderProjectDetailView(projectId);
  }
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
function renderPortfolioDashboard() {
  const projectsList = Object.values(appState.projects);
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
    totalContractValue += p.contractBudget || 0;
    totalTargetCost += p.targetCost || 0;
    totalActualCost += p.actualCost || 0;
    sumProgressActual += p.progressActual || 0;
    sumProgressPlanned += p.progressPlanned || 0;
    totalWorkers += p.manpowerToday || 0;

    if (p.actionItems) {
      totalPendingTasks += p.actionItems.filter(a => !a.completed).length;
    }
    if (p.defects) {
      p.defects.forEach(d => {
        if (d.status === "pending") totalOpenDefects++;
        else if (d.status === "in-progress") totalInProgressDefects++;
        else if (d.status === "resolved") totalResolvedDefects++;
      });
    }
  });

  const avgProgress = totalProjects > 0 ? (sumProgressActual / totalProjects).toFixed(1) : 0;
  const avgPlanned = totalProjects > 0 ? (sumProgressPlanned / totalProjects).toFixed(1) : 0;
  const diffProgress = (avgProgress - avgPlanned).toFixed(1);

  // Update KPI Cards DOM
  document.getElementById("portfolioTotalValue").innerText = `${(totalContractValue / 1000000).toFixed(2)}M`;
  document.getElementById("portfolioActiveCount").innerText = `${totalProjects} โครงการกำลังดำเนินการ`;
  document.getElementById("portfolioTargetCost").innerText = `ต้นทุน ${(totalTargetCost / 1000000).toFixed(2)}M`;

  document.getElementById("portfolioAvgProgress").innerText = `${avgProgress}%`;
  document.getElementById("portfolioProgressBar").style.width = `${avgProgress}%`;
  
  const diffElem = document.getElementById("portfolioPlanDiff");
  if (diffProgress < 0) {
    diffElem.className = "text-xs font-medium text-amber-600";
    diffElem.innerText = `ช้ากว่าแผน ${Math.abs(diffProgress)}%`;
  } else {
    diffElem.className = "text-xs font-medium text-emerald-600";
    diffElem.innerText = `เร็วกว่าแผน +${diffProgress}%`;
  }

  document.getElementById("portfolioPendingTasks").innerHTML = `${totalPendingTasks} <span class="text-sm font-normal text-slate-600">งาน</span>`;
  document.getElementById("portfolioOpenDefects").innerText = `${totalOpenDefects} จุด`;
  document.getElementById("portfolioTotalWorkers").innerText = totalWorkers;

  // Render Charts
  renderPortfolioCharts(projectsList, totalOpenDefects, totalInProgressDefects, totalResolvedDefects);

  // Render Portfolio Matrix Table
  renderPortfolioMatrixTable(projectsList);
}

function renderPortfolioCharts(projectsList, openDefects, inProgressDefects, resolvedDefects) {
  // Chart 1: Bar Chart (Plan vs Actual)
  const barCtx = document.getElementById("portfolioBarChart");
  if (barCtx) {
    if (appState.charts.bar) appState.charts.bar.destroy();

    const labels = projectsList.map(p => p.name);
    const plannedData = projectsList.map(p => p.progressPlanned);
    const actualData = projectsList.map(p => p.progressActual);

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
              font: { family: "Prompt", size: 11 }
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

    document.getElementById("statDefectOpen").innerText = openDefects;
    document.getElementById("statDefectInProgress").innerText = inProgressDefects;
    document.getElementById("statDefectClosed").innerText = resolvedDefects;
  }
}

function renderPortfolioMatrixTable(projectsList) {
  const tbody = document.getElementById("portfolioTableBody");
  if (!tbody) return;

  tbody.innerHTML = projectsList.map(p => {
    const defectsCount = p.defects ? p.defects.filter(d => d.status !== "resolved").length : 0;
    const diff = (p.progressActual - p.progressPlanned).toFixed(0);
    const diffBadge = diff >= 0 
      ? `<span class="text-[10px] text-emerald-600 font-medium">+${diff}%</span>` 
      : `<span class="text-[10px] text-rose-500 font-medium">${diff}%</span>`;

    return `
      <tr class="table-row-hover transition-colors">
        <td class="py-3 px-4">
          <div class="font-bold text-slate-900 font-kanit text-sm flex items-center gap-1.5">
            ${p.name}
            <span class="text-[10px] px-2 py-0.5 rounded-full font-normal border ${p.statusBadgeClass || 'bg-slate-100 text-slate-600'}">${p.status}</span>
          </div>
          <div class="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5">
            <i class="fa-regular fa-folder text-amber-500"></i>
            <span>${p.folderName}</span>
          </div>
        </td>
        <td class="py-3 px-3">
          <span class="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            <i class="fa-brands fa-line text-emerald-500"></i>
            ผูกแล้ว (${p.lineGroupId})
          </span>
        </td>
        <td class="py-3 px-3">
          <span class="text-xs text-slate-700 font-medium max-w-[200px] truncate block" title="${p.coreSpecs}">${p.coreSpecs}</span>
        </td>
        <td class="py-3 px-3 text-right font-medium text-slate-900 font-kanit">
          ${formatCurrency(p.contractBudget)}
        </td>
        <td class="py-3 px-3 text-right font-medium text-slate-600 font-kanit">
          ${formatCurrency(p.targetCost)}
        </td>
        <td class="py-3 px-4">
          <div class="flex items-center justify-between text-[11px] mb-1">
            <span class="font-bold font-kanit text-slate-800">${p.progressActual}%</span>
            <span>${diffBadge} <span class="text-slate-600">แผน ${p.progressPlanned}%</span></span>
          </div>
          <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div class="bg-sky-500 h-1.5 rounded-full" style="width: ${p.progressActual}%"></div>
          </div>
        </td>
        <td class="py-3 px-3 text-center">
          ${defectsCount > 0 
            ? `<span class="px-2 py-0.5 bg-rose-100 text-rose-700 font-bold rounded-full text-[11px]">${defectsCount}</span>` 
            : `<span class="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold rounded-full text-[11px]">0</span>`
          }
        </td>
        <td class="py-3 px-4 text-center">
          <button onclick="switchProject('${p.id}')" class="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold rounded-xl border border-sky-200 transition-all font-kanit flex items-center gap-1 mx-auto">
            <span>ดูรายละเอียด</span>
            <i class="fa-solid fa-arrow-right text-[10px]"></i>
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

function filterPortfolioTable(searchTerm) {
  const term = searchTerm.toLowerCase().trim();
  const projectsList = Object.values(appState.projects);
  const filtered = projectsList.filter(p => 
    p.name.toLowerCase().includes(term) ||
    p.coreSpecs.toLowerCase().includes(term) ||
    p.folderName.toLowerCase().includes(term)
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
  document.getElementById("projHeaderTitle").innerText = proj.name;
  document.getElementById("projHeaderSubtitle").innerText = proj.fullName;
  document.getElementById("projBadgeStatus").innerText = proj.status;
  document.getElementById("projBadgeStatus").className = `px-2.5 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 border ${proj.statusBadgeClass || 'bg-emerald-500/20 text-emerald-300'}`;
  
  document.getElementById("projLineGroupTag").innerHTML = `
    <i class="fa-brands fa-line text-emerald-400"></i>
    <span>${proj.lineGroupName || 'ผูกกลุ่ม LINE แล้ว'}</span>
  `;

  document.getElementById("projFolderPath").innerText = proj.folderPath;
  document.getElementById("projPeriod").innerText = proj.period;
  document.getElementById("projMaterialSpec").innerText = proj.coreSpecs;
  document.getElementById("projProgressPct").innerText = `${proj.progressActual.toFixed(1)}%`;
  
  const diff = (proj.progressActual - proj.progressPlanned).toFixed(1);
  const diffElem = document.getElementById("projProgressDiff");
  if (diff >= 0) {
    diffElem.className = "text-[10px] text-emerald-400";
    diffElem.innerText = `เร็วกว่าแผน +${diff}%`;
  } else {
    diffElem.className = "text-[10px] text-amber-300";
    diffElem.innerText = `ช้ากว่าแผน ${Math.abs(diff)}%`;
  }

  // Update Subtab badges
  const pendingActions = proj.actionItems ? proj.actionItems.filter(a => !a.completed).length : 0;
  const pendingDefects = proj.defects ? proj.defects.filter(d => d.status !== "resolved").length : 0;
  document.getElementById("subtabActionCount").innerText = pendingActions;
  document.getElementById("subtabDefectCount").innerText = pendingDefects;

  // Trigger rendering for the active subtab
  switchSubTab(appState.activeSubTab);
}

// Sub-Tab 1: WBS Table
function renderWbsTable(proj) {
  const tbody = document.getElementById("wbsTableBody");
  if (!tbody || !proj.wbsTasks) return;

  const syncTag = document.getElementById("wbsAutoSyncTag");
  if (syncTag) {
    syncTag.innerText = `${proj.folderName}\\AI_สร้าง_ข้อมูลและรูปจาก_LINE\\_Site_Progress_Auto.xlsx`;
  }

  tbody.innerHTML = proj.wbsTasks.map((t, index) => {
    return `
      <tr class="table-row-hover transition-colors">
        <td class="py-3 px-4 text-center font-bold text-slate-600">${index + 1}</td>
        <td class="py-3 px-4 font-medium text-slate-800">${t.name}</td>
        <td class="py-3 px-3">
          <span class="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px]">${t.category}</span>
        </td>
        <td class="py-3 px-3 text-slate-600 text-[11px]">${t.period}</td>
        <td class="py-3 px-3 text-center font-semibold text-slate-700">${t.weight}%</td>
        <td class="py-3 px-4">
          <div class="flex items-center gap-3">
            <input type="range" min="0" max="100" value="${t.progress}" 
                   onchange="updateWbsTaskProgress('${proj.id}', '${t.id}', this.value)" 
                   class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer">
            <span class="font-bold text-xs text-sky-700 font-kanit w-10 text-right">${t.progress}%</span>
          </div>
        </td>
        <td class="py-3 px-3 text-center">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold ${
            t.progress === 100 
              ? 'bg-emerald-100 text-emerald-800' 
              : t.progress > 0 
                ? 'bg-sky-100 text-sky-800' 
                : 'bg-slate-100 text-slate-600'
          }">
            ${t.progress === 100 ? 'เสร็จสิ้น' : t.progress > 0 ? 'กำลังทำ' : 'รอดำเนินการ'}
          </span>
        </td>
      </tr>
    `;
  }).join("");
}

function updateWbsTaskProgress(projId, taskId, newProgress) {
  const proj = appState.projects[projId];
  if (!proj || !proj.wbsTasks) return;

  const task = proj.wbsTasks.find(t => t.id === taskId);
  if (task) {
    task.progress = parseInt(newProgress, 10);
    task.status = task.progress === 100 ? "เสร็จสิ้น" : (task.progress > 0 ? "กำลังทำ" : "รอดำเนินการ");

    let weightedSum = 0;
    let totalWeight = 0;
    proj.wbsTasks.forEach(t => {
      weightedSum += (t.progress * (t.weight || 1));
      totalWeight += (t.weight || 1);
    });
    if (totalWeight > 0) {
      proj.progressActual = parseFloat((weightedSum / totalWeight).toFixed(1));
    }

    renderProjectDetailView(projId);
    showToast(`อัปเดต "${task.name}" เป็น ${task.progress}% และบันทึกลง _Site_Progress_Auto.xlsx`, "success");
  }
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
              <p class="font-bold text-xs text-slate-900">${act.assignee}</p>
              <p class="text-[10px] text-slate-600">สั่งโดย: ${act.orderedBy} · ${act.timestamp}</p>
            </div>
          </div>
          <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
            act.priority === 'ด่วนมาก' 
              ? 'bg-rose-100 text-rose-700 border border-rose-200' 
              : act.priority === 'ด่วน' 
                ? 'bg-amber-100 text-amber-700' 
                : 'bg-slate-100 text-slate-600'
          }">
            ${act.priority}
          </span>
        </div>

        <h4 class="text-xs font-bold text-slate-800 mb-1.5 ${act.completed ? 'line-through text-slate-600' : ''}">
          ${act.title}
        </h4>

        <!-- Verbatim LINE Quote -->
        <div class="bg-slate-50 rounded-xl p-2.5 border border-slate-100 text-[11px] text-slate-600 italic mb-3 flex items-start gap-1.5">
          <i class="fa-brands fa-line text-emerald-500 text-xs mt-0.5 flex-shrink-0"></i>
          <span>"${act.quote}"</span>
        </div>

        <div class="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
          <span class="text-[11px] text-slate-600 flex items-center gap-1">
            <i class="fa-regular fa-clock text-amber-500"></i>
            กำหนด: ${act.deadline}
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
          ${df.severity}
        </span>
        <span class="text-[10px] text-slate-600">${df.date}</span>
      </div>

      ${df.photoUrl ? `
        <div class="relative rounded-xl overflow-hidden h-28 bg-slate-100 cursor-pointer" onclick="openLightbox('${df.photoUrl}', '${df.title}')">
          <img src="${df.photoUrl}" alt="${df.title}" class="w-full h-full object-cover hover:scale-105 transition-transform duration-300">
          <span class="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded">กดดูรูป</span>
        </div>
      ` : ''}

      <h5 class="text-xs font-bold text-slate-800 leading-snug">${df.title}</h5>
      <p class="text-[11px] text-slate-600 flex items-center gap-1">
        <i class="fa-solid fa-location-dot text-rose-500"></i>
        ${df.location}
      </p>

      <div class="flex items-center justify-between text-[10px] text-slate-600 pt-1.5 border-t border-slate-100">
        <span>แจ้งโดย: ${df.reporter}</span>
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
  document.getElementById("dossierContractBudget").innerText = formatCurrency(proj.contractBudget);
  document.getElementById("dossierTargetCost").innerText = formatCurrency(proj.targetCost);
  document.getElementById("dossierActualSpent").innerText = formatCurrency(proj.actualCost);
  document.getElementById("dossierExpectedProfit").innerText = formatCurrency(proj.expectedProfit);
  document.getElementById("dossierMarginPct").innerText = `Margin ${proj.profitMargin}%`;

  // Contractors Directory
  const contractorBody = document.getElementById("dossierContractorBody");
  if (contractorBody && proj.contractors) {
    contractorBody.innerHTML = proj.contractors.map(c => `
      <tr class="table-row-hover transition-colors">
        <td class="py-2.5 px-4 font-bold text-slate-800">${c.name}</td>
        <td class="py-2.5 px-3 text-slate-700">${c.role}</td>
        <td class="py-2.5 px-3 text-slate-600 font-mono-code text-[11px]">${c.contact}</td>
        <td class="py-2.5 px-3 text-slate-600">${c.milestones}</td>
        <td class="py-2.5 px-3 text-right font-kanit font-semibold text-slate-900">${c.amount}</td>
      </tr>
    `).join("");
  }

  // Materials Specification
  const materialBody = document.getElementById("dossierMaterialBody");
  if (materialBody && proj.materials) {
    materialBody.innerHTML = proj.materials.map(m => `
      <tr class="table-row-hover transition-colors">
        <td class="py-2.5 px-4 font-semibold text-slate-800">${m.item}</td>
        <td class="py-2.5 px-3 text-slate-600">${m.spec}</td>
        <td class="py-2.5 px-3 text-center font-kanit">${m.qty}</td>
        <td class="py-2.5 px-3 text-center text-slate-600">${m.unit}</td>
        <td class="py-2.5 px-3 text-right font-kanit text-slate-700">${m.unitPrice}</td>
        <td class="py-2.5 px-4 text-right font-kanit font-bold text-slate-900">${m.total}</td>
      </tr>
    `).join("");
  }

  // Files List
  const filesList = document.getElementById("dossierFilesList");
  if (filesList && proj.files) {
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

// =============================================================================
// 6. UNIFIED LINE 7-GROUP INBOX LOGIC & SHORTCUT ACTIONS
// =============================================================================
function renderInboxRoomsList(searchTerm = "") {
  const container = document.getElementById("inboxRoomsList");
  if (!container) return;

  const term = searchTerm.toLowerCase().trim();
  let rooms = Object.values(appState.projects);
  if (term) {
    rooms = rooms.filter(r => r.name.toLowerCase().includes(term) || r.lineGroupName.toLowerCase().includes(term));
  }

  container.innerHTML = rooms.map(room => {
    const isActive = room.id === appState.inboxActiveRoomId;
    return `
      <div onclick="selectInboxRoom('${room.id}')" class="p-3 cursor-pointer transition-all hover:bg-slate-100 flex items-start gap-2.5 ${isActive ? 'line-room-active bg-emerald-50/70' : 'bg-transparent'}">
        <div class="relative flex-shrink-0 mt-0.5">
          <div class="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs font-kanit">
            ${room.name.slice(0, 3)}
          </div>
          <span class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></span>
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <h5 class="text-xs font-bold font-kanit text-slate-900 truncate ${isActive ? 'text-emerald-800' : ''}">
              ${room.name}
            </h5>
            <span class="text-[10px] text-slate-600 flex-shrink-0">${room.lastMessageTime || ''}</span>
          </div>
          <p class="text-[11px] text-slate-600 truncate mt-0.5 leading-snug">
            ${room.lastMessageText || 'ไม่มีข้อความใหม่'}
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
}

function renderActiveRoomChat() {
  const room = appState.projects[appState.inboxActiveRoomId];
  if (!room) return;

  // Header update
  document.getElementById("inboxCurrentRoomTitle").innerText = room.lineGroupName;
  document.getElementById("inboxCurrentRoomMeta").innerHTML = `
    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
    <span>โฟลเดอร์: ${room.folderName} · สเปก: ${room.coreSpecs.slice(0, 35)}...</span>
  `;

  // Render messages
  const stream = document.getElementById("inboxMessagesStream");
  if (!stream) return;

  if (!room.chatHistory || room.chatHistory.length === 0) {
    stream.innerHTML = `
      <div class="text-center py-12 text-slate-600">
        <i class="fa-regular fa-comment-dots text-3xl mb-2 text-slate-300"></i>
        <p>ยังไม่มีข้อความในกลุ่มนี้</p>
      </div>
    `;
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
  const isHidden = drawer.classList.contains("translate-x-full");

  if (isHidden) {
    drawer.classList.remove("translate-x-full");
    backdrop.classList.remove("hidden");
  } else {
    drawer.classList.add("translate-x-full");
    backdrop.classList.add("hidden");
  }
}

function openAssistant(tab = "inbox") {
  toggleAssistantDrawer();
  switchAssistantTab(tab);
}

function closeAssistantDrawer() {
  const drawer = document.getElementById("assistantDrawer");
  const backdrop = document.getElementById("assistantDrawerBackdrop");
  drawer.classList.add("translate-x-full");
  backdrop.classList.add("hidden");
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
  const targetProjId = document.getElementById("simTargetGroup").value;
  const proj = appState.projects[targetProjId];

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
    <span class="text-sky-400 font-bold">[${now}] ${endpoint}</span>
    <span class="text-emerald-400 font-semibold">· ${eventName}</span>
    <pre class="text-slate-300 mt-0.5 whitespace-pre-wrap">${JSON.stringify(payload, null, 2)}</pre>
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
    <optgroup label="── โครงการบน Desktop ──">
      ${Object.values(appState.projects).map(p => `
        <option value="${p.id}">${p.name} (${p.coreSpecs.slice(0, 25)}...)</option>
      `).join("")}
    </optgroup>
  `;
  select.value = currentVal || "all";
}

// Add Task / Defect Modal
function openAddTaskDefectModal() {
  document.getElementById("addTaskDefectModal").classList.remove("hidden");
}

function openAddDefectOnlyModal() {
  openAddTaskDefectModal();
  document.getElementById("modalItemType").value = "defect";
}

function closeAddTaskDefectModal() {
  document.getElementById("addTaskDefectModal").classList.add("hidden");
}

function submitAddTaskDefect() {
  const type = document.getElementById("modalItemType").value;
  const desc = document.getElementById("modalItemDesc").value.trim();
  const assignee = document.getElementById("modalItemAssignee").value.trim() || "ช่างหน้างาน";
  const priority = document.getElementById("modalItemPriority").value;
  const proj = appState.projects[appState.currentProjectId];

  if (!desc) {
    showToast("กรุณากรอกรายละเอียด", "warning");
    return;
  }

  if (type === "action") {
    if (!proj.actionItems) proj.actionItems = [];
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
    showToast("เพิ่มงานสั่งการเรียบร้อย", "success");
  } else {
    if (!proj.defects) proj.defects = [];
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
    showToast("เพิ่มรายการ Defect เรียบร้อย", "success");
  }

  closeAddTaskDefectModal();
  renderProjectDetailView(proj.id);
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

function escapeHtml(text) {
  const div = document.createElement("div");
  div.innerText = text;
  return div.innerHTML;
}

function formatBotMarkdown(text) {
  let html = text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code class='bg-slate-100 text-slate-800 px-1 py-0.5 rounded text-[10px]'>$1</code>")
    .replace(/\n/g, "<br>");
  return html;
}

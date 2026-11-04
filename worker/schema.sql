-- ======================================================================
-- Blucher Project Tracker & 2-Way LINE AI Bot: Cloudflare D1 Database Schema
-- ======================================================================

-- 1. Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT,
  folder_path TEXT,
  line_group_id TEXT,
  status TEXT DEFAULT 'ACTIVE',
  budget REAL DEFAULT 0,
  target_cost REAL DEFAULT 0,
  actual_cost REAL DEFAULT 0,
  planned_progress REAL DEFAULT 0,
  actual_progress REAL DEFAULT 0,
  start_date TEXT,
  end_date TEXT,
  daily_workers INTEGER DEFAULT 0,
  specs_summary TEXT,
  materials_json TEXT DEFAULT '[]',
  contractors_json TEXT DEFAULT '[]',
  source_files_json TEXT DEFAULT '[]',
  dossier_md TEXT,
  archived INTEGER DEFAULT 0,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_projects_line_group_id ON projects(line_group_id);
CREATE INDEX IF NOT EXISTS idx_projects_archived ON projects(archived);

-- 2. Work Breakdown Structure (WBS) Tasks Table
CREATE TABLE IF NOT EXISTS wbs_tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  task_code TEXT,
  title TEXT NOT NULL,
  weight_percent REAL DEFAULT 0,
  progress_percent REAL DEFAULT 0,
  status TEXT DEFAULT 'PENDING',
  assignee TEXT,
  start_date TEXT,
  due_date TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_wbs_tasks_project_id ON wbs_tasks(project_id);

-- 3. Action Items Table
CREATE TABLE IF NOT EXISTS action_items (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  assignee TEXT,
  due_date TEXT,
  status TEXT DEFAULT 'OPEN',
  assigned_by TEXT,
  raw_message TEXT,
  created_at TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_action_items_project_id ON action_items(project_id);
CREATE INDEX IF NOT EXISTS idx_action_items_status ON action_items(status);

-- 4. Defects Table
CREATE TABLE IF NOT EXISTS defects (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  code TEXT,
  title TEXT NOT NULL,
  description TEXT,
  zone TEXT,
  severity TEXT DEFAULT 'MEDIUM',
  status TEXT DEFAULT 'OPEN',
  assignee TEXT,
  photo_url TEXT,
  due_date TEXT,
  created_at TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_defects_project_id ON defects(project_id);
CREATE INDEX IF NOT EXISTS idx_defects_status ON defects(status);

-- 5. Daily Site Logs & Photos Table
CREATE TABLE IF NOT EXISTS daily_logs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  log_date TEXT,
  summary TEXT,
  area_sqm_done REAL DEFAULT 0,
  worker_count INTEGER DEFAULT 0,
  sender_name TEXT,
  photo_url TEXT,
  local_photo_path TEXT,
  category TEXT DEFAULT 'WORK_REPORT',
  synced_to_pc INTEGER DEFAULT 0,
  created_at TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_daily_logs_project_id ON daily_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(log_date);

-- 6. Photo Buffer Table (for temporary/unprocessed incoming media from LINE)
CREATE TABLE IF NOT EXISTS photo_buffer (
  id TEXT PRIMARY KEY,
  group_id TEXT,
  project_id TEXT,
  message_id TEXT,
  photo_data TEXT,
  sender_name TEXT,
  created_at TEXT,
  processed INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_photo_buffer_group_id ON photo_buffer(group_id);
CREATE INDEX IF NOT EXISTS idx_photo_buffer_processed ON photo_buffer(processed);

-- 7. Bot & System Settings Table
CREATE TABLE IF NOT EXISTS bot_settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

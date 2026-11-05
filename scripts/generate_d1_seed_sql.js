import fs from 'node:fs';
import path from 'node:path';

const rootDir = 'C:\\Users\\nattc\\OneDrive\\Desktop\\Claude Project\\Project Tracker';
const masterDataPath = path.join(rootDir, 'data', 'projects_master.json');
const rawData = JSON.parse(fs.readFileSync(masterDataPath, 'utf8'));

const sqlStatements = [
  '-- Clean old fake data',
  'DELETE FROM photo_buffer;',
  'DELETE FROM daily_logs;',
  'DELETE FROM defects;',
  'DELETE FROM action_items;',
  'DELETE FROM wbs_tasks;',
  'DELETE FROM projects;',
  ''
];

for (const p of rawData.projects) {
  const escapeSql = (val) => {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number') return val;
    return "'" + String(val).replace(/'/g, "''") + "'";
  };

  sqlStatements.push(`
INSERT INTO projects (
  id, name, short_name, folder_path, line_group_id, status, budget,
  target_cost, actual_cost, planned_progress, actual_progress,
  start_date, end_date, daily_workers, specs_summary,
  materials_json, contractors_json, source_files_json, dossier_md, archived, updated_at
) VALUES (
  ${escapeSql(p.id)},
  ${escapeSql(p.name)},
  ${escapeSql(p.short_name)},
  ${escapeSql(p.folder_path)},
  NULL,
  ${escapeSql(p.status)},
  ${p.budget || 0},
  ${p.target_cost || 0},
  ${p.actual_cost || 0},
  ${p.planned_progress || 0},
  ${p.actual_progress || 0},
  ${escapeSql(p.start_date || '2026-05-18')},
  ${escapeSql(p.end_date || '2026-12-31')},
  0,
  ${escapeSql(p.specs_summary || '')},
  ${escapeSql(JSON.stringify(p.materials || []))},
  ${escapeSql(JSON.stringify(p.contractors || []))},
  ${escapeSql(JSON.stringify(p.sourceFiles || []))},
  ${escapeSql(p.dossier_md || '')},
  0,
  CURRENT_TIMESTAMP
);`.trim());

  if (Array.isArray(p.wbsTasks)) {
    for (const t of p.wbsTasks) {
      sqlStatements.push(`
INSERT INTO wbs_tasks (
  id, project_id, task_code, title, weight_percent, progress_percent, status, assignee, start_date, due_date
) VALUES (
  ${escapeSql(t.id)},
  ${escapeSql(p.id)},
  ${escapeSql(t.task_code || '')},
  ${escapeSql(t.title || t.name || '')},
  ${t.weight_percent || 0},
  ${t.progress_percent || 0},
  ${escapeSql(t.status || 'PENDING')},
  ${escapeSql(t.assignee || '')},
  ${escapeSql(t.start_date || '')},
  ${escapeSql(t.due_date || '')}
);`.trim());
    }
  }
}

const outSqlPath = path.join(rootDir, 'data', 'seed_remote_d1.sql');
fs.writeFileSync(outSqlPath, sqlStatements.join('\n\n'), 'utf8');
console.log(`Saved clean D1 seed SQL to ${outSqlPath}`);

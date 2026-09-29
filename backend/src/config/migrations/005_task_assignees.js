const { query } = require('../db');

/**
 * Migration 005: Multiple Task Assignees Table & Data Migration
 * Supports assigning multiple team members to a single task via many-to-many relationship.
 * Copies existing tasks.assigned_to into task_assignees to preserve existing data.
 */
async function runMigration() {
  console.log('Running Migration 005: Multiple Task Assignees...');
  try {
    // 1. Create task_assignees table
    await query(`
      CREATE TABLE IF NOT EXISTS task_assignees (
        id SERIAL PRIMARY KEY,
        task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (task_id, user_id)
      );
    `);

    // 2. Create indexes on task_id and user_id
    await query(`
      CREATE INDEX IF NOT EXISTS idx_task_assignees_task_id ON task_assignees(task_id);
      CREATE INDEX IF NOT EXISTS idx_task_assignees_user_id ON task_assignees(user_id);
    `);

    // 3. Migrate existing tasks.assigned_to into task_assignees safely
    const migrateResult = await query(`
      INSERT INTO task_assignees (task_id, user_id, assigned_at)
      SELECT t.id, t.assigned_to, COALESCE(t.created_at, CURRENT_TIMESTAMP)
      FROM tasks t
      WHERE t.assigned_to IS NOT NULL
        AND EXISTS (SELECT 1 FROM users u WHERE u.id = t.assigned_to)
      ON CONFLICT (task_id, user_id) DO NOTHING;
    `);

    console.log(`✅ Migration 005 completed successfully. Migrated ${migrateResult.rowCount || 0} existing assignments.`);
    return { success: true };
  } catch (err) {
    console.error('❌ Migration 005 failed:', err.message);
    throw err;
  }
}

module.exports = { runMigration };

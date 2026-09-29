const { query, pool } = require('../db');

/**
 * Migration 003: Push Subscriptions, Persistent Notifications, and Reminder Uniqueness
 *
 * 1. Creates push_subscriptions table for Web Push endpoints and VAPID keys.
 * 2. Adds is_dismissed and reminder_id to notifications table.
 * 3. Creates partial unique index ON notifications(reminder_id) WHERE reminder_id IS NOT NULL
 *    ensuring exactly one notification can exist per reminder.
 */
async function runMigration() {
  console.log('====================================================');
  console.log('🚀 RUNNING MIGRATION 003: PUSH SUBSCRIPTIONS & PERSISTENCE');
  console.log('====================================================\n');

  try {
    console.log('1. Creating push_subscriptions table...');
    await query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        endpoint TEXT UNIQUE NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ Table push_subscriptions created or already exists.');

    console.log('2. Creating indexes on push_subscriptions...');
    await query(`
      CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
      CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
    `);
    console.log('   ✅ Indexes on push_subscriptions created.');

    console.log('3. Adding is_dismissed and reminder_id columns to notifications...');
    await query(`
      ALTER TABLE notifications 
        ADD COLUMN IF NOT EXISTS is_dismissed BOOLEAN NOT NULL DEFAULT FALSE;
      
      ALTER TABLE notifications 
        ADD COLUMN IF NOT EXISTS reminder_id INTEGER REFERENCES reminders(id) ON DELETE SET NULL;
    `);
    console.log('   ✅ Columns is_dismissed and reminder_id added or already exist.');

    console.log('4. Creating indexes and partial unique index on notifications(reminder_id)...');
    await query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_is_dismissed ON notifications(is_dismissed);
      CREATE INDEX IF NOT EXISTS idx_notifications_reminder_id ON notifications(reminder_id);

      -- Enforce at the PostgreSQL engine level that exactly one notification can exist for each reminder
      CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_unique_reminder 
        ON notifications(reminder_id) 
        WHERE reminder_id IS NOT NULL;
    `);
    console.log('   ✅ Partial unique index idx_notifications_unique_reminder created successfully.');

    console.log('\n====================================================');
    console.log('🎉 MIGRATION 003 COMPLETED SUCCESSFULLY');
    console.log('====================================================\n');
    return { success: true };
  } catch (error) {
    console.error('❌ Migration 003 failed:', error);
    throw error;
  }
}

// Allow CLI execution: node src/config/migrations/003_push_subscriptions.js
if (require.main === module) {
  runMigration()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error(err);
      await pool.end();
      process.exit(1);
    });
}

module.exports = { runMigration };

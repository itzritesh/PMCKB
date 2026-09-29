const { query } = require('../db');

/**
 * Migration 004: Team Invitations Email Delivery & Security Enhancements
 * Adds cancelled status support, email status tracking, and updated_at column.
 */
async function runMigration() {
  console.log('Running Migration 004: Team Invitations Email Delivery...');
  try {
    // 1. Update check constraint for status to include 'cancelled'
    await query(`
      ALTER TABLE team_invitations DROP CONSTRAINT IF EXISTS team_invitations_status_check;
      ALTER TABLE team_invitations ADD CONSTRAINT team_invitations_status_check 
        CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'cancelled'));
    `);

    // 2. Add email delivery status fields and updated_at
    await query(`
      ALTER TABLE team_invitations ADD COLUMN IF NOT EXISTS email_status VARCHAR(50) DEFAULT 'pending';
      ALTER TABLE team_invitations ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP WITH TIME ZONE;
      ALTER TABLE team_invitations ADD COLUMN IF NOT EXISTS last_email_error TEXT;
      ALTER TABLE team_invitations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    `);

    // 3. Add index on email_status
    await query(`
      CREATE INDEX IF NOT EXISTS idx_team_invitations_email_status ON team_invitations(email_status);
    `);

    console.log('✅ Migration 004 completed successfully.');
    return { success: true };
  } catch (err) {
    console.error('❌ Migration 004 failed:', err.message);
    throw err;
  }
}

module.exports = { runMigration };

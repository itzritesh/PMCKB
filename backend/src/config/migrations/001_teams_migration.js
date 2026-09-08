const { query, pool } = require('../db');

/**
 * Phase 1 Database Migration: Teams / Workspaces
 * Introduces teams, team_members, team_invitations, announcements,
 * adds team_id to existing entity tables, and backfills existing records.
 */
async function runMigration() {
  console.log('====================================================');
  console.log('🚀 RUNNING PHASE 1 MIGRATION: TEAMS & WORKSPACES');
  console.log('====================================================\n');

  try {
    // 1. Create New Tables
    console.log('1. Creating new tables (teams, team_members, team_invitations, announcements)...');

    await query(`
      -- 1. Teams Table
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_teams_created_by ON teams(created_by);

      -- 2. Team Members Table
      CREATE TABLE IF NOT EXISTS team_members (
        id SERIAL PRIMARY KEY,
        team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'member')),
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (team_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
      CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);

      -- 3. Team Invitations Table
      CREATE TABLE IF NOT EXISTS team_invitations (
        id SERIAL PRIMARY KEY,
        team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        invited_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(token);
      CREATE INDEX IF NOT EXISTS idx_team_invitations_team_id ON team_invitations(team_id);
      CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email);

      -- 4. Announcements Table
      CREATE TABLE IF NOT EXISTS announcements (
        id SERIAL PRIMARY KEY,
        team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_announcements_team_id ON announcements(team_id);
      CREATE INDEX IF NOT EXISTS idx_announcements_created_by ON announcements(created_by);
    `);
    console.log('✅ New tables and indexes created successfully.');

    // 2. Add team_id column to existing entity tables
    console.log('\n2. Adding team_id foreign key column to existing tables...');

    await query(`
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_projects_team_id ON projects(team_id);

      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_tasks_team_id ON tasks(team_id);

      ALTER TABLE meetings ADD COLUMN IF NOT EXISTS team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_meetings_team_id ON meetings(team_id);

      ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_calendar_events_team_id ON calendar_events(team_id);

      ALTER TABLE kb_categories ADD COLUMN IF NOT EXISTS team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_kb_categories_team_id ON kb_categories(team_id);

      ALTER TABLE kb_articles ADD COLUMN IF NOT EXISTS team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_kb_articles_team_id ON kb_articles(team_id);
    `);
    console.log('✅ team_id columns and indexes added to existing tables.');

    // 3. Safe Data Backfill
    console.log('\n3. Performing safe data migration for existing records...');

    const usersRes = await query('SELECT id, name, email FROM users ORDER BY id ASC');
    console.log(`   Found ${usersRes.rows.length} existing user(s) in database.`);

    if (usersRes.rows.length > 0) {
      // Find or create default workspace
      let defaultTeam;
      const existingTeams = await query('SELECT id, name FROM teams ORDER BY id ASC LIMIT 1');

      if (existingTeams.rows.length === 0) {
        const primaryUser = usersRes.rows[0];
        const newTeamRes = await query(
          `INSERT INTO teams (name, description, created_by)
           VALUES ($1, $2, $3)
           RETURNING id, name`,
          ['PMCKB Main Workspace', 'Default workspace created during Phase 1 migration.', primaryUser.id]
        );
        defaultTeam = newTeamRes.rows[0];
        console.log(`   🌟 Created primary default workspace: "${defaultTeam.name}" (ID: ${defaultTeam.id}, Owner: ${primaryUser.email})`);
      } else {
        defaultTeam = existingTeams.rows[0];
        console.log(`   ℹ️ Existing workspace found: "${defaultTeam.name}" (ID: ${defaultTeam.id})`);
      }

      // Add all existing users to team_members
      for (let i = 0; i < usersRes.rows.length; i++) {
        const user = usersRes.rows[i];
        const role = i === 0 ? 'leader' : 'member';
        const memberRes = await query(
          `INSERT INTO team_members (team_id, user_id, role)
           VALUES ($1, $2, $3)
           ON CONFLICT (team_id, user_id) DO NOTHING
           RETURNING id`,
          [defaultTeam.id, user.id, role]
        );
        if (memberRes.rows.length > 0) {
          console.log(`   👤 Added user ${user.email} (ID: ${user.id}) as ${role.toUpperCase()}`);
        }
      }

      // Backfill existing records with NULL team_id to defaultTeam.id
      const pUpdate = await query('UPDATE projects SET team_id = $1 WHERE team_id IS NULL', [defaultTeam.id]);
      const tUpdate = await query('UPDATE tasks SET team_id = $1 WHERE team_id IS NULL', [defaultTeam.id]);
      const mUpdate = await query('UPDATE meetings SET team_id = $1 WHERE team_id IS NULL', [defaultTeam.id]);
      const eUpdate = await query('UPDATE calendar_events SET team_id = $1 WHERE team_id IS NULL', [defaultTeam.id]);
      const cUpdate = await query('UPDATE kb_categories SET team_id = $1 WHERE team_id IS NULL', [defaultTeam.id]);
      const aUpdate = await query('UPDATE kb_articles SET team_id = $1 WHERE team_id IS NULL', [defaultTeam.id]);

      console.log(`   🔗 Backfilled existing projects: ${pUpdate.rowCount} updated`);
      console.log(`   🔗 Backfilled existing tasks: ${tUpdate.rowCount} updated`);
      console.log(`   🔗 Backfilled existing meetings: ${mUpdate.rowCount} updated`);
      console.log(`   🔗 Backfilled existing calendar events: ${eUpdate.rowCount} updated`);
      console.log(`   🔗 Backfilled existing KB categories: ${cUpdate.rowCount} updated`);
      console.log(`   🔗 Backfilled existing KB articles: ${aUpdate.rowCount} updated`);
    } else {
      console.log('   ℹ️ No existing users found. Schema ready for initial user registration.');
    }

    console.log('\n====================================================');
    console.log('✅ PHASE 1 MIGRATION COMPLETED SUCCESSFULLY');
    console.log('====================================================\n');
    return { success: true };
  } catch (error) {
    console.error('\n❌ MIGRATION FAILED:', error.message);
    console.error(error.stack);
    throw error;
  }
}

if (require.main === module) {
  runMigration()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async () => {
      await pool.end();
      process.exit(1);
    });
}

module.exports = { runMigration };

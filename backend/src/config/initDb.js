const { query, pool } = require('./db');
const { runMigration } = require('./migrations/001_teams_migration');

/**
 * Initializes database schemas and creates required tables if they don't exist.
 */
async function initDb() {
  console.log('Initializing database tables on PostgreSQL (Neon)...');

  const createTablesQuery = `
    -- Users Table (Phase 1 & 2)
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

    -- Teams Table (Phase 1 Teams)
    CREATE TABLE IF NOT EXISTS teams (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_teams_created_by ON teams(created_by);

    -- Team Members Table
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

    -- Team Invitations Table
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

    -- Announcements Table
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

    -- Projects Table (Phase 3)
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(50) NOT NULL DEFAULT 'planning',
      owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
    CREATE INDEX IF NOT EXISTS idx_projects_team_id ON projects(team_id);

    -- Tasks Table (Phase 4 & 5)
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(50) NOT NULL DEFAULT 'todo',
      priority VARCHAR(50) NOT NULL DEFAULT 'medium',
      due_date TIMESTAMP WITH TIME ZONE,
      assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
      team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
    CREATE INDEX IF NOT EXISTS idx_tasks_team_id ON tasks(team_id);

    -- Task Comments Table (Phase 6)
    CREATE TABLE IF NOT EXISTS task_comments (
      id SERIAL PRIMARY KEY,
      task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      comment TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
    CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON task_comments(user_id);

    -- Calendar Events Table
    CREATE TABLE IF NOT EXISTS calendar_events (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
      end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
      location VARCHAR(255),
      created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by ON calendar_events(created_by);
    CREATE INDEX IF NOT EXISTS idx_calendar_events_start_datetime ON calendar_events(start_datetime);
    CREATE INDEX IF NOT EXISTS idx_calendar_events_team_id ON calendar_events(team_id);

    -- Meetings Table
    CREATE TABLE IF NOT EXISTS meetings (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
      end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
      location VARCHAR(255),
      organizer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
      team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_meetings_organizer_id ON meetings(organizer_id);
    CREATE INDEX IF NOT EXISTS idx_meetings_start_datetime ON meetings(start_datetime);
    CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
    CREATE INDEX IF NOT EXISTS idx_meetings_team_id ON meetings(team_id);

    -- Meeting Attendees Table
    CREATE TABLE IF NOT EXISTS meeting_attendees (
      id SERIAL PRIMARY KEY,
      meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      response_status VARCHAR(50) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (meeting_id, user_id)
    );
    CREATE INDEX IF NOT EXISTS idx_meeting_attendees_meeting_id ON meeting_attendees(meeting_id);
    CREATE INDEX IF NOT EXISTS idx_meeting_attendees_user_id ON meeting_attendees(user_id);

    -- Meeting Minutes Table (1:1 per meeting)
    CREATE TABLE IF NOT EXISTS meeting_minutes (
      id SERIAL PRIMARY KEY,
      meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE UNIQUE,
      summary TEXT,
      discussion TEXT,
      decisions TEXT,
      action_items TEXT,
      created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_meeting_minutes_meeting_id ON meeting_minutes(meeting_id);

    -- Knowledge Base Categories Table
    CREATE TABLE IF NOT EXISTS kb_categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      description TEXT,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_kb_categories_name ON kb_categories(name);
    CREATE INDEX IF NOT EXISTS idx_kb_categories_team_id ON kb_categories(team_id);

    -- Knowledge Base Articles Table
    CREATE TABLE IF NOT EXISTS kb_articles (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      category_id INTEGER REFERENCES kb_categories(id) ON DELETE RESTRICT,
      author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(50) NOT NULL DEFAULT 'draft',
      team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_kb_articles_title ON kb_articles(title);
    CREATE INDEX IF NOT EXISTS idx_kb_articles_category_id ON kb_articles(category_id);
    CREATE INDEX IF NOT EXISTS idx_kb_articles_status ON kb_articles(status);
    CREATE INDEX IF NOT EXISTS idx_kb_articles_author_id ON kb_articles(author_id);
    CREATE INDEX IF NOT EXISTS idx_kb_articles_team_id ON kb_articles(team_id);
  `;

  try {
    await query(createTablesQuery);
    console.log('✅ Database initialization: All 14 relational tables and indexes verified.');

    // Execute safe migration to alter columns (for existing databases) and backfill records
    console.log('Running safe migration and data backfill check...');
    await runMigration();

    return { success: true };
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  }
}

// Allow direct execution from CLI: node src/config/initDb.js
if (require.main === module) {
  initDb()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async () => {
      await pool.end();
      process.exit(1);
    });
}

module.exports = { initDb };

const { query, pool } = require('../db');

/**
 * Migration 002: Knowledge Base Article Version History
 * Creates kb_article_versions table, indexes, constraints, and backfills version 1 for existing articles.
 */
async function runMigration() {
  console.log('====================================================');
  console.log('🚀 RUNNING MIGRATION 002: KB ARTICLE VERSION HISTORY');
  console.log('====================================================\n');

  try {
    console.log('1. Creating kb_article_versions table...');
    await query(`
      CREATE TABLE IF NOT EXISTS kb_article_versions (
        id SERIAL PRIMARY KEY,
        article_id INTEGER NOT NULL REFERENCES kb_articles(id) ON DELETE CASCADE,
        team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        version_number INTEGER NOT NULL CHECK (version_number >= 1),
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        category_id INTEGER REFERENCES kb_categories(id) ON DELETE SET NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'draft',
        created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        change_summary TEXT,
        CONSTRAINT kb_article_versions_unique UNIQUE(article_id, version_number)
      );
    `);
    console.log('   ✅ Table kb_article_versions created or already exists.');

    console.log('2. Creating indexes for performance & isolation...');
    await query(`
      CREATE INDEX IF NOT EXISTS idx_kb_article_versions_article_id ON kb_article_versions(article_id);
      CREATE INDEX IF NOT EXISTS idx_kb_article_versions_team_id ON kb_article_versions(team_id);
      CREATE INDEX IF NOT EXISTS idx_kb_article_versions_created_at ON kb_article_versions(created_at);
      CREATE INDEX IF NOT EXISTS idx_kb_article_versions_version_number ON kb_article_versions(version_number);
    `);
    console.log('   ✅ Indexes created successfully.');

    console.log('3. Backfilling Version 1 for pre-existing articles...');
    const backfillResult = await query(`
      INSERT INTO kb_article_versions (
        article_id, team_id, version_number, title, content, category_id, status, created_by, created_at, change_summary
      )
      SELECT
        a.id,
        a.team_id,
        1,
        a.title,
        a.content,
        a.category_id,
        a.status,
        a.author_id,
        a.created_at,
        'Initial article'
      FROM kb_articles a
      WHERE NOT EXISTS (
        SELECT 1 FROM kb_article_versions v WHERE v.article_id = a.id
      )
      RETURNING id;
    `);
    console.log(`   ✅ Backfilled ${backfillResult.rowCount} version 1 record(s) for existing articles.`);

    console.log('\n====================================================');
    console.log('🎉 MIGRATION 002 COMPLETED SUCCESSFULLY');
    console.log('====================================================\n');
  } catch (err) {
    console.error('❌ Migration 002 failed:', err);
    throw err;
  }
}

if (require.main === module) {
  runMigration()
    .then(() => pool.end())
    .catch((err) => {
      console.error(err);
      pool.end();
      process.exit(1);
    });
}

module.exports = { runMigration };

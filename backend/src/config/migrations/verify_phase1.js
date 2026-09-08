const { query, pool } = require('../db');

async function verifyPhase1() {
  console.log('====================================================');
  console.log('🔍 VERIFYING PHASE 1: TEAMS DATABASE & MIGRATION');
  console.log('====================================================\n');

  try {
    // 1. Check all 14 expected tables
    console.log('1. Checking table existence in database...');
    const tablesRes = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    const tables = tablesRes.rows.map(r => r.table_name);
    console.log(`   Found ${tables.length} tables in public schema:`, tables.join(', '));

    const expectedTables = [
      'users',
      'teams',
      'team_members',
      'team_invitations',
      'announcements',
      'projects',
      'tasks',
      'task_comments',
      'calendar_events',
      'meetings',
      'meeting_attendees',
      'meeting_minutes',
      'kb_categories',
      'kb_articles'
    ];

    const missingTables = expectedTables.filter(t => !tables.includes(t));
    if (missingTables.length > 0) {
      throw new Error(`Missing expected tables: ${missingTables.join(', ')}`);
    }
    console.log('✅ All 14 expected tables exist.');

    // 2. Check team_id column in all 6 modified tables
    console.log('\n2. Verifying team_id columns in existing entity tables...');
    const entityTables = ['projects', 'tasks', 'meetings', 'calendar_events', 'kb_categories', 'kb_articles'];
    for (const table of entityTables) {
      const colRes = await query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1 AND column_name = 'team_id';
      `, [table]);
      if (colRes.rows.length === 0) {
        throw new Error(`Column team_id missing in table ${table}`);
      }
      console.log(`   ✓ ${table}.team_id exists (${colRes.rows[0].data_type}, nullable: ${colRes.rows[0].is_nullable})`);
    }
    console.log('✅ All 6 entity tables have team_id column.');

    // 3. Verify indexes on team_id
    console.log('\n3. Verifying indexes on team_id...');
    const indexRes = await query(`
      SELECT tablename, indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' AND indexname LIKE '%team_id%'
      ORDER BY tablename, indexname;
    `);
    console.log(`   Found ${indexRes.rows.length} team_id indexes:`);
    indexRes.rows.forEach(idx => console.log(`   - ${idx.tablename} -> ${idx.indexname}`));

    // 4. Verify default workspace & members
    console.log('\n4. Verifying default workspace and team members...');
    const teamRes = await query('SELECT * FROM teams');
    console.log(`   Total teams: ${teamRes.rows.length}`);
    teamRes.rows.forEach(t => console.log(`   - Team #${t.id}: "${t.name}" (created_by: User #${t.created_by})`));

    const membersRes = await query(`
      SELECT tm.id, tm.team_id, tm.user_id, tm.role, u.email, u.name
      FROM team_members tm
      JOIN users u ON u.id = tm.user_id
      ORDER BY tm.id ASC;
    `);
    console.log(`   Total team members: ${membersRes.rows.length}`);
    const leaders = membersRes.rows.filter(m => m.role === 'leader');
    const regularMembers = membersRes.rows.filter(m => m.role === 'member');
    console.log(`   - Leaders (${leaders.length}):`, leaders.map(l => `${l.name} (${l.email})`).join(', '));
    console.log(`   - Members (${regularMembers.length}): ${regularMembers.length} active users`);

    // 5. Verify no orphaned records (team_id IS NULL)
    console.log('\n5. Checking backfilled data integrity across entity tables...');
    for (const table of entityTables) {
      const countRes = await query(`SELECT COUNT(*) as total, COUNT(team_id) as with_team FROM ${table}`);
      const nullCountRes = await query(`SELECT COUNT(*) as null_count FROM ${table} WHERE team_id IS NULL`);
      const total = parseInt(countRes.rows[0].total, 10);
      const withTeam = parseInt(countRes.rows[0].with_team, 10);
      const nullCount = parseInt(nullCountRes.rows[0].null_count, 10);
      console.log(`   - ${table}: total = ${total}, with_team = ${withTeam}, null_team = ${nullCount}`);
      if (nullCount > 0) {
        throw new Error(`Table ${table} has ${nullCount} records with NULL team_id!`);
      }
    }
    console.log('✅ All existing records are 100% linked to a workspace (0 orphaned records).');

    // 6. Check existing relationships still intact
    console.log('\n6. Checking existing relationships & primary keys...');
    const tasksWithProjects = await query('SELECT COUNT(*) as valid_tasks FROM tasks t JOIN projects p ON p.id = t.project_id');
    const meetingAttendeesCount = await query('SELECT COUNT(*) as attendees FROM meeting_attendees');
    const meetingMinutesCount = await query('SELECT COUNT(*) as minutes FROM meeting_minutes');
    console.log(`   - Tasks linked to valid projects: ${tasksWithProjects.rows[0].valid_tasks}`);
    console.log(`   - Meeting attendees preserved: ${meetingAttendeesCount.rows[0].attendees}`);
    console.log(`   - Meeting minutes preserved: ${meetingMinutesCount.rows[0].minutes}`);

    console.log('\n====================================================');
    console.log('🎉 PHASE 1 VERIFICATION PASSED COMPLETELY');
    console.log('====================================================\n');
    return { success: true };
  } catch (error) {
    console.error('\n❌ PHASE 1 VERIFICATION FAILED:', error.message);
    throw error;
  }
}

if (require.main === module) {
  verifyPhase1()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async () => {
      await pool.end();
      process.exit(1);
    });
}

module.exports = { verifyPhase1 };

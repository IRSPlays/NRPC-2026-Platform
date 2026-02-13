import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'database.sqlite');

let db = null;

// Initialize database
async function initDatabase() {
  db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });

  // Enable WAL mode
  await db.run('PRAGMA journal_mode = WAL');
  await db.run('PRAGMA synchronous = NORMAL');
  await db.run('PRAGMA foreign_keys = ON');

  // Create tables
  await db.run(`
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_name TEXT UNIQUE NOT NULL,
      school_name TEXT NOT NULL,
      category TEXT CHECK(category IN ('Primary', 'Secondary')) NOT NULL,
      login_password TEXT DEFAULT 'NRPC2026Teams',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER REFERENCES teams(id),
      submission_type TEXT CHECK(submission_type IN ('file', 'link', 'robot_run')) NOT NULL,
      file_path TEXT,
      external_link TEXT,
      original_filename TEXT,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      concept_score INTEGER CHECK(concept_score BETWEEN 0 AND 40),
      future_score INTEGER CHECK(future_score BETWEEN 0 AND 30),
      organization_score INTEGER CHECK(organization_score BETWEEN 0 AND 20),
      aesthetics_score INTEGER CHECK(aesthetics_score BETWEEN 0 AND 10),
      assessed_by TEXT,
      assessed_at DATETIME
    )
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER REFERENCES teams(id),
      judge_name TEXT NOT NULL,
      mission_data TEXT NOT NULL,
      mission1 INTEGER DEFAULT 0,
      mission2 INTEGER DEFAULT 0,
      mission3 INTEGER DEFAULT 0,
      mission4 INTEGER DEFAULT 0,
      mission5 INTEGER DEFAULT 0,
      mission6 INTEGER DEFAULT 0,
      mission7 INTEGER DEFAULT 0,
      total_score INTEGER DEFAULT 0,
      completion_time_seconds INTEGER,
      mechanical_design_score INTEGER DEFAULT 0,
      judge_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      priority TEXT CHECK(priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
      is_pinned BOOLEAN DEFAULT 0,
      is_active BOOLEAN DEFAULT 1,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migration: Check and add mechanical_design_score if missing
  try {
    const tableInfo = await db.all("PRAGMA table_info(scores)");
    const hasMechScore = tableInfo.some(col => col.name === 'mechanical_design_score');
    if (!hasMechScore) {
      console.log('Migrating: Adding mechanical_design_score to scores table...');
      await db.run("ALTER TABLE scores ADD COLUMN mechanical_design_score INTEGER DEFAULT 0");
    }
  } catch (err) {
    console.error('Migration error:', err);
  }

  // Create indexes for foreign keys
  try {
    await db.run('CREATE INDEX IF NOT EXISTS idx_submissions_team_id ON submissions(team_id)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_scores_team_id ON scores(team_id)');
  } catch (err) {
    console.log('Indexes may already exist:', err.message);
  }

  console.log('✓ Database initialized successfully');
  return db;
}

// Get database instance
export async function getDb() {
  if (!db) {
    await initDatabase();
  }
  return db;
}

// Backup database to JSON
export async function backupDatabase() {
  const database = await getDb();
  const timestamp = Date.now();
  const backupPath = path.join('./backups', `backup-${timestamp}.json`);

  const teams = await database.all('SELECT * FROM teams');
  const submissions = await database.all('SELECT * FROM submissions');
  const scores = await database.all('SELECT * FROM scores');
  const announcements = await database.all('SELECT * FROM announcements');

  const backup = {
    timestamp: new Date().toISOString(),
    teams,
    submissions,
    scores,
    announcements
  };

  if (!fs.existsSync('./backups')) {
    fs.mkdirSync('./backups', { recursive: true });
  }

  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  
  // Keep only last 50 backups
  const files = fs.readdirSync('./backups')
    .filter(f => f.startsWith('backup-'))
    .map(f => ({
      name: f,
      time: fs.statSync(path.join('./backups', f)).mtime
    }))
    .sort((a, b) => b.time - a.time);
  
  if (files.length > 50) {
    files.slice(50).forEach(f => {
      fs.unlinkSync(path.join('./backups', f.name));
    });
  }

  return backupPath;
}

// Restore from backup
export async function restoreDatabase(backupData) {
  const database = await getDb();

  try {
    await database.run('BEGIN TRANSACTION');

    await database.run('DELETE FROM scores');
    await database.run('DELETE FROM submissions');
    await database.run('DELETE FROM teams');
    await database.run('DELETE FROM announcements');

    for (const team of backupData.teams) {
      await database.run(
        'INSERT INTO teams (id, team_name, school_name, category, login_password, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [team.id, team.team_name, team.school_name, team.category, team.login_password, team.created_at]
      );
    }

    for (const sub of backupData.submissions) {
      await database.run(
        'INSERT INTO submissions (id, team_id, submission_type, file_path, external_link, original_filename, submitted_at, concept_score, future_score, organization_score, aesthetics_score, assessed_by, assessed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [sub.id, sub.team_id, sub.submission_type, sub.file_path, sub.external_link, sub.original_filename, sub.submitted_at, sub.concept_score, sub.future_score, sub.organization_score, sub.aesthetics_score, sub.assessed_by, sub.assessed_at]
      );
    }

    for (const score of backupData.scores) {
      await database.run(
        'INSERT INTO scores (id, team_id, judge_name, mission_data, mission1, mission2, mission3, mission4, mission5, mission6, mission7, total_score, completion_time_seconds, mechanical_design_score, judge_notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [score.id, score.team_id, score.judge_name, score.mission_data, score.mission1, score.mission2, score.mission3, score.mission4, score.mission5, score.mission6, score.mission7, score.total_score, score.completion_time_seconds, score.mechanical_design_score || 0, score.judge_notes || null, score.created_at]
      );
    }

    if (backupData.announcements) {
      for (const ann of backupData.announcements) {
        await database.run(
          'INSERT INTO announcements (id, title, content, priority, is_pinned, is_active, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [ann.id, ann.title, ann.content, ann.priority, ann.is_pinned ? 1 : 0, ann.is_active ? 1 : 0, ann.expires_at, ann.created_at]
        );
      }
    }

    await database.run('COMMIT');
  } catch (err) {
    await database.run('ROLLBACK');
    throw err;
  }
}

// Initialize on first import
initDatabase();

export default { getDb, backupDatabase, restoreDatabase };
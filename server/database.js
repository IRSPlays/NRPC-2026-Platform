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
      submission_type TEXT CHECK(submission_type IN ('file', 'link')) NOT NULL,
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
      judge_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

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
  
  const backup = {
    timestamp: new Date().toISOString(),
    teams,
    submissions,
    scores
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
  
  await database.run('DELETE FROM scores');
  await database.run('DELETE FROM submissions');
  await database.run('DELETE FROM teams');

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
      'INSERT INTO scores (id, team_id, judge_name, mission_data, mission1, mission2, mission3, mission4, mission5, mission6, mission7, total_score, completion_time_seconds, judge_notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [score.id, score.team_id, score.judge_name, score.mission_data, score.mission1, score.mission2, score.mission3, score.mission4, score.mission5, score.mission6, score.mission7, score.total_score, score.completion_time_seconds, score.judge_notes, score.created_at]
    );
  }
}

// Initialize on first import
initDatabase();

export default { getDb, backupDatabase, restoreDatabase };
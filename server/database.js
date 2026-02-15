import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import unzipper from 'unzipper';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Persistent Data Directory Strategy
// 1. Check if /app/data exists (Railway Volume)
// 2. Check process.env.DATA_DIR
// 3. Fallback to local ./data
let DATA_DIR;
if (fs.existsSync('/app/data')) {
  DATA_DIR = '/app/data';
} else if (process.env.DATA_DIR) {
  DATA_DIR = process.env.DATA_DIR;
} else {
  DATA_DIR = path.join(process.cwd(), 'data');
}

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

console.log(`✓ Storage Root: ${DATA_DIR}`); // Debug log

const DB_PATH = path.join(DATA_DIR, 'database.sqlite');

let db = null;

// Close database connection
export async function closeDatabase() {
  if (db) {
    await db.close();
    db = null;
    console.log('✓ Database connection closed');
  }
}

// Restore from ZIP backup
export async function restoreFromZip(zipPath) {
  console.log(`[RESTORE] Starting system restore from: ${zipPath}`);
  
  if (!fs.existsSync(zipPath)) {
    console.error(`[RESTORE] ERROR: Source ZIP file not found at ${zipPath}`);
    throw new Error(`Restore source file missing: ${zipPath}`);
  }

  const tempExtractDir = path.join(DATA_DIR, 'temp_extracted');
  console.log(`[RESTORE] Extraction target: ${tempExtractDir}`);
  
  // Clean and prepare temp dir
  try {
    if (fs.existsSync(tempExtractDir)) {
      fs.rmSync(tempExtractDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempExtractDir, { recursive: true });
  } catch (err) {
    console.error(`[RESTORE] ERROR preparing temp dir: ${err.message}`);
    throw err;
  }

  try {
    // 1. Extract ZIP using a more robust method
    console.log('[RESTORE] Extracting archive...');
    await new Promise((resolve, reject) => {
      fs.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: tempExtractDir }))
        .on('close', resolve)
        .on('error', reject);
    });
    console.log('[RESTORE] Extraction complete');

    // 2. Validate contents
    const newDbPath = path.join(tempExtractDir, 'database.sqlite');
    if (!fs.existsSync(newDbPath)) {
      console.error('[RESTORE] ERROR: database.sqlite not found in extracted archive');
      throw new Error('Invalid backup: database.sqlite not found in archive');
    }

    // 3. Close active DB connection
    console.log('[RESTORE] Closing active database connection...');
    await closeDatabase();

    // 4. Replace Database File
    console.log('[RESTORE] Overwriting database file...');
    // Backup current DB as a failsafe
    const currentDbBackup = path.join(DATA_DIR, `database.sqlite.pre-restore-${Date.now()}`);
    if (fs.existsSync(DB_PATH)) {
      fs.copyFileSync(DB_PATH, currentDbBackup);
    }

    fs.copyFileSync(newDbPath, DB_PATH);
    console.log('[RESTORE] Database file replaced successfully');

    // 5. Replace Uploads
    const uploadsPath = path.join(DATA_DIR, 'uploads');
    const newUploadsPath = path.join(tempExtractDir, 'uploads');

    if (fs.existsSync(newUploadsPath)) {
      console.log('[RESTORE] Replacing uploads directory...');
      if (fs.existsSync(uploadsPath)) {
        fs.rmSync(uploadsPath, { recursive: true, force: true });
      }
      // Use move/rename for efficiency if possible, or copy
      try {
        fs.renameSync(newUploadsPath, uploadsPath);
      } catch (e) {
        // Fallback to copy if rename fails (e.g. across mount points)
        fs.cpSync(newUploadsPath, uploadsPath, { recursive: true });
      }
      console.log('[RESTORE] Uploads directory replaced successfully');
    } else {
      console.log('[RESTORE] WARNING: No uploads directory in backup');
      if (!fs.existsSync(uploadsPath)) {
        fs.mkdirSync(uploadsPath, { recursive: true });
      }
    }

    // 6. Re-initialize Database
    console.log('[RESTORE] Re-initializing database connection...');
    await initDatabase();
    console.log('[RESTORE] SUCCESS: System restore completed');

  } catch (err) {
    console.error(`[RESTORE] RESTORE FAILED: ${err.message}`);
    // Try to recover connection
    if (!db) await initDatabase(); 
    throw err;
  } finally {
    // Cleanup temp (keep it for debugging if needed, but usually best to clean)
    try {
      if (fs.existsSync(tempExtractDir)) {
        fs.rmSync(tempExtractDir, { recursive: true, force: true });
      }
    } catch (e) {}
  }
}

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
      email TEXT,
      category TEXT CHECK(category IN ('Primary', 'Secondary')) NOT NULL,
      login_password TEXT DEFAULT 'NRPC2026Teams',
      email_sent INTEGER DEFAULT 0,
      password_changed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migration: Add email to teams if missing
  try {
    const tableInfo = await db.all("PRAGMA table_info(teams)");
    const hasEmail = tableInfo.some(col => col.name === 'email');
    if (!hasEmail) {
      console.log('Migrating: Adding email to teams table...');
      await db.run("ALTER TABLE teams ADD COLUMN email TEXT");
    }
    
    const hasEmailSent = tableInfo.some(col => col.name === 'email_sent');
    if (!hasEmailSent) {
      console.log('Migrating: Adding email_sent to teams table...');
      await db.run("ALTER TABLE teams ADD COLUMN email_sent INTEGER DEFAULT 0");
    }

    const hasPasswordChanged = tableInfo.some(col => col.name === 'password_changed');
    if (!hasPasswordChanged) {
      console.log('Migrating: Adding password_changed to teams table...');
      await db.run("ALTER TABLE teams ADD COLUMN password_changed INTEGER DEFAULT 0");
    }
  } catch (err) {
    console.error('Migration error:', err);
  }

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

  await db.run(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER REFERENCES teams(id),
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      category TEXT CHECK(category IN ('Rule Query', 'Technical Support', 'Submission Issue', 'Other')) NOT NULL,
      urgency TEXT CHECK(urgency IN ('Low', 'Medium', 'High', 'Critical')) DEFAULT 'Medium',
      description TEXT NOT NULL,
      file_path TEXT,
      status TEXT CHECK(status IN ('Open', 'Pending', 'Resolved')) DEFAULT 'Open',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS ticket_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
      sender_role TEXT CHECK(sender_role IN ('admin', 'user')) NOT NULL,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migration: Check and add team_id to tickets if missing
  try {
    const tableInfo = await db.all("PRAGMA table_info(tickets)");
    const hasTeamId = tableInfo.some(col => col.name === 'team_id');
    if (!hasTeamId) {
      console.log('Migrating: Adding team_id to tickets table...');
      await db.run("ALTER TABLE tickets ADD COLUMN team_id INTEGER REFERENCES teams(id)");
    }
  } catch (err) {
    console.error('Migration error:', err);
  }

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
  const backupDir = path.join(DATA_DIR, 'backups');
  const backupPath = path.join(backupDir, `backup-${timestamp}.json`);

  const teams = await database.all('SELECT * FROM teams');
  const submissions = await database.all('SELECT * FROM submissions');
  const scores = await database.all('SELECT * FROM scores');
  const announcements = await database.all('SELECT * FROM announcements');
  const tickets = await database.all('SELECT * FROM tickets');
  const ticket_messages = await database.all('SELECT * FROM ticket_messages');

  const backup = {
    timestamp: new Date().toISOString(),
    teams,
    submissions,
    scores,
    announcements,
    tickets,
    ticket_messages
  };

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  
  // Keep only last 50 backups
  const files = fs.readdirSync(backupDir)
    .filter(f => f.startsWith('backup-'))
    .map(f => ({
      name: f,
      time: fs.statSync(path.join(backupDir, f)).mtime
    }))
    .sort((a, b) => b.time - a.time);
  
  if (files.length > 50) {
    files.slice(50).forEach(f => {
      fs.unlinkSync(path.join(backupDir, f.name));
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
    await database.run('DELETE FROM tickets');
    await database.run('DELETE FROM ticket_messages');

    for (const team of backupData.teams) {
      await database.run(
        'INSERT INTO teams (id, team_name, school_name, email, category, login_password, email_sent, password_changed, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [team.id, team.team_name, team.school_name, team.email || null, team.category, team.login_password, team.email_sent || 0, team.password_changed || 0, team.created_at]
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

    if (backupData.tickets) {
      for (const ticket of backupData.tickets) {
        await database.run(
          'INSERT INTO tickets (id, team_id, name, email, category, urgency, description, file_path, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [ticket.id, ticket.team_id || null, ticket.name, ticket.email, ticket.category, ticket.urgency, ticket.description, ticket.file_path, ticket.status, ticket.created_at]
        );
      }
    }

    if (backupData.ticket_messages) {
      for (const msg of backupData.ticket_messages) {
        await database.run(
          'INSERT INTO ticket_messages (id, ticket_id, sender_role, message, created_at) VALUES (?, ?, ?, ?, ?)',
          [msg.id, msg.ticket_id, msg.sender_role, msg.message, msg.created_at]
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

export default { getDb, backupDatabase, restoreDatabase, restoreFromZip, closeDatabase };
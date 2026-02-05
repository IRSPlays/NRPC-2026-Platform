import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { getDb, backupDatabase, restoreDatabase } from './database.js';
import { calculateTotalScore, calculateRankings, calculateChampionshipRankings } from './scoring.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for easier development, enable in full production
}));

// Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per window
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Limit each IP to 20 login attempts per 15 minutes
  message: { error: 'Too many login attempts, please try again after 15 minutes' }
});

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());
app.use('/api/', generalLimiter);

// Serve uploaded files with proper MIME types
app.use('/uploads', (req, res, next) => {
  const ext = path.extname(req.path).toLowerCase();
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.tiff': 'image/tiff',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.xls': 'application/vnd.ms-excel'
  };
  
  if (mimeTypes[ext]) {
    res.setHeader('Content-Type', mimeTypes[ext]);
  }
  
  // Allow inline viewing for images and PDFs
  if (['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.tiff'].includes(ext)) {
    res.setHeader('Content-Disposition', 'inline');
  }
  
  next();
}, express.static('uploads'));

// Auth passwords from env (defaults for dev)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'NRPCTeam2026';
const TEAM_PASSWORD = process.env.TEAM_PASSWORD || 'NRPC2026Teams';
const JUDGE_PASSWORD = process.env.JUDGE_PASSWORD || 'NRPC2026Teams';

// Auth middleware
const requireAdmin = async (req, res, next) => {
  const auth = req.cookies.admin_auth;
  if (auth !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }
  next();
};

const requireJudge = async (req, res, next) => {
  const auth = req.cookies.judge_auth;
  if (auth !== JUDGE_PASSWORD) {
    return res.status(401).json({ error: 'Judge authentication required' });
  }
  next();
};

// File upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync('uploads')) {
      fs.mkdirSync('uploads', { recursive: true });
    }
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    // Clean the filename to remove special characters
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}-${cleanName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.pptx', '.ppt', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.tiff', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: PDF, PPTX, Images, Excel'));
    }
  }
});

// ===== AUTH ROUTES =====

const COOKIE_OPTIONS = {
  httpOnly: true,
  maxAge: 8 * 60 * 60 * 1000, // 8 hours
  secure: isProd,
  sameSite: 'strict'
};

// Admin login
app.post('/api/auth/admin', authLimiter, (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.cookie('admin_auth', ADMIN_PASSWORD, COOKIE_OPTIONS);
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// Judge login
app.post('/api/auth/judge', authLimiter, (req, res) => {
  const { password } = req.body;
  if (password === JUDGE_PASSWORD) {
    res.cookie('judge_auth', JUDGE_PASSWORD, COOKIE_OPTIONS);
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// Team login
app.post('/api/auth/team', authLimiter, async (req, res) => {
  const { teamId, password } = req.body;
  
  if (password !== TEAM_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  
  const db = await getDb();
  const team = await db.get('SELECT * FROM teams WHERE id = ?', [teamId]);
  if (!team) {
    return res.status(404).json({ error: 'Team not found' });
  }
  
  res.cookie('team_id', teamId, COOKIE_OPTIONS);
  
  res.json({ 
    success: true, 
    team: { 
      id: team.id, 
      name: team.team_name, 
      school: team.school_name 
    } 
  });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('admin_auth');
  res.clearCookie('judge_auth');
  res.clearCookie('team_id');
  res.json({ success: true });
});

// Check auth status
app.get('/api/auth/status', (req, res) => {
  res.json({
    isAdmin: req.cookies.admin_auth === ADMIN_PASSWORD,
    isJudge: req.cookies.judge_auth === JUDGE_PASSWORD,
    teamId: req.cookies.team_id || null
  });
});

// ===== TEAM ROUTES =====

// Get all teams (public for calculator)
app.get('/api/teams', async (req, res) => {
  try {
    const db = await getDb();
    const teams = await db.all('SELECT id, team_name, school_name, category FROM teams ORDER BY team_name');
    res.json(teams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create team (admin only)
app.post('/api/teams', requireAdmin, async (req, res) => {
  const { team_name, school_name, category } = req.body;
  
  if (!team_name || !school_name || !category) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    const db = await getDb();
    const result = await db.run(
      'INSERT INTO teams (team_name, school_name, category) VALUES (?, ?, ?)',
      [team_name, school_name, category]
    );
    
    res.json({ 
      success: true, 
      team: { 
        id: result.lastID, 
        team_name, 
        school_name, 
        category 
      } 
    });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      res.status(409).json({ error: 'Team name already exists' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Update team
app.put('/api/teams/:id', requireAdmin, async (req, res) => {
  const { team_name, school_name, category } = req.body;
  const { id } = req.params;
  
  try {
    const db = await getDb();
    await db.run(
      'UPDATE teams SET team_name = ?, school_name = ?, category = ? WHERE id = ?',
      [team_name, school_name, category, id]
    );
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete team
app.delete('/api/teams/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  
  try {
    const db = await getDb();
    // Cascade delete submissions and scores
    await db.run('DELETE FROM submissions WHERE team_id = ?', [id]);
    await db.run('DELETE FROM scores WHERE team_id = ?', [id]);
    await db.run('DELETE FROM teams WHERE id = ?', [id]);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== SUBMISSION ROUTES =====

// Get submissions (admin or team)
app.get('/api/submissions', async (req, res) => {
  const { teamId } = req.query;
  
  // Admin sees all, team sees only theirs
  if (req.cookies.admin_auth !== ADMIN_PASSWORD && req.cookies.team_id !== teamId) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  try {
    const db = await getDb();
    let submissions;
    
    if (teamId) {
      submissions = await db.all(`
        SELECT s.*, t.team_name, t.school_name 
        FROM submissions s 
        JOIN teams t ON s.team_id = t.id 
        WHERE s.team_id = ? 
        ORDER BY s.submitted_at DESC
      `, [teamId]);
    } else {
      submissions = await db.all(`
        SELECT s.*, t.team_name, t.school_name 
        FROM submissions s 
        JOIN teams t ON s.team_id = t.id 
        ORDER BY s.submitted_at DESC
      `);
    }
    
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create submission (file upload)
app.post('/api/submissions/file', upload.single('file'), async (req, res) => {
  const { team_id, original_filename, submission_type } = req.body;
  
  // Verify team is logged in
  if (req.cookies.team_id !== team_id) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const type = submission_type || 'file'; // Default to file if not specified

  try {
    const db = await getDb();
    const result = await db.run(
      'INSERT INTO submissions (team_id, submission_type, file_path, original_filename) VALUES (?, ?, ?, ?)',
      [team_id, type, req.file.filename, original_filename]
    );
    
    res.json({ 
      success: true, 
      submission: { 
        id: result.lastID,
        team_id,
        submission_type: type,
        file_path: req.file.filename,
        original_filename
      } 
    });
  } catch (err) {
    fs.unlinkSync(req.file.path);
    res.status(500).json({ error: err.message });
  }
});

// Create submission (external link or robot run link)
app.post('/api/submissions/link', async (req, res) => {
  const { team_id, external_link, original_filename, submission_type } = req.body;
  
  // Verify team is logged in
  if (req.cookies.team_id !== team_id) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  if (!external_link || !external_link.startsWith('http')) {
    return res.status(400).json({ error: 'Valid URL required' });
  }
  
  const type = submission_type || 'link';

  try {
    const db = await getDb();
    const result = await db.run(
      'INSERT INTO submissions (team_id, submission_type, external_link, original_filename) VALUES (?, ?, ?, ?)',
      [team_id, type, external_link, original_filename]
    );
    
    res.json({ 
      success: true, 
      submission: { 
        id: result.lastID,
        team_id,
        submission_type: type,
        external_link,
        original_filename
      } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Score submission (admin only)
app.put('/api/submissions/:id/score', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { concept_score, future_score, organization_score, aesthetics_score, assessed_by } = req.body;
  
  try {
    const db = await getDb();
    await db.run(
      'UPDATE submissions SET concept_score = ?, future_score = ?, organization_score = ?, aesthetics_score = ?, assessed_by = ?, assessed_at = CURRENT_TIMESTAMP WHERE id = ?',
      [concept_score, future_score, organization_score, aesthetics_score, assessed_by, id]
    );
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== SCORE ROUTES =====

// Calculate score (public - no save)
app.post('/api/scores/calculate', async (req, res) => {
  const { missionData } = req.body;
  const result = calculateTotalScore(missionData);
  res.json(result);
});

// Save score (judge only)
app.post('/api/scores', requireJudge, async (req, res) => {
  const { team_id, judge_name, missionData, completion_time_seconds, mechanical_design_score, judge_notes } = req.body;
  
  const result = calculateTotalScore(missionData);
  
  try {
    const db = await getDb();
    const scoreResult = await db.run(
      'INSERT INTO scores (team_id, judge_name, mission_data, mission1, mission2, mission3, mission4, mission5, mission6, mission7, total_score, completion_time_seconds, mechanical_design_score, judge_notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        team_id,
        judge_name,
        JSON.stringify(missionData),
        result.missions[0].score,
        result.missions[1].score,
        result.missions[2].score,
        result.missions[3].score,
        result.missions[4].score,
        result.missions[5].score,
        result.missions[6].score,
        result.missions[7] ? result.missions[7].score : 0, // Ensure mission 7 doesn't break if logic changes
        result.total,
        completion_time_seconds,
        mechanical_design_score || 0,
        judge_notes
      ]
    );
    
    res.json({ 
      success: true, 
      score: {
        id: scoreResult.lastID,
        ...result,
        completion_time_seconds,
        mechanical_design_score
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get scores for a team (team view)
app.get('/api/scores/team/:teamId', async (req, res) => {
  const { teamId } = req.params;
  
  // Team can only see their own scores
  if (req.cookies.team_id !== teamId && req.cookies.admin_auth !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  try {
    const db = await getDb();
    const scores = await db.all(`
      SELECT s.*, t.team_name, t.school_name
      FROM scores s
      JOIN teams t ON s.team_id = t.id
      WHERE s.team_id = ?
      ORDER BY s.created_at DESC
    `, [teamId]);
    
    res.json(scores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all scores with rankings (admin only)
// Returns Championship rankings
app.get('/api/scores/leaderboard', requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const teams = await db.all('SELECT * FROM teams');
    const scores = await db.all('SELECT * FROM scores');
    const submissions = await db.all('SELECT * FROM submissions');
    
    const rankings = calculateChampionshipRankings(teams, scores, submissions);
    res.json(rankings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all raw scores (admin only)
app.get('/api/scores', requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const scores = await db.all(`
      SELECT s.*, t.team_name, t.school_name
      FROM scores s
      JOIN teams t ON s.team_id = t.id
      ORDER BY s.created_at DESC
    `);
    
    res.json(scores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete score (admin only)
app.delete('/api/scores/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  
  try {
    const db = await getDb();
    await db.run('DELETE FROM scores WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== BACKUP ROUTES (Admin only) =====

// Create backup
app.post('/api/backup', requireAdmin, async (req, res) => {
  try {
    const backupPath = await backupDatabase();
    res.json({ success: true, path: backupPath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List backups
app.get('/api/backup/list', requireAdmin, async (req, res) => {
  if (!fs.existsSync('backups')) {
    return res.json([]);
  }
  
  const files = fs.readdirSync('backups')
    .filter(f => f.startsWith('backup-'))
    .map(f => ({
      name: f,
      size: fs.statSync(path.join('backups', f)).size,
      created: fs.statSync(path.join('backups', f)).mtime
    }))
    .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
  
  res.json(files);
});

// Download backup
app.get('/api/backup/download/:filename', requireAdmin, (req, res) => {
  const { filename } = req.params;
  const filePath = path.join('backups', filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Backup not found' });
  }
  
  res.download(filePath);
});

// Restore from backup
app.post('/api/backup/restore', requireAdmin, async (req, res) => {
  const { backupData } = req.body;

  try {
    await restoreDatabase(backupData);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== ANNOUNCEMENT ROUTES =====

// Get active announcements (public)
app.get('/api/announcements', async (req, res) => {
  try {
    const db = await getDb();
    const now = new Date().toISOString();
    const announcements = await db.all(`
      SELECT id, title, content, priority, is_pinned, created_at, expires_at
      FROM announcements
      WHERE is_active = 1 AND (expires_at IS NULL OR expires_at > ?)
      ORDER BY is_pinned DESC, created_at DESC
    `, [now]);
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create announcement (admin only)
app.post('/api/announcements', requireAdmin, async (req, res) => {
  const { title, content, priority, is_pinned, expires_at } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  try {
    const db = await getDb();
    const result = await db.run(
      'INSERT INTO announcements (title, content, priority, is_pinned, expires_at) VALUES (?, ?, ?, ?, ?)',
      [title, content, priority || 'medium', is_pinned ? 1 : 0, expires_at || null]
    );

    res.json({
      success: true,
      announcement: {
        id: result.lastID,
        title,
        content,
        priority: priority || 'medium',
        is_pinned: !!is_pinned,
        created_at: new Date().toISOString(),
        expires_at
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update announcement (admin only)
app.put('/api/announcements/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { title, content, priority, is_pinned, is_active, expires_at } = req.body;

  try {
    const db = await getDb();
    await db.run(`
      UPDATE announcements
      SET title = ?, content = ?, priority = ?, is_pinned = ?, is_active = ?, expires_at = ?
      WHERE id = ?
    `, [title, content, priority, is_pinned ? 1 : 0, is_active ? 1 : 0, expires_at, id]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete announcement (admin only)
app.delete('/api/announcements/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const db = await getDb();
    await db.run('DELETE FROM announcements WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle pin status (admin only)
app.patch('/api/announcements/:id/pin', requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const db = await getDb();
    const ann = await db.get('SELECT is_pinned FROM announcements WHERE id = ?', [id]);
    if (!ann) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    await db.run('UPDATE announcements SET is_pinned = ? WHERE id = ?', [ann.is_pinned ? 0 : 1, id]);
    res.json({ success: true, is_pinned: !ann.is_pinned });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve sitemap.xml and robots.txt from public folder
app.use(express.static(path.join(__dirname, '../public')));

// API endpoints serve sitemap.xml with actual domain
app.get('/sitemap.xml', (req, res) => {
  const baseUrl = process.env.BASE_URL || 'https://nrpc-platform.app';
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>2026-02-04</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/calculator</loc>
    <lastmod>2026-02-04</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/team-login</loc>
    <lastmod>2026-02-04</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>`;
  
  res.set('Content-Type', 'application/xml');
  res.send(sitemap);
});

// Dynamic robots.txt
app.get('/robots.txt', (req, res) => {
  const baseUrl = process.env.BASE_URL || 'https://nrpc-platform.app';
  const robots = `# Robots.txt for NRPC Competition Platform
User-agent: *
Allow: /

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Disallow admin pages
Disallow: /admin
Disallow: /team-dashboard
Disallow: /submit
Disallow: /api/
`;
  
  res.set('Content-Type', 'text/plain');
  res.send(robots);
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Serve frontend static files (built with Vite)
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  // Serve static files from dist folder
  app.use(express.static(distPath));
  
  // Handle SPA routing - return index.html for all non-API routes
  app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ URL: http://localhost:${PORT}`);
  if (fs.existsSync(distPath)) {
    console.log(`✓ Frontend: Built and served from /dist`);
  } else {
    console.log(`⚠ Frontend: Run 'npm run build' first, or use 'npm run dev' for development`);
  }
  console.log(`✓ Admin password: ${ADMIN_PASSWORD}`);
  console.log(`✓ Team/Judge password: ${TEAM_PASSWORD}`);
  console.log(`✓ Database: SQLite with WAL mode`);
  console.log(`✓ Auto-backup: Every 5 minutes`);
});

export default app;
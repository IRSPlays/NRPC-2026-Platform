import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import { getDb, backupDatabase, restoreDatabase } from './database.js';
import { calculateTotalScore, calculateRankings, calculateChampionshipRankings } from './scoring.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

// Persistent Data Directory
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Enable trust proxy for Railway/Heroku/Vercel to fix rate-limiting
app.set('trust proxy', 1);

// Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 500, 
  message: { error: 'Too many requests' },
  standardHeaders: true, 
  legacyHeaders: false,
});

const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, 
  message: { error: 'Too many login attempts' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080', 'https://nrpc-platform.app'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || 
        allowedOrigins.includes(origin) || 
        origin.endsWith('.railway.app') || 
        origin.endsWith('.up.railway.app')) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "blob:", "*"],
      connectSrc: ["'self'", "*"], 
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
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
}, express.static(path.join(DATA_DIR, 'uploads')));

// Auth passwords from env (defaults for dev)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'NRPCTeam2026';
const TEAM_PASSWORD = process.env.TEAM_PASSWORD || 'NRPC2026Teams';
const JUDGE_PASSWORD = process.env.JUDGE_PASSWORD || 'NRPC2026Judges';
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

// JWT token generation
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// Auth middleware
const requireAdmin = async (req, res, next) => {
  const token = req.cookies.admin_auth;
  if (!token) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }
  
  const decoded = verifyToken(token);
  if (!decoded || decoded.type !== 'admin') {
    return res.status(401).json({ error: 'Invalid or expired admin token' });
  }
  
  req.user = decoded;
  next();
};

const requireJudge = async (req, res, next) => {
  const token = req.cookies.judge_auth;
  if (!token) {
    return res.status(401).json({ error: 'Judge authentication required' });
  }
  
  const decoded = verifyToken(token);
  if (!decoded || decoded.type !== 'judge') {
    return res.status(401).json({ error: 'Invalid or expired judge token' });
  }
  
  req.user = decoded;
  next();
};

const requireAdminOrJudge = async (req, res, next) => {
  const adminToken = req.cookies.admin_auth;
  const judgeToken = req.cookies.judge_auth;
  
  if (adminToken) {
    const decoded = verifyToken(adminToken);
    if (decoded && decoded.type === 'admin') {
      req.user = decoded;
      return next();
    }
  }
  
  if (judgeToken) {
    const decoded = verifyToken(judgeToken);
    if (decoded && decoded.type === 'judge') {
      req.user = decoded;
      return next();
    }
  }
  
  return res.status(401).json({ error: 'Admin or Judge authentication required' });
};

// File upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(DATA_DIR, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
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

// Ticket upload setup (Strictly images)
const ticketStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(DATA_DIR, 'uploads/tickets/');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}-${cleanName}`);
  }
});

const uploadTicket = multer({
  storage: ticketStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for ticket images
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only images (JPG, PNG, WEBP) are allowed for tickets'));
    }
  }
});

// ===== AUTH ROUTES =====

const COOKIE_OPTIONS = {
  httpOnly: true,
  maxAge: 8 * 60 * 60 * 1000, // 8 hours
  secure: isProd,
  sameSite: isProd ? 'strict' : 'lax'
};

// Admin login
app.post('/api/auth/admin', authLimiter, (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    const token = generateToken({ type: 'admin', timestamp: Date.now() });
    res.cookie('admin_auth', token, COOKIE_OPTIONS);
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// Judge login
app.post('/api/auth/judge', authLimiter, (req, res) => {
  const { password } = req.body;
  if (password === JUDGE_PASSWORD) {
    const token = generateToken({ type: 'judge', timestamp: Date.now() });
    res.cookie('judge_auth', token, COOKIE_OPTIONS);
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// Team login
app.post('/api/auth/team', authLimiter, async (req, res) => {
  const { teamId, password } = req.body;

  if (!teamId || typeof teamId !== 'number' && typeof teamId !== 'string') {
    return res.status(400).json({ error: 'Invalid team id' });
  }
  
  if (password !== TEAM_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  
  const db = await getDb();
  const team = await db.get('SELECT * FROM teams WHERE id = ?', [teamId]);
  if (!team) {
    return res.status(404).json({ error: 'Team not found' });
  }
  
  const token = generateToken({ type: 'team', teamId: team.id, teamName: team.team_name, timestamp: Date.now() });
  res.cookie('team_auth', token, COOKIE_OPTIONS);
  
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
  res.clearCookie('team_auth');
  res.json({ success: true });
});

// Check auth status
app.get('/api/auth/status', (req, res) => {
  const adminToken = verifyToken(req.cookies.admin_auth);
  const judgeToken = verifyToken(req.cookies.judge_auth);
  const teamToken = verifyToken(req.cookies.team_auth);
  
  res.json({
    isAdmin: !!adminToken && adminToken.type === 'admin',
    isJudge: !!judgeToken && judgeToken.type === 'judge',
    teamId: teamToken?.teamId || null,
    teamName: teamToken?.teamName || null
  });
});

// ===== TEAM ROUTES =====

// Get all teams (public for calculator)
app.get('/api/teams', publicLimiter, async (req, res) => {
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

  if (typeof team_name !== 'string' || typeof school_name !== 'string') {
    return res.status(400).json({ error: 'Invalid team or school name' });
  }

  if (!['Primary', 'Secondary'].includes(category)) {
    return res.status(400).json({ error: 'Invalid category' });
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

  if (!team_name || !school_name || !category) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (typeof team_name !== 'string' || typeof school_name !== 'string') {
    return res.status(400).json({ error: 'Invalid team or school name' });
  }

  if (!['Primary', 'Secondary'].includes(category)) {
    return res.status(400).json({ error: 'Invalid category' });
  }
  
  try {
    const db = await getDb();
    const result = await db.run(
      'UPDATE teams SET team_name = ?, school_name = ?, category = ? WHERE id = ?',
      [team_name, school_name, category, id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

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
    // Cascade delete submissions and scores within a transaction
    await db.run('BEGIN TRANSACTION');
    try {
      await db.run('DELETE FROM submissions WHERE team_id = ?', [id]);
      await db.run('DELETE FROM scores WHERE team_id = ?', [id]);
      const result = await db.run('DELETE FROM teams WHERE id = ?', [id]);
      if (result.changes === 0) {
        await db.run('ROLLBACK');
        return res.status(404).json({ error: 'Team not found' });
      }
      await db.run('COMMIT');
      res.json({ success: true });
    } catch (err) {
      await db.run('ROLLBACK');
      throw err;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== SUBMISSION ROUTES =====

// Get submissions (admin or team)
app.get('/api/submissions', async (req, res) => {
  const { teamId } = req.query;
  
  // Admin sees all, team sees only theirs
  const adminToken = verifyToken(req.cookies.admin_auth);
  const teamToken = verifyToken(req.cookies.team_auth);
  const isAdmin = !!adminToken && adminToken.type === 'admin';
  const isTeam = !!teamToken && teamToken.type === 'team';
  
  if (!isAdmin && (!isTeam || String(teamToken.teamId) !== String(teamId))) {
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
  const teamToken = verifyToken(req.cookies.team_auth);
  if (!teamToken || teamToken.type !== 'team' || teamToken.teamId != team_id) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const type = submission_type || 'file'; // Default to file if not specified

  try {
    const db = await getDb();
    const filePath = `uploads/${req.file.filename}`;
    const result = await db.run(
      'INSERT INTO submissions (team_id, submission_type, file_path, original_filename) VALUES (?, ?, ?, ?)',
      [team_id, type, filePath, original_filename]
    );
    
    res.json({ 
      success: true, 
      submission: { 
        id: result.lastID,
        team_id,
        submission_type: type,
        file_path: filePath,
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
  const teamToken = verifyToken(req.cookies.team_auth);
  if (!teamToken || teamToken.type !== 'team' || teamToken.teamId != team_id) {
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

  const scores = [concept_score, future_score, organization_score, aesthetics_score];
  if (scores.some((s) => typeof s !== 'number' || s < 0)) {
    return res.status(400).json({ error: 'Invalid score values' });
  }

  if (concept_score > 40 || future_score > 30 || organization_score > 20 || aesthetics_score > 10) {
    return res.status(400).json({ error: 'Score values out of range' });
  }

  if (!assessed_by || typeof assessed_by !== 'string') {
    return res.status(400).json({ error: 'Assessed by is required' });
  }
  
  try {
    const db = await getDb();
    const result = await db.run(
      'UPDATE submissions SET concept_score = ?, future_score = ?, organization_score = ?, aesthetics_score = ?, assessed_by = ?, assessed_at = CURRENT_TIMESTAMP WHERE id = ?',
      [concept_score, future_score, organization_score, aesthetics_score, assessed_by, id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== SCORE ROUTES =====

// Calculate score (public - no save)
app.post('/api/scores/calculate', publicLimiter, async (req, res) => {
  const { missionData } = req.body;
  if (!missionData) {
    return res.status(400).json({ error: 'missionData is required' });
  }
  const result = calculateTotalScore(missionData);
  res.json(result);
});

// Save score (judge or admin)
app.post('/api/scores', requireAdminOrJudge, async (req, res) => {
  const { team_id, judge_name, missionData, completion_time_seconds, mechanical_design_score, judge_notes } = req.body;

  if (!team_id || !judge_name || !missionData) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (typeof team_id !== 'number' && typeof team_id !== 'string') {
    return res.status(400).json({ error: 'Invalid team id' });
  }

  if (typeof judge_name !== 'string' || judge_name.trim().length === 0) {
    return res.status(400).json({ error: 'Invalid judge name' });
  }

  if (completion_time_seconds && typeof completion_time_seconds !== 'number') {
    return res.status(400).json({ error: 'Invalid completion time' });
  }

  if (mechanical_design_score && typeof mechanical_design_score !== 'number') {
    return res.status(400).json({ error: 'Invalid mechanical design score' });
  }
  
  // Validate time range (0-300 seconds)
  if (completion_time_seconds !== undefined) {
    if (typeof completion_time_seconds !== 'number' || completion_time_seconds < 0 || completion_time_seconds > 300) {
      return res.status(400).json({ error: 'Completion time must be between 0 and 300 seconds' });
    }
  }
  
  // Validate mech score range (0-100)
  if (mechanical_design_score !== undefined) {
    if (typeof mechanical_design_score !== 'number' || mechanical_design_score < 0 || mechanical_design_score > 100) {
      return res.status(400).json({ error: 'Mechanical design score must be between 0 and 100' });
    }
  }
  
  const result = calculateTotalScore(missionData);
  const totalWithMech = result.total + (mechanical_design_score || 0);
  
  // Max score validation: 155 (missions) + 100 (mech) = 255
  if (totalWithMech > 255) {
    return res.status(400).json({ error: 'Score exceeds maximum possible (255)' });
  }
  
  try {
    const db = await getDb();
    
    // Validate team exists
    const team = await db.get('SELECT id FROM teams WHERE id = ?', [team_id]);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
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
        team_id,
        judge_name,
        completion_time_seconds,
        mechanical_design_score: mechanical_design_score || 0,
        judge_notes
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single score by ID (admin/judge)
app.get('/api/scores/:id', requireAdminOrJudge, async (req, res) => {
  const { id } = req.params;
  
  if (!/^[0-9]+$/.test(id)) {
    return res.status(400).json({ error: 'Invalid score id' });
  }
  
  try {
    const db = await getDb();
    const score = await db.get(`
      SELECT s.*, t.team_name, t.school_name
      FROM scores s
      JOIN teams t ON s.team_id = t.id
      WHERE s.id = ?
    `, [id]);
    
    if (!score) {
      return res.status(404).json({ error: 'Score not found' });
    }
    
    res.json(score);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update score (admin or own judge)
app.put('/api/scores/:id', requireAdminOrJudge, async (req, res) => {
  const { id } = req.params;
  const { team_id, judge_name, missionData, completion_time_seconds, mechanical_design_score, judge_notes } = req.body;
  
  if (!/^[0-9]+$/.test(id)) {
    return res.status(400).json({ error: 'Invalid score id' });
  }
  
  if (!team_id || !judge_name || !missionData) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  if (typeof team_id !== 'number' && typeof team_id !== 'string') {
    return res.status(400).json({ error: 'Invalid team id' });
  }
  
  if (typeof judge_name !== 'string' || judge_name.trim().length === 0) {
    return res.status(400).json({ error: 'Invalid judge name' });
  }
  
  // Validate time range (0-300 seconds)
  if (completion_time_seconds !== undefined) {
    if (typeof completion_time_seconds !== 'number' || completion_time_seconds < 0 || completion_time_seconds > 300) {
      return res.status(400).json({ error: 'Completion time must be between 0 and 300 seconds' });
    }
  }
  
  if (mechanical_design_score !== undefined) {
    if (typeof mechanical_design_score !== 'number' || mechanical_design_score < 0 || mechanical_design_score > 100) {
      return res.status(400).json({ error: 'Mechanical design score must be between 0 and 100' });
    }
  }
  
  try {
    const db = await getDb();
    
    // Check if score exists
    const existingScore = await db.get('SELECT * FROM scores WHERE id = ?', [id]);
    if (!existingScore) {
      return res.status(404).json({ error: 'Score not found' });
    }
    
    // Check if team exists
    const team = await db.get('SELECT id FROM teams WHERE id = ?', [team_id]);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    // Judges can only edit their own scores
    const adminToken = verifyToken(req.cookies.admin_auth);
    const isAdmin = !!adminToken && adminToken.type === 'admin';
    if (!isAdmin && existingScore.judge_name !== judge_name) {
      return res.status(403).json({ error: 'You can only edit your own scores' });
    }
    
    const result = calculateTotalScore(missionData);
    const totalWithMech = result.total + (mechanical_design_score || 0);
    
    // Max score validation: 155 (missions) + 100 (mech) = 255
    if (totalWithMech > 255) {
      return res.status(400).json({ error: 'Score exceeds maximum possible (255)' });
    }
    
    await db.run(
      `UPDATE scores SET 
        team_id = ?, judge_name = ?, mission_data = ?, 
        mission1 = ?, mission2 = ?, mission3 = ?, mission4 = ?, mission5 = ?, mission6 = ?, mission7 = ?, 
        total_score = ?, completion_time_seconds = ?, mechanical_design_score = ?, judge_notes = ?
      WHERE id = ?`,
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
        result.total,
        completion_time_seconds,
        mechanical_design_score || 0,
        judge_notes,
        id
      ]
    );
    
    res.json({ 
      success: true, 
      score: {
        id: parseInt(id),
        ...result,
        team_id,
        judge_name,
        completion_time_seconds,
        mechanical_design_score: mechanical_design_score || 0,
        judge_notes
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get scores for a team (team view)
app.get('/api/scores/team/:teamId', async (req, res) => {
  const { teamId } = req.params;
  if (!/^[0-9]+$/.test(teamId)) {
    return res.status(400).json({ error: 'Invalid team id' });
  }
  
  // Team can only see their own scores
  const teamToken = verifyToken(req.cookies.team_auth);
  const adminToken = verifyToken(req.cookies.admin_auth);
  const isAdmin = !!adminToken && adminToken.type === 'admin';
  const isOwnTeam = !!teamToken && teamToken.type === 'team' && String(teamToken.teamId) === String(teamId);
  
  if (!isOwnTeam && !isAdmin) {
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
    const result = await db.run('DELETE FROM scores WHERE id = ?', [id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Score not found' });
    }
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
  
  // Sanitize filename to prevent path traversal
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '');
  const filePath = path.resolve('backups', sanitizedFilename);
  const backupDir = path.resolve('backups');
  
  // Ensure file path is within backup directory (prevent path traversal)
  if (!filePath.startsWith(backupDir) || !fs.existsSync(filePath)) {
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
    res.json(announcements.map((ann) => ({
      ...ann,
      is_pinned: !!ann.is_pinned,
    })));
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

  if (typeof title !== 'string' || typeof content !== 'string') {
    return res.status(400).json({ error: 'Invalid title or content' });
  }

  if (priority && !['low', 'medium', 'high'].includes(priority)) {
    return res.status(400).json({ error: 'Invalid priority' });
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
        is_active: true,
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

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  if (typeof title !== 'string' || typeof content !== 'string') {
    return res.status(400).json({ error: 'Invalid title or content' });
  }

  if (priority && !['low', 'medium', 'high'].includes(priority)) {
    return res.status(400).json({ error: 'Invalid priority' });
  }

  try {
    const db = await getDb();
    const result = await db.run(`
      UPDATE announcements
      SET title = ?, content = ?, priority = ?, is_pinned = ?, is_active = ?, expires_at = ?
      WHERE id = ?
    `, [title, content, priority, is_pinned ? 1 : 0, is_active ? 1 : 0, expires_at, id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

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
    const result = await db.run('DELETE FROM announcements WHERE id = ?', [id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
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

// ===== TICKET ROUTES =====

// Create ticket (public or team)
app.post('/api/tickets', publicLimiter, uploadTicket.single('file'), async (req, res) => {
  const { name, email, category, urgency, description } = req.body;

  if (!name || !email || !category || !description) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Check for team auth (optional)
  let teamId = null;
  const teamToken = verifyToken(req.cookies.team_auth);
  if (teamToken && teamToken.type === 'team') {
    teamId = teamToken.teamId;
  }

  try {
    const db = await getDb();
    // Path stored in DB should be relative to the static mount point
    // Since express.static serves DATA_DIR/uploads at /uploads, 
    // we need to store 'uploads/tickets/filename' if we want the frontend to use /uploads/tickets/filename
    // But wait, ticketStorage saves to DATA_DIR/uploads/tickets/
    // So the file is physically at DATA_DIR/uploads/tickets/filename
    // Our static middleware serves DATA_DIR/uploads at /uploads
    // So URL will be /uploads/tickets/filename
    const filePath = req.file ? `uploads/tickets/${req.file.filename}` : null;
    
    const result = await db.run(
      'INSERT INTO tickets (team_id, name, email, category, urgency, description, file_path) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [teamId, name, email, category, urgency || 'Medium', description, filePath]
    );

    res.json({ success: true, ticketId: result.lastID });
  } catch (err) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: err.message });
  }
});

// Get all tickets (admin only)
app.get('/api/tickets', requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const tickets = await db.all(`
      SELECT t.*, teams.team_name, teams.school_name 
      FROM tickets t 
      LEFT JOIN teams ON t.team_id = teams.id 
      ORDER BY t.created_at DESC
    `);
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update ticket status (admin only)
app.patch('/api/tickets/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['Open', 'Pending', 'Resolved'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const db = await getDb();
    const result = await db.run('UPDATE tickets SET status = ? WHERE id = ?', [status, id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete ticket (admin only)
app.delete('/api/tickets/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const db = await getDb();
    const ticket = await db.get('SELECT file_path FROM tickets WHERE id = ?', [id]);
    if (ticket && ticket.file_path) {
      const fullPath = path.join(process.cwd(), ticket.file_path);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    }
    await db.run('DELETE FROM tickets WHERE id = ?', [id]);
    res.json({ success: true });
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
  console.log(`✓ Database: SQLite with WAL mode`);
  console.log(`✓ Auto-backup: Every 5 minutes`);
});

export default app;

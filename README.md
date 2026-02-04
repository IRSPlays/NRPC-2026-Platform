# NRPC Competition Platform

<div align="center">

![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat-square&logo=typescript)
![Express](https://img.shields.io/badge/Express-4.18-000000?style=flat-square&logo=express)
![SQLite](https://img.shields.io/badge/SQLite-3.44-003B57?style=flat-square&logo=sqlite)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38BDF8?style=flat-square&logo=tailwindcss)

**A complete competition management system for robotics tournaments**

</div>

> Calculate scores with strict validation • Collect poster submissions • Track live rankings

A full-stack platform for the **National Robotics Programming Competition (NRPC)** De-extinction Challenge. Built for schools to manage team registrations, calculate mission scores with strict validation rules, collect research poster submissions, and track live rankings.

## Quick Stats

| Feature | Details |
|---------|---------|
| **7 Robot Missions** | Up to 155 points |
| **Research Poster** | 100 points (graded) |
| **Leaderboard** | Time-based tiebreaker |
| **Backup** | Auto every 5 minutes |

## Tech Stack

```
Frontend  →  React + TypeScript + Tailwind CSS
Backend   →  Express.js + SQLite
Storage   →  Local filesystem (/uploads)
Auth      →  Cookie-based (password protection)
```

## What It Does

```
NRPC-Platform = Score Calculator + Poster Submission + Admin Panel + Live Leaderboard
```

**For Teams:**
- Calculate mission scores (strict validation enforced)
- Submit research posters (file upload or link)
- View own scores and submission status

**For Judges:**
- Save competition scores to database
- Review and grade poster submissions
- View live leaderboard with rankings

**For Admins:**
- Manage teams (CRUD operations)
- Full access to all data
- Backup/restore system

## Features

### Public
- **Score Calculator**: Real-time calculation of all 7 missions with strict rule validation (max 155 points)
- **Team Login**: Teams can access their dashboard
- **Poster Submission**: Upload files or submit external links (Canva, Google Drive)
- **Dark/Light Mode**: Toggle between themes

### Admin Panel
- **Team Management**: Add/edit/remove teams
- **Submission Review**: Score poster submissions (40/30/20/10 criteria)
- **Score Calculator**: Judges can save scores to database
- **Leaderboard**: Rankings with tiebreaker (time), admin-only access
- **Backup System**: Auto-backup every 5 minutes + manual backup/restore

## Technical Stack

- **Frontend**: Vite + React + TypeScript + Tailwind CSS
- **Backend**: Express.js + SQLite (sqlite3)
- **Database**: SQLite with WAL mode for concurrent access
- **File Storage**: Local filesystem (`/uploads`)
- **Authentication**: Cookie-based with simple password protection

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables (Optional)

Create a `.env` file in the root directory (or use defaults):

```env
ADMIN_PASSWORD=NRPCTeam2026
TEAM_PASSWORD=NRPC2026Teams
JUDGE_PASSWORD=NRPC2026Teams
PORT=3001
```

### 3. Run the Application

Development mode (runs both frontend and backend):

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### 4. Production Build

```bash
npm run build
npm run start
```

## Database

The platform uses SQLite with automatic table creation. The database file (`database.sqlite`) and uploaded files (`uploads/`) are stored locally.

### Auto-Backup
- Automatic backup every 5 minutes to `backups/` folder
- Keeps last 50 backups
- Manual backup/restore available in admin panel

## Authentication

### Default Passwords
- **Admin**: `NRPCTeam2026` - Full access to all features
- **Judge**: `NRPC2026Teams` - Can save scores, view leaderboard
- **Team**: `NRPC2026Teams` - Can submit posters, view own scores

### Access Matrix

| Feature | Public | Team | Judge | Admin |
|---------|--------|------|-------|-------|
| Score Calculator | ✓ | ✓ | ✓ | ✓ |
| Save Scores | - | - | ✓ | ✓ |
| Submit Poster | - | ✓ | ✓ | ✓ |
| View Own Scores | - | ✓ | ✓ | ✓ |
| Leaderboard | - | - | - | ✓ |
| Manage Teams | - | - | - | ✓ |
| Review Submissions | - | - | - | ✓ |
| Backup/Restore | - | - | - | ✓ |

## File Structure

```
nrpc-platform/
├── server/              # Express backend
│   ├── index.js         # Main server file
│   ├── database.js      # SQLite connection
│   └── scoring.js       # Scoring validation engine
├── src/                 # React frontend
│   ├── components/      # React components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom hooks (auth, theme)
│   ├── lib/             # API utilities
│   └── types/           # TypeScript types
├── uploads/             # File uploads
├── backups/             # Database backups
└── database.sqlite      # SQLite database
```

## Scoring Rules

### Mission 1: Clear the way (30 pts)
- 5 rocks × 5 pts = 25 pts
- Bonus 5 pts if all rocks collected
- **Strict**: No bonus if not all rocks collected

### Mission 2: Feeding time! (15 pts)
- 2 meat × 5 pts = 10 pts
- Bonus 5 pts if both meat launched
- **Strict**: No bonus if not both launched

### Mission 3: Move hay bales (30 pts)
- 3 bales × (5 pickup + 5 forest) = 30 pts
- Each bale must be picked up before moved to forest

### Mission 4: Collect bones (20 pts)
- 3 bones × (2 pickup + 3 base) = 15 pts
- Bonus 5 pts if all bones in base
- **Strict**: Bonus only if all in base

### Mission 5: Sanctuary Tour (30 pts) - CRITICAL
- Must visit all 4 locations (river, forest, fossil pit, base)
- **STRICT RULE 1**: Base MUST be last → 0 pts if not
- **STRICT RULE 2**: Researcher toppled → 0 pts
- **STRICT RULE 3**: Any location skipped → 0 pts

### Mission 6: Rescue (15 pts) - CRITICAL
- Nest picked up: 5 pts
- Nest on stump: 10 pts
- **STRICT**: If nest fell OR not on stump → 0 pts

### Mission 7: Power it up (15 pts)
- Plate pressed: 15 pts
- Binary: 0 or 15

**Maximum Score: 155 points**
**Tiebreaker**: Completion time (lower is better)

## Poster Submission

Teams can submit in two ways:
1. **File Upload**: PDF, PPTX, PNG, JPG (max 50MB)
   - Auto-validates filename: `(TeamName)_(School)_poster`
2. **External Link**: Canva, Google Drive, etc.
   - Must be valid HTTP/HTTPS URL

## Assessment Criteria (100 points)

1. **Concept of current technology** (40 points)
2. **Imagining the future** (30 points)
3. **Organization and clarity** (20 points)
4. **Aesthetic design** (10 points)

## Deployment with Playit.gg

To expose your local server to the internet using Playit.gg:

1. Install Playit.gg agent: https://playit.gg/
2. Run the application: `npm run dev`
3. Run Playit.gg agent in another terminal
4. Share the generated URL with participants

## Cloud Backup (Recommended)

Prevent data loss with automated Google Drive backups.

### Setup

```bash
cd google-drive-backup
npm install
node quick-upload.js
```

First run requires OAuth authorization (one-time). Creates `credentials.json` + `token.json`.

### Automated Backups

- **Windows**: Use Task Scheduler to run `quick-upload.js` every 4 hours
- **Manual**: `node quick-upload.js` (latest) or `node quick-upload.js --all` (all backups)

See `google-drive-backup/README.md` for full setup instructions.

## License

MIT License - Free for educational use
import { Team, MissionData, ScoreCalculation, Submission, Score, BackupFile } from '../types';

// Use relative URLs in production (frontend served from same server)
// Use localhost:3001 in development (Vite proxy)
const isDev = import.meta.env.DEV;
const API_URL = isDev ? 'http://localhost:3001' : '';

export function getFileUrl(filePath?: string): string {
  if (!filePath) return '';
  const cleanPath = filePath.replace(/^uploads[\/\\]/i, '').replace(/^[\/\\]+/, '');
  return `${API_URL}/uploads/${cleanPath}`;
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<any> {
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Auth
export const authAPI = {
  adminLogin: (password: string) => fetchWithAuth('/api/auth/admin', {
    method: 'POST',
    body: JSON.stringify({ password }),
  }),
  
  judgeLogin: (password: string) => fetchWithAuth('/api/auth/judge', {
    method: 'POST',
    body: JSON.stringify({ password }),
  }),
  
  teamLogin: (teamId: string | number, password: string) => fetchWithAuth('/api/auth/team', {
    method: 'POST',
    body: JSON.stringify({ teamId, password }),
  }),
  
  logout: () => fetchWithAuth('/api/auth/logout', { method: 'POST' }),
  
  checkStatus: () => fetchWithAuth('/api/auth/status'),
};

// Teams
export const teamsAPI = {
  getAll: (): Promise<Team[]> => fetchWithAuth('/api/teams'),
  
  create: (team: Omit<Team, 'id'>): Promise<{ success: boolean; team: Team }> => fetchWithAuth('/api/teams', {
    method: 'POST',
    body: JSON.stringify(team),
  }),
  
  update: (id: number, team: Omit<Team, 'id'>): Promise<{ success: boolean }> => fetchWithAuth(`/api/teams/${id}`, {
    method: 'PUT',
    body: JSON.stringify(team),
  }),
  
  delete: (id: number): Promise<{ success: boolean }> => fetchWithAuth(`/api/teams/${id}`, {
    method: 'DELETE',
  }),
};

// Scores
export const scoresAPI = {
  calculate: (missionData: MissionData): Promise<ScoreCalculation> => fetchWithAuth('/api/scores/calculate', {
    method: 'POST',
    body: JSON.stringify({ missionData }),
  }),
  
  save: (data: {
    team_id: number;
    judge_name: string;
    missionData: MissionData;
    completion_time_seconds: number;
    judge_notes?: string;
  }): Promise<{ success: boolean; score: Score }> => fetchWithAuth('/api/scores', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  getByTeam: (teamId: number | string): Promise<Score[]> => fetchWithAuth(`/api/scores/team/${teamId}`),
  
  getAll: (): Promise<Score[]> => fetchWithAuth('/api/scores'),
  
  getLeaderboard: (): Promise<Score[]> => fetchWithAuth('/api/scores/leaderboard'),
  
  delete: (id: number): Promise<{ success: boolean }> => fetchWithAuth(`/api/scores/${id}`, {
    method: 'DELETE',
  }),
};

// Submissions
export const submissionsAPI = {
  getByTeam: (teamId: number | string): Promise<Submission[]> => fetchWithAuth(`/api/submissions?teamId=${teamId}`),
  
  getAll: (): Promise<Submission[]> => fetchWithAuth('/api/submissions'),
  
  uploadFile: (teamId: number, file: File, originalFilename: string, submissionType?: string): Promise<{ success: boolean; submission: Submission }> => {
    const formData = new FormData();
    formData.append('team_id', teamId.toString());
    formData.append('file', file);
    formData.append('original_filename', originalFilename);
    if (submissionType) formData.append('submission_type', submissionType);
    
    return fetch(`${API_URL}/api/submissions/file`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    }).then(r => r.json());
  },
  
  submitLink: (teamId: number, externalLink: string, originalFilename: string, submissionType?: string): Promise<{ success: boolean; submission: Submission }> => fetchWithAuth('/api/submissions/link', {
    method: 'POST',
    body: JSON.stringify({ 
      team_id: teamId, 
      external_link: externalLink, 
      original_filename: originalFilename,
      submission_type: submissionType
    }),
  }),
  
  score: (id: number, scores: {
    concept_score: number;
    future_score: number;
    organization_score: number;
    aesthetics_score: number;
    assessed_by: string;
  }): Promise<{ success: boolean }> => fetchWithAuth(`/api/submissions/${id}/score`, {
    method: 'PUT',
    body: JSON.stringify(scores),
  }),
};

// Backup
export const backupAPI = {
  create: (): Promise<{ success: boolean; path: string }> => fetchWithAuth('/api/backup', {
    method: 'POST',
  }),

  list: (): Promise<BackupFile[]> => fetchWithAuth('/api/backup/list'),

  download: (filename: string): Promise<Blob> => {
    return fetch(`${API_URL}/api/backup/download/${filename}`, {
      credentials: 'include',
    }).then(r => r.blob());
  },

  restore: (backupData: any): Promise<{ success: boolean }> => fetchWithAuth('/api/backup/restore', {
    method: 'POST',
    body: JSON.stringify({ backupData }),
  }),
};

// Announcements
export interface Announcement {
  id: number;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  is_pinned: number;
  is_active?: number;
  created_at: string;
  expires_at?: string;
}

export const announcementsAPI = {
  getAll: (): Promise<Announcement[]> => fetchWithAuth('/api/announcements'),

  create: (data: {
    title: string;
    content: string;
    priority?: 'low' | 'medium' | 'high';
    is_pinned?: boolean;
    expires_at?: string;
  }): Promise<{ success: boolean; announcement: Announcement }> => fetchWithAuth('/api/announcements', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  update: (id: number, data: Partial<Announcement>): Promise<{ success: boolean }> => fetchWithAuth(`/api/announcements/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  delete: (id: number): Promise<{ success: boolean }> => fetchWithAuth(`/api/announcements/${id}`, {
    method: 'DELETE',
  }),

  togglePin: (id: number): Promise<{ success: boolean; is_pinned: boolean }> => fetchWithAuth(`/api/announcements/${id}/pin`, {
    method: 'PATCH',
  }),
};
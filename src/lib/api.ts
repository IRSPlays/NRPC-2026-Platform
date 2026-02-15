import { Team, MissionData, ScoreCalculation, Submission, Score, BackupFile, Announcement, Ticket } from '../types';

// Use relative URLs in production (frontend served from same server)
// Use localhost:3001 in development (Vite proxy)
const isDev = import.meta.env.DEV;
const API_URL = isDev ? 'http://localhost:3001' : '';

export function getFileUrl(filePath?: string): string {
  if (!filePath) return '';
  const cleanPath = filePath.replace(/^uploads[\/\\]/i, '').replace(/^[\/\\]+/, '');
  return `${API_URL}/uploads/${cleanPath}`;
}

async function fetchWithAuth<T>(url: string, options: RequestInit = {}): Promise<T> {
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
  adminLogin: (password: string) => fetchWithAuth<{ success: boolean }>('/api/auth/admin', {
    method: 'POST',
    body: JSON.stringify({ password }),
  }),
  
  judgeLogin: (password: string) => fetchWithAuth<{ success: boolean }>('/api/auth/judge', {
    method: 'POST',
    body: JSON.stringify({ password }),
  }),
  
  teamLogin: (teamId: string | number, password: string) => fetchWithAuth<{ success: boolean; team: { id: number; name: string; school: string } }>('/api/auth/team', {
    method: 'POST',
    body: JSON.stringify({ teamId, password }),
  }),
  
  logout: () => fetchWithAuth<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),
  
  checkStatus: () => fetchWithAuth<{ isAdmin: boolean; isJudge: boolean; teamId: number | null; teamName: string | null; requiresPasswordChange?: boolean }>('/api/auth/status'),

  updatePassword: (newPassword: string) => fetchWithAuth<{ success: boolean }>('/api/auth/update-password', {
    method: 'POST',
    body: JSON.stringify({ newPassword }),
  }),
};

// Teams
export const teamsAPI = {
  getAll: (): Promise<Team[]> => fetchWithAuth<Team[]>('/api/teams'),
  
  create: (team: Omit<Team, 'id'>): Promise<{ success: boolean; team: Team }> => fetchWithAuth<{ success: boolean; team: Team }>('/api/teams', {
    method: 'POST',
    body: JSON.stringify(team),
  }),
  
  update: (id: number, team: Omit<Team, 'id'>): Promise<{ success: boolean }> => fetchWithAuth<{ success: boolean }>(`/api/teams/${id}`, {
    method: 'PUT',
    body: JSON.stringify(team),
  }),
  
  delete: (id: number): Promise<{ success: boolean }> => fetchWithAuth<{ success: boolean }>(`/api/teams/${id}`, {
    method: 'DELETE',
  }),

  sendCredentials: (teamId: number): Promise<{ success: boolean }> => fetchWithAuth<{ success: boolean }>('/api/admin/send-credentials', {
    method: 'POST',
    body: JSON.stringify({ teamId }),
  }),

  batchSendCredentials: (limit: number = 50): Promise<{ success: boolean; count: number }> => fetchWithAuth<{ success: boolean; count: number }>('/api/admin/batch-send-credentials', {
    method: 'POST',
    body: JSON.stringify({ limit }),
  }),
};

// Scores
export const scoresAPI = {
  calculate: (missionData: MissionData): Promise<ScoreCalculation> => fetchWithAuth<ScoreCalculation>('/api/scores/calculate', {
    method: 'POST',
    body: JSON.stringify({ missionData }),
  }),
  
  save: (data: {
    team_id: number;
    judge_name: string;
    missionData: MissionData;
    completion_time_seconds: number;
    mechanical_design_score?: number;
    judge_notes?: string;
  }): Promise<{ success: boolean; score: Score }> => fetchWithAuth<{ success: boolean; score: Score }>('/api/scores', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  update: (id: number, data: {
    team_id: number;
    judge_name: string;
    missionData: MissionData;
    completion_time_seconds: number;
    mechanical_design_score?: number;
    judge_notes?: string;
  }): Promise<{ success: boolean; score: Score }> => fetchWithAuth<{ success: boolean; score: Score }>(`/api/scores/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  getById: (id: number): Promise<Score> => fetchWithAuth<Score>(`/api/scores/${id}`),
  
  getByTeam: (teamId: number | string): Promise<Score[]> => fetchWithAuth<Score[]>(`/api/scores/team/${teamId}`),
  
  getAll: (): Promise<Score[]> => fetchWithAuth<Score[]>('/api/scores'),
  
  getLeaderboard: (): Promise<Score[]> => fetchWithAuth<Score[]>('/api/scores/leaderboard'),
  
  delete: (id: number): Promise<{ success: boolean }> => fetchWithAuth<{ success: boolean }>(`/api/scores/${id}`, {
    method: 'DELETE',
  }),
};

// Submissions
export const submissionsAPI = {
  getByTeam: (teamId: number | string): Promise<Submission[]> => fetchWithAuth<Submission[]>(`/api/submissions?teamId=${teamId}`),
  
  getAll: (): Promise<Submission[]> => fetchWithAuth<Submission[]>('/api/submissions'),
  
  uploadFile: async (teamId: number, file: File, originalFilename: string, submissionType?: string): Promise<{ success: boolean; submission: Submission }> => {
    const formData = new FormData();
    formData.append('team_id', teamId.toString());
    formData.append('file', file);
    formData.append('original_filename', originalFilename);
    if (submissionType) formData.append('submission_type', submissionType);
    
    const response = await fetch(`${API_URL}/api/submissions/file`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  },
  
  submitLink: (teamId: number, externalLink: string, originalFilename: string, submissionType?: string): Promise<{ success: boolean; submission: Submission }> => fetchWithAuth<{ success: boolean; submission: Submission }>('/api/submissions/link', {
    method: 'POST',
    body: JSON.stringify({ 
      team_id: teamId, 
      external_link: externalLink, 
      original_filename: originalFilename,
      submission_type: submissionType
    }),
  }),

  submitRobotRun: async (teamId: number, file: File, originalFilename: string, externalLink: string): Promise<{ success: boolean; submission: Submission }> => {
    const formData = new FormData();
    formData.append('team_id', teamId.toString());
    formData.append('file', file);
    formData.append('original_filename', originalFilename);
    formData.append('external_link', externalLink);
    
    const response = await fetch(`${API_URL}/api/submissions/robot`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  },
  
  score: (id: number, scores: {
    concept_score: number;
    future_score: number;
    organization_score: number;
    aesthetics_score: number;
    assessed_by: string;
  }): Promise<{ success: boolean }> => fetchWithAuth<{ success: boolean }>(`/api/submissions/${id}/score`, {
    method: 'PUT',
    body: JSON.stringify(scores),
  }),
};

// Backup
export const backupAPI = {
  create: (): Promise<{ success: boolean; path: string }> => fetchWithAuth<{ success: boolean; path: string }>('/api/backup', {
    method: 'POST',
  }),

  list: (): Promise<BackupFile[]> => fetchWithAuth<BackupFile[]>('/api/backup/list'),

  download: async (filename: string): Promise<Blob> => {
    const response = await fetch(`${API_URL}/api/backup/download/${encodeURIComponent(filename)}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Download failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.blob();
  },

  restore: (data: { backupData?: any; filename?: string }): Promise<{ success: boolean }> => fetchWithAuth<{ success: boolean }>('/api/backup/restore', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// Announcements
export const announcementsAPI = {
  getAll: (): Promise<Announcement[]> => fetchWithAuth<Announcement[]>('/api/announcements'),

  create: (data: {
    title: string;
    content: string;
    priority?: 'low' | 'medium' | 'high';
    is_pinned?: boolean;
    expires_at?: string;
  }): Promise<{ success: boolean; announcement: Announcement }> => fetchWithAuth<{ success: boolean; announcement: Announcement }>('/api/announcements', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  update: (id: number, data: Partial<Announcement>): Promise<{ success: boolean }> => fetchWithAuth<{ success: boolean }>(`/api/announcements/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  delete: (id: number): Promise<{ success: boolean }> => fetchWithAuth<{ success: boolean }>(`/api/announcements/${id}`, {
    method: 'DELETE',
  }),

  togglePin: (id: number): Promise<{ success: boolean; is_pinned: boolean }> => fetchWithAuth<{ success: boolean; is_pinned: boolean }>(`/api/announcements/${id}/pin`, {
    method: 'PATCH',
  }),
};

// Tickets
export const ticketsAPI = {
  create: async (data: {
    name: string;
    email: string;
    category: string;
    urgency: string;
    description: string;
    file?: File;
  }): Promise<{ success: boolean; ticketId: number }> => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('email', data.email);
    formData.append('category', data.category);
    formData.append('urgency', data.urgency);
    formData.append('description', data.description);
    if (data.file) formData.append('file', data.file);
    
    const response = await fetch(`${API_URL}/api/tickets`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Submission failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  },

  getAll: (): Promise<Ticket[]> => fetchWithAuth<Ticket[]>('/api/tickets'),

  getDetails: (id: number): Promise<Ticket> => fetchWithAuth<Ticket>(`/api/tickets/${id}`),

  reply: (id: number, message: string): Promise<{ success: boolean; newStatus: string }> => fetchWithAuth<{ success: boolean; newStatus: string }>(`/api/tickets/${id}/messages`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  }),

  updateStatus: (id: number, status: string): Promise<{ success: boolean }> => fetchWithAuth<{ success: boolean }>(`/api/tickets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),

  delete: (id: number): Promise<{ success: boolean }> => fetchWithAuth<{ success: boolean }>(`/api/tickets/${id}`, {
    method: 'DELETE',
  }),
};

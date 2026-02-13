export interface Team {
  id: number;
  team_name: string;
  school_name: string;
  category: 'Primary' | 'Secondary';
}

export interface MissionData {
  mission1: {
    rock1: boolean;
    rock2: boolean;
    rock3: boolean;
    rock4: boolean;
    rock5: boolean;
    bonus: boolean;
  };
  mission2: {
    meat1: boolean;
    meat2: boolean;
    bonus: boolean;
  };
  mission3: {
    bale1_pickup: boolean;
    bale1_forest: boolean;
    bale2_pickup: boolean;
    bale2_forest: boolean;
    bale3_pickup: boolean;
    bale3_forest: boolean;
  };
  mission4: {
    bone1_pickup: boolean;
    bone1_base: boolean;
    bone2_pickup: boolean;
    bone2_base: boolean;
    bone3_pickup: boolean;
    bone3_base: boolean;
    bonus: boolean;
  };
  mission5: {
    scientists_in_base: number;
    researcher_toppled: boolean;
  };
  mission6: {
    nest_picked_up: boolean;
    nest_on_stump: boolean;
    nest_fell: boolean;
  };
  mission7: {
    plate_pressed: boolean;
  };
}

export interface MissionResult {
  missionId: number;
  score: number;
  max: number;
  details: Array<{ label: string; value: string | number; points: number }>;
  warnings: string[];
}

export interface ScoreCalculation {
  missions: MissionResult[];
  total: number;
  maxTotal: number;
  warnings: string[];
}

export interface Submission {
  id: number;
  team_id: number;
  submission_type: 'file' | 'link' | 'robot_run';
  file_path?: string;
  external_link?: string;
  original_filename: string;
  submitted_at: string;
  concept_score?: number;
  future_score?: number;
  organization_score?: number;
  aesthetics_score?: number;
  assessed_by?: string;
  assessed_at?: string;
  team_name?: string;
  school_name?: string;
}

export interface Score {
  id: number;
  team_id: number;
  judge_name: string;
  mission_data: string;
  mission1: number;
  mission2: number;
  mission3: number;
  mission4: number;
  mission5: number;
  mission6: number;
  mission7: number;
  total_score: number;
  completion_time_seconds: number;
  mechanical_design_score?: number;
  judge_notes?: string;
  created_at: string;
  team_name?: string;
  school_name?: string;
  rank?: number;
}

export interface BackupFile {
  name: string;
  size: number;
  created: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  is_pinned: boolean;
  is_active?: boolean;
  created_at: string;
  expires_at?: string;
}

export interface Ticket {
  id: number;
  name: string;
  email: string;
  category: 'Rule Query' | 'Technical Support' | 'Submission Issue' | 'Other';
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  file_path?: string;
  status: 'Open' | 'Pending' | 'Resolved';
  created_at: string;
}

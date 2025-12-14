export enum UserRole {
  PHYSIO = 'PHYSIO',
  PATIENT = 'PATIENT',
  NONE = 'NONE'
}

export interface Exercise {
  id: string;
  name: string;
  targetReps: number;
  targetRom: number; // Range of motion in degrees
  instructions: string;
  videoUrl?: string; // Placeholder for video
}

export interface DailyLog {
  id: string; // Added ID for editing
  date: string;
  painScore: number; // 1-10
  maxRom: number; // Degrees achieved
  repsCompleted: number;
  notes?: string;
  videoUrl?: string; // Link to session recording
  voiceNoteBase64?: string; // Audio recording data
  voiceAnalysis?: string; // AI transcription/summary
}

export interface WeeklyReport {
  id: string;
  date: string;
  title: string;
  content: string;
  physioName: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  email: string;
  physioName: string;
  injury: string; // Display name of injury
  injuryType: string; // Key for the injury library
  startDate: string;
  status: 'On Track' | 'Behind' | 'Ahead';
  prescribedExercises: Exercise[];
  logs: DailyLog[];
  benchmarkRom: number[]; // Expected ROM per week
  weeklyReports: WeeklyReport[];
}

export interface InjuryProfile {
  id: string;
  name: string;
  description: string;
  typicalRecoveryWeeks: number;
  expectedMilestones: string[];
}

export interface AnalysisResult {
  summary: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  recommendations: string[];
}
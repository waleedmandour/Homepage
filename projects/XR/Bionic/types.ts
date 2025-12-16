export interface ArmState {
  shoulderAngle: number;
  elbowAngle: number;
  wristAngle: number;
  gripStrength: number;
}

export interface SystemMetrics {
  batteryLevel: number;
  torqueOutput: number;
  powerDraw: number;
  emgSignal: number;
}

export enum AppMode {
  SIMULATION = 'SIMULATION',
  AR = 'AR',
  AI_EDIT = 'AI_EDIT'
}

export interface AIResponse {
  imageUrl?: string;
  text?: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct: number;
  category: 'Technical' | 'Language';
}

export interface GameMission {
  description: string;
  target: Partial<ArmState>;
  tolerance: number;
  points: number;
}

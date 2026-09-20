export type Problem = {
  id: string;
  title: string;
  platform: string;
  difficulty: string;
  topic: string;
  pattern: string | null;
  problem_url: string;
  editorial_url: string | null;
  position: number;
};

export type Progress = {
  id: string;
  user_id: string;
  problem_id: string;

  status: "solved" | "unsolved" | "review";

  solved_at: string | null;

  time_spent_minutes: number | null;
  attempts: number;

  hint_used: boolean;
  editorial_used: boolean;
  confidence: number;

  notes: string | null;

  updated_at: string;
};
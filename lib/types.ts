export type Problem = {
  id: string;
  position: number;
  title: string;
  platform: string;
  difficulty: string;
  topic: string;
  pattern: string | null;
  problem_url: string | null;
  leetcode_url: string | null;
  gfg_url: string | null;
  editorial_url: string | null;
  level: number | null;
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

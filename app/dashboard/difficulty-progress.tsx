"use client";

import { useMemo } from "react";
import type { Problem, Progress } from "@/lib/types";

type Props = {
  problems: Problem[];
  progress: Progress[];
};

type DifficultyStats = {
  difficulty: string;
  total: number;
  solved: number;
  remaining: number;
  percentage: number;
};

export function DifficultyProgress({
  problems,
  progress,
}: Props) {
  const difficultyData = useMemo(() => {
    const solvedSet = new Set(
      progress
        .filter(
          (item) => item.status === "solved"
        )
        .map(
          (item) => item.problem_id
        )
    );

    const difficulties = [
      "Easy",
      "Medium",
      "Hard",
    ];

    return difficulties.map(
      (difficulty) => {
        const matchingProblems =
          problems.filter(
            (problem) =>
              problem.difficulty
                ?.toLowerCase() ===
              difficulty.toLowerCase()
          );

        const total =
          matchingProblems.length;

        const solved =
          matchingProblems.filter(
            (problem) =>
              solvedSet.has(
                problem.id
              )
          ).length;

        const percentage =
          total > 0
            ? Math.round(
                (solved / total) *
                  100
              )
            : 0;

        return {
          difficulty,
          total,
          solved,
          remaining:
            total - solved,
          percentage,
        };
      }
    );
  }, [problems, progress]);

  const statusData = useMemo(() => {
    const solved = progress.filter(
      (item) =>
        item.status === "solved"
    ).length;

    const review = progress.filter(
      (item) =>
        item.status === "review"
    ).length;

    const unsolved =
      problems.length -
      solved -
      review;

    return {
      solved,
      review,
      unsolved: Math.max(
        0,
        unsolved
      ),
    };
  }, [problems, progress]);

  return (
    <div
      className="grid grid2"
      style={{
        marginTop: 16,
      }}
    >
      {/* =================================
          DIFFICULTY PROGRESS
      ================================= */}

      <div className="card">
        <h3>
          Difficulty Progress
        </h3>

        <p className="muted">
          Track your progression from
          Easy to Hard.
        </p>

        <div
          style={{
            marginTop: 22,
            display: "flex",
            flexDirection:
              "column",
            gap: 22,
          }}
        >
          {difficultyData.map(
            (item) => (
              <div
                key={
                  item.difficulty
                }
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    marginBottom: 8,
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontWeight: 600,
                      }}
                    >
                      {item.difficulty}
                    </span>

                    <span
                      className="muted"
                      style={{
                        marginLeft: 8,
                        fontSize: 12,
                      }}
                    >
                      {item.solved}/
                      {item.total}
                    </span>
                  </div>

                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    {item.percentage}%
                  </span>
                </div>

                <div
                  className="progress"
                  style={{
                    height: 9,
                  }}
                >
                  <div
                    style={{
                      width: `${item.percentage}%`,
                    }}
                  />
                </div>

                <div
                  className="muted"
                  style={{
                    marginTop: 5,
                    fontSize: 11,
                  }}
                >
                  {item.remaining}{" "}
                  remaining
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* =================================
          STATUS OVERVIEW
      ================================= */}

      <div className="card">
        <h3>
          Problem Status
        </h3>

        <p className="muted">
          Your current problem
          distribution.
        </p>

        <div
          style={{
            marginTop: 24,
            display: "flex",
            flexDirection:
              "column",
            gap: 18,
          }}
        >
          {/* SOLVED */}

          <div>
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                marginBottom: 7,
              }}
            >
              <span>
                ✓ Solved
              </span>

              <strong>
                {
                  statusData.solved
                }
              </strong>
            </div>

            <div
              className="progress"
              style={{
                height: 8,
              }}
            >
              <div
                style={{
                  width: `${
                    problems.length
                      ? (statusData.solved /
                          problems.length) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          {/* REVIEW */}

          <div>
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                marginBottom: 7,
              }}
            >
              <span>
                ↻ Review
              </span>

              <strong>
                {
                  statusData.review
                }
              </strong>
            </div>

            <div
              className="progress"
              style={{
                height: 8,
              }}
            >
              <div
                style={{
                  width: `${
                    problems.length
                      ? (statusData.review /
                          problems.length) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          {/* UNSOLVED */}

          <div>
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                marginBottom: 7,
              }}
            >
              <span>
                ○ Unsolved
              </span>

              <strong>
                {
                  statusData.unsolved
                }
              </strong>
            </div>

            <div
              className="progress"
              style={{
                height: 8,
              }}
            >
              <div
                style={{
                  width: `${
                    problems.length
                      ? (statusData.unsolved /
                          problems.length) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* TOTAL */}

        <div
          style={{
            marginTop: 24,
            paddingTop: 18,
            borderTop:
              "1px solid #27272a",
            display: "flex",
            justifyContent:
              "space-between",
          }}
        >
          <span className="muted">
            Total problems
          </span>

          <strong>
            {problems.length}
          </strong>
        </div>
      </div>
    </div>
  );
}
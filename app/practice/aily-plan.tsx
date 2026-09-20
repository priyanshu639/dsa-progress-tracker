"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { Problem, Progress } from "@/lib/types";

type Props = {
  problems: Problem[];
  progress: Progress[];
  dailyGoal?: number;
};

type PracticeItem = {
  problem: Problem;
  reason: string;
  priority: number;
};

export function DailyPracticePlan({
  problems,
  progress,
  dailyGoal = 5,
}: Props) {
  const plan = useMemo(() => {
    const progressMap = new Map(
      progress.map((item) => [
        item.problem_id,
        item,
      ])
    );

    const solvedIds = new Set(
      progress
        .filter(
          (item) =>
            item.status === "solved"
        )
        .map(
          (item) => item.problem_id
        )
    );

    /*
     * Calculate weak topics.
     */
    const topicMap = new Map<
      string,
      { total: number; solved: number }
    >();

    problems.forEach((problem) => {
      const topic =
        problem.topic || "Other";

      const current =
        topicMap.get(topic) ?? {
          total: 0,
          solved: 0,
        };

      current.total++;

      if (solvedIds.has(problem.id)) {
        current.solved++;
      }

      topicMap.set(topic, current);
    });

    const weakTopics = new Set(
      Array.from(topicMap.entries())
        .map(([topic, data]) => ({
          topic,
          percentage:
            data.total > 0
              ? data.solved /
                data.total
              : 0,
        }))
        .sort(
          (a, b) =>
            a.percentage -
            b.percentage
        )
        .slice(0, 5)
        .map((item) => item.topic)
    );

    const candidates: PracticeItem[] =
      [];

    problems.forEach((problem) => {
      const item =
        progressMap.get(problem.id);

      /*
       * Highest priority:
       * Review problems.
       */
      if (
        item?.status === "review"
      ) {
        candidates.push({
          problem,
          reason: "🔄 Review",
          priority: 100,
        });

        return;
      }

      /*
       * Medium priority:
       * Weak topic.
       */
      if (
        !item &&
        weakTopics.has(
          problem.topic
        )
      ) {
        candidates.push({
          problem,
          reason: "🧠 Weak topic",
          priority:
            problem.difficulty ===
            "Easy"
              ? 80
              : problem.difficulty ===
                "Medium"
              ? 75
              : 70,
        });

        return;
      }

      /*
       * Lower priority:
       * New Easy/Medium problems.
       */
      if (
        !item &&
        (
          problem.difficulty ===
            "Easy" ||
          problem.difficulty ===
            "Medium"
        )
      ) {
        candidates.push({
          problem,
          reason: "🆕 New problem",
          priority:
            problem.difficulty ===
            "Easy"
              ? 60
              : 55,
        });
      }
    });

    /*
     * Sort by priority and then
     * problem position.
     */
    candidates.sort((a, b) => {
      if (
        a.priority !==
        b.priority
      ) {
        return (
          b.priority -
          a.priority
        );
      }

      return (
        a.problem.position -
        b.problem.position
      );
    });

    /*
     * Remove duplicates and select
     * today's goal.
     */
    const selected: PracticeItem[] =
      [];

    const used = new Set<string>();

    for (const item of candidates) {
      if (
        used.has(item.problem.id)
      ) {
        continue;
      }

      used.add(item.problem.id);
      selected.push(item);

      if (
        selected.length >=
        dailyGoal
      ) {
        break;
      }
    }

    return selected;
  }, [
    problems,
    progress,
    dailyGoal,
  ]);

  return (
    <div className="card">
      <div className="row">
        <div>
          <h3>
            🎯 Today's Practice Plan
          </h3>

          <p className="muted">
            {plan.length}/{dailyGoal}{" "}
            problems selected for
            today.
          </p>
        </div>

        <span
          style={{
            fontWeight: 600,
          }}
        >
          {plan.length}/{dailyGoal}
        </span>
      </div>

      {/* PROGRESS */}

      <div
        className="progress"
        style={{
          marginTop: 16,
        }}
      >
        <div
          style={{
            width: `${
              Math.min(
                (plan.length /
                  dailyGoal) *
                  100,
                100
              )
            }%`,
          }}
        />
      </div>

      {/* PLAN */}

      {plan.length === 0 ? (
        <div
          className="empty"
          style={{
            marginTop: 20,
          }}
        >
          🎉 No recommended problems
          right now.
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection:
              "column",
            gap: 10,
            marginTop: 20,
          }}
        >
          {plan.map(
            (
              item,
              index
            ) => (
              <div
                key={
                  item.problem.id
                }
                style={{
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "space-between",
                  gap: 16,
                  padding: 15,
                  border:
                    "1px solid #27272a",
                  borderRadius: 10,
                  background:
                    "#111113",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems:
                      "center",
                    gap: 14,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius:
                        "50%",
                      display: "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      background:
                        "#18181b",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {index + 1}
                  </div>

                  <div
                    style={{
                      minWidth: 0,
                    }}
                  >
                    <Link
                      href={`/problems/${item.problem.id}`}
                      style={{
                        fontWeight: 600,
                        textDecoration:
                          "none",
                      }}
                    >
                      {item.problem.title}
                    </Link>

                    <div
                      style={{
                        display:
                          "flex",
                        flexWrap:
                          "wrap",
                        gap: 8,
                        marginTop: 5,
                        fontSize: 12,
                      }}
                    >
                      <span className="muted">
                        {
                          item
                            .problem
                            .topic
                        }
                      </span>

                      <span className="muted">
                        •
                      </span>

                      <span className="muted">
                        {
                          item
                            .problem
                            .difficulty
                        }
                      </span>

                      <span className="muted">
                        •
                      </span>

                      <span>
                        {item.reason}
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/problems/${item.problem.id}`}
                  className="btn primary"
                >
                  Start →
                </Link>
              </div>
            )
          )}
        </div>
      )}

      <div
        style={{
          marginTop: 16,
        }}
      >
        <Link
          href="/practice"
          className="muted"
        >
          Open full Practice Mode →
        </Link>
      </div>
    </div>
  );
}
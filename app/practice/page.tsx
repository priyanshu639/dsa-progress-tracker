"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { supabase } from "@/lib/supabase";
import type {
  Problem,
  Progress,
} from "@/lib/types";

type Recommendation = {
  problem: Problem;
  progress?: Progress;
  reason: string;
};

export default function PracticePage() {
  const [problems, setProblems] =
    useState<Problem[]>([]);

  const [progress, setProgress] =
    useState<Progress[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [filter, setFilter] =
    useState<
      "all" | "review" | "weak" | "new"
    >("all");

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        location.href = "/login";
        return;
      }

      const [
        problemsResponse,
        progressResponse,
      ] = await Promise.all([
        supabase
          .from("problems")
          .select("*")
          .order("position"),

        supabase
          .from("progress")
          .select("*")
          .eq("user_id", user.id),
      ]);

      setProblems(
        (problemsResponse.data ??
          []) as Problem[]
      );

      setProgress(
        (progressResponse.data ??
          []) as Progress[]
      );

      setLoading(false);
    }

    loadData();
  }, []);

  const progressMap = useMemo(() => {
    return new Map(
      progress.map((item) => [
        item.problem_id,
        item,
      ])
    );
  }, [progress]);

  /*
   * Find topics with the lowest
   * completion percentage.
   */
  const weakTopics = useMemo(() => {
    const solvedSet = new Set(
      progress
        .filter(
          (item) =>
            item.status === "solved"
        )
        .map(
          (item) => item.problem_id
        )
    );

    const topicMap = new Map<
      string,
      {
        total: number;
        solved: number;
      }
    >();

    problems.forEach((problem) => {
      const topic =
        problem.topic || "Other";

      const existing =
        topicMap.get(topic) ?? {
          total: 0,
          solved: 0,
        };

      existing.total++;

      if (
        solvedSet.has(problem.id)
      ) {
        existing.solved++;
      }

      topicMap.set(
        topic,
        existing
      );
    });

    return Array.from(
      topicMap.entries()
    )
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
      .map((item) => item.topic);
  }, [problems, progress]);

  const recommendations =
    useMemo(() => {
      const result: Recommendation[] =
        [];

      /*
       * 1. Review problems first.
       */
      const reviewProblems =
        problems.filter((problem) => {
          const item =
            progressMap.get(
              problem.id
            );

          return (
            item?.status ===
            "review"
          );
        });

      reviewProblems.forEach(
        (problem) => {
          result.push({
            problem,
            progress:
              progressMap.get(
                problem.id
              ),
            reason:
              "🔄 Due for review",
          });
        }
      );

      /*
       * 2. Problems from weak topics.
       */
      const weakTopicProblems =
        problems.filter(
          (problem) => {
            const item =
              progressMap.get(
                problem.id
              );

            return (
              weakTopics.includes(
                problem.topic
              ) &&
              !item
            );
          }
        );

      weakTopicProblems
        .slice(0, 8)
        .forEach((problem) => {
          result.push({
            problem,
            reason:
              "🧠 Weak topic",
          });
        });

      /*
       * 3. New unsolved Easy/Medium
       * problems.
       */
      const newProblems =
        problems.filter(
          (problem) => {
            const item =
              progressMap.get(
                problem.id
              );

            return !item;
          }
        );

      newProblems
        .filter(
          (problem) =>
            problem.difficulty ===
              "Easy" ||
            problem.difficulty ===
              "Medium"
        )
        .slice(0, 12)
        .forEach((problem) => {
          result.push({
            problem,
            reason:
              "🆕 New problem",
          });
        });

      /*
       * Remove duplicate problems.
       */
      const unique = new Map<
        string,
        Recommendation
      >();

      result.forEach((item) => {
        if (
          !unique.has(
            item.problem.id
          )
        ) {
          unique.set(
            item.problem.id,
            item
          );
        }
      });

      return Array.from(
        unique.values()
      );
    }, [
      problems,
      progressMap,
      weakTopics,
    ]);

  const filteredRecommendations =
    useMemo(() => {
      if (filter === "all") {
        return recommendations;
      }

      if (filter === "review") {
        return recommendations.filter(
          (item) =>
            item.progress?.status ===
            "review"
        );
      }

      if (filter === "weak") {
        return recommendations.filter(
          (item) =>
            item.reason ===
            "🧠 Weak topic"
        );
      }

      return recommendations.filter(
        (item) =>
          item.reason ===
          "🆕 New problem"
      );
    }, [
      filter,
      recommendations,
    ]);

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          Loading practice mode…
        </div>
      </div>
    );
  }

  return (
    <div className="container">

      {/* HEADER */}

      <h1 className="title">
        Practice Mode
      </h1>

      <p className="subtitle">
        Practice problems selected
        from your current DSA progress.
      </p>

      {/* SUMMARY */}

      <div className="grid grid4">

        <div className="card">
          <div className="label">
            Review
          </div>

          <div className="stat">
            {
              progress.filter(
                (item) =>
                  item.status ===
                  "review"
              ).length
            }
          </div>

          <div className="label">
            problems
          </div>
        </div>

        <div className="card">
          <div className="label">
            Weak topics
          </div>

          <div className="stat">
            {weakTopics.length}
          </div>

          <div className="label">
            detected
          </div>
        </div>

        <div className="card">
          <div className="label">
            Unsolved
          </div>

          <div className="stat">
            {
              problems.filter(
                (problem) =>
                  !progressMap.has(
                    problem.id
                  )
              ).length
            }
          </div>

          <div className="label">
            problems
          </div>
        </div>

        <div className="card">
          <div className="label">
            Total
          </div>

          <div className="stat">
            {problems.length}
          </div>

          <div className="label">
            problems
          </div>
        </div>

      </div>

      {/* FILTERS */}

      <div
        className="card"
        style={{
          marginTop: 16,
        }}
      >
        <div
          className="wrap"
        >
          <button
            className={
              filter === "all"
                ? "btn primary"
                : "btn"
            }
            onClick={() =>
              setFilter("all")
            }
          >
            All
          </button>

          <button
            className={
              filter === "review"
                ? "btn primary"
                : "btn"
            }
            onClick={() =>
              setFilter("review")
            }
          >
            🔄 Review
          </button>

          <button
            className={
              filter === "weak"
                ? "btn primary"
                : "btn"
            }
            onClick={() =>
              setFilter("weak")
            }
          >
            🧠 Weak Topics
          </button>

          <button
            className={
              filter === "new"
                ? "btn primary"
                : "btn"
            }
            onClick={() =>
              setFilter("new")
            }
          >
            🆕 New Problems
          </button>
        </div>
      </div>

      {/* RECOMMENDATIONS */}

      <div
        className="card"
        style={{
          marginTop: 16,
        }}
      >
        <div className="row">
          <div>
            <h3>
              Recommended Problems
            </h3>

            <p className="muted">
              Problems selected from
              your current progress.
            </p>
          </div>

          <span className="muted">
            {
              filteredRecommendations.length
            }{" "}
            problems
          </span>
        </div>

        {filteredRecommendations.length ===
        0 ? (
          <div
            className="empty"
            style={{
              marginTop: 20,
            }}
          >
            🎉 No problems in this
            category right now.
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
            {filteredRecommendations
              .slice(0, 15)
              .map(
                ({
                  problem,
                  progress:
                    problemProgress,
                  reason,
                }) => (
                  <div
                    key={
                      problem.id
                    }
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "space-between",
                      gap: 16,
                      padding: 16,
                      border:
                        "1px solid #27272a",
                      borderRadius: 10,
                      background:
                        "#111113",
                    }}
                  >
                    <div
                      style={{
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <Link
                        href={`/problems/${problem.id}`}
                        style={{
                          fontWeight: 600,
                          fontSize: 16,
                          textDecoration:
                            "none",
                        }}
                      >
                        {problem.title}
                      </Link>

                      <div
                        style={{
                          display:
                            "flex",
                          flexWrap:
                            "wrap",
                          gap: 8,
                          marginTop: 7,
                        }}
                      >
                        <span className="muted">
                          {problem.topic}
                        </span>

                        <span className="muted">
                          •
                        </span>

                        <span className="muted">
                          {problem.pattern ??
                            "General"}
                        </span>

                        <span className="muted">
                          •
                        </span>

                        <span className="muted">
                          {
                            problem.difficulty
                          }
                        </span>

                        <span className="muted">
                          •
                        </span>

                        <span>
                          {reason}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/problems/${problem.id}`}
                      className="btn primary"
                    >
                      {problemProgress?.status ===
                      "review"
                        ? "Review →"
                        : "Start →"}
                    </Link>
                  </div>
                )
              )}
          </div>
        )}
      </div>

    </div>
  );
}
"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { Problem, Progress } from "@/lib/types";

type Props = {
  problems: Problem[];
  progress: Progress[];
};

type ReviewItem = {
  problem: Problem;
  progress: Progress;
};

export function ReviewQueue({
  problems,
  progress,
}: Props) {
  const reviewItems = useMemo(() => {
    const problemMap = new Map(
      problems.map((problem) => [
        problem.id,
        problem,
      ])
    );

    const items: ReviewItem[] = [];

    progress.forEach((item) => {
      if (item.status !== "review") {
        return;
      }

      const problem = problemMap.get(
        item.problem_id
      );

      if (!problem) {
        return;
      }

      items.push({
        problem,
        progress: item,
      });
    });

    return items.sort((a, b) => {
      const confidenceA =
        a.progress.confidence ?? 0;

      const confidenceB =
        b.progress.confidence ?? 0;

      if (
        confidenceA !== confidenceB
      ) {
        return (
          confidenceA -
          confidenceB
        );
      }

      return (
        (b.progress.attempts ?? 0) -
        (a.progress.attempts ?? 0)
      );
    });
  }, [problems, progress]);

  return (
    <div
      className="card"
      style={{
        marginTop: 16,
      }}
    >
      {/* HEADER */}

      <div className="row">
        <div>
          <h3>
            🔄 Review Queue
          </h3>

          <p className="muted">
            Problems you marked for
            revision.
          </p>
        </div>

        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {reviewItems.length}{" "}
          {reviewItems.length === 1
            ? "problem"
            : "problems"}
        </div>
      </div>

      {/* EMPTY STATE */}

      {reviewItems.length === 0 ? (
        <div
          style={{
            marginTop: 20,
            padding: 24,
            borderRadius: 10,
            border:
              "1px solid #27272a",
            background: "#111113",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 28,
              marginBottom: 8,
            }}
          >
            🎉
          </div>

          <div
            style={{
              fontWeight: 600,
            }}
          >
            No problems to review
          </div>

          <p
            className="muted"
            style={{
              marginTop: 6,
            }}
          >
            Mark difficult problems as
            Review and they will appear
            here.
          </p>

          <Link
            href="/problems"
            className="btn"
            style={{
              display: "inline-block",
              marginTop: 12,
            }}
          >
            Browse Problems
          </Link>
        </div>
      ) : (
        <div
          style={{
            marginTop: 18,
            display: "flex",
            flexDirection:
              "column",
            gap: 10,
          }}
        >
          {reviewItems
            .slice(0, 8)
            .map(
              ({
                problem,
                progress,
              }) => (
                <div
                  key={problem.id}
                  style={{
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "space-between",
                    gap: 16,
                    padding: 14,
                    border:
                      "1px solid #27272a",
                    borderRadius: 10,
                    background:
                      "#111113",
                  }}
                >
                  {/* PROBLEM INFO */}

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
                        textDecoration:
                          "none",
                      }}
                    >
                      {problem.title}
                    </Link>

                    <div
                      style={{
                        display: "flex",
                        flexWrap:
                          "wrap",
                        gap: 8,
                        marginTop: 6,
                      }}
                    >
                      <span className="muted">
                        {problem.topic}
                      </span>

                      <span className="muted">
                        •
                      </span>

                      <span
                        className="muted"
                      >
                        {problem.pattern ??
                          "General"}
                      </span>

                      <span className="muted">
                        •
                      </span>

                      <span
                        className="muted"
                      >
                        {problem.difficulty}
                      </span>
                    </div>
                  </div>

                  {/* PROGRESS INFO */}

                  <div
                    style={{
                      display: "flex",
                      alignItems:
                        "center",
                      gap: 18,
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        textAlign:
                          "right",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          color:
                            "#71717a",
                        }}
                      >
                        Attempts
                      </div>

                      <div
                        style={{
                          fontWeight: 600,
                        }}
                      >
                        {progress.attempts ??
                          0}
                      </div>
                    </div>

                    <div
                      style={{
                        textAlign:
                          "right",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          color:
                            "#71717a",
                        }}
                      >
                        Confidence
                      </div>

                      <div
                        style={{
                          fontWeight: 600,
                        }}
                      >
                        {progress.confidence ??
                          0}
                        /5
                      </div>
                    </div>

                    <Link
                      href={`/problems/${problem.id}`}
                      className="btn"
                    >
                      Review →
                    </Link>
                  </div>
                </div>
              )
            )}
        </div>
      )}

      {/* VIEW ALL */}

      {reviewItems.length > 8 && (
        <div
          style={{
            marginTop: 14,
            textAlign: "center",
          }}
        >
          <Link
            href="/problems"
            className="muted"
          >
            View all review problems →
          </Link>
        </div>
      )}
    </div>
  );
}
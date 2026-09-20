"use client";

import { useMemo } from "react";
import type { Problem, Progress } from "@/lib/types";

type Props = {
  problems: Problem[];
  progress: Progress[];
};

type TopicStats = {
  topic: string;
  total: number;
  solved: number;
  remaining: number;
  percentage: number;
};

export function TopicProgress({
  problems,
  progress,
}: Props) {
  const topicData = useMemo(() => {
    const solvedSet = new Set(
      progress
        .filter(
          (item) => item.status === "solved"
        )
        .map((item) => item.problem_id)
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
        problem.topic?.trim() || "Other";

      const existing =
        topicMap.get(topic) ?? {
          total: 0,
          solved: 0,
        };

      existing.total++;

      if (solvedSet.has(problem.id)) {
        existing.solved++;
      }

      topicMap.set(topic, existing);
    });

    const result: TopicStats[] = Array.from(
      topicMap.entries()
    ).map(([topic, stats]) => {
      const percentage =
        stats.total > 0
          ? Math.round(
              (stats.solved /
                stats.total) *
                100
            )
          : 0;

      return {
        topic,
        total: stats.total,
        solved: stats.solved,
        remaining:
          stats.total - stats.solved,
        percentage,
      };
    });

    return result.sort(
      (a, b) =>
        b.total - a.total
    );
  }, [problems, progress]);

  const weakTopics = useMemo(() => {
    return [...topicData]
      .filter(
        (topic) =>
          topic.remaining > 0
      )
      .sort((a, b) => {
        if (
          a.percentage !==
          b.percentage
        ) {
          return (
            a.percentage -
            b.percentage
          );
        }

        return (
          b.remaining -
          a.remaining
        );
      })
      .slice(0, 5);
  }, [topicData]);

  return (
    <div
      className="grid grid2"
      style={{
        marginTop: 16,
      }}
    >
      {/* =================================
          TOPIC PROGRESS
      ================================= */}

      <div className="card">
        <div className="row">
          <div>
            <h3>
              Topic Progress
            </h3>

            <p className="muted">
              Your progress across DSA
              topics.
            </p>
          </div>
        </div>

        <div
          style={{
            marginTop: 20,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {topicData.length === 0 ? (
            <div className="empty">
              No topic data available.
            </div>
          ) : (
            topicData.map((topic) => (
              <div
                key={topic.topic}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    marginBottom: 7,
                    gap: 12,
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontWeight: 600,
                      }}
                    >
                      {topic.topic}
                    </span>

                    <span
                      className="muted"
                      style={{
                        marginLeft: 8,
                        fontSize: 12,
                      }}
                    >
                      {topic.solved}/
                      {topic.total}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    {topic.percentage}%
                  </span>
                </div>

                <div
                  className="progress"
                  style={{
                    height: 8,
                  }}
                >
                  <div
                    style={{
                      width: `${topic.percentage}%`,
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* =================================
          WEAK TOPICS
      ================================= */}

      <div className="card">
        <div className="row">
          <div>
            <h3>
              🧠 Areas to Work On
            </h3>

            <p className="muted">
              Topics with the most room
              for improvement.
            </p>
          </div>
        </div>

        <div
          style={{
            marginTop: 20,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {weakTopics.length === 0 ? (
            <div className="empty">
              🎉 You've completed all
              available topics!
            </div>
          ) : (
            weakTopics.map(
              (topic, index) => (
                <div
                  key={topic.topic}
                  style={{
                    padding: 14,
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
                      gap: 10,
                    }}
                  >
                    <span
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius:
                          "50%",
                        display: "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        background:
                          "#18181b",
                        fontSize: 12,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {index + 1}
                    </span>

                    <div
                      style={{
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          gap: 10,
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 600,
                          }}
                        >
                          {topic.topic}
                        </span>

                        <span
                          className="muted"
                          style={{
                            fontSize: 12,
                          }}
                        >
                          {topic.percentage}%
                        </span>
                      </div>

                      <div
                        className="muted"
                        style={{
                          marginTop: 4,
                          fontSize: 12,
                        }}
                      >
                        {topic.solved}{" "}
                        solved ·{" "}
                        {topic.remaining}{" "}
                        remaining
                      </div>
                    </div>
                  </div>
                </div>
              )
            )
          )}
        </div>
      </div>
    </div>
  );
}
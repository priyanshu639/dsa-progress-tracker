"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

import { supabase } from "@/lib/supabase";
import type { Problem, Progress } from "@/lib/types";

const iso = (d: Date) =>
  d.toISOString().slice(0, 10);

function days(n: number) {
  return Array.from(
    { length: n },
    (_, i) => {
      const d = new Date();

      d.setDate(
        d.getDate() - (n - 1 - i)
      );

      return d;
    }
  );
}

export default function Analytics() {
  const [problems, setProblems] =
    useState<Problem[]>([]);

  const [progress, setProgress] =
    useState<Progress[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        location.href = "/login";
        return;
      }

      const [p, r] = await Promise.all([
        supabase
          .from("problems")
          .select("*"),

        supabase
          .from("progress")
          .select("*")
          .eq("user_id", user.id),
      ]);

      setProblems(
        (p.data ?? []) as Problem[]
      );

      setProgress(
        (r.data ?? []) as Progress[]
      );

      setLoading(false);
    })();
  }, []);

  /* -----------------------------
     BASIC COUNTS
  ----------------------------- */

  const solved = progress.filter(
    (x) => x.status === "solved"
  );

  const review = progress.filter(
    (x) => x.status === "review"
  );

  const unsolved = problems.length
    ? problems.length - solved.length
    : 0;

  const completion = problems.length
    ? Number(
        (
          (solved.length /
            problems.length) *
          100
        ).toFixed(1)
      )
    : 0;

  /* -----------------------------
     TIME PERIODS
  ----------------------------- */

  const last7 = solved.filter((x) => {
    if (!x.solved_at) return false;

    return (
      Date.now() -
        new Date(x.solved_at).getTime() <=
      7 * 86400000
    );
  }).length;

  const last30 = solved.filter((x) => {
    if (!x.solved_at) return false;

    return (
      Date.now() -
        new Date(x.solved_at).getTime() <=
      30 * 86400000
    );
  }).length;

  /* -----------------------------
     DAILY ACTIVITY
  ----------------------------- */

  const daily = days(30).map((d) => ({
    date: d.toLocaleDateString(
      undefined,
      {
        month: "short",
        day: "numeric",
      }
    ),

    solved: solved.filter(
      (x) =>
        x.solved_at?.slice(0, 10) ===
        iso(d)
    ).length,
  }));

  /* -----------------------------
     DIFFICULTY
  ----------------------------- */

  const difficultyData = [
    "Easy",
    "Medium",
    "Hard",
  ].map((difficulty) => {
    const total = problems.filter(
      (p) =>
        p.difficulty === difficulty
    ).length;

    const solvedCount = solved.filter(
      (s) =>
        problems.find(
          (p) => p.id === s.problem_id
        )?.difficulty === difficulty
    ).length;

    return {
      difficulty,
      solved: solvedCount,
      total,
      completion: total
        ? Number(
            (
              (solvedCount / total) *
              100
            ).toFixed(1)
          )
        : 0,
    };
  });

  /* -----------------------------
     TOPICS
  ----------------------------- */

  const topicData = useMemo(() => {
    const map = new Map<
      string,
      {
        solved: number;
        total: number;
      }
    >();

    problems.forEach((p) => {
      const current =
        map.get(p.topic) ?? {
          solved: 0,
          total: 0,
        };

      current.total++;

      if (
        solved.some(
          (s) => s.problem_id === p.id
        )
      ) {
        current.solved++;
      }

      map.set(p.topic, current);
    });

    return [...map.entries()]
      .map(([topic, value]) => ({
        topic,
        solved: value.solved,
        total: value.total,
        completion: value.total
          ? Number(
              (
                (value.solved /
                  value.total) *
                100
              ).toFixed(1)
            )
          : 0,
      }))
      .sort(
        (a, b) =>
          b.solved - a.solved
      );
  }, [problems, solved]);

  /* -----------------------------
     PATTERNS
  ----------------------------- */

  const patternData = useMemo(() => {
    const map = new Map<
      string,
      {
        solved: number;
        total: number;
      }
    >();

    problems.forEach((p) => {
      if (!p.pattern) return;

      const current =
        map.get(p.pattern) ?? {
          solved: 0,
          total: 0,
        };

      current.total++;

      if (
        solved.some(
          (s) => s.problem_id === p.id
        )
      ) {
        current.solved++;
      }

      map.set(p.pattern, current);
    });

    return [...map.entries()]
      .map(([pattern, value]) => ({
        pattern,
        solved: value.solved,
        total: value.total,
        completion: value.total
          ? Number(
              (
                (value.solved /
                  value.total) *
                100
              ).toFixed(1)
            )
          : 0,
      }))
      .sort(
        (a, b) =>
          b.solved - a.solved
      );
  }, [problems, solved]);

  /* -----------------------------
     LEARNING STATISTICS
  ----------------------------- */

  const totalAttempts = progress.reduce(
    (sum, x) =>
      sum + (x.attempts ?? 0),
    0
  );

  const totalTime = progress.reduce(
    (sum, x) =>
      sum +
      (x.time_spent_minutes ?? 0),
    0
  );

  const averageTime = solved.length
    ? Number(
        (
          totalTime /
          solved.length
        ).toFixed(1)
      )
    : 0;

  const hintsUsed = progress.filter(
    (x) => x.hint_used
  ).length;

  const editorialsUsed =
    progress.filter(
      (x) => x.editorial_used
    ).length;

  const confidenceValues =
    progress
      .map((x) => x.confidence)
      .filter(
        (x) => x > 0
      );

  const averageConfidence =
    confidenceValues.length
      ? Number(
          (
            confidenceValues.reduce(
              (a, b) => a + b,
              0
            ) /
            confidenceValues.length
          ).toFixed(1)
        )
      : 0;

  /* -----------------------------
     LOADING
  ----------------------------- */

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          Loading analytics…
        </div>
      </div>
    );
  }

  /* -----------------------------
     UI
  ----------------------------- */

  return (
    <div className="container">

      <h1 className="title">
        Analytics
      </h1>

      <p className="subtitle">
        Track consistency, identify weak
        areas, and understand your DSA
        progress.
      </p>

      {/* OVERVIEW */}

      <div className="grid grid4">

        <div className="card">
          <div className="label">
            Total Problems
          </div>

          <div className="stat">
            {problems.length}
          </div>
        </div>

        <div className="card">
          <div className="label">
            Solved
          </div>

          <div className="stat">
            {solved.length}
          </div>
        </div>

        <div className="card">
          <div className="label">
            Review
          </div>

          <div className="stat">
            {review.length}
          </div>
        </div>

        <div className="card">
          <div className="label">
            Completion
          </div>

          <div className="stat">
            {completion}%
          </div>
        </div>

      </div>

      {/* ACTIVITY */}

      <div
        className="grid grid2"
        style={{ marginTop: 16 }}
      >

        <div className="card">

          <h3>
            Last 30 Days
          </h3>

          <div
            style={{ height: 320 }}
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart data={daily}>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#27272a"
                />

                <XAxis
                  dataKey="date"
                  stroke="#71717a"
                />

                <YAxis
                  allowDecimals={false}
                  stroke="#71717a"
                />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="solved"
                  stroke="#fff"
                  strokeWidth={2}
                />

              </LineChart>
            </ResponsiveContainer>
          </div>

        </div>

        <div className="card">

          <h3>
            Problems by Difficulty
          </h3>

          <div
            style={{ height: 320 }}
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={difficultyData}
              >

                <XAxis
                  dataKey="difficulty"
                  stroke="#71717a"
                />

                <YAxis
                  allowDecimals={false}
                  stroke="#71717a"
                />

                <Tooltip />

                <Bar
                  dataKey="solved"
                  fill="#fff"
                  radius={[
                    6,
                    6,
                    0,
                    0,
                  ]}
                />

              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>

      </div>

      {/* LEARNING STATISTICS */}

      <div
        className="grid grid4"
        style={{ marginTop: 16 }}
      >

        <div className="card">
          <div className="label">
            Total Attempts
          </div>

          <div className="stat">
            {totalAttempts}
          </div>
        </div>

        <div className="card">
          <div className="label">
            Time Spent
          </div>

          <div className="stat">
            {totalTime}
          </div>

          <div className="label">
            minutes
          </div>
        </div>

        <div className="card">
          <div className="label">
            Avg Time
          </div>

          <div className="stat">
            {averageTime}
          </div>

          <div className="label">
            min / solved problem
          </div>
        </div>

        <div className="card">
          <div className="label">
            Avg Confidence
          </div>

          <div className="stat">
            {averageConfidence}/5
          </div>
        </div>

      </div>

      {/* LEARNING SUPPORT */}

      <div
        className="grid grid2"
        style={{ marginTop: 16 }}
      >

        <div className="card">

          <h3>
            Learning Support
          </h3>

          <p className="muted">
            Hints used:{" "}
            <b>{hintsUsed}</b>
          </p>

          <p className="muted">
            Editorials used:{" "}
            <b>{editorialsUsed}</b>
          </p>

        </div>

        <div className="card">

          <h3>
            Activity
          </h3>

          <p className="muted">
            Last 7 days:{" "}
            <b>{last7}</b> solved
          </p>

          <p className="muted">
            Last 30 days:{" "}
            <b>{last30}</b> solved
          </p>

        </div>

      </div>

      {/* TOPICS */}

      <div
        className="card"
        style={{ marginTop: 16 }}
      >

        <h3>
          Topic Progress
        </h3>

        <div
          style={{ height: 420 }}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <BarChart
              data={topicData.slice(0, 12)}
              layout="vertical"
              margin={{
                left: 30,
                right: 30,
              }}
            >

              <XAxis
                type="number"
                allowDecimals={false}
                stroke="#71717a"
              />

              <YAxis
                type="category"
                dataKey="topic"
                width={130}
                stroke="#71717a"
              />

              <Tooltip />

              <Bar
                dataKey="solved"
                fill="#fff"
                radius={[
                  0,
                  6,
                  6,
                  0,
                ]}
              />

            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* TOPIC TABLE */}

      <div
        className="card"
        style={{ marginTop: 16 }}
      >

        <h3>
          Topic Breakdown
        </h3>

        <table className="table">

          <thead>
            <tr>
              <th>Topic</th>
              <th>Solved</th>
              <th>Total</th>
              <th>Completion</th>
            </tr>
          </thead>

          <tbody>

            {topicData.map((x) => (

              <tr key={x.topic}>

                <td>
                  {x.topic}
                </td>

                <td>
                  {x.solved}
                </td>

                <td>
                  {x.total}
                </td>

                <td>
                  {x.completion}%
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

      {/* PATTERNS */}

      <div
        className="card"
        style={{ marginTop: 16 }}
      >

        <h3>
          Pattern Breakdown
        </h3>

        <table className="table">

          <thead>
            <tr>
              <th>Pattern</th>
              <th>Solved</th>
              <th>Total</th>
              <th>Completion</th>
            </tr>
          </thead>

          <tbody>

            {patternData.map((x) => (

              <tr key={x.pattern}>

                <td>
                  {x.pattern}
                </td>

                <td>
                  {x.solved}
                </td>

                <td>
                  {x.total}
                </td>

                <td>
                  {x.completion}%
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

      {/* WEAK AREAS */}

      <div
        className="card"
        style={{ marginTop: 16 }}
      >

        <h3>
          Areas to Work On
        </h3>

        {topicData.length ? (

          <div>

            {[
              ...topicData,
            ]
              .sort(
                (a, b) =>
                  a.completion -
                  b.completion
              )
              .slice(0, 5)
              .map((x) => (

                <div
                  key={x.topic}
                  className="row"
                  style={{
                    padding:
                      "12px 0",
                    borderBottom:
                      "1px solid #27272a",
                  }}
                >

                  <span>
                    {x.topic}
                  </span>

                  <span>
                    {x.solved}/
                    {x.total}{" "}
                    ({x.completion}%)
                  </span>

                </div>

              ))}

          </div>

        ) : (

          <div className="empty">
            Start solving problems to
            generate analytics.
          </div>

        )}

      </div>

    </div>
  );
}
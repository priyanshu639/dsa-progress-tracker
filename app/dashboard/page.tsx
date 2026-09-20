"use client";
import { DifficultyProgress } from "./difficulty-progress";
import { TopicProgress } from "./topic-progress";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Problem, Progress } from "@/lib/types";
import Link from "next/link";
import { ActivityHeatmap } from "./activity-heatmap";

/* =========================================
   DATE HELPERS
========================================= */

function localDateKey(date = new Date()) {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(
    2,
    "0"
  );

  const day = String(date.getDate()).padStart(
    2,
    "0"
  );

  return `${year}-${month}-${day}`;
}

function addDays(date: Date, amount: number) {
  const result = new Date(date);

  result.setDate(
    result.getDate() + amount
  );

  return result;
}

/* =========================================
   DASHBOARD
========================================= */

export default function Dashboard() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);

  /* =======================================
     LOAD DATA
  ======================================= */

  useEffect(() => {
    (async () => {
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
        (problemsResponse.data ?? []) as Problem[]
      );

      setProgress(
        (progressResponse.data ?? []) as Progress[]
      );

      setLoading(false);
    })();
  }, []);

  /* =======================================
     SOLVED
  ======================================= */

  const solved = progress.filter(
    (item) => item.status === "solved"
  );

  /* =======================================
     TODAY
  ======================================= */

  const todayKey = localDateKey();

  const today = solved.filter(
    (item) =>
      item.solved_at &&
      localDateKey(
        new Date(item.solved_at)
      ) === todayKey
  ).length;

  /* =======================================
     LAST 7 DAYS
  ======================================= */

  const week = solved.filter((item) => {
    if (!item.solved_at) return false;

    const solvedDate = new Date(
      item.solved_at
    );

    const now = new Date();

    const difference =
      now.getTime() -
      solvedDate.getTime();

    return (
      difference <=
      7 * 86400000
    );
  }).length;

  /* =======================================
     THIS MONTH
  ======================================= */

  const now = new Date();

  const month = solved.filter((item) => {
    if (!item.solved_at) return false;

    const date = new Date(
      item.solved_at
    );

    return (
      date.getFullYear() ===
        now.getFullYear() &&
      date.getMonth() ===
        now.getMonth()
    );
  }).length;

  /* =======================================
     COMPLETION
  ======================================= */

  const pct = problems.length
    ? Number(
        (
          (solved.length /
            problems.length) *
          100
        ).toFixed(1)
      )
    : 0;

  /* =======================================
     SOLVED DATE SET
  ======================================= */

  const solvedDateSet = useMemo(() => {
    return new Set(
      solved
        .filter(
          (item) => item.solved_at
        )
        .map((item) =>
          localDateKey(
            new Date(item.solved_at!)
          )
        )
    );
  }, [solved]);

  /* =======================================
     CURRENT STREAK
  ======================================= */

  const currentStreak = useMemo(() => {
    let streak = 0;

    const today = new Date();

    const todaySolved =
      solvedDateSet.has(
        localDateKey(today)
      );

    const yesterday = addDays(
      today,
      -1
    );

    const yesterdaySolved =
      solvedDateSet.has(
        localDateKey(yesterday)
      );

    /*
      If user has not solved anything today,
      we allow the streak to continue from
      yesterday.
    */

    if (
      !todaySolved &&
      !yesterdaySolved
    ) {
      return 0;
    }

    let checkDate = todaySolved
      ? today
      : yesterday;

    while (
      solvedDateSet.has(
        localDateKey(checkDate)
      )
    ) {
      streak++;

      checkDate = addDays(
        checkDate,
        -1
      );
    }

    return streak;
  }, [solvedDateSet]);

  /* =======================================
     BEST STREAK
  ======================================= */

  const bestStreak = useMemo(() => {
    if (solvedDateSet.size === 0) {
      return 0;
    }

    const dates = Array.from(
      solvedDateSet
    )
      .map(
        (date) =>
          new Date(
            `${date}T00:00:00`
          )
      )
      .sort(
        (a, b) =>
          a.getTime() -
          b.getTime()
      );

    let best = 1;
    let current = 1;

    for (
      let i = 1;
      i < dates.length;
      i++
    ) {
      const difference =
        Math.round(
          (dates[i].getTime() -
            dates[i - 1].getTime()) /
            86400000
        );

      if (difference === 1) {
        current++;

        best = Math.max(
          best,
          current
        );
      } else {
        current = 1;
      }
    }

    return best;
  }, [solvedDateSet]);

  /* =======================================
     DAILY GOAL
  ======================================= */

  const dailyGoal = 5;

  const goalProgress = Math.min(
    today,
    dailyGoal
  );

  const goalPercentage = Math.min(
    Math.round(
      (goalProgress /
        dailyGoal) *
        100
    ),
    100
  );

  /* =======================================
     RECENTLY SOLVED
  ======================================= */

  const recent = useMemo(
    () =>
      [...solved]
        .sort(
          (a, b) =>
            new Date(
              b.solved_at ?? 0
            ).getTime() -
            new Date(
              a.solved_at ?? 0
            ).getTime()
        )
        .slice(0, 8)
        .map((item) =>
          problems.find(
            (problem) =>
              problem.id ===
              item.problem_id
          )
        )
        .filter(Boolean) as Problem[],
    [solved, problems]
  );

  /* =======================================
     LOADING
  ======================================= */

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          Loading dashboard…
        </div>
      </div>
    );
  }

  /* =======================================
     UI
  ======================================= */

  return (
    <div className="container">

      {/* HEADER */}

      <h1 className="title">
        Dashboard
      </h1>

      <p className="subtitle">
        Your DSA progress at a glance.
      </p>

      {/* =================================
          MAIN STATS
      ================================= */}

      <div className="grid grid4">

        <div className="card">
          <div className="label">
            Solved
          </div>

          <div className="stat">
            {solved.length}
          </div>

          <div className="label">
            of {problems.length}
          </div>
        </div>

        <div className="card">
          <div className="label">
            Today
          </div>

          <div className="stat">
            {today}
          </div>

          <div className="label">
            problems
          </div>
        </div>

        <div className="card">
          <div className="label">
            Last 7 days
          </div>

          <div className="stat">
            {week}
          </div>

          <div className="label">
            problems
          </div>
        </div>

        <div className="card">
          <div className="label">
            This month
          </div>

          <div className="stat">
            {month}
          </div>

          <div className="label">
            problems
          </div>
        </div>

      </div>

      {/* =================================
          ACTIVITY HEATMAP
      ================================= */}

      <div style={{ marginTop: 16 }}>
        <ActivityHeatmap
          progress={progress}
        />
      </div>
      {/* =================================
    TOPIC PROGRESS
================================= */}

<TopicProgress
  problems={problems}
  progress={progress}
/>

<DifficultyProgress
  problems={problems}
  progress={progress}
/>

      {/* =================================
          STREAK + GOAL
      ================================= */}

      <div
        className="grid grid2"
        style={{
          marginTop: 16,
        }}
      >

        {/* STREAK */}

        <div className="card">

          <div className="row">

            <div>
              <div className="label">
                Current Streak
              </div>

              <div className="stat">
                🔥 {currentStreak}
              </div>

              <div className="label">
                consecutive days
              </div>
            </div>

            <div
              style={{
                textAlign: "right",
              }}
            >
              <div className="label">
                Best Streak
              </div>

              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                }}
              >
                🏆 {bestStreak}
              </div>

              <div className="label">
                days
              </div>
            </div>

          </div>

        </div>

        {/* DAILY GOAL */}

        <div className="card">

          <div className="row">

            <div>
              <h3>
                🎯 Today's Goal
              </h3>

              <p className="muted">
                Solve {dailyGoal} problems
              </p>
            </div>

            <b>
              {goalProgress}/{dailyGoal}
            </b>

          </div>

          <div
            className="progress"
            style={{
              marginTop: 16,
            }}
          >
            <div
              style={{
                width: `${goalPercentage}%`,
              }}
            />
          </div>

          <p
            className="muted"
            style={{
              marginTop: 10,
            }}
          >
            {goalPercentage === 100
              ? "🎉 Daily goal completed!"
              : `${Math.max(
                  0,
                  dailyGoal - today
                )} more to go`}
          </p>

        </div>

      </div>

      {/* =================================
          COMPLETION + QUICK ACTIONS
      ================================= */}

      <div
        className="grid grid2"
        style={{
          marginTop: 16,
        }}
      >

        {/* COMPLETION */}

        <div className="card">

          <div className="row">

            <div>
              <h3>
                Overall completion
              </h3>

              <p className="muted">
                Solved / total
              </p>
            </div>

            <b>
              {pct}%
            </b>

          </div>

          <div
            className="progress"
            style={{
              marginTop: 16,
            }}
          >
            <div
              style={{
                width: `${pct}%`,
              }}
            />
          </div>

        </div>

        {/* QUICK ACTIONS */}

        <div className="card">

          <h3>
            Quick actions
          </h3>

          <div className="wrap">

            <Link
              className="btn primary"
              href="/problems"
            >
              Practice problems
            </Link>

            <Link
              className="btn"
              href="/analytics"
            >
              Open analytics
            </Link>

            <Link
              className="btn"
              href="/import"
            >
              Import sheet
            </Link>

          </div>

        </div>

      </div>

      {/* =================================
          RECENTLY SOLVED
      ================================= */}

      <div
        className="card"
        style={{
          marginTop: 16,
        }}
      >

        <div className="row">

          <h3>
            Recently solved
          </h3>

          <Link
            href="/problems"
            className="muted"
          >
            View all →
          </Link>

        </div>

        {recent.length ? (

          <table className="table">

            <thead>
              <tr>

                <th>
                  Problem
                </th>

                <th>
                  Platform
                </th>

                <th>
                  Difficulty
                </th>

              </tr>
            </thead>

            <tbody>

              {recent.map(
                (problem) => (

                  <tr
                    key={problem.id}
                  >

                    <td>

                      <a
                        href={
                          problem.problem_url ??
                          problem.leetcode_url ??
                          problem.gfg_url ??
                          "#"
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {problem.title} ↗
                      </a>

                    </td>

                    <td>
                      {problem.platform}
                    </td>

                    <td>
                      {problem.difficulty}
                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        ) : (

          <div className="empty">
            Solve your first problem to see
            activity here.
          </div>

        )}

      </div>

    </div>
  );
}
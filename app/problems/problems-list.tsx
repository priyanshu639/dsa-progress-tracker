"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { supabase } from "@/lib/supabase";
import type { Problem, Progress } from "@/lib/types";
import { ProgressModal } from "./progress-modal";

type Props = {
  problems: Problem[];
};

export function ProblemsList({ problems }: Props) {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("All");
  const [topic, setTopic] = useState("All");
  const [pattern, setPattern] = useState("All");
  const [platform, setPlatform] = useState("All");
  const [status, setStatus] = useState("All");

  const [progressMap, setProgressMap] = useState<
    Record<string, Progress>
  >({});

  const [selectedProblem, setSelectedProblem] =
    useState<Problem | null>(null);

  const [isMobile, setIsMobile] = useState(false);

  /* =========================================
     RESPONSIVE
  ========================================= */

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  /* =========================================
     LOAD PROGRESS
  ========================================= */

  useEffect(() => {
    async function loadProgress() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("progress")
        .select("*")
        .eq("user_id", user.id);

      if (error) {
        console.error(
          "Error loading progress:",
          error.message
        );
        return;
      }

      const map: Record<string, Progress> = {};

      (data ?? []).forEach((item) => {
        map[item.problem_id] = item as Progress;
      });

      setProgressMap(map);
    }

    loadProgress();
  }, []);

  /* =========================================
     TOPICS
  ========================================= */

  const topics = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          problems
            .map((p) => p.topic)
            .filter(Boolean)
        )
      ).sort(),
    ],
    [problems]
  );

  /* =========================================
     PATTERNS
  ========================================= */

  const patterns = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          problems
            .map((p) => p.pattern)
            .filter(Boolean)
        )
      ).sort(),
    ],
    [problems]
  );

  /* =========================================
     COUNTS
  ========================================= */

  const solvedCount = useMemo(
    () =>
      problems.filter(
        (problem) =>
          progressMap[problem.id]?.status === "solved"
      ).length,
    [problems, progressMap]
  );

  const reviewCount = useMemo(
    () =>
      problems.filter(
        (problem) =>
          progressMap[problem.id]?.status === "review"
      ).length,
    [problems, progressMap]
  );

  const unsolvedCount = useMemo(
    () =>
      problems.filter(
        (problem) =>
          progressMap[problem.id]?.status === "unsolved"
      ).length,
    [problems, progressMap]
  );

  const trackedCount =
    solvedCount + reviewCount + unsolvedCount;

  const notTrackedCount =
    problems.length - trackedCount;

  /* =========================================
     FILTER
  ========================================= */

  const filteredProblems = useMemo(() => {
    return problems.filter((problem) => {
      const searchText = search.trim().toLowerCase();

      const matchesSearch =
        searchText === "" ||
        problem.title
          .toLowerCase()
          .includes(searchText) ||
        problem.topic
          .toLowerCase()
          .includes(searchText) ||
        (problem.pattern ?? "")
          .toLowerCase()
          .includes(searchText);

      const matchesDifficulty =
        difficulty === "All" ||
        problem.difficulty === difficulty;

      const matchesTopic =
        topic === "All" ||
        problem.topic === topic;

      const matchesPattern =
        pattern === "All" ||
        problem.pattern === pattern;

      const matchesPlatform =
        platform === "All" ||
        problem.platform === platform;

      const itemProgress =
        progressMap[problem.id];

      const matchesStatus =
        status === "All" ||
        (status === "Not Tracked" &&
          !itemProgress) ||
        (status === "Solved" &&
          itemProgress?.status === "solved") ||
        (status === "Review" &&
          itemProgress?.status === "review") ||
        (status === "Unsolved" &&
          itemProgress?.status === "unsolved");

      return (
        matchesSearch &&
        matchesDifficulty &&
        matchesTopic &&
        matchesPattern &&
        matchesPlatform &&
        matchesStatus
      );
    });
  }, [
    problems,
    search,
    difficulty,
    topic,
    pattern,
    platform,
    status,
    progressMap,
  ]);

  /* =========================================
     RESET
  ========================================= */

  function resetFilters() {
    setSearch("");
    setDifficulty("All");
    setTopic("All");
    setPattern("All");
    setPlatform("All");
    setStatus("All");
  }

  /* =========================================
     CHECK ACTIVE FILTERS
  ========================================= */

  const hasActiveFilters =
    search.trim() !== "" ||
    difficulty !== "All" ||
    topic !== "All" ||
    pattern !== "All" ||
    platform !== "All" ||
    status !== "All";

  /* =========================================
     SAVED
  ========================================= */

  function handleSaved(savedProgress: Progress) {
    setProgressMap((current) => ({
      ...current,
      [savedProgress.problem_id]:
        savedProgress,
    }));

    setSelectedProblem(null);
  }

  /* =========================================
     STATUS LABEL
  ========================================= */

  function getStatusLabel(problemId: string) {
    const item = progressMap[problemId];

    if (!item) {
      return "Not tracked";
    }

    if (item.status === "solved") {
      return "✓ Solved";
    }

    if (item.status === "review") {
      return "↻ Review";
    }

    return "○ Unsolved";
  }

  /* =========================================
     STATUS STYLE
  ========================================= */

  function getStatusStyle(problemId: string) {
    const item = progressMap[problemId];

    if (!item) {
      return {
        ...statusBadgeStyle,
        color: "#64748b",
        background: "#f8fafc",
        borderColor: "#e2e8f0",
      };
    }

    if (item.status === "solved") {
      return {
        ...statusBadgeStyle,
        color: "#047857",
        background: "#ecfdf5",
        borderColor: "#a7f3d0",
      };
    }

    if (item.status === "review") {
      return {
        ...statusBadgeStyle,
        color: "#b45309",
        background: "#fffbeb",
        borderColor: "#fde68a",
      };
    }

    return {
      ...statusBadgeStyle,
      color: "#dc2626",
      background: "#fef2f2",
      borderColor: "#fecaca",
    };
  }

  /* =========================================
     DIFFICULTY STYLE
  ========================================= */

  function getDifficultyStyle(
    problemDifficulty: string
  ) {
    if (problemDifficulty === "Easy") {
      return {
        ...badgeStyle,
        color: "#047857",
        background: "#ecfdf5",
        borderColor: "#a7f3d0",
      };
    }

    if (problemDifficulty === "Medium") {
      return {
        ...badgeStyle,
        color: "#b45309",
        background: "#fffbeb",
        borderColor: "#fde68a",
      };
    }

    if (problemDifficulty === "Hard") {
      return {
        ...badgeStyle,
        color: "#dc2626",
        background: "#fef2f2",
        borderColor: "#fecaca",
      };
    }

    return badgeStyle;
  }

  /* =========================================
     UI
  ========================================= */

  return (
    <div>
      {/* =====================================
          PAGE INTRO
      ===================================== */}

      <div style={pageHeaderStyle}>
        <div>
          <p style={eyebrowStyle}>DSA PRACTICE</p>

          <h1 style={pageTitleStyle}>
            Problems
          </h1>

          <p style={pageSubtitleStyle}>
            Practice, track, and review your curated
            DSA problem set.
          </p>
        </div>
      </div>

      {/* =====================================
          SUMMARY
      ===================================== */}

      <div
        style={{
          ...summaryGridStyle,
          gridTemplateColumns: isMobile
            ? "1fr 1fr"
            : "repeat(4, minmax(0, 1fr))",
        }}
      >
        <div style={summaryCardStyle}>
          <div
            style={{
              ...summaryIconStyle,
              background: "#eef2ff",
              color: "#4f46e5",
            }}
          >
            📚
          </div>

          <div>
            <p style={summaryLabelStyle}>
              Total
            </p>

            <p style={summaryValueStyle}>
              {problems.length}
            </p>
          </div>
        </div>

        <div style={summaryCardStyle}>
          <div
            style={{
              ...summaryIconStyle,
              background: "#ecfdf5",
              color: "#059669",
            }}
          >
            ✓
          </div>

          <div>
            <p style={summaryLabelStyle}>
              Solved
            </p>

            <p style={summaryValueStyle}>
              {solvedCount}
            </p>
          </div>
        </div>

        <div style={summaryCardStyle}>
          <div
            style={{
              ...summaryIconStyle,
              background: "#fffbeb",
              color: "#d97706",
            }}
          >
            ↻
          </div>

          <div>
            <p style={summaryLabelStyle}>
              Review
            </p>

            <p style={summaryValueStyle}>
              {reviewCount}
            </p>
          </div>
        </div>

        <div style={summaryCardStyle}>
          <div
            style={{
              ...summaryIconStyle,
              background: "#f8fafc",
              color: "#64748b",
            }}
          >
            ○
          </div>

          <div>
            <p style={summaryLabelStyle}>
              Not Tracked
            </p>

            <p style={summaryValueStyle}>
              {notTrackedCount}
            </p>
          </div>
        </div>
      </div>

      {/* =====================================
          FILTER PANEL
      ===================================== */}

      <div style={filterPanelStyle}>
        <div style={filterHeaderStyle}>
          <div>
            <h2 style={filterTitleStyle}>
              Find Problems
            </h2>

            <p style={filterSubtitleStyle}>
              Search and filter your DSA problems.
            </p>
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              style={resetButtonStyle}
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Search */}
        <div style={searchWrapperStyle}>
          <span style={searchIconStyle}>
            🔍
          </span>

          <input
            type="text"
            placeholder="Search by problem, topic, or pattern..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            style={searchInputStyle}
          />
        </div>

        {/* Filters */}
        <div
          style={{
            ...filterGridStyle,
            gridTemplateColumns: isMobile
              ? "1fr"
              : "repeat(5, minmax(0, 1fr))",
          }}
        >
          <select
            value={difficulty}
            onChange={(e) =>
              setDifficulty(e.target.value)
            }
            style={selectStyle}
          >
            <option value="All">
              All Difficulty
            </option>

            <option value="Easy">
              Easy
            </option>

            <option value="Medium">
              Medium
            </option>

            <option value="Hard">
              Hard
            </option>
          </select>

          <select
            value={topic}
            onChange={(e) =>
              setTopic(e.target.value)
            }
            style={selectStyle}
          >
            {topics.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item === "All"
                  ? "All Topics"
                  : item}
              </option>
            ))}
          </select>

          <select
            value={pattern}
            onChange={(e) =>
              setPattern(e.target.value)
            }
            style={selectStyle}
          >
            {patterns.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item === "All"
                  ? "All Patterns"
                  : item}
              </option>
            ))}
          </select>

          <select
            value={platform}
            onChange={(e) =>
              setPlatform(e.target.value)
            }
            style={selectStyle}
          >
            <option value="All">
              All Platforms
            </option>

            <option value="LeetCode">
              LeetCode
            </option>

            <option value="GFG">
              GFG
            </option>

            <option value="Both">
              Both
            </option>
          </select>

          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value)
            }
            style={selectStyle}
          >
            <option value="All">
              All Status
            </option>

            <option value="Solved">
              ✓ Solved
            </option>

            <option value="Review">
              ↻ Review
            </option>

            <option value="Unsolved">
              ○ Unsolved
            </option>

            <option value="Not Tracked">
              Not Tracked
            </option>
          </select>
        </div>
      </div>

      {/* =====================================
          RESULT BAR
      ===================================== */}

      <div
        style={{
          ...resultBarStyle,
          flexDirection: isMobile
            ? "column"
            : "row",
          alignItems: isMobile
            ? "flex-start"
            : "center",
        }}
      >
        <div>
          <p style={resultTextStyle}>
            Showing{" "}
            <strong>
              {filteredProblems.length}
            </strong>{" "}
            of{" "}
            <strong>
              {problems.length}
            </strong>{" "}
            problems
          </p>

          {hasActiveFilters && (
            <p style={activeFilterTextStyle}>
              Filters are active
            </p>
          )}
        </div>

        {filteredProblems.length > 0 && (
          <span style={resultBadgeStyle}>
            {filteredProblems.length} results
          </span>
        )}
      </div>

      {/* =====================================
          PROBLEMS
      ===================================== */}

      <div>
        {filteredProblems.map((problem) => {
          const itemProgress =
            progressMap[problem.id];

          return (
            <div
              key={problem.id}
              style={{
                ...problemCardStyle,
                padding: isMobile
                  ? 16
                  : 20,
              }}
            >
              {/* Problem Content */}
              <div
                style={{
                  display: "flex",
                  flexDirection: isMobile
                    ? "column"
                    : "row",
                  justifyContent:
                    "space-between",
                  gap: 20,
                }}
              >
                {/* LEFT */}
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {/* Number + Status */}
                  <div
                    style={problemTopRowStyle}
                  >
                    <span
                      style={problemNumberStyle}
                    >
                      #{problem.position}
                    </span>

                    <span
                      style={getStatusStyle(
                        problem.id
                      )}
                    >
                      {getStatusLabel(
                        problem.id
                      )}
                    </span>
                  </div>

                  {/* Title */}
                  <Link
                    href={`/problems/${problem.id}`}
                    style={problemTitleLinkStyle}
                  >
                    <h2
                      style={{
                        ...problemTitleStyle,
                        fontSize: isMobile
                          ? 17
                          : 19,
                      }}
                    >
                      {problem.title}
                    </h2>
                  </Link>

                  {/* Badges */}
                  <div style={badgesContainerStyle}>
                    <span
                      style={getDifficultyStyle(
                        problem.difficulty
                      )}
                    >
                      {problem.difficulty}
                    </span>

                    <span style={badgeStyle}>
                      {problem.topic}
                    </span>

                    {problem.pattern && (
                      <span style={badgeStyle}>
                        {problem.pattern}
                      </span>
                    )}

                    <span style={badgeStyle}>
                      {problem.platform}
                    </span>
                  </div>

                  {/* Progress details */}
                  {itemProgress && (
                    <div
                      style={
                        progressInfoStyle
                      }
                    >
                      <span>
                        Attempts:{" "}
                        <strong>
                          {itemProgress.attempts}
                        </strong>
                      </span>

                      <span style={dotStyle}>
                        •
                      </span>

                      <span>
                        Confidence:{" "}
                        <strong>
                          {itemProgress.confidence}
                          /5
                        </strong>
                      </span>

                      {itemProgress
                        .time_spent_minutes !==
                        null && (
                        <>
                          <span
                            style={dotStyle}
                          >
                            •
                          </span>

                          <span>
                            Time:{" "}
                            <strong>
                              {
                                itemProgress.time_spent_minutes
                              }
                              min
                            </strong>
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* RIGHT */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: isMobile
                      ? "row"
                      : "column",
                    gap: 9,
                    alignItems: isMobile
                      ? "stretch"
                      : "flex-end",
                    flexWrap: "wrap",
                  }}
                >
                  {/* Main Buttons */}
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <Link
                      href={`/problems/${problem.id}`}
                      style={
                        secondaryButtonStyle
                      }
                    >
                      View Details
                    </Link>

                    <button
                      onClick={() =>
                        setSelectedProblem(
                          problem
                        )
                      }
                      style={
                        trackButtonStyle
                      }
                    >
                      {itemProgress
                        ? "Update Progress"
                        : "Track Progress"}
                    </button>
                  </div>

                  {/* External Links */}
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    {problem.leetcode_url && (
                      <a
                        href={
                          problem.leetcode_url
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        style={
                          leetcodeLinkStyle
                        }
                      >
                        LeetCode ↗
                      </a>
                    )}

                    {problem.gfg_url && (
                      <a
                        href={problem.gfg_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={gfgLinkStyle}
                      >
                        GFG ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* =====================================
          EMPTY STATE
      ===================================== */}

      {filteredProblems.length === 0 && (
        <div style={emptyStyle}>
          <div style={emptyIconStyle}>
            🔎
          </div>

          <h2 style={emptyTitleStyle}>
            No problems found
          </h2>

          <p style={emptyTextStyle}>
            Try changing your search or filters.
          </p>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              style={resetButtonLargeStyle}
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* =====================================
          MODAL
      ===================================== */}

      {selectedProblem && (
        <ProgressModal
          problem={selectedProblem}
          progress={
            progressMap[
              selectedProblem.id
            ] ?? null
          }
          onClose={() =>
            setSelectedProblem(null)
          }
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

/* =========================================
   PAGE
========================================= */

const pageHeaderStyle = {
  marginBottom: 24,
};

const eyebrowStyle = {
  margin: "0 0 7px",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "1.2px",
  color: "#64748b",
};

const pageTitleStyle = {
  margin: 0,
  fontSize: 34,
  fontWeight: 800,
  color: "#0f172a",
  letterSpacing: "-0.8px",
};

const pageSubtitleStyle = {
  margin: "8px 0 0",
  color: "#64748b",
  fontSize: 15,
};

/* =========================================
   SUMMARY
========================================= */

const summaryGridStyle = {
  display: "grid",
  gap: 14,
  marginBottom: 24,
};

const summaryCardStyle = {
  display: "flex",
  alignItems: "center",
  gap: 13,
  padding: 18,
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 13,
  boxShadow:
    "0 3px 12px rgba(15, 23, 42, 0.03)",
};

const summaryIconStyle = {
  width: 42,
  height: 42,
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 10,
  fontSize: 18,
  fontWeight: 700,
};

const summaryLabelStyle = {
  margin: 0,
  fontSize: 12,
  color: "#64748b",
  fontWeight: 600,
};

const summaryValueStyle = {
  margin: "3px 0 0",
  fontSize: 24,
  color: "#111827",
  fontWeight: 800,
};

/* =========================================
   FILTER PANEL
========================================= */

const filterPanelStyle = {
  padding: 22,
  marginBottom: 20,
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  boxShadow:
    "0 3px 12px rgba(15, 23, 42, 0.03)",
};

const filterHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 15,
  marginBottom: 16,
};

const filterTitleStyle = {
  margin: 0,
  color: "#111827",
  fontSize: 18,
  fontWeight: 750,
};

const filterSubtitleStyle = {
  margin: "5px 0 0",
  color: "#64748b",
  fontSize: 13,
};

const searchWrapperStyle = {
  position: "relative" as const,
  marginBottom: 13,
};

const searchIconStyle = {
  position: "absolute" as const,
  left: 14,
  top: "50%",
  transform: "translateY(-50%)",
  fontSize: 15,
  pointerEvents: "none" as const,
};

const searchInputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "13px 15px 13px 42px",
  borderRadius: 10,
  border: "1px solid #dbe2ea",
  background: "#f8fafc",
  color: "#111827",
  outline: "none",
  fontSize: 14,
};

const filterGridStyle = {
  display: "grid",
  gap: 10,
};

const selectStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "12px 11px",
  borderRadius: 9,
  border: "1px solid #dbe2ea",
  background: "#f8fafc",
  color: "#334155",
  outline: "none",
  fontSize: 13,
  cursor: "pointer",
};

const resetButtonStyle = {
  padding: "9px 13px",
  borderRadius: 8,
  border: "1px solid #e2e8f0",
  background: "#ffffff",
  color: "#475569",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
  whiteSpace: "nowrap" as const,
};

/* =========================================
   RESULT BAR
========================================= */

const resultBarStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 15,
  marginBottom: 14,
};

const resultTextStyle = {
  margin: 0,
  color: "#64748b",
  fontSize: 13,
};

const activeFilterTextStyle = {
  margin: "4px 0 0",
  color: "#4f46e5",
  fontSize: 12,
  fontWeight: 600,
};

const resultBadgeStyle = {
  padding: "6px 10px",
  borderRadius: 999,
  background: "#f1f5f9",
  border: "1px solid #e2e8f0",
  color: "#475569",
  fontSize: 12,
  fontWeight: 600,
};

/* =========================================
   PROBLEM CARD
========================================= */

const problemCardStyle = {
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  marginBottom: 12,
  background: "#ffffff",
  boxShadow:
    "0 3px 12px rgba(15, 23, 42, 0.035)",
};

const problemTopRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 9,
  flexWrap: "wrap" as const,
  marginBottom: 9,
};

const problemNumberStyle = {
  color: "#94a3b8",
  fontSize: 12,
  fontWeight: 700,
};

const problemTitleLinkStyle = {
  color: "#111827",
  textDecoration: "none",
};

const problemTitleStyle = {
  margin: "0 0 13px",
  color: "#111827",
  lineHeight: 1.35,
  fontWeight: 750,
};

const badgesContainerStyle = {
  display: "flex",
  gap: 7,
  flexWrap: "wrap" as const,
};

const badgeStyle = {
  padding: "5px 9px",
  borderRadius: 6,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  color: "#64748b",
  fontSize: 11,
  fontWeight: 600,
};

const statusBadgeStyle = {
  padding: "5px 9px",
  borderRadius: 999,
  border: "1px solid",
  fontSize: 11,
  fontWeight: 700,
  whiteSpace: "nowrap" as const,
};

const progressInfoStyle = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  flexWrap: "wrap" as const,
  marginTop: 13,
  color: "#64748b",
  fontSize: 11,
};

const dotStyle = {
  color: "#cbd5e1",
};

const secondaryButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "9px 12px",
  borderRadius: 8,
  border: "1px solid #e2e8f0",
  background: "#ffffff",
  color: "#334155",
  textDecoration: "none",
  fontSize: 12,
  fontWeight: 650,
  whiteSpace: "nowrap" as const,
};

const trackButtonStyle = {
  padding: "9px 13px",
  borderRadius: 8,
  border: "1px solid #c7d2fe",
  background: "#eef2ff",
  color: "#4338ca",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 12,
  whiteSpace: "nowrap" as const,
};

const leetcodeLinkStyle = {
  color: "#ea580c",
  textDecoration: "none",
  fontSize: 12,
  fontWeight: 650,
  whiteSpace: "nowrap" as const,
};

const gfgLinkStyle = {
  color: "#15803d",
  textDecoration: "none",
  fontSize: 12,
  fontWeight: 650,
  whiteSpace: "nowrap" as const,
};

/* =========================================
   EMPTY
========================================= */

const emptyStyle = {
  padding: "60px 25px",
  textAlign: "center" as const,
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  background: "#ffffff",
};

const emptyIconStyle = {
  width: 48,
  height: 48,
  margin: "0 auto 14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 12,
  background: "#f1f5f9",
  fontSize: 20,
};

const emptyTitleStyle = {
  margin: 0,
  color: "#111827",
  fontSize: 19,
};

const emptyTextStyle = {
  margin: "7px 0 18px",
  color: "#64748b",
  fontSize: 13,
};

const resetButtonLargeStyle = {
  padding: "10px 15px",
  border: "none",
  borderRadius: 8,
  background: "#111827",
  color: "#ffffff",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 650,
};
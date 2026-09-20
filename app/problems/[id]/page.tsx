"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { supabase } from "@/lib/supabase";
import type { Problem, Progress } from "@/lib/types";
import { ProgressModal } from "../progress-modal";

export default function ProblemDetailPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [problem, setProblem] = useState<Problem | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);

  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const {
        data: problemData,
        error: problemError,
      } = await supabase
        .from("problems")
        .select("*")
        .eq("id", id)
        .single();

      if (problemError) {
        console.error(
          "Problem loading error:",
          problemError.message
        );

        setLoading(false);
        return;
      }

      setProblem(problemData as Problem);

      const {
        data: progressData,
        error: progressError,
      } = await supabase
        .from("progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("problem_id", id)
        .maybeSingle();

      if (progressError) {
        console.error(
          "Progress loading error:",
          progressError.message
        );
      }

      setProgress(
        progressData
          ? (progressData as Progress)
          : null
      );

      setLoading(false);
    }

    if (id) {
      loadData();
    }
  }, [id, router]);

  function handleSaved(updatedProgress: Progress) {
    setProgress(updatedProgress);
    setShowModal(false);
  }

  /* =========================================
     LOADING
  ========================================= */

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <div style={loadingCardStyle}>
            <div style={spinnerStyle} />

            <p style={loadingTextStyle}>
              Loading problem...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* =========================================
     NOT FOUND
  ========================================= */

  if (!problem) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <div style={notFoundCardStyle}>
            <div style={notFoundIconStyle}>
              !
            </div>

            <h1 style={notFoundTitleStyle}>
              Problem not found
            </h1>

            <p style={notFoundTextStyle}>
              This problem does not exist or could
              not be loaded.
            </p>

            <Link
              href="/problems"
              style={primaryButtonStyle}
            >
              ← Back to Problems
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /* =========================================
     STATUS
  ========================================= */

  const status =
    progress?.status ?? "not tracked";

  const statusLabel =
    status === "solved"
      ? "✓ Solved"
      : status === "review"
      ? "↻ Review"
      : status === "unsolved"
      ? "○ Unsolved"
      : "Not Tracked";

  const statusStyle =
    status === "solved"
      ? solvedStatusStyle
      : status === "review"
      ? reviewStatusStyle
      : status === "unsolved"
      ? unsolvedStatusStyle
      : notTrackedStatusStyle;

  /* =========================================
     CONFIDENCE
  ========================================= */

  const confidence = progress?.confidence ?? 0;

  const confidenceStars =
    confidence > 0
      ? "★".repeat(confidence)
      : "—";

  /* =========================================
     RENDER
  ========================================= */

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        {/* =====================================
            BACK
        ===================================== */}

        <div style={backWrapperStyle}>
          <Link
            href="/problems"
            style={backLinkStyle}
          >
            ← Back to Problems
          </Link>
        </div>

        {/* =====================================
            HEADER
        ===================================== */}

        <section style={headerCardStyle}>
          <div style={headerContentStyle}>
            {/* LEFT */}

            <div style={headerLeftStyle}>
              <div style={topMetaStyle}>
                <span style={positionStyle}>
                  Problem #{problem.position}
                </span>

                <span
                  style={{
                    ...badgeBaseStyle,
                    ...difficultyStyle(
                      problem.difficulty
                    ),
                  }}
                >
                  {problem.difficulty}
                </span>

                <span
                  style={{
                    ...badgeBaseStyle,
                    ...statusStyle,
                  }}
                >
                  {statusLabel}
                </span>
              </div>

              <h1 style={titleStyle}>
                {problem.title}
              </h1>

              <div style={metaRowStyle}>
                <span>{problem.topic}</span>

                {problem.pattern && (
                  <>
                    <span style={separatorStyle}>
                      •
                    </span>

                    <span>
                      {problem.pattern}
                    </span>
                  </>
                )}

                {problem.platform && (
                  <>
                    <span style={separatorStyle}>
                      •
                    </span>

                    <span>
                      {problem.platform}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* RIGHT */}

            <div style={externalLinksStyle}>
              {problem.leetcode_url && (
                <a
                  href={problem.leetcode_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={leetcodeButtonStyle}
                >
                  LeetCode ↗
                </a>
              )}

              {problem.gfg_url && (
                <a
                  href={problem.gfg_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={gfgButtonStyle}
                >
                  GFG ↗
                </a>
              )}
            </div>
          </div>
        </section>

        {/* =====================================
            PROGRESS SUMMARY
        ===================================== */}

        <section style={statsGridStyle}>
          {/* STATUS */}

          <div style={statCardStyle}>
            <p style={statLabelStyle}>
              STATUS
            </p>

            <p
              style={{
                ...statMainValueStyle,
                fontSize: 18,
              }}
            >
              {statusLabel}
            </p>
          </div>

          {/* ATTEMPTS */}

          <div style={statCardStyle}>
            <p style={statLabelStyle}>
              ATTEMPTS
            </p>

            <p style={statMainValueStyle}>
              {progress?.attempts ?? 0}
            </p>

            <p style={statSubValueStyle}>
              total attempts
            </p>
          </div>

          {/* TIME */}

          <div style={statCardStyle}>
            <p style={statLabelStyle}>
              TIME SPENT
            </p>

            <p style={statMainValueStyle}>
              {progress?.time_spent_minutes ?? 0}
            </p>

            <p style={statSubValueStyle}>
              minutes
            </p>
          </div>

          {/* CONFIDENCE */}

          <div style={statCardStyle}>
            <p style={statLabelStyle}>
              CONFIDENCE
            </p>

            <p style={confidenceStyle}>
              {confidenceStars}
            </p>

            <p style={statSubValueStyle}>
              {confidence > 0
                ? `${confidence}/5`
                : "Not rated"}
            </p>
          </div>
        </section>

        {/* =====================================
            LEARNING + NOTES
        ===================================== */}

        <section style={twoColumnGridStyle}>
          {/* LEARNING INFORMATION */}

          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>
              Learning Information
            </h2>

            <div style={infoListStyle}>
              <InfoRow
                label="Hint used"
                value={
                  progress?.hint_used
                    ? "Yes"
                    : "No"
                }
              />

              <InfoRow
                label="Editorial used"
                value={
                  progress?.editorial_used
                    ? "Yes"
                    : "No"
                }
              />

              <InfoRow
                label="Last updated"
                value={
                  progress?.updated_at
                    ? new Date(
                        progress.updated_at
                      ).toLocaleString()
                    : "Not tracked"
                }
              />

              <InfoRow
                label="Solved at"
                value={
                  progress?.solved_at
                    ? new Date(
                        progress.solved_at
                      ).toLocaleString()
                    : "Not solved"
                }
                last
              />
            </div>
          </div>

          {/* NOTES */}

          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>
              Notes
            </h2>

            {progress?.notes ? (
              <div style={notesStyle}>
                {progress.notes}
              </div>
            ) : (
              <div style={emptyNotesStyle}>
                <div style={emptyNotesIconStyle}>
                  📝
                </div>

                <p style={emptyNotesTitleStyle}>
                  No notes added yet
                </p>

                <p style={emptyNotesTextStyle}>
                  Add your learning notes while
                  tracking progress.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* =====================================
            PROBLEM INFORMATION
        ===================================== */}

        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>
            Problem Information
          </h2>

          <div style={informationGridStyle}>
            <InfoBox
              label="Topic"
              value={problem.topic}
            />

            <InfoBox
              label="Pattern"
              value={
                problem.pattern || "Not specified"
              }
            />

            <InfoBox
              label="Difficulty"
              value={problem.difficulty}
            />

            <InfoBox
              label="Platform"
              value={problem.platform}
            />

            <InfoBox
              label="Level"
              value={
                problem.level
                  ? String(problem.level)
                  : "Not specified"
              }
            />
          </div>
        </section>

        {/* =====================================
            ACTION
        ===================================== */}

        <section style={actionCardStyle}>
          <div>
            <h2 style={actionTitleStyle}>
              Track your progress
            </h2>

            <p style={actionTextStyle}>
              Update your status, attempts, time,
              confidence and notes.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            style={primaryButtonStyle}
          >
            {progress
              ? "Update Progress"
              : "Track Progress"}
          </button>
        </section>

        {/* =====================================
            MODAL
        ===================================== */}

        {showModal && (
          <ProgressModal
            problem={problem}
            progress={progress}
            onClose={() =>
              setShowModal(false)
            }
            onSaved={handleSaved}
          />
        )}
      </div>
    </main>
  );
}

/* =========================================
   INFO ROW
========================================= */

function InfoRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      style={{
        ...infoRowStyle,
        borderBottom: last
          ? "none"
          : "1px solid #e2e8f0",
      }}
    >
      <span style={infoLabelStyle}>
        {label}
      </span>

      <strong style={infoValueStyle}>
        {value}
      </strong>
    </div>
  );
}

/* =========================================
   INFO BOX
========================================= */

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={infoBoxStyle}>
      <p style={infoBoxLabelStyle}>
        {label}
      </p>

      <p style={infoBoxValueStyle}>
        {value}
      </p>
    </div>
  );
}

/* =========================================
   DIFFICULTY
========================================= */

function difficultyStyle(
  difficulty: string
) {
  if (difficulty === "Easy") {
    return {
      color: "#047857",
      background: "#ecfdf5",
      borderColor: "#a7f3d0",
    };
  }

  if (difficulty === "Medium") {
    return {
      color: "#b45309",
      background: "#fffbeb",
      borderColor: "#fde68a",
    };
  }

  if (difficulty === "Hard") {
    return {
      color: "#dc2626",
      background: "#fef2f2",
      borderColor: "#fecaca",
    };
  }

  return {
    color: "#64748b",
    background: "#f8fafc",
    borderColor: "#e2e8f0",
  };
}

/* =========================================
   PAGE
========================================= */

const pageStyle = {
  minHeight: "calc(100vh - 70px)",
  background: "#f8fafc",
  padding: "36px 24px 70px",
};

const containerStyle = {
  maxWidth: "1100px",
  margin: "0 auto",
};

const backWrapperStyle = {
  marginBottom: 20,
};

const backLinkStyle = {
  color: "#64748b",
  textDecoration: "none",
  fontSize: 14,
  fontWeight: 600,
};

const headerCardStyle = {
  padding: 28,
  marginBottom: 16,
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  boxShadow:
    "0 4px 15px rgba(15, 23, 42, 0.04)",
};

const headerContentStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 24,
  flexWrap: "wrap" as const,
};

const headerLeftStyle = {
  flex: 1,
  minWidth: 0,
};

const topMetaStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap" as const,
  marginBottom: 14,
};

const positionStyle = {
  color: "#94a3b8",
  fontSize: 13,
  fontWeight: 700,
};

const badgeBaseStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid",
  fontSize: 12,
  fontWeight: 700,
};

const titleStyle = {
  margin: 0,
  color: "#0f172a",
  fontSize: 36,
  lineHeight: 1.2,
  fontWeight: 800,
  letterSpacing: "-0.8px",
};

const metaRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap" as const,
  marginTop: 12,
  color: "#64748b",
  fontSize: 14,
};

const separatorStyle = {
  color: "#cbd5e1",
};

const externalLinksStyle = {
  display: "flex",
  gap: 9,
  flexWrap: "wrap" as const,
};

const leetcodeButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 14px",
  borderRadius: 9,
  background: "#fff7ed",
  border: "1px solid #fed7aa",
  color: "#c2410c",
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 700,
};

const gfgButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 14px",
  borderRadius: 9,
  background: "#f0fdf4",
  border: "1px solid #bbf7d0",
  color: "#15803d",
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 700,
};

/* =========================================
   STATS
========================================= */

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(4, minmax(0, 1fr))",
  gap: 14,
  marginBottom: 16,
};

const statCardStyle = {
  padding: 20,
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  boxShadow:
    "0 3px 12px rgba(15, 23, 42, 0.03)",
};

const statLabelStyle = {
  margin: 0,
  color: "#94a3b8",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.7px",
};

const statMainValueStyle = {
  margin: "8px 0 0",
  color: "#111827",
  fontSize: 27,
  fontWeight: 800,
};

const statSubValueStyle = {
  margin: "3px 0 0",
  color: "#64748b",
  fontSize: 12,
};

const confidenceStyle = {
  margin: "8px 0 0",
  color: "#d97706",
  fontSize: 20,
  letterSpacing: 2,
  minHeight: 26,
};

/* =========================================
   STATUS COLORS
========================================= */

const solvedStatusStyle = {
  color: "#047857",
  background: "#ecfdf5",
  borderColor: "#a7f3d0",
};

const reviewStatusStyle = {
  color: "#b45309",
  background: "#fffbeb",
  borderColor: "#fde68a",
};

const unsolvedStatusStyle = {
  color: "#dc2626",
  background: "#fef2f2",
  borderColor: "#fecaca",
};

const notTrackedStatusStyle = {
  color: "#64748b",
  background: "#f8fafc",
  borderColor: "#e2e8f0",
};

/* =========================================
   TWO COLUMN
========================================= */

const twoColumnGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: 16,
  marginBottom: 16,
};

/* =========================================
   CARD
========================================= */

const cardStyle = {
  padding: 24,
  marginBottom: 16,
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  boxShadow:
    "0 3px 12px rgba(15, 23, 42, 0.03)",
};

const sectionTitleStyle = {
  margin: 0,
  color: "#111827",
  fontSize: 18,
  fontWeight: 750,
};

/* =========================================
   INFO LIST
========================================= */

const infoListStyle = {
  marginTop: 16,
};

const infoRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 20,
  padding: "13px 0",
};

const infoLabelStyle = {
  color: "#64748b",
  fontSize: 13,
};

const infoValueStyle = {
  color: "#334155",
  fontSize: 13,
  textAlign: "right" as const,
};

/* =========================================
   NOTES
========================================= */

const notesStyle = {
  marginTop: 16,
  padding: 16,
  borderRadius: 10,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  color: "#334155",
  lineHeight: 1.7,
  fontSize: 14,
  whiteSpace: "pre-wrap" as const,
};

const emptyNotesStyle = {
  marginTop: 16,
  padding: "28px 18px",
  textAlign: "center" as const,
  borderRadius: 10,
  background: "#f8fafc",
  border: "1px dashed #cbd5e1",
};

const emptyNotesIconStyle = {
  fontSize: 24,
  marginBottom: 8,
};

const emptyNotesTitleStyle = {
  margin: 0,
  color: "#475569",
  fontSize: 14,
  fontWeight: 700,
};

const emptyNotesTextStyle = {
  margin: "5px 0 0",
  color: "#94a3b8",
  fontSize: 12,
};

/* =========================================
   INFORMATION
========================================= */

const informationGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(5, minmax(0, 1fr))",
  gap: 10,
  marginTop: 17,
};

const infoBoxStyle = {
  padding: 15,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 10,
};

const infoBoxLabelStyle = {
  margin: 0,
  color: "#94a3b8",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.6px",
  textTransform: "uppercase" as const,
};

const infoBoxValueStyle = {
  margin: "6px 0 0",
  color: "#334155",
  fontSize: 13,
  fontWeight: 700,
  wordBreak: "break-word" as const,
};

/* =========================================
   ACTION
========================================= */

const actionCardStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 18,
  flexWrap: "wrap" as const,
  padding: 24,
  background: "#111827",
  borderRadius: 14,
  color: "#ffffff",
};

const actionTitleStyle = {
  margin: 0,
  fontSize: 18,
  fontWeight: 750,
};

const actionTextStyle = {
  margin: "6px 0 0",
  color: "#cbd5e1",
  fontSize: 13,
};

const primaryButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "11px 17px",
  border: "none",
  borderRadius: 9,
  background: "#111827",
  color: "#ffffff",
  textDecoration: "none",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 700,
};

/* =========================================
   LOADING
========================================= */

const loadingCardStyle = {
  minHeight: 300,
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center",
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
};

const spinnerStyle = {
  width: 34,
  height: 34,
  marginBottom: 14,
  border: "4px solid #e5e7eb",
  borderTop: "4px solid #111827",
  borderRadius: "50%",
};

const loadingTextStyle = {
  margin: 0,
  color: "#64748b",
  fontSize: 14,
};

/* =========================================
   NOT FOUND
========================================= */

const notFoundCardStyle = {
  padding: "55px 25px",
  textAlign: "center" as const,
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
};

const notFoundIconStyle = {
  width: 46,
  height: 46,
  margin: "0 auto 14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "50%",
  background: "#fef2f2",
  color: "#dc2626",
  fontSize: 22,
  fontWeight: 800,
};

const notFoundTitleStyle = {
  margin: 0,
  color: "#111827",
  fontSize: 21,
};

const notFoundTextStyle = {
  margin: "8px 0 20px",
  color: "#64748b",
  fontSize: 14,
};
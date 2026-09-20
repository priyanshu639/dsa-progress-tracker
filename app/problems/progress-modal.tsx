"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Problem, Progress } from "@/lib/types";

type Props = {
  problem: Problem;
  progress: Progress | null;
  onClose: () => void;
  onSaved: (progress: Progress) => void;
};

export function ProgressModal({
  problem,
  progress,
  onClose,
  onSaved,
}: Props) {
  const [status, setStatus] = useState<
    "solved" | "unsolved" | "review"
  >(progress?.status ?? "unsolved");

  const [attempts, setAttempts] = useState(
    progress?.attempts ?? 1
  );

  const [timeSpent, setTimeSpent] = useState(
    progress?.time_spent_minutes ?? 0
  );

  const [hintUsed, setHintUsed] = useState(
    progress?.hint_used ?? false
  );

  const [editorialUsed, setEditorialUsed] = useState(
    progress?.editorial_used ?? false
  );

  const [confidence, setConfidence] = useState(
    progress?.confidence ?? 0
  );

  const [notes, setNotes] = useState(
    progress?.notes ?? ""
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setStatus(progress?.status ?? "unsolved");
    setAttempts(progress?.attempts ?? 1);
    setTimeSpent(progress?.time_spent_minutes ?? 0);
    setHintUsed(progress?.hint_used ?? false);
    setEditorialUsed(progress?.editorial_used ?? false);
    setConfidence(progress?.confidence ?? 0);
    setNotes(progress?.notes ?? "");
  }, [progress]);

  async function saveProgress() {
    setSaving(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const payload = {
      user_id: user.id,
      problem_id: problem.id,
      status,
      solved_at:
        status === "solved"
          ? progress?.solved_at ?? new Date().toISOString()
          : null,
      time_spent_minutes: Math.max(0, timeSpent),
      attempts: Math.max(1, attempts),
      hint_used: hintUsed,
      editorial_used: editorialUsed,
      confidence,
      notes: notes.trim() || null,
    };

    const { data, error } = await supabase
      .from("progress")
      .upsert(payload, {
        onConflict: "user_id,problem_id",
      })
      .select()
      .single();

    setSaving(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    onSaved(data as Progress);
  }

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div>
            <p style={numberStyle}>
              Problem #{problem.position}
            </p>

            <h2 style={titleStyle}>
              {problem.title}
            </h2>

            <div style={badgesStyle}>
              <span style={badgeStyle}>
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
            </div>
          </div>

          <button
            onClick={onClose}
            style={closeButtonStyle}
          >
            ×
          </button>
        </div>

        {/* Status */}
        <div style={sectionStyle}>
          <label style={labelStyle}>
            Status
          </label>

          <div style={statusGrid}>
            <button
              onClick={() => setStatus("solved")}
              style={statusButton(
                status === "solved"
              )}
            >
              ✓ Solved
            </button>

            <button
              onClick={() => setStatus("review")}
              style={statusButton(
                status === "review"
              )}
            >
              ↻ Review
            </button>

            <button
              onClick={() => setStatus("unsolved")}
              style={statusButton(
                status === "unsolved"
              )}
            >
              ○ Unsolved
            </button>
          </div>
        </div>

        {/* Attempts + Time */}
        <div style={twoColumnStyle}>
          <div>
            <label style={labelStyle}>
              Attempts
            </label>

            <input
              type="number"
              min="1"
              value={attempts}
              onChange={(e) =>
                setAttempts(
                  Math.max(
                    1,
                    Number(e.target.value)
                  )
                )
              }
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>
              Time spent (minutes)
            </label>

            <input
              type="number"
              min="0"
              value={timeSpent}
              onChange={(e) =>
                setTimeSpent(
                  Math.max(
                    0,
                    Number(e.target.value)
                  )
                )
              }
              style={inputStyle}
            />
          </div>
        </div>

        {/* Learning information */}
        <div style={sectionStyle}>
          <label style={labelStyle}>
            Learning information
          </label>

          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={hintUsed}
              onChange={(e) =>
                setHintUsed(e.target.checked)
              }
            />
            I used a hint
          </label>

          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={editorialUsed}
              onChange={(e) =>
                setEditorialUsed(e.target.checked)
              }
            />
            I read the editorial
          </label>
        </div>

        {/* Confidence */}
        <div style={sectionStyle}>
          <label style={labelStyle}>
            Confidence
          </label>

          <div style={confidenceRow}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() =>
                  setConfidence(value)
                }
                style={{
                  ...confidenceButton,
                  opacity:
                    value <= confidence
                      ? 1
                      : 0.35,
                }}
              >
                ★
              </button>
            ))}
          </div>

          <p style={helperText}>
            {confidence === 0
              ? "Not rated"
              : `${confidence}/5 confidence`}
          </p>
        </div>

        {/* Notes */}
        <div style={sectionStyle}>
          <label style={labelStyle}>
            Notes
          </label>

          <textarea
            value={notes}
            onChange={(e) =>
              setNotes(e.target.value)
            }
            placeholder="What did you learn? What confused you? What should you revise?"
            rows={4}
            style={textareaStyle}
          />
        </div>

        {message && (
          <div style={errorStyle}>
            {message}
          </div>
        )}

        {/* Footer */}
        <div style={footerStyle}>
          <button
            onClick={onClose}
            style={secondaryButtonStyle}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            onClick={saveProgress}
            style={primaryButtonStyle}
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : "Save Progress"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Styles ---------- */

const overlayStyle = {
  position: "fixed" as const,
  inset: 0,
  background: "rgba(0, 0, 0, 0.75)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  padding: "20px",
};

const modalStyle = {
  width: "100%",
  maxWidth: "650px",
  maxHeight: "90vh",
  overflowY: "auto" as const,
  background: "#111113",
  border: "1px solid #27272a",
  borderRadius: "16px",
  padding: "28px",
  color: "white",
  boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "20px",
  marginBottom: "24px",
};

const numberStyle = {
  color: "#71717a",
  fontSize: "13px",
  marginBottom: "5px",
};

const titleStyle = {
  fontSize: "25px",
  margin: "0 0 12px",
};

const badgesStyle = {
  display: "flex",
  gap: "7px",
  flexWrap: "wrap" as const,
};

const badgeStyle = {
  padding: "5px 9px",
  borderRadius: "6px",
  background: "#18181b",
  border: "1px solid #27272a",
  color: "#a1a1aa",
  fontSize: "12px",
};

const closeButtonStyle = {
  border: "none",
  background: "transparent",
  color: "#a1a1aa",
  fontSize: "30px",
  cursor: "pointer",
  height: "35px",
};

const sectionStyle = {
  marginTop: "20px",
};

const labelStyle = {
  display: "block",
  fontSize: "14px",
  fontWeight: 600,
  marginBottom: "9px",
};

const statusGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(3, 1fr)",
  gap: "8px",
};

function statusButton(active: boolean) {
  return {
    padding: "11px",
    borderRadius: "9px",
    border: active
      ? "1px solid #60a5fa"
      : "1px solid #27272a",
    background: active
      ? "#172554"
      : "#18181b",
    color: "white",
    cursor: "pointer",
    fontWeight: 600,
  };
}

const twoColumnStyle = {
  display: "grid",
  gridTemplateColumns:
    "1fr 1fr",
  gap: "12px",
  marginTop: "20px",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "12px",
  borderRadius: "9px",
  border: "1px solid #27272a",
  background: "#18181b",
  color: "white",
  outline: "none",
};

const checkboxLabelStyle = {
  display: "flex",
  alignItems: "center",
  gap: "9px",
  color: "#d4d4d8",
  marginBottom: "10px",
  fontSize: "14px",
};

const confidenceRow = {
  display: "flex",
  gap: "8px",
};

const confidenceButton = {
  border: "none",
  background: "transparent",
  color: "#facc15",
  fontSize: "27px",
  cursor: "pointer",
  padding: "0",
};

const helperText = {
  color: "#71717a",
  fontSize: "12px",
  marginTop: "5px",
};

const textareaStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "12px",
  borderRadius: "9px",
  border: "1px solid #27272a",
  background: "#18181b",
  color: "white",
  outline: "none",
  resize: "vertical" as const,
  fontFamily: "inherit",
};

const errorStyle = {
  marginTop: "15px",
  padding: "10px",
  borderRadius: "8px",
  background: "#450a0a",
  border: "1px solid #7f1d1d",
  color: "#fca5a5",
  fontSize: "13px",
};

const footerStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
  marginTop: "25px",
};

const secondaryButtonStyle = {
  padding: "11px 18px",
  borderRadius: "9px",
  border: "1px solid #27272a",
  background: "#18181b",
  color: "white",
  cursor: "pointer",
};

const primaryButtonStyle = {
  padding: "11px 20px",
  borderRadius: "9px",
  border: "none",
  background: "#2563eb",
  color: "white",
  cursor: "pointer",
  fontWeight: 600,
};
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type ProgressRow = {
  status: "solved" | "unsolved" | "review";
};

export default function ProfilePage() {
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [createdAt, setCreatedAt] = useState("");

  const [totalProblems, setTotalProblems] = useState(0);
  const [solvedProblems, setSolvedProblems] = useState(0);
  const [reviewProblems, setReviewProblems] = useState(0);
  const [unsolvedProblems, setUnsolvedProblems] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("Unable to load your profile.");
      setLoading(false);
      return;
    }

    setEmail(user.email ?? "");
    setUserId(user.id);
    setCreatedAt(user.created_at);

    const [problemsResult, progressResult] = await Promise.all([
      supabase
        .from("problems")
        .select("id", { count: "exact", head: true }),

      supabase
        .from("progress")
        .select("status")
        .eq("user_id", user.id),
    ]);

    if (problemsResult.error) {
      console.error("Problems error:", problemsResult.error);
      setError("Unable to load problem statistics.");
      setLoading(false);
      return;
    }

    if (progressResult.error) {
      console.error("Progress error:", progressResult.error);
      setError("Unable to load progress statistics.");
      setLoading(false);
      return;
    }

    const progress = (progressResult.data ?? []) as ProgressRow[];

    const solved = progress.filter(
      (item) => item.status === "solved"
    ).length;

    const review = progress.filter(
      (item) => item.status === "review"
    ).length;

    const unsolved = progress.filter(
      (item) => item.status === "unsolved"
    ).length;

    setTotalProblems(problemsResult.count ?? 0);
    setSolvedProblems(solved);
    setReviewProblems(review);
    setUnsolvedProblems(unsolved);

    setLoading(false);
  }

  const completion =
    totalProblems > 0
      ? ((solvedProblems / totalProblems) * 100).toFixed(1)
      : "0.0";

  const joinedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "—";

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <div style={styles.loadingCard}>
            <div style={styles.loadingSpinner}></div>
            <p style={styles.loadingText}>Loading profile...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <div style={styles.errorCard}>
            <div style={styles.errorIcon}>!</div>
            <h2 style={styles.errorTitle}>Something went wrong</h2>
            <p style={styles.errorText}>{error}</p>

            <button
              onClick={loadProfile}
              style={styles.retryButton}
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        {/* Page Header */}
        <div style={styles.pageHeader}>
          <div>
            <p style={styles.eyebrow}>ACCOUNT</p>
            <h1 style={styles.title}>Profile</h1>
            <p style={styles.subtitle}>
              Your account information and DSA progress overview.
            </p>
          </div>
        </div>

        {/* Profile Card */}
        <section style={styles.profileCard}>
          <div style={styles.avatar}>
            {email.charAt(0).toUpperCase() || "U"}
          </div>

          <div style={styles.profileInfo}>
            <h2 style={styles.profileEmail}>
              {email || "User"}
            </h2>

            <p style={styles.memberText}>
              Member since {joinedDate}
            </p>
          </div>
        </section>

        {/* Account Information */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Account Information</h2>

          <div style={styles.infoGrid}>
            <div style={styles.infoCard}>
              <span style={styles.infoLabel}>EMAIL</span>
              <span style={styles.infoValue}>
                {email || "—"}
              </span>
            </div>

            <div style={styles.infoCard}>
              <span style={styles.infoLabel}>MEMBER SINCE</span>
              <span style={styles.infoValue}>{joinedDate}</span>
            </div>

            <div style={styles.infoCard}>
              <span style={styles.infoLabel}>ACCOUNT ID</span>
              <span style={styles.userId}>
                {userId}
              </span>
            </div>
          </div>
        </section>

        {/* Progress Overview */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Progress Overview</h2>

          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div
                style={{
                  ...styles.statIcon,
                  background: "#eef2ff",
                  color: "#4f46e5",
                }}
              >
                📚
              </div>

              <div>
                <p style={styles.statLabel}>Total Problems</p>
                <p style={styles.statValue}>{totalProblems}</p>
              </div>
            </div>

            <div style={styles.statCard}>
              <div
                style={{
                  ...styles.statIcon,
                  background: "#ecfdf5",
                  color: "#059669",
                }}
              >
                ✓
              </div>

              <div>
                <p style={styles.statLabel}>Solved</p>
                <p style={styles.statValue}>{solvedProblems}</p>
              </div>
            </div>

            <div style={styles.statCard}>
              <div
                style={{
                  ...styles.statIcon,
                  background: "#fffbeb",
                  color: "#d97706",
                }}
              >
                ↻
              </div>

              <div>
                <p style={styles.statLabel}>Review</p>
                <p style={styles.statValue}>{reviewProblems}</p>
              </div>
            </div>

            <div style={styles.statCard}>
              <div
                style={{
                  ...styles.statIcon,
                  background: "#fef2f2",
                  color: "#dc2626",
                }}
              >
                ○
              </div>

              <div>
                <p style={styles.statLabel}>Unsolved</p>
                <p style={styles.statValue}>{unsolvedProblems}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Completion */}
        <section style={styles.completionCard}>
          <div style={styles.completionHeader}>
            <div>
              <h2 style={styles.completionTitle}>
                Overall Completion
              </h2>

              <p style={styles.completionSubtitle}>
                {solvedProblems} of {totalProblems} problems solved
              </p>
            </div>

            <strong style={styles.completionPercentage}>
              {completion}%
            </strong>
          </div>

          <div style={styles.progressTrack}>
            <div
              style={{
                ...styles.progressBar,
                width: `${Math.min(Number(completion), 100)}%`,
              }}
            />
          </div>
        </section>

        {/* Quick Links */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Quick Links</h2>

          <div style={styles.quickLinks}>
            <Link href="/dashboard" style={styles.quickLink}>
              <span>📊</span>
              <div>
                <strong>Dashboard</strong>
                <small>View your complete progress</small>
              </div>
              <span style={styles.arrow}>→</span>
            </Link>

            <Link href="/problems" style={styles.quickLink}>
              <span>🧩</span>
              <div>
                <strong>Problems</strong>
                <small>Browse all DSA problems</small>
              </div>
              <span style={styles.arrow}>→</span>
            </Link>

            <Link href="/analytics" style={styles.quickLink}>
              <span>📈</span>
              <div>
                <strong>Analytics</strong>
                <small>Analyze your DSA performance</small>
              </div>
              <span style={styles.arrow}>→</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "calc(100vh - 70px)",
    background: "#f8fafc",
    padding: "40px 24px 70px",
  },

  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },

  pageHeader: {
    marginBottom: "28px",
  },

  eyebrow: {
    margin: "0 0 7px",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "1.2px",
    color: "#64748b",
  },

  title: {
    margin: 0,
    fontSize: "34px",
    fontWeight: 800,
    color: "#0f172a",
    letterSpacing: "-0.8px",
  },

  subtitle: {
    margin: "8px 0 0",
    color: "#64748b",
    fontSize: "15px",
  },

  profileCard: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    padding: "26px",
    marginBottom: "28px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    boxShadow: "0 4px 15px rgba(15, 23, 42, 0.04)",
  },

  avatar: {
    width: "68px",
    height: "68px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background: "#111827",
    color: "#ffffff",
    fontSize: "28px",
    fontWeight: 800,
  },

  profileInfo: {
    minWidth: 0,
  },

  profileEmail: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 700,
    color: "#111827",
    wordBreak: "break-word",
  },

  memberText: {
    margin: "6px 0 0",
    fontSize: "14px",
    color: "#64748b",
  },

  section: {
    marginBottom: "28px",
  },

  sectionTitle: {
    margin: "0 0 14px",
    fontSize: "19px",
    fontWeight: 750,
    color: "#111827",
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "14px",
  },

  infoCard: {
    minWidth: 0,
    padding: "19px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
  },

  infoLabel: {
    display: "block",
    marginBottom: "8px",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.8px",
    color: "#94a3b8",
  },

  infoValue: {
    display: "block",
    color: "#1e293b",
    fontSize: "14px",
    fontWeight: 600,
    wordBreak: "break-word",
  },

  userId: {
    display: "block",
    color: "#475569",
    fontSize: "12px",
    lineHeight: 1.5,
    wordBreak: "break-all",
    fontFamily: "monospace",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "14px",
  },

  statCard: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    padding: "19px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
  },

  statIcon: {
    width: "42px",
    height: "42px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "10px",
    fontSize: "19px",
    fontWeight: 700,
  },

  statLabel: {
    margin: 0,
    color: "#64748b",
    fontSize: "12px",
    fontWeight: 600,
  },

  statValue: {
    margin: "3px 0 0",
    color: "#111827",
    fontSize: "24px",
    fontWeight: 800,
  },

  completionCard: {
    marginBottom: "28px",
    padding: "24px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    boxShadow: "0 4px 15px rgba(15, 23, 42, 0.04)",
  },

  completionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "17px",
  },

  completionTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "18px",
    fontWeight: 750,
  },

  completionSubtitle: {
    margin: "5px 0 0",
    color: "#64748b",
    fontSize: "13px",
  },

  completionPercentage: {
    color: "#111827",
    fontSize: "26px",
    fontWeight: 800,
  },

  progressTrack: {
    width: "100%",
    height: "10px",
    overflow: "hidden",
    borderRadius: "999px",
    background: "#e5e7eb",
  },

  progressBar: {
    height: "100%",
    borderRadius: "999px",
    background: "#111827",
    transition: "width 0.4s ease",
  },

  quickLinks: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "14px",
  },

  quickLink: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "17px",
    textDecoration: "none",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    color: "#111827",
  },

  arrow: {
    marginLeft: "auto",
    color: "#64748b",
    fontSize: "18px",
  },

  loadingCard: {
    minHeight: "300px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
  },

  loadingSpinner: {
    width: "34px",
    height: "34px",
    border: "4px solid #e5e7eb",
    borderTop: "4px solid #111827",
    borderRadius: "50%",
    marginBottom: "14px",
  },

  loadingText: {
    margin: 0,
    color: "#64748b",
    fontSize: "14px",
  },

  errorCard: {
    padding: "50px 25px",
    textAlign: "center",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
  },

  errorIcon: {
    width: "44px",
    height: "44px",
    margin: "0 auto 14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background: "#fef2f2",
    color: "#dc2626",
    fontSize: "22px",
    fontWeight: 800,
  },

  errorTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "20px",
  },

  errorText: {
    margin: "8px 0 20px",
    color: "#64748b",
    fontSize: "14px",
  },

  retryButton: {
    padding: "10px 18px",
    border: "none",
    borderRadius: "8px",
    background: "#111827",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
};
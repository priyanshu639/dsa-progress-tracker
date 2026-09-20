"use client";

import { useMemo } from "react";
import type { Progress } from "@/lib/types";

type Props = {
  progress: Progress[];
};

type DayData = {
  date: string;
  count: number;
};

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getIntensity(count: number) {
  if (count === 0) return "#18181b";
  if (count === 1) return "#166534";
  if (count === 2) return "#15803d";
  if (count === 3) return "#22c55e";
  return "#86efac";
}

export function ActivityHeatmap({ progress }: Props) {
  const {
    weeks,
    months,
    totalSolved,
    currentStreak,
    bestStreak,
  } = useMemo(() => {
    const solved = progress.filter(
      (item) =>
        item.status === "solved" &&
        item.solved_at
    );

    const counts = new Map<string, number>();

    solved.forEach((item) => {
      if (!item.solved_at) return;

      const key = getDateKey(
        new Date(item.solved_at)
      );

      counts.set(
        key,
        (counts.get(key) ?? 0) + 1
      );
    });

    const today = new Date();

    /*
      Generate approximately one year
      of activity.
    */
    const start = new Date(today);

    start.setDate(
      start.getDate() - 364
    );

    /*
      Move to Sunday so the calendar
      starts on a complete week.
    */
    start.setDate(
      start.getDate() - start.getDay()
    );

    const allDays: DayData[] = [];

    const cursor = new Date(start);

    while (cursor <= today) {
      const key = getDateKey(cursor);

      allDays.push({
        date: key,
        count: counts.get(key) ?? 0,
      });

      cursor.setDate(
        cursor.getDate() + 1
      );
    }

    /*
      Convert days into columns/weeks.
    */
    const generatedWeeks: DayData[][] = [];

    for (
      let i = 0;
      i < allDays.length;
      i += 7
    ) {
      generatedWeeks.push(
        allDays.slice(i, i + 7)
      );
    }

    /*
      Month labels.
    */
    const monthLabels: {
      label: string;
      weekIndex: number;
    }[] = [];

    let previousMonth = -1;

    generatedWeeks.forEach(
      (week, index) => {
        const firstDay = week[0];

        if (!firstDay) return;

        const date = new Date(
          `${firstDay.date}T00:00:00`
        );

        const month =
          date.getMonth();

        if (
          month !== previousMonth
        ) {
          monthLabels.push({
            label:
              date.toLocaleDateString(
                undefined,
                {
                  month: "short",
                }
              ),
            weekIndex: index,
          });

          previousMonth = month;
        }
      }
    );

    /*
      Current streak.
    */
    let current = 0;

    const todayKey =
      getDateKey(today);

    const yesterday = new Date(today);

    yesterday.setDate(
      yesterday.getDate() - 1
    );

    const yesterdayKey =
      getDateKey(yesterday);

    let checkDate: Date;

    if (counts.has(todayKey)) {
      checkDate = new Date(today);
    } else if (
      counts.has(yesterdayKey)
    ) {
      checkDate = new Date(
        yesterday
      );
    } else {
      checkDate = new Date(today);
    }

    while (
      counts.has(
        getDateKey(checkDate)
      )
    ) {
      current++;

      checkDate.setDate(
        checkDate.getDate() - 1
      );
    }

    /*
      Best streak.
    */
    const dates = Array.from(
      counts.keys()
    ).sort();

    let best = 0;
    let streak = 0;
    let previousDate: Date | null =
      null;

    dates.forEach((dateString) => {
      const date = new Date(
        `${dateString}T00:00:00`
      );

      if (!previousDate) {
        streak = 1;
      } else {
        const difference =
          Math.round(
            (date.getTime() -
              previousDate.getTime()) /
              86400000
          );

        if (difference === 1) {
          streak++;
        } else {
          streak = 1;
        }
      }

      best = Math.max(
        best,
        streak
      );

      previousDate = date;
    });

    return {
      weeks: generatedWeeks,
      months: monthLabels,
      totalSolved: solved.length,
      currentStreak: current,
      bestStreak: best,
    };
  }, [progress]);

  return (
    <div
      className="card"
      style={{
        overflow: "hidden",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "flex-start",
          gap: "24px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
            }}
          >
            DSA Activity
          </h3>

          <p
            className="muted"
            style={{
              marginTop: "6px",
              marginBottom: 0,
            }}
          >
            Your solving activity over
            the last year.
          </p>
        </div>

        {/* STATS */}

        <div
          style={{
            display: "flex",
            gap: "28px",
            alignItems: "center",
          }}
        >
          <div
            style={{
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "20px",
                fontWeight: 700,
              }}
            >
              {totalSolved}
            </div>

            <div
              style={{
                fontSize: "12px",
                color: "#71717a",
              }}
            >
              solved
            </div>
          </div>

          <div
            style={{
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "20px",
                fontWeight: 700,
              }}
            >
              {currentStreak}
            </div>

            <div
              style={{
                fontSize: "12px",
                color: "#71717a",
              }}
            >
              current streak
            </div>
          </div>

          <div
            style={{
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "20px",
                fontWeight: 700,
              }}
            >
              {bestStreak}
            </div>

            <div
              style={{
                fontSize: "12px",
                color: "#71717a",
              }}
            >
              best streak
            </div>
          </div>
        </div>
      </div>

      {/* HEATMAP */}

      <div
        style={{
          marginTop: "28px",
          overflowX: "auto",
          paddingBottom: "8px",
        }}
      >
        {/* MONTH LABELS */}

        <div
          style={{
            position: "relative",
            height: "22px",
            marginLeft: "38px",
            minWidth: `${weeks.length * 15}px`,
          }}
        >
          {months.map(
            (month, index) => (
              <span
                key={`${month.label}-${index}`}
                style={{
                  position:
                    "absolute",
                  left: `${month.weekIndex * 15}px`,
                  fontSize: "11px",
                  color: "#71717a",
                  whiteSpace:
                    "nowrap",
                }}
              >
                {month.label}
              </span>
            )
          )}
        </div>

        {/* GRID */}

        <div
          style={{
            display: "flex",
            minWidth: `${weeks.length * 15 + 38}px`,
          }}
        >
          {/* WEEKDAY LABELS */}

          <div
            style={{
              width: "38px",
              flexShrink: 0,
              display: "flex",
              flexDirection:
                "column",
              justifyContent:
                "space-around",
              height: "105px",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                color: "#71717a",
              }}
            >
              Mon
            </span>

            <span
              style={{
                fontSize: "10px",
                color: "#71717a",
              }}
            >
              Wed
            </span>

            <span
              style={{
                fontSize: "10px",
                color: "#71717a",
              }}
            >
              Fri
            </span>
          </div>

          {/* WEEKS */}

          <div
            style={{
              display: "flex",
              gap: "3px",
            }}
          >
            {weeks.map(
              (week, weekIndex) => (
                <div
                  key={weekIndex}
                  style={{
                    display: "flex",
                    flexDirection:
                      "column",
                    gap: "3px",
                  }}
                >
                  {Array.from({
                    length: 7,
                  }).map(
                    (_, dayIndex) => {
                      const day =
                        week[
                          dayIndex
                        ];

                      if (!day) {
                        return (
                          <div
                            key={`${weekIndex}-${dayIndex}`}
                            style={{
                              width: "12px",
                              height: "12px",
                            }}
                          />
                        );
                      }

                      const date =
                        new Date(
                          `${day.date}T00:00:00`
                        );

                      return (
                        <div
                          key={day.date}
                          title={`${day.count} problem${
                            day.count ===
                            1
                              ? ""
                              : "s"
                          } solved on ${date.toLocaleDateString()}`}
                          style={{
                            width: "12px",
                            height: "12px",
                            borderRadius:
                              "3px",
                            backgroundColor:
                              getIntensity(
                                day.count
                              ),
                            border:
                              "1px solid rgba(255,255,255,0.05)",
                            boxSizing:
                              "border-box",
                            cursor:
                              "pointer",
                            transition:
                              "transform 0.15s ease",
                          }}
                          onMouseEnter={(
                            event
                          ) => {
                            event.currentTarget.style.transform =
                              "scale(1.3)";
                          }}
                          onMouseLeave={(
                            event
                          ) => {
                            event.currentTarget.style.transform =
                              "scale(1)";
                          }}
                        />
                      );
                    }
                  )}
                </div>
              )
            )}
          </div>
        </div>

        {/* LEGEND */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent:
              "flex-end",
            gap: "5px",
            marginTop: "14px",
            fontSize: "11px",
            color: "#71717a",
            minWidth: `${weeks.length * 15 + 38}px`,
          }}
        >
          <span>
            Less
          </span>

          {[0, 1, 2, 3, 4].map(
            (level) => (
              <span
                key={level}
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius:
                    "3px",
                  backgroundColor:
                    getIntensity(
                      level
                    ),
                  display:
                    "inline-block",
                }}
              />
            )
          )}

          <span>
            More
          </span>
        </div>
      </div>
    </div>
  );
}
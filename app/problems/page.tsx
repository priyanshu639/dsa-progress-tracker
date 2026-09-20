import { supabase } from "@/lib/supabase";
import {ProblemsList} from "./problems-list";

export default async function ProblemsPage() {
  const { data: problems, error } = await supabase
    .from("problems")
    .select("*")
    .order("position", { ascending: true });

  if (error) {
    return (
      <main style={{ padding: "40px" }}>
        <h1>Error loading problems</h1>
        <p>{error.message}</p>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px",
        background: "#09090b",
        color: "white",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            fontSize: "38px",
            marginBottom: "8px",
          }}
        >
          DSA Problems
        </h1>

        <p
          style={{
            color: "#a1a1aa",
            marginBottom: "30px",
          }}
        >
          Build consistency. Master patterns. Track your progress.
        </p>

        <ProblemsList problems={problems ?? []} />
      </div>
    </main>
  );
}
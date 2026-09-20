"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

const navItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
  },
  {
    name: "Problems",
    href: "/problems",
  },
  {
    name: "Analytics",
    href: "/analytics",
  },
  {
    name: "Profile",
    href: "/profile",
  },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      setLoggingOut(false);
      return;
    }

    router.push("/login");
    router.refresh();
  };

  return (
    <header
      style={{
        width: "100%",
        background: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          height: "70px",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href="/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "9px",
            textDecoration: "none",
            color: "#111827",
            fontSize: "21px",
            fontWeight: 800,
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "34px",
              height: "34px",
              borderRadius: "9px",
              background: "#111827",
              color: "#ffffff",
            }}
          >
            ⚡
          </span>

          <span>DSA Tracker</span>
        </Link>

        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          {navItems.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: "9px 14px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  color: active ? "#ffffff" : "#4b5563",
                  background: active ? "#111827" : "transparent",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                {item.name}
              </Link>
            );
          })}

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              marginLeft: "8px",
              padding: "9px 15px",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              background: "#ffffff",
              color: "#dc2626",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </nav>
      </div>
    </header>
  );
}
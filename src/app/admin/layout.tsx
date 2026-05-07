"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const AUTH_KEY = "oshap-admin-auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const stored = sessionStorage.getItem(AUTH_KEY);
      setAuthenticated(!!stored);
    };

    checkAuth();
    // Re-check periodically to detect login/logout from child pages
    const interval = setInterval(checkAuth, 500);
    return () => clearInterval(interval);
  }, []);

  if (!authenticated) {
    return <>{children}</>;
  }

  return (
    <div>
      <nav style={{
        display: "flex",
        gap: "16px",
        padding: "12px 16px",
        background: "var(--color-surface-container)",
        borderBottom: "1px solid var(--color-outline-variant)",
      }}>
        <Link
          href="/admin"
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            fontWeight: 600,
            fontSize: "14px",
            textDecoration: "none",
            background: pathname === "/admin" ? "var(--color-primary)" : "transparent",
            color: pathname === "/admin" ? "#fff" : "var(--color-primary-text)",
          }}
        >
          Tables
        </Link>
        <Link
          href="/admin/menu"
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            fontWeight: 600,
            fontSize: "14px",
            textDecoration: "none",
            background: pathname.startsWith("/admin/menu") ? "var(--color-primary)" : "transparent",
            color: pathname.startsWith("/admin/menu") ? "#fff" : "var(--color-primary-text)",
          }}
        >
          Menu
        </Link>
        <Link
          href="/admin/kitchen"
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            fontWeight: 600,
            fontSize: "14px",
            textDecoration: "none",
            background: pathname.startsWith("/admin/kitchen") ? "var(--color-primary)" : "transparent",
            color: pathname.startsWith("/admin/kitchen") ? "#fff" : "var(--color-primary-text)",
          }}
        >
          Kitchen
        </Link>
        <Link
          href="/admin/history"
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            fontWeight: 600,
            fontSize: "14px",
            textDecoration: "none",
            background: pathname.startsWith("/admin/history") ? "var(--color-primary)" : "transparent",
            color: pathname.startsWith("/admin/history") ? "#fff" : "var(--color-primary-text)",
          }}
        >
          History
        </Link>
      </nav>
      {children}
    </div>
  );
}

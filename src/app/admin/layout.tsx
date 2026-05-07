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
    const interval = setInterval(checkAuth, 500);
    return () => clearInterval(interval);
  }, []);

  if (!authenticated) {
    return <>{children}</>;
  }

  const tabs = [
    { href: "/admin", label: "Tables", exact: true },
    { href: "/admin/menu", label: "Menu" },
    { href: "/admin/kitchen", label: "Kitchen" },
    { href: "/admin/history", label: "History" },
  ];

  return (
    <div>
      <nav style={{
        display: "flex",
        gap: "4px",
        padding: "8px 16px",
        background: "var(--color-surface-container)",
        borderBottom: "1px solid var(--color-surface-container-high)",
        overflowX: "auto",
      }}>
        {tabs.map((tab) => {
          const isActive = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "13px",
                textDecoration: "none",
                whiteSpace: "nowrap",
                transition: "background 0.15s, color 0.15s",
                background: isActive ? "var(--color-primary)" : "transparent",
                color: isActive ? "#fff" : "var(--color-secondary-text)",
              }}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}

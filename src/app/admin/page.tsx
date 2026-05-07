"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./page.module.css";

const AUTH_KEY = "oshap-admin-auth";

interface TableData {
  id: string;
  status: string;
  unpaidTotal: number;
  pendingTotal: number;
  hasPending: boolean;
  hasUnpaid: boolean;
}

function getAuthHeaders(): Record<string, string> {
  const pin = sessionStorage.getItem(AUTH_KEY) || "";
  return {
    "Content-Type": "application/json",
    "x-admin-pin": pin,
  };
}

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [tables, setTables] = useState<TableData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [verifyingTable, setVerifyingTable] = useState<string | null>(null);
  const [closingTable, setClosingTable] = useState<string | null>(null);
  const [clearPromptTable, setClearPromptTable] = useState<string | null>(null);

  const handleLogout = () => {
    sessionStorage.removeItem(AUTH_KEY);
    setAuthenticated(false);
    setPinInput("");
    setPinError("");
  };

  const handleLogin = useCallback(async () => {
    setPinError("");
    setIsLoggingIn(true);

    try {
      const res = await fetch("/api/admin/tables", {
        headers: {
          "Content-Type": "application/json",
          "x-admin-pin": pinInput,
        },
      });

      if (res.status === 401) {
        setPinError("Invalid PIN. Try again.");
        setIsLoggingIn(false);
        return;
      }

      if (res.ok) {
        sessionStorage.setItem(AUTH_KEY, pinInput);
        setAuthenticated(true);
      }
    } catch {
      setPinError("Connection failed. Check your network.");
    } finally {
      setIsLoggingIn(false);
    }
  }, [pinInput]);

  const fetchTables = async () => {
    try {
      const res = await fetch("/api/admin/tables", { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setTables(data.tables || []);
      }
    } catch (err) {
      console.error("Failed to fetch tables", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const stored = sessionStorage.getItem(AUTH_KEY);
    if (stored) {
      setAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    setIsLoading(true);
    fetchTables();
    const interval = setInterval(fetchTables, 5000);
    return () => clearInterval(interval);
  }, [authenticated]);

  const handleVerify = async (tableId: string) => {
    setVerifyingTable(tableId);
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ table_id: tableId }),
      });
      if (!res.ok) throw new Error("Failed to verify payment");

      const data = await res.json();

      if (data.auto_closed) {
        // Session auto-closed — all orders paid, table is clean
        setTables((prev) =>
          prev.map((t) =>
            t.id === tableId
              ? { ...t, pendingTotal: 0, unpaidTotal: 0, hasPending: false, hasUnpaid: false }
              : t
          )
        );
      } else {
        // Payment verified but unpaid orders remain — guests still dining
        setTables((prev) =>
          prev.map((t) =>
            t.id === tableId ? { ...t, pendingTotal: 0, hasPending: false } : t
          )
        );
      }
    } catch (err) {
      console.error(err);
      alert("Failed to verify payment. Please try again.");
    } finally {
      setVerifyingTable(null);
    }
  };

  const handleClearWithReason = async (tableId: string, reason: "paid" | "abandoned") => {
    setClosingTable(tableId);
    setClearPromptTable(null);
    try {
      const res = await fetch("/api/admin/close", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ table_id: tableId, reason }),
      });
      if (!res.ok) throw new Error("Failed to clear table");

      setTables((prev) =>
        prev.map((t) =>
          t.id === tableId
            ? { ...t, unpaidTotal: 0, pendingTotal: 0, hasPending: false, hasUnpaid: false }
            : t
        )
      );
    } catch (err) {
      console.error(err);
      alert("Failed to clear table. Please try again.");
    } finally {
      setClosingTable(null);
    }
  };

  const formatPrice = (amount: number) => `₦${amount.toLocaleString()}`;

  // --- Login Screen ---
  if (!authenticated) {
    return (
      <div className={styles.page}>
        <div className={styles.loginContainer}>
          <div className={styles.loginCard}>
            <div className={styles.loginIcon}>
              <i className="mgc_lock_fill"></i>
            </div>
            <h1 className={styles.loginTitle}>Staff Login</h1>
            <p className={styles.loginDesc}>Enter your PIN to access the dashboard</p>

            <input
              className={`${styles.loginInput} ${pinError ? styles.loginInputError : ""}`}
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter PIN"
              value={pinInput}
              onChange={(e) => { setPinInput(e.target.value); setPinError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
              autoFocus
            />
            {pinError && <p className={styles.loginError}>{pinError}</p>}

            <button
              className={styles.loginBtn}
              onClick={handleLogin}
              disabled={isLoggingIn || pinInput.length < 3}
            >
              {isLoggingIn ? "Verifying..." : "Login"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Dashboard ---
  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading tables...</p>
        </div>
      </div>
    );
  }

  const activeTablesCount = tables.filter((t) => t.hasPending || t.hasUnpaid).length;
  const pendingCount = tables.filter((t) => t.hasPending).length;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>Waiter Dashboard</h1>
        <div className={styles.headerActions}>
          <button className={styles.refreshBtn} onClick={() => { setIsLoading(true); fetchTables(); }}>
            <i className={`mgc_refresh_3_line ${styles.refreshIcon}`}></i>
            Refresh
          </button>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <i className={`mgc_exit_line ${styles.logoutIcon}`}></i>
          </button>
        </div>
      </header>

      <main className={styles.content}>
        <div className={styles.summary}>
          <div className={styles.summaryCard}>
            <span className={styles.summaryValue}>{activeTablesCount}</span>
            <span className={styles.summaryLabel}>Active Tables</span>
          </div>
          <div className={styles.summaryCard} style={{ backgroundColor: pendingCount > 0 ? 'rgba(255, 153, 0, 0.1)' : '' }}>
            <span className={styles.summaryValue} style={{ color: pendingCount > 0 ? '#ff9900' : '' }}>{pendingCount}</span>
            <span className={styles.summaryLabel}>Payments to Verify</span>
          </div>
        </div>

        <div className={styles.grid}>
          {tables.map((table) => {
            const isPending = table.hasPending;
            const isUnpaid = table.hasUnpaid;
            const isEmpty = !isPending && !isUnpaid;

            return (
              <div
                key={table.id}
                className={`${styles.tableCard} ${
                  isPending
                    ? styles.tableCardPending
                    : !isEmpty
                    ? styles.tableCardActive
                    : ""
                }`}
              >
                <div className={styles.tableHeader}>
                  <span className={styles.tableName}>{table.id}</span>
                  {isPending ? (
                    <span className={`${styles.statusBadge} ${styles.badgePending}`}>
                      Verification Req.
                    </span>
                  ) : isUnpaid ? (
                    <span className={`${styles.statusBadge} ${styles.badgeUnpaid}`}>
                      Dining
                    </span>
                  ) : (
                    <span className={`${styles.statusBadge} ${styles.badgeEmpty}`}>
                      Empty
                    </span>
                  )}
                </div>

                <div className={styles.tableDetails}>
                  {!isEmpty ? (
                    <>
                      {isUnpaid && (
                        <span className={styles.detailText}>
                          Current Bill: <span className={styles.highlightText}>{formatPrice(table.unpaidTotal)}</span>
                        </span>
                      )}
                      {isPending && (
                        <span className={styles.detailText} style={{ color: '#ff9900' }}>
                          Claimed: <span className={styles.highlightText} style={{ color: '#ff9900' }}>{formatPrice(table.pendingTotal)}</span>
                        </span>
                      )}
                    </>
                  ) : (
                    <span className={styles.detailText}>No active orders</span>
                  )}
                </div>

                {isPending && (
                  <button
                    className={styles.verifyBtn}
                    onClick={() => handleVerify(table.id)}
                    disabled={verifyingTable === table.id}
                  >
                    {verifyingTable === table.id ? "Verifying..." : "Verify Payment"}
                  </button>
                )}
                {!isEmpty && closingTable === table.id && (
                  <div className={styles.clearingStatus}>Clearing...</div>
                )}
                {!isEmpty && closingTable !== table.id && clearPromptTable !== table.id && (
                  <button
                    className={styles.closeBtn}
                    onClick={() => setClearPromptTable(table.id)}
                  >
                    Clear Table
                  </button>
                )}
                {clearPromptTable === table.id && (
                  <div className={styles.clearPrompt}>
                    <span className={styles.clearPromptLabel}>Why are you clearing?</span>
                    <button
                      className={styles.clearPaidBtn}
                      onClick={() => handleClearWithReason(table.id, "paid")}
                    >
                      <i className="mgc_wallet_4_line" /> Paid (Cash/Transfer)
                    </button>
                    <button
                      className={styles.clearAbandonedBtn}
                      onClick={() => handleClearWithReason(table.id, "abandoned")}
                    >
                      <i className="mgc_exit_line" /> Abandoned / Left
                    </button>
                    <button
                      className={styles.clearCancelBtn}
                      onClick={() => setClearPromptTable(null)}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

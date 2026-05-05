"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";

interface TableData {
  id: string;
  status: string;
  unpaidTotal: number;
  pendingTotal: number;
  hasPending: boolean;
  hasUnpaid: boolean;
}

export default function AdminDashboard() {
  const [tables, setTables] = useState<TableData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [verifyingTable, setVerifyingTable] = useState<string | null>(null);

  const fetchTables = async () => {
    try {
      const res = await fetch("/api/admin/tables");
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

  // Poll every 5 seconds
  useEffect(() => {
    fetchTables();
    const interval = setInterval(fetchTables, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleVerify = async (tableId: string) => {
    setVerifyingTable(tableId);
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table_id: tableId }),
      });

      if (!res.ok) {
        throw new Error("Failed to verify payment");
      }

      // Optimistic update: clear pending from this table
      setTables((prev) =>
        prev.map((t) =>
          t.id === tableId
            ? { ...t, pendingTotal: 0, hasPending: false }
            : t
        )
      );
    } catch (err) {
      console.error(err);
      alert("Failed to verify payment. Please try again.");
    } finally {
      setVerifyingTable(null);
    }
  };

  const formatPrice = (amount: number) => `₦${amount.toLocaleString()}`;

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
        <button className={styles.refreshBtn} onClick={() => { setIsLoading(true); fetchTables(); }}>
          <i className={`mgc_refresh_3_line ${styles.refreshIcon}`}></i>
          Refresh
        </button>
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
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

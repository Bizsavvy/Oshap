"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./page.module.css";

const AUTH_KEY = "oshap-admin-auth";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  proof_url: string | null;
  created_at: string;
}

interface HistoryOrder {
  id: string;
  table_id: string;
  status: string;
  total: number;
  reference: string;
  created_at: string;
  customer_name: string | null;
  order_items: OrderItem[];
  payments: Payment[];
}

interface Pagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

interface Summary {
  confirmed_count: number;
  cancelled_count: number;
  page_revenue: number;
}

function getAuthHeaders(): Record<string, string> {
  const pin = sessionStorage.getItem(AUTH_KEY) || "";
  return {
    "Content-Type": "application/json",
    "x-admin-pin": pin,
  };
}

export default function HistoryPage() {
  const [orders, setOrders] = useState<HistoryOrder[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1, per_page: 20, total: 0, total_pages: 0,
  });
  const [summary, setSummary] = useState<Summary>({
    confirmed_count: 0, cancelled_count: 0, page_revenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [tableFilter, setTableFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const fetchHistory = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: "20",
      });
      if (tableFilter) params.set("table", tableFilter);
      if (dateFilter) params.set("date", dateFilter);

      const res = await fetch(`/api/admin/history?${params}`, {
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setPagination(data.pagination);
        setSummary(data.summary);
      }
    } catch (err) {
      console.error("Failed to fetch history", err);
    } finally {
      setIsLoading(false);
    }
  }, [tableFilter, dateFilter]);

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  const formatPrice = (amount: number) => `₦${amount.toLocaleString()}`;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-NG", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading && orders.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>Transaction History</h1>
        <div className={styles.headerActions}>
          <button
            className={styles.refreshBtn}
            onClick={() => fetchHistory(pagination.page)}
          >
            <i className="mgc_refresh_3_line" />
            Refresh
          </button>
        </div>
      </header>

      <main className={styles.content}>
        {/* Filters */}
        <div className={styles.filters}>
          <input
            className={styles.filterInput}
            type="text"
            placeholder="Filter by table (e.g. T1)"
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value.toUpperCase())}
          />
          <input
            className={styles.filterInput}
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>

        {/* Summary */}
        <div className={styles.summary}>
          <div className={styles.summaryCard}>
            <span className={styles.summaryValue}>{pagination.total}</span>
            <span className={styles.summaryLabel}>Total Orders</span>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryValue} style={{ color: "var(--color-success)" }}>
              {summary.confirmed_count}
            </span>
            <span className={styles.summaryLabel}>Confirmed</span>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryValue} style={{ color: "var(--color-error)" }}>
              {summary.cancelled_count}
            </span>
            <span className={styles.summaryLabel}>Cancelled</span>
          </div>
        </div>

        {/* Order List */}
        {orders.length === 0 ? (
          <div className={styles.emptyState}>
            <i className={`mgc_history_line ${styles.emptyIcon}`} />
            <p>No transactions found</p>
          </div>
        ) : (
          <div className={styles.orderList}>
            {orders.map((order) => {
              const isExpanded = expandedOrder === order.id;
              const payment = order.payments?.[0];

              return (
                <div
                  key={order.id}
                  className={`${styles.orderCard} ${
                    order.status === "CANCELLED" ? styles.orderCardCancelled : ""
                  }`}
                  onClick={() =>
                    setExpandedOrder(isExpanded ? null : order.id)
                  }
                  style={{ cursor: "pointer" }}
                >
                  {/* Top row: ref + total */}
                  <div className={styles.orderTop}>
                    <div className={styles.orderMeta}>
                      <span className={styles.orderRef}>{order.reference}</span>
                      <span className={styles.orderTable}>
                        {order.table_id}
                        {order.customer_name && (
                          <> · <span className={styles.customerName}>{order.customer_name}</span></>
                        )}
                      </span>
                    </div>
                    <div className={styles.orderRight}>
                      <span className={styles.orderTotal}>
                        {formatPrice(order.total)}
                      </span>
                      <span
                        className={`${styles.statusBadge} ${
                          order.status === "CONFIRMED"
                            ? styles.badgeConfirmed
                            : styles.badgeCancelled
                        }`}
                      >
                        {order.status === "CONFIRMED" ? "Paid" : "Cancelled"}
                      </span>
                    </div>
                  </div>

                  {/* Expanded: order items */}
                  {isExpanded && order.order_items?.length > 0 && (
                    <div className={styles.orderItems}>
                      {order.order_items.map((item) => (
                        <div key={item.id} className={styles.orderItem}>
                          <span className={styles.itemName}>
                            <span className={styles.itemQty}>{item.quantity}×</span>
                            {item.name}
                          </span>
                          <span className={styles.itemPrice}>
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Footer: date + payment status */}
                  <div className={styles.orderFooter}>
                    <span className={styles.orderDate}>
                      {formatDate(order.created_at)} · {formatTime(order.created_at)}
                    </span>
                    {payment && (
                      <span
                        className={`${styles.paymentBadge} ${
                          payment.status === "VERIFIED" ? styles.paymentVerified : ""
                        }`}
                      >
                        {payment.status === "VERIFIED"
                          ? "✓ Verified"
                          : payment.status === "CLAIMED"
                          ? "Claimed"
                          : "No Payment"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className={styles.pagination}>
            <button
              className={styles.pageBtn}
              disabled={pagination.page <= 1}
              onClick={() => fetchHistory(pagination.page - 1)}
            >
              ← Prev
            </button>
            <span className={styles.pageInfo}>
              Page {pagination.page} of {pagination.total_pages}
            </span>
            <button
              className={styles.pageBtn}
              disabled={pagination.page >= pagination.total_pages}
              onClick={() => fetchHistory(pagination.page + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

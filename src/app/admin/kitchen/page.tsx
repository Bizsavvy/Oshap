"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const AUTH_KEY = "oshap-admin-auth";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface KitchenOrder {
  id: string;
  table_id: string;
  status: string;
  total: number;
  reference: string;
  created_at: string;
  order_items: OrderItem[];
}

function getHeaders() {
  return {
    "Content-Type": "application/json",
    "x-admin-pin": sessionStorage.getItem(AUTH_KEY) || "",
  };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}

export default function KitchenDisplay() {
  const router = useRouter();
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/admin/kitchen", { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      } else if (res.status === 401) {
        router.push("/admin");
      }
    } catch (err) {
      console.error("Failed to fetch kitchen orders", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch("/api/admin/kitchen", {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ order_id: orderId, status: newStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      }
    } catch (err) {
      console.error("Failed to update order status", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const stripRef = (ref: string) => ref.split("-").pop() || ref;

  const formatPrice = (p: number) => `₦${p.toLocaleString()}`;

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  const newOrders = orders.filter((o) => o.status === "CREATED");
  const inProgress = orders.filter((o) => o.status === "PREPARING");

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Kitchen Display</h1>
        <div className={styles.headerCounts}>
          <span className={styles.countBadge}>{newOrders.length} new</span>
          <span className={`${styles.countBadge} ${styles.countInProgress}`}>{inProgress.length} cooking</span>
        </div>
      </header>

      <div className={styles.content}>
        {orders.length === 0 ? (
          <div className={styles.empty}>
            <i className="mgc_knife_line" style={{ fontSize: 48, opacity: 0.3 }}></i>
            <p>No orders yet</p>
            <span>Waiting for new orders...</span>
          </div>
        ) : (
          <div className={styles.columns}>
            {/* New Orders */}
            <div className={styles.column}>
              <h2 className={styles.columnTitle}>New</h2>
              {newOrders.map((order) => (
                <div key={order.id} className={styles.orderCard}>
                  <div className={styles.orderHeader}>
                    <span className={styles.tableLabel}>{order.table_id}</span>
                    <span className={styles.timeLabel}>{timeAgo(order.created_at)}</span>
                    <span className={styles.refLabel}>#{stripRef(order.reference)}</span>
                  </div>
                  <ul className={styles.itemList}>
                    {order.order_items.map((item) => (
                      <li key={item.id} className={styles.itemRow}>
                        <span className={styles.itemQty}>{item.quantity}x</span>
                        <span className={styles.itemName}>{item.name}</span>
                      </li>
                    ))}
                  </ul>
                  <div className={styles.orderFooter}>
                    <span className={styles.orderTotal}>{formatPrice(order.total)}</span>
                    <button
                      className={styles.startBtn}
                      onClick={() => handleUpdateStatus(order.id, "PREPARING")}
                      disabled={updatingId === order.id}
                    >
                      {updatingId === order.id ? "..." : "Start"}
                    </button>
                  </div>
                </div>
              ))}
              {newOrders.length === 0 && (
                <p className={styles.colEmpty}>—</p>
              )}
            </div>

            {/* In Progress */}
            <div className={styles.column}>
              <h2 className={`${styles.columnTitle} ${styles.columnTitleCooking}`}>Cooking</h2>
              {inProgress.map((order) => (
                <div key={order.id} className={`${styles.orderCard} ${styles.orderCardCooking}`}>
                  <div className={styles.orderHeader}>
                    <span className={styles.tableLabel}>{order.table_id}</span>
                    <span className={styles.timeLabel}>{timeAgo(order.created_at)}</span>
                    <span className={styles.refLabel}>#{stripRef(order.reference)}</span>
                  </div>
                  <ul className={styles.itemList}>
                    {order.order_items.map((item) => (
                      <li key={item.id} className={styles.itemRow}>
                        <span className={styles.itemQty}>{item.quantity}x</span>
                        <span className={styles.itemName}>{item.name}</span>
                      </li>
                    ))}
                  </ul>
                  <div className={styles.orderFooter}>
                    <span className={styles.orderTotal}>{formatPrice(order.total)}</span>
                    <button
                      className={styles.readyBtn}
                      onClick={() => handleUpdateStatus(order.id, "READY")}
                      disabled={updatingId === order.id}
                    >
                      {updatingId === order.id ? "..." : "Ready"}
                    </button>
                  </div>
                </div>
              ))}
              {inProgress.length === 0 && (
                <p className={styles.colEmpty}>—</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

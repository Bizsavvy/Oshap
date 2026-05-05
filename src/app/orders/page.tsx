"use client";

import { Suspense, useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CartProvider, useCart } from "@/context/CartContext";
import { useSession } from "@/context/SessionContext";
import BottomNav from "@/components/BottomNav";
import styles from "./page.module.css";

function OrdersPageContent() {
  const searchParams = useSearchParams();
  const tableId = searchParams.get("table") || "T1";

  return (
    <CartProvider tableId={tableId}>
      <OrdersView tableId={tableId} />
      <BottomNav tableId={tableId} />
    </CartProvider>
  );
}

/* ─── helpers ────────────────────────────────────── */
function generateOrderId() {
  const a = Math.floor(1000 + Math.random() * 9000);
  const b = Math.floor(1000 + Math.random() * 9000);
  return `${a}-${b}`;
}

/* ─── main view ──────────────────────────────────── */
function OrdersView({ tableId }: { tableId: string }) {
  const router = useRouter();
  const {
    session,
    customerName,
    setCustomerName,
    startSession,
    joinSession,
  } = useSession();

  const [isStarting, setIsStarting] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [showJoinForm, setShowJoinForm] = useState(false);

  const [sessionOrders, setSessionOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const isFirstLoad = useRef(true);

  // Stable order id for this page visit
  const displayOrderId = useMemo(() => generateOrderId(), []);

  /* ── fetch orders ── */
  useEffect(() => {
    const fetchOrders = async () => {
      if (isFirstLoad.current) {
        setIsLoadingOrders(true);
      }
      try {
        const queryParams = session?.id 
          ? `session_id=${session.id}` 
          : `table_id=${tableId}`;

        const res = await fetch(`/api/session/orders?${queryParams}`);
        if (res.ok) {
          const data = await res.json();
          const newOrders = data.orders || [];
          // Only update state if data actually changed to avoid unnecessary re-renders
          setSessionOrders((prev) => {
            if (JSON.stringify(prev) === JSON.stringify(newOrders)) return prev;
            return newOrders;
          });
        }
      } catch (err) {
        console.error("Failed to fetch session orders", err);
      } finally {
        if (isFirstLoad.current) {
          setIsLoadingOrders(false);
          isFirstLoad.current = false;
        }
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, [session?.id, tableId]);

  /* ── handlers ── */
  const handleStartSession = async () => {
    if (!nameInput.trim()) return alert("Please enter your name");
    setIsStarting(true);
    try {
      setCustomerName(nameInput.trim());
      await startSession(tableId);
    } catch {
      alert("Failed to start session");
    } finally {
      setIsStarting(false);
    }
  };

  const handleJoinSession = async () => {
    if (!nameInput.trim() || !pinInput.trim())
      return alert("Please enter name and PIN");
    setIsStarting(true);
    try {
      setCustomerName(nameInput.trim());
      await joinSession(pinInput.trim(), tableId);
    } catch {
      alert("Failed to join session. Check your PIN.");
    } finally {
      setIsStarting(false);
    }
  };

  /* ── cart access (for reorder) ── */
  const { items: cartItems, addItem, updateQuantity } = useCart();
  const [reorderedItem, setReorderedItem] = useState<string | null>(null);
  const reorderTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleReorder = useCallback(async (item: any) => {
    setReorderedItem(item.name);
    if (reorderTimer.current) clearTimeout(reorderTimer.current);
    reorderTimer.current = setTimeout(() => setReorderedItem(null), 1500);

    // If already in cart, just increment qty
    const existing = cartItems.find((i) => i.name === item.name);
    if (existing) {
      updateQuantity(existing.id, existing.quantity + 1);
      return;
    }

    // Fetch menu to find the item's real UUID
    try {
      const res = await fetch("/api/menu");
      if (res.ok) {
        const menuData = await res.json();
        const match = menuData.find(
          (m: any) => m.name.toLowerCase() === item.name.toLowerCase()
        );
        if (match) {
          addItem({ id: match.id, name: match.name, price: match.price, image: match.image_url });
          return;
        }
      }
    } catch {
      // Fall through
    }

    // Fallback: redirect to menu
    router.push(`/menu?table=${tableId}`);
  }, [cartItems, addItem, updateQuantity, router, tableId]);

  /* ── split orders ── */
  const personalOrders = sessionOrders.filter(
    (o) => o.customer_name === customerName
  );
  const othersOrders = sessionOrders.filter(
    (o) => o.customer_name !== customerName
  );
  const personalItems = personalOrders.flatMap((o) => o.order_items || []);

  // Collect all unique items from others (for bottom banner)
  const othersItemNames = othersOrders
    .flatMap((o) => (o.order_items || []).map((i: any) => i.name))
    .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i);

  return (
    <div className={styles.page}>
      {/* ──── Header ──── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button
            className={styles.backBtn}
            onClick={() => router.push(`/menu?table=${tableId}`)}
            aria-label="Back"
          >
            <i className="mgc_left_line"></i>
          </button>
          <div className={styles.headerInfo}>
            <h1 className={styles.headerTitle}>My Orders</h1>
            <span className={styles.orderIdText}>
              Order id: {displayOrderId}
            </span>
          </div>
        </div>
        <span className={styles.tableBadge}>Table: {tableId}</span>
      </header>

      {/* ──── Order Together ──── */}
      {session ? (
        <section className={styles.orderTogetherSection}>
          <div className={styles.orderTogetherCard}>
            <div className={styles.orderTogetherContent}>
              <h2 className={styles.orderTogetherTitle}>Order together</h2>
              <p className={styles.orderTogetherDesc}>
                Share PIN with your companions at table &amp; order together.
              </p>
              <div className={styles.pinChip}>
                Table PIN : {session.pin}
              </div>
            </div>
            <div className={styles.phoneIllustration}>
              <div className={styles.phoneSecond} />
              <div className={styles.phoneIcon}>
                <i className="mgc_cellphone_line"></i>
              </div>
              <span className={styles.placeOrderLabel}>Place Order</span>
            </div>
          </div>
        </section>
      ) : (
        <section className={styles.joinSection}>
          <div className={styles.joinCard}>
            <h2 className={styles.joinTitle}>Order together</h2>
            <p className={styles.joinDesc}>
              Share PIN with your companions at table &amp; order together.
            </p>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Your Name</label>
              <input
                className={styles.input}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Binjo"
              />
            </div>

            {showJoinForm && (
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Table PIN</label>
                <input
                  className={styles.input}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="4-digit PIN"
                  maxLength={4}
                  inputMode="numeric"
                />
              </div>
            )}

            <div className={styles.btnGroup}>
              {showJoinForm ? (
                <>
                  <button
                    className={styles.secondaryBtn}
                    onClick={() => setShowJoinForm(false)}
                  >
                    Back
                  </button>
                  <button
                    className={styles.primaryBtn}
                    onClick={handleJoinSession}
                    disabled={isStarting}
                  >
                    {isStarting ? "Joining…" : "Join Session"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    className={styles.secondaryBtn}
                    onClick={() => setShowJoinForm(true)}
                  >
                    Join with PIN
                  </button>
                  <button
                    className={styles.primaryBtn}
                    onClick={handleStartSession}
                    disabled={isStarting}
                  >
                    {isStarting ? "Starting…" : "Start Session"}
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ──── Personal Order Items ──── */}
      <section className={styles.myOrderSection}>
        <h2 className={styles.sectionTitle}>
          {customerName ? `${customerName}'s Order` : "Your Order"}
        </h2>
        <div className={styles.divider} />

        {isLoadingOrders && personalItems.length === 0 ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
          </div>
        ) : personalItems.length === 0 ? (
          <div className={styles.emptyState}>
            <i className={`mgc_shopping_bag_2_line ${styles.emptyIcon}`}></i>
            <h3 className={styles.emptyTitle}>No orders yet</h3>
            <p className={styles.emptyText}>
              Add items from the menu to place your order.
            </p>
            <button
              className={styles.browseBtn}
              onClick={() => router.push(`/menu?table=${tableId}`)}
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <>
            <p className={styles.orderGroupLabel}>Order 1</p>
            <div className={styles.itemsList}>
              {personalItems.map((item: any, idx: number) => (
                <div key={idx} className={styles.itemRow}>
                  <div className={styles.itemLeft}>
                    <div className={styles.vegDot}>
                      <div className={styles.vegDotInner} />
                    </div>
                    <div className={styles.itemInfo}>
                      <span className={styles.itemName}>{item.name}</span>
                      <span className={styles.itemQty}>
                        Qty {item.quantity}
                      </span>
                    </div>
                  </div>
                  <button
                    className={`${styles.reorderBtn} ${reorderedItem === item.name ? styles.reorderBtnAdded : ""}`}
                    onClick={() => handleReorder(item)}
                  >
                    {reorderedItem === item.name ? "ADDED ✓" : "REORDER"}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* ──── Others Banner ──── */}
      {session && othersItemNames.length > 0 && (
        <div className={styles.othersBanner}>
          <div className={styles.othersBannerLeft}>
            <span className={styles.othersBannerTitle}>
              ▶ See what others are ordering 🤔
            </span>
            <span className={styles.othersBannerItems}>
              {othersItemNames.join(", ")}
            </span>
          </div>
          <div className={styles.othersAvatars}>
            <div
              className={styles.othersAvatar}
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=80&q=60')",
              }}
            />
            <div
              className={styles.othersAvatar}
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=80&q=60')",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading…</p>
        </div>
      }
    >
      <OrdersPageContent />
    </Suspense>
  );
}

"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CartProvider, useCart } from "@/context/CartContext";
import { useSession } from "@/context/SessionContext";
import BottomNav from "@/components/BottomNav";
import CartBar from "@/components/CartBar";
import CartDrawer from "@/components/CartDrawer";
import styles from "./page.module.css";

function OrdersPageContent() {
  const searchParams = useSearchParams();
  const tableId = searchParams.get("table") || "T1";

  return (
    <CartProvider tableId={tableId}>
      <OrdersView tableId={tableId} />
      <CartBar tableId={tableId} />
      <CartDrawer tableId={tableId} />
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
    isHydrated,
  } = useSession();

  const [isStarting, setIsStarting] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showOthers, setShowOthers] = useState(false);

  const [sessionOrders, setSessionOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const hasFetchedOnce = useRef(false);

  // Stable order id for this page visit
  const [displayOrderId, setDisplayOrderId] = useState("");
  useEffect(() => {
    setDisplayOrderId(generateOrderId());
  }, []);

  /* ── fetch orders ── */
  useEffect(() => {
    const fetchOrders = async () => {
      // Only show loading spinner on the very first fetch
      if (!hasFetchedOnce.current) {
        setIsLoadingOrders(true);
      }
      try {
        const queryParams = session?.id 
          ? `session_id=${session.id}&table_id=${tableId}` 
          : `table_id=${tableId}`;

        const res = await fetch(`/api/session/orders?${queryParams}`);
        if (res.ok) {
          const data = await res.json();
          setSessionOrders(data.orders || []);
        }
      } catch (err) {
        console.error("Failed to fetch session orders", err);
      } finally {
        hasFetchedOnce.current = true;
        setIsLoadingOrders(false);
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

  const handleReorder = async (item: any) => {
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
  };

  /* ── split orders ── */
  const personalOrders = session
    ? sessionOrders.filter((o) => o.customer_name === customerName)
    : sessionOrders;

  const othersOrders = session
    ? sessionOrders.filter((o) => o.customer_name !== customerName)
    : [];
  const personalItems = personalOrders.flatMap((o) => o.order_items || []);

  const formatPrice = (amount: number) => `₦${amount.toLocaleString()}`;

  const personalTotal = personalOrders.reduce((sum, o) => {
    return sum + (o.order_items || []).reduce((itemSum: number, item: any) => {
      return itemSum + (item.price * (item.quantity || item.qty || 1));
    }, 0);
  }, 0);

  const othersTotal = othersOrders.reduce((sum, o) => {
    return sum + (o.order_items || []).reduce((itemSum: number, item: any) => {
      return itemSum + (item.price * (item.quantity || item.qty || 1));
    }, 0);
  }, 0);

  const groupTotal = personalTotal + othersTotal;

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
      {!isHydrated ? (
        <section className={styles.joinSection} style={{ opacity: 0 }}>
          <div className={styles.joinCard}>
            <h2 className={styles.joinTitle}>Order together</h2>
            <p className={styles.joinDesc}>Loading session...</p>
          </div>
        </section>
      ) : session ? (
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
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-l)" }}>
            {personalOrders.map((order, orderIdx) => {
              if (!order.order_items || order.order_items.length === 0) return null;
              
              return (
                <div key={order.id || orderIdx}>
                  <p className={styles.orderGroupLabel}>Order {orderIdx + 1}</p>
                  <div className={styles.itemsList}>
                    {order.order_items.map((item: any, idx: number) => (
                      <div key={idx} className={styles.itemRow}>
                        <div className={styles.itemLeft}>
                          <i 
                            className="mgc_fork_spoon_line" 
                            style={{ fontSize: '20px', color: 'var(--color-primary)', marginTop: '2px' }}
                          ></i>
                          <div className={styles.itemInfo}>
                            <span className={styles.itemName}>{item.name}</span>
                            <span className={styles.itemQty}>
                              Qty {item.quantity || item.qty}
                            </span>
                          </div>
                        </div>
                        <button
                          className={styles.reorderBtn}
                          onClick={() => handleReorder(item)}
                        >
                          REORDER
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            <div className={styles.divider} style={{ marginTop: 'var(--spacing-s)', marginBottom: 'var(--spacing-s)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-poppins)', fontSize: '18px', fontWeight: 'var(--fw-bold)', color: 'var(--color-primary-text)' }}>Your Total</span>
              <span style={{ fontFamily: 'var(--font-poppins)', fontSize: '18px', fontWeight: 'var(--fw-bold)', color: 'var(--color-primary-text)' }}>{formatPrice(personalTotal)}</span>
            </div>
            {session && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: '14px', color: 'var(--color-secondary-text)' }}>Group Total</span>
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: '14px', color: 'var(--color-secondary-text)' }}>{formatPrice(groupTotal)}</span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ──── Others Banner ──── */}
      {session && othersOrders.length > 0 && (
        <div 
          className={`${styles.othersBanner} ${showOthers ? styles.othersBannerExpanded : ""}`}
          onClick={() => { if (!showOthers) setShowOthers(true); }}
        >
          {showOthers ? (
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }} onClick={(e) => { e.stopPropagation(); setShowOthers(false); }}>
                <span className={styles.othersBannerTitle}>
                  ▼ Others&rsquo; Orders (Total: {formatPrice(othersTotal)})
                </span>
                <i className="mgc_close_line" style={{ fontSize: "20px", cursor: "pointer" }}></i>
              </div>
              <div style={{ maxHeight: "40vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px", paddingRight: "8px" }}>
                {othersOrders.map((o, idx) => {
                  if (!o.order_items || o.order_items.length === 0) return null;
                  return (
                    <div key={o.id || idx}>
                      <p style={{ fontSize: "14px", fontWeight: "bold", color: "var(--color-outline-variant)", marginBottom: "8px" }}>
                        {o.customer_name || "Guest"}&rsquo;s Order
                      </p>
                      <div className={styles.itemsList}>
                        {o.order_items.map((item: any, i: number) => (
                          <div key={i} className={styles.itemRow} style={{ color: "var(--color-inverse-on-surface)" }}>
                            <div className={styles.itemLeft}>
                              <div className={styles.itemInfo}>
                                <span className={styles.itemName} style={{ color: "var(--color-inverse-on-surface)" }}>{item.name}</span>
                                <span className={styles.itemQty} style={{ color: "var(--color-outline-variant)" }}>
                                  Qty {item.quantity || item.qty}
                                </span>
                              </div>
                            </div>
                            <span style={{ fontWeight: "bold" }}>{formatPrice(item.price * (item.quantity || item.qty || 1))}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}
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

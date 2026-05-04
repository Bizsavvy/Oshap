"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CartProvider, useCart } from "@/context/CartContext";
import { useSession } from "@/context/SessionContext";
import BottomNav from "@/components/BottomNav";
import styles from "./page.module.css";

function OrderPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tableId = searchParams.get("table") || "T1";
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <CartProvider tableId={tableId}>
      <OrderView tableId={tableId} isSubmitting={isSubmitting} setIsSubmitting={setIsSubmitting} router={router} />
      <BottomNav tableId={tableId} />
    </CartProvider>
  );
}

function OrderView({
  tableId,
  isSubmitting,
  setIsSubmitting,
  router,
}: {
  tableId: string;
  isSubmitting: boolean;
  setIsSubmitting: (v: boolean) => void;
  router: ReturnType<typeof useRouter>;
}) {
  const { items, totalPrice, clearCart } = useCart();
  const { session, customerName } = useSession();

  const formatPrice = (amount: number) => `₦${amount.toLocaleString()}`;

  const generateReference = () => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `OSHAP-${tableId}-${rand}`;
  };

  const handleConfirmOrder = async () => {
    setIsSubmitting(true);

    try {
      // 1. Get restaurant_id for the table
      const tableRes = await fetch(`/api/table/${tableId}`);
      if (!tableRes.ok) throw new Error("Failed to fetch table details");
      const tableData = await tableRes.json();
      
      // 2. Submit order
      const payload = {
        table: tableId,
        restaurant_id: tableData.restaurant?.id || "00000000-0000-0000-0000-000000000001",
        items: items.map(i => ({ name: i.name, qty: i.quantity, price: i.price })),
        session_id: session?.id || null,
        customer_name: customerName || null,
      };

      const orderRes = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (!orderRes.ok) {
        const error = await orderRes.json();
        throw new Error(error.error || "Failed to create order");
      }
      
      const orderData = await orderRes.json();

      // Store in session storage for the payment page
      sessionStorage.setItem(
        `oshap-order-${tableId}`,
        JSON.stringify({
          id: orderData.order_id,
          reference: orderData.reference,
          items: items.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            price: i.price,
          })),
          total: totalPrice,
          table: tableId,
          createdAt: new Date().toISOString(),
        })
      );

      clearCart();
      router.push(`/pay?table=${tableId}&order_id=${orderData.order_id}&ref=${orderData.reference}`);
    } catch (err) {
      console.error("Order error:", err);
      alert("Failed to place order. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <button
            className={styles.backButton}
            onClick={() => router.push(`/menu?table=${tableId}`)}
            aria-label="Back to menu"
          >
            <i className="mgc_left_line"></i>
          </button>
          <h1 className={styles.headerTitle}>Confirm Order</h1>
        </header>

        <div className={styles.emptyState}>
          <i className={`mgc_clipboard_line ${styles.emptyIcon}`}></i>
          <h2 className={styles.emptyTitle}>No items yet</h2>
          <p className={styles.emptyText}>
            Add items from the menu to place your order
          </p>
          <button
            className={styles.backToMenuBtn}
            onClick={() => router.push(`/menu?table=${tableId}`)}
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button
          className={styles.backButton}
          onClick={() => router.push(`/menu?table=${tableId}`)}
          aria-label="Back to menu"
        >
          ←
        </button>
        <h1 className={styles.headerTitle}>Confirm Order</h1>
      </header>

      <div className={styles.content}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Order Summary</h2>
          {items.map((item) => (
            <div key={item.id} className={styles.orderItem}>
              <div className={styles.itemDetails}>
                <span className={styles.itemName}>{item.name}</span>
                <span className={styles.itemQty}>Qty: {item.quantity}</span>
              </div>
              <span className={styles.itemTotal}>
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        <div className={styles.divider} />

        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Subtotal</span>
          <span className={styles.summaryValue}>{formatPrice(totalPrice)}</span>
        </div>

        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>Total</span>
          <span className={styles.totalValue}>{formatPrice(totalPrice)}</span>
        </div>

        <button
          className={styles.confirmBtn}
          onClick={handleConfirmOrder}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Placing Order..." : "Confirm Order"}
        </button>
      </div>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading...</p>
        </div>
      }
    >
      <OrderPageContent />
    </Suspense>
  );
}

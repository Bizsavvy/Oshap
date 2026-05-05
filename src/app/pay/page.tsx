"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import styles from "./page.module.css";

interface OrderData {
  id?: string;
  reference: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  table: string;
  createdAt: string;
  combined_order_ids?: string[];
}

interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

function PayPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tableId = searchParams.get("table") || "T1";
  const refParam = searchParams.get("ref");

  const [order, setOrder] = useState<OrderData | null>(null);
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [paymentClaimed, setPaymentClaimed] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch order data from API
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);

      // Always fetch from table API for the combined view
      try {
        const tableRes = await fetch(`/api/table/${tableId}`);
        if (tableRes.ok) {
          const tableData = await tableRes.json();
          if (tableData.restaurant) {
            setBankDetails({
              bankName: tableData.restaurant.bank_name || "Access Bank",
              accountNumber: tableData.restaurant.account_number || "0123456789",
              accountName: tableData.restaurant.account_name || "Aji's Kitchen Ltd",
            });
          }

          if (tableData.active_order) {
            const orderData: OrderData = {
              id: tableData.active_order.id,
              reference: tableData.active_order.reference,
              items: [],
              total: tableData.active_order.total,
              table: tableData.active_order.table_id,
              createdAt: tableData.active_order.created_at,
              combined_order_ids: tableData.active_order.combined_order_ids || [],
            };
            setOrder(orderData);

            // Restore claimed state from sessionStorage
            try {
              const claimedKey = `oshap-claimed-${tableId}`;
              const claimedIds: string[] = JSON.parse(sessionStorage.getItem(claimedKey) || "[]");
              const currentIds: string[] = orderData.combined_order_ids!.length > 0
                ? orderData.combined_order_ids!
                : (orderData.id ? [orderData.id] : []);
              if (currentIds.length > 0 && currentIds.every((id) => claimedIds.includes(id))) {
                setPaymentClaimed(true);
              }
            } catch { /* noop */ }

            try {
              sessionStorage.setItem(`oshap-order-${tableId}`, JSON.stringify(orderData));
            } catch { /* noop */ }
            setIsLoading(false);
            return;
          }
        }
      } catch {
        // Fall back to sessionStorage below
      }

      // Fallback: sessionStorage
      try {
        const saved = sessionStorage.getItem(`oshap-order-${tableId}`);
        if (saved) setOrder(JSON.parse(saved));
      } catch {
        // sessionStorage unavailable
      }

      setIsLoading(false);
    }

    loadData();
  }, [tableId]);

  // After claiming, poll table API to detect waiter confirmation
  useEffect(() => {
    if (!paymentClaimed || paymentConfirmed) return;

    const checkConfirmation = async () => {
      try {
        const tableRes = await fetch(`/api/table/${tableId}`);
        if (!tableRes.ok) return;
        const tableData = await tableRes.json();
        const activeOrder = tableData.active_order;

        const claimedIds: string[] = order?.combined_order_ids || (order?.id ? [order.id] : []);

        if (!activeOrder) {
          // No active orders at all = everything settled
          setPaymentConfirmed(true);
          if (pollRef.current) clearInterval(pollRef.current);
          return;
        }

        if (claimedIds.length > 0) {
          const stillActive = activeOrder.combined_order_ids?.some(
            (id: string) => claimedIds.includes(id)
          );
          if (!stillActive) {
            setPaymentConfirmed(true);
            if (pollRef.current) clearInterval(pollRef.current);
          }
        }
      } catch { /* ignore polling errors */ }
    };

    checkConfirmation();
    pollRef.current = setInterval(checkConfirmation, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [paymentClaimed, paymentConfirmed, order?.id, order?.combined_order_ids, tableId]);

  // Clear sessionStorage when waiter confirms
  useEffect(() => {
    if (paymentConfirmed) {
      try {
        sessionStorage.removeItem(`oshap-order-${tableId}`);
        sessionStorage.removeItem(`oshap-claimed-${tableId}`);
      } catch { /* noop */ }
    }
  }, [paymentConfirmed, tableId]);

  // Default bank details if API didn't return any
  const bank = bankDetails || {
    bankName: "Access Bank",
    accountNumber: "0123456789",
    accountName: "Aji's Kitchen Ltd",
  };

  const reference = refParam || order?.reference || "";
  const total = order?.total || 0;

  const formatPrice = (amount: number) => `₦${amount.toLocaleString()}`;

  const copyToClipboard = useCallback(
    async (text: string, field: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
      } catch {
        // Clipboard unavailable
      }
    },
    []
  );

  const handleClaimPayment = async () => {
    setIsSubmitting(true);
    try {
      const proof_url = null;
      const order_id = order?.id;
      const combined_order_ids = order?.combined_order_ids || [];

      if (!order_id && combined_order_ids.length === 0) {
        throw new Error("Order ID not found");
      }

      const res = await fetch("/api/payment/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id, combined_order_ids, proof_url }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to confirm payment");
      }

      setPaymentClaimed(true);

      // Persist claimed IDs so state survives tab switches
      try {
        const claimedKey = `oshap-claimed-${tableId}`;
        const existing: string[] = JSON.parse(sessionStorage.getItem(claimedKey) || "[]");
        const newIds = combined_order_ids.length > 0 ? combined_order_ids : (order_id ? [order_id] : []);
        const merged = [...new Set([...existing, ...newIds])];
        sessionStorage.setItem(claimedKey, JSON.stringify(merged));
      } catch { /* noop */ }
    } catch (err) {
      console.error("Payment confirmation error:", err);
      alert("Failed to confirm payment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading payment details…</p>
        </div>
        <BottomNav tableId={tableId} />
      </div>
    );
  }

  if (!order && !refParam) {
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
          <h1 className={styles.headerTitle}>Pay Bill</h1>
        </header>
        <div className={styles.emptyState}>
          <i className={`mgc_bank_card_line ${styles.emptyIcon}`}></i>
          <h2 className={styles.emptyTitle}>No active order</h2>
          <p className={styles.emptyText}>
            Place an order first to see your payment details
          </p>
          <button
            className={styles.backToMenuBtn}
            onClick={() => router.push(`/menu?table=${tableId}`)}
          >
            Browse Menu
          </button>
        </div>
        <BottomNav tableId={tableId} />
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
          <i className="mgc_left_line"></i>
        </button>
        <h1 className={styles.headerTitle}>Pay Bill</h1>
      </header>

      <div className={styles.content}>
        {paymentConfirmed ? (
          <div className={styles.confirmedBanner}>
            <i className={`mgc_check_double_fill ${styles.confirmedIcon}`}></i>
            <h2 className={styles.confirmedTitle}>Payment Confirmed!</h2>
            <p className={styles.confirmedText}>
              The restaurant has verified your payment. Enjoy your meal!
            </p>
          </div>
        ) : paymentClaimed ? (
          <div className={styles.confirmedBanner}>
            <i className={`mgc_check_circle_fill ${styles.confirmedIcon}`}></i>
            <h2 className={styles.confirmedTitle}>Payment Claimed!</h2>
            <p className={styles.confirmedText}>
              We&apos;ve notified the restaurant. They&apos;ll verify your
              payment shortly.
            </p>
          </div>
        ) : (
          <div className={styles.statusBanner}>
            <i className={`mgc_time_line ${styles.statusIcon}`}></i>
            <div className={styles.statusContent}>
              <div className={styles.statusTitle}>Payment Pending</div>
              <div className={styles.statusSubtitle}>
                Transfer to the account below
              </div>
            </div>
          </div>
        )}

        {/* Amount */}
        <div className={styles.amountSection}>
          <div className={styles.amountLabel}>Amount to Pay</div>
          <div className={styles.amountValue}>{formatPrice(total)}</div>
        </div>

        {/* Bank details */}
        <div className={styles.paymentCard}>
          <h2 className={styles.cardTitle}>Bank Transfer Details</h2>

          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Bank Name</span>
            <span className={styles.detailValue}>{bank.bankName}</span>
          </div>

          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Account Number</span>
            <div className={styles.detailValueRow}>
              <span className={styles.detailValue}>
                {bank.accountNumber}
              </span>
              <button
                className={`${styles.copyBtn} ${copiedField === "account" ? styles.copiedBtn : ""}`}
                onClick={() =>
                  copyToClipboard(bank.accountNumber, "account")
                }
                aria-label="Copy account number"
              >
                <i
                  className={
                    copiedField === "account"
                      ? "mgc_check_line"
                      : "mgc_clipboard_line"
                  }
                ></i>
              </button>
            </div>
          </div>

          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Account Name</span>
            <span className={styles.detailValue}>{bank.accountName}</span>
          </div>

          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Payment Reference</span>
            <div className={styles.detailValueRow}>
              <span className={styles.detailValue}>{reference}</span>
              <button
                className={`${styles.copyBtn} ${copiedField === "ref" ? styles.copiedBtn : ""}`}
                onClick={() => copyToClipboard(reference, "ref")}
                aria-label="Copy reference"
              >
                <i
                  className={
                    copiedField === "ref"
                      ? "mgc_check_line"
                      : "mgc_clipboard_line"
                  }
                ></i>
              </button>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className={styles.ctaSection}>
          {!paymentClaimed && !paymentConfirmed && (
            <button
              className={styles.confirmPaymentBtn}
              onClick={handleClaimPayment}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "I've Sent the Money"}
            </button>
          )}
          <button
            className={styles.orderMoreBtn}
            onClick={() => router.push(`/menu?table=${tableId}`)}
          >
            {paymentConfirmed ? "Back to Menu" : "Order More"}
          </button>
        </div>
      </div>

      <BottomNav tableId={tableId} />
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading payment details...</p>
        </div>
      }
    >
      <PayPageContent />
    </Suspense>
  );
}

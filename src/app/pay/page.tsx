"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import styles from "./page.module.css";

interface OrderData {
  id?: string;
  reference: string;
  total: number;
  table: string;
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

  const [unpaidOrder, setUnpaidOrder] = useState<OrderData | null>(null);
  const [pendingPayments, setPendingPayments] = useState<OrderData | null>(null);
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Poll server for exact state
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const tableRes = await fetch(`/api/table/${tableId}`);
        if (tableRes.ok) {
          const tableData = await tableRes.json();
          if (!isMounted) return;

          if (tableData.restaurant) {
            setBankDetails({
              bankName: tableData.restaurant.bank_name || "Access Bank",
              accountNumber: tableData.restaurant.account_number || "0123456789",
              accountName: tableData.restaurant.account_name || "Aji's Kitchen Ltd",
            });
          }

          setUnpaidOrder(tableData.unpaid_order || null);
          setPendingPayments(tableData.pending_payments || null);
        }
      } catch (err) {
        console.error("Failed to fetch table data", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();
    const interval = setInterval(loadData, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [tableId]);

  const bank = bankDetails || {
    bankName: "Access Bank",
    accountNumber: "0123456789",
    accountName: "Aji's Kitchen Ltd",
  };

  const formatPrice = (amount: number) => `₦${amount.toLocaleString()}`;

  const copyToClipboard = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Clipboard unavailable
    }
  }, []);

  const handleClaimPayment = async () => {
    if (!unpaidOrder) return;
    setIsSubmitting(true);
    try {
      const order_id = unpaidOrder.id;
      const combined_order_ids = unpaidOrder.combined_order_ids || [];

      if (!order_id && combined_order_ids.length === 0) {
        throw new Error("Order ID not found");
      }

      const res = await fetch("/api/payment/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id, combined_order_ids, proof_url: null }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to confirm payment");
      }

      // Optimistically move unpaid to pending
      setPendingPayments(unpaidOrder);
      setUnpaidOrder(null);
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

  // Case 1: No unpaid orders and no pending payments (clean slate)
  if (!unpaidOrder && !pendingPayments && !refParam) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <button className={styles.backButton} onClick={() => router.push(`/menu?table=${tableId}`)}>
            <i className="mgc_left_line"></i>
          </button>
          <h1 className={styles.headerTitle}>Pay Bill</h1>
        </header>
        <div className={styles.emptyState}>
          <i className={`mgc_check_double_fill ${styles.emptyIcon}`} style={{ color: "var(--color-primary)" }}></i>
          <h2 className={styles.emptyTitle}>All Settled</h2>
          <p className={styles.emptyText}>You have no pending bills. Ready for more?</p>
          <button className={styles.backToMenuBtn} onClick={() => router.push(`/menu?table=${tableId}`)}>
            Browse Menu
          </button>
        </div>
        <BottomNav tableId={tableId} />
      </div>
    );
  }

  // Case 2: No unpaid orders, but waiting for restaurant to verify previously claimed payments
  if (!unpaidOrder && pendingPayments) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <button className={styles.backButton} onClick={() => router.push(`/menu?table=${tableId}`)}>
            <i className="mgc_left_line"></i>
          </button>
          <h1 className={styles.headerTitle}>Pay Bill</h1>
        </header>
        <div className={styles.emptyState}>
          <i className={`mgc_time_line ${styles.emptyIcon}`}></i>
          <h2 className={styles.emptyTitle}>Payment Claimed</h2>
          <p className={styles.emptyText}>
            We've notified the restaurant. They will verify your payment of {formatPrice(pendingPayments.total)} shortly.
          </p>
          <button className={styles.backToMenuBtn} onClick={() => router.push(`/menu?table=${tableId}`)}>
            Order More
          </button>
        </div>
        <BottomNav tableId={tableId} />
      </div>
    );
  }

  // Case 3: We have unpaid orders (might ALSO have pending payments from a previous batch)
  const total = unpaidOrder?.total || 0;
  const reference = refParam || unpaidOrder?.reference || "";

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => router.push(`/menu?table=${tableId}`)}>
          <i className="mgc_left_line"></i>
        </button>
        <h1 className={styles.headerTitle}>Pay Bill</h1>
      </header>

      <div className={styles.content}>
        {pendingPayments && (
          <div className={styles.confirmedBanner} style={{ marginBottom: "var(--spacing-md)" }}>
            <i className="mgc_information_line" style={{ fontSize: "24px" }}></i>
            <div style={{ textAlign: "left" }}>
              <strong style={{ display: "block" }}>Notice</strong>
              <span style={{ fontSize: "14px" }}>You have a previous payment of {formatPrice(pendingPayments.total)} waiting for verification. The bill below is only for your new items.</span>
            </div>
          </div>
        )}

        <div className={styles.statusBanner}>
          <i className={`mgc_bank_card_line ${styles.statusIcon}`}></i>
          <div className={styles.statusContent}>
            <div className={styles.statusTitle}>Payment Required</div>
            <div className={styles.statusSubtitle}>Transfer to the account below</div>
          </div>
        </div>

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
              <span className={styles.detailValue}>{bank.accountNumber}</span>
              <button
                className={`${styles.copyBtn} ${copiedField === "account" ? styles.copiedBtn : ""}`}
                onClick={() => copyToClipboard(bank.accountNumber, "account")}
                aria-label="Copy account number"
              >
                <i className={copiedField === "account" ? "mgc_check_line" : "mgc_clipboard_line"}></i>
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
                <i className={copiedField === "ref" ? "mgc_check_line" : "mgc_clipboard_line"}></i>
              </button>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className={styles.ctaSection}>
          <button className={styles.confirmPaymentBtn} onClick={handleClaimPayment} disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "I've Sent the Money"}
          </button>
          <button className={styles.orderMoreBtn} onClick={() => router.push(`/menu?table=${tableId}`)}>
            Order More
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

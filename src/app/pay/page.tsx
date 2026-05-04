"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "./page.module.css";

interface OrderData {
  id?: string;
  reference: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  table: string;
  createdAt: string;
}

/* Demo restaurant payment details */
const RESTAURANT_BANK = {
  bankName: "Access Bank",
  accountNumber: "0123456789",
  accountName: "Aji's Kitchen Ltd",
};

function PayPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tableId = searchParams.get("table") || "T1";
  const refParam = searchParams.get("ref");

  const [order, setOrder] = useState<OrderData | null>(null);
  const [paymentClaimed, setPaymentClaimed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(`oshap-order-${tableId}`);
      if (saved) {
        setOrder(JSON.parse(saved));
      }
    } catch {
      // sessionStorage unavailable
    }
  }, [tableId]);

  const reference = refParam || order?.reference || "";
  const total = order?.total || 0;

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
    setIsSubmitting(true);
    try {
      // In a real scenario, we might upload proof of payment first and pass the URL
      const proof_url = null; 
      const order_id = searchParams.get("order_id") || order?.id;

      if (!order_id) {
        throw new Error("Order ID not found");
      }

      const res = await fetch("/api/payment/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id, proof_url }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to confirm payment");
      }

      setPaymentClaimed(true);
    } catch (err) {
      console.error("Payment confirmation error:", err);
      alert("Failed to confirm payment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <h1 className={styles.headerTitle}>Pay Bill</h1>
      </header>

      <div className={styles.content}>
        {paymentClaimed ? (
          <div className={styles.confirmedBanner}>
            <i className={`mgc_check_circle_fill ${styles.confirmedIcon}`}></i>
            <h2 className={styles.confirmedTitle}>Payment Claimed!</h2>
            <p className={styles.confirmedText}>
              We&apos;ve notified the restaurant. They&apos;ll verify your payment shortly.
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
            <span className={styles.detailValue}>
              {RESTAURANT_BANK.bankName}
            </span>
          </div>

          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Account Number</span>
            <div className={styles.detailValueRow}>
              <span className={styles.detailValue}>
                {RESTAURANT_BANK.accountNumber}
              </span>
              <button
                className={`${styles.copyBtn} ${copiedField === "account" ? styles.copiedBtn : ""}`}
                onClick={() =>
                  copyToClipboard(RESTAURANT_BANK.accountNumber, "account")
                }
                aria-label="Copy account number"
              >
                <i className={copiedField === "account" ? "mgc_check_line" : "mgc_clipboard_line"}></i>
              </button>
            </div>
          </div>

          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Account Name</span>
            <span className={styles.detailValue}>
              {RESTAURANT_BANK.accountName}
            </span>
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
          {!paymentClaimed && (
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
            Order More
          </button>
        </div>
      </div>
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

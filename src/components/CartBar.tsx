"use client";

import { useCart } from "@/context/CartContext";
import styles from "./CartBar.module.css";

export default function CartBar({ tableId }: { tableId: string }) {
  const { totalItems, totalPrice, setIsCartOpen } = useCart();

  if (totalItems === 0) return null;

  const formatPrice = (amount: number) => `₦${amount.toLocaleString()}`;

  return (
    <div className={styles.cartBar}>
      <div className={styles.cartBarInner} onClick={() => setIsCartOpen(true)}>
        <div className={styles.cartBarLeft}>
          <span className={styles.cartCount}>{totalItems}</span>
          <span className={styles.cartLabel}>View Cart</span>
        </div>
        <span className={styles.cartTotal}>{formatPrice(totalPrice)}</span>
      </div>
    </div>
  );
}

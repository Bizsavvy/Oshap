"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import styles from "./BottomNav.module.css";

interface BottomNavProps {
  tableId: string;
}

export default function BottomNav({ tableId }: BottomNavProps) {
  const pathname = usePathname();
  const { totalItems, setIsCartOpen } = useCart();

  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <nav className={styles.nav} aria-label="Main navigation">
      <Link
        href={`/menu?table=${tableId}`}
        className={`${styles.navItem} ${isActive("/menu") ? styles.navItemActive : ""}`}
      >
        <i className={`mgc_book_4_line ${styles.navIcon}`}></i>
        <span className={styles.navLabel}>Menu</span>
      </Link>

      <button
        className={`${styles.navItem} ${isActive("/order") ? styles.navItemActive : ""}`}
        onClick={() => setIsCartOpen(true)}
      >
        <i className={`mgc_shopping_cart_1_line ${styles.navIcon}`}></i>
        {totalItems > 0 && (
          <span className={styles.badge}>{totalItems}</span>
        )}
        <span className={styles.navLabel}>Orders</span>
      </button>

      <Link
        href={`/pay?table=${tableId}`}
        className={`${styles.navItem} ${isActive("/pay") ? styles.navItemActive : ""}`}
      >
        <i className={`mgc_bank_card_line ${styles.navIcon}`}></i>
        <span className={styles.navLabel}>Pay Bill</span>
      </Link>
    </nav>
  );
}

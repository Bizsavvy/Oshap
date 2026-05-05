"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import styles from "./BottomNav.module.css";

interface BottomNavProps {
  tableId: string;
}

export default function BottomNav({ tableId }: BottomNavProps) {
  const pathname = usePathname();

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

      <Link
        href={`/orders?table=${tableId}`}
        className={`${styles.navItem} ${isActive("/orders") ? styles.navItemActive : ""}`}
      >
        <i className={`mgc_group_line ${styles.navIcon}`}></i>
        <span className={styles.navLabel}>My Orders</span>
      </Link>

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

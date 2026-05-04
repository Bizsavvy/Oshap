"use client";

import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import styles from "./CartDrawer.module.css";

interface CartDrawerProps {
  tableId: string;
}

export default function CartDrawer({ tableId }: CartDrawerProps) {
  const {
    items,
    totalItems,
    totalPrice,
    updateQuantity,
    isCartOpen,
    setIsCartOpen,
  } = useCart();
  const router = useRouter();

  if (!isCartOpen) return null;

  const formatPrice = (amount: number) => `₦${amount.toLocaleString()}`;

  const handlePlaceOrder = () => {
    setIsCartOpen(false);
    router.push(`/order?table=${tableId}`);
  };

  return (
    <>
      <div className={styles.overlay} onClick={() => setIsCartOpen(false)} />
      <div className={styles.drawer} role="dialog" aria-label="Your cart">
        <div className={styles.handle}>
          <div className={styles.handleBar} />
        </div>

        <div className={styles.header}>
          <h2 className={styles.title}>Your Order ({totalItems})</h2>
          <button
            className={styles.closeButton}
            onClick={() => setIsCartOpen(false)}
            aria-label="Close cart"
          >
            <i className="mgc_close_line"></i>
          </button>
        </div>

        {items.length === 0 ? (
          <div className={styles.emptyCart}>
            <i className={`mgc_shopping_cart_1_line ${styles.emptyIcon}`}></i>
            <p className={styles.emptyText}>Your cart is empty</p>
          </div>
        ) : (
          <>
            <div className={styles.itemsList}>
              {items.map((item) => (
                <div key={item.id} className={styles.cartItem}>
                  <div className={styles.itemInfo}>
                    <div className={styles.itemName}>{item.name}</div>
                    <div className={styles.itemPrice}>
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                  <div className={styles.itemControls}>
                    <button
                      className={styles.controlBtn}
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      aria-label={`Decrease ${item.name}`}
                    >
                      <i className="mgc_minimize_line"></i>
                    </button>
                    <span className={styles.itemQty}>{item.quantity}</span>
                    <button
                      className={styles.controlBtn}
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      aria-label={`Increase ${item.name}`}
                    >
                      <i className="mgc_add_line"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.footer}>
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Total</span>
                <span className={styles.totalValue}>
                  {formatPrice(totalPrice)}
                </span>
              </div>
              <button
                className={styles.placeOrderBtn}
                onClick={handlePlaceOrder}
                disabled={totalItems === 0}
              >
                Place Order
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

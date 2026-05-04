"use client";

import { useCart } from "@/context/CartContext";
import styles from "./MenuCard.module.css";

interface MenuCardProps {
  id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
}

export default function MenuCard({
  id,
  name,
  price,
  description,
  image,
}: MenuCardProps) {
  const { items, addItem, updateQuantity } = useCart();
  const cartItem = items.find((i) => i.id === id);
  const quantity = cartItem?.quantity ?? 0;

  const formatPrice = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  return (
    <article className={styles.card}>
      <div className={styles.imageWrapper}>
        {image ? (
          <img src={image} alt={name} className={styles.image} loading="lazy" />
        ) : (
          <div className={styles.imagePlaceholder}><i className="mgc_fork_spoon_line"></i></div>
        )}
      </div>

      <div className={styles.details}>
        <div>
          <h3 className={styles.name}>{name}</h3>
          {description && <p className={styles.description}>{description}</p>}
        </div>

        <div className={styles.footer}>
          <span className={styles.price}>{formatPrice(price)}</span>

          {quantity === 0 ? (
            <button
              className={styles.addButton}
              onClick={() => addItem({ id, name, price, image })}
              aria-label={`Add ${name} to cart`}
            >
              ADD
            </button>
          ) : (
            <div className={styles.quantityControl}>
              <button
                className={styles.qtyButton}
                onClick={() => updateQuantity(id, quantity - 1)}
                aria-label={`Decrease ${name} quantity`}
              >
                <i className="mgc_minimize_line"></i>
              </button>
              <span className={styles.qtyCount}>{quantity}</span>
              <button
                className={styles.qtyButton}
                onClick={() => updateQuantity(id, quantity + 1)}
                aria-label={`Increase ${name} quantity`}
              >
                <i className="mgc_add_line"></i>
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

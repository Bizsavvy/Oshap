"use client";

import styles from "./CategoryTabs.module.css";

interface Category {
  name: string;
  image?: string;
}

interface CategoryTabsProps {
  categories: Category[];
  activeCategory: string;
  onSelect: (category: string) => void;
}

export default function CategoryTabs({
  categories,
  activeCategory,
  onSelect,
}: CategoryTabsProps) {
  return (
    <nav className={styles.tabs} aria-label="Menu categories">
      {categories.map((cat) => (
        <button
          key={cat.name}
          className={`${styles.tab} ${activeCategory === cat.name ? styles.tabActive : ""}`}
          onClick={() => onSelect(cat.name)}
          aria-pressed={activeCategory === cat.name}
        >
          {cat.image && (
            <img
              src={cat.image}
              alt={cat.name}
              className={styles.tabImage}
              loading="lazy"
            />
          )}
          <span className={styles.tabLabel}>{cat.name}</span>
        </button>
      ))}
    </nav>
  );
}

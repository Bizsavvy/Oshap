"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CartProvider, useCart } from "@/context/CartContext";
import CategoryTabs from "@/components/CategoryTabs";
import MenuCard from "@/components/MenuCard";
import CartDrawer from "@/components/CartDrawer";
import CartBar from "@/components/CartBar";
import BottomNav from "@/components/BottomNav";
import styles from "./page.module.css";

/* ===== Demo Data for Aji's Kitchen ===== */
const DEMO_MENU = [
  {
    id: "1",
    name: "Chicken Shawarma",
    price: 2500,
    category: "Meals",
    description: "Grilled chicken wrap with garlic sauce, pickles and fries",
    image_url: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=400&q=80",
  },
  {
    id: "2",
    name: "Beef Shawarma",
    price: 3000,
    category: "Meals",
    description: "Tender beef strips with tahini sauce and fresh vegetables",
    image_url: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80",
  },
  {
    id: "3",
    name: "Jollof Rice & Chicken",
    price: 3500,
    category: "Meals",
    description: "Party-style jollof rice with a perfectly grilled chicken thigh",
    image_url: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&q=80",
  },
  {
    id: "4",
    name: "Fried Rice & Turkey",
    price: 4000,
    category: "Meals",
    description: "Vegetable fried rice served with peppered turkey",
    image_url: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&q=80",
  },
  {
    id: "5",
    name: "Peppered Chicken",
    price: 2000,
    category: "Meals",
    description: "Spicy fried chicken in a pepper sauce",
    image_url: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&q=80",
  },
  {
    id: "6",
    name: "Suya Platter",
    price: 3000,
    category: "Grills",
    description: "Grilled beef skewers with yaji spice, onions and tomatoes",
    image_url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80",
  },
  {
    id: "7",
    name: "Grilled Fish",
    price: 5000,
    category: "Grills",
    description: "Whole catfish grilled with pepper sauce and plantain",
    image_url: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80",
  },
  {
    id: "8",
    name: "Asun",
    price: 3500,
    category: "Grills",
    description: "Spicy smoked goat meat with peppers and onions",
    image_url: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80",
  },
  {
    id: "9",
    name: "Chapman",
    price: 1500,
    category: "Drinks",
    description: "Classic Nigerian cocktail with Fanta, Sprite and bitters",
    image_url: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80",
  },
  {
    id: "10",
    name: "Zobo",
    price: 800,
    category: "Drinks",
    description: "Refreshing hibiscus drink with ginger and pineapple",
    image_url: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80",
  },
  {
    id: "11",
    name: "Fresh Orange Juice",
    price: 1200,
    category: "Drinks",
    description: "Freshly squeezed orange juice, no sugar added",
    image_url: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80",
  },
  {
    id: "12",
    name: "Coca-Cola",
    price: 500,
    category: "Drinks",
    description: "Classic Coca-Cola 50cl bottle",
    image_url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80",
  },
  {
    id: "13",
    name: "Malt",
    price: 600,
    category: "Drinks",
    description: "Amstel Malt 50cl bottle",
    image_url: "https://images.unsplash.com/photo-1558645836-e44122a743ee?w=400&q=80",
  },
  {
    id: "14",
    name: "Puff Puff",
    price: 500,
    category: "Sides",
    description: "6 pieces of fluffy Nigerian doughnuts",
    image_url: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&q=80",
  },
  {
    id: "15",
    name: "Plantain Chips",
    price: 800,
    category: "Sides",
    description: "Crunchy plantain chips with a spicy dip",
    image_url: "https://images.unsplash.com/photo-1599487405259-2a2b7e2898fb?w=400&q=80",
  },
  {
    id: "16",
    name: "French Fries",
    price: 1000,
    category: "Sides",
    description: "Golden crispy fries with ketchup",
    image_url: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80",
  },
  {
    id: "17",
    name: "Coleslaw",
    price: 500,
    category: "Sides",
    description: "Fresh coleslaw with creamy dressing",
    image_url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80",
  },
];

const CATEGORIES = [
  { name: "All" },
  { name: "Meals" },
  { name: "Grills" },
  { name: "Drinks" },
  { name: "Sides" },
];

function MenuPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tableId = searchParams.get("table") || "T1";
  
  const [activeCategory, setActiveCategory] = useState("All");
  const [menuItems, setMenuItems] = useState(DEMO_MENU);
  const [restaurantName, setRestaurantName] = useState("Aji's Kitchen");
  const [categories, setCategories] = useState(CATEGORIES);
  const [isLoading, setIsLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        // 1. Fetch table and restaurant info
        const tableRes = await fetch(`/api/table/${tableId}`);
        let restaurantId = null;
        
        if (tableRes.ok) {
          const tableData = await tableRes.json();
          if (tableData.restaurant) {
            setRestaurantName(tableData.restaurant.name);
            restaurantId = tableData.restaurant.id;
          }
        }

        // 2. Fetch menu items
        const menuUrl = restaurantId ? `/api/menu?restaurant_id=${restaurantId}` : `/api/menu`;
        const menuRes = await fetch(menuUrl);
        
        if (menuRes.ok) {
          const menuData = await menuRes.json();
          if (menuData && menuData.length > 0) {
            setMenuItems(menuData);
            
            // Extract unique categories
            const cats = new Set(menuData.map((item: any) => item.category));
            setCategories([{ name: "All" }, ...Array.from(cats).map(name => ({ name: name as string }))]);
          }
        }
      } catch (err) {
        console.error("Failed to load menu data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [tableId]);

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    const matchesSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <CartProvider tableId={tableId}>
      <div className={styles.page}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.restaurantName}>{restaurantName}</h1>
            <span className={styles.tableBadge}>Table: {tableId}</span>
          </div>
          <button
            className={styles.searchButton}
            aria-label="Search menu"
            onClick={() => { setSearchOpen(!searchOpen); if (searchOpen) setSearchQuery(""); }}
          >
            <i className={searchOpen ? "mgc_close_line" : "mgc_search_line"} style={{ fontSize: "20px" }}></i>
          </button>
        </header>

        {/* Search bar */}
        {searchOpen && (
          <div className={styles.searchBar}>
            <i className="mgc_search_line" style={{ fontSize: "18px", color: "var(--color-secondary-text)" }}></i>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search menu items…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
        )}

        {/* Order Together */}
        <div className={styles.orderTogether} onClick={() => router.push(`/orders?table=${tableId}`)}>
          <div className={styles.orderTogetherLeft}>
            <div className={styles.avatarGroup}>
              <div className={styles.avatar} style={{ backgroundImage: "url('/avatar1.png')" }} />
              <div className={styles.avatar} style={{ backgroundImage: "url('/avatar2.png')" }} />
              <div className={`${styles.avatar} ${styles.avatarMore}`}>+3</div>
            </div>
            <span className={styles.orderTogetherText}>Order Together</span>
          </div>
          <i className={`mgc_right_line ${styles.orderTogetherRight}`}></i>
        </div>

        {/* Category tabs */}
        <div className={styles.categoriesWrapper}>
          <CategoryTabs
            categories={categories}
            activeCategory={activeCategory}
            onSelect={setActiveCategory}
          />
        </div>

        {/* Menu items */}
        <section className={styles.menuSection}>
          <h2 className={styles.sectionTitle}>
            {activeCategory === "All" ? "Full Menu" : activeCategory}
          </h2>
          
          {isLoading ? (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <p>Loading menu...</p>
            </div>
          ) : (
            <div className={styles.itemsList}>
              {filteredItems.map((item: any) => (
                <MenuCard
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  price={item.price}
                  description={item.description}
                  image={item.image_url}
                />
              ))}
              {filteredItems.length === 0 && (
                <p style={{ textAlign: "center", color: "var(--color-secondary-text)", marginTop: "2rem" }}>
                  No items found in this category.
                </p>
              )}
            </div>
          )}
        </section>

        {/* Floating cart bar */}
        <CartBar tableId={tableId} />

        {/* Cart drawer */}
        <CartDrawer tableId={tableId} />

        {/* Bottom navigation */}
        <BottomNav tableId={tableId} />
      </div>
    </CartProvider>
  );
}

export default function MenuPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading menu...</p>
        </div>
      }
    >
      <MenuPageContent />
    </Suspense>
  );
}

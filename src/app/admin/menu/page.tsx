"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const AUTH_KEY = "oshap-admin-auth";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string | null;
  image_url: string | null;
  available: boolean;
  sort_order: number;
}

function getHeaders() {
  return {
    "Content-Type": "application/json",
    "x-admin-pin": sessionStorage.getItem(AUTH_KEY) || "",
  };
}

export default function MenuManagement() {
  const router = useRouter();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  const [form, setForm] = useState({ name: "", price: "", category: "Meals", description: "", image_url: "" });

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/admin/menu", { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      } else if (res.status === 401) {
        router.push("/admin");
      }
    } catch (err) {
      console.error("Failed to fetch menu", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleToggleAvailable = async (item: MenuItem) => {
    const res = await fetch(`/api/admin/menu/${item.id}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ available: !item.available }),
    });
    if (res.ok) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, available: !item.available } : i))
      );
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      price: String(item.price),
      category: item.category,
      description: item.description || "",
      image_url: item.image_url || "",
    });
  };

  const handleSave = async (id: string) => {
    setSavingId(id);
    const res = await fetch(`/api/admin/menu/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const updated = await res.json();
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
      setEditingId(null);
    } else {
      alert("Failed to save");
    }
    setSavingId(null);
  };

  const handleCreate = async () => {
    if (!form.name || !form.price || !form.category) {
      alert("Name, price, and category are required.");
      return;
    }
    setSavingId("new");
    const res = await fetch("/api/admin/menu", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const created = await res.json();
      setItems((prev) => [...prev, created]);
      setShowNewForm(false);
      setForm({ name: "", price: "", category: "Meals", description: "", image_url: "" });
    } else {
      alert("Failed to create item");
    }
    setSavingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    const res = await fetch(`/api/admin/menu/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    } else {
      alert("Failed to delete");
    }
  };

  const formatPrice = (p: number) => `₦${p.toLocaleString()}`;

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Menu Management</h1>
        <button
          className={styles.addBtn}
          onClick={() => { setShowNewForm(true); setEditingId(null); setForm({ name: "", price: "", category: "Meals", description: "", image_url: "" }); }}
        >
          + Add Item
        </button>
      </header>

      <div className={styles.content}>
        {/* New item form */}
        {showNewForm && (
          <div className={styles.editCard}>
            <h3 className={styles.editTitle}>New Menu Item</h3>
            <div className={styles.formGrid}>
              <input className={styles.formInput} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className={styles.formInput} placeholder="Price (e.g. 2500)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              <select className={styles.formInput} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option>Meals</option>
                <option>Grills</option>
                <option>Drinks</option>
                <option>Sides</option>
              </select>
              <input className={styles.formInput} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <input className={styles.formInput} placeholder="Image URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            </div>
            <div className={styles.editActions}>
              <button className={styles.cancelBtn} onClick={() => setShowNewForm(false)}>Cancel</button>
              <button className={styles.saveBtn} onClick={handleCreate} disabled={savingId === "new"}>
                {savingId === "new" ? "Saving..." : "Create"}
              </button>
            </div>
          </div>
        )}

        {/* Items list */}
        <div className={styles.list}>
          {items.map((item) => (
            <div key={item.id} className={`${styles.itemCard} ${!item.available ? styles.itemUnavailable : ""}`}>
              {editingId === item.id ? (
                <div className={styles.editCard}>
                  <h3 className={styles.editTitle}>Edit {item.name}</h3>
                  <div className={styles.formGrid}>
                    <input className={styles.formInput} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    <input className={styles.formInput} placeholder="Price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                    <select className={styles.formInput} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                      <option>Meals</option>
                      <option>Grills</option>
                      <option>Drinks</option>
                      <option>Sides</option>
                    </select>
                    <input className={styles.formInput} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    <input className={styles.formInput} placeholder="Image URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
                  </div>
                  <div className={styles.editActions}>
                    <button className={styles.cancelBtn} onClick={() => setEditingId(null)}>Cancel</button>
                    <button className={styles.saveBtn} onClick={() => handleSave(item.id)} disabled={savingId === item.id}>
                      {savingId === item.id ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.itemRow}>
                  <div className={styles.itemMain}>
                    <div className={styles.itemLeft}>
                      <span className={styles.itemName}>{item.name}</span>
                      <span className={styles.itemMeta}>
                        {item.category} · {formatPrice(item.price)}
                      </span>
                      {item.description && (
                        <span className={styles.itemDesc}>{item.description}</span>
                      )}
                    </div>
                    <div className={styles.itemRight}>
                      <span className={`${styles.statusDot} ${item.available ? styles.dotActive : styles.dotInactive}`} />
                      <span className={styles.statusText}>{item.available ? "Available" : "Unavailable"}</span>
                    </div>
                  </div>
                  <div className={styles.itemActions}>
                    <button className={styles.toggleBtn} onClick={() => handleToggleAvailable(item)}>
                      {item.available ? "Mark Unavailable" : "Mark Available"}
                    </button>
                    <button className={styles.editBtn} onClick={() => handleEdit(item)}>Edit</button>
                    <button className={styles.deleteBtn} onClick={() => handleDelete(item.id)}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {items.length === 0 && (
            <div className={styles.empty}>
              <p>No menu items yet. Click &quot;+ Add Item&quot; to create one.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

# Oshap Data Model

---

## 🧾 Order

- id
- table_id
- restaurant_id
- status (CREATED, PAYMENT_PENDING, CONFIRMED)
- total
- reference
- created_at

---

## 🍽️ OrderItem

- id
- order_id
- name
- quantity
- price

---

## 🪑 Table

- id (e.g. T12)
- restaurant_id
- status (OPEN, CLOSED)

---

## 🏪 Restaurant

- id
- name
- bank_name
- account_number
- whatsapp_number

---

## 💳 Payment

- id
- order_id
- amount
- status (NOT_PAID, CLAIMED, VERIFIED)
- proof_url (optional)

---
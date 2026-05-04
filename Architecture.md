# Oshap Architecture

---

## 🧩 Components

### 1. Frontend (Web App)
- Loads menu
- Manages cart
- Handles table session
- Sends orders

---

### 2. Backend (API)
- Processes orders
- Generates payment references
- Sends WhatsApp messages

---

### 3. Database
- Stores:
  - Orders
  - Tables
  - Restaurants
  - Payments

---

### 4. WhatsApp Integration
- Sends:
  - Orders
  - Payment alerts
  - Summaries

---

## 🔄 Data Flow

```text
QR Scan → Web App → API → Database → WhatsApp → Restaurant
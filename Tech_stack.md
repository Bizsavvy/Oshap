# Oshap Tech Stack

## Version: MVP → V1

---

# 🎯 Philosophy

- Ship fast (days, not weeks)
- Keep infrastructure simple
- Minimize operational overhead
- Build for scale *only when needed*

---

# 🖥️ 1. Frontend (Customer Web App)

## Stack: Next.js (React)

### Why
- Fast development
- Optimized performance
- SEO-friendly (optional)
- Easy deployment on Vercel

### Responsibilities
- Menu display
- Cart management
- Table detection (via URL param)
- Payment UI
- Order submission

---

## Alternative (Ultra-light MVP)
- HTML + Alpine.js

---

# ⚙️ 2. Backend (API Layer)

## Stack: Node.js + Express

### Why
- Simple and flexible
- Fast to build APIs
- Large ecosystem

### Responsibilities
- Order creation
- Payment reference generation
- WhatsApp messaging
- Merchant command parsing

---

## Alternative (Faster MVP)
- Firebase Functions

---

# 🗄️ 3. Database

## Stack: Supabase (PostgreSQL)

### Why
- Structured relational data
- Easy querying (important for reconciliation)
- Built-in APIs
- Scalable

### Stores
- Orders
- Order items
- Tables
- Restaurants
- Payments

---

## Alternative
- Firebase Firestore (less structured)

---

# 📲 4. WhatsApp Integration

## Primary Option: WhatsApp Business Cloud API

### Capabilities
- Send messages
- Handle templates
- Enable interactive flows

---

## Easier MVP Option
- Twilio WhatsApp API

---

# 🌐 5. Hosting

## Frontend
- Vercel

## Backend
- Render / Railway / Fly.io

## Database
- Supabase (hosted)

---

# 🧾 6. File Storage

## Stack: Supabase Storage

### Use Case
- Store payment proof screenshots

---

# 🔐 7. Authentication (Future)

Not required for MVP

### Future Use
- Restaurant login
- Admin dashboard

---

# 📊 8. Analytics (Optional)

## Options
- PostHog
- Plausible

### Track
- QR scans
- Orders
- Conversion rate
- Drop-offs

---

# 🔄 System Flow

```text
Customer (Browser)
   ↓
Next.js Frontend
   ↓
Node.js API
   ↓
Supabase Database
   ↓
WhatsApp API → Restaurant
# Oshap API Specification

---

## 📌 Overview

This document defines all API endpoints used by the Oshap system.

Base URL:

/api

---

## 📌 GET /menu

Returns menu items for a restaurant.

### Query Params
- restaurant_id (optional)

### Response
```json
[
  {
    "id": "1",
    "name": "Shawarma",
    "price": 2500,
    "category": "Meals",
    "image": "url"
  }
]
```

---

## 📌 GET /table/:id

Returns table information and active order (if any)

### Response

```json
{
  "table_id": "T12",
  "status": "OPEN",
  "active_order": null
}
```

---

## 📌 POST /order

Create a new order

### Request

```json
{
  "table": "T12",
  "restaurant_id": "rest_1",
  "items": [
    {
      "name": "Shawarma",
      "qty": 2,
      "price": 2500
    }
  ]
}
```

### Response

```json
{
  "success": true,
  "order_id": "ord_123",
  "reference": "OSHAP-T12-8348",
  "total": 5000
}
```

---

## 📌 POST /payment/confirm

Customer confirms payment

### Request

```json
{
  "order_id": "ord_123",
  "proof_url": "optional-image-url"
}
```

### Response

```json
{
  "success": true
}
```

---

## 📌 POST /whatsapp/webhook

Receives incoming messages from WhatsApp (merchant replies)

### Example Input

```json
{
  "message": "PAID T12",
  "from": "+234XXXXXXXXXX"
}
```

### Supported Commands

* PAID T12 → mark order as paid
* ISSUE T12 → flag issue
* TODAY → summary
* PENDING → pending payments
* TABLE T12 → table details

---

## 📌 GET /orders/:id

Fetch order details

### Response

```json
{
  "id": "ord_123",
  "table": "T12",
  "items": [...],
  "total": 5000,
  "status": "PAYMENT_PENDING"
}
```

---

## 📌 Status Codes

* 200 → Success
* 400 → Bad request
* 404 → Not found
* 500 → Server error

---

## 📌 Notes

* All requests are JSON
* Authentication not required for MVP
* Rate limiting not required initially

---

---

## 📄 `WHATSAPP_FLOW.md`
```md id="oshap-wa-00005"
# Oshap WhatsApp Flow

---

## 📌 Overview

This document defines all WhatsApp message flows between Oshap and the restaurant.

WhatsApp is used as:
- Notification system
- Command interface
- Reconciliation tool

---

## 🆕 New Order Message

``text
🆕 Order

Table: T12
- Shawarma x2
- Coke x1

Total: ₦5,500
Ref: OSHAP-T12-8348
````

---

## 💰 Payment Claimed Message

Triggered when customer taps “I’ve sent the money”

text
💰 Payment Claimed

Table: T12
Amount: ₦5,500
Ref: OSHAP-T12-8348

---

## ✅ Payment Verified Message

Triggered when staff confirms payment

```text
✅ Payment Verified

Table: T12
```

---

## ⚠️ Payment Issue

```text
⚠️ Payment Issue

Table: T12
Action required
```

---

## 📊 Daily Summary Response

Triggered by command: TODAY

```text
📊 Today’s Summary

Total Orders: 32
Revenue: ₦185,500
Paid: ₦170,000
Pending: ₦15,500
```

---

## ⏳ Pending Payments Response

Triggered by command: PENDING

```text
⏳ Pending Payments

T12 – ₦5,500
T7 – ₦3,000
T3 – ₦7,000
```

---

## 🍽️ Table Details Response

Triggered by command: TABLE T12

```text
🍽️ Table T12

Orders:
- Shawarma x2
- Coke x1

Total: ₦5,500
Status: Pending
```

---

## 🧠 Supported Commands

Staff can send these messages:

* PAID T12 → mark payment as verified
* ISSUE T12 → flag issue
* TODAY → get daily summary
* PENDING → list unpaid orders
* TABLE T12 → get table details

---

## 🔄 Command Processing Logic

1. Receive message from WhatsApp webhook
2. Parse command text
3. Identify action
4. Query database
5. Send response message

---

## ⚠️ Important Rules

* Commands must be short and easy to type
* Responses must be concise
* Avoid message overload
* Always include table ID in responses

---

## 🎯 Design Principle

> WhatsApp should feel like a control panel, not a chat.

---

```
```

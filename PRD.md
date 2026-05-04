# # Oshap — Product Requirements Document (PRD)

## Version: 1.0 (MVP → V1)

- --

# 1. 📌 Product Overview

- ***Oshap**** is a QR-based, table-ordering and payment system that allows customers to:
- Scan a QR code at a restaurant/bar table
- Browse a lightweight web menu
- Place orders instantly
- Pay via bank transfer
- Confirm payment in-app

Restaurants receive:

- Orders
- Payment alerts
- Reconciliation summaries directly via WhatsApp, eliminating the need for a POS system or dashboard in the MVP.

- --

# 2. 🎯 Objectives

## Primary Goals

- Reduce wait time for ordering
- Eliminate dependency on waiters for order capture
- Prevent payment leakage (e.g., staff diverting funds)
- Enable simple, real-time reconciliation for merchants

## Secondary Goals

- Increase order frequency per table
- Improve customer experience (speed + control)
- Build foundation for a full restaurant OS
- --

# 3. 👥 Target Users

## Customers

- Diners at restaurants
- Patrons at bars (high-frequency, repeat ordering)

## Merchants

- Small to medium restaurants
- Bars and lounges
- Businesses without POS systems
- --

# 4. 🧩 Core Features

- --

## 4.1 QR-Based Table Entry

### Description

Each table has a unique QR code that encodes a URL with table identification.

### Example

https://oshap.app/menu?table=T12

### Requirements

- Unique table ID per QR
- QR printable and scannable
- Works across all mobile browsers
- --

## 4.2 Customer Web App

### Key Principles

- Ultra-fast (<2 seconds load)
- No login required
- Mobile-first design
- --

### 4.2.1 Menu Browsing

#### Features

- Category-based navigation
- Item cards:

- Name

- Price

- Image

- Description (optional)

- “Add” button per item
- --

### 4.2.2 Cart System

#### Features

- Add/remove items
- Adjust quantity
- Show running total
- Persist cart per session
- --

### 4.2.3 Order Placement

#### Flow

1. User taps “Place Order”

2. Order summary shown

3. User confirms

#### Output

- Order created in backend
- Sent to WhatsApp
- --

## 4.3 Payment System (Bank Transfer-Based)

- --

### 4.3.1 Pay Bill Tab

#### Displays:

- Total amount
- Bank name
- Account name
- Account number
- Unique payment reference

#### Example

Total: ₦5,500

Bank: GTBank

Account Name: Mama’s Kitchen

Account Number: 0123456789

Reference: OSHAP-T12-8348

- --

### 4.3.2 Payment Confirmation

#### User Actions

- Tap “I’ve sent the money”
- Optional: Upload payment screenshot
- --

### 4.3.3 Payment Reference System

#### Format

OSHAP-{TABLE}-{RANDOM}

#### Purpose

- Match bank alerts with orders
- Reduce ambiguity
- Prevent fraud
- --

## 4.4 WhatsApp Merchant System

- --

### 4.4.1 Order Notifications

#### Example

🆕 Order

Table: T12

- Shawarma x2
- Coke x1

Total: ₦5,500

Ref: OSHAP-T12-8348

- --

### 4.4.2 Payment Alerts

#### Example

💰 Payment Claimed

Table: T12

Amount: ₦5,500

Ref: OSHAP-T12-8348

- --

### 4.4.3 Merchant Commands (MVP)

#### Confirm Payment

PAID T12

#### Flag Issue

ISSUE T12

- --

### 4.4.4 Query Commands

#### Daily Summary

TODAY

#### Pending Payments

PENDING

#### Table Details

TABLE T12

- --

### 4.4.5 Example Summary Response

📊 Today’s Summary

Total Orders: 32

Revenue: ₦185,500

Paid: ₦170,000

Pending: ₦15,500

- --

## 4.5 Table Management

### Features

- Table session tracking
- Optional “Close Table” command
- Prevent new orders after closure
- --

# 5. 🧠 System Design

- --

## 5.1 Order Lifecycle

### States

- CREATED
- PAYMENT_PENDING
- PAYMENT_CLAIMED
- PAYMENT_CONFIRMED
- --

## 5.2 Payment Lifecycle

### States

- NOT_PAID
- CLAIMED
- VERIFIED
- --

## 5.3 Matching Logic

Match based on:

- Table ID
- Payment reference
- Amount
- --

# 6. ⚡ UX Requirements

- --

## Performance

- Load time < 2 seconds
- Optimized images
- Minimal JS
- --

## Interaction

- ≤ 4 taps to complete order
- No typing required
- Clear CTAs
- --

## First Screen

- Show popular items first
- Reduce decision fatigue
- --

# 7. 📊 Success Metrics

- --

## Customer Metrics

- % of QR scans → orders
- Time to first order
- Drop-off rate
- --

## Business Metrics

- Orders per table
- Average order value
- Payment completion rate
- --

## Merchant Metrics

- % of orders confirmed via WhatsApp
- Time to payment verification
- Daily reconciliation accuracy
- --

# 8. ⚠️ Risks & Mitigation

- --

## Slow Internet

- Use lightweight frontend
- Cache menu
- --

## Payment Fraud

- Require confirmation
- Use reference codes
- --

## Staff Adoption

- Keep WhatsApp commands simple
- No dashboard initially
- --

## User Drop-off

- Reduce steps
- Improve load speed
- --

# 9. 🚀 Rollout Plan

- --

## Phase 1: MVP (Weeks 1–2)

- QR → Web app
- Menu + cart
- Order → WhatsApp
- Payment instructions
- --

## Phase 2: Pilot (Weeks 3–4)

- Deploy in 1–2 locations
- Collect feedback
- Monitor usage
- --

## Phase 3: V1 Enhancements

- Upsells
- Order history
- Shared table ordering
- WhatsApp tracking
- --

# 10. 🔮 Future Scope

- Payment gateway integration
- Kitchen display system
- Merchant dashboard
- Loyalty programs
- CRM via WhatsApp
- --

# 11. 🧠 Key Principle

> Oshap must always be faster than calling a waiter.

If it’s not faster, it fails.

- --
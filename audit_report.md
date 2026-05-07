# Oshap Platform Audit Report

After a thorough review of the codebase, APIs, and current functionality, I have identified several key areas that are either incomplete, missing, or require refinement before the platform can be considered fully production-ready.

## 🔴 Critical Missing Features (Broken User Flows)

> [!CAUTION]
> **No Navigation to Payment Page**
> While we successfully redirected users to the "My Orders" tab after checkout, there is currently **no button to actually pay the bill**. Users stuck on the `/orders` page cannot easily navigate to `/pay` when they are ready to leave.

> [!WARNING]
> **Admin Dashboard Cannot "Close" Tables**
> The `/admin` dashboard allows waiters to verify payments, but doing so does not clear the session or close the table. As noted in `src/app/api/admin/verify/route.ts`, a separate "Close Table" action needs to be built so that new guests scanning the QR code don't inherit the previous guests' data.

## 🟡 High Priority (Unbuilt Features)

> [!IMPORTANT]
> **Menu Management (CMS)**
> Currently, the `/menu` page fetches data dynamically from Supabase, but there is no Admin UI to add, edit, or delete menu items. The restaurant cannot update prices, change photos, or mark items as "Out of Stock" without manually editing the database.

> [!IMPORTANT]
> **Kitchen Display System (KDS)**
> Orders are successfully submitted to the database and waiters can see table totals, but there is no dedicated interface for the kitchen staff to see incoming orders, start cooking, and mark individual items as "Ready to Serve".

> [!IMPORTANT]
> **Admin Authentication & Authorization**
> The `/admin` dashboard is currently entirely unprotected. Anyone who navigates to `/admin` can view active tables and verify payments. A secure login wall (e.g., Supabase Auth) needs to be implemented.

## 🔵 Medium Priority (Technical Debt & Refinements)

> [!NOTE]
> **Multi-Tenancy & Hardcoded IDs**
> In `src/app/api/admin/tables/route.ts`, the restaurant ID is explicitly hardcoded (`// For MVP demo, hardcode the restaurant ID`). If this platform is intended to support multiple restaurants, the tenant isolation and routing logic needs to be finalized.

> [!NOTE]
> **Payment Integration (Paystack)**
> The `/pay` page currently only displays static "Bank Transfer Details" instructing the user to manually send money and click "I've Sent the money". If automatic card payments (e.g., Paystack) are required, the API endpoints exist but the frontend UI is not connected to a payment gateway modal.

---

### Recommended Next Steps

1. **Quick Fix:** Add a prominent "Pay Bill" button to the `/orders` page.
2. **Feature Build:** Add a "Close Table" button to the Admin Dashboard.
3. **Security:** Implement an Admin Login screen.

Let me know which of these you'd like to tackle next!

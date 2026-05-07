import { createServerClient } from "@/lib/supabase";
import { validateAdminPin, validateAdminResponse } from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!validateAdminPin(request)) return validateAdminResponse();

  const body = await request.json();
  const { table_id, reason } = body;

  if (!table_id) {
    return Response.json({ error: "Missing table_id" }, { status: 400 });
  }

  if (!reason || !["paid", "abandoned"].includes(reason)) {
    return Response.json(
      { error: "Missing or invalid reason. Must be 'paid' or 'abandoned'." },
      { status: 400 }
    );
  }

  const supabase = createServerClient();

  if (reason === "paid") {
    // Customer paid (cash/transfer) but didn't claim through the app.
    // Treat all active orders as successfully paid — record as revenue.

    // 1. Confirm any CREATED orders
    const { data: createdOrders } = await supabase
      .from("orders")
      .select("id, total")
      .eq("table_id", table_id)
      .eq("status", "CREATED");

    if (createdOrders && createdOrders.length > 0) {
      const createdIds = createdOrders.map((o) => o.id);

      await supabase
        .from("orders")
        .update({ status: "CONFIRMED" })
        .in("id", createdIds);

      // Create VERIFIED payment records so revenue is tracked
      const paymentRecords = createdOrders.map((o) => ({
        order_id: o.id,
        amount: o.total,
        status: "VERIFIED",
        proof_url: null,
      }));

      await supabase.from("payments").upsert(paymentRecords, {
        onConflict: "order_id",
      });
    }

    // 2. Also confirm any PAYMENT_PENDING orders (they already claimed)
    const { data: pendingOrders } = await supabase
      .from("orders")
      .select("id")
      .eq("table_id", table_id)
      .eq("status", "PAYMENT_PENDING");

    if (pendingOrders && pendingOrders.length > 0) {
      const pendingIds = pendingOrders.map((o) => o.id);

      await supabase
        .from("orders")
        .update({ status: "CONFIRMED" })
        .in("id", pendingIds);

      await supabase
        .from("payments")
        .update({ status: "VERIFIED" })
        .in("order_id", pendingIds);
    }
  } else {
    // reason === "abandoned"
    // Customers left without paying. Cancel everything.

    // 1. Cancel CREATED orders
    await supabase
      .from("orders")
      .update({ status: "CANCELLED" })
      .eq("table_id", table_id)
      .eq("status", "CREATED");

    // 2. Cancel PAYMENT_PENDING orders and reset their payments
    const { data: pendingOrders } = await supabase
      .from("orders")
      .select("id")
      .eq("table_id", table_id)
      .eq("status", "PAYMENT_PENDING");

    if (pendingOrders && pendingOrders.length > 0) {
      const pendingIds = pendingOrders.map((o) => o.id);

      await supabase
        .from("orders")
        .update({ status: "CANCELLED" })
        .in("id", pendingIds);

      await supabase
        .from("payments")
        .update({ status: "NOT_PAID" })
        .in("order_id", pendingIds);
    }
  }

  // Clear all sessions — clean slate for next guests.
  await supabase
    .from("table_sessions")
    .delete()
    .eq("table_id", table_id);

  return Response.json({ success: true, table_id, reason });
}

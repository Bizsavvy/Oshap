import { createServerClient } from "@/lib/supabase";
import { validateAdminPin, validateAdminResponse } from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!validateAdminPin(request)) return validateAdminResponse();

  const body = await request.json();
  const { table_id } = body;

  if (!table_id) {
    return Response.json({ error: "Missing table_id" }, { status: 400 });
  }

  const supabase = createServerClient();

  // 1. Get all PAYMENT_PENDING orders for this table
  const { data: pendingOrders, error: fetchError } = await supabase
    .from("orders")
    .select("id")
    .eq("table_id", table_id)
    .eq("status", "PAYMENT_PENDING");

  if (fetchError || !pendingOrders || pendingOrders.length === 0) {
    return Response.json({ error: "No pending payments found for this table" }, { status: 404 });
  }

  const orderIds = pendingOrders.map((o) => o.id);

  // 2. Mark orders as CONFIRMED
  const { error: orderUpdateError } = await supabase
    .from("orders")
    .update({ status: "CONFIRMED" })
    .in("id", orderIds);

  if (orderUpdateError) {
    return Response.json({ error: "Failed to update orders" }, { status: 500 });
  }

  // 3. Mark payments as VERIFIED
  await supabase
    .from("payments")
    .update({ status: "VERIFIED" })
    .in("order_id", orderIds);

  // 4. Auto-close: check if any unpaid orders remain on this table
  const { data: unpaidOrders } = await supabase
    .from("orders")
    .select("id")
    .eq("table_id", table_id)
    .eq("status", "CREATED");

  let auto_closed = false;

  if (!unpaidOrders || unpaidOrders.length === 0) {
    // All orders are paid — session is complete. Clear sessions for a clean slate.
    // With ON DELETE SET NULL, orders survive with session_id = NULL.
    await supabase
      .from("table_sessions")
      .delete()
      .eq("table_id", table_id);

    auto_closed = true;
  }

  return Response.json({
    success: true,
    verified_count: orderIds.length,
    auto_closed,
  });
}

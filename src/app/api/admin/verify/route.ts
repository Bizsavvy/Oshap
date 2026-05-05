import { createServerClient } from "@/lib/supabase";

export async function POST(request: Request) {
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

  // 4. Check if there are any CREATED (unpaid) orders left on this table
  const { data: unpaidOrders } = await supabase
    .from("orders")
    .select("id")
    .eq("table_id", table_id)
    .eq("status", "CREATED");

  // If no unpaid orders are left, we can close the table and clear sessions
  if (!unpaidOrders || unpaidOrders.length === 0) {
    // Note: We used to delete the table_sessions here.
    // However, verifying a payment does NOT mean the guests have left the table.
    // They may still want to order desserts or more drinks! 
    // A separate "Close Table" action would be required to actually clear the session.
    
    // We can also optionally update table status to OPEN to reset it.
    // The previous status was likely OPEN anyway, as table statuses are mainly used 
    // if we want to track reserved/occupied states.
  }

  return Response.json({ success: true, verified_count: orderIds.length });
}

import { createServerClient } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json();
  const { order_ids } = body;

  if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
    return Response.json(
      { error: "Missing required field: order_ids (non-empty array)" },
      { status: 400 }
    );
  }

  const supabase = createServerClient();

  // Fetch the orders to get their table_id
  const { data: orders, error: fetchError } = await supabase
    .from("orders")
    .select("id, table_id, status")
    .in("id", order_ids);

  if (fetchError || !orders || orders.length === 0) {
    return Response.json({ error: "Orders not found" }, { status: 404 });
  }

  // Only confirm orders that are in PAYMENT_PENDING
  const confirmableIds = orders
    .filter((o) => o.status === "PAYMENT_PENDING")
    .map((o) => o.id);

  if (confirmableIds.length === 0) {
    return Response.json(
      { error: "No orders in PAYMENT_PENDING status to confirm" },
      { status: 400 }
    );
  }

  // Mark orders as CONFIRMED
  const { error: updateError } = await supabase
    .from("orders")
    .update({ status: "CONFIRMED" })
    .in("id", confirmableIds);

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 500 });
  }

  // Update corresponding payment records
  await supabase
    .from("payments")
    .update({ status: "CONFIRMED" })
    .in("order_id", confirmableIds);

  // Get the unique table IDs from confirmed orders
  const tableIds = [...new Set(orders.map((o) => o.table_id))];
  const closedTables: string[] = [];

  for (const tableId of tableIds) {
    // Check if there are any remaining active orders on this table
    const { data: remaining } = await supabase
      .from("orders")
      .select("id")
      .eq("table_id", tableId)
      .in("status", ["CREATED", "PAYMENT_PENDING"]);

    if (!remaining || remaining.length === 0) {
      // No active orders left — close the table
      await supabase
        .from("tables")
        .update({ status: "CLOSED" })
        .eq("id", tableId);
      closedTables.push(tableId);
    }
  }

  return Response.json({
    success: true,
    confirmed: confirmableIds.length,
    closed_tables: closedTables,
  });
}

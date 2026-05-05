import { createServerClient } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json();
  const { order_id, combined_order_ids, proof_url } = body;

  if (!order_id && (!combined_order_ids || combined_order_ids.length === 0)) {
    return Response.json(
      { error: "Missing required field: order_id or combined_order_ids" },
      { status: 400 }
    );
  }

  const supabase = createServerClient();

  const orderIds = combined_order_ids?.length > 0 
    ? combined_order_ids 
    : (order_id ? [order_id] : []);

  if (orderIds.length === 0) {
    return Response.json({ error: "No orders to confirm" }, { status: 400 });
  }

  // Get order details
  const { data: orders, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .in("id", orderIds);

  if (orderError || !orders || orders.length === 0) {
    return Response.json({ error: "Orders not found" }, { status: 404 });
  }

  // Process all orders
  for (const order of orders) {
    // Create or update payment record
    const { error: paymentError } = await supabase.from("payments").upsert(
      {
        order_id: order.id,
        amount: order.total,
        status: "CLAIMED",
        proof_url: proof_url || null,
      },
      { onConflict: "order_id" }
    );

    if (paymentError) {
      console.error("Payment upsert error for order", order.id, paymentError);
      // We log but continue to try other orders if some fail
    }

    // Update order status
    await supabase
      .from("orders")
      .update({ status: "PAYMENT_PENDING" })
      .eq("id", order.id);
  }

  return Response.json({ success: true, processed: orders.length });
}

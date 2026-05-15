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

  // Process all orders atomically — if any step fails, roll back the ones that succeeded
  const results = await Promise.allSettled(
    orders.map(async (order) => {
      const { error: paymentError } = await supabase.from("payments").upsert(
        {
          order_id: order.id,
          amount: order.total,
          status: "CLAIMED",
          proof_url: proof_url || null,
        },
        { onConflict: "order_id" }
      );
      if (paymentError) throw new Error(`Payment upsert failed for order ${order.id}: ${paymentError.message}`);

      const { error: orderError } = await supabase
        .from("orders")
        .update({ status: "PAYMENT_PENDING" })
        .eq("id", order.id);
      if (orderError) throw new Error(`Order update failed for order ${order.id}: ${orderError.message}`);
    })
  );

  const failures = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];

  if (failures.length > 0) {
    // Roll back any orders that did succeed to avoid partial state
    const succeededIds = orders
      .filter((_, i) => results[i].status === "fulfilled")
      .map((o) => o.id);

    if (succeededIds.length > 0) {
      await supabase.from("orders").update({ status: "CREATED" }).in("id", succeededIds);
      await supabase.from("payments").update({ status: "NOT_PAID" }).in("order_id", succeededIds);
    }

    return Response.json(
      { error: "Payment confirmation failed. Please try again.", details: failures.map((f) => f.reason?.message) },
      { status: 500 }
    );
  }

  return Response.json({ success: true, processed: orders.length });
}

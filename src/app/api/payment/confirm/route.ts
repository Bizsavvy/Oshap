import { createServerClient } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json();
  const { order_id, proof_url } = body;

  if (!order_id) {
    return Response.json(
      { error: "Missing required field: order_id" },
      { status: 400 }
    );
  }

  const supabase = createServerClient();

  // Get order details
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", order_id)
    .single();

  if (orderError || !order) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }

  // Create or update payment record
  const { error: paymentError } = await supabase.from("payments").upsert(
    {
      order_id,
      amount: order.total,
      status: "CLAIMED",
      proof_url: proof_url || null,
    },
    { onConflict: "order_id" }
  );

  if (paymentError) {
    return Response.json({ error: paymentError.message }, { status: 500 });
  }

  // Update order status
  await supabase
    .from("orders")
    .update({ status: "PAYMENT_PENDING" })
    .eq("id", order_id);

  return Response.json({ success: true });
}

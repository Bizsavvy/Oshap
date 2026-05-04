import { createServerClient } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json();
  const { table, restaurant_id, items, session_id, customer_name } = body;

  if (!table || !restaurant_id || !items?.length) {
    return Response.json(
      { error: "Missing required fields: table, restaurant_id, items" },
      { status: 400 }
    );
  }

  const supabase = createServerClient();

  // Calculate total
  const total = items.reduce(
    (sum: number, item: { price: number; qty: number }) =>
      sum + item.price * item.qty,
    0
  );

  // Generate reference
  const rand = Math.floor(1000 + Math.random() * 9000);
  const reference = `OSHAP-${table}-${rand}`;

  // Create order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      table_id: table,
      restaurant_id,
      status: "CREATED",
      total,
      reference,
      session_id,
      customer_name,
    })
    .select()
    .single();

  if (orderError) {
    return Response.json({ error: orderError.message }, { status: 500 });
  }

  // Create order items
  const orderItems = items.map(
    (item: { name: string; qty: number; price: number }) => ({
      order_id: order.id,
      name: item.name,
      quantity: item.qty,
      price: item.price,
    })
  );

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (itemsError) {
    return Response.json({ error: itemsError.message }, { status: 500 });
  }

  // Update order status to PAYMENT_PENDING
  await supabase
    .from("orders")
    .update({ status: "PAYMENT_PENDING" })
    .eq("id", order.id);

  return Response.json({
    success: true,
    order_id: order.id,
    reference,
    total,
  });
}

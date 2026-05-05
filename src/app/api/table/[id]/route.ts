import { createServerClient } from "@/lib/supabase";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("tables")
    .select("*, restaurants(*)")
    .eq("id", id)
    .single();

  if (error) {
    return Response.json(
      { error: error.message },
      { status: error.code === "PGRST116" ? 404 : 500 }
    );
  }

  // Check for ALL active orders on this table to calculate the collective bill
  const { data: activeOrders } = await supabase
    .from("orders")
    .select("*")
    .eq("table_id", id)
    .in("status", ["CREATED", "PAYMENT_PENDING"])
    .order("created_at", { ascending: true });

  let combinedOrder = null;
  
  if (activeOrders && activeOrders.length > 0) {
    // If there are multiple active orders, we sum their totals.
    // For payment purposes, we'll use the ID/reference of the latest order.
    // In a fully robust system, you might create a single "Bill" entity.
    const totalAmount = activeOrders.reduce((sum, order) => sum + order.total, 0);
    const latestOrder = activeOrders[activeOrders.length - 1];
    
    combinedOrder = {
      ...latestOrder,
      total: totalAmount,
      // Keep track of all underlying order IDs in case we need them
      combined_order_ids: activeOrders.map(o => o.id)
    };
  }

  return Response.json({
    table_id: data.id,
    status: data.status,
    restaurant: data.restaurants,
    active_order: combinedOrder,
  });
}

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
  let unpaidOrder = null;
  let pendingPayments = null;

  if (data.status !== "CLOSED") {
    const { data: activeOrders } = await supabase
      .from("orders")
      .select("*")
      .eq("table_id", id)
      .in("status", ["CREATED", "PAYMENT_PENDING"])
      .order("created_at", { ascending: true });

    if (activeOrders && activeOrders.length > 0) {
      const createdOrders = activeOrders.filter(o => o.status === "CREATED");
      const pendingOrders = activeOrders.filter(o => o.status === "PAYMENT_PENDING");

      if (createdOrders.length > 0) {
        const totalAmount = createdOrders.reduce((sum, order) => sum + order.total, 0);
        const latestOrder = createdOrders[createdOrders.length - 1];

        unpaidOrder = {
          ...latestOrder,
          total: totalAmount,
          combined_order_ids: createdOrders.map(o => o.id)
        };
      }

      if (pendingOrders.length > 0) {
        const totalAmount = pendingOrders.reduce((sum, order) => sum + order.total, 0);
        const latestOrder = pendingOrders[pendingOrders.length - 1];

        pendingPayments = {
          ...latestOrder,
          total: totalAmount,
          combined_order_ids: pendingOrders.map(o => o.id)
        };
      }
    }
  }

  return Response.json({
    table_id: data.id,
    status: data.status,
    restaurant: data.restaurants,
    unpaid_order: unpaidOrder,
    pending_payments: pendingPayments,
  });
}

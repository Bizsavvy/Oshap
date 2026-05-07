import { createServerClient } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const deviceToken = searchParams.get("device_token");
  const sessionId = searchParams.get("session_id");

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

  // Check for active orders on this table, scoped to the current device/session
  let unpaidOrder = null;
  let pendingPayments = null;

  if (data.status !== "CLOSED") {
    let query = supabase
      .from("orders")
      .select("*")
      .eq("table_id", id)
      .in("status", ["CREATED", "PAYMENT_PENDING"])
      .order("created_at", { ascending: true });

    // Scope to this device/session so users don't see each other's bills
    if (sessionId && deviceToken) {
      // Include orders in the session OR pre-session orders from this device
      query = query.or(
        `session_id.eq.${sessionId},and(session_id.is.null,device_token.eq.${deviceToken})`
      );
    } else if (sessionId) {
      query = query.eq("session_id", sessionId);
    } else if (deviceToken) {
      // Solo ordering — only show this device's orders
      query = query.eq("device_token", deviceToken);
    }
    // If neither provided, fall back to all table orders (legacy)

    const { data: activeOrders } = await query;

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

import { createServerClient } from "@/lib/supabase";

export async function GET() {
  const supabase = createServerClient();

  // For MVP demo, hardcode the restaurant ID
  const restaurantId = "00000000-0000-0000-0000-000000000001";

  // Fetch all tables for the restaurant
  const { data: tables, error: tableError } = await supabase
    .from("tables")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("id");

  if (tableError || !tables) {
    return Response.json({ error: "Failed to fetch tables" }, { status: 500 });
  }

  // Fetch all active orders (CREATED or PAYMENT_PENDING)
  const { data: activeOrders, error: orderError } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("restaurant_id", restaurantId)
    .in("status", ["CREATED", "PAYMENT_PENDING"]);

  if (orderError) {
    return Response.json({ error: "Failed to fetch orders" }, { status: 500 });
  }

  // Group orders by table
  const tableData = tables.map((table) => {
    const tableOrders = activeOrders?.filter(o => o.table_id === table.id) || [];
    
    const unpaidOrders = tableOrders.filter(o => o.status === "CREATED");
    const pendingPayments = tableOrders.filter(o => o.status === "PAYMENT_PENDING");

    return {
      id: table.id,
      status: table.status,
      unpaidTotal: unpaidOrders.reduce((sum, o) => sum + o.total, 0),
      pendingTotal: pendingPayments.reduce((sum, o) => sum + o.total, 0),
      hasPending: pendingPayments.length > 0,
      hasUnpaid: unpaidOrders.length > 0,
    };
  });

  return Response.json({ tables: tableData });
}

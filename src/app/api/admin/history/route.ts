import { createServerClient } from "@/lib/supabase";
import { validateAdminPin, validateAdminResponse } from "@/lib/admin-auth";
import { DEMO_RESTAURANT_ID } from "@/lib/constants";

export async function GET(request: Request) {
  if (!validateAdminPin(request)) return validateAdminResponse();

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const perPage = parseInt(searchParams.get("per_page") || "20", 10);
  const tableFilter = searchParams.get("table") || "";
  const dateFilter = searchParams.get("date") || "";

  const supabase = createServerClient();

  // Build query for completed/cancelled orders
  let query = supabase
    .from("orders")
    .select(
      `id, table_id, status, total, reference, created_at, customer_name,
       order_items ( id, name, quantity, price ),
       payments ( id, amount, status, proof_url, created_at )`,
      { count: "exact" }
    )
    .eq("restaurant_id", DEMO_RESTAURANT_ID)
    .in("status", ["CONFIRMED", "CANCELLED"])
    .order("created_at", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  if (tableFilter) {
    query = query.eq("table_id", tableFilter);
  }

  if (dateFilter) {
    // Filter by date (start of day to end of day)
    const startOfDay = `${dateFilter}T00:00:00.000Z`;
    const endOfDay = `${dateFilter}T23:59:59.999Z`;
    query = query.gte("created_at", startOfDay).lte("created_at", endOfDay);
  }

  const { data: orders, count, error } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Calculate summary stats
  const confirmedOrders = orders?.filter((o) => o.status === "CONFIRMED") || [];
  const cancelledOrders = orders?.filter((o) => o.status === "CANCELLED") || [];
  const totalRevenue = confirmedOrders.reduce((sum, o) => sum + o.total, 0);

  return Response.json({
    orders: orders || [],
    pagination: {
      page,
      per_page: perPage,
      total: count || 0,
      total_pages: Math.ceil((count || 0) / perPage),
    },
    summary: {
      confirmed_count: confirmedOrders.length,
      cancelled_count: cancelledOrders.length,
      page_revenue: totalRevenue,
    },
  });
}

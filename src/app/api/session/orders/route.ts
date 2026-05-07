import { createServerClient } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");
  const tableId = searchParams.get("table_id");

  if (!sessionId && !tableId) {
    return Response.json(
      { error: "Missing session_id or table_id" },
      { status: 400 }
    );
  }

  const supabase = createServerClient();

  let query = supabase
    .from("orders")
    .select(`
      id,
      customer_name,
      status,
      created_at,
      session_id,
      table_id,
      order_items (
        id,
        name,
        quantity,
        price
      )
    `)
    .in("status", ["CREATED", "PREPARING", "READY", "PAYMENT_PENDING"])
    .order("created_at", { ascending: false });

  if (sessionId && tableId) {
    // Include orders that belong to this session OR were placed on this
    // table before the session was created (session_id is null).
    query = query
      .eq("table_id", tableId)
      .or(`session_id.eq.${sessionId},session_id.is.null`);
  } else if (sessionId) {
    query = query.eq("session_id", sessionId);
  } else if (tableId) {
    // Orders for the whole table (with or without session)
    query = query.eq("table_id", tableId);
  }

  const { data: orders, error } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true, orders });
}

import { createServerClient } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return Response.json({ error: "Missing session_id" }, { status: 400 });
  }

  const supabase = createServerClient();

  // Fetch all orders for this session, including their items
  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      id,
      customer_name,
      status,
      created_at,
      order_items (
        id,
        name,
        quantity,
        price
      )
    `)
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true, orders });
}

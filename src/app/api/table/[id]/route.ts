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

  // Check for active orders on this table
  const { data: activeOrder } = await supabase
    .from("orders")
    .select("*")
    .eq("table_id", id)
    .in("status", ["CREATED", "PAYMENT_PENDING"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return Response.json({
    table_id: data.id,
    status: data.status,
    restaurant: data.restaurants,
    active_order: activeOrder || null,
  });
}

import { createServerClient } from "@/lib/supabase";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .single();

  if (orderError) {
    return Response.json(
      { error: orderError.message },
      { status: orderError.code === "PGRST116" ? 404 : 500 }
    );
  }

  // Get payment info
  const { data: payment } = await supabase
    .from("payments")
    .select("*")
    .eq("order_id", id)
    .maybeSingle();

  return Response.json({
    id: order.id,
    table: order.table_id,
    items: order.order_items,
    total: order.total,
    status: order.status,
    reference: order.reference,
    payment: payment || null,
    created_at: order.created_at,
  });
}

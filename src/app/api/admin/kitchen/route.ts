import { createServerClient } from "@/lib/supabase";
import { validateAdminPin, validateAdminResponse } from "@/lib/admin-auth";
import { DEMO_RESTAURANT_ID } from "@/lib/constants";

export async function GET(request: Request) {
  if (!validateAdminPin(request)) return validateAdminResponse();

  const supabase = createServerClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      id,
      table_id,
      status,
      total,
      reference,
      created_at,
      order_items (id, name, quantity, price)
    `)
    .eq("restaurant_id", DEMO_RESTAURANT_ID)
    .in("status", ["CREATED", "PREPARING"])
    .order("created_at", { ascending: true });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(orders || []);
}

export async function PATCH(request: Request) {
  if (!validateAdminPin(request)) return validateAdminResponse();

  const body = await request.json();
  const { order_id, status } = body;

  if (!order_id || !status) {
    return Response.json({ error: "Missing order_id or status" }, { status: 400 });
  }

  if (!["PREPARING", "READY"].includes(status)) {
    return Response.json({ error: "Status must be PREPARING or READY" }, { status: 400 });
  }

  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", order_id)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}

import { createServerClient } from "@/lib/supabase";
import { validateAdminPin, validateAdminResponse } from "@/lib/admin-auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateAdminPin(request)) return validateAdminResponse();

  const { id } = await params;
  const body = await request.json();
  const { name, price, category, description, image_url, sort_order } = body;

  const supabase = createServerClient();

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (price !== undefined) updates.price = parseInt(price, 10);
  if (category !== undefined) updates.category = category;
  if (description !== undefined) updates.description = description;
  if (image_url !== undefined) updates.image_url = image_url;
  if (sort_order !== undefined) updates.sort_order = sort_order;

  const { data, error } = await supabase
    .from("menu_items")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateAdminPin(request)) return validateAdminResponse();

  const { id } = await params;
  const body = await request.json();
  const { available } = body;

  if (typeof available !== "boolean") {
    return Response.json({ error: "Missing 'available' (boolean)" }, { status: 400 });
  }

  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("menu_items")
    .update({ available })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateAdminPin(request)) return validateAdminResponse();

  const { id } = await params;
  const supabase = createServerClient();

  const { error } = await supabase.from("menu_items").delete().eq("id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}

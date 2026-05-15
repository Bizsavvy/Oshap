import { createServerClient } from "@/lib/supabase";
import { validateAdminPin, validateAdminResponse } from "@/lib/admin-auth";
import { DEMO_RESTAURANT_ID } from "@/lib/constants";

export async function GET(request: Request) {
  if (!validateAdminPin(request)) return validateAdminResponse();

  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("restaurant_id", DEMO_RESTAURANT_ID)
    .order("sort_order", { ascending: true });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data || []);
}

export async function POST(request: Request) {
  if (!validateAdminPin(request)) return validateAdminResponse();

  const body = await request.json();
  const { name, price, category, description, image_url } = body;

  if (!name || !price || !category) {
    return Response.json(
      { error: "Missing required fields: name, price, category" },
      { status: 400 }
    );
  }

  const parsedPrice = parseFloat(price);
  if (isNaN(parsedPrice) || parsedPrice <= 0 || parsedPrice > 1_000_000) {
    return Response.json(
      { error: "Price must be a number between 0 and 1,000,000" },
      { status: 400 }
    );
  }

  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("menu_items")
    .insert({
      restaurant_id: DEMO_RESTAURANT_ID,
      name,
      price: parsedPrice,
      category,
      description: description || null,
      image_url: image_url || null,
      available: true,
      sort_order: 99,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data, { status: 201 });
}

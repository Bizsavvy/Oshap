import { type NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const restaurantId = searchParams.get("restaurant_id");
  const itemId = searchParams.get("id");

  const supabase = createServerClient();

  let query = supabase
    .from("menu_items")
    .select("*")
    .eq("available", true)
    .order("sort_order", { ascending: true });

  if (itemId) {
    query = query.eq("id", itemId);
  } else if (restaurantId) {
    query = query.eq("restaurant_id", restaurantId);
  }

  const { data, error } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" },
  });
}

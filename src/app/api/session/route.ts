import { createServerClient } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json();
  const { tableId, pin, action } = body;

  if (!tableId || !action) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createServerClient();

  if (action === "START") {
    // Generate a random 4-digit PIN
    const generatedPin = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Create new session
    const { data: session, error } = await supabase
      .from("table_sessions")
      .insert({
        table_id: tableId,
        pin: generatedPin,
        status: "ACTIVE",
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, session });
  } 
  
  if (action === "JOIN") {
    if (!pin) {
      return Response.json({ error: "PIN is required to join" }, { status: 400 });
    }

    // Find active session for this table with matching PIN
    const { data: session, error } = await supabase
      .from("table_sessions")
      .select("*")
      .eq("table_id", tableId)
      .eq("pin", pin)
      .eq("status", "ACTIVE")
      .single();

    if (error || !session) {
      return Response.json({ error: "Invalid PIN or no active session" }, { status: 404 });
    }

    return Response.json({ success: true, session });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}

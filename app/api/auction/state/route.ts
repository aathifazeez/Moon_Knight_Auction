import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

const PLAYER_SELECT = "id, name, photo_url, role, base_points, status";
const STATE_SELECT  = `*, current_player:players(${PLAYER_SELECT})`;

export async function GET() {
  const supabase = getServerSupabase();
  let { data } = await supabase.from("auction_state").select(STATE_SELECT).single();

  // Auto-create the singleton row if it doesn't exist yet
  if (!data) {
    const { data: created } = await supabase
      .from("auction_state")
      .insert({ status: "idle", current_player_id: null })
      .select(STATE_SELECT)
      .single();
    data = created;
  }

  return Response.json(data);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body     = await req.json();
  const supabase = getServerSupabase();

  const update: Record<string, unknown> = { status: body.status };

  if (body.status === "rolling") {
    // Pick a random pending player (respects auction_order if set)
    const { data: pending } = await supabase
      .from("players")
      .select("id")
      .eq("status", "pending")
      .order("auction_order", { ascending: true, nullsFirst: false });

    if (!pending?.length) {
      return Response.json({ error: "No pending players left" }, { status: 400 });
    }

    const picked = pending[Math.floor(Math.random() * pending.length)];
    update.current_player_id = picked.id;
  } else if (body.status === "idle" || body.status === "ended") {
    update.current_player_id = null;
  }

  // Fetch the singleton row's ID first (Supabase requires a WHERE clause on updates)
  const { data: existing } = await supabase
    .from("auction_state")
    .select("id")
    .single();

  if (!existing) return Response.json({ error: "Auction state row not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("auction_state")
    .update(update)
    .eq("id", existing.id)
    .select(STATE_SELECT)
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

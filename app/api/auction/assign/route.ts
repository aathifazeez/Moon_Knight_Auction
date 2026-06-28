import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body     = await req.json();
  const supabase = getServerSupabase();

  // Get the singleton auction_state row (need id for WHERE clause on updates)
  const { data: state } = await supabase
    .from("auction_state")
    .select("id, current_player_id")
    .single();

  if (!state?.current_player_id) {
    return Response.json({ error: "No player is currently up for auction" }, { status: 400 });
  }

  const playerId = state.current_player_id;

  if (body.mark_unsold) {
    await Promise.all([
      supabase.from("players")
        .update({ status: "unsold", team_id: null, sold_for: null })
        .eq("id", playerId),
      supabase.from("auction_state")
        .update({ status: "idle", current_player_id: null })
        .eq("id", state.id),
    ]);
    return Response.json({ success: true });
  }

  const { team_id, sold_for } = body;
  if (!team_id || !sold_for) {
    return Response.json({ error: "team_id and sold_for are required" }, { status: 400 });
  }

  // Fetch team's current budget_used so we can increment it
  const { data: team } = await supabase
    .from("teams")
    .select("budget_used")
    .eq("id", team_id)
    .single();

  await Promise.all([
    supabase.from("players").update({
      status:   "sold",
      team_id,
      sold_for: Number(sold_for),
    }).eq("id", playerId),

    supabase.from("teams").update({
      budget_used: (team?.budget_used ?? 0) + Number(sold_for),
    }).eq("id", team_id),

    supabase.from("auction_state")
      .update({ status: "idle", current_player_id: null })
      .eq("id", state.id),
  ]);

  return Response.json({ success: true });
}

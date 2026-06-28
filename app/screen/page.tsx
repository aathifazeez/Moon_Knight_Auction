import { getServerSupabase } from "@/lib/supabase/server";
import ScreenStage from "@/components/screen/ScreenStage";
import type { Player } from "@/types";

export const dynamic = "force-dynamic";

const PLAYER_FIELDS = "id, name, photo_url, role, base_points, status, team_id, sold_for, auction_order, created_at";
const STATE_SELECT  = `*, current_player:players(${PLAYER_FIELDS}, team:teams(id, name, color_hex))`;

export default async function ScreenPage() {
  const supabase = getServerSupabase();

  const [{ data: stateRaw }, { data: teams }, { data: players }] = await Promise.all([
    supabase.from("auction_state").select(STATE_SELECT).single(),
    supabase.from("teams").select("*").order("created_at", { ascending: true }),
    supabase
      .from("players")
      .select("id, name, photo_url, role, status, team_id, sold_for")
      .order("auction_order", { ascending: true, nullsFirst: false }),
  ]);

  let state = stateRaw;
  if (!state) {
    const { data: created } = await supabase
      .from("auction_state")
      .insert({ status: "idle", current_player_id: null })
      .select(STATE_SELECT)
      .single();
    state = created;
  }

  const allPlayers = (players ?? []) as Pick<Player, "id" | "name" | "photo_url" | "role" | "status" | "team_id" | "sold_for">[];
  const pending    = allPlayers.filter((p) => p.status === "pending");
  const sold       = allPlayers.filter((p) => p.status === "sold");
  const unsold     = allPlayers.filter((p) => p.status === "unsold");

  const boughtByTeam: Record<string, number> = {};
  sold.forEach((p) => {
    if (p.team_id) boughtByTeam[p.team_id] = (boughtByTeam[p.team_id] ?? 0) + 1;
  });

  const initialCounts = {
    pending: pending.length,
    sold:    sold.length,
    unsold:  unsold.length,
  };
  const initialSpend = sold.reduce((s, p) => s + (p.sold_for ?? 0), 0);

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-bg)" }}>
        <p className="font-display text-2xl" style={{ color: "var(--color-error)" }}>
          AUCTION STATE UNAVAILABLE
        </p>
      </div>
    );
  }

  return (
    <ScreenStage
      initialState={state}
      initialTeams={teams ?? []}
      initialPending={pending.map((p) => ({
        id:        p.id,
        name:      p.name,
        photo_url: p.photo_url,
        role:      p.role,
      }))}
      initialCounts={initialCounts}
      initialSpend={initialSpend}
      initialTotalPlayers={allPlayers.length}
      initialBoughtByTeam={boughtByTeam}
    />
  );
}

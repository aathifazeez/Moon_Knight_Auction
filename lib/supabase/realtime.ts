import { supabase } from "./client";
import type { AuctionState, Player, Team } from "@/types";

export function subscribeToAuctionState(
  callback: (state: AuctionState) => void
) {
  return supabase
    .channel("auction-state")
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "auction_state" },
      (payload) => callback(payload.new as AuctionState)
    )
    .subscribe();
}

export function subscribeToPlayers(callback: (player: Player) => void) {
  return supabase
    .channel("players-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "players" },
      (payload) => callback(payload.new as Player)
    )
    .subscribe();
}

export function subscribeToTeams(callback: (team: Team) => void) {
  return supabase
    .channel("teams-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "teams" },
      (payload) => callback(payload.new as Team)
    )
    .subscribe();
}

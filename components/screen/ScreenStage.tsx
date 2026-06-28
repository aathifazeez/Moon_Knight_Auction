"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { AuctionState, Player, Team } from "@/types";
import { subscribeToAuctionState } from "@/lib/supabase/realtime";
import StarField from "./StarField";
import IdleScreen from "./IdleScreen";
import RollingAnimation, { type ReelPlayer } from "./RollingAnimation";
import BiddingState from "./BiddingState";
import SoldOverlay from "./SoldOverlay";
import EndedScreen from "./EndedScreen";

interface Counts {
  pending: number;
  sold:    number;
  unsold:  number;
}

interface Props {
  initialState:      AuctionState;
  initialTeams:      Team[];
  initialPending:    ReelPlayer[];
  initialCounts:     Counts;
  initialSpend:      number;
  initialTotalPlayers: number;
  initialBoughtByTeam: Record<string, number>;
}

export default function ScreenStage({
  initialState,
  initialTeams,
  initialPending,
  initialCounts,
  initialSpend,
  initialTotalPlayers,
  initialBoughtByTeam,
}: Props) {
  const [state,        setState]        = useState(initialState);
  const [teams,        setTeams]        = useState(initialTeams);
  const [pending,      setPending]      = useState(initialPending);
  const [counts,       setCounts]       = useState<Counts>(initialCounts);
  const [spend,        setSpend]        = useState(initialSpend);
  const [totalPlayers, setTotalPlayers] = useState(initialTotalPlayers);
  const [boughtByTeam, setBoughtByTeam] = useState(initialBoughtByTeam);

  const [overlayPlayer, setOverlayPlayer] = useState<Player | null>(null);
  const lastShownRef = useRef<Player | null>(initialState.current_player ?? null);
  const prevStatusRef = useRef<AuctionState["status"]>(initialState.status);

  const refresh = async () => {
    try {
      const [stateRes, teamsRes, playersRes] = await Promise.all([
        fetch("/api/auction/state").then((r) => r.json()),
        fetch("/api/teams").then((r) => r.json()),
        fetch("/api/players").then((r) => r.json()),
      ]);

      const all     = (playersRes ?? []) as Player[];
      const pend    = all.filter((p) => p.status === "pending");
      const sold    = all.filter((p) => p.status === "sold");
      const unsold  = all.filter((p) => p.status === "unsold");

      const bought: Record<string, number> = {};
      sold.forEach((p) => {
        if (p.team_id) bought[p.team_id] = (bought[p.team_id] ?? 0) + 1;
      });

      setState(stateRes);
      setTeams(teamsRes ?? []);
      setPending(
        pend.map((p) => ({
          id:        p.id,
          name:      p.name,
          photo_url: p.photo_url,
          role:      p.role,
        }))
      );
      setCounts({ pending: pend.length, sold: sold.length, unsold: unsold.length });
      setSpend(sold.reduce((s, p) => s + (p.sold_for ?? 0), 0));
      setTotalPlayers(all.length);
      setBoughtByTeam(bought);
    } catch (err) {
      console.error("Big screen refresh failed:", err);
    }
  };

  // Realtime subscription
  useEffect(() => {
    const channel = subscribeToAuctionState(() => { refresh(); });
    return () => { channel.unsubscribe(); };
  }, []);

  // Cache the last-displayed player + clear overlay on new roll
  useEffect(() => {
    if (state.current_player) lastShownRef.current = state.current_player;
    if (state.status === "rolling") setOverlayPlayer(null);
  }, [state.current_player, state.status]);

  // Detect bidding → idle transition → fetch player to show SOLD/UNSOLD overlay
  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = state.status;

    if (prev === "bidding" && state.status === "idle" && lastShownRef.current) {
      const id = lastShownRef.current.id;
      fetch(`/api/players/${id}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((player: Player | null) => {
          if (player && (player.status === "sold" || player.status === "unsold")) {
            setOverlayPlayer(player);
          }
        })
        .catch(() => {});
    }
  }, [state.status]);

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{ background: "var(--color-bg)" }}
    >
      <StarField />
      <TopBar status={state.status} />

      <AnimatePresence mode="wait">
        {state.status === "idle" && (
          <IdleScreen
            key="idle"
            teams={teams}
            pendingCount={counts.pending}
            soldCount={counts.sold}
            unsoldCount={counts.unsold}
            totalSpend={spend}
          />
        )}

        {state.status === "rolling" && (
          <RollingAnimation
            key="rolling"
            pending={pending}
            pickedPlayer={state.current_player ?? null}
          />
        )}

        {state.status === "bidding" && state.current_player && (
          <BiddingState
            key="bidding"
            player={state.current_player}
            teams={teams}
          />
        )}

        {state.status === "ended" && (
          <EndedScreen
            key="ended"
            teams={teams.map((t) => ({
              ...t,
              playersBought: boughtByTeam[t.id] ?? 0,
            }))}
            totalPlayers={totalPlayers}
            totalSpend={spend}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {overlayPlayer && (
          <SoldOverlay
            key={`overlay-${overlayPlayer.id}`}
            player={overlayPlayer}
            onDismiss={() => setOverlayPlayer(null)}
          />
        )}
      </AnimatePresence>

      <Footer
        status={state.status}
        pendingCount={counts.pending}
        totalSpend={spend}
      />

      <style>{`
        @keyframes mna-pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%      { opacity: 1;   transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}

function TopBar({ status }: { status: AuctionState["status"] }) {
  return (
    <div
      className="relative z-40 flex items-center justify-between px-10 py-5 border-b"
      style={{ borderColor: "var(--color-border-subtle)" }}
    >
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center font-display text-2xl"
          style={{
            background: "linear-gradient(135deg, var(--color-gold-bright), var(--color-gold-dim))",
            color:      "#0a0e1a",
            boxShadow:  "0 0 24px rgba(245,158,11,0.45), inset 0 1px 0 rgba(255,255,255,0.4)",
          }}
        >
          M
        </div>
        <div>
          <p className="font-display tracking-[0.35em] text-2xl leading-none" style={{ color: "var(--color-text)" }}>
            MOON&nbsp;NIGHT
          </p>
          <p className="text-[11px] tracking-[0.6em] mt-1" style={{ color: "var(--color-text-subtle)" }}>
            AUCTION
          </p>
        </div>
      </div>

      <div
        className="flex items-center gap-3 px-5 py-2.5 rounded-full"
        style={{
          background: "rgba(17,24,39,0.75)",
          border:     "1px solid var(--color-border)",
          backdropFilter: "blur(8px)",
        }}
      >
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{
            background: getStatusColor(status),
            boxShadow:  `0 0 12px ${getStatusColor(status)}`,
            animation:  "mna-pulse 1.4s ease-in-out infinite",
          }}
        />
        <span
          className="font-display tracking-[0.4em] text-xs"
          style={{ color: "var(--color-text-muted)" }}
        >
          {getStatusLabel(status)}
        </span>
      </div>
    </div>
  );
}

function Footer({
  status, pendingCount, totalSpend,
}: { status: AuctionState["status"]; pendingCount: number; totalSpend: number }) {
  if (status === "ended" || status === "rolling") return null;
  return (
    <div
      className="absolute z-30 bottom-0 left-0 right-0 px-10 py-4 flex items-center justify-between text-xs tracking-[0.35em] font-display"
      style={{ color: "var(--color-text-subtle)" }}
    >
      <span>{pendingCount.toLocaleString()}&nbsp;IN&nbsp;POOL</span>
      <span>{totalSpend.toLocaleString()}&nbsp;PTS&nbsp;COMMITTED</span>
    </div>
  );
}

const STATUS_LABEL: Record<AuctionState["status"], string> = {
  idle:    "STANDING BY",
  rolling: "PICKING PLAYER",
  bidding: "BIDDING LIVE",
  sold:    "SOLD",
  ended:   "AUCTION COMPLETE",
};

function getStatusLabel(status: AuctionState["status"]) {
  return STATUS_LABEL[status];
}

const STATUS_COLOR: Record<AuctionState["status"], string> = {
  idle:    "var(--color-gold-bright)",
  rolling: "var(--color-gold-bright)",
  bidding: "var(--color-error)",
  sold:    "var(--color-success)",
  ended:   "var(--color-text-muted)",
};

function getStatusColor(status: AuctionState["status"]) {
  return STATUS_COLOR[status];
}

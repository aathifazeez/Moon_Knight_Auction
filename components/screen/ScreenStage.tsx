"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import Image from "next/image";
import type { AuctionState, Player, Team } from "@/types";
import { subscribeToAuctionState } from "@/lib/supabase/realtime";
import StarField from "./StarField";
import IdleScreen from "./IdleScreen";
import RollingAnimation, { type ReelPlayer } from "./RollingAnimation";
import BiddingState from "./BiddingState";
import BidTicker from "./BidTicker";
import SoldOverlay from "./SoldOverlay";
import EndedScreen from "./EndedScreen";

const STATUS_LABEL: Record<AuctionState["status"], string> = {
  idle:    "STANDING BY",
  rolling: "ROLLING",
  bidding: "BIDDING OPEN",
  sold:    "PLAYER SOLD",
  ended:   "AUCTION ENDED",
};

const STATUS_COLOR: Record<AuctionState["status"], string> = {
  idle:    "var(--color-text-subtle)",
  rolling: "var(--color-gold)",
  bidding: "var(--color-error)",
  sold:    "var(--color-success)",
  ended:   "var(--color-error)",
};

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
      className="relative w-screen overflow-hidden grid"
      style={{
        background:        "var(--color-bg)",
        height:            "100dvh",
        gridTemplateRows:  "1fr auto",
      }}
    >
      <StarField />

      {/* Floating top — logo + status pill (overlay, outside the grid flow) */}
      <TopBar status={state.status} />

      {/* Row 1 — stage */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait">
          {state.status === "idle" && (
            <IdleScreen
              key="idle"
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
      </div>

      {/* Row 2 — footer slot. Live BidTicker during bidding, status ticker otherwise. */}
      <AnimatePresence mode="wait">
        {state.status === "bidding" && state.current_player ? (
          <BidTicker
            key="bid-ticker"
            player={state.current_player}
            currentBid={state.current_bid ?? 0}
            leadingTeam={state.current_bid_team_obj ?? null}
            nextMinBid={state.next_min_bid ?? 0}
          />
        ) : (
          <Footer
            key="default-footer"
            status={state.status}
            pendingCount={counts.pending}
            totalSpend={spend}
          />
        )}
      </AnimatePresence>

      {/* SoldOverlay — fixed full-viewport, lives outside the grid */}
      <AnimatePresence>
        {overlayPlayer && (
          <SoldOverlay
            key={`overlay-${overlayPlayer.id}`}
            player={overlayPlayer}
            onDismiss={() => setOverlayPlayer(null)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}

function TopBar({ status }: { status: AuctionState["status"] }) {
  const color = STATUS_COLOR[status];
  const label = STATUS_LABEL[status];
  const isLive = status === "bidding" || status === "rolling";
  return (
    <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-8 py-3 pointer-events-none">

      {/* Left — league logo */}
      <div className="relative flex items-center" style={{ height: "clamp(40px, 5.5dvh, 64px)", width: "clamp(48px, 6.5dvh, 72px)" }}>
        <Image
          src="/image/IMG_3054.PNG"
          alt="Moon Knight Super League"
          fill
          priority
          sizes="72px"
          className="object-contain"
          style={{ filter: "drop-shadow(0 0 14px rgba(245,158,11,0.4))" }}
        />
      </div>

      {/* Right — status pill */}
      <div
        className="flex items-center gap-2.5 px-4 py-1.5 rounded-full border"
        style={{
          background:  "rgba(17, 24, 39, 0.65)",
          borderColor: "var(--color-border)",
        }}
      >
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{
            background: color,
            boxShadow:  isLive ? `0 0 10px ${color}` : "none",
            animation:  isLive ? "mna-statuspulse 1.4s ease-in-out infinite" : undefined,
          }}
        />
        <span
          className="font-display tracking-[0.35em]"
          style={{ fontSize: "clamp(10px, 1.3dvh, 13px)", color }}
        >
          {label}
        </span>
      </div>

      <style>{`
        @keyframes mna-statuspulse {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50%      { opacity: 1;    transform: scale(1.35); }
        }
      `}</style>
    </div>
  );
}

function Footer({
  status, pendingCount, totalSpend,
}: { status: AuctionState["status"]; pendingCount: number; totalSpend: number }) {
  // Hidden during rolling (distracts from the reel), bidding (BidTicker
  // takes over in Phase 4), and ended (own footer in EndedScreen).
  if (status === "ended" || status === "rolling" || status === "bidding") return null;
  return (
    <div
      className="relative z-30 px-10 py-4 flex items-center justify-between text-xs tracking-[0.35em] font-display"
      style={{ color: "var(--color-text-subtle)" }}
    >
      <span>{pendingCount.toLocaleString()}&nbsp;IN&nbsp;POOL</span>
      <span>{totalSpend.toLocaleString()}&nbsp;PTS&nbsp;COMMITTED</span>
    </div>
  );
}

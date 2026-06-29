"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Play, Gavel, XCircle, Flag, Loader2, UserCircle, RotateCcw, TrendingUp, Pencil } from "lucide-react";
import type { AuctionState, Team } from "@/types";
import { subscribeToAuctionState } from "@/lib/supabase/realtime";
import { formatPoints } from "@/lib/utils";
import { getMinIncrement } from "@/lib/auction/bidding";
import { RoleBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

interface Props {
  initialState: AuctionState;
  initialTeams: Team[];
  initialCounts: { pending: number; sold: number; unsold: number };
}

const ROLLING_MS = 10000;

const STATUS_LABEL: Record<string, string> = {
  idle:    "Idle — Ready to pick",
  rolling: "Selecting player...",
  bidding: "Bidding Open",
  sold:    "Player Sold",
  ended:   "Auction Ended",
};

function StatusDot({ status }: { status: string }) {
  const color: Record<string, string> = {
    idle:    "var(--color-text-subtle)",
    rolling: "var(--color-gold)",
    bidding: "var(--color-success)",
    sold:    "var(--color-success)",
    ended:   "var(--color-error)",
  };
  const glow = status === "bidding" || status === "rolling";
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
      style={{
        background:  color[status] ?? "var(--color-text-subtle)",
        boxShadow:   glow ? `0 0 8px ${color[status]}` : "none",
      }}
    />
  );
}

export default function AuctionControl({ initialState, initialTeams, initialCounts }: Props) {
  const [auctionState,    setAuctionState]    = useState<AuctionState>(initialState);
  const [teams,           setTeams]           = useState<Team[]>(initialTeams);
  const [counts,          setCounts]          = useState(initialCounts);
  const [selectedTeamId,  setSelectedTeamId]  = useState("");
  const [soldFor,         setSoldFor]         = useState("");
  const [bidTeamId,       setBidTeamId]       = useState("");
  const [bidAmount,       setBidAmount]       = useState("");
  const [editPrice,       setEditPrice]       = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [errorMsg,        setErrorMsg]        = useState<string | null>(null);
  const rollingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const safeFetch = async (url: string, init?: RequestInit) => {
    setErrorMsg(null);
    try {
      const res  = await fetch(url, init);
      const text = await res.text();
      let json: unknown = null;
      try { json = text ? JSON.parse(text) : null; } catch { /* not json */ }

      if (!res.ok) {
        const errorField = (json as { error?: string } | null)?.error;
        const message    = errorField ?? `${res.status} ${res.statusText}`;
        setErrorMsg(message);
        console.error(`[AuctionControl] ${url} failed:`, message);
        return null;
      }
      return json;
    } catch (e) {
      const message = e instanceof Error ? e.message : "network error";
      setErrorMsg(message);
      console.error(`[AuctionControl] ${url} threw:`, e);
      return null;
    }
  };

  // Fetch fresh state + teams + counts from the server
  const refreshAll = useCallback(async () => {
    const [stateRes, teamsRes, playersRes] = await Promise.all([
      fetch("/api/auction/state"),
      fetch("/api/teams"),
      fetch("/api/players"),
    ]);
    if (stateRes.ok)   setAuctionState(await stateRes.json());
    if (teamsRes.ok)   setTeams(await teamsRes.json());
    if (playersRes.ok) {
      const players: { status: string }[] = await playersRes.json();
      setCounts({
        pending: players.filter((p) => p.status === "pending").length,
        sold:    players.filter((p) => p.status === "sold").length,
        unsold:  players.filter((p) => p.status === "unsold").length,
      });
    }
  }, []);

  // Realtime: on any external auction_state update, re-fetch full state
  useEffect(() => {
    const channel = subscribeToAuctionState(async () => { await refreshAll(); });
    return () => { channel.unsubscribe(); };
  }, [refreshAll]);

  // Pre-fill bid amount with the live next-min floor, and the override
  // "sold_for" with the current bid so the manual path is one click away.
  useEffect(() => {
    if (auctionState.status === "bidding") {
      setBidAmount(String(auctionState.next_min_bid ?? 0));
      setSoldFor(String(auctionState.current_bid ?? auctionState.current_player?.base_points ?? 0));
    }
    if (auctionState.status === "idle") {
      setSelectedTeamId("");
      setSoldFor("");
      setBidTeamId("");
      setBidAmount("");
      setEditPrice(false);
    }
  }, [auctionState.status, auctionState.current_bid, auctionState.next_min_bid, auctionState.current_player]);

  // Auto-transition: rolling → bidding after ROLLING_MS
  useEffect(() => {
    if (auctionState.status !== "rolling") return;
    rollingTimer.current = setTimeout(async () => {
      const json = await safeFetch("/api/auction/state", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: "bidding" }),
      });
      if (json) setAuctionState(json as AuctionState);
    }, ROLLING_MS);
    return () => {
      if (rollingTimer.current) clearTimeout(rollingTimer.current);
    };
  }, [auctionState.status]);

  const patchStatus = async (status: string) => {
    setLoading(true);
    const json = await safeFetch("/api/auction/state", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status }),
    });
    if (json) setAuctionState(json as AuctionState);
    setLoading(false);
  };

  const handlePickPlayer = () => patchStatus("rolling");
  const handleEnd        = () => patchStatus("ended");
  const handleReset      = () => patchStatus("idle");

  const handleAssign = async (markUnsold = false) => {
    if (!markUnsold && (!selectedTeamId || !soldFor)) return;
    setLoading(true);
    await safeFetch("/api/auction/assign", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(
        markUnsold
          ? { mark_unsold: true }
          : { team_id: selectedTeamId, sold_for: Number(soldFor) }
      ),
    });
    await refreshAll();
    setLoading(false);
  };

  const handleRecordBid = async (teamId: string) => {
    if (!teamId || !bidAmount) return;
    setBidTeamId(teamId);
    setLoading(true);
    const json = await safeFetch("/api/auction/bid", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ team_id: teamId, amount: Number(bidAmount) }),
    });
    if (json) setAuctionState(json as AuctionState);
    setBidTeamId("");
    setLoading(false);
  };

  const handleSold = async () => {
    // Override path — use selected team + manual price
    if (editPrice) {
      await handleAssign(false);
      return;
    }
    setLoading(true);
    await safeFetch("/api/auction/assign", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({}),  // auto-finalize from current_bid / current_bid_team
    });
    await refreshAll();
    setLoading(false);
  };

  const { status, current_player: player } = auctionState;
  const isIdle    = status === "idle";
  const isRolling = status === "rolling";
  const isBidding = status === "bidding";
  const isEnded   = status === "ended";

  const total    = counts.pending + counts.sold + counts.unsold;
  const progress = total > 0 ? ((counts.sold + counts.unsold) / total) * 100 : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Error banner */}
      {errorMsg && (
        <div
          className="flex items-start gap-3 px-4 py-3 rounded-xl border text-sm"
          style={{
            background:  "var(--color-error-dim)",
            borderColor: "var(--color-error)",
            color:       "#fecaca",
          }}
        >
          <XCircle size={18} className="shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold mb-0.5">Auction action failed</p>
            <p className="text-xs opacity-90 break-all">{errorMsg}</p>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-xs underline opacity-80 hover:opacity-100"
          >
            dismiss
          </button>
        </div>
      )}

      {/* Top status bar */}
      <div
        className="flex items-center justify-between px-5 py-3 rounded-xl border"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        <div className="flex items-center gap-2.5">
          <StatusDot status={status} />
          <span className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>
            {STATUS_LABEL[status]}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isEnded ? (
            <Button variant="secondary" size="sm" onClick={handleReset} loading={loading}>
              <RotateCcw size={13} /> Reset
            </Button>
          ) : (
            <Button variant="danger" size="sm" onClick={handleEnd} loading={loading} disabled={isRolling}>
              <Flag size={13} /> End Auction
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: player card + actions */}
        <div className="lg:col-span-3 flex flex-col gap-4">

          {/* Current player card */}
          <div
            className="rounded-xl border p-6 min-h-[120px] flex items-center"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            {isRolling ? (
              <div className="flex items-center gap-5 w-full">
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "var(--color-surface-raised)" }}
                >
                  <Loader2 size={26} className="animate-spin" style={{ color: "var(--color-gold)" }} />
                </div>
                <div>
                  <p className="font-display text-2xl tracking-wide" style={{ color: "var(--color-gold)" }}>
                    SELECTING...
                  </p>
                  <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
                    Randomly picking a pending player
                  </p>
                </div>
              </div>
            ) : player ? (
              <div className="flex items-center gap-5 w-full">
                <div
                  className="w-16 h-16 rounded-xl overflow-hidden shrink-0"
                  style={{ background: "var(--color-surface-raised)" }}
                >
                  {player.photo_url ? (
                    <Image src={player.photo_url} alt={player.name} width={64} height={64} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UserCircle size={28} style={{ color: "var(--color-text-subtle)" }} />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <p className="font-display text-2xl tracking-wide" style={{ color: "var(--color-text)" }}>
                    {player.name}
                  </p>
                  <div className="flex items-center gap-3">
                    <RoleBadge role={player.role} />
                    <span className="text-xs tabular-nums" style={{ color: "var(--color-text-muted)" }}>
                      Base: {formatPoints(player.base_points)} pts
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-5 w-full">
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "var(--color-surface-raised)" }}
                >
                  <UserCircle size={28} style={{ color: "var(--color-text-subtle)" }} />
                </div>
                <div>
                  <p className="font-semibold" style={{ color: "var(--color-text-muted)" }}>
                    {isEnded ? "Auction has ended" : "No player selected"}
                  </p>
                  {isIdle && (
                    <p className="text-sm mt-0.5" style={{ color: "var(--color-text-subtle)" }}>
                      Click &quot;Pick Next Player&quot; to begin
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pick player button (idle only) */}
          {isIdle && counts.pending > 0 && (
            <Button variant="primary" size="lg" onClick={handlePickPlayer} loading={loading} className="self-start">
              <Play size={16} /> Pick Next Player
            </Button>
          )}

          {isIdle && counts.pending === 0 && !isEnded && (
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              All players have been auctioned. You can end the auction.
            </p>
          )}

          {/* Bidding panels (bidding only) */}
          {isBidding && (
            <>
              <LeadingBidCard
                currentBid={auctionState.current_bid ?? 0}
                leadingTeam={auctionState.current_bid_team_obj ?? null}
              />

              <RecordBidPanel
                teams={teams}
                currentBid={auctionState.current_bid ?? 0}
                nextMinBid={auctionState.next_min_bid ?? 0}
                bidAmount={bidAmount}
                pendingTeamId={bidTeamId}
                onAmountChange={setBidAmount}
                onRecord={handleRecordBid}
                loading={loading}
              />

              <FinalizePanel
                hasLeadingBid={Boolean(auctionState.current_bid_team)}
                editPrice={editPrice}
                onToggleEdit={() => setEditPrice((e) => !e)}
                teams={teams}
                selectedTeamId={selectedTeamId}
                soldFor={soldFor}
                onSelectedTeamChange={setSelectedTeamId}
                onSoldForChange={setSoldFor}
                onSold={handleSold}
                onUnsold={() => handleAssign(true)}
                loading={loading}
              />
            </>
          )}
        </div>

        {/* Right: progress + team budgets */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Progress card */}
          <div
            className="rounded-xl border p-5 flex flex-col gap-4"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
              Progress
            </p>
            <div className="grid grid-cols-3 text-center gap-2">
              {[
                { label: "Sold",    value: counts.sold,    color: "var(--color-success)" },
                { label: "Pending", value: counts.pending, color: "var(--color-gold)"    },
                { label: "Unsold",  value: counts.unsold,  color: "var(--color-error)"   },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="font-display text-3xl leading-none" style={{ color }}>{value}</span>
                  <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--color-text-subtle)" }}>{label}</span>
                </div>
              ))}
            </div>
            <div>
              <div className="w-full h-1.5 rounded-full" style={{ background: "var(--color-border)" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, background: "var(--color-gold)" }}
                />
              </div>
              <p className="text-xs mt-1.5 text-right" style={{ color: "var(--color-text-subtle)" }}>
                {counts.sold + counts.unsold} / {total} done
              </p>
            </div>
          </div>

          {/* Team budgets card */}
          <div
            className="rounded-xl border p-5 flex flex-col gap-4"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
              Team Budgets
            </p>
            {teams.map((team) => {
              const pct       = team.budget > 0 ? (team.budget_used / team.budget) * 100 : 0;
              const remaining = team.budget - team.budget_used;
              return (
                <div key={team.id} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: team.color_hex }} />
                      <span className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>{team.name}</span>
                    </div>
                    <span
                      className="text-xs tabular-nums"
                      style={{ color: remaining < 0 ? "var(--color-error)" : "var(--color-text-muted)" }}
                    >
                      {formatPoints(remaining)} left
                    </span>
                  </div>
                  <div className="w-full h-1 rounded-full" style={{ background: "var(--color-border)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width:      `${Math.min(pct, 100)}%`,
                        background: pct > 80 ? "var(--color-error)" : team.color_hex,
                      }}
                    />
                  </div>
                </div>
              );
            })}
            {teams.length === 0 && (
              <p className="text-sm" style={{ color: "var(--color-text-subtle)" }}>No teams created yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────
   Bidding-phase sub-components
   ─────────────────────────────────────────────────────────────── */

function LeadingBidCard({
  currentBid, leadingTeam,
}: { currentBid: number; leadingTeam: Team | null }) {
  return (
    <div
      className="rounded-xl border p-5 flex items-center justify-between gap-4"
      style={{
        background:  "linear-gradient(135deg, rgba(245,158,11,0.08), var(--color-surface))",
        borderColor: "var(--color-gold-dim)",
      }}
    >
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--color-gold)" }}>
          Leading Bid
        </p>
        {leadingTeam ? (
          <div className="flex items-center gap-2.5">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ background: leadingTeam.color_hex, boxShadow: `0 0 10px ${leadingTeam.color_hex}` }}
            />
            <p className="font-display tracking-wide text-lg" style={{ color: "var(--color-text)" }}>
              {leadingTeam.name}
            </p>
          </div>
        ) : (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Awaiting first bid — base price is the floor
          </p>
        )}
      </div>
      <div className="text-right">
        <p
          className="font-display tabular-nums"
          style={{ fontSize: 38, lineHeight: 1, color: "var(--color-gold-bright)" }}
        >
          {currentBid.toLocaleString()}
        </p>
        <p className="text-[10px] tracking-widest mt-1" style={{ color: "var(--color-text-subtle)" }}>
          PTS
        </p>
      </div>
    </div>
  );
}

function RecordBidPanel({
  teams, currentBid, nextMinBid, bidAmount, pendingTeamId,
  onAmountChange, onRecord, loading,
}: {
  teams: Team[];
  currentBid: number;
  nextMinBid: number;
  bidAmount: string;
  pendingTeamId: string;
  onAmountChange: (v: string) => void;
  onRecord:       (teamId: string) => void;
  loading: boolean;
}) {
  const amount = Number(bidAmount) || 0;
  const minInc = getMinIncrement(currentBid);
  const amountValid = amount >= nextMinBid;

  // Quick-step suggestions: the floor, +1 tier, +2 tiers
  const quickSteps = [
    { label: "Min",                     value: nextMinBid },
    { label: `+${minInc.toLocaleString()}`, value: currentBid + minInc * 2 },
    { label: `+${(minInc * 3).toLocaleString()}`, value: currentBid + minInc * 4 },
  ].filter((s, i, arr) => s.value > currentBid && arr.findIndex((x) => x.value === s.value) === i);

  return (
    <div
      className="rounded-xl border p-6 flex flex-col gap-5"
      style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
          Record Next Bid
        </p>
        <p className="text-xs" style={{ color: "var(--color-text-subtle)" }}>
          Minimum: <span style={{ color: "var(--color-gold)" }}>{nextMinBid.toLocaleString()} pts</span>
        </p>
      </div>

      {/* Amount + quick chips */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
          Bid Amount
        </label>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="number"
            min={1}
            value={bidAmount}
            onChange={(e) => onAmountChange(e.target.value)}
            className="rounded-lg px-4 py-2.5 text-sm outline-none w-40 tabular-nums"
            style={{
              background: "var(--color-surface-raised)",
              border:     "1px solid var(--color-border)",
              color:      "var(--color-text)",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-gold)")}
            onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--color-border)")}
          />
          {quickSteps.map((s) => (
            <button
              key={s.label + s.value}
              type="button"
              onClick={() => onAmountChange(String(s.value))}
              className="px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
              style={{
                background:  amount === s.value ? "rgba(245,158,11,0.18)" : "var(--color-surface-raised)",
                border:      `1px solid ${amount === s.value ? "var(--color-gold)" : "var(--color-border)"}`,
                color:       amount === s.value ? "var(--color-gold-bright)" : "var(--color-text-muted)",
              }}
            >
              <TrendingUp size={12} />
              {s.label}
              <span className="tabular-nums opacity-70">{s.value.toLocaleString()}</span>
            </button>
          ))}
        </div>
        {amount > 0 && !amountValid && (
          <p className="text-xs" style={{ color: "var(--color-error)" }}>
            Below minimum — needs at least {nextMinBid.toLocaleString()} pts
          </p>
        )}
      </div>

      {/* Team picker — click a team to instantly record the bid */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
          Tap Team to Record Bid &nbsp;·&nbsp;{" "}
          <span style={{ color: "var(--color-gold)" }}>{amount.toLocaleString()} pts</span>
        </label>
        <div className="flex flex-col gap-2">
          {teams.map((team) => {
            const remaining   = team.budget - team.budget_used;
            const insufficient = amount > 0 && remaining < amount;
            const disabled    = !amountValid || insufficient || loading;
            const isPending   = pendingTeamId === team.id && loading;
            return (
              <button
                key={team.id}
                type="button"
                disabled={disabled}
                onClick={() => onRecord(team.id)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all disabled:cursor-not-allowed"
                style={{
                  background:  isPending ? "rgba(245,158,11,0.18)" : "var(--color-surface-raised)",
                  border:      `1px solid ${isPending ? "var(--color-gold)" : "var(--color-border)"}`,
                  opacity:     insufficient || !amountValid ? 0.4 : 1,
                }}
              >
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: team.color_hex }} />
                <span className="font-semibold text-sm flex-1" style={{ color: "var(--color-text)" }}>
                  {team.name}
                </span>
                {isPending ? (
                  <Loader2 size={14} className="animate-spin" style={{ color: "var(--color-gold)" }} />
                ) : (
                  <span
                    className="text-xs tabular-nums"
                    style={{ color: insufficient ? "var(--color-error)" : "var(--color-text-muted)" }}
                  >
                    {formatPoints(remaining)} left
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FinalizePanel({
  hasLeadingBid, editPrice, onToggleEdit,
  teams, selectedTeamId, soldFor,
  onSelectedTeamChange, onSoldForChange,
  onSold, onUnsold, loading,
}: {
  hasLeadingBid: boolean;
  editPrice:     boolean;
  onToggleEdit:  () => void;
  teams:         Team[];
  selectedTeamId: string;
  soldFor:        string;
  onSelectedTeamChange: (id: string) => void;
  onSoldForChange:      (v: string) => void;
  onSold:               () => void;
  onUnsold:             () => void;
  loading:              boolean;
}) {
  const overrideValid = Boolean(selectedTeamId) && Number(soldFor) > 0;
  const canSold       = editPrice ? overrideValid : hasLeadingBid;

  return (
    <div
      className="rounded-xl border p-6 flex flex-col gap-4"
      style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
          Finalize
        </p>
        <button
          type="button"
          onClick={onToggleEdit}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md transition-all"
          style={{
            background:  editPrice ? "rgba(245,158,11,0.15)" : "transparent",
            border:      `1px solid ${editPrice ? "var(--color-gold)" : "var(--color-border)"}`,
            color:       editPrice ? "var(--color-gold-bright)" : "var(--color-text-muted)",
          }}
        >
          <Pencil size={11} /> {editPrice ? "Manual override on" : "Edit price"}
        </button>
      </div>

      {editPrice && (
        <div className="flex flex-col gap-3 p-4 rounded-lg" style={{ background: "var(--color-surface-raised)" }}>
          <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
            Override Team
          </label>
          <div className="flex flex-col gap-2">
            {teams.map((team) => {
              const isSelected = selectedTeamId === team.id;
              return (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => onSelectedTeamChange(team.id)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all"
                  style={{
                    background:  isSelected ? "rgba(245,158,11,0.1)" : "var(--color-surface)",
                    border:      `1px solid ${isSelected ? "var(--color-gold)" : "var(--color-border)"}`,
                  }}
                >
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: team.color_hex }} />
                  <span className="font-semibold text-sm flex-1" style={{ color: "var(--color-text)" }}>
                    {team.name}
                  </span>
                </button>
              );
            })}
          </div>
          <label className="text-xs font-semibold uppercase tracking-widest mt-1" style={{ color: "var(--color-text-muted)" }}>
            Override Price (pts)
          </label>
          <input
            type="number"
            min={1}
            value={soldFor}
            onChange={(e) => onSoldForChange(e.target.value)}
            className="rounded-lg px-4 py-2.5 text-sm outline-none w-40 tabular-nums"
            style={{
              background: "var(--color-surface)",
              border:     "1px solid var(--color-border)",
              color:      "var(--color-text)",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-gold)")}
            onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--color-border)")}
          />
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="primary" onClick={onSold} loading={loading} disabled={!canSold}>
          <Gavel size={15} /> SOLD
        </Button>
        <Button variant="danger" onClick={onUnsold} loading={loading}>
          <XCircle size={15} /> UNSOLD
        </Button>
      </div>

      {!editPrice && !hasLeadingBid && (
        <p className="text-xs" style={{ color: "var(--color-text-subtle)" }}>
          Record at least one bid above before clicking SOLD, or toggle &quot;Edit price&quot; to enter manually.
        </p>
      )}
    </div>
  );
}

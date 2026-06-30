"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Search, Plus, Pencil, Trash2, UserCircle, RotateCcw } from "lucide-react";
import type { Player, Team, PlayerStatus, PlayerRole } from "@/types";
import { RoleBadge, StatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { formatPoints } from "@/lib/utils";

const STATUS_TABS: { label: string; value: PlayerStatus | "all" }[] = [
  { label: "All",     value: "all"     },
  { label: "Pending", value: "pending" },
  { label: "Sold",    value: "sold"    },
  { label: "Unsold",  value: "unsold"  },
];

const ROLE_OPTS: { label: string; value: PlayerRole | "all" }[] = [
  { label: "All Roles",     value: "all"         },
  { label: "Batsman",       value: "batsman"      },
  { label: "Bowler",        value: "bowler"       },
  { label: "All-Rounder",   value: "allrounder"   },
  { label: "Wicket-Keeper", value: "wicketkeeper" },
];

interface Props {
  players: (Player & { team?: Pick<Team, "id" | "name" | "color_hex"> | null })[];
}

export default function PlayerTable({ players }: Props) {
  const router = useRouter();
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState<PlayerStatus | "all">("all");
  const [roleFilter, setRoleFilter]     = useState<PlayerRole | "all">("all");
  const [deleteTarget, setDeleteTarget] = useState<Player | null>(null);
  const [deleting, setDeleting]         = useState(false);
  const [showResetAll, setShowResetAll] = useState(false);
  const [resettingAll, setResettingAll] = useState(false);
  const [resettingId, setResettingId]   = useState<string | null>(null);

  const handleResetOne = async (id: string) => {
    setResettingId(id);
    await fetch(`/api/players/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status: "pending", team_id: null, sold_for: null, auction_order: null }),
    });
    setResettingId(null);
    router.refresh();
  };

  const handleResetAll = async () => {
    setResettingAll(true);
    await fetch("/api/players/reset", { method: "POST" });
    setResettingAll(false);
    setShowResetAll(false);
    router.refresh();
  };

  const filtered = players.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (roleFilter   !== "all" && p.role   !== roleFilter)   return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await fetch(`/api/players/${deleteTarget.id}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteTarget(null);
    router.refresh();
  };

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
          <input
            type="text"
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg outline-none"
            style={{
              background: "var(--color-surface-raised)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-gold)")}
            onBlur={(e)  => (e.currentTarget.style.borderColor = "var(--color-border)")}
          />
        </div>

        {/* Role filter */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as PlayerRole | "all")}
          className="px-3 py-2.5 text-sm rounded-lg outline-none"
          style={{
            background: "var(--color-surface-raised)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
          }}
        >
          {ROLE_OPTS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>

        <Button
          variant="ghost"
          size="md"
          className="whitespace-nowrap"
          onClick={() => setShowResetAll(true)}
        >
          <RotateCcw size={15} /> Reset All to Pending
        </Button>
        <Link href="/admin/players/new">
          <Button variant="primary" size="md" className="whitespace-nowrap">
            <Plus size={16} /> Add Player
          </Button>
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 mb-4 border-b" style={{ borderColor: "var(--color-border)" }}>
        {STATUS_TABS.map((tab) => {
          const active = statusFilter === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 -mb-px transition-colors"
              style={{
                borderBottomColor: active ? "var(--color-gold)" : "transparent",
                color: active ? "var(--color-gold)" : "var(--color-text-muted)",
              }}
            >
              {tab.label}
            </button>
          );
        })}
        <span className="ml-auto py-2 text-xs" style={{ color: "var(--color-text-subtle)" }}>
          {filtered.length} player{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--color-surface-raised)", borderBottom: "1px solid var(--color-border)" }}>
              {["Photo", "Name", "Role", "Base Pts", "Status", "Team", ""].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
                  No players found
                </td>
              </tr>
            ) : (
              filtered.map((player, i) => (
                <tr
                  key={player.id}
                  style={{
                    borderBottom: i < filtered.length - 1 ? "1px solid var(--color-border-subtle)" : "none",
                    background: "var(--color-surface)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-surface-raised)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-surface)")}
                >
                  {/* Photo */}
                  <td className="px-4 py-3">
                    <div className="w-9 h-9 rounded-lg overflow-hidden" style={{ background: "var(--color-surface-high)" }}>
                      {player.photo_url ? (
                        <Image src={player.photo_url} alt={player.name} width={36} height={36} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <UserCircle size={20} style={{ color: "var(--color-text-subtle)" }} />
                        </div>
                      )}
                    </div>
                  </td>
                  {/* Name */}
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--color-text)" }}>{player.name}</td>
                  {/* Role */}
                  <td className="px-4 py-3"><RoleBadge role={player.role} /></td>
                  {/* Base Pts */}
                  <td className="px-4 py-3 tabular-nums" style={{ color: "var(--color-text-muted)" }}>
                    {formatPoints(player.base_points)}
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3"><StatusBadge status={player.status} /></td>
                  {/* Team */}
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {player.team ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: player.team.color_hex }} />
                        {player.team.name}
                      </span>
                    ) : "—"}
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <Link href={`/admin/players/${player.id}`}>
                        <button
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: "var(--color-text-muted)" }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-gold)"; e.currentTarget.style.background = "rgba(245,158,11,0.1)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-muted)"; e.currentTarget.style.background = "transparent"; }}
                        >
                          <Pencil size={14} />
                        </button>
                      </Link>
                      {player.status === "unsold" && (
                        <button
                          onClick={() => handleResetOne(player.id)}
                          disabled={resettingId === player.id}
                          title="Move back to Pending"
                          className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
                          style={{ color: "var(--color-text-muted)" }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-gold)"; e.currentTarget.style.background = "rgba(245,158,11,0.1)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-muted)"; e.currentTarget.style.background = "transparent"; }}
                        >
                          <RotateCcw size={14} className={resettingId === player.id ? "animate-spin" : ""} />
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteTarget(player)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: "var(--color-text-muted)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-error)"; e.currentTarget.style.background = "var(--color-error-dim)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-muted)"; e.currentTarget.style.background = "transparent"; }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete confirm modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Player" size="sm">
        <div className="flex flex-col gap-4">
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Are you sure you want to delete{" "}
            <span className="font-semibold" style={{ color: "var(--color-text)" }}>{deleteTarget?.name}</span>?
            This cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>

      {/* Reset all players modal */}
      <Modal isOpen={showResetAll} onClose={() => setShowResetAll(false)} title="Reset All Players" size="sm">
        <div className="flex flex-col gap-4">
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            This will set <span className="font-semibold" style={{ color: "var(--color-text)" }}>all players</span> back
            to <span style={{ color: "var(--color-gold)" }}>pending</span> and clear their team, sold price, and auction order.
            Use this to reset after a test run.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowResetAll(false)}>Cancel</Button>
            <Button variant="danger" loading={resettingAll} onClick={handleResetAll}>Reset All</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

"use client";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { Team } from "@/types";

interface Props {
  teams: Team[];
  pendingCount: number;
  soldCount:    number;
  unsoldCount:  number;
  totalSpend:   number;
}

export default function IdleScreen({
  teams,
  pendingCount,
  soldCount,
  unsoldCount,
  totalSpend,
}: Props) {
  return (
    <motion.div
      key="idle"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="relative z-10 flex flex-col items-center justify-center min-h-screen px-12 py-24"
    >
      {/* Hero */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="flex flex-col items-center gap-6 mb-20"
      >
        <div
          className="flex items-center gap-3 px-6 py-2 rounded-full border"
          style={{
            background: "rgba(245, 158, 11, 0.08)",
            borderColor: "var(--color-gold-dim)",
            boxShadow: "0 0 30px rgba(245, 158, 11, 0.15)",
          }}
        >
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{
              background: "var(--color-gold-bright)",
              boxShadow: "0 0 12px var(--color-gold-bright)",
              animation: "mna-pulse 1.6s ease-in-out infinite",
            }}
          />
          <span
            className="font-display text-xl tracking-[0.3em]"
            style={{ color: "var(--color-gold-bright)" }}
          >
            STANDING&nbsp;BY
          </span>
        </div>

        <motion.h1
          animate={{
            textShadow: [
              "0 0 30px rgba(245,158,11,0.3)",
              "0 0 60px rgba(245,158,11,0.55)",
              "0 0 30px rgba(245,158,11,0.3)",
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="font-display text-center leading-[0.9] tracking-wider"
          style={{
            fontSize: "clamp(96px, 14vw, 240px)",
            color: "var(--color-text)",
            background:
              "linear-gradient(180deg, #fef3c7 0%, var(--color-gold-bright) 40%, var(--color-gold) 80%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          AWAITING<br />NEXT&nbsp;PLAYER
        </motion.h1>

        <div className="flex items-center gap-3 mt-2">
          <Sparkles className="w-5 h-5" style={{ color: "var(--color-gold)" }} />
          <p
            className="font-display text-2xl tracking-[0.4em]"
            style={{ color: "var(--color-text-muted)" }}
          >
            THE STAGE IS SET
          </p>
          <Sparkles className="w-5 h-5" style={{ color: "var(--color-gold)" }} />
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.7 }}
        className="grid grid-cols-4 gap-6 w-full max-w-6xl mb-16"
      >
        <StatTile label="IN POOL"        value={pendingCount} accent="gold" />
        <StatTile label="PLAYERS SOLD"   value={soldCount}    accent="success" />
        <StatTile label="UNSOLD"         value={unsoldCount}  accent="muted" />
        <StatTile label="TOTAL SPEND"    value={totalSpend}   accent="gold" suffix="pts" />
      </motion.div>

      {/* Team rail */}
      {teams.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.7 }}
          className="w-full max-w-6xl"
        >
          <p
            className="font-display text-sm tracking-[0.35em] text-center mb-5"
            style={{ color: "var(--color-text-subtle)" }}
          >
            COMPETING&nbsp;TEAMS
          </p>
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${Math.min(teams.length, 4)}, minmax(0, 1fr))`,
            }}
          >
            {teams.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 px-5 py-3 rounded-xl border backdrop-blur-sm"
                style={{
                  background: "rgba(17, 24, 39, 0.55)",
                  borderColor: "var(--color-border)",
                }}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0"
                  style={{
                    background: t.color_hex,
                    boxShadow: `0 0 14px ${t.color_hex}80`,
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-display tracking-wider text-lg truncate" style={{ color: "var(--color-text)" }}>
                    {t.name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--color-text-subtle)" }}>
                    {(t.budget - t.budget_used).toLocaleString()} pts left
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <style>{`
        @keyframes mna-pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%      { opacity: 1;   transform: scale(1.3); }
        }
      `}</style>
    </motion.div>
  );
}

function StatTile({
  label, value, accent, suffix,
}: {
  label: string;
  value: number;
  accent: "gold" | "success" | "muted";
  suffix?: string;
}) {
  const color =
    accent === "gold"    ? "var(--color-gold-bright)" :
    accent === "success" ? "var(--color-success)"     :
                           "var(--color-text-muted)";
  return (
    <div
      className="relative rounded-2xl border px-6 py-5 backdrop-blur-md overflow-hidden"
      style={{
        background:  "rgba(17, 24, 39, 0.6)",
        borderColor: "var(--color-border)",
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
      />
      <p className="font-display text-xs tracking-[0.3em]" style={{ color: "var(--color-text-subtle)" }}>
        {label}
      </p>
      <p className="font-display mt-2 tabular-nums" style={{ fontSize: 56, color, lineHeight: 1 }}>
        {value.toLocaleString()}
        {suffix && <span className="text-base ml-2 tracking-wider" style={{ color: "var(--color-text-muted)" }}>{suffix}</span>}
      </p>
    </div>
  );
}

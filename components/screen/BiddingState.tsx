"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import type { Player, PlayerRole, Team } from "@/types";

const ROLE_LABEL: Record<PlayerRole, string> = {
  batsman:      "BATSMAN",
  bowler:       "BOWLER",
  allrounder:   "ALL-ROUNDER",
  wicketkeeper: "WICKET-KEEPER",
};

const ROLE_COLOR: Record<PlayerRole, string> = {
  batsman:      "var(--color-batsman)",
  bowler:       "var(--color-bowler)",
  allrounder:   "var(--color-allrounder)",
  wicketkeeper: "var(--color-wk)",
};

interface Props {
  player: Player;
  teams:  Team[];
}

export default function BiddingState({ player, teams }: Props) {
  const roleColor = ROLE_COLOR[player.role];
  const initials  = player.name
    .split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <motion.div
      key="bidding"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="relative z-10 min-h-screen w-full grid pt-24 pb-12 px-10 gap-10"
      style={{ gridTemplateColumns: "minmax(0, 3fr) minmax(360px, 1.2fr)" }}
    >
      {/* LEFT — Player hero */}
      <div className="flex flex-col items-center justify-center gap-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-3 px-5 py-2 rounded-full border"
          style={{
            background:   "rgba(239, 68, 68, 0.10)",
            borderColor:  "rgba(239, 68, 68, 0.4)",
            boxShadow:    "0 0 30px rgba(239, 68, 68, 0.18)",
          }}
        >
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{
              background: "var(--color-error)",
              boxShadow:  "0 0 14px var(--color-error)",
              animation:  "mna-pulse 1.2s ease-in-out infinite",
            }}
          />
          <span
            className="font-display tracking-[0.4em] text-lg"
            style={{ color: "#fca5a5" }}
          >
            BIDDING&nbsp;OPEN
          </span>
        </motion.div>

        {/* Photo */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0, rotateY: -10 }}
          animate={{ scale: 1, opacity: 1, rotateY: 0 }}
          transition={{ delay: 0.3, duration: 0.7, type: "spring", bounce: 0.35 }}
          className="relative"
        >
          {/* Outer halo */}
          <div
            className="absolute inset-0 rounded-full -m-6"
            style={{
              background: `radial-gradient(circle, ${roleColor}40, transparent 70%)`,
              animation:  "mna-breathe 3s ease-in-out infinite",
            }}
          />

          <div
            className="relative rounded-full overflow-hidden"
            style={{
              width:  "min(440px, 38vw)",
              height: "min(440px, 38vw)",
              border: `4px solid ${roleColor}`,
              boxShadow:
                `0 0 60px ${roleColor}66, inset 0 -30px 80px rgba(0,0,0,0.5)`,
              background: "linear-gradient(135deg, var(--color-surface-high), var(--color-surface))",
            }}
          >
            {player.photo_url ? (
              <Image
                src={player.photo_url}
                alt={player.name}
                fill
                sizes="440px"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex w-full h-full items-center justify-center">
                <span
                  className="font-display"
                  style={{ fontSize: 180, color: roleColor }}
                >
                  {initials}
                </span>
              </div>
            )}
          </div>

          {/* Floating role pill */}
          <span
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full font-display tracking-[0.3em] text-base whitespace-nowrap"
            style={{
              background: roleColor,
              color:      "#0a0e1a",
              boxShadow:  `0 8px 24px ${roleColor}80`,
            }}
          >
            {ROLE_LABEL[player.role]}
          </span>
        </motion.div>

        {/* Name */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.6 }}
          className="font-display text-center tracking-wider"
          style={{
            fontSize:    "clamp(72px, 7.5vw, 140px)",
            lineHeight:  0.95,
            color:       "var(--color-text)",
            textShadow:  "0 4px 30px rgba(0,0,0,0.6)",
          }}
        >
          {player.name}
        </motion.h1>

        {/* Base price */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="flex items-center gap-5 px-8 py-4 rounded-2xl border backdrop-blur-md"
          style={{
            background:   "rgba(245, 158, 11, 0.08)",
            borderColor:  "var(--color-gold-dim)",
            boxShadow:    "0 0 40px rgba(245,158,11,0.15)",
          }}
        >
          <span
            className="font-display tracking-[0.3em] text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            BASE&nbsp;PRICE
          </span>
          <span
            className="font-display tabular-nums"
            style={{
              fontSize: 56,
              lineHeight: 1,
              color:    "var(--color-gold-bright)",
              textShadow: "0 0 20px rgba(245,158,11,0.4)",
            }}
          >
            {player.base_points.toLocaleString()}
          </span>
          <span
            className="font-display tracking-[0.3em] text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            PTS
          </span>
        </motion.div>
      </div>

      {/* RIGHT — Team budget rail */}
      <motion.div
        initial={{ x: 30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.6 }}
        className="relative flex flex-col gap-4 self-start sticky top-24"
      >
        <div className="flex items-center justify-between mb-1">
          <p
            className="font-display tracking-[0.35em] text-sm"
            style={{ color: "var(--color-gold)" }}
          >
            TEAM&nbsp;BUDGETS
          </p>
          <p
            className="text-[10px] tracking-[0.3em] font-display"
            style={{ color: "var(--color-text-subtle)" }}
          >
            REMAINING&nbsp;POINTS
          </p>
        </div>
        {teams.map((t, i) => (
          <TeamBudgetBar key={t.id} team={t} delay={0.45 + i * 0.06} />
        ))}
      </motion.div>

      <style>{`
        @keyframes mna-pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%      { opacity: 1;   transform: scale(1.3); }
        }
        @keyframes mna-breathe {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%      { opacity: 0.8; transform: scale(1.08); }
        }
      `}</style>
    </motion.div>
  );
}

function TeamBudgetBar({ team, delay }: { team: Team; delay: number }) {
  const remaining = team.budget - team.budget_used;
  const usedPct   = Math.min(100, (team.budget_used / team.budget) * 100);

  return (
    <motion.div
      initial={{ x: 30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay, duration: 0.45 }}
      className="rounded-2xl border px-5 py-4 backdrop-blur-md"
      style={{
        background:  "rgba(17, 24, 39, 0.7)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className="w-4 h-4 rounded-full shrink-0"
          style={{
            background: team.color_hex,
            boxShadow:  `0 0 14px ${team.color_hex}80`,
          }}
        />
        <p
          className="font-display tracking-wider text-xl truncate flex-1"
          style={{ color: "var(--color-text)" }}
        >
          {team.name}
        </p>
        <p
          className="font-display tabular-nums text-2xl"
          style={{ color: "var(--color-gold-bright)" }}
        >
          {remaining.toLocaleString()}
        </p>
      </div>

      {/* Bar */}
      <div
        className="mt-3 h-2 rounded-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.08)" }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${usedPct}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="h-full"
          style={{
            background: `linear-gradient(90deg, ${team.color_hex}, ${team.color_hex}dd)`,
            boxShadow:  `0 0 8px ${team.color_hex}`,
          }}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[11px] tracking-wider" style={{ color: "var(--color-text-subtle)" }}>
          USED {team.budget_used.toLocaleString()}
        </span>
        <span className="text-[11px] tracking-wider" style={{ color: "var(--color-text-subtle)" }}>
          OF {team.budget.toLocaleString()}
        </span>
      </div>
    </motion.div>
  );
}

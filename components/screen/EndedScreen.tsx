"use client";
import { motion } from "framer-motion";
import { Trophy, Crown } from "lucide-react";
import type { Team } from "@/types";

interface TeamWithSpend extends Team {
  playersBought: number;
}

interface Props {
  teams:        TeamWithSpend[];
  totalPlayers: number;
  totalSpend:   number;
}

export default function EndedScreen({ teams, totalPlayers, totalSpend }: Props) {
  const ranked = [...teams].sort(
    (a, b) => b.budget_used - a.budget_used || b.playersBought - a.playersBought,
  );

  return (
    <motion.div
      key="ended"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7 }}
      className="relative z-10 flex flex-col items-center min-h-screen px-10 py-20"
    >
      {/* Title */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center gap-4 mb-12"
      >
        <Trophy
          className="w-20 h-20"
          style={{
            color:      "var(--color-gold-bright)",
            filter:     "drop-shadow(0 0 30px rgba(245,158,11,0.6))",
          }}
        />
        <h1
          className="font-display text-center tracking-wider"
          style={{
            fontSize: "clamp(72px, 9vw, 160px)",
            lineHeight: 0.9,
            background:
              "linear-gradient(180deg, #fef3c7 0%, var(--color-gold-bright) 50%, var(--color-gold) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor:  "transparent",
            textShadow:           "0 0 60px rgba(245,158,11,0.4)",
          }}
        >
          AUCTION&nbsp;COMPLETE
        </h1>
        <p
          className="font-display tracking-[0.4em] text-lg"
          style={{ color: "var(--color-text-muted)" }}
        >
          {totalPlayers.toLocaleString()}&nbsp;PLAYERS&nbsp;·&nbsp;{totalSpend.toLocaleString()}&nbsp;POINTS&nbsp;TOTAL
        </p>
      </motion.div>

      {/* Leaderboard */}
      <div className="w-full max-w-4xl flex flex-col gap-3">
        {ranked.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.08, duration: 0.5 }}
            className="relative flex items-center gap-5 px-7 py-5 rounded-2xl border backdrop-blur-md overflow-hidden"
            style={{
              background:  i === 0 ? "rgba(245, 158, 11, 0.08)" : "rgba(17, 24, 39, 0.65)",
              borderColor: i === 0 ? "var(--color-gold-dim)"   : "var(--color-border)",
              boxShadow:   i === 0 ? "0 0 40px rgba(245,158,11,0.2)" : undefined,
            }}
          >
            {/* Color stripe */}
            <div
              className="absolute top-0 bottom-0 left-0 w-1.5"
              style={{
                background: t.color_hex,
                boxShadow:  `0 0 18px ${t.color_hex}80`,
              }}
            />

            {/* Rank */}
            <div className="w-16 shrink-0 flex items-center justify-center">
              {i === 0 ? (
                <Crown
                  className="w-10 h-10"
                  style={{
                    color:  "var(--color-gold-bright)",
                    filter: "drop-shadow(0 0 12px rgba(245,158,11,0.6))",
                  }}
                />
              ) : (
                <span
                  className="font-display tabular-nums"
                  style={{
                    fontSize: 44,
                    color:    "var(--color-text-subtle)",
                  }}
                >
                  {i + 1}
                </span>
              )}
            </div>

            {/* Team */}
            <div className="flex-1 min-w-0">
              <p
                className="font-display tracking-wider truncate"
                style={{ fontSize: 36, lineHeight: 1, color: "var(--color-text)" }}
              >
                {t.name}
              </p>
              <p
                className="text-sm mt-1.5 tracking-wider"
                style={{ color: "var(--color-text-subtle)" }}
              >
                {t.playersBought} PLAYERS · {(t.budget - t.budget_used).toLocaleString()} PTS REMAINING
              </p>
            </div>

            {/* Spend */}
            <div className="text-right shrink-0">
              <p
                className="font-display tabular-nums"
                style={{
                  fontSize: 44,
                  lineHeight: 1,
                  color:    "var(--color-gold-bright)",
                  textShadow: "0 0 16px rgba(245,158,11,0.4)",
                }}
              >
                {t.budget_used.toLocaleString()}
              </p>
              <p
                className="text-xs tracking-[0.3em] font-display mt-1"
                style={{ color: "var(--color-text-subtle)" }}
              >
                POINTS&nbsp;SPENT
              </p>
            </div>
          </motion.div>
        ))}

        {ranked.length === 0 && (
          <p className="text-center font-display tracking-widest text-xl" style={{ color: "var(--color-text-subtle)" }}>
            NO TEAMS CONFIGURED
          </p>
        )}
      </div>
    </motion.div>
  );
}

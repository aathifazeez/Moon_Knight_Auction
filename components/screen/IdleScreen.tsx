"use client";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface Props {
  pendingCount: number;
  soldCount:    number;
  unsoldCount:  number;
  totalSpend:   number;
}

export default function IdleScreen({
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
      className="relative z-10 flex flex-col items-center justify-center h-full w-full overflow-hidden px-12 py-12 pt-24"
    >
      {/* Hero */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="flex flex-col items-center gap-6 mb-20"
      >
        <motion.h1
          animate={{
            filter: [
              "drop-shadow(0 0 22px rgba(245,158,11,0.40)) drop-shadow(0 0 44px rgba(251,191,36,0.22))",
              "drop-shadow(0 0 34px rgba(245,158,11,0.55)) drop-shadow(0 0 64px rgba(251,191,36,0.32))",
              "drop-shadow(0 0 22px rgba(245,158,11,0.40)) drop-shadow(0 0 44px rgba(251,191,36,0.22))",
            ],
          }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          className="font-display text-center leading-[0.9] tracking-wider"
          style={{
            fontSize:             "clamp(96px, 13vw, 240px)",
            color:                "transparent",
            background:
              "linear-gradient(180deg, #ffffff 0%, #fef9c3 18%, var(--color-gold-bright) 55%, var(--color-gold) 90%, #b45309 100%)",
            backgroundClip:       "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor:  "transparent",
          }}
        >
          MOONKNIGHT<br />SUPER&nbsp;LEAGUE
        </motion.h1>

        <div className="flex items-center gap-3 mt-2">
          <Sparkles className="w-5 h-5" style={{ color: "var(--color-gold)" }} />
          <p
            className="font-display text-2xl tracking-[0.4em]"
            style={{ color: "var(--color-text-muted)" }}
          >
            AWAITING&nbsp;NEXT&nbsp;PLAYER
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

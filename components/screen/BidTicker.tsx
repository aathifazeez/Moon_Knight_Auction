"use client";
import { useEffect } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";
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
  player:        Player;
  currentBid:    number;
  leadingTeam:   Team | null;
  nextMinBid:    number;
}

export default function BidTicker({ player, currentBid, leadingTeam, nextMinBid }: Props) {
  const roleColor = ROLE_COLOR[player.role];
  const initials  = player.name
    .split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <motion.div
      key="ticker"
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative z-30 flex items-center gap-6 px-8 border-t backdrop-blur-md"
      style={{
        height:      "clamp(110px, 14dvh, 140px)",
        background:  "linear-gradient(180deg, rgba(10,14,26,0.85), rgba(10,14,26,0.97))",
        borderColor: "var(--color-gold-dim)",
        boxShadow:   "0 -10px 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(245,158,11,0.25)",
      }}
    >
      {/* Subtle gold sheen along the top edge */}
      <div
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--color-gold-bright), transparent)",
        }}
      />

      {/* LEFT — player thumb + name + role */}
      <div className="flex items-center gap-4 min-w-0">
        <div
          className="relative shrink-0 rounded-xl overflow-hidden"
          style={{
            width:      "clamp(72px, 9dvh, 96px)",
            aspectRatio: "4 / 5",
            border:     `2px solid ${roleColor}`,
            boxShadow:  `0 0 18px ${roleColor}55`,
            background: "var(--color-surface)",
          }}
        >
          {player.photo_url ? (
            <Image
              src={player.photo_url}
              alt={player.name}
              fill
              sizes="96px"
              className="object-cover"
            />
          ) : (
            <div className="flex w-full h-full items-center justify-center">
              <span
                className="font-display"
                style={{ fontSize: "clamp(24px, 3dvh, 32px)", color: roleColor }}
              >
                {initials}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5 min-w-0">
          <p
            className="font-display tracking-wide truncate"
            style={{
              fontSize:   "clamp(26px, 3.4dvh, 40px)",
              lineHeight: 1,
              color:      "var(--color-text)",
            }}
          >
            {player.name}
          </p>
          <span
            className="inline-flex self-start px-3 py-1 rounded-full font-display tracking-[0.25em] whitespace-nowrap"
            style={{
              fontSize:   "clamp(10px, 1.2dvh, 13px)",
              background: `${roleColor}25`,
              color:      roleColor,
              border:     `1px solid ${roleColor}50`,
            }}
          >
            {ROLE_LABEL[player.role]}
          </span>
        </div>
      </div>

      {/* Push remaining sections to the right */}
      <div className="flex-1" />

      {/* CURRENT BID — large, gold, animated count-up */}
      <div className="flex flex-col items-end gap-1">
        <span
          className="font-display tracking-[0.35em]"
          style={{
            fontSize: "clamp(10px, 1.2dvh, 13px)",
            color:    "var(--color-gold)",
          }}
        >
          CURRENT&nbsp;BID
        </span>
        <CountUp
          value={currentBid}
          className="font-display tabular-nums"
          style={{
            fontSize:   "clamp(36px, 4.6dvh, 60px)",
            lineHeight: 1,
            color:      "var(--color-gold-bright)",
            textShadow: "0 0 24px rgba(245,158,11,0.45)",
          }}
        />
      </div>

      {/* LEADING TEAM — chip flashes when the team changes */}
      <div className="flex flex-col items-center gap-1 mx-2 min-w-[140px]">
        <span
          className="font-display tracking-[0.3em]"
          style={{
            fontSize: "clamp(10px, 1.2dvh, 13px)",
            color:    "var(--color-text-subtle)",
          }}
        >
          LEADING&nbsp;TEAM
        </span>
        <div
          className="relative flex items-center justify-center"
          style={{ height: "clamp(36px, 5dvh, 52px)" }}
        >
          <AnimatePresence mode="popLayout">
            {leadingTeam ? (
              <motion.div
                key={leadingTeam.id}
                initial={{ scale: 1.18, opacity: 0 }}
                animate={{
                  scale:    [1.18, 0.96, 1.04, 1],
                  opacity:  1,
                  boxShadow: [
                    `0 0 36px ${leadingTeam.color_hex}aa`,
                    `0 0 18px ${leadingTeam.color_hex}80`,
                    `0 0 12px ${leadingTeam.color_hex}55`,
                  ],
                }}
                exit={{ scale: 0.94, opacity: 0 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
                className="flex items-center gap-2.5 px-4 py-1.5 rounded-full border"
                style={{
                  background:  `${leadingTeam.color_hex}26`,
                  borderColor: leadingTeam.color_hex,
                }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    background: leadingTeam.color_hex,
                    boxShadow:  `0 0 10px ${leadingTeam.color_hex}`,
                  }}
                />
                <span
                  className="font-display tracking-wider truncate"
                  style={{
                    fontSize: "clamp(16px, 2dvh, 22px)",
                    color:    "var(--color-text)",
                    maxWidth: "20ch",
                  }}
                >
                  {leadingTeam.name}
                </span>
              </motion.div>
            ) : (
              <motion.span
                key="none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-display tracking-[0.3em]"
                style={{
                  fontSize: "clamp(13px, 1.6dvh, 18px)",
                  color:    "var(--color-text-subtle)",
                }}
              >
                AWAITING&nbsp;FIRST&nbsp;BID
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* NEXT MIN BID — muted, right edge */}
      <div className="flex flex-col items-end gap-1">
        <span
          className="font-display tracking-[0.3em]"
          style={{
            fontSize: "clamp(10px, 1.2dvh, 13px)",
            color:    "var(--color-text-subtle)",
          }}
        >
          NEXT&nbsp;MIN&nbsp;BID
        </span>
        <CountUp
          value={nextMinBid}
          className="font-display tabular-nums"
          style={{
            fontSize:   "clamp(22px, 2.8dvh, 34px)",
            lineHeight: 1,
            color:      "var(--color-text-muted)",
          }}
          suffix=" pts"
        />
      </div>
    </motion.div>
  );
}

/* ── Animated count-up — smoothly transitions to the new value ─────── */
function CountUp({
  value,
  className,
  style,
  suffix = "",
}: {
  value:     number;
  className?: string;
  style?:    React.CSSProperties;
  suffix?:   string;
}) {
  const motionValue = useMotionValue(value);
  const display     = useTransform(motionValue, (v) => `${Math.round(v).toLocaleString()}${suffix}`);

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 0.65,
      ease:     "easeOut",
    });
    return () => controls.stop();
  }, [value, motionValue]);

  return (
    <motion.span className={className} style={style}>
      {display}
    </motion.span>
  );
}

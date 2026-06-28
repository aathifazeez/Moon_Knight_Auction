"use client";
import { useEffect, useMemo, useRef } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import Image from "next/image";
import type { Player, PlayerRole } from "@/types";

const CARD_H   = 240;
const VISIBLE  = 3;            // cards shown in frame
const CYCLES   = 10;            // how many pool repeats before landing
const DURATION = 2.4;           // seconds

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

export type ReelPlayer = Pick<Player, "id" | "name" | "photo_url" | "role">;

interface Props {
  pending:      ReelPlayer[];
  pickedPlayer: Player | null;
}

export default function RollingAnimation({ pending, pickedPlayer }: Props) {
  const strip = useMemo(() => {
    const picked: ReelPlayer | null = pickedPlayer
      ? {
          id:        pickedPlayer.id,
          name:      pickedPlayer.name,
          photo_url: pickedPlayer.photo_url,
          role:      pickedPlayer.role,
        }
      : null;

    const others = picked ? pending.filter((p) => p.id !== picked.id) : pending;
    const pool   = others.length ? others : (picked ? [picked] : []);
    const result: ReelPlayer[] = [];
    for (let i = 0; i < CYCLES; i++) {
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      result.push(...shuffled);
    }
    if (picked) result.push(picked);
    return result;
  }, [pending, pickedPlayer]);

  const y         = useMotionValue(CARD_H);           // card 0 starts in center
  const landingY  = CARD_H - (strip.length - 1) * CARD_H;
  const fired     = useRef(false);

  useEffect(() => {
    if (!pickedPlayer || fired.current || strip.length < 2) return;
    fired.current = true;
    const controls = animate(y, landingY, {
      duration: DURATION,
      ease:     [0.16, 0.84, 0.12, 1],
    });
    return () => controls.stop();
  }, [pickedPlayer, landingY, strip.length, y]);

  return (
    <motion.div
      key="rolling"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.5 }}
      className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6"
    >
      {/* Headline */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="absolute top-[8%] left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
      >
        <span
          className="font-display tracking-[0.35em] text-base"
          style={{ color: "var(--color-gold)" }}
        >
          ROLLING&nbsp;THE&nbsp;DICE
        </span>
        <h2
          className="font-display tracking-wider"
          style={{
            fontSize: "clamp(72px, 9vw, 140px)",
            lineHeight: 1,
            background:
              "linear-gradient(180deg, #fef3c7 0%, var(--color-gold-bright) 50%, var(--color-gold) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor:  "transparent",
            textShadow: "0 0 50px rgba(245,158,11,0.4)",
          }}
        >
          WHO&apos;S&nbsp;NEXT?
        </h2>
      </motion.div>

      {/* Spotlight backdrop */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 40% 50% at 50% 55%, rgba(245,158,11,0.18), transparent 70%)",
        }}
      />

      {/* Reel */}
      <div
        className="relative mt-20"
        style={{
          height:    CARD_H * VISIBLE,
          width:     "min(560px, 90vw)",
          overflow:  "hidden",
        }}
      >
        {/* Fade masks (top + bottom) */}
        <div
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            background:
              `linear-gradient(180deg, var(--color-bg) 0%, transparent 25%, transparent 75%, var(--color-bg) 100%)`,
          }}
        />

        {/* Center highlight frame */}
        <div
          className="absolute left-0 right-0 z-30 pointer-events-none"
          style={{
            top:    CARD_H,
            height: CARD_H,
            border: "2px solid var(--color-gold-bright)",
            borderRadius: 16,
            boxShadow:
              "0 0 50px rgba(245,158,11,0.5), inset 0 0 30px rgba(245,158,11,0.15)",
          }}
        >
          {/* Corner ticks */}
          {(["tl","tr","bl","br"] as const).map((p) => {
            const pos: Record<typeof p, React.CSSProperties> = {
              tl: { top: -2,    left: -2,    borderTop: "3px solid var(--color-gold-bright)", borderLeft:  "3px solid var(--color-gold-bright)" },
              tr: { top: -2,    right: -2,   borderTop: "3px solid var(--color-gold-bright)", borderRight: "3px solid var(--color-gold-bright)" },
              bl: { bottom: -2, left: -2,    borderBottom: "3px solid var(--color-gold-bright)", borderLeft:  "3px solid var(--color-gold-bright)" },
              br: { bottom: -2, right: -2,   borderBottom: "3px solid var(--color-gold-bright)", borderRight: "3px solid var(--color-gold-bright)" },
            };
            return (
              <span
                key={p}
                className="absolute"
                style={{ width: 20, height: 20, ...pos[p] }}
              />
            );
          })}
        </div>

        {/* Strip */}
        <motion.div style={{ y }} className="absolute left-0 right-0 top-0">
          {strip.map((player, i) => (
            <ReelCard key={`${player.id}-${i}`} player={player} />
          ))}
        </motion.div>
      </div>

      {/* Bottom hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="font-display tracking-[0.4em] mt-12 text-sm"
        style={{ color: "var(--color-text-subtle)" }}
      >
        LOCKING&nbsp;IN&nbsp;THE&nbsp;PICK&nbsp;...
      </motion.p>
    </motion.div>
  );
}

function ReelCard({ player }: { player: ReelPlayer }) {
  const initials = player.name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const roleColor = ROLE_COLOR[player.role];

  return (
    <div
      className="flex items-center gap-5 px-6 mx-3 rounded-2xl border"
      style={{
        height:      CARD_H - 16,
        marginTop:   8,
        marginBottom: 8,
        background:  "rgba(31, 45, 69, 0.85)",
        borderColor: "var(--color-border)",
        boxShadow:   "0 10px 30px rgba(0,0,0,0.4)",
      }}
    >
      <div
        className="relative shrink-0 overflow-hidden rounded-xl"
        style={{
          width:  160,
          height: 160,
          background: "linear-gradient(135deg, var(--color-surface-high), var(--color-surface))",
          border: `2px solid ${roleColor}`,
        }}
      >
        {player.photo_url ? (
          <Image
            src={player.photo_url}
            alt={player.name}
            fill
            sizes="160px"
            className="object-cover"
          />
        ) : (
          <div className="flex w-full h-full items-center justify-center">
            <span
              className="font-display text-5xl"
              style={{ color: roleColor }}
            >
              {initials}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="font-display tracking-wider truncate"
          style={{ fontSize: 36, lineHeight: 1, color: "var(--color-text)" }}
        >
          {player.name}
        </p>
        <span
          className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-display tracking-[0.25em]"
          style={{
            background: `${roleColor}25`,
            color:      roleColor,
            border:     `1px solid ${roleColor}50`,
          }}
        >
          {ROLE_LABEL[player.role]}
        </span>
      </div>
    </div>
  );
}

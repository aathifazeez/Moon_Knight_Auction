"use client";
import { useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import confetti from "canvas-confetti";
import { CircleCheck, CircleSlash } from "lucide-react";
import type { Player } from "@/types";

interface Props {
  player:    Player;
  onDismiss: () => void;
}

export default function SoldOverlay({ player, onDismiss }: Props) {
  const isSold     = player.status === "sold";
  const teamColor  = player.team?.color_hex ?? "#ef4444";
  const accent     = isSold ? teamColor : "#ef4444";
  const initials   = player.name
    .split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  // Confetti on SOLD
  useEffect(() => {
    if (!isSold) return;

    const hexToRgb = (hex: string) => {
      const m = hex.replace("#", "");
      const n = parseInt(m.length === 3 ? m.split("").map((c) => c + c).join("") : m, 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };
    const [r, g, b] = hexToRgb(teamColor);
    const colors = [
      `rgb(${r},${g},${b})`,
      "#fbbf24",
      "#f59e0b",
      "#ffffff",
    ];

    const fire = (opts: confetti.Options) => {
      confetti({
        colors,
        zIndex: 9999,
        ...opts,
      });
    };

    // Initial burst
    fire({ particleCount: 140, spread: 100, origin: { y: 0.6 }, startVelocity: 55, scalar: 1.2 });

    // Side bursts
    const t1 = setTimeout(() => {
      fire({ particleCount: 80, angle: 60,  spread: 70, origin: { x: 0, y: 0.7 } });
      fire({ particleCount: 80, angle: 120, spread: 70, origin: { x: 1, y: 0.7 } });
    }, 250);

    // Sustained shower
    const end = Date.now() + 2200;
    const interval: ReturnType<typeof setInterval> = setInterval(() => {
      if (Date.now() > end) {
        clearInterval(interval);
        return;
      }
      fire({
        particleCount: 30,
        startVelocity: 35,
        spread:        360,
        origin:        { x: Math.random(), y: Math.random() * 0.4 + 0.1 },
        gravity:       0.85,
        scalar:        0.9,
      });
    }, 200);

    return () => {
      clearTimeout(t1);
      clearInterval(interval);
    };
  }, [isSold, teamColor]);

  // Auto-dismiss
  useEffect(() => {
    const t = setTimeout(onDismiss, isSold ? 5200 : 3800);
    return () => clearTimeout(t);
  }, [onDismiss, isSold]);

  return (
    <motion.div
      key="overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Team-color backdrop wash */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="absolute inset-0"
        style={{
          background:
            `radial-gradient(ellipse at center, ${accent}40 0%, ${accent}15 40%, rgba(10,14,26,0.95) 80%)`,
          backdropFilter: "blur(8px)",
        }}
      />

      {/* Diagonal team-color streaks */}
      {isSold && (
        <>
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: "120%",  opacity: [0, 0.5, 0] }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            className="absolute -top-1/4 -bottom-1/4 w-[40%]"
            style={{
              background: `linear-gradient(120deg, transparent, ${teamColor}, transparent)`,
              transform: "rotate(15deg)",
              filter: "blur(20px)",
            }}
          />
          <motion.div
            initial={{ x: "120%", opacity: 0 }}
            animate={{ x: "-100%", opacity: [0, 0.4, 0] }}
            transition={{ duration: 1.8, delay: 0.15, ease: "easeOut" }}
            className="absolute -top-1/4 -bottom-1/4 w-[30%]"
            style={{
              background: `linear-gradient(60deg, transparent, ${teamColor}, transparent)`,
              transform: "rotate(-15deg)",
              filter: "blur(24px)",
            }}
          />
        </>
      )}

      {/* Content */}
      <div className="relative flex flex-col items-center gap-8 px-12 max-w-5xl">
        {/* Status mega-label */}
        <motion.div
          initial={{ scale: 0.4, opacity: 0, rotate: isSold ? -8 : 4 }}
          animate={{ scale: 1, opacity: 1, rotate: isSold ? -3 : 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.1 }}
          className="flex items-center gap-6"
        >
          {isSold ? (
            <CircleCheck className="w-24 h-24" style={{ color: accent }} strokeWidth={2} />
          ) : (
            <CircleSlash className="w-24 h-24" style={{ color: accent }} strokeWidth={2} />
          )}
          <h1
            className="font-display tracking-wider"
            style={{
              fontSize:   "clamp(160px, 22vw, 360px)",
              lineHeight: 0.85,
              color:      isSold ? "#ffffff" : "#fca5a5",
              textShadow: `0 0 60px ${accent}, 0 8px 0 rgba(0,0,0,0.45)`,
              WebkitTextStroke: `2px ${accent}`,
            }}
          >
            {isSold ? "SOLD!" : "UNSOLD"}
          </h1>
        </motion.div>

        {/* Player photo + info */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="flex items-center gap-8"
        >
          <div
            className="relative shrink-0 rounded-2xl overflow-hidden"
            style={{
              width:  160,
              height: 200,
              border: `3px solid ${accent}`,
              boxShadow: `0 0 40px ${accent}80`,
              background: "var(--color-surface)",
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
                <span className="font-display text-7xl" style={{ color: accent }}>
                  {initials}
                </span>
              </div>
            )}

            {/* Bottom gradient overlay for legibility */}
            <div
              className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none"
              style={{
                background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.5))",
              }}
            />
          </div>

          <div className="flex flex-col gap-3">
            <p
              className="font-display tracking-wider"
              style={{
                fontSize:   "clamp(48px, 5.5vw, 88px)",
                lineHeight: 1,
                color:      "var(--color-text)",
              }}
            >
              {player.name}
            </p>
            {isSold && player.team && (
              <>
                <div className="flex items-center gap-3">
                  <span
                    className="w-4 h-4 rounded-full"
                    style={{
                      background: teamColor,
                      boxShadow:  `0 0 14px ${teamColor}`,
                    }}
                  />
                  <p
                    className="font-display tracking-[0.25em]"
                    style={{ fontSize: 32, color: teamColor }}
                  >
                    {player.team.name.toUpperCase()}
                  </p>
                </div>
                <div className="flex items-baseline gap-3">
                  <span
                    className="font-display tabular-nums"
                    style={{
                      fontSize:  72,
                      lineHeight: 1,
                      color:     "var(--color-gold-bright)",
                      textShadow: "0 0 24px rgba(245,158,11,0.5)",
                    }}
                  >
                    {(player.sold_for ?? 0).toLocaleString()}
                  </span>
                  <span
                    className="font-display tracking-[0.3em] text-xl"
                    style={{ color: "var(--color-gold)" }}
                  >
                    POINTS
                  </span>
                </div>
              </>
            )}
            {!isSold && (
              <p
                className="font-display tracking-[0.3em] text-2xl mt-1"
                style={{ color: "#fca5a5" }}
              >
                NO&nbsp;BIDS&nbsp;ACCEPTED
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

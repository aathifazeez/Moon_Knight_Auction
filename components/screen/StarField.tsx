"use client";
import { useEffect, useState } from "react";

interface Star {
  left: string;
  top: string;
  size: number;
  delay: number;
  duration: number;
  gold: boolean;
}

export default function StarField() {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    const arr: Star[] = Array.from({ length: 80 }).map((_, i) => ({
      left:     `${Math.random() * 100}%`,
      top:      `${Math.random() * 100}%`,
      size:     Math.random() * 2.5 + 1,
      delay:    Math.random() * 6,
      duration: 3 + Math.random() * 5,
      gold:     i % 6 === 0,
    }));
    setStars(arr);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Deep base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(245, 158, 11, 0.10), transparent 70%), radial-gradient(ellipse 60% 40% at 50% 100%, rgba(139, 92, 246, 0.06), transparent 70%)",
        }}
      />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,158,11,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.7) 1px, transparent 1px)",
          backgroundSize:
            "80px 80px",
          maskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />

      {/* Floating particles */}
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left:       s.left,
            top:        s.top,
            width:      s.size,
            height:     s.size,
            background: s.gold ? "#fbbf24" : "#cbd5e1",
            opacity:    0,
            boxShadow:  s.gold ? "0 0 10px #fbbf24, 0 0 20px rgba(245,158,11,0.5)" : "0 0 4px rgba(203,213,225,0.6)",
            animation:  `mna-twinkle ${s.duration}s ${s.delay}s ease-in-out infinite`,
          }}
        />
      ))}

      <style>{`
        @keyframes mna-twinkle {
          0%, 100% { opacity: 0.15; transform: scale(0.9); }
          50%      { opacity: 0.95; transform: scale(1.35); }
        }
      `}</style>
    </div>
  );
}

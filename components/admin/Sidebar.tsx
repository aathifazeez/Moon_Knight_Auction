"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Shield,
  Gavel,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/players",   label: "Players",   icon: Users },
  { href: "/admin/teams",     label: "Teams",     icon: Shield },
  { href: "/admin/auction",   label: "Auction",   icon: Gavel },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="w-60 shrink-0 flex flex-col border-r"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
    >
      {/* Logo */}
      <div
        className="px-6 py-5 border-b"
        style={{ borderColor: "var(--color-border)" }}
      >
        <h1
          className="font-display text-2xl leading-none"
          style={{ color: "var(--color-gold)" }}
        >
          MOON NIGHT
        </h1>
        <p
          className="text-[10px] uppercase tracking-[0.2em] mt-0.5"
          style={{ color: "var(--color-text-muted)" }}
        >
          Auction
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 flex flex-col gap-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: active ? "rgba(245,158,11,0.1)" : "transparent",
                color: active ? "var(--color-gold)" : "var(--color-text-muted)",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "var(--color-surface-raised)";
                  e.currentTarget.style.color = "var(--color-text)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--color-text-muted)";
                }
              }}
            >
              <Icon
                size={17}
                style={{ color: active ? "var(--color-gold)" : "inherit" }}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div
        className="p-3 border-t"
        style={{ borderColor: "var(--color-border)" }}
      >
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-sm font-medium transition-colors"
          style={{ color: "var(--color-text-muted)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--color-error-dim)";
            e.currentTarget.style.color = "var(--color-error)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--color-text-muted)";
          }}
        >
          <LogOut size={17} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

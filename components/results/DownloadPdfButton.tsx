"use client";
import { useState } from "react";
import { Download } from "lucide-react";
import type { Player, Team, PlayerRole } from "@/types";

const ROLE_LABEL: Record<PlayerRole, string> = {
  batsman:      "Batsman",
  bowler:       "Bowler",
  allrounder:   "All-Rounder",
  wicketkeeper: "Wicket-Keeper",
};

type PlayerWithTeam = Player & { team: Team | null };
type TeamWithRoster = Team & { roster: PlayerWithTeam[] };

interface Props {
  teams:      TeamWithRoster[];
  sold:       PlayerWithTeam[];
  unsold:     PlayerWithTeam[];
  totalSpend: number;
}

export default function DownloadPdfButton({ teams, sold, unsold, totalSpend }: Props) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = doc.internal.pageSize.getWidth();

      const gold    = [212, 149, 31]  as [number, number, number];
      const darkBg  = [10,  14,  26]  as [number, number, number];
      const surface = [22,  32,  50]  as [number, number, number];
      const white   = [255, 255, 255] as [number, number, number];
      const muted   = [140, 155, 180] as [number, number, number];

      // ── Header band ────────────────────────────────────────────────
      doc.setFillColor(...darkBg);
      doc.rect(0, 0, W, 34, "F");

      doc.setFillColor(...gold);
      doc.rect(0, 33.5, W, 0.5, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(...gold);
      doc.text("MOON KNIGHT SUPER LEAGUE", W / 2, 13, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...muted);
      doc.text("AUCTION RESULTS", W / 2, 20, { align: "center" });

      doc.setFontSize(8);
      doc.text(
        `Generated: ${new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}`,
        W / 2, 27, { align: "center" }
      );

      // ── Summary row ────────────────────────────────────────────────
      let y = 42;
      const stats = [
        { label: "PLAYERS SOLD",   value: String(sold.length)                    },
        { label: "TEAMS",          value: String(teams.length)                   },
        { label: "TOTAL SPEND",    value: `${totalSpend.toLocaleString()} pts`   },
        { label: "UNSOLD",         value: String(unsold.length)                  },
      ];
      const boxW = (W - 20) / stats.length;
      stats.forEach((s, i) => {
        const x = 10 + i * boxW;
        doc.setFillColor(...surface);
        doc.roundedRect(x, y, boxW - 3, 18, 2, 2, "F");

        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(...muted);
        doc.text(s.label, x + (boxW - 3) / 2, y + 6, { align: "center" });

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...gold);
        doc.text(s.value, x + (boxW - 3) / 2, y + 14, { align: "center" });
      });

      y += 26;

      // ── Team rosters ───────────────────────────────────────────────
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...gold);
      doc.text("TEAM ROSTERS", 10, y);
      y += 5;

      for (const team of teams) {
        // Section header
        doc.setFillColor(...surface);
        doc.roundedRect(10, y, W - 20, 9, 1, 1, "F");

        // Team colour accent strip
        const hex = team.color_hex.replace("#", "");
        const r   = parseInt(hex.slice(0, 2), 16);
        const g   = parseInt(hex.slice(2, 4), 16);
        const b   = parseInt(hex.slice(4, 6), 16);
        doc.setFillColor(r, g, b);
        doc.roundedRect(10, y, 3, 9, 1, 1, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(...white);
        doc.text(team.name.toUpperCase(), 16, y + 6);

        const teamSpend = team.roster.reduce((s, p) => s + (p.sold_for ?? 0), 0);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...muted);
        doc.text(
          `${team.roster.length} player${team.roster.length !== 1 ? "s" : ""}  •  ${teamSpend.toLocaleString()} pts spent`,
          W - 12, y + 6, { align: "right" }
        );

        y += 10;

        if (team.roster.length === 0) {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(8);
          doc.setTextColor(...muted);
          doc.text("No players assigned", 14, y + 5);
          y += 10;
        } else {
          autoTable(doc, {
            startY:    y,
            margin:    { left: 10, right: 10 },
            theme:     "plain",
            headStyles: {
              fillColor:  darkBg,
              textColor:  muted,
              fontSize:   7,
              fontStyle:  "bold",
              cellPadding: 2.5,
            },
            bodyStyles: {
              fillColor:  [15, 22, 38] as [number, number, number],
              textColor:  white,
              fontSize:   8,
              cellPadding: 2.5,
            },
            alternateRowStyles: {
              fillColor:  surface,
            },
            columnStyles: {
              0: { cellWidth: "auto" },
              1: { cellWidth: 30    },
              2: { cellWidth: 28, halign: "right" },
            },
            head: [["Player", "Role", "Price (pts)"]],
            body: team.roster.map((p) => [
              p.name,
              ROLE_LABEL[p.role],
              (p.sold_for ?? 0).toLocaleString(),
            ]),
            didDrawPage: () => {
              // Re-draw header on new pages
              doc.setFillColor(...darkBg);
              doc.rect(0, 0, W, 10, "F");
              doc.setFont("helvetica", "bold");
              doc.setFontSize(7);
              doc.setTextColor(...muted);
              doc.text("MOONKNIGHT SUPER LEAGUE — AUCTION RESULTS", W / 2, 7, { align: "center" });
            },
          });
          y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
        }

        if (y > 260) { doc.addPage(); y = 18; }
      }

      // ── Unsold players ─────────────────────────────────────────────
      if (unsold.length > 0) {
        if (y > 240) { doc.addPage(); y = 18; }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(...gold);
        doc.text("UNSOLD PLAYERS", 10, y);
        y += 5;

        autoTable(doc, {
          startY:    y,
          margin:    { left: 10, right: 10 },
          theme:     "plain",
          headStyles: {
            fillColor:  darkBg,
            textColor:  muted,
            fontSize:   7,
            fontStyle:  "bold",
            cellPadding: 2.5,
          },
          bodyStyles: {
            fillColor:  [15, 22, 38] as [number, number, number],
            textColor:  muted,
            fontSize:   8,
            cellPadding: 2.5,
          },
          alternateRowStyles: { fillColor: surface },
          head: [["Player", "Role"]],
          body: unsold.map((p) => [p.name, ROLE_LABEL[p.role]]),
          didDrawPage: () => {
            doc.setFillColor(...darkBg);
            doc.rect(0, 0, W, 10, "F");
            doc.setFont("helvetica", "bold");
            doc.setFontSize(7);
            doc.setTextColor(...muted);
            doc.text("MOON KNIGHT SUPER LEAGUE — AUCTION RESULTS", W / 2, 7, { align: "center" });
          },
        });
      }

      // ── Footer on last page ────────────────────────────────────────
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFillColor(...darkBg);
        doc.rect(0, doc.internal.pageSize.getHeight() - 8, W, 8, "F");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(...muted);
        doc.text(
          `Page ${i} of ${pageCount}  |  MOON KNIGHT SUPER LEAGUE`,
          W / 2,
          doc.internal.pageSize.getHeight() - 2.5,
          { align: "center" }
        );
      }

      doc.save("MKSL-Auction-Results.pdf");
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
      style={{
        background:  loading ? "rgba(245,158,11,0.08)" : "rgba(245,158,11,0.12)",
        borderColor: "var(--color-gold-dim)",
        color:       "var(--color-gold-bright)",
        cursor:      loading ? "wait" : "pointer",
      }}
    >
      <Download size={15} />
      {loading ? "Generating…" : "Download PDF"}
    </button>
  );
}

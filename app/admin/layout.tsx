import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Sidebar from "@/components/admin/Sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // No session → just render children (login page, no sidebar)
  if (!session) {
    return <>{children}</>;
  }

  // Authenticated → full admin shell
  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--color-bg)" }}
    >
      <Sidebar />
      <main
        className="flex-1 overflow-y-auto"
        style={{ background: "var(--color-bg)" }}
      >
        {children}
      </main>
    </div>
  );
}

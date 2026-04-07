import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { PageShell } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";

export default async function ProtectedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <PageShell>
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[260px_1fr]">
        <Sidebar />
        <div>{children}</div>
      </div>
    </PageShell>
  );
}

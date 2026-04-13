import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout";
import { PageShell } from "@/components/shared";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ProtectedTemplate({
  children
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const instagramAccount = await prisma.instagramAccount.findUnique({
    where: { userId: user.id },
    select: { connected: true }
  });

  return (
    <PageShell>
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[260px_1fr]">
        <Sidebar hasConnectedInstagramAccount={instagramAccount?.connected === true} />
        <div className="min-w-0">{children}</div>
      </div>
    </PageShell>
  );
}

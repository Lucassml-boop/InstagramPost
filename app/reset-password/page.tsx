import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth";
import { PageShell } from "@/components/shared";
import { getCurrentUser } from "@/lib/auth";

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  const params = await searchParams;

  return (
    <PageShell>
      <div className="flex min-h-[calc(100vh-5.5rem)] items-center justify-center">
        <ResetPasswordForm initialToken={params.token ?? ""} />
      </div>
    </PageShell>
  );
}

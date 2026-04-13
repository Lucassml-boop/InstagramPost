import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/components/auth";
import { PageShell } from "@/components/shared";
import { getCurrentUser } from "@/lib/auth";

export default async function ForgotPasswordPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <PageShell>
      <div className="flex min-h-[calc(100vh-5.5rem)] items-center justify-center">
        <ForgotPasswordForm />
      </div>
    </PageShell>
  );
}

import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { PageShell } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <PageShell>
      <div className="flex min-h-[calc(100vh-5.5rem)] items-center justify-center">
        <LoginForm />
      </div>
    </PageShell>
  );
}

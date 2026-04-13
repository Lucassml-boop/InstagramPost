"use client";

import { FormEvent, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { getClientRequestErrorMessage } from "@/lib/client/http";
import { resetPassword } from "@/services/frontend/auth";

export function ResetPasswordForm({ initialToken }: { initialToken: string }) {
  const router = useRouter();
  const { dictionary } = useI18n();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const action = useAsyncAction();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    action.setError(null);

    if (!initialToken) {
      action.setError(dictionary.resetPassword.invalidToken);
      return;
    }

    if (password !== confirmPassword) {
      action.setError(dictionary.resetPassword.passwordMismatch);
      return;
    }

    try {
      await action.run(() => resetPassword({ token: initialToken, password }));
      setSuccessMessage(dictionary.resetPassword.success);

      startTransition(() => {
        router.push("/dashboard");
        router.refresh();
      });
    } catch (submitError) {
      action.setError(
        getClientRequestErrorMessage(
          submitError,
          dictionary.resetPassword.continueError,
          dictionary.common.serverConnectionError
        )
      );
    }
  }

  return (
    <form className="panel w-full max-w-md p-8" onSubmit={handleSubmit}>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
        {dictionary.common.appName}
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-ink">{dictionary.resetPassword.title}</h1>
      <p className="mt-3 text-sm text-slate-600">{dictionary.resetPassword.description}</p>

      {!initialToken ? (
        <p className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {dictionary.resetPassword.invalidToken}
        </p>
      ) : (
        <div className="mt-8 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            {dictionary.resetPassword.password}
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
              placeholder={dictionary.resetPassword.passwordPlaceholder}
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            {dictionary.resetPassword.confirmPassword}
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
              placeholder={dictionary.resetPassword.confirmPasswordPlaceholder}
              required
            />
          </label>
        </div>
      )}

      {action.error ? (
        <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {action.error}
        </p>
      ) : null}

      {successMessage ? (
        <p className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!initialToken || isPending || action.isLoading}
        className="mt-6 w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
      >
        {isPending || action.isLoading
          ? dictionary.resetPassword.submitting
          : dictionary.resetPassword.submit}
      </button>

      <div className="mt-5 text-center text-sm">
        <Link href="/login" className="font-medium text-slate-600 transition hover:text-ink">
          {dictionary.resetPassword.loginLink}
        </Link>
      </div>
    </form>
  );
}

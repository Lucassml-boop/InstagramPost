"use client";

import { FormEvent, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { getClientRequestErrorMessage } from "@/lib/client/http";
import { register } from "@/services/frontend/auth";

export function RegisterForm() {
  const router = useRouter();
  const { dictionary } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const registerAction = useAsyncAction();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    registerAction.setError(null);

    if (password !== confirmPassword) {
      registerAction.setError(dictionary.register.passwordMismatch);
      return;
    }

    try {
      await registerAction.run(() => register({ email, password }));

      startTransition(() => {
        router.push("/dashboard");
        router.refresh();
      });
    } catch (submitError) {
      registerAction.setError(
        getClientRequestErrorMessage(
          submitError,
          dictionary.register.continueError,
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
      <h1 className="mt-2 text-3xl font-semibold text-ink">{dictionary.register.title}</h1>
      <p className="mt-3 text-sm text-slate-600">{dictionary.register.description}</p>

      <div className="mt-8 space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          {dictionary.register.email}
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
            placeholder={dictionary.register.emailPlaceholder}
            required
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {dictionary.register.password}
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
            placeholder={dictionary.register.passwordPlaceholder}
            required
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {dictionary.register.confirmPassword}
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
            placeholder={dictionary.register.confirmPasswordPlaceholder}
            required
          />
        </label>
      </div>

      {registerAction.error ? (
        <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {registerAction.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending || registerAction.isLoading}
        className="mt-6 w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
      >
        {isPending || registerAction.isLoading
          ? dictionary.register.submitting
          : dictionary.register.submit}
      </button>

      <div className="mt-5 text-center text-sm">
        <Link href="/login" className="font-medium text-slate-600 transition hover:text-ink">
          {dictionary.register.loginLink}
        </Link>
      </div>
    </form>
  );
}

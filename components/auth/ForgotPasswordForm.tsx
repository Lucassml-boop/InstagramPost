"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { getClientRequestErrorMessage } from "@/lib/client/http";
import { requestPasswordReset } from "@/services/frontend/auth";

export function ForgotPasswordForm() {
  const { dictionary } = useI18n();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const action = useAsyncAction();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    action.setError(null);
    setMessage(null);
    setResetUrl(null);

    try {
      const response = await action.run(() => requestPasswordReset({ email }));
      setMessage(dictionary.forgotPassword.success);
      setResetUrl(response.resetUrl ?? null);
    } catch (submitError) {
      action.setError(
        getClientRequestErrorMessage(
          submitError,
          dictionary.forgotPassword.continueError,
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
      <h1 className="mt-2 text-3xl font-semibold text-ink">{dictionary.forgotPassword.title}</h1>
      <p className="mt-3 text-sm text-slate-600">{dictionary.forgotPassword.description}</p>

      <div className="mt-8 space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          {dictionary.forgotPassword.email}
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
            placeholder={dictionary.forgotPassword.emailPlaceholder}
            required
          />
        </label>
      </div>

      {action.error ? (
        <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {action.error}
        </p>
      ) : null}

      {message ? (
        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <p>{message}</p>
          {resetUrl ? (
            <p className="mt-3 break-all">
              <span className="font-semibold">{dictionary.forgotPassword.devLinkLabel}:</span>{" "}
              <a href={resetUrl} className="underline">
                {resetUrl}
              </a>
            </p>
          ) : null}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={action.isLoading}
        className="mt-6 w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
      >
        {action.isLoading ? dictionary.forgotPassword.submitting : dictionary.forgotPassword.submit}
      </button>

      <div className="mt-5 text-center text-sm">
        <Link href="/login" className="font-medium text-slate-600 transition hover:text-ink">
          {dictionary.forgotPassword.loginLink}
        </Link>
      </div>
    </form>
  );
}

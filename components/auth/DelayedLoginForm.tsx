"use client";

import { useEffect, useState } from "react";
import { LoginForm } from "./LoginForm";

const LOGIN_SCREEN_DELAY_MS = 3000;

export function DelayedLoginForm() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsReady(true);
    }, LOGIN_SCREEN_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  if (!isReady) {
    return (
      <div className="panel flex w-full max-w-md flex-col items-center px-8 py-16 text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
          SocialForge
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-ink">Entrando</h1>
        <p className="mt-3 text-sm text-slate-500">
          Preparando sua tela de acesso.
        </p>
      </div>
    );
  }

  return <LoginForm />;
}


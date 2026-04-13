export default function ProtectedLoading() {
  return (
    <div className="panel flex min-h-[420px] flex-col items-center justify-center px-8 py-16 text-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
      <p className="mt-8 text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
        SocialForge
      </p>
      <h2 className="mt-3 text-3xl font-semibold text-ink">Carregando</h2>
      <p className="mt-3 max-w-md text-sm text-slate-500">
        Preparando a proxima pagina para voce.
      </p>
    </div>
  );
}

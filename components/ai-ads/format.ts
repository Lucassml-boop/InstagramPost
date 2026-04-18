export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatPct(value: number) {
  return `${value.toFixed(0)}%`;
}

export function renderActionLabel(action: string) {
  return action
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getHealthClasses(health: "scale" | "optimize" | "watch" | "risk") {
  if (health === "scale") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (health === "risk") return "border-red-200 bg-red-50 text-red-700";
  if (health === "optimize") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

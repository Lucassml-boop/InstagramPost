import { DAY_ORDER, type DayLabel } from "./content-system.constants.ts";

export function normalizeTimeValue(value: string) {
  const trimmed = value.trim();
  return /^\d{2}:\d{2}$/.test(trimmed) ? trimmed : null;
}

export function shiftTime(base: string, offsetHours: number) {
  const [hours, minutes] = base.split(":").map((value) => Number.parseInt(value, 10));
  const totalMinutes =
    ((hours * 60 + minutes + offsetHours * 60) % (24 * 60) + 24 * 60) % (24 * 60);
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(
    totalMinutes % 60
  ).padStart(2, "0")}`;
}

export function getUpcomingWeekDays(referenceDate = new Date()) {
  const local = new Date(referenceDate);
  const daysUntilNextMonday = ((8 - local.getDay()) % 7) || 7;
  const monday = new Date(local);
  monday.setDate(local.getDate() + daysUntilNextMonday);
  monday.setHours(0, 0, 0, 0);
  return DAY_ORDER.map((label, index) => {
    const current = new Date(monday);
    current.setDate(monday.getDate() + index);
    return { label, date: current.toISOString().slice(0, 10) };
  });
}

export function getDayLabelFromDate(value: Date): DayLabel {
  const dayIndex = value.getDay();
  if (dayIndex === 0) {
    return "Domingo";
  }

  return DAY_ORDER[dayIndex - 1] ?? "Segunda";
}

export function getRollingWeekDays(referenceDate = new Date()) {
  const start = new Date(referenceDate);
  start.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    return {
      label: getDayLabelFromDate(current),
      date: current.toISOString().slice(0, 10)
    };
  });
}

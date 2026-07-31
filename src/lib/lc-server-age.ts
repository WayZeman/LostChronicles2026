/** Дата відкриття сервера (YYYY-MM-DD). Перевизначення: NEXT_PUBLIC_SERVER_LAUNCH_DATE. */
export const LC_DEFAULT_SERVER_LAUNCH_DATE = "2023-09-11";

/** Річниця завжди 11 вересня (місяць 0–11). */
export const LC_ANNIVERSARY_MONTH = 8;
export const LC_ANNIVERSARY_DAY = 11;

export function getServerLaunchDate(): Date {
  const raw =
    process.env.NEXT_PUBLIC_SERVER_LAUNCH_DATE?.trim() ||
    LC_DEFAULT_SERVER_LAUNCH_DATE;
  const parsed = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return new Date(`${LC_DEFAULT_SERVER_LAUNCH_DATE}T00:00:00`);
  }
  return parsed;
}

export type ServerAgeParts = {
  /** Повні календарні роки */
  years: number;
  /** Повні місяці після років */
  months: number;
  /** Дні після років і місяців */
  days: number;
  /** Усього повних днів від дати відкриття */
  totalDays: number;
};

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Календарний вік сервера: роки / місяці / дні (+ totalDays). */
export function getServerAgeParts(now: Date = new Date()): ServerAgeParts {
  const launch = startOfLocalDay(getServerLaunchDate());
  const today = startOfLocalDay(now);

  const totalDays = Math.max(
    0,
    Math.floor((today.getTime() - launch.getTime()) / 86_400_000),
  );

  if (today.getTime() <= launch.getTime()) {
    return { years: 0, months: 0, days: 0, totalDays: 0 };
  }

  let years = today.getFullYear() - launch.getFullYear();
  let months = today.getMonth() - launch.getMonth();
  let days = today.getDate() - launch.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return {
    years: Math.max(0, years),
    months: Math.max(0, months),
    days: Math.max(0, days),
    totalDays,
  };
}

/** Скільки повних днів сервер уже існує (не менше 0). */
export function getServerAgeDays(now: Date = new Date()): number {
  return getServerAgeParts(now).totalDays;
}

export function ukYearsWord(n: number): string {
  const abs = Math.abs(Math.trunc(n)) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return "років";
  if (last === 1) return "рік";
  if (last >= 2 && last <= 4) return "роки";
  return "років";
}

export function ukMonthsWord(n: number): string {
  const abs = Math.abs(Math.trunc(n)) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return "місяців";
  if (last === 1) return "місяць";
  if (last >= 2 && last <= 4) return "місяці";
  return "місяців";
}

export function ukDaysWord(n: number): string {
  const abs = Math.abs(Math.trunc(n)) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return "днів";
  if (last === 1) return "день";
  if (last >= 2 && last <= 4) return "дні";
  return "днів";
}

/**
 * Річниця завжди саме 11 вересня (після першого року існування).
 * Локальний прев’ю: NEXT_PUBLIC_FORCE_SERVER_ANNIVERSARY=1
 */
export function isServerAnniversary(now: Date = new Date()): boolean {
  if (process.env.NEXT_PUBLIC_FORCE_SERVER_ANNIVERSARY?.trim() === "1") {
    return true;
  }
  const today = startOfLocalDay(now);
  if (
    today.getMonth() !== LC_ANNIVERSARY_MONTH ||
    today.getDate() !== LC_ANNIVERSARY_DAY
  ) {
    return false;
  }
  // День відкриття (2023-09-11) — ще не річниця
  return getServerAgeParts(today).years >= 1;
}

/** Привітання на річницю — коротко. */
export function getAnniversaryGreeting(years: number): string {
  if (years <= 0) return "Дякуємо, що ви з нами.";
  if (years === 1) return "З першою річницею — дякуємо за гру.";
  if (years === 2) return "З річницею — нові хроніки попереду.";
  if (years === 3) return "З річницею — пишаємося спільнотою.";
  if (years === 5) return "З п’ятою річницею Lost Chronicles.";
  if (years === 10) return "З десятиріччям — дякуємо за історію.";
  return `З річницею — ${years} ${ukYearsWord(years)} разом.`;
}



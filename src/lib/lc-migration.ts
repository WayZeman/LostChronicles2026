import {
  LC_MARKETING_HOST,
  LC_MARKETING_SITE_ORIGIN,
} from "@/lib/lc-domains";

/** Останній день показу банера та обмежень (включно). */
export const LC_MIGRATION_NOTICE_END_YMD = "2026-09-01";

export type LcRestrictedFeature = "auth" | "wiki" | "proposals";

export type LcRestrictionInfo = {
  title: string;
  reason: string;
};

export const LC_RESTRICTION_INFO: Record<
  LcRestrictedFeature,
  LcRestrictionInfo
> = {
  auth: {
    title: "Вхід тимчасово недоступний",
    reason: `Після переїзду на ${LC_MARKETING_HOST} налаштовуємо вхід через Discord і Google (нові OAuth-адреси для ${LC_MARKETING_SITE_ORIGIN}). Спробуйте знову після 1 вересня або напишіть адмінам у Telegram.`,
  },
  wiki: {
    title: "Вікі тимчасово недоступна",
    reason: `Переносимо статті вікі на новий домен ${LC_MARKETING_HOST}. Перегляд і редагування відновимо до 1 вересня включно.`,
  },
  proposals: {
    title: "Пропозиції тимчасово недоступні",
    reason: `Голосування та створення пропозицій призупинено під час переїзду сайту на ${LC_MARKETING_HOST}. Очікуйте відновлення до 1 вересня включно.`,
  },
};

export const LC_MIGRATION_BANNER_TEXT = `Сайт переїхав на ${LC_MARKETING_HOST}. До 1 вересня включно частина функцій (вхід, вікі, пропозиції) тимчасово обмежена — натисніть на них, щоб дізнатися причину.`;

function ymdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Чи показувати банер і блокувати обмежені функції (до кінця 1 вересня включно). */
export function isLcMigrationNoticeActive(now = new Date()): boolean {
  return ymdLocal(now) <= LC_MIGRATION_NOTICE_END_YMD;
}

export function isLcFeatureRestricted(
  feature: LcRestrictedFeature,
  now = new Date(),
): boolean {
  void feature;
  return isLcMigrationNoticeActive(now);
}

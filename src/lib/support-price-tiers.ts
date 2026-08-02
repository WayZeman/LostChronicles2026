/** Варіанти ціни товару (рідкісна / епічна / …). */

export type SupportPriceTier = {
  label: string;
  price_label: string;
};

export function parsePriceTiersJson(raw: unknown): SupportPriceTier[] {
  if (raw == null || raw === "") return [];
  let parsed: unknown = raw;
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return [];
    try {
      parsed = JSON.parse(s);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  const out: SupportPriceTier[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const label = typeof o.label === "string" ? o.label.trim() : "";
    const price_label =
      typeof o.price_label === "string" ? o.price_label.trim() : "";
    if (!price_label) continue;
    out.push({ label: label || "Варіант", price_label });
  }
  return out;
}

export function normalizePriceTiers(
  tiers: SupportPriceTier[],
): SupportPriceTier[] {
  return tiers
    .map((t) => ({
      label: t.label.trim() || "Варіант",
      price_label: t.price_label.trim(),
    }))
    .filter((t) => t.price_label.length > 0)
    .slice(0, 12);
}

/** Мінімальна ціна з числа в лейблі. */
export function minPriceFromLabels(labels: string[]): number | null {
  let min: number | null = null;
  for (const label of labels) {
    const m = label.replace(",", ".").match(/(\d+(?:\.\d+)?)/);
    if (!m) continue;
    const n = Number(m[1]);
    if (!Number.isFinite(n) || n <= 0) continue;
    if (min == null || n < min) min = n;
  }
  return min;
}

export function summarizePriceLabel(tiers: SupportPriceTier[]): string {
  if (tiers.length === 0) return "";
  if (tiers.length === 1) return tiers[0]!.price_label;
  const min = minPriceFromLabels(tiers.map((t) => t.price_label));
  if (min == null) return tiers[0]!.price_label;
  return `від ${min.toLocaleString("uk-UA")} ₴`;
}

/** Ефективні варіанти: tiers або один з price_label. */
export function effectivePriceTiers(
  price_label: string,
  tiersJson: unknown,
): SupportPriceTier[] {
  const tiers = normalizePriceTiers(parsePriceTiersJson(tiersJson));
  if (tiers.length > 0) return tiers;
  const pl = price_label.trim();
  if (!pl) return [];
  return [{ label: "", price_label: pl }];
}

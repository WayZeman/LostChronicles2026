import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Building2,
  Coins,
  Flag,
  Landmark,
  Newspaper,
  ScrollText,
  Tent,
  Users,
} from "lucide-react";

export type WikiAccent = {
  bar: string;
  glow: string;
  chip: string;
  Icon: LucideIcon;
};

const DEFAULT_ACCENT: WikiAccent = {
  bar: "bg-[var(--mc-net-green)]",
  glow: "group-hover:border-[var(--mc-net-green)]/40",
  chip: "border-[var(--mc-net-green)]/25 text-[var(--mc-net-green)]",
  Icon: ScrollText,
};

const BY_SLUG: Record<string, WikiAccent> = {
  Лор_серверу: {
    bar: "bg-[#ecaf2d]",
    glow: "group-hover:border-[#ecaf2d]/40",
    chip: "border-[#ecaf2d]/30 text-[#ecaf2d]",
    Icon: BookOpen,
  },
  Історія_проєкту: {
    bar: "bg-[#ecaf2d]",
    glow: "group-hover:border-[#ecaf2d]/40",
    chip: "border-[#ecaf2d]/30 text-[#ecaf2d]",
    Icon: ScrollText,
  },
  Держави: {
    bar: "bg-[var(--mc-net-green)]",
    glow: "group-hover:border-[var(--mc-net-green)]/40",
    chip: "border-[var(--mc-net-green)]/30 text-[var(--mc-net-green)]",
    Icon: Landmark,
  },
  Державні_Утворення: {
    bar: "bg-[#7dd3a0]",
    glow: "group-hover:border-[#7dd3a0]/40",
    chip: "border-[#7dd3a0]/30 text-[#7dd3a0]",
    Icon: Flag,
  },
  Мегаполіси: {
    bar: "bg-[#6ec6ff]",
    glow: "group-hover:border-[#6ec6ff]/40",
    chip: "border-[#6ec6ff]/30 text-[#6ec6ff]",
    Icon: Building2,
  },
  Міста: {
    bar: "bg-[#6ec6ff]",
    glow: "group-hover:border-[#6ec6ff]/40",
    chip: "border-[#6ec6ff]/30 text-[#6ec6ff]",
    Icon: Building2,
  },
  Поселення: {
    bar: "bg-[#8bb8a0]",
    glow: "group-hover:border-[#8bb8a0]/40",
    chip: "border-[#8bb8a0]/30 text-[#8bb8a0]",
    Icon: Tent,
  },
  RP_новини: {
    bar: "bg-[#f0c674]",
    glow: "group-hover:border-[#f0c674]/40",
    chip: "border-[#f0c674]/30 text-[#f0c674]",
    Icon: Newspaper,
  },
  Гравці: {
    bar: "bg-[#ffd54f]",
    glow: "group-hover:border-[#ffd54f]/40",
    chip: "border-[#ffd54f]/30 text-[#ffd54f]",
    Icon: Users,
  },
  Довідник_цін: {
    bar: "bg-[#55ff55]",
    glow: "group-hover:border-[#55ff55]/40",
    chip: "border-[#55ff55]/30 text-[#55ff55]",
    Icon: Coins,
  },
};

export function wikiAccentForSlug(slug: string): WikiAccent {
  return BY_SLUG[slug] ?? DEFAULT_ACCENT;
}

/** Підписи для створення картки+сторінки в реєстрі. */
export function wikiCategoryCreateCopy(slug: string): {
  addLabel: string;
  formTitle: string;
  titlePlaceholder: string;
  blurbPlaceholder: string;
  createLabel: string;
  successHint: string;
} {
  switch (slug) {
    case "Держави":
      return {
        addLabel: "Нова держава",
        formTitle: "Нова картка держави",
        titlePlaceholder: "Назва (Домініон Земана)",
        blurbPlaceholder: "Короткий опис на картці — опційно",
        createLabel: "Створити картку і сторінку",
        successHint: "Картку додано, відкрито сторінку для редагування.",
      };
    case "Державні_Утворення":
      return {
        addLabel: "Нове утворення",
        formTitle: "Нова картка державного утворення",
        titlePlaceholder: "Назва утворення",
        blurbPlaceholder: "Короткий опис на картці — опційно",
        createLabel: "Створити картку і сторінку",
        successHint: "Картку додано, відкрито сторінку для редагування.",
      };
    case "Мегаполіси":
      return {
        addLabel: "Новий мегаполіс",
        formTitle: "Нова картка мегаполіса",
        titlePlaceholder: "Назва мегаполіса",
        blurbPlaceholder: "Короткий опис на картці — опційно",
        createLabel: "Створити картку і сторінку",
        successHint: "Картку додано, відкрито сторінку для редагування.",
      };
    case "Міста":
      return {
        addLabel: "Нове місто",
        formTitle: "Нова картка міста",
        titlePlaceholder: "Назва міста",
        blurbPlaceholder: "Короткий опис на картці — опційно",
        createLabel: "Створити картку і сторінку",
        successHint: "Картку додано, відкрито сторінку для редагування.",
      };
    case "Поселення":
      return {
        addLabel: "Нове поселення",
        formTitle: "Нова картка поселення",
        titlePlaceholder: "Назва поселення",
        blurbPlaceholder: "Короткий опис на картці — опційно",
        createLabel: "Створити картку і сторінку",
        successHint: "Картку додано, відкрито сторінку для редагування.",
      };
    case "Гравці":
      return {
        addLabel: "Новий гравець",
        formTitle: "Нова картка гравця",
        titlePlaceholder: "Нікнейм / імʼя",
        blurbPlaceholder: "Короткий опис на картці — опційно",
        createLabel: "Створити картку і сторінку",
        successHint: "Картку додано, відкрито сторінку для редагування.",
      };
    case "Лор_серверу":
      return {
        addLabel: "Нова сторінка лору",
        formTitle: "Нова картка лору",
        titlePlaceholder: "Назва розділу лору",
        blurbPlaceholder: "Короткий опис на картці — опційно",
        createLabel: "Створити картку і сторінку",
        successHint: "Картку додано, відкрито сторінку для редагування.",
      };
    case "Історія_проєкту":
      return {
        addLabel: "Нова сторінка історії",
        formTitle: "Нова картка історії",
        titlePlaceholder: "Назва",
        blurbPlaceholder: "Короткий опис на картці — опційно",
        createLabel: "Створити картку і сторінку",
        successHint: "Картку додано, відкрито сторінку для редагування.",
      };
    case "Довідник_цін":
      return {
        addLabel: "Нова сторінка цін",
        formTitle: "Нова картка довідника",
        titlePlaceholder: "Назва",
        blurbPlaceholder: "Короткий опис на картці — опційно",
        createLabel: "Створити картку і сторінку",
        successHint: "Картку додано, відкрито сторінку для редагування.",
      };
    default:
      return {
        addLabel: "Нова картка",
        formTitle: "Нова картка в реєстрі",
        titlePlaceholder: "Назва",
        blurbPlaceholder: "Короткий опис на картці — опційно",
        createLabel: "Створити картку і сторінку",
        successHint: "Картку додано, відкрито сторінку для редагування.",
      };
  }
}

/** Простий підрахунок для бейджа. */
export function wikiPagesChip(n: number | undefined): string | null {
  if (n === undefined || n < 0) return null;
  if (n === 0) return "порожньо";
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} сторінка`;
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) {
    return `${n} сторінки`;
  }
  return `${n} сторінок`;
}

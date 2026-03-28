"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
const NICKNAME_RE = /^[a-zA-Z0-9_]{3,16}$/;

const btnClass =
  "lc-focus-ring inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-sm border-2 border-[var(--mc-net-green)] bg-[var(--mc-vote-bg)] px-4 py-2.5 text-sm font-bold text-[var(--mc-green-ink)] transition-colors hover:bg-[var(--mc-vote-bg-hover)] active:opacity-90 disabled:opacity-50 sm:w-auto sm:min-h-[2.5rem] sm:px-5";

export function FaqSkinUploadForm() {
  const [nickname, setNickname] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const nick = nickname.trim();
    if (!NICKNAME_RE.test(nick)) {
      setError("Нікнейм: 3–16 символів, лише латинські літери, цифри та _.");
      return;
    }

    const input = e.currentTarget.elements.namedItem(
      "skin-file",
    ) as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      setError("Оберіть PNG-файл.");
      return;
    }

    const fd = new FormData();
    fd.append("nickname", nick);
    fd.append("file", file);

    setPending(true);
    try {
      const res = await fetch("/api/upload-skin", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Помилка завантаження.");
        return;
      }
      if (data.url) {
        setSuccess(data.url);
      } else {
        setError("Некоректна відповідь сервера.");
      }
    } catch {
      setError("Мережа недоступна. Спробуйте ще раз.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={onSubmit}
      encType="multipart/form-data"
    >
      <div className="space-y-2">
        <Label htmlFor="skin-nickname" className="text-[var(--mc-text)]">
          Нікнейм (як у Minecraft)
        </Label>
        <Input
          id="skin-nickname"
          name="nickname"
          autoComplete="username"
          placeholder="Steve"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="border-[var(--mc-border-card)] bg-[var(--mc-surface-elevated)]/80 text-[var(--mc-text)] placeholder:text-[var(--mc-text-muted)]"
          required
          minLength={3}
          maxLength={16}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="skin-file" className="text-[var(--mc-text)]">
          PNG скіну
        </Label>
        <Input
          id="skin-file"
          name="skin-file"
          type="file"
          accept="image/png"
          className="cursor-pointer border-[var(--mc-border-card)] bg-[var(--mc-surface-elevated)]/80 text-[var(--mc-text)] file:mr-3"
          required
        />
      </div>
      <div>
        <button type="submit" disabled={pending} className={btnClass}>
          {pending ? "Завантаження…" : "Завантажити скін"}
        </button>
      </div>
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="text-sm font-medium text-[var(--mc-net-green)]" role="status">
          Скін успішно завантажено:{" "}
          <a
            href={success}
            className="break-all font-semibold underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            {success}
          </a>
        </p>
      ) : null}
    </form>
  );
}

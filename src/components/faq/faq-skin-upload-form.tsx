"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const NICKNAME_RE =
  /^[a-zA-Z0-9_]{3,16}$/;

const btnClass =
  "lc-focus-ring inline-flex min-h-11 w-full items-center justify-center rounded-sm border-2 border-[var(--mc-net-green)] bg-[var(--mc-vote-bg)] px-4 py-2.5 text-sm font-bold text-[var(--mc-green-ink)] hover:bg-[var(--mc-vote-bg-hover)] disabled:opacity-50";

export function FaqSkinUploadForm() {

  const [nickname, setNickname] =
    useState("");

  const [pending, setPending] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState<string | null>(null);

  async function onSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {

    e.preventDefault();

    setError(null);
    setSuccess(null);

    const nick =
      nickname.trim();

    if (!NICKNAME_RE.test(nick)) {

      setError(
        "Нікнейм: 3–16 символів, лише латинські літери, цифри та _."
      );

      return;
    }

    const input =
      e.currentTarget.elements.namedItem(
        "file"
      ) as HTMLInputElement | null;

    const file =
      input?.files?.[0];

    if (!file) {

      setError(
        "Оберіть PNG-файл."
      );

      return;
    }

    const fd = new FormData();

    fd.append("nickname", nick);
    fd.append("file", file);

    setPending(true);

    try {

      const res =
        await fetch(
          "/api/upload-skin",
          {
            method: "POST",
            body: fd,
          }
        );

      const data =
        await res.json();

      if (!res.ok) {

        setError(
          data.error ??
            "Помилка завантаження."
        );

        return;
      }

      if (data.url) {

        setSuccess(data.url);

      } else {

        setError(
          "Некоректна відповідь сервера."
        );

      }

    } catch {

      setError(
        "Мережа недоступна."
      );

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

      <div>

        <Label htmlFor="nickname">

          Нікнейм

        </Label>

        <Input
          id="nickname"
          name="nickname"
          placeholder="Steve"
          value={nickname}
          onChange={(e) =>
            setNickname(
              e.target.value
            )
          }
          required
        />

      </div>

      <div>

        <Label htmlFor="file">

          PNG скіну

        </Label>

        <Input
          id="file"
          name="file"
          type="file"
          accept="image/png"
          required
        />

      </div>

      <button
        type="submit"
        disabled={pending}
        className={btnClass}
      >

        {pending
          ? "Завантаження..."
          : "Завантажити скін"}

      </button>

      {error && (

        <p className="text-red-500 text-sm">

          {error}

        </p>

      )}

      {success && (

        <p className="text-green-500 text-sm">

          Скін завантажено:

          <a
            href={success}
            target="_blank"
            className="underline"
          >

            {success}

          </a>

        </p>

      )}

    </form>

  );
}
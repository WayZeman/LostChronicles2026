import { NextResponse } from "next/server";

const NICKNAME_RE = /^[a-zA-Z0-9_]{3,16}$/;
const REPO = "WayZeman/LostChronicles2026";
const SKIN_BASE_URL = "https://lost-chronicles.site/skins";
const MAX_BYTES = 512 * 1024;

const PNG_MAGIC = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

function isPng(buf: Uint8Array): boolean {
  if (buf.length < PNG_MAGIC.length) return false;
  for (let i = 0; i < PNG_MAGIC.length; i++) {
    if (buf[i] !== PNG_MAGIC[i]) return false;
  }
  return true;
}

type GhContentFile = { sha?: string };

async function getExistingSha(
  path: string,
  token: string,
): Promise<string | null> {
  const url = `https://api.github.com/repos/${REPO}/contents/${encodeURIComponent(path)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`GitHub GET ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = (await res.json()) as GhContentFile | unknown[];
  if (Array.isArray(data)) return null;
  return typeof data.sha === "string" ? data.sha : null;
}

export async function POST(request: Request) {
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) {
    return NextResponse.json(
      { error: "Сервер не налаштовано (GITHUB_TOKEN)." },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Некоректне тіло запиту." }, { status: 400 });
  }

  const nicknameRaw = form.get("nickname");
  const file = form.get("file");

  if (typeof nicknameRaw !== "string") {
    return NextResponse.json({ error: "Вкажіть нікнейм." }, { status: 400 });
  }
  const nickname = nicknameRaw.trim();
  if (!NICKNAME_RE.test(nickname)) {
    return NextResponse.json(
      { error: "Нікнейм: 3–16 символів, лише латинські літери, цифри та _." },
      { status: 400 },
    );
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Оберіть PNG-файл." }, { status: 400 });
  }
  if (file.size === 0 || file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Файл порожній або завеликий (макс. 512 КБ)." },
      { status: 400 },
    );
  }

  const ab = await file.arrayBuffer();
  const bytes = new Uint8Array(ab);
  if (!isPng(bytes)) {
    return NextResponse.json(
      { error: "Потрібен саме PNG (перевірте формат файлу)." },
      { status: 400 },
    );
  }

  const path = `public/skins/${nickname}.png`;
  const base64 = Buffer.from(bytes).toString("base64");

  let sha: string | null;
  try {
    sha = await getExistingSha(path, token);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Помилка GitHub.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const message = sha
    ? `Update skin for ${nickname}`
    : `Upload skin for ${nickname}`;

  const putBody: { message: string; content: string; sha?: string } = {
    message,
    content: base64,
  };
  if (sha) putBody.sha = sha;

  const putRes = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${encodeURIComponent(path)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(putBody),
    },
  );

  if (!putRes.ok) {
    const t = await putRes.text();
    return NextResponse.json(
      { error: `Не вдалося зберегти файл: ${putRes.status} ${t.slice(0, 180)}` },
      { status: 502 },
    );
  }

  const url = `${SKIN_BASE_URL}/${encodeURIComponent(nickname)}.png`;
  return NextResponse.json({ url });
}

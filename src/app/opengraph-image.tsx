import { ImageResponse } from "next/og";

export const alt = "Lost Chronicles — український Minecraft-сервер Java та Bedrock";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "64px 72px",
          background:
            "linear-gradient(145deg, #0a0a0b 0%, #121816 45%, #0f1a14 100%)",
          color: "#f4f4f5",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 18,
              background: "linear-gradient(135deg, #3ecf8e 0%, #1f9d55 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 42,
              fontWeight: 800,
            }}
          >
            LC
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: -1 }}>
              Lost Chronicles
            </div>
            <div style={{ fontSize: 24, color: "#9ca3af", marginTop: 4 }}>
              lost-chronicles.co.ua
            </div>
          </div>
        </div>
        <div
          style={{
            fontSize: 34,
            lineHeight: 1.35,
            maxWidth: 920,
            color: "#e4e4e7",
          }}
        >
          Український Minecraft Java & Bedrock · RP-сервер
        </div>
        <div
          style={{
            marginTop: 28,
            display: "flex",
            gap: 16,
            fontSize: 22,
            color: "#86efac",
          }}
        >
          <span>play.lost-chronicles.co.ua</span>
          <span style={{ color: "#52525b" }}>·</span>
          <span>Анкета · Вікі · Карта</span>
        </div>
      </div>
    ),
    { ...size },
  );
}

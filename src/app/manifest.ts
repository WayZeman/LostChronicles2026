import type { MetadataRoute } from "next";

const description =
  "Місце, де українські гравці об'єднуються, щоб створювати пригоди, знаходити друзів і будувати власні цивілізації у живому світі історій.";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lost Chronicles — сервер Minecraft",
    short_name: "Lost Chronicles",
    description,
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0b",
    theme_color: "#0a0a0b",
    icons: [
      {
        src: "/logo.png",
        sizes: "597x595",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}

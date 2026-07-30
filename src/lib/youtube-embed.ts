/** Спільні URL для вбудовування YouTube (nocookie) та прев’ю. */

export function youtubeThumbUrlsFor(videoId: string): string[] {
  return [
    `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/sddefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  ];
}

export function buildYoutubeEmbedSrc(
  videoId: string,
  opts: { autoplay: boolean; mute: boolean },
): string {
  const params = new URLSearchParams({
    autoplay: opts.autoplay ? "1" : "0",
    mute: opts.mute ? "1" : "0",
    rel: "0",
    playsinline: "1",
    modestbranding: "1",
  });
  if (typeof window !== "undefined" && /^https?:\/\//.test(window.location.origin)) {
    params.set("origin", window.location.origin);
  }
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?${params.toString()}`;
}

export function buildYoutubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}

export function buildYoutubeShortsUrl(videoId: string): string {
  return `https://www.youtube.com/shorts/${encodeURIComponent(videoId)}`;
}

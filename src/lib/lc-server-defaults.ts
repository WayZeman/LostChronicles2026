import { LC_PLAY_HOST } from "@/lib/lc-domains";

/** Адреса для гравців (SRV → :25550). Без порту в UI / «як зайти». */
export const LC_DEFAULT_JAVA_SERVER_HOST = LC_PLAY_HOST;

/**
 * Хост:порт для status API (mcsrvstat тощо).
 * Без порта запит іде на A-запис :25565 — там чужий сервер (UASMP), не Lost Chronicles.
 */
export const LC_DEFAULT_JAVA_STATUS_HOST = `${LC_PLAY_HOST}:25550`;

/** Bedrock-адреса за замовчуванням (зазвичай той самий play-піддомен). */
export const LC_DEFAULT_BEDROCK_ADDRESS = LC_PLAY_HOST;

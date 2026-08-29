/** Єдиний каркас сторінки під layout (flex-колонка). */
export const lcPageMainClass =
  "relative isolate flex min-h-0 w-full flex-1 flex-col";

/** Варіант для /map — вертикальне центрування блоку. */
export const lcPageMainMapClass = `${lcPageMainClass} justify-center`;

/** Типовий контентний контейнер — ширина як у нижнього меню (.site-container). */
export const lcPageContainerClass =
  "site-container relative z-10 py-6 sm:py-10 md:py-16";

/** Головна: той самий верхній ритм, більший нижній відступ під футер. */
export const lcPageContainerHomeClass =
  "site-container relative z-10 pt-12 md:pt-16 pb-16 md:pb-24";

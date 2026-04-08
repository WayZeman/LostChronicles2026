/** Єдиний каркас сторінки під layout (flex-колонка). */
export const lcPageMainClass =
  "relative isolate flex min-h-0 w-full flex-1 flex-col";

/** Варіант для /map — вертикальне центрування блоку. */
export const lcPageMainMapClass = `${lcPageMainClass} justify-center`;

/** Типовий контентний контейнер (вікі, новини, мапа, статті вікі). */
export const lcPageContainerClass =
  "site-container relative z-10 mx-auto w-full max-w-4xl px-4 py-12 md:py-16";

/** Головна: той самий верхній ритм, більший нижній відступ під футер. */
export const lcPageContainerHomeClass =
  "site-container relative z-10 mx-auto w-full max-w-4xl px-4 pt-12 md:pt-16 pb-16 md:pb-24";

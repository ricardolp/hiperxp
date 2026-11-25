/** URL canônica do site (produção). Sobrescreva com VITE_SITE_URL no build. */
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL || "https://hiperxp.com"
).replace(/\/$/, "");

export const GITHUB_URL =
  import.meta.env.VITE_GITHUB_URL || "https://github.com/ricardolp/hiperxp";

export const SITE_NAME = "HiperXP";

export const SITE_DEFAULT_TITLE =
  "Mapa Reino Oriental e guias de quest Perfect World (PW) | HiperXP";

export const SITE_DEFAULT_DESCRIPTION =
  "Mapa interativo do Reino Oriental (Cidade da Paz, Tianyu, Jingxuan), guia de quests PW com coordenadas — Alma da Paz Eterna, Alma de Tianyu — e simulador de baús do Perfect World.";

export const SITE_OG_IMAGE = "/brand/social/hiperxp-og-pw-1200x630.png";

export const SITE_LOCALE = "pt_BR";

export type SocialLink = {
  id: "github";
  label: string;
  handle: string;
  href: string;
};

/** Link do rodapé — apenas GitHub. */
export const SOCIAL_LINKS: SocialLink[] = [
  {
    id: "github",
    label: "GitHub",
    handle: "HiperXP",
    href: GITHUB_URL,
  },
];

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}

export function absoluteAsset(path: string): string {
  return absoluteUrl(path);
}

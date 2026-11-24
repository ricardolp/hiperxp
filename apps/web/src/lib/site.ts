/** URL canônica do site (produção). Sobrescreva com VITE_SITE_URL no build. */
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL || "https://hiperxp.com"
).replace(/\/$/, "");

export const GITHUB_URL =
  import.meta.env.VITE_GITHUB_URL || "https://github.com/ricardolp/hiperxp";

export const SITE_NAME = "HiperXP";

export const SITE_DEFAULT_TITLE =
  "HiperXP — Mapas e missões do Reino Oriental | Perfect World";

export const SITE_DEFAULT_DESCRIPTION =
  "Mapas interativos do Reino Oriental (Cidade da Paz, Tianyu, Jingxuan), guias de missões com coordenadas e simulador de baús do Perfect World.";

export const SITE_OG_IMAGE = "/brand/social/hiperxp-og-1200x630.png";

export const SITE_LOCALE = "pt_BR";

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}

export function absoluteAsset(path: string): string {
  return absoluteUrl(path);
}

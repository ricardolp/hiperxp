/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_URL?: string;
  readonly VITE_GITHUB_URL?: string;
  readonly VITE_UMAMI_SCRIPT_URL?: string;
  readonly VITE_UMAMI_WEBSITE_ID?: string;
  /** Base URL of @hiperxp/api (no trailing slash). Empty = static JSON only. */
  readonly VITE_DATABASE_API_URL?: string;
  /** Base URL for item PNGs (no trailing slash). Empty = /database/icons in dev, jsDelivr in prod. */
  readonly VITE_DATABASE_ICONS_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "@fixtures/*.json" {
  const value: unknown;
  export default value;
}

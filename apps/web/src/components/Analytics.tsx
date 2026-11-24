import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const umamiScriptUrl = import.meta.env.VITE_UMAMI_SCRIPT_URL as string | undefined;
const umamiWebsiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID as string | undefined;
const GA_MEASUREMENT_ID = "G-ZECKM8ZEQW";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function loadUmami(scriptUrl: string, websiteId: string): void {
  if (document.querySelector(`script[data-website-id="${websiteId}"]`)) return;

  const script = document.createElement("script");
  script.defer = true;
  script.src = scriptUrl;
  script.dataset.websiteId = websiteId;
  script.dataset.domains = "hiperxp.com";
  document.head.appendChild(script);
}

/** SPA navigations: gtag in index.html only covers the first load. */
function trackGaPageView(path: string): void {
  window.gtag?.("config", GA_MEASUREMENT_ID, {
    page_path: path,
    page_title: document.title,
  });
}

export function Analytics() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (import.meta.env.DEV) return;
    if (umamiScriptUrl && umamiWebsiteId) {
      loadUmami(umamiScriptUrl, umamiWebsiteId);
    }
  }, []);

  useEffect(() => {
    if (import.meta.env.DEV) return;

    const path = `${pathname}${search}`;
    const id = window.setTimeout(() => trackGaPageView(path), 0);
    return () => window.clearTimeout(id);
  }, [pathname, search]);

  return null;
}

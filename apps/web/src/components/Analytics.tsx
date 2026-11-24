import { useEffect } from "react";

const scriptUrl = import.meta.env.VITE_UMAMI_SCRIPT_URL;
const websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID;

export function Analytics() {
  useEffect(() => {
    if (import.meta.env.DEV) return;
    if (!scriptUrl || !websiteId) return;
    if (document.querySelector(`script[data-website-id="${websiteId}"]`)) return;

    const script = document.createElement("script");
    script.defer = true;
    script.src = scriptUrl;
    script.dataset.websiteId = websiteId;
    script.dataset.domains = "hiperxp.com";
    document.head.appendChild(script);
  }, []);

  return null;
}

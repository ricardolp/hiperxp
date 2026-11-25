import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { resolveSeo, SEO_DEFAULTS } from "../lib/seo";
import { absoluteAsset, absoluteUrl } from "../lib/site";

const JSON_LD_ID = "hiperxp-json-ld";

function upsertMeta(
  attr: "name" | "property",
  key: string,
  content: string,
): void {
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[${attr}="${key}"]`,
  );
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string): void {
  let el = document.head.querySelector<HTMLLinkElement>(
    `link[rel="${rel}"]`,
  );
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

function upsertJsonLd(
  data: Record<string, unknown> | Record<string, unknown>[] | undefined,
): void {
  const existing = document.getElementById(JSON_LD_ID);
  if (!data) {
    existing?.remove();
    return;
  }
  const script =
    existing instanceof HTMLScriptElement
      ? existing
      : document.createElement("script");
  script.id = JSON_LD_ID;
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(data);
  if (!existing) document.head.appendChild(script);
}

/** Atualiza title, meta, canonical e JSON-LD conforme a rota. */
export function DocumentMeta() {
  const { pathname } = useLocation();

  useEffect(() => {
    const seo = resolveSeo(pathname);
    const url = absoluteUrl(seo.path);
    const image = absoluteAsset(seo.image || SEO_DEFAULTS.image);

    document.title = seo.title;

    upsertMeta("name", "description", seo.description);
    upsertMeta(
      "name",
      "robots",
      seo.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large",
    );
    upsertMeta(
      "name",
      "keywords",
      "Perfect World, PW, quest Perfect World, Alma da Paz Eterna, mapa Reino Oriental, Cidade da Paz, Tianyu, Jingxuan, guia de missões, HiperXP",
    );

    upsertMeta("property", "og:site_name", SEO_DEFAULTS.siteName);
    upsertMeta("property", "og:locale", SEO_DEFAULTS.locale);
    upsertMeta("property", "og:type", seo.type ?? "website");
    upsertMeta("property", "og:title", seo.title);
    upsertMeta("property", "og:description", seo.description);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:image", image);
    upsertMeta("property", "og:image:width", "1200");
    upsertMeta("property", "og:image:height", "630");

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", seo.title);
    upsertMeta("name", "twitter:description", seo.description);
    upsertMeta("name", "twitter:image", image);

    upsertLink("canonical", url);
    upsertJsonLd(seo.jsonLd);
  }, [pathname]);

  return null;
}

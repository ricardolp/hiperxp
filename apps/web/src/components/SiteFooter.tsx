import { SOCIAL_LINKS, SITE_NAME } from "../lib/site";

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.36 1.09 2.94.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0 1 12 6.8c.85 0 1.71.11 2.51.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.85-2.34 4.7-4.57 4.95.36.31.68.92.68 1.86v2.76c0 .26.18.58.69.48A10 10 0 0 0 12 2Z"
      />
    </svg>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <nav className="site-social-bar" aria-label="GitHub">
          {SOCIAL_LINKS.map((item) => (
            <a
              key={item.id}
              className="site-social-item"
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="site-social-icon">
                <GitHubIcon />
              </span>
              <span className="site-social-copy">
                <strong>{item.label}</strong>
                <span>{item.handle}</span>
              </span>
            </a>
          ))}
        </nav>
      </div>
      <div className="site-footer-copy">
        <p>
          {SITE_NAME} © {year}
        </p>
      </div>
    </footer>
  );
}

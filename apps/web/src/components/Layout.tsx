import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { brand } from "../lib/brand";
import { GITHUB_URL } from "../lib/site";
import { SiteFooter } from "./SiteFooter";

type NavItem = {
  to: string;
  label: string;
  end?: boolean;
  match?: (pathname: string) => boolean;
};

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Início", end: true },
  {
    to: "/mapas/cidade-da-paz",
    label: "Mapas",
    match: (pathname) => pathname.startsWith("/mapas"),
  },
  {
    to: "/missoes",
    label: "Missões",
    match: (pathname) => pathname.startsWith("/missoes"),
  },
  {
    to: "/database",
    label: "Database",
    match: (pathname) => pathname.startsWith("/database"),
  },
  {
    to: "/simulador",
    label: "Simulador",
    match: (pathname) =>
      pathname.startsWith("/simulador") || pathname.startsWith("/drops"),
  },
];

function GitHubIcon() {
  return (
    <svg
      className="nav-github-icon"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
      />
    </svg>
  );
}

function NavItems({
  items,
  pathname,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => {
            const active = item.match ? item.match(pathname) : isActive;
            return active ? "is-active" : undefined;
          }}
          onClick={onNavigate}
        >
          {item.label}
        </NavLink>
      ))}
    </>
  );
}

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header-inner">
          <NavLink
            to="/"
            className="brand"
            aria-label={`${brand.name} — início`}
            end
          >
            <img
              className="brand-mark"
              src={brand.iconSmall}
              alt=""
              width={28}
              height={28}
              decoding="async"
            />
            <span className="brand-name">
              Hiper<span>XP</span>
            </span>
          </NavLink>

          <nav className="nav" aria-label="Principal">
            <NavItems items={NAV_ITEMS} pathname={pathname} />
            <a
              className="nav-github"
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <GitHubIcon />
              GitHub
            </a>
          </nav>

          <button
            type="button"
            className="nav-toggle"
            aria-expanded={menuOpen}
            aria-controls="site-nav-mobile"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="visually-hidden">
              {menuOpen ? "Fechar menu" : "Abrir menu"}
            </span>
            <span aria-hidden="true">{menuOpen ? "✕" : "☰"}</span>
          </button>
        </div>

        <nav
          id="site-nav-mobile"
          className={`nav-mobile${menuOpen ? " is-open" : ""}`}
          aria-label="Principal"
        >
          <NavItems
            items={NAV_ITEMS}
            pathname={pathname}
            onNavigate={() => setMenuOpen(false)}
          />
          <a
            className="nav-github nav-github--mobile"
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMenuOpen(false)}
          >
            <GitHubIcon />
            GitHub
          </a>
        </nav>
      </header>
      <div className="app-main">
        <Outlet />
      </div>
      <SiteFooter />
    </div>
  );
}

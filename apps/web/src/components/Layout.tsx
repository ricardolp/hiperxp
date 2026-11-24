import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { brand } from "../lib/brand";

type NavItem = {
  to: string;
  label: string;
  end?: boolean;
  match?: (pathname: string) => boolean;
};

const NAV_LEFT: NavItem[] = [
  { to: "/", label: "Início", end: true },
  {
    to: "/mapas/cidade-da-paz",
    label: "Mapas",
    match: (pathname) => pathname.startsWith("/mapas"),
  },
];

const NAV_RIGHT: NavItem[] = [
  {
    to: "/missoes",
    label: "Missões",
    match: (pathname) => pathname.startsWith("/missoes"),
  },
  {
    to: "/simulador",
    label: "Simulador",
    match: (pathname) =>
      pathname.startsWith("/simulador") || pathname.startsWith("/drops"),
  },
];

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
          <nav className="nav nav--left" aria-label="Principal esquerda">
            <NavItems items={NAV_LEFT} pathname={pathname} />
          </nav>

          <NavLink
            to="/"
            className="brand"
            aria-label={`${brand.name} — início`}
            end
          >
            <img
              className="brand-logo"
              src={brand.logoDark}
              alt={brand.name}
              width={240}
              height={73}
              decoding="async"
            />
          </NavLink>

          <nav className="nav nav--right" aria-label="Principal direita">
            <NavItems items={NAV_RIGHT} pathname={pathname} />
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
            items={[...NAV_LEFT, ...NAV_RIGHT]}
            pathname={pathname}
            onNavigate={() => setMenuOpen(false)}
          />
        </nav>
      </header>
      <Outlet />
    </div>
  );
}

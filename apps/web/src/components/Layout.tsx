import { NavLink, Outlet } from "react-router-dom";
import { brand } from "../lib/brand";

export function Layout() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <NavLink to="/" className="brand" aria-label={`${brand.name} — início`}>
          <img
            className="brand-logo"
            src={brand.logoDark}
            alt={brand.name}
            width={240}
            height={73}
            decoding="async"
          />
        </NavLink>
        <nav className="nav" aria-label="Principal">
          <NavLink to="/mapas/cidade-da-paz">Mapas</NavLink>
          <NavLink to="/simulador">Simulador</NavLink>
        </nav>
      </header>
      <Outlet />
    </div>
  );
}

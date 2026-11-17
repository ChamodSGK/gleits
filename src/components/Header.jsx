import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { navigation } from "../data.js";
import { ArrowUpRight, Close, Menu } from "./Icons.jsx";

export default function Header() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  // Close the mobile menu whenever the route changes
  useEffect(() => setOpen(false), [pathname]);

  const links = navigation.map(([label, href]) => (
    <NavLink
      key={href}
      to={href}
      end={href === "/"}
      className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
    >
      {label}
    </NavLink>
  ));

  return (
    <header className="site-header">
      <div className="wrap">
        <div className="header-row">
          <Link to="/" className="logo-link" aria-label="GLEITS home">
            <img src="/logos/gleits-on-dark.png" alt="GLEITS" width="81" height="32" />
          </Link>
          <nav className="nav" aria-label="Primary">
            {links}
          </nav>
          <div className="header-actions">
            <Link to="/contact" className="btn btn-primary header-cta">
              Start a project <ArrowUpRight size={16} />
            </Link>
            <button
              type="button"
              className="menu-btn"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <Close size={20} strokeWidth={1.8} /> : <Menu size={20} strokeWidth={1.8} />}
            </button>
          </div>
        </div>
        <nav id="mobile-nav" className={"mobile-nav" + (open ? " open" : "")} aria-label="Mobile">
          {links}
          <NavLink to="/careers" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
            Careers
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

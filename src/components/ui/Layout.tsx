import React from 'react';
import { NavLink, Link, Outlet } from 'react-router-dom';
import { Shield, LayoutDashboard, FolderKanban, Settings } from 'lucide-react';
import styles from './Layout.module.css';

const NAV_LINKS = [
  { to: '/campus', label: 'Campus', icon: Shield },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/portfolio', label: 'Portfolio', icon: FolderKanban },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export const Layout: React.FC = () => (
  <>
    <nav className={styles.nav} role="navigation" aria-label="Main navigation">
      <div className={styles.inner}>
        <Link to="/" className={styles.logo} aria-label="CyberCampus home">
          <span className={styles.logoMark}>{'<'}</span>
          CyberCampus
          <span className={styles.logoMark}>{'/>'}</span>
        </Link>

        <ul className={styles.links} role="list">
          {NAV_LINKS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `${styles.link}${isActive ? ` ${styles.active}` : ''}`
                }
              >
                <Icon size={15} aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>

    {/* Page content */}
    <main id="main-content" className="page">
      <Outlet />
    </main>

    <footer className={styles.footer} role="contentinfo">
      <div>© 2026 CyberCampus — A cybersecurity learning project.</div>
      <p className={styles.disclaimer}>
        All scenarios use entirely fictional data. This is a learning simulation only.
        Do not target real systems.
      </p>
    </footer>
  </>
);

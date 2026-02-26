/**
 * @file BottomNav.tsx
 * @description UI component for BottomNav.
 *
 * @module components/BottomNav
 *
 * @responsibilities
 * 1. Render UI for the feature area
 * 2. Accept props and emit user interactions
 * 3. Compose shared subcomponents where needed
 *
 * @review-tags
 * - @ui: visual/layout behavior
 *
 * @review-checklist
 * - [ ] Props have sensible defaults
 * - [ ] Component renders without crashing
 */
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Upload, List, LineChart } from 'lucide-react';

const navItems = [
  { name: 'Home', path: '/home', icon: Home, color: 'text-primary' },
  { name: 'Smart Entry', path: '/import-transactions', icon: Upload, color: 'text-success' },
  { name: 'Transactions', path: '/transactions', icon: List, color: 'text-secondary' },
  { name: 'Analytics', path: '/analytics', icon: LineChart, color: 'text-accent' }
];

const BottomNav: React.FC = () => {
  const location = useLocation();

  const navRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const updateBottomNavHeight = () => {
      const navHeight = navRef.current?.offsetHeight ?? 0;
      document.documentElement.style.setProperty('--bottom-nav-height', `${navHeight}px`);
    };

    updateBottomNavHeight();

    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateBottomNavHeight) : null;
    if (navRef.current && resizeObserver) {
      resizeObserver.observe(navRef.current);
    }

    window.addEventListener('resize', updateBottomNavHeight);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateBottomNavHeight);
      document.documentElement.style.setProperty('--bottom-nav-height', '0px');
    };
  }, []);

  return (
    <nav
      ref={navRef}
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-background border-t border-border will-change-transform [transform:translateZ(0)] [backface-visibility:hidden]"
    >
      <ul className="flex justify-around pt-2 pb-[calc(0.5rem+var(--safe-area-bottom))]">
        {navItems.map(({ name, path, icon: Icon, color }) => (
          <li key={path}>
            <Link
              to={path}
              className={`flex flex-col items-center text-xs ${location.pathname === path ? color : 'text-muted-foreground'}`}
            aria-label={name}
          >
              <Icon size={20} className={location.pathname === path ? color : ''} />
              {name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default BottomNav;

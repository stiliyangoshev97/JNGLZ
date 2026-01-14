/**
 * ===== SCROLL TO TOP COMPONENT =====
 *
 * Scrolls to top of page when route changes.
 * Prevents users from landing mid-page when navigating.
 *
 * @module shared/components/ScrollToTop
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top on route change with smooth animation
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }, [pathname]);

  return null;
}

export default ScrollToTop;

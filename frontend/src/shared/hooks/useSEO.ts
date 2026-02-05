/**
 * ===== SEO HOOK =====
 *
 * Custom hook for managing document head and SEO meta tags.
 * Compatible with React 19 (react-helmet-async doesn't support React 19 yet).
 *
 * Features:
 * - Dynamic page titles
 * - Open Graph meta tags
 * - Twitter Card meta tags
 * - Canonical URL management
 * - JSON-LD structured data
 *
 * @module shared/hooks/useSEO
 */

import { useEffect } from 'react';

// Base site configuration
const SITE_CONFIG = {
  siteName: 'JNGLZ.FUN',
  defaultTitle: 'JNGLZ.FUN | Decentralized Prediction Markets on BNB Chain',
  defaultDescription: 'Create and trade on prediction markets with BNB. Anyone can launch markets, trade YES/NO shares, and win by being right. No middlemen, no oracles - just Street Consensus.',
  baseUrl: 'https://jnglz.fun',
  defaultImage: 'https://jnglz.fun/og-image.jpg',
  twitterHandle: '@jnglzdotfun',
  themeColor: '#00f0ff',
};

export interface SEOProps {
  /** Page title (will be appended with site name) */
  title?: string;
  /** Meta description */
  description?: string;
  /** Canonical URL path (e.g., '/market/1') */
  path?: string;
  /** Open Graph image URL */
  image?: string;
  /** Open Graph type (default: 'website') */
  type?: 'website' | 'article';
  /** Don't append site name to title */
  rawTitle?: boolean;
  /** JSON-LD structured data */
  jsonLd?: Record<string, unknown>;
  /** Prevent indexing this page */
  noIndex?: boolean;
}

/**
 * Updates or creates a meta tag
 */
function setMetaTag(property: string, content: string, isProperty = false): void {
  const attribute = isProperty ? 'property' : 'name';
  let element = document.querySelector(`meta[${attribute}="${property}"]`);
  
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, property);
    document.head.appendChild(element);
  }
  
  element.setAttribute('content', content);
}

/**
 * Updates the canonical link
 */
function setCanonical(url: string): void {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  
  link.href = url;
}

/**
 * Sets or updates JSON-LD structured data
 */
function setJsonLd(data: Record<string, unknown>): void {
  const id = 'seo-jsonld';
  let script = document.getElementById(id) as HTMLScriptElement | null;
  
  if (!script) {
    script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  
  script.textContent = JSON.stringify(data);
}

/**
 * Custom SEO hook for managing document head
 *
 * @example
 * // Simple page title
 * useSEO({ title: 'Markets' });
 * // Result: "Markets | JNGLZ.FUN"
 *
 * @example
 * // Market detail page with dynamic data
 * useSEO({
 *   title: `Will BTC hit $100k?`,
 *   description: 'Trade on this prediction market...',
 *   path: `/market/${marketId}`,
 *   image: market.imageUrl,
 * });
 */
export function useSEO(props: SEOProps = {}): void {
  const {
    title,
    description = SITE_CONFIG.defaultDescription,
    path = '/',
    image = SITE_CONFIG.defaultImage,
    type = 'website',
    rawTitle = false,
    jsonLd,
    noIndex = false,
  } = props;

  useEffect(() => {
    // Build the full title
    const fullTitle = title
      ? rawTitle
        ? title
        : `${title} | ${SITE_CONFIG.siteName}`
      : SITE_CONFIG.defaultTitle;

    // Build the full URL
    const fullUrl = `${SITE_CONFIG.baseUrl}${path}`;

    // Update document title
    document.title = fullTitle;

    // Primary meta tags
    setMetaTag('title', fullTitle);
    setMetaTag('description', description);
    
    // Robots
    if (noIndex) {
      setMetaTag('robots', 'noindex, nofollow');
    } else {
      setMetaTag('robots', 'index, follow');
    }

    // Open Graph
    setMetaTag('og:type', type, true);
    setMetaTag('og:url', fullUrl, true);
    setMetaTag('og:title', fullTitle, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:image', image, true);
    setMetaTag('og:site_name', SITE_CONFIG.siteName, true);

    // Twitter Card
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:url', fullUrl);
    setMetaTag('twitter:title', fullTitle);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', image);

    // Canonical URL
    setCanonical(fullUrl);

    // JSON-LD structured data
    if (jsonLd) {
      setJsonLd(jsonLd);
    }

    // Cleanup: Reset to defaults when unmounting
    return () => {
      document.title = SITE_CONFIG.defaultTitle;
      setMetaTag('title', SITE_CONFIG.defaultTitle);
      setMetaTag('description', SITE_CONFIG.defaultDescription);
      setCanonical(SITE_CONFIG.baseUrl);
      setMetaTag('og:url', SITE_CONFIG.baseUrl, true);
      setMetaTag('og:title', SITE_CONFIG.defaultTitle, true);
      setMetaTag('og:description', SITE_CONFIG.defaultDescription, true);
      setMetaTag('og:image', SITE_CONFIG.defaultImage, true);
      setMetaTag('twitter:url', SITE_CONFIG.baseUrl);
      setMetaTag('twitter:title', SITE_CONFIG.defaultTitle);
      setMetaTag('twitter:description', SITE_CONFIG.defaultDescription);
      setMetaTag('twitter:image', SITE_CONFIG.defaultImage);
    };
  }, [title, description, path, image, type, rawTitle, jsonLd, noIndex]);
}

/**
 * Generate JSON-LD for the organization (homepage)
 */
export function getOrganizationJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'JNGLZ.FUN',
    url: SITE_CONFIG.baseUrl,
    logo: `${SITE_CONFIG.baseUrl}/logo.svg`,
    description: SITE_CONFIG.defaultDescription,
    sameAs: [
      'https://twitter.com/jnglzdotfun',
    ],
  };
}

/**
 * Generate JSON-LD for a prediction market
 */
export function getMarketJsonLd(market: {
  id: string;
  question: string;
  description?: string;
  imageUrl?: string;
  createdAt?: string;
  expiryTimestamp?: string;
  totalVolume?: string;
  yesPercent?: number;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: market.question,
    description: market.description || `Prediction market: ${market.question}`,
    image: market.imageUrl || SITE_CONFIG.defaultImage,
    url: `${SITE_CONFIG.baseUrl}/market/${market.id}`,
    brand: {
      '@type': 'Brand',
      name: 'JNGLZ.FUN',
    },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'BNB',
      availability: 'https://schema.org/InStock',
    },
  };
}

/**
 * Generate JSON-LD for WebSite (search box potential)
 */
export function getWebsiteJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'JNGLZ.FUN',
    url: SITE_CONFIG.baseUrl,
    description: SITE_CONFIG.defaultDescription,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_CONFIG.baseUrl}/?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export { SITE_CONFIG };

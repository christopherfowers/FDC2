import { useEffect } from 'react';

interface SEOData {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  noindex?: boolean;
}

/**
 * Custom hook for managing SEO meta tags dynamically
 */
export function useSEO(seoData: SEOData) {
  useEffect(() => {
    // Set document title
    if (seoData.title) {
      document.title = `${seoData.title} | Fire Direction Center`;
    }

    // Helper function to update or create meta tag
    const updateMetaTag = (name: string, content: string, attribute: 'name' | 'property' = 'name') => {
      let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.content = content;
    };

    // Update meta description
    if (seoData.description) {
      updateMetaTag('description', seoData.description);
      updateMetaTag('og:description', seoData.description, 'property');
      updateMetaTag('twitter:description', seoData.description, 'name');
    }

    // Update keywords
    if (seoData.keywords) {
      updateMetaTag('keywords', seoData.keywords);
    }

    // Update Open Graph title
    if (seoData.ogTitle || seoData.title) {
      const ogTitle = seoData.ogTitle || seoData.title;
      updateMetaTag('og:title', `${ogTitle} | Fire Direction Center`, 'property');
      updateMetaTag('twitter:title', `${ogTitle} | Fire Direction Center`, 'name');
    }

    // Update Open Graph image
    if (seoData.ogImage) {
      updateMetaTag('og:image', seoData.ogImage, 'property');
      updateMetaTag('twitter:image', seoData.ogImage, 'name');
    }

    // Update canonical URL
    if (seoData.canonicalUrl) {
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
      }
      canonical.href = seoData.canonicalUrl;
    }

    // Update robots meta tag
    if (seoData.noindex) {
      updateMetaTag('robots', 'noindex, nofollow');
    } else {
      updateMetaTag('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    }

    // Update Open Graph URL
    updateMetaTag('og:url', window.location.href, 'property');
    updateMetaTag('twitter:url', window.location.href, 'name');

  }, [seoData]);
}

/**
 * Predefined SEO configurations for different pages
 */
export const SEOConfig = {
  home: {
    title: 'Home',
    description: 'Professional mortar fire direction center for military and training applications. Calculate accurate ballistic solutions using MGRS coordinates with advanced mission planning capabilities.',
    keywords: 'mortar calculator, fire direction center, FDC, ballistics, MGRS coordinates, military calculator, artillery, mortar systems',
    ogImage: '/web-app-manifest-512x512.png'
  },
  calculator: {
    title: 'Quick Calculator',
    description: 'Streamlined mortar fire solution calculator using MGRS coordinates. Fast and efficient ballistic calculations with essential features for immediate fire direction needs.',
    keywords: 'quick calculator, mortar ballistics, MGRS calculator, artillery calculator, fire direction, ballistic calculations, streamlined FDC',
    ogImage: '/web-app-manifest-512x512.png'
  },
  missionPrep: {
    title: 'Mission Preparation',
    description: 'Plan and prepare comprehensive fire missions with advanced FPF management, multi-gun calculations, and tactical positioning. Professional mission planning workflow for mortar operations.',
    keywords: 'mission planning, FPF management, multi-gun calculations, tactical planning, mortar mission prep',
    ogImage: '/web-app-manifest-512x512.png'
  },
  history: {
    title: 'Mission History',
    description: 'View and manage previous fire missions, analyze performance metrics, and access mission templates. Comprehensive history tracking for operational planning and training.',
    keywords: 'mission history, fire mission tracking, performance analytics, mission templates',
    ogImage: '/web-app-manifest-512x512.png'
  },
  ballisticTables: {
    title: 'Ballistic Tables',
    description: 'Browse comprehensive ballistic data tables for various mortar systems including M252, M224, L16A2, and RT-F1. Detailed firing data with range, elevation, and time of flight information.',
    keywords: 'ballistic tables, mortar data, firing tables, M252, M224, L16A2, RT-F1, ballistic data',
    ogImage: '/web-app-manifest-512x512.png'
  },
  settings: {
    title: 'Settings',
    description: 'Configure application preferences, manage PWA settings, and customize the Fire Direction Center interface for optimal user experience.',
    keywords: 'FDC settings, app configuration, PWA settings, user preferences',
    ogImage: '/web-app-manifest-512x512.png'
  },
  privacy: {
    title: 'Privacy Policy',
    description: 'Privacy policy and data handling practices for the Fire Direction Center application. Learn how we protect your data and respect your privacy.',
    keywords: 'privacy policy, data protection, GDPR compliance, user privacy',
    noindex: false
  },
  terms: {
    title: 'Terms of Service',
    description: 'Terms of service and usage guidelines for the Fire Direction Center application. Important legal information for users.',
    keywords: 'terms of service, usage terms, legal information, user agreement',
    noindex: false
  },
  license: {
    title: 'License Information',
    description: 'Software license and attribution information for the Fire Direction Center application and its dependencies.',
    keywords: 'software license, open source, attribution, legal information',
    noindex: false
  }
} as const;

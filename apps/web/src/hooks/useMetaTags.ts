import { useEffect } from 'react';

interface MetaTags {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  twitterSite?: string;
  canonical?: string;
}

export const useMetaTags = (meta: MetaTags) => {
  useEffect(() => {
    const { title, description, image, url, type, siteName, twitterCard, twitterSite, canonical } = meta;

    // Update title
    if (title) {
      document.title = title;
      const titleElement = document.querySelector('title');
      if (titleElement) {
        titleElement.textContent = title;
      }
    }

    // Helper to set or update meta tag
    const setMetaTag = (property: string, content: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${property}"]` : `meta[name="${property}"]`;
      let element = document.querySelector(selector) as HTMLMetaElement;
      
      if (!element) {
        element = document.createElement('meta');
        if (isProperty) {
          element.setAttribute('property', property);
        } else {
          element.setAttribute('name', property);
        }
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Basic meta tags
    if (description) {
      setMetaTag('description', description);
    }

    // Open Graph tags
    if (title) setMetaTag('og:title', title, true);
    if (description) setMetaTag('og:description', description, true);
    if (image) setMetaTag('og:image', image, true);
    if (url) setMetaTag('og:url', url, true);
    if (type) setMetaTag('og:type', type, true);
    if (siteName) setMetaTag('og:site_name', siteName, true);

    // Twitter Card tags
    if (twitterCard) setMetaTag('twitter:card', twitterCard);
    if (title) setMetaTag('twitter:title', title);
    if (description) setMetaTag('twitter:description', description);
    if (image) setMetaTag('twitter:image', image);
    if (twitterSite) setMetaTag('twitter:site', twitterSite);

    // Canonical URL
    if (canonical) {
      let canonicalElement = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonicalElement) {
        canonicalElement = document.createElement('link');
        canonicalElement.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalElement);
      }
      canonicalElement.setAttribute('href', canonical);
    }
  }, [meta]);
};


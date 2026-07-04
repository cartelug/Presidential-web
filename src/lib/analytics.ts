/**
 * Privacy-first, self-hosted analytics (§16). No script loads until the
 * visitor consents, and none loads at all unless PUBLIC_ANALYTICS_URL is
 * configured to point at a self-hosted Plausible/Umami instance — there is
 * no third-party tracker wired in by default.
 */
const CONSENT_KEY = 'analytics-consent';

export type Consent = 'accepted' | 'declined';

export function getConsent(): Consent | null {
  return localStorage.getItem(CONSENT_KEY) as Consent | null;
}

export function setConsent(value: Consent): void {
  localStorage.setItem(CONSENT_KEY, value);
  if (value === 'accepted') loadAnalytics();
}

export function loadAnalytics(): void {
  const url = import.meta.env.PUBLIC_ANALYTICS_URL as string | undefined;
  const domain = import.meta.env.PUBLIC_ANALYTICS_DOMAIN as string | undefined;
  if (!url || !domain) return; // not configured — stays off, no silent third-party call

  const script = document.createElement('script');
  script.defer = true;
  script.dataset.domain = domain;
  script.src = url;
  document.head.appendChild(script);
}

export function initAnalyticsIfConsented(): void {
  if (getConsent() === 'accepted') loadAnalytics();
}

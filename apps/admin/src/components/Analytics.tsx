import Script from 'next/script';

const UMAMI_URL = process.env.NEXT_PUBLIC_UMAMI_URL;
const UMAMI_WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

export function Analytics() {
  if (!UMAMI_URL || !UMAMI_WEBSITE_ID) {
    return null;
  }

  return (
    <Script
      src={UMAMI_URL}
      data-website-id={UMAMI_WEBSITE_ID}
      strategy="afterInteractive"
    />
  );
}

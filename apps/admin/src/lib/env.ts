// Environment variable helper for cross-app navigation
// Production values set in Vercel dashboard, defaults to localhost for dev

export const DOCS_URL = process.env.NEXT_PUBLIC_DOCS_URL || 'http://localhost:3150';
export const STORYBOOK_URL = process.env.NEXT_PUBLIC_STORYBOOK_URL || 'http://localhost:3151';

export function getStorybookUrl(tag: string, variant = 'default'): string {
  return `${STORYBOOK_URL}/?path=/story/components-${tag}--${variant}`;
}

export function getDocsUrl(tag: string): string {
  return `${DOCS_URL}/component-library/${tag}/`;
}

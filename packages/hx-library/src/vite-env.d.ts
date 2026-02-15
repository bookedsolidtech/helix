/// <reference types="vite/client" />

/**
 * Type declaration for Vite's `?raw` import suffix.
 * Allows importing files as raw strings for use with
 * AdoptedStylesheetsController in Light DOM components.
 */
declare module '*.css?raw' {
  const content: string;
  export default content;
}

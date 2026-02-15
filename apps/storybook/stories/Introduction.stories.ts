import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';

const meta: Meta = {
  title: 'Introduction',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    docs: { toc: false },
    previewTabs: { canvas: { hidden: false } },
    viewMode: 'story',
  },
};

export default meta;
type Story = StoryObj;

/* ─── SVG Icons (inline, no external deps) ───────────────────────── */

const iconPalette = html`<svg
  width="32"
  height="32"
  viewBox="0 0 24 24"
  fill="none"
  stroke="var(--wc-color-primary-500)"
  stroke-width="1.5"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <circle cx="13.5" cy="6.5" r="2.5" />
  <circle cx="19" cy="13" r="2.5" />
  <circle cx="16" cy="20" r="2.5" />
  <circle cx="7.5" cy="20" r="2.5" />
  <circle cx="5" cy="13" r="2.5" />
  <circle cx="12" cy="12" r="3" />
</svg>`;

const iconComponents = html`<svg
  width="32"
  height="32"
  viewBox="0 0 24 24"
  fill="none"
  stroke="var(--wc-color-primary-500)"
  stroke-width="1.5"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <rect x="3" y="3" width="7" height="7" rx="1" />
  <rect x="14" y="3" width="7" height="7" rx="1" />
  <rect x="3" y="14" width="7" height="7" rx="1" />
  <rect x="14" y="14" width="7" height="7" rx="1" />
</svg>`;

const iconRocket = html`<svg
  width="32"
  height="32"
  viewBox="0 0 24 24"
  fill="none"
  stroke="var(--wc-color-primary-500)"
  stroke-width="1.5"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path
    d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"
  />
  <path
    d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"
  />
  <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
  <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
</svg>`;

const iconLit = html`<svg
  width="20"
  height="20"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.5"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
</svg>`;

const iconTypeScript = html`<svg
  width="20"
  height="20"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.5"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <rect x="3" y="3" width="18" height="18" rx="2" />
  <path d="M8 17V11h4" />
  <path d="M8 14h4" />
  <path d="M16 7v10" />
</svg>`;

const iconShadowDOM = html`<svg
  width="20"
  height="20"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.5"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <circle cx="12" cy="12" r="10" />
  <circle cx="12" cy="12" r="6" />
  <circle cx="12" cy="12" r="2" />
</svg>`;

const iconCSS = html`<svg
  width="20"
  height="20"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.5"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M4 2 2 22l10-4 10 4L20 2z" />
  <path d="M7 8h10" />
  <path d="M8 12h8" />
  <path d="M9 16h6" />
</svg>`;

const iconStorybook = html`<svg
  width="20"
  height="20"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.5"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  <line x1="9" y1="8" x2="16" y2="8" />
  <line x1="9" y1="12" x2="14" y2="12" />
</svg>`;

const iconCheck = html`<svg
  width="16"
  height="16"
  viewBox="0 0 24 24"
  fill="none"
  stroke="var(--wc-color-success-500)"
  stroke-width="2.5"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <polyline points="20 6 9 17 4 12" />
</svg>`;

const iconShield = html`<svg
  width="40"
  height="40"
  viewBox="0 0 24 24"
  fill="none"
  stroke="var(--wc-color-primary-600)"
  stroke-width="1.5"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  <path d="m9 12 2 2 4-4" />
</svg>`;

/* ─── Landing Page ────────────────────────────────────────────────── */

export const Welcome: Story = {
  render: () => html`
    <div
      style="
      max-width: 960px;
      margin: 0 auto;
      padding: var(--wc-space-8, 2rem) var(--wc-space-6, 1.5rem);
      font-family: var(--wc-font-family-sans, sans-serif);
      color: var(--wc-color-neutral-800, #212529);
      line-height: var(--wc-line-height-normal, 1.5);
    "
    >
      <!-- ═══ Hero ═══════════════════════════════════════════════ -->
      <div
        style="
        text-align: center;
        padding: var(--wc-space-16, 4rem) var(--wc-space-8, 2rem) var(--wc-space-12, 3rem);
        margin-bottom: var(--wc-space-12, 3rem);
        background: linear-gradient(
          135deg,
          var(--wc-color-primary-50, #e6f3f3) 0%,
          var(--wc-color-neutral-0, #ffffff) 50%,
          var(--wc-color-primary-50, #e6f3f3) 100%
        );
        border-radius: var(--wc-border-radius-xl, 0.75rem);
        border: var(--wc-border-width-thin, 1px) solid var(--wc-color-primary-100, #b3dada);
      "
      >
        <div style="margin-bottom: var(--wc-space-6, 1.5rem);">${iconShield}</div>
        <h1
          style="
          font-size: 2.5rem;
          font-weight: var(--wc-font-weight-bold, 700);
          color: var(--wc-color-primary-700, #005252);
          margin: 0 0 var(--wc-space-4, 1rem) 0;
          letter-spacing: -0.025em;
          line-height: var(--wc-line-height-tight, 1.25);
        "
        >
          WC-2026
        </h1>
        <p
          style="
          font-size: var(--wc-font-size-xl, 1.25rem);
          color: var(--wc-color-neutral-600, #495057);
          margin: 0 0 var(--wc-space-6, 1.5rem) 0;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
          font-weight: var(--wc-font-weight-normal, 400);
          line-height: var(--wc-line-height-relaxed, 1.75);
        "
        >
          Enterprise Healthcare Web Component Library
        </p>
        <div
          style="
          display: inline-flex;
          gap: var(--wc-space-3, 0.75rem);
          flex-wrap: wrap;
          justify-content: center;
        "
        >
          <span
            style="
            display: inline-block;
            padding: var(--wc-space-1, 0.25rem) var(--wc-space-4, 1rem);
            background: var(--wc-color-primary-500, #007878);
            color: var(--wc-color-neutral-0, #ffffff);
            border-radius: var(--wc-border-radius-full, 9999px);
            font-size: var(--wc-font-size-sm, 0.875rem);
            font-weight: var(--wc-font-weight-medium, 500);
          "
            >Lit 3.x</span
          >
          <span
            style="
            display: inline-block;
            padding: var(--wc-space-1, 0.25rem) var(--wc-space-4, 1rem);
            background: var(--wc-color-neutral-0, #ffffff);
            color: var(--wc-color-primary-600, #006868);
            border-radius: var(--wc-border-radius-full, 9999px);
            font-size: var(--wc-font-size-sm, 0.875rem);
            font-weight: var(--wc-font-weight-medium, 500);
            border: var(--wc-border-width-thin, 1px) solid var(--wc-color-primary-300, #4da9a9);
          "
            >WCAG 2.1 AA</span
          >
          <span
            style="
            display: inline-block;
            padding: var(--wc-space-1, 0.25rem) var(--wc-space-4, 1rem);
            background: var(--wc-color-neutral-0, #ffffff);
            color: var(--wc-color-primary-600, #006868);
            border-radius: var(--wc-border-radius-full, 9999px);
            font-size: var(--wc-font-size-sm, 0.875rem);
            font-weight: var(--wc-font-weight-medium, 500);
            border: var(--wc-border-width-thin, 1px) solid var(--wc-color-primary-300, #4da9a9);
          "
            >Shadow DOM</span
          >
        </div>
      </div>

      <!-- ═══ What is this? ══════════════════════════════════════ -->
      <section style="margin-bottom: var(--wc-space-12, 3rem);">
        <h2
          style="
          font-size: var(--wc-font-size-xl, 1.25rem);
          font-weight: var(--wc-font-weight-semibold, 600);
          color: var(--wc-color-neutral-800, #212529);
          margin: 0 0 var(--wc-space-4, 1rem) 0;
          padding-bottom: var(--wc-space-3, 0.75rem);
          border-bottom: var(--wc-border-width-thin, 1px) solid var(--wc-color-neutral-200, #dee2e6);
        "
        >
          What is WC-2026?
        </h2>
        <p
          style="
          font-size: var(--wc-font-size-md, 1rem);
          color: var(--wc-color-neutral-600, #495057);
          margin: 0 0 var(--wc-space-4, 1rem) 0;
          max-width: 720px;
          line-height: var(--wc-line-height-relaxed, 1.75);
        "
        >
          WC-2026 is a design system and component library purpose-built for healthcare
          organizations. Built on Lit 3.x and native Web Components, every element ships with Shadow
          DOM encapsulation, full WCAG 2.1 AA accessibility compliance, and a three-tier design
          token architecture that enables deep theming without breaking encapsulation.
        </p>
        <p
          style="
          font-size: var(--wc-font-size-md, 1rem);
          color: var(--wc-color-neutral-600, #495057);
          margin: 0;
          max-width: 720px;
          line-height: var(--wc-line-height-relaxed, 1.75);
        "
        >
          Components are framework-agnostic and optimized for consumption in Drupal CMS environments
          via Twig templates and Drupal behaviors, while remaining fully compatible with React, Vue,
          Angular, or vanilla HTML.
        </p>
      </section>

      <!-- ═══ Quick Links ════════════════════════════════════════ -->
      <section style="margin-bottom: var(--wc-space-12, 3rem);">
        <h2
          style="
          font-size: var(--wc-font-size-xl, 1.25rem);
          font-weight: var(--wc-font-weight-semibold, 600);
          color: var(--wc-color-neutral-800, #212529);
          margin: 0 0 var(--wc-space-6, 1.5rem) 0;
          padding-bottom: var(--wc-space-3, 0.75rem);
          border-bottom: var(--wc-border-width-thin, 1px) solid var(--wc-color-neutral-200, #dee2e6);
        "
        >
          Quick Links
        </h2>

        <div
          style="
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: var(--wc-space-6, 1.5rem);
        "
        >
          <!-- Design Tokens card -->
          <div
            style="
            padding: var(--wc-space-8, 2rem);
            background: var(--wc-color-neutral-0, #ffffff);
            border-radius: var(--wc-border-radius-lg, 0.5rem);
            border: var(--wc-border-width-thin, 1px) solid var(--wc-color-neutral-200, #dee2e6);
            box-shadow: var(--wc-shadow-sm, 0 1px 2px 0 rgb(0 0 0 / 0.05));
            transition: box-shadow var(--wc-transition-normal, 250ms ease), border-color var(--wc-transition-normal, 250ms ease);
          "
          >
            <div style="margin-bottom: var(--wc-space-4, 1rem);">${iconPalette}</div>
            <h3
              style="
              font-size: var(--wc-font-size-lg, 1.125rem);
              font-weight: var(--wc-font-weight-semibold, 600);
              color: var(--wc-color-neutral-800, #212529);
              margin: 0 0 var(--wc-space-3, 0.75rem) 0;
            "
            >
              Design Tokens
            </h3>
            <p
              style="
              font-size: var(--wc-font-size-sm, 0.875rem);
              color: var(--wc-color-neutral-500, #6c757d);
              margin: 0 0 var(--wc-space-4, 1rem) 0;
              line-height: var(--wc-line-height-relaxed, 1.75);
            "
            >
              Color palettes, spacing scale, typography, borders, shadows, and transitions. The
              foundation of every component.
            </p>
            <!-- Mini color swatches -->
            <div style="display: flex; gap: var(--wc-space-1, 0.25rem);">
              <div
                style="width: 24px; height: 24px; border-radius: var(--wc-border-radius-sm, 0.25rem); background: var(--wc-color-primary-100, #b3dada);"
              ></div>
              <div
                style="width: 24px; height: 24px; border-radius: var(--wc-border-radius-sm, 0.25rem); background: var(--wc-color-primary-300, #4da9a9);"
              ></div>
              <div
                style="width: 24px; height: 24px; border-radius: var(--wc-border-radius-sm, 0.25rem); background: var(--wc-color-primary-500, #007878);"
              ></div>
              <div
                style="width: 24px; height: 24px; border-radius: var(--wc-border-radius-sm, 0.25rem); background: var(--wc-color-primary-700, #005252);"
              ></div>
              <div
                style="width: 24px; height: 24px; border-radius: var(--wc-border-radius-sm, 0.25rem); background: var(--wc-color-primary-900, #002626);"
              ></div>
              <div
                style="width: 1px; margin: 0 var(--wc-space-1, 0.25rem); background: var(--wc-color-neutral-200, #dee2e6);"
              ></div>
              <div
                style="width: 24px; height: 24px; border-radius: var(--wc-border-radius-sm, 0.25rem); background: var(--wc-color-error-500, #dc3545);"
              ></div>
              <div
                style="width: 24px; height: 24px; border-radius: var(--wc-border-radius-sm, 0.25rem); background: var(--wc-color-success-500, #198754);"
              ></div>
              <div
                style="width: 24px; height: 24px; border-radius: var(--wc-border-radius-sm, 0.25rem); background: var(--wc-color-warning-500, #ffc107);"
              ></div>
            </div>
          </div>

          <!-- Components card -->
          <div
            style="
            padding: var(--wc-space-8, 2rem);
            background: var(--wc-color-neutral-0, #ffffff);
            border-radius: var(--wc-border-radius-lg, 0.5rem);
            border: var(--wc-border-width-thin, 1px) solid var(--wc-color-neutral-200, #dee2e6);
            box-shadow: var(--wc-shadow-sm, 0 1px 2px 0 rgb(0 0 0 / 0.05));
            transition: box-shadow var(--wc-transition-normal, 250ms ease), border-color var(--wc-transition-normal, 250ms ease);
          "
          >
            <div style="margin-bottom: var(--wc-space-4, 1rem);">${iconComponents}</div>
            <h3
              style="
              font-size: var(--wc-font-size-lg, 1.125rem);
              font-weight: var(--wc-font-weight-semibold, 600);
              color: var(--wc-color-neutral-800, #212529);
              margin: 0 0 var(--wc-space-3, 0.75rem) 0;
            "
            >
              Components
            </h3>
            <p
              style="
              font-size: var(--wc-font-size-sm, 0.875rem);
              color: var(--wc-color-neutral-500, #6c757d);
              margin: 0 0 var(--wc-space-4, 1rem) 0;
              line-height: var(--wc-line-height-relaxed, 1.75);
            "
            >
              Production-ready UI primitives with full accessibility, keyboard navigation, and form
              participation via ElementInternals.
            </p>
            <!-- Component list -->
            <div style="display: flex; flex-direction: column; gap: var(--wc-space-2, 0.5rem);">
              <div
                style="
                display: flex;
                align-items: center;
                gap: var(--wc-space-2, 0.5rem);
                padding: var(--wc-space-2, 0.5rem) var(--wc-space-3, 0.75rem);
                background: var(--wc-color-neutral-50, #f8f9fa);
                border-radius: var(--wc-border-radius-md, 0.375rem);
                font-family: var(--wc-font-family-mono, monospace);
                font-size: var(--wc-font-size-xs, 0.75rem);
                color: var(--wc-color-neutral-700, #343a40);
              "
              >
                ${iconCheck} wc-button
              </div>
              <div
                style="
                display: flex;
                align-items: center;
                gap: var(--wc-space-2, 0.5rem);
                padding: var(--wc-space-2, 0.5rem) var(--wc-space-3, 0.75rem);
                background: var(--wc-color-neutral-50, #f8f9fa);
                border-radius: var(--wc-border-radius-md, 0.375rem);
                font-family: var(--wc-font-family-mono, monospace);
                font-size: var(--wc-font-size-xs, 0.75rem);
                color: var(--wc-color-neutral-700, #343a40);
              "
              >
                ${iconCheck} wc-card
              </div>
              <div
                style="
                display: flex;
                align-items: center;
                gap: var(--wc-space-2, 0.5rem);
                padding: var(--wc-space-2, 0.5rem) var(--wc-space-3, 0.75rem);
                background: var(--wc-color-neutral-50, #f8f9fa);
                border-radius: var(--wc-border-radius-md, 0.375rem);
                font-family: var(--wc-font-family-mono, monospace);
                font-size: var(--wc-font-size-xs, 0.75rem);
                color: var(--wc-color-neutral-700, #343a40);
              "
              >
                ${iconCheck} wc-text-input
              </div>
            </div>
          </div>

          <!-- Getting Started card -->
          <div
            style="
            padding: var(--wc-space-8, 2rem);
            background: var(--wc-color-neutral-0, #ffffff);
            border-radius: var(--wc-border-radius-lg, 0.5rem);
            border: var(--wc-border-width-thin, 1px) solid var(--wc-color-neutral-200, #dee2e6);
            box-shadow: var(--wc-shadow-sm, 0 1px 2px 0 rgb(0 0 0 / 0.05));
            transition: box-shadow var(--wc-transition-normal, 250ms ease), border-color var(--wc-transition-normal, 250ms ease);
          "
          >
            <div style="margin-bottom: var(--wc-space-4, 1rem);">${iconRocket}</div>
            <h3
              style="
              font-size: var(--wc-font-size-lg, 1.125rem);
              font-weight: var(--wc-font-weight-semibold, 600);
              color: var(--wc-color-neutral-800, #212529);
              margin: 0 0 var(--wc-space-3, 0.75rem) 0;
            "
            >
              Getting Started
            </h3>
            <p
              style="
              font-size: var(--wc-font-size-sm, 0.875rem);
              color: var(--wc-color-neutral-500, #6c757d);
              margin: 0 0 var(--wc-space-4, 1rem) 0;
              line-height: var(--wc-line-height-relaxed, 1.75);
            "
            >
              Install the package, import a component, and drop it into your HTML. Works with any
              framework or CMS.
            </p>
            <!-- Install snippet -->
            <div
              style="
              padding: var(--wc-space-3, 0.75rem) var(--wc-space-4, 1rem);
              background: var(--wc-color-neutral-800, #212529);
              border-radius: var(--wc-border-radius-md, 0.375rem);
              font-family: var(--wc-font-family-mono, monospace);
              font-size: var(--wc-font-size-xs, 0.75rem);
              color: var(--wc-color-neutral-100, #e9ecef);
              line-height: var(--wc-line-height-relaxed, 1.75);
              overflow-x: auto;
            "
            >
              <div>
                <span style="color: var(--wc-color-neutral-400, #adb5bd);">$</span> npm install
                @helix/library
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══ Tech Stack ═════════════════════════════════════════ -->
      <section style="margin-bottom: var(--wc-space-12, 3rem);">
        <h2
          style="
          font-size: var(--wc-font-size-xl, 1.25rem);
          font-weight: var(--wc-font-weight-semibold, 600);
          color: var(--wc-color-neutral-800, #212529);
          margin: 0 0 var(--wc-space-6, 1.5rem) 0;
          padding-bottom: var(--wc-space-3, 0.75rem);
          border-bottom: var(--wc-border-width-thin, 1px) solid var(--wc-color-neutral-200, #dee2e6);
        "
        >
          Tech Stack
        </h2>

        <div
          style="
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
          gap: var(--wc-space-4, 1rem);
        "
        >
          ${[
            { icon: iconLit, name: 'Lit 3.x', desc: 'Component framework' },
            { icon: iconTypeScript, name: 'TypeScript', desc: 'Strict mode, zero any' },
            { icon: iconShadowDOM, name: 'Shadow DOM', desc: 'Style encapsulation' },
            { icon: iconCSS, name: 'CSS Custom Properties', desc: 'Three-tier tokens' },
            { icon: iconStorybook, name: 'Storybook 10', desc: 'Component playground' },
          ].map(
            (item) => html`
              <div
                style="
                display: flex;
                align-items: flex-start;
                gap: var(--wc-space-3, 0.75rem);
                padding: var(--wc-space-5, 1.25rem);
                background: var(--wc-color-neutral-50, #f8f9fa);
                border-radius: var(--wc-border-radius-lg, 0.5rem);
                border: var(--wc-border-width-thin, 1px) solid var(--wc-color-neutral-100, #e9ecef);
              "
              >
                <div
                  style="
                  flex-shrink: 0;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  width: 40px;
                  height: 40px;
                  border-radius: var(--wc-border-radius-md, 0.375rem);
                  background: var(--wc-color-neutral-0, #ffffff);
                  border: var(--wc-border-width-thin, 1px) solid var(--wc-color-neutral-200, #dee2e6);
                  color: var(--wc-color-primary-600, #006868);
                "
                >
                  ${item.icon}
                </div>
                <div>
                  <div
                    style="
                    font-size: var(--wc-font-size-sm, 0.875rem);
                    font-weight: var(--wc-font-weight-semibold, 600);
                    color: var(--wc-color-neutral-800, #212529);
                    margin-bottom: var(--wc-space-1, 0.25rem);
                  "
                  >
                    ${item.name}
                  </div>
                  <div
                    style="
                    font-size: var(--wc-font-size-xs, 0.75rem);
                    color: var(--wc-color-neutral-500, #6c757d);
                  "
                  >
                    ${item.desc}
                  </div>
                </div>
              </div>
            `,
          )}
        </div>
      </section>

      <!-- ═══ Status Dashboard ═══════════════════════════════════ -->
      <section style="margin-bottom: var(--wc-space-12, 3rem);">
        <h2
          style="
          font-size: var(--wc-font-size-xl, 1.25rem);
          font-weight: var(--wc-font-weight-semibold, 600);
          color: var(--wc-color-neutral-800, #212529);
          margin: 0 0 var(--wc-space-6, 1.5rem) 0;
          padding-bottom: var(--wc-space-3, 0.75rem);
          border-bottom: var(--wc-border-width-thin, 1px) solid var(--wc-color-neutral-200, #dee2e6);
        "
        >
          Status
        </h2>

        <div
          style="
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--wc-space-6, 1.5rem);
        "
        >
          <!-- Components stat -->
          <div
            style="
            text-align: center;
            padding: var(--wc-space-8, 2rem) var(--wc-space-6, 1.5rem);
            background: var(--wc-color-neutral-0, #ffffff);
            border-radius: var(--wc-border-radius-lg, 0.5rem);
            border: var(--wc-border-width-thin, 1px) solid var(--wc-color-neutral-200, #dee2e6);
            box-shadow: var(--wc-shadow-sm, 0 1px 2px 0 rgb(0 0 0 / 0.05));
          "
          >
            <div
              style="
              font-size: 2.5rem;
              font-weight: var(--wc-font-weight-bold, 700);
              color: var(--wc-color-primary-500, #007878);
              line-height: 1;
              margin-bottom: var(--wc-space-2, 0.5rem);
            "
            >
              3
            </div>
            <div
              style="
              font-size: var(--wc-font-size-sm, 0.875rem);
              font-weight: var(--wc-font-weight-medium, 500);
              color: var(--wc-color-neutral-700, #343a40);
              margin-bottom: var(--wc-space-1, 0.25rem);
            "
            >
              Components
            </div>
            <div
              style="
              font-size: var(--wc-font-size-xs, 0.75rem);
              color: var(--wc-color-neutral-400, #adb5bd);
            "
            >
              Button, Card, Text Input
            </div>
          </div>

          <!-- Tests stat -->
          <div
            style="
            text-align: center;
            padding: var(--wc-space-8, 2rem) var(--wc-space-6, 1.5rem);
            background: var(--wc-color-neutral-0, #ffffff);
            border-radius: var(--wc-border-radius-lg, 0.5rem);
            border: var(--wc-border-width-thin, 1px) solid var(--wc-color-neutral-200, #dee2e6);
            box-shadow: var(--wc-shadow-sm, 0 1px 2px 0 rgb(0 0 0 / 0.05));
          "
          >
            <div
              style="
              font-size: 2.5rem;
              font-weight: var(--wc-font-weight-bold, 700);
              color: var(--wc-color-success-500, #198754);
              line-height: 1;
              margin-bottom: var(--wc-space-2, 0.5rem);
            "
            >
              546
            </div>
            <div
              style="
              font-size: var(--wc-font-size-sm, 0.875rem);
              font-weight: var(--wc-font-weight-medium, 500);
              color: var(--wc-color-neutral-700, #343a40);
              margin-bottom: var(--wc-space-1, 0.25rem);
            "
            >
              Total Tests
            </div>
            <div
              style="
              font-size: var(--wc-font-size-xs, 0.75rem);
              color: var(--wc-color-neutral-400, #adb5bd);
            "
            >
              Vitest browser mode
            </div>
          </div>

          <!-- Tokens stat -->
          <div
            style="
            text-align: center;
            padding: var(--wc-space-8, 2rem) var(--wc-space-6, 1.5rem);
            background: var(--wc-color-neutral-0, #ffffff);
            border-radius: var(--wc-border-radius-lg, 0.5rem);
            border: var(--wc-border-width-thin, 1px) solid var(--wc-color-neutral-200, #dee2e6);
            box-shadow: var(--wc-shadow-sm, 0 1px 2px 0 rgb(0 0 0 / 0.05));
          "
          >
            <div
              style="
              font-size: 2.5rem;
              font-weight: var(--wc-font-weight-bold, 700);
              color: var(--wc-color-primary-500, #007878);
              line-height: 1;
              margin-bottom: var(--wc-space-2, 0.5rem);
            "
            >
              50+
            </div>
            <div
              style="
              font-size: var(--wc-font-size-sm, 0.875rem);
              font-weight: var(--wc-font-weight-medium, 500);
              color: var(--wc-color-neutral-700, #343a40);
              margin-bottom: var(--wc-space-1, 0.25rem);
            "
            >
              Design Tokens
            </div>
            <div
              style="
              font-size: var(--wc-font-size-xs, 0.75rem);
              color: var(--wc-color-neutral-400, #adb5bd);
            "
            >
              Colors, spacing, typography
            </div>
          </div>
        </div>
      </section>

      <!-- ═══ Token Architecture ═════════════════════════════════ -->
      <section style="margin-bottom: var(--wc-space-12, 3rem);">
        <h2
          style="
          font-size: var(--wc-font-size-xl, 1.25rem);
          font-weight: var(--wc-font-weight-semibold, 600);
          color: var(--wc-color-neutral-800, #212529);
          margin: 0 0 var(--wc-space-6, 1.5rem) 0;
          padding-bottom: var(--wc-space-3, 0.75rem);
          border-bottom: var(--wc-border-width-thin, 1px) solid var(--wc-color-neutral-200, #dee2e6);
        "
        >
          Token Architecture
        </h2>
        <p
          style="
          font-size: var(--wc-font-size-sm, 0.875rem);
          color: var(--wc-color-neutral-500, #6c757d);
          margin: 0 0 var(--wc-space-6, 1.5rem) 0;
          max-width: 720px;
          line-height: var(--wc-line-height-relaxed, 1.75);
        "
        >
          Design tokens cascade through three tiers from raw values to component-specific
          properties. Consumers override at the semantic level; components consume at the component
          level with semantic fallbacks.
        </p>

        <!-- Three-tier diagram -->
        <div
          style="
          display: flex;
          flex-direction: column;
          gap: var(--wc-space-3, 0.75rem);
          max-width: 640px;
        "
        >
          <!-- Tier 1: Primitive -->
          <div
            style="
            display: flex;
            align-items: center;
            gap: var(--wc-space-4, 1rem);
            padding: var(--wc-space-4, 1rem) var(--wc-space-5, 1.25rem);
            background: var(--wc-color-primary-50, #e6f3f3);
            border-radius: var(--wc-border-radius-lg, 0.5rem);
            border: var(--wc-border-width-thin, 1px) solid var(--wc-color-primary-200, #80c2c2);
          "
          >
            <div
              style="
              flex-shrink: 0;
              width: 32px;
              height: 32px;
              border-radius: var(--wc-border-radius-full, 9999px);
              background: var(--wc-color-primary-500, #007878);
              color: var(--wc-color-neutral-0, #ffffff);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: var(--wc-font-size-sm, 0.875rem);
              font-weight: var(--wc-font-weight-bold, 700);
            "
            >
              1
            </div>
            <div>
              <div
                style="
                font-size: var(--wc-font-size-sm, 0.875rem);
                font-weight: var(--wc-font-weight-semibold, 600);
                color: var(--wc-color-primary-800, #003c3c);
              "
              >
                Primitive
              </div>
              <div
                style="
                font-family: var(--wc-font-family-mono, monospace);
                font-size: var(--wc-font-size-xs, 0.75rem);
                color: var(--wc-color-primary-600, #006868);
                margin-top: var(--wc-space-1, 0.25rem);
              "
              >
                #007878, 0.5rem, 600
              </div>
            </div>
          </div>

          <!-- Arrow -->
          <div
            style="
            text-align: center;
            color: var(--wc-color-neutral-300, #ced4da);
            font-size: var(--wc-font-size-xl, 1.25rem);
            line-height: 1;
            margin: calc(var(--wc-space-1, 0.25rem) * -1) 0;
            padding-left: var(--wc-space-5, 1.25rem);
          "
          >
            &#8595;
          </div>

          <!-- Tier 2: Semantic -->
          <div
            style="
            display: flex;
            align-items: center;
            gap: var(--wc-space-4, 1rem);
            padding: var(--wc-space-4, 1rem) var(--wc-space-5, 1.25rem);
            background: var(--wc-color-neutral-50, #f8f9fa);
            border-radius: var(--wc-border-radius-lg, 0.5rem);
            border: var(--wc-border-width-thin, 1px) solid var(--wc-color-neutral-200, #dee2e6);
          "
          >
            <div
              style="
              flex-shrink: 0;
              width: 32px;
              height: 32px;
              border-radius: var(--wc-border-radius-full, 9999px);
              background: var(--wc-color-neutral-600, #495057);
              color: var(--wc-color-neutral-0, #ffffff);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: var(--wc-font-size-sm, 0.875rem);
              font-weight: var(--wc-font-weight-bold, 700);
            "
            >
              2
            </div>
            <div>
              <div
                style="
                font-size: var(--wc-font-size-sm, 0.875rem);
                font-weight: var(--wc-font-weight-semibold, 600);
                color: var(--wc-color-neutral-800, #212529);
              "
              >
                Semantic
              </div>
              <div
                style="
                font-family: var(--wc-font-family-mono, monospace);
                font-size: var(--wc-font-size-xs, 0.75rem);
                color: var(--wc-color-neutral-500, #6c757d);
                margin-top: var(--wc-space-1, 0.25rem);
              "
              >
                --wc-color-primary, --wc-space-md
              </div>
            </div>
          </div>

          <!-- Arrow -->
          <div
            style="
            text-align: center;
            color: var(--wc-color-neutral-300, #ced4da);
            font-size: var(--wc-font-size-xl, 1.25rem);
            line-height: 1;
            margin: calc(var(--wc-space-1, 0.25rem) * -1) 0;
            padding-left: var(--wc-space-5, 1.25rem);
          "
          >
            &#8595;
          </div>

          <!-- Tier 3: Component -->
          <div
            style="
            display: flex;
            align-items: center;
            gap: var(--wc-space-4, 1rem);
            padding: var(--wc-space-4, 1rem) var(--wc-space-5, 1.25rem);
            background: var(--wc-color-neutral-0, #ffffff);
            border-radius: var(--wc-border-radius-lg, 0.5rem);
            border: var(--wc-border-width-medium, 2px) solid var(--wc-color-primary-300, #4da9a9);
          "
          >
            <div
              style="
              flex-shrink: 0;
              width: 32px;
              height: 32px;
              border-radius: var(--wc-border-radius-full, 9999px);
              background: var(--wc-color-primary-400, #269191);
              color: var(--wc-color-neutral-0, #ffffff);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: var(--wc-font-size-sm, 0.875rem);
              font-weight: var(--wc-font-weight-bold, 700);
            "
            >
              3
            </div>
            <div>
              <div
                style="
                font-size: var(--wc-font-size-sm, 0.875rem);
                font-weight: var(--wc-font-weight-semibold, 600);
                color: var(--wc-color-neutral-800, #212529);
              "
              >
                Component
              </div>
              <div
                style="
                font-family: var(--wc-font-family-mono, monospace);
                font-size: var(--wc-font-size-xs, 0.75rem);
                color: var(--wc-color-neutral-500, #6c757d);
                margin-top: var(--wc-space-1, 0.25rem);
              "
              >
                --wc-button-bg, --wc-card-padding
              </div>
            </div>
          </div>
        </div>

        <!-- Usage example -->
        <div
          style="
          margin-top: var(--wc-space-6, 1.5rem);
          padding: var(--wc-space-5, 1.25rem);
          background: var(--wc-color-neutral-800, #212529);
          border-radius: var(--wc-border-radius-lg, 0.5rem);
          max-width: 640px;
          overflow-x: auto;
        "
        >
          <div
            style="
            font-family: var(--wc-font-family-mono, monospace);
            font-size: var(--wc-font-size-xs, 0.75rem);
            line-height: var(--wc-line-height-relaxed, 1.75);
            color: var(--wc-color-neutral-300, #ced4da);
          "
          >
            <div>
              <span style="color: var(--wc-color-neutral-500, #6c757d);"
                >/* Component-level token with semantic fallback */</span
              >
            </div>
            <div><span style="color: var(--wc-color-primary-300, #4da9a9);">:host</span> {</div>
            <div>
              &nbsp;&nbsp;<span style="color: var(--wc-color-neutral-400, #adb5bd);">--_bg</span>:
              <span style="color: var(--wc-color-warning-500, #ffc107);">var</span>(<span
                style="color: var(--wc-color-neutral-200, #dee2e6);"
                >--wc-button-bg</span
              >, <span style="color: var(--wc-color-warning-500, #ffc107);">var</span>(<span
                style="color: var(--wc-color-neutral-200, #dee2e6);"
                >--wc-color-primary</span
              >));
            </div>
            <div>}</div>
          </div>
        </div>
      </section>

      <!-- ═══ Footer ═════════════════════════════════════════════ -->
      <footer
        style="
        padding-top: var(--wc-space-8, 2rem);
        border-top: var(--wc-border-width-thin, 1px) solid var(--wc-color-neutral-200, #dee2e6);
        text-align: center;
      "
      >
        <p
          style="
          font-size: var(--wc-font-size-sm, 0.875rem);
          color: var(--wc-color-neutral-400, #adb5bd);
          margin: 0 0 var(--wc-space-2, 0.5rem) 0;
        "
        >
          Built with Lit, TypeScript, and care for healthcare organizations.
        </p>
        <p
          style="
          font-size: var(--wc-font-size-xs, 0.75rem);
          color: var(--wc-color-neutral-300, #ced4da);
          margin: 0;
        "
        >
          WC-2026 Design System &middot; Storybook 10 &middot; Enterprise Healthcare Web Components
        </p>
      </footer>
    </div>
  `,
};

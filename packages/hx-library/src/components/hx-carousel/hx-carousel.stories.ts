import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, userEvent } from 'storybook/test';
import './hx-carousel.js';
import './hx-carousel-item.js';

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Carousel',
  component: 'hx-carousel',
  tags: ['autodocs'],
  argTypes: {
    loop: {
      control: 'boolean',
      description: 'Whether the carousel wraps around.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    autoplay: {
      control: 'boolean',
      description: 'Whether the carousel auto-advances slides.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    autoplayInterval: {
      control: { type: 'number', min: 500, max: 10000, step: 500 },
      name: 'autoplay-interval',
      description: 'Milliseconds between auto-advance transitions.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: '3000' },
        type: { summary: 'number' },
      },
    },
    slidesPerPage: {
      control: { type: 'number', min: 1, max: 5, step: 1 },
      name: 'slides-per-page',
      description: 'Number of slides visible at once.',
      table: {
        category: 'Layout',
        defaultValue: { summary: '1' },
        type: { summary: 'number' },
      },
    },
    slidesPerMove: {
      control: { type: 'number', min: 1, max: 5, step: 1 },
      name: 'slides-per-move',
      description: 'Number of slides to advance per navigation action.',
      table: {
        category: 'Layout',
        defaultValue: { summary: '1' },
        type: { summary: 'number' },
      },
    },
    orientation: {
      control: { type: 'select' },
      options: ['horizontal', 'vertical'],
      description: 'Scroll axis of the carousel.',
      table: {
        category: 'Layout',
        defaultValue: { summary: 'horizontal' },
        type: { summary: "'horizontal' | 'vertical'" },
      },
    },
    mouseDragging: {
      control: 'boolean',
      name: 'mouse-dragging',
      description: 'Whether click-drag scrolling is enabled.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    label: {
      control: 'text',
      description: 'Accessible label for the carousel region.',
      table: {
        category: 'Accessibility',
        defaultValue: { summary: 'Carousel' },
        type: { summary: 'string' },
      },
    },
  },
  args: {
    loop: false,
    autoplay: false,
    autoplayInterval: 3000,
    slidesPerPage: 1,
    slidesPerMove: 1,
    orientation: 'horizontal',
    mouseDragging: false,
    label: 'Carousel',
  },
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// Helper: slide colors for demos
// ─────────────────────────────────────────────────

const slideColors = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626'];
const slideLabels = ['Slide A', 'Slide B', 'Slide C', 'Slide D', 'Slide E'];

function demoSlide(i: number) {
  return html`
    <hx-carousel-item>
      <div
        style="
          background: ${slideColors[i % slideColors.length]};
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 200px;
          border-radius: 0.5rem;
          font-size: 1.5rem;
          font-weight: 600;
          font-family: sans-serif;
        "
      >
        ${slideLabels[i % slideLabels.length]}
      </div>
    </hx-carousel-item>
  `;
}

// ─────────────────────────────────────────────────
// 1. DEFAULT — 3 slides, horizontal (args-driven)
// ─────────────────────────────────────────────────

export const Default: Story = {
  render: (args) => html`
    <div style="max-width: 600px; margin: 2rem auto; font-family: sans-serif;">
      <hx-carousel
        ?loop=${args.loop}
        ?autoplay=${args.autoplay}
        autoplay-interval=${args.autoplayInterval}
        slides-per-page=${args.slidesPerPage}
        slides-per-move=${args.slidesPerMove}
        orientation=${args.orientation}
        ?mouse-dragging=${args.mouseDragging}
        label=${args.label}
      >
        ${demoSlide(0)} ${demoSlide(1)} ${demoSlide(2)}
      </hx-carousel>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-carousel');
    await expect(el).toBeTruthy();
    await expect(el?.shadowRoot?.querySelector('[part="base"]')).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 2. LOOPING
// ─────────────────────────────────────────────────

export const Looping: Story = {
  args: { loop: true },
  render: (args) => html`
    <div style="max-width: 600px; margin: 2rem auto; font-family: sans-serif;">
      <hx-carousel
        ?loop=${args.loop}
        ?autoplay=${args.autoplay}
        autoplay-interval=${args.autoplayInterval}
        slides-per-page=${args.slidesPerPage}
        slides-per-move=${args.slidesPerMove}
        orientation=${args.orientation}
        ?mouse-dragging=${args.mouseDragging}
        label=${args.label}
      >
        ${demoSlide(0)} ${demoSlide(1)} ${demoSlide(2)} ${demoSlide(3)}
      </hx-carousel>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 3. AUTOPLAY
// ─────────────────────────────────────────────────

export const Autoplay: Story = {
  args: { autoplay: true, autoplayInterval: 2000, loop: true },
  render: (args) => html`
    <div style="max-width: 600px; margin: 2rem auto; font-family: sans-serif;">
      <hx-carousel
        ?loop=${args.loop}
        ?autoplay=${args.autoplay}
        autoplay-interval=${args.autoplayInterval}
        slides-per-page=${args.slidesPerPage}
        slides-per-move=${args.slidesPerMove}
        orientation=${args.orientation}
        ?mouse-dragging=${args.mouseDragging}
        label=${args.label}
      >
        ${demoSlide(0)} ${demoSlide(1)} ${demoSlide(2)} ${demoSlide(3)}
      </hx-carousel>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 4. MULTI-SLIDE — 2 visible at once
// ─────────────────────────────────────────────────

export const MultiSlide: Story = {
  args: { slidesPerPage: 2, slidesPerMove: 1 },
  render: (args) => html`
    <div style="max-width: 700px; margin: 2rem auto; font-family: sans-serif;">
      <hx-carousel
        ?loop=${args.loop}
        ?autoplay=${args.autoplay}
        autoplay-interval=${args.autoplayInterval}
        slides-per-page=${args.slidesPerPage}
        slides-per-move=${args.slidesPerMove}
        orientation=${args.orientation}
        ?mouse-dragging=${args.mouseDragging}
        label=${args.label}
      >
        ${demoSlide(0)} ${demoSlide(1)} ${demoSlide(2)} ${demoSlide(3)} ${demoSlide(4)}
      </hx-carousel>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 5. IMAGE CAROUSEL (inline SVG placeholders)
// ─────────────────────────────────────────────────

export const ImageCarousel: Story = {
  args: { loop: true, label: 'Image gallery' },
  render: (args) => html`
    <div style="max-width: 600px; margin: 2rem auto; font-family: sans-serif;">
      <hx-carousel
        ?loop=${args.loop}
        ?autoplay=${args.autoplay}
        autoplay-interval=${args.autoplayInterval}
        slides-per-page=${args.slidesPerPage}
        slides-per-move=${args.slidesPerMove}
        orientation=${args.orientation}
        ?mouse-dragging=${args.mouseDragging}
        label=${args.label}
      >
        <hx-carousel-item>
          <div
            style="width: 100%; height: 300px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.25rem; font-family: sans-serif;"
            role="img"
            aria-label="Nature landscape"
          >
            Nature Landscape
          </div>
        </hx-carousel-item>
        <hx-carousel-item>
          <div
            style="width: 100%; height: 300px; background: linear-gradient(135deg, #f093fb, #f5576c); border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.25rem; font-family: sans-serif;"
            role="img"
            aria-label="City skyline"
          >
            City Skyline
          </div>
        </hx-carousel-item>
        <hx-carousel-item>
          <div
            style="width: 100%; height: 300px; background: linear-gradient(135deg, #4facfe, #00f2fe); border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.25rem; font-family: sans-serif;"
            role="img"
            aria-label="Mountain view"
          >
            Mountain View
          </div>
        </hx-carousel-item>
      </hx-carousel>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 6. VERTICAL ORIENTATION
// ─────────────────────────────────────────────────

export const Vertical: Story = {
  args: { orientation: 'vertical' },
  render: (args) => html`
    <div style="max-width: 400px; margin: 2rem auto; font-family: sans-serif;">
      <hx-carousel
        ?loop=${args.loop}
        ?autoplay=${args.autoplay}
        autoplay-interval=${args.autoplayInterval}
        slides-per-page=${args.slidesPerPage}
        slides-per-move=${args.slidesPerMove}
        orientation=${args.orientation}
        ?mouse-dragging=${args.mouseDragging}
        label=${args.label}
      >
        ${demoSlide(0)} ${demoSlide(1)} ${demoSlide(2)}
      </hx-carousel>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 7. MOUSE DRAGGING
// ─────────────────────────────────────────────────

export const MouseDragging: Story = {
  args: { mouseDragging: true, loop: true },
  render: (args) => html`
    <div style="max-width: 600px; margin: 2rem auto; font-family: sans-serif;">
      <p style="font-size: 0.875rem; color: #6b7280; margin-bottom: 1rem;">
        Click and drag (or swipe on touch devices) to navigate slides.
      </p>
      <hx-carousel
        ?loop=${args.loop}
        ?autoplay=${args.autoplay}
        autoplay-interval=${args.autoplayInterval}
        slides-per-page=${args.slidesPerPage}
        slides-per-move=${args.slidesPerMove}
        orientation=${args.orientation}
        ?mouse-dragging=${args.mouseDragging}
        label=${args.label}
      >
        ${demoSlide(0)} ${demoSlide(1)} ${demoSlide(2)} ${demoSlide(3)}
      </hx-carousel>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 8. HEALTHCARE — Patient Education Slides
// ─────────────────────────────────────────────────

export const PatientEducation: Story = {
  args: { loop: true, label: 'Patient education tips' },
  render: (args) => html`
    <div style="max-width: 600px; margin: 2rem auto; font-family: sans-serif;">
      <hx-carousel
        ?loop=${args.loop}
        ?autoplay=${args.autoplay}
        autoplay-interval=${args.autoplayInterval}
        slides-per-page=${args.slidesPerPage}
        slides-per-move=${args.slidesPerMove}
        orientation=${args.orientation}
        ?mouse-dragging=${args.mouseDragging}
        label=${args.label}
      >
        <hx-carousel-item>
          <div
            style="padding: 2rem; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 0.5rem; min-height: 180px;"
          >
            <h3 style="color: #1e40af; margin: 0 0 0.75rem;">Hand Hygiene</h3>
            <p style="color: #1e3a8a; margin: 0; line-height: 1.6;">
              Wash hands with soap and water for at least 20 seconds before and after patient
              contact to prevent the spread of infection.
            </p>
          </div>
        </hx-carousel-item>
        <hx-carousel-item>
          <div
            style="padding: 2rem; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 0.5rem; min-height: 180px;"
          >
            <h3 style="color: #166534; margin: 0 0 0.75rem;">Medication Safety</h3>
            <p style="color: #14532d; margin: 0; line-height: 1.6;">
              Always verify the 5 rights: right patient, right drug, right dose, right route, and
              right time before administration.
            </p>
          </div>
        </hx-carousel-item>
        <hx-carousel-item>
          <div
            style="padding: 2rem; background: #fefce8; border: 1px solid #fef08a; border-radius: 0.5rem; min-height: 180px;"
          >
            <h3 style="color: #854d0e; margin: 0 0 0.75rem;">Fall Prevention</h3>
            <p style="color: #713f12; margin: 0; line-height: 1.6;">
              Keep call bells within reach, bed in lowest position, and ensure the environment is
              clear of hazards at all times.
            </p>
          </div>
        </hx-carousel-item>
      </hx-carousel>
    </div>
  `,
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-carousel');
    await expect(el).toBeTruthy();

    let slideChangeFired = false;
    el?.addEventListener('hx-slide-change', () => {
      slideChangeFired = true;
    });

    const nextBtn = el?.shadowRoot?.querySelector(
      '[aria-label="Next slide"]',
    ) as HTMLButtonElement | null;
    await expect(nextBtn).toBeTruthy();
    await userEvent.click(nextBtn!);
    await expect(slideChangeFired).toBe(true);
  },
};

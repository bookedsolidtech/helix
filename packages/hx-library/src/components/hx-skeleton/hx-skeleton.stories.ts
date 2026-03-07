import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import './hx-skeleton.js';

// ─────────────────────────────────────────────────
// Meta
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Skeleton',
  component: 'hx-skeleton',
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['text', 'circle', 'rect', 'button'],
      description: 'Shape variant of the skeleton placeholder.',
      table: {
        category: 'Visual',
        defaultValue: { summary: 'rect' },
        type: { summary: "'text' | 'circle' | 'rect' | 'button'" },
      },
    },
    width: {
      control: 'text',
      description: 'CSS width of the skeleton.',
      table: {
        category: 'Dimensions',
        defaultValue: { summary: '100%' },
        type: { summary: 'string' },
      },
    },
    height: {
      control: 'text',
      description: 'CSS height of the skeleton. Defaults vary by variant.',
      table: {
        category: 'Dimensions',
        defaultValue: { summary: 'auto (variant default)' },
        type: { summary: 'string' },
      },
    },
    animated: {
      control: 'boolean',
      description: 'Enables the shimmer wave animation.',
      table: {
        category: 'State',
        defaultValue: { summary: 'true' },
        type: { summary: 'boolean' },
      },
    },
  },
  args: {
    variant: 'rect',
    width: '100%',
    animated: true,
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

// ─────────────────────────────────────────────────
// Stories
// ─────────────────────────────────────────────────

export const Default: Story = {
  args: {
    variant: 'rect',
    width: '300px',
    height: '1rem',
    animated: true,
  },
  render: (args) => html`
    <hx-skeleton
      variant=${args.variant}
      width=${args.width}
      .height=${args.height}
      ?animated=${args.animated}
    ></hx-skeleton>
  `,
};

export const TextVariant: Story = {
  name: 'Variant: Text',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 0.5rem; width: 300px;">
      <hx-skeleton variant="text" width="100%" height="1em"></hx-skeleton>
      <hx-skeleton variant="text" width="80%"></hx-skeleton>
      <hx-skeleton variant="text" width="60%"></hx-skeleton>
    </div>
  `,
};

export const CircleVariant: Story = {
  name: 'Variant: Circle',
  render: () => html`
    <div style="display: flex; gap: 1rem; align-items: center;">
      <hx-skeleton variant="circle" width="2rem" height="2rem"></hx-skeleton>
      <hx-skeleton variant="circle" width="3rem" height="3rem"></hx-skeleton>
      <hx-skeleton variant="circle" width="4rem" height="4rem"></hx-skeleton>
    </div>
  `,
};

export const RectVariant: Story = {
  name: 'Variant: Rect',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 0.5rem; width: 300px;">
      <hx-skeleton variant="rect" width="100%" height="120px"></hx-skeleton>
      <hx-skeleton variant="rect" width="100%" height="60px"></hx-skeleton>
    </div>
  `,
};

export const ButtonVariant: Story = {
  name: 'Variant: Button',
  render: () => html`
    <div style="display: flex; gap: 0.5rem;">
      <hx-skeleton variant="button" width="100px" height="2.5rem"></hx-skeleton>
      <hx-skeleton variant="button" width="140px" height="2.5rem"></hx-skeleton>
    </div>
  `,
};

export const StaticNoAnimation: Story = {
  name: 'Static (No Animation)',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 0.5rem; width: 300px;">
      <hx-skeleton variant="text" width="100%" ?animated=${false}></hx-skeleton>
      <hx-skeleton variant="rect" width="100%" height="80px" ?animated=${false}></hx-skeleton>
    </div>
  `,
};

export const CardSkeleton: Story = {
  name: 'Pattern: Card Skeleton',
  render: () => html`
    <div
      aria-busy="true"
      aria-label="Loading card content"
      style="display: flex; flex-direction: column; gap: 0.75rem; width: 300px; padding: 1rem; border: 1px solid #e2e8f0; border-radius: 0.5rem;"
    >
      <hx-skeleton variant="rect" width="100%" height="160px"></hx-skeleton>
      <hx-skeleton variant="text" width="80%"></hx-skeleton>
      <hx-skeleton variant="text" width="100%"></hx-skeleton>
      <hx-skeleton variant="text" width="60%"></hx-skeleton>
      <hx-skeleton variant="button" width="120px" height="2.5rem"></hx-skeleton>
    </div>
  `,
};

export const ProfileSkeleton: Story = {
  name: 'Pattern: Profile Skeleton',
  render: () => html`
    <div
      aria-busy="true"
      aria-label="Loading profile"
      style="display: flex; align-items: center; gap: 1rem; width: 300px;"
    >
      <hx-skeleton variant="circle" width="3rem" height="3rem"></hx-skeleton>
      <div style="flex: 1; display: flex; flex-direction: column; gap: 0.375rem;">
        <hx-skeleton variant="text" width="60%"></hx-skeleton>
        <hx-skeleton variant="text" width="40%"></hx-skeleton>
      </div>
    </div>
  `,
};

export const TableSkeleton: Story = {
  name: 'Pattern: Table Skeleton',
  render: () => html`
    <div
      aria-busy="true"
      aria-label="Loading table data"
      style="display: flex; flex-direction: column; gap: 0.5rem; width: 500px;"
    >
      ${[1, 2, 3, 4, 5].map(
        () => html`
          <div style="display: flex; gap: 1rem; align-items: center;">
            <hx-skeleton variant="circle" width="2rem" height="2rem"></hx-skeleton>
            <hx-skeleton variant="text" width="30%"></hx-skeleton>
            <hx-skeleton variant="text" width="20%"></hx-skeleton>
            <hx-skeleton variant="text" width="15%"></hx-skeleton>
            <hx-skeleton variant="button" width="80px" height="2rem"></hx-skeleton>
          </div>
        `,
      )}
    </div>
  `,
};

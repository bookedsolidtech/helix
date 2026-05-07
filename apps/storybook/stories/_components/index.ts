/**
 * Shared MDX building blocks for the helix Storybook docs surface.
 *
 * MDX pages import from this barrel:
 *
 *   import {
 *     EyebrowHeading, SectionHead, StatCard, RatioCard,
 *     TokenSwatchGrid, SurfaceCard, StateMatrix, DocsCard,
 *   } from '../_components';
 *
 * The `.hx-docs` wrapper in every MDX page provides the @layer hx-docs
 * cascade these components rely on (see `.storybook/docs/helix-docs.css`).
 */
export { EyebrowHeading } from './EyebrowHeading';
export type { EyebrowHeadingProps } from './EyebrowHeading';
export { SectionHead } from './SectionHead';
export type { SectionHeadProps } from './SectionHead';
export { StatCard } from './StatCard';
export type { StatCardProps } from './StatCard';
export { RatioCard } from './RatioCard';
export type { RatioCardProps, ContrastGrade } from './RatioCard';
export { TokenSwatchGrid } from './TokenSwatchGrid';
export type { TokenSwatchGridProps } from './TokenSwatchGrid';
export { SurfaceCard } from './SurfaceCard';
export type { SurfaceCardProps } from './SurfaceCard';
export { StateMatrix } from './StateMatrix';
export type { StateMatrixProps, MatrixState } from './StateMatrix';
export { DocsCard } from './DocsCard';
export type { DocsCardProps } from './DocsCard';
export { contrastRatio, gradeRatio } from './contrast';

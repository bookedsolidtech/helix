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
export { TokenRef } from './TokenRef';
export type { TokenRefProps } from './TokenRef';
export { ContrastMatrix } from './ContrastMatrix';
export type { ContrastMatrixProps } from './ContrastMatrix';
export { contrastRatio, gradeRatio, cssColorToHex } from './contrast';
export { useResolvedToken, useResolvedTokens, readResolvedToken } from './useResolvedToken';
export { CodeBlock, CODE_BLOCK_THEME, CODE_BLOCK_BACKGROUND } from './CodeBlock';
export type { CodeBlockProps, CodeBlockLanguage } from './CodeBlock';
export { CodeTabs } from './CodeTabs';
export type { CodeTabsProps, CodeTab } from './CodeTabs';
export { AAAConformanceCard } from './AAAConformanceCard';
export type { AAAConformanceCardProps } from './AAAConformanceCard';
export { APGPatternCard } from './APGPatternCard';
export type { APGPatternCardProps } from './APGPatternCard';
export { ConsumerObligations } from './ConsumerObligations';
export type { ConsumerObligationsProps } from './ConsumerObligations';
export { InlineAuditPanel } from './InlineAuditPanel';
export type { InlineAuditPanelProps } from './InlineAuditPanel';
export {
  getStandardCriterion,
  listStandardCriteria,
} from './aaa-standards-data';
export type { AAAStandardCriterion } from './aaa-standards-data';

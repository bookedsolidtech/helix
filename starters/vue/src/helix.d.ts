/**
 * Type declarations for HELiX web components in Vue 3.
 *
 * Vue 3 treats hx-* tags as native custom elements (configured via isCustomElement
 * in vite.config.ts). This file adds type-safe event bindings so that @hx-click,
 * @hx-input, and @hx-change handlers are correctly typed in Vue templates.
 */

/** Detail payload for hx-click events from hx-button. */
export interface HxClickDetail {
  originalEvent: MouseEvent;
}

/** Detail payload for hx-input events from hx-text-input. */
export interface HxInputDetail {
  value: string;
}

/** Detail payload for hx-change events from hx-text-input. */
export interface HxChangeDetail {
  value: string;
}

/** Typed handler for hx-click: (e: CustomEvent<HxClickDetail>) => void */
export type HxClickHandler = (e: CustomEvent<HxClickDetail>) => void;

/** Typed handler for hx-input: (e: CustomEvent<HxInputDetail>) => void */
export type HxInputHandler = (e: CustomEvent<HxInputDetail>) => void;

/** Typed handler for hx-change: (e: CustomEvent<HxChangeDetail>) => void */
export type HxChangeHandler = (e: CustomEvent<HxChangeDetail>) => void;

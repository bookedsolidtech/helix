/**
 * Type declarations for @helixui/drupal-behaviors.
 *
 * These behaviors are plain JS IIFEs that register on the Drupal global.
 * This declaration file provides type information for toolchains consuming
 * this package.
 */

/** Drupal behavior interface */
export interface DrupalBehavior {
  attach(context: HTMLElement | Document): void;
  detach?(
    context: HTMLElement | Document,
    settings: Record<string, unknown>,
    trigger: string,
  ): void;
}

/** All HELiX behaviors registered via this package */
export declare const hxAccordionBehavior: DrupalBehavior;
export declare const hxDialogBehavior: DrupalBehavior;
export declare const hxDrawerBehavior: DrupalBehavior;
export declare const hxMenuBehavior: DrupalBehavior;
export declare const hxTabsBehavior: DrupalBehavior;
export declare const hxPopoverBehavior: DrupalBehavior;
export declare const hxToastBehavior: DrupalBehavior;
export declare const hxTooltipBehavior: DrupalBehavior;

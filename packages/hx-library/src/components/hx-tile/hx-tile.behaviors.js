/* global window, CustomEvent, Drupal */

/**
 * @file hx-tile.behaviors.js
 * Drupal behavior for the hx-tile web component.
 *
 * Attach this behavior to wire up hx-tile events to Drupal navigation and selection patterns.
 *
 * Usage in a Drupal module:
 *   import 'path/to/hx-tile.behaviors.js';
 *
 * Or include via the library definition in *.libraries.yml:
 *   hx_tile:
 *     js:
 *       js/hx-tile.behaviors.js: {}
 *     dependencies:
 *       - core/drupal
 */

(function (Drupal) {
  'use strict';

  /**
   * Attaches hx-tile event handling for Drupal contexts.
   *
   * hx-tile components intercept native anchor navigation with e.preventDefault()
   * and emit custom events instead. This behavior re-connects those events to
   * Drupal's navigation system.
   *
   * Events handled:
   *   - hx-click: Fired when a link tile (href set) is activated. Detail: { href, originalEvent }
   *   - hx-select: Fired when a selectable tile (no href) is toggled. Detail: { selected, originalEvent }
   */
  Drupal.behaviors.hxTile = {
    attach: function (context) {
      // Handle link tile navigation (hx-click)
      context.querySelectorAll('hx-tile[href]').forEach(function (tile) {
        if (tile.dataset.hxTileBehaviorAttached) return;
        tile.dataset.hxTileBehaviorAttached = 'true';

        tile.addEventListener('hx-click', function (event) {
          const { href, originalEvent } = event.detail;

          // Open in new tab if modifier key held
          if (originalEvent.ctrlKey || originalEvent.metaKey || originalEvent.shiftKey) {
            window.open(href, '_blank', 'noopener,noreferrer');
            return;
          }

          // Standard Drupal navigation
          window.location.href = href;
        });
      });

      // Handle selectable tile state (hx-select)
      context.querySelectorAll('hx-tile:not([href])').forEach(function (tile) {
        if (tile.dataset.hxTileSelectAttached) return;
        tile.dataset.hxTileSelectAttached = 'true';

        tile.addEventListener('hx-select', function (event) {
          const { selected } = event.detail;

          // Dispatch a native Drupal event for other behaviors to hook into
          const drupalEvent = new CustomEvent('drupal:tile-selected', {
            bubbles: true,
            composed: true,
            detail: { tile: tile, selected: selected },
          });
          tile.dispatchEvent(drupalEvent);
        });
      });
    },

    detach: function (context, settings, trigger) {
      if (trigger === 'unload') {
        context
          .querySelectorAll('hx-tile[data-hx-tile-behavior-attached]')
          .forEach(function (tile) {
            delete tile.dataset.hxTileBehaviorAttached;
          });
        context.querySelectorAll('hx-tile[data-hx-tile-select-attached]').forEach(function (tile) {
          delete tile.dataset.hxTileSelectAttached;
        });
      }
    },
  };
})(Drupal);

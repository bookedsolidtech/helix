# hx-pagination — Drupal Integration Guide

## Overview

`hx-pagination` is a pagination navigation component. In Drupal, it replaces or augments the standard core pager. It fires custom events for page navigation, making it compatible with both full-page navigation and Drupal AJAX-driven content updates.

## Critical: Page Index Offset

**Drupal's standard pager is 0-based. `hx-pagination` is 1-based.**

| Context             | Value for page 1 |
|---------------------|-----------------|
| Drupal `?page=` URL | `?page=0`       |
| `hx-pagination`     | `current-page="1"` |

Always convert when bridging the two systems:

- When rendering: pass `pager.current_page + 1` as `current-page`
- On `hx-page-change`: use `e.detail.page - 1` for the `?page=` URL parameter

## Twig Template

```twig
{#
  pager.current_page is Drupal's 0-based current page index.
  total_pages must be calculated from total_items / items_per_page.
#}
<hx-pagination
  total-pages="{{ total_pages }}"
  current-page="{{ pager.current_page + 1 }}"
  label="{{ 'Pagination'|t }}"
  {{ show_first_last ? 'show-first-last' : '' }}
></hx-pagination>
```

```twig
{# Include via template #}
{% include 'hx-pagination.twig' with {
  total_pages: total_pages,
  pager: pager,
  label: 'Patient list pagination'|t,
  show_first_last: true,
} %}
```

## Template Variables

| Variable        | Type    | Default              | Description                                                  |
|-----------------|---------|----------------------|--------------------------------------------------------------|
| `total_pages`   | number  | required             | Total number of pages                                        |
| `current_page`  | number  |                      | 1-based current page. Falls back to `pager.current_page + 1`. |
| `pager`         | object  |                      | Drupal pager object. Used to derive current page if `current_page` is not set. |
| `label`         | string  | `'Pagination'`       | Accessible label for the `<nav>` element                     |
| `sibling_count` | number  | `1`                  | Pages shown on each side of the current page                 |
| `boundary_count`| number  | `1`                  | Pages shown at the start and end of the range                |
| `show_first_last`| boolean| false                | Show First/Last page buttons                                 |
| `show_page_size`| boolean | false                | Show the page-size selector UI                               |
| `page_size`     | number  | `25`                 | Current page size value                                      |

## GET Parameter Wiring (URL-based Navigation)

For standard Drupal full-page navigation with URL state (browser back/forward compatible):

```js
(function (Drupal, once) {
  Drupal.behaviors.hxPagination = {
    attach(context) {
      once('hx-pagination-init', 'hx-pagination', context).forEach((pagination) => {
        pagination.addEventListener('hx-page-change', (e) => {
          // Convert 1-based component page to 0-based Drupal URL param
          const params = new URLSearchParams(window.location.search);
          params.set('page', String(e.detail.page - 1));
          // Full page navigation — preserves all other query params
          window.location.href = window.location.pathname + '?' + params.toString();
        });
      });
    },
  };
})(Drupal, once);
```

## AJAX-Driven Content Updates

For Views with AJAX or BigPipe-driven pagination (no full page reload):

```js
(function (Drupal, once, $) {
  Drupal.behaviors.hxPaginationAjax = {
    attach(context) {
      once('hx-pagination-ajax', 'hx-pagination[data-view-id]', context).forEach((pagination) => {
        pagination.addEventListener('hx-page-change', (e) => {
          const viewId = pagination.dataset.viewId;
          const displayId = pagination.dataset.displayId || 'default';
          const page = e.detail.page - 1; // Convert to 0-based for Drupal Views

          // Trigger Drupal Views AJAX update
          const ajaxSettings = {
            url: Drupal.url(`views/ajax`),
            submit: {
              view_name: viewId,
              view_display_id: displayId,
              page: page,
            },
          };
          Drupal.ajax(ajaxSettings).execute();

          // Update URL without page reload
          const params = new URLSearchParams(window.location.search);
          params.set('page', String(page));
          history.pushState(null, '', '?' + params.toString());
        });
      });
    },
  };
})(Drupal, once, jQuery);
```

```twig
{# Twig template for AJAX-wired pagination #}
<hx-pagination
  total-pages="{{ total_pages }}"
  current-page="{{ pager.current_page + 1 }}"
  label="{{ 'Patient list pagination'|t }}"
  data-view-id="patient_list"
  data-display-id="page_1"
></hx-pagination>
```

## Page Size Selector

When `show-page-size` is set, a `<select>` element appears allowing users to change items per page. Wire it with Drupal behaviors:

```twig
<hx-pagination
  total-pages="{{ total_pages }}"
  current-page="{{ pager.current_page + 1 }}"
  show-page-size
  page-size="{{ items_per_page|default(25) }}"
></hx-pagination>
```

```js
(function (Drupal, once) {
  Drupal.behaviors.hxPaginationPageSize = {
    attach(context) {
      once('hx-pagination-size', 'hx-pagination', context).forEach((pagination) => {
        pagination.addEventListener('hx-page-size-change', (e) => {
          const params = new URLSearchParams(window.location.search);
          params.set('items_per_page', String(e.detail.pageSize));
          params.set('page', '0'); // Reset to first page on size change
          window.location.href = window.location.pathname + '?' + params.toString();
        });
      });
    },
  };
})(Drupal, once);
```

## Boolean Attribute Pattern

`show-first-last` and `show-page-size` are boolean attributes. In Twig, render them using the conditional pattern:

```twig
{# Twig boolean attribute pattern #}
<hx-pagination
  total-pages="{{ total_pages }}"
  current-page="{{ current_page }}"
  {{ show_first_last ? 'show-first-last' : '' }}
  {{ show_page_size ? 'show-page-size' : '' }}
></hx-pagination>
```

Alternatively, use Drupal's `Attribute` class in PHP:

```php
$variables['pagination_attributes'] = new Attribute();
if ($show_first_last) {
  $variables['pagination_attributes']->setAttribute('show-first-last', '');
}
```

## Multiple Pagination Controls on One Page

Healthcare views often display pagination at both the top and bottom of a table. Differentiate each instance with a distinct `label` for screen readers:

```twig
{# Top pagination #}
<hx-pagination
  total-pages="{{ total_pages }}"
  current-page="{{ current_page }}"
  label="{{ 'Patient list top pagination'|t }}"
></hx-pagination>

{# Patient list table #}
{{ content }}

{# Bottom pagination #}
<hx-pagination
  total-pages="{{ total_pages }}"
  current-page="{{ current_page }}"
  label="{{ 'Patient list bottom pagination'|t }}"
></hx-pagination>
```

## Asset Loading

```yaml
# mytheme.libraries.yml
hx-pagination:
  js:
    https://cdn.example.com/@helixui/library/dist/hx-pagination.js:
      type: external
      attributes:
        type: module
  dependencies:
    - core/once
```

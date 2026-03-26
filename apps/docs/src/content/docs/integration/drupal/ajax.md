---
title: AJAX and BigPipe Compatibility
description: HELiX component behavior with Drupal's AJAX system and BigPipe — behavior reattachment, custom event handling after partial page replacement, and AJAX response integration.
sidebar:
  order: 6
---

Drupal's AJAX system and BigPipe both modify the DOM after initial page load. HELiX components work correctly with both, but there are patterns to follow to ensure behaviors reattach and components upgrade properly.

---

## How Components Work with AJAX

When Drupal's AJAX system inserts new HTML into the page, it:

1. Inserts the HTML fragment into the DOM
2. Calls `Drupal.attachBehaviors(newElement, settings)` on the inserted fragment

Web components in the new fragment upgrade automatically — the browser's custom element registry observes new elements added to the DOM and calls their `connectedCallback` immediately. No manual initialization required.

Drupal behaviors that listen to component events must scope their initialization to the AJAX context. This is exactly what `once()` and the `context` parameter are for.

---

## BigPipe Compatibility

BigPipe streams page content in multiple flushes. Placeholders are replaced progressively as Drupal renders them. Each replacement triggers `Drupal.attachBehaviors()` on the new content.

HELiX components are fully compatible with BigPipe. No special configuration is needed. Components in BigPipe placeholders upgrade normally when their content arrives.

### Pattern: Defer behavior attachment to after BigPipe

If your behavior depends on a component that is in a BigPipe placeholder, the behavior's `attach()` method will be called with the placeholder content once it arrives:

```js
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.helixPatientBanner = {
    attach(context, settings) {
      // This runs once per BigPipe flush that contains hx-patient-banner
      once('helix-patient-banner', 'hx-patient-banner', context).forEach((banner) => {
        banner.addEventListener('hx-action', (event) => {
          // Handle patient banner actions (schedule, message, etc.)
          handlePatientAction(event.detail.action, event.detail.patientId);
        });
      });
    },
  };

  function handlePatientAction(action, patientId) {
    // Implementation...
  }
})(Drupal, once);
```

---

## AJAX Forms: Reattachment After Submission

When a form submits via AJAX and Drupal replaces the form element, behaviors reattach to the new form content. Ensure your behavior uses `once()` so listeners are not duplicated:

```js
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.helixFormValidation = {
    attach(context, settings) {
      // Attaches to new form after AJAX replace
      once('helix-form-validation', 'hx-form[data-validate]', context).forEach((form) => {
        // Client-side pre-validation before AJAX submission
        form.addEventListener('submit', (event) => {
          const inputs = form.querySelectorAll('hx-text-input[required], hx-select[required]');
          let hasErrors = false;

          inputs.forEach((input) => {
            if (!input.value) {
              input.setAttribute('invalid', '');
              hasErrors = true;
            } else {
              input.removeAttribute('invalid');
            }
          });

          if (hasErrors) {
            event.preventDefault();
            event.stopPropagation();
          }
        });
      });
    },
  };
})(Drupal, once);
```

---

## Custom AJAX Commands for HELiX Components

Create custom Drupal AJAX commands that interact with HELiX component APIs.

### PHP: Custom AJAX command

```php
// src/Ajax/HelixToastCommand.php

namespace Drupal\mymodule\Ajax;

use Drupal\Core\Ajax\CommandInterface;

/**
 * Displays an hx-toast notification via AJAX.
 */
class HelixToastCommand implements CommandInterface {

  public function __construct(
    protected readonly string $message,
    protected readonly string $variant = 'info',
    protected readonly int $duration = 5000,
  ) {}

  public function render(): array {
    return [
      'command' => 'helixToast',
      'message' => $this->message,
      'variant' => $this->variant,
      'duration' => $this->duration,
    ];
  }
}
```

### JavaScript: Register the command handler

```js
(function ($, Drupal) {
  'use strict';

  // Register the custom AJAX command
  $.fn.helixToast = function () {};

  Drupal.AjaxCommands.prototype.helixToast = function (ajax, response, status) {
    customElements.whenDefined('hx-toast').then(() => {
      const toast = document.createElement('hx-toast');
      toast.setAttribute('variant', response.variant || 'info');
      toast.setAttribute('message', response.message);
      toast.setAttribute('duration', String(response.duration || 5000));
      document.body.appendChild(toast);
    });
  };
})(jQuery, Drupal);
```

### PHP: Use in a form submit handler

```php
public function submitForm(array &$form, FormStateInterface $form_state): void {
  // Process the form...
  $this->savePatientRecord($form_state->getValues());

  // Return AJAX commands
  $form_state->setRebuild();
  $response = new AjaxResponse();

  $response->addCommand(new HelixToastCommand(
    message: $this->t('Patient record saved successfully.'),
    variant: 'success',
  ));

  // Replace the form with a success state
  $response->addCommand(new ReplaceCommand(
    '#patient-form',
    $this->buildSuccessMarkup(),
  ));

  $form_state->setResponse($response);
}
```

---

## AJAX Views with HELiX Components

Views with AJAX paging replace the view container on each page change. Components in the new rows upgrade automatically. Behaviors reattach via the standard AJAX lifecycle.

### Views template with component rows

```twig
{# views-view-unformatted--patient-list.html.twig #}
{{ attach_library('mytheme/helix_card') }}

<div class="patient-list" id="patient-list">
  {% for row in rows %}
    <hx-card
      variant="default"
      heading="{{ row.content['#row'].title }}"
      href="{{ row.content['#row'].view_node }}"
      data-patient-id="{{ row.content['#row'].nid }}"
    >
      {{ row.content['#row'].body }}
    </hx-card>
  {% endfor %}
</div>
```

### Behavior that reattaches after Views AJAX

```js
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.helixPatientCards = {
    attach(context, settings) {
      // 'context' is the replaced Views container after AJAX paging
      once('helix-patient-card', 'hx-card[data-patient-id]', context).forEach((card) => {
        card.addEventListener('hx-card-click', (event) => {
          // Track card clicks for analytics
          Drupal.announce(
            Drupal.t('Navigating to patient record: @name', {
              '@name': card.getAttribute('heading'),
            }),
          );
        });
      });
    },
  };
})(Drupal, once);
```

---

## Handling the Component Upgrade Race

On rare occasions, a behavior may run before a component's JavaScript has fully registered. This happens when:

- The behavior attaches very early in the page lifecycle
- The component's JS file is loaded asynchronously (type="module")

Use `customElements.whenDefined()` to defer property access until the component is ready:

```js
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.helixAccordion = {
    attach(context, settings) {
      once('helix-accordion', 'hx-accordion[data-open-first]', context).forEach((accordion) => {
        // Wait for hx-accordion to be defined before calling its API
        customElements.whenDefined('hx-accordion').then(() => {
          // Open the first panel programmatically
          const firstItem = accordion.querySelector('hx-accordion-item');
          if (firstItem) {
            firstItem.setAttribute('open', '');
          }
        });
      });
    },
  };
})(Drupal, once);
```

For bulk operations across many components of the same type, wait once and then process:

```js
// Wait for all needed components before processing
Promise.all([
  customElements.whenDefined('hx-card'),
  customElements.whenDefined('hx-badge'),
]).then(() => {
  // All components ready, safe to interact with their APIs
  once('helix-patient-grid', '.patient-grid', context).forEach((grid) => {
    // ...
  });
});
```

---

## Drupal AJAX API: Invoking Component Methods

Drupal's standard AJAX commands (`invoke`, `insert`, `html`, `replace`) work normally with HELiX components. Components upgrade as soon as they are inserted.

### Opening a dialog via AJAX invoke

```php
// PHP side
$response->addCommand(new InvokeCommand('#patient-dialog', 'prop', [['open', true]]));
```

### Setting a component property via AJAX

Because `InvokeCommand` calls jQuery methods, and HELiX component properties are JavaScript properties (not jQuery methods), use `html` or a custom command instead:

```php
// Replace dialog content, then open it
$response->addCommand(new HtmlCommand('#dialog-body', $content));
$response->addCommand(new SettingsCommand(['helixDialogOpen' => 'patient-dialog'], TRUE));
```

```js
// In the AJAX settings response handler
$(document).on('drupalAjaxSuccess', function (event, xhr, settings, response) {
  if (drupalSettings.helixDialogOpen) {
    const dialog = document.getElementById(drupalSettings.helixDialogOpen);
    if (dialog) {
      dialog.open = true;
    }
    delete drupalSettings.helixDialogOpen;
  }
});
```

---

## Libraries Configuration

AJAX command handlers need to be in a dedicated library, separate from the component library:

```yaml
# mytheme.libraries.yml

helix_ajax_commands:
  version: 1.0.0
  js:
    js/helix-ajax-commands.js: {}
  dependencies:
    - core/jquery
    - core/drupal
    - core/drupalSettings
    - mytheme/helix
```

---

## Next Steps

- [Behaviors](/integration/drupal/behaviors/) — Full behaviors reference
- [Forms](/integration/drupal/forms/) — AJAX form submission patterns
- [Troubleshooting](/integration/drupal/troubleshooting/) — Behaviors not reattaching, component upgrade issues

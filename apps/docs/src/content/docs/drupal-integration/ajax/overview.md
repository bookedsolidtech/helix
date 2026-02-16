---
title: AJAX Framework Overview
description: Deep dive into Drupal's AJAX framework and how HELIX web components maintain state, event handlers, and progressive enhancement through AJAX responses
sidebar:
  order: 42
---

Drupal's AJAX framework provides a robust system for dynamic page updates without full page reloads. This guide explores how HELIX web components integrate with Drupal AJAX, maintain component state through DOM replacement, and ensure event handlers re-attach correctly after AJAX operations.

## Understanding Drupal's AJAX Framework

Drupal's AJAX system is built on three core concepts: the AJAX API, AJAX commands, and AJAX responses. This architecture enables server-driven DOM manipulation while maintaining compatibility with Drupal's rendering pipeline, caching system, and behavior attachment lifecycle.

### The AJAX Request/Response Cycle

When a user interacts with an AJAX-enabled element, Drupal executes the following flow:

1. **Client initiates request** - User clicks an element with `use-ajax` class or submits a form with AJAX-enabled submit button
2. **Drupal intercepts event** - JavaScript behavior captures the event and sends XMLHttpRequest to the server
3. **Server builds response** - PHP controller or form handler generates render array and AJAX commands
4. **Commands execute client-side** - JavaScript processes commands sequentially (replace, append, invoke, etc.)
5. **Behaviors re-attach** - `Drupal.behaviors.attach()` runs on modified DOM regions
6. **Custom Elements upgrade** - Web components in newly inserted HTML automatically upgrade

This cycle ensures that web components, JavaScript behaviors, and Drupal's rendering pipeline work cohesively without manual lifecycle management.

## AJAX API Basics

### The use-ajax Class

The simplest AJAX integration requires only adding the `use-ajax` CSS class to a link:

```twig
{# Basic AJAX link #}
<hx-button
  variant="primary"
  href="{{ path('mymodule.ajax_callback') }}"
  class="use-ajax"
>
  Load More Results
</hx-button>
```

When clicked, Drupal's AJAX system intercepts the navigation, sends an XMLHttpRequest to the href URL, and processes the returned AJAX commands.

### data-drupal-selector Attribute

The `data-drupal-selector` attribute provides a stable DOM reference that persists across AJAX replacements. Unlike IDs or classes that may change during re-rendering, `data-drupal-selector` values remain constant:

```twig
{# Stable selector for AJAX targeting #}
<div data-drupal-selector="patient-results-wrapper">
  <hx-card variant="compact" heading="{{ patient.name }}">
    {{ patient.summary }}
  </hx-card>
</div>
```

This attribute is critical for AJAX commands that target specific DOM regions for replacement, insertion, or manipulation.

### AJAX-Enabled Forms

Forms use a different AJAX pattern, binding to specific form elements:

```php
// Form API with AJAX
$form['search'] = [
  '#type' => 'textfield',
  '#title' => $this->t('Search patients'),
  '#ajax' => [
    'callback' => '::searchCallback',
    'event' => 'input',
    'wrapper' => 'search-results',
    'progress' => [
      'type' => 'throbber',
      'message' => $this->t('Searching...'),
    ],
  ],
];

$form['results'] = [
  '#type' => 'container',
  '#attributes' => ['id' => 'search-results'],
  '#markup' => '<hx-empty-state message="Start typing to search"></hx-empty-state>',
];
```

The AJAX callback returns a render array that Drupal converts to HTML and replaces the wrapper element's content.

## AJAX Commands System

AJAX commands are JSON instructions sent from server to client, telling the browser what DOM manipulations to perform. Drupal includes built-in commands and supports custom command definitions.

### Core AJAX Commands

#### 1. Replace Command

The most common command, `replace`, swaps an existing DOM element with new HTML:

```php
public function ajaxCallback(array &$form, FormStateInterface $form_state): AjaxResponse {
  $response = new AjaxResponse();

  // Build render array with HELIX components
  $content = [
    '#theme' => 'item_list__patients',
    '#items' => $this->buildPatientCards(),
    '#wrapper_attributes' => [
      'data-drupal-selector' => 'patient-list',
      'class' => ['patient-list-wrapper'],
    ],
  ];

  // Replace the entire wrapper
  $response->addCommand(new ReplaceCommand(
    '[data-drupal-selector="patient-list"]',
    $content
  ));

  return $response;
}

private function buildPatientCards(): array {
  $items = [];
  foreach ($this->patientStorage->loadMultiple() as $patient) {
    $items[] = [
      '#type' => 'inline_template',
      '#template' => '<hx-card variant="compact" heading="{{ name }}">{{ summary }}</hx-card>',
      '#context' => [
        'name' => $patient->label(),
        'summary' => $patient->get('field_summary')->value,
      ],
    ];
  }
  return $items;
}
```

**Key insight:** The `ReplaceCommand` accepts both jQuery selectors and `data-drupal-selector` attributes. Using `data-drupal-selector` provides the most stable targeting.

#### 2. Append/Prepend Commands

Add content before or after existing elements without full replacement:

```php
// Infinite scroll pattern
public function loadMoreCallback(): AjaxResponse {
  $response = new AjaxResponse();

  $new_cards = [
    '#theme' => 'item_list',
    '#items' => $this->loadNextBatch(),
    '#list_type' => 'div',
  ];

  // Append to existing list
  $response->addCommand(new AppendCommand(
    '[data-drupal-selector="patient-list"]',
    $new_cards
  ));

  // Update button visibility if no more results
  if (!$this->hasMoreResults()) {
    $response->addCommand(new InvokeCommand(
      '[data-drupal-selector="load-more-btn"]',
      'setAttribute',
      ['hidden', 'true']
    ));
  }

  return $response;
}
```

**HELIX compatibility:** Appended `<hx-card>` elements automatically upgrade when inserted into the DOM. No manual initialization required.

#### 3. Invoke Command

Execute JavaScript methods on DOM elements:

```php
// Programmatically trigger component methods
$response->addCommand(new InvokeCommand(
  'hx-modal[data-modal-id="confirmation"]',
  'show'
));

// Change component properties
$response->addCommand(new InvokeCommand(
  'hx-alert[data-drupal-selector="status-alert"]',
  'setAttribute',
  ['variant', 'success']
));
```

**Use case:** Triggering component imperative APIs (modal.show(), accordion.expand(), etc.) from server-side logic.

#### 4. Remove Command

Delete elements from the DOM:

```php
// Remove patient card after deletion
$response->addCommand(new RemoveCommand(
  '[data-patient-id="' . $patient_id . '"]'
));

// Remove all error messages
$response->addCommand(new RemoveCommand('.messages--error'));
```

#### 5. HTML Command

Replace the innerHTML of an element without replacing the element itself:

```php
// Update card content without replacing the entire component
$response->addCommand(new HtmlCommand(
  'hx-card[data-patient-id="' . $id . '"]',
  $this->renderPatientSummary($patient)
));
```

**Important:** Using `HtmlCommand` on web components requires targeting light DOM containers or slots, not Shadow DOM content.

#### 6. Redirect Command

Navigate to a different page:

```php
// Redirect after form submission
$response->addCommand(new RedirectCommand(
  Url::fromRoute('mymodule.patient_detail', ['id' => $patient_id])->toString()
));
```

### Custom AJAX Commands

Create custom commands for complex operations:

```php
// Custom command for triggering component animations
namespace Drupal\mymodule\Ajax;

use Drupal\Core\Ajax\CommandInterface;

class AnimateComponentCommand implements CommandInterface {

  protected string $selector;
  protected string $animation;

  public function __construct(string $selector, string $animation) {
    $this->selector = $selector;
    $this->animation = $animation;
  }

  public function render(): array {
    return [
      'command' => 'animateComponent',
      'selector' => $this->selector,
      'animation' => $this->animation,
    ];
  }
}
```

```javascript
// Client-side command handler
(function (Drupal) {
  'use strict';

  Drupal.AjaxCommands.prototype.animateComponent = function (ajax, response, status) {
    const element = document.querySelector(response.selector);
    if (element && typeof element.animate === 'function') {
      // Use component's built-in animation method if available
      element.animate(response.animation);
    }
  };
})(Drupal);
```

## AJAX Responses and Render Arrays

Server-side controllers return `AjaxResponse` objects containing multiple commands:

```php
public function complexAjaxCallback(): AjaxResponse {
  $response = new AjaxResponse();

  // 1. Update results list
  $response->addCommand(new ReplaceCommand(
    '[data-drupal-selector="results"]',
    $this->buildResultsList()
  ));

  // 2. Update result count badge
  $count_markup = [
    '#type' => 'inline_template',
    '#template' => '<hx-badge variant="info">{{ count }}</hx-badge>',
    '#context' => ['count' => $this->getResultCount()],
  ];
  $response->addCommand(new HtmlCommand(
    '[data-drupal-selector="count-wrapper"]',
    $count_markup
  ));

  // 3. Show success message
  $message = [
    '#type' => 'inline_template',
    '#template' => '<hx-alert variant="success" dismissible>{{ message }}</hx-alert>',
    '#context' => ['message' => $this->t('Results updated successfully')],
  ];
  $response->addCommand(new PrependCommand(
    '[data-drupal-selector="messages"]',
    $message
  ));

  // 4. Trigger analytics event
  $response->addCommand(new InvokeCommand(
    NULL,
    'dispatchEvent',
    [new CustomEvent('analytics:search', ['detail' => ['query' => $query]])]
  ));

  return $response;
}
```

### Progressive Rendering

Leverage Drupal's lazy builder system for performance:

```php
$build = [
  '#lazy_builder' => ['mymodule.patient_cards:build', [$patient_ids]],
  '#create_placeholder' => TRUE,
];

// Placeholder renders immediately, content streams via BigPipe or AJAX
return [
  '#type' => 'container',
  '#attributes' => ['data-drupal-selector' => 'patient-list'],
  'content' => $build,
];
```

HELIX components in lazy-built content upgrade automatically when placeholders resolve.

## Web Component Compatibility

Web Components and Drupal AJAX integrate seamlessly because Custom Elements use browser-native lifecycle callbacks that trigger regardless of how elements enter the DOM.

### Automatic Upgrade on Insertion

When AJAX commands insert HTML containing HELIX components, the browser's Custom Elements registry automatically detects and upgrades them:

```php
// Server returns HTML with web components
$content = '<hx-card variant="featured" heading="New Patient">
  <div slot="content">Patient data updated via AJAX</div>
</hx-card>';

$response->addCommand(new AppendCommand('.results', $content));
```

**What happens client-side:**

1. `AppendCommand` inserts HTML into DOM
2. Browser detects `<hx-card>` tag
3. Custom Elements API calls `HxCard` constructor
4. Shadow DOM renders
5. Component becomes interactive
6. `Drupal.behaviors.attach()` runs on new content

### Preserving Component State

AJAX replacement commands can destroy component state. Use these strategies to preserve important data:

#### Strategy 1: Store State in Attributes

Component properties backed by attributes survive DOM replacement:

```twig
{# State preserved via attributes #}
<hx-accordion
  data-drupal-selector="patient-accordion"
  expanded-panels="0,2"
  variant="bordered"
>
  {{ panels }}
</hx-accordion>
```

When the accordion is replaced via AJAX, the `expanded-panels` attribute persists if included in the replacement HTML.

#### Strategy 2: Capture State Before Replacement

Use custom AJAX commands to preserve and restore component state:

```javascript
(function (Drupal) {
  'use strict';

  // Store component state before replacement
  const componentStateCache = new WeakMap();

  Drupal.behaviors.preserveComponentState = {
    detach(context, settings, trigger) {
      if (trigger === 'unload') {
        // Capture state from components about to be removed
        context.querySelectorAll('hx-accordion').forEach((accordion) => {
          const selector = accordion.getAttribute('data-drupal-selector');
          if (selector) {
            componentStateCache.set(selector, {
              expandedPanels: accordion.expandedPanels,
              variant: accordion.variant,
            });
          }
        });
      }
    },

    attach(context) {
      // Restore state to newly inserted components
      context.querySelectorAll('hx-accordion').forEach((accordion) => {
        const selector = accordion.getAttribute('data-drupal-selector');
        const cached = componentStateCache.get(selector);

        if (cached) {
          accordion.expandedPanels = cached.expandedPanels;
          accordion.variant = cached.variant;
          componentStateCache.delete(selector);
        }
      });
    },
  };
})(Drupal);
```

#### Strategy 3: Server-Side State Management

Store component state server-side and restore it in render arrays:

```php
public function ajaxCallback(array &$form, FormStateInterface $form_state): AjaxResponse {
  // Retrieve state from form state or session
  $expanded = $form_state->getValue('expanded_panels') ?? [0];

  $accordion = [
    '#type' => 'inline_template',
    '#template' => '<hx-accordion expanded-panels="{{ expanded }}" data-drupal-selector="patient-accordion">
      {{ panels }}
    </hx-accordion>',
    '#context' => [
      'expanded' => implode(',', $expanded),
      'panels' => $this->renderPanels(),
    ],
  ];

  $response = new AjaxResponse();
  $response->addCommand(new ReplaceCommand('[data-drupal-selector="patient-accordion"]', $accordion));

  return $response;
}
```

### Event Re-Attachment

Event listeners added via JavaScript do not automatically reattach after AJAX replacement. Use Drupal Behaviors to ensure consistent re-attachment:

```javascript
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.hxCardEvents = {
    attach(context) {
      // Use once() to prevent duplicate listeners
      once('hx-card-click', 'hx-card[href]', context).forEach((card) => {
        card.addEventListener('hx-card-click', (e) => {
          // Analytics tracking
          if (typeof gtag !== 'undefined') {
            gtag('event', 'card_click', {
              card_id: e.target.getAttribute('data-card-id'),
              variant: e.target.variant,
            });
          }

          // AJAX navigation instead of full page load
          if (e.detail.href.startsWith('/patient/')) {
            e.preventDefault();
            loadPatientDetail(e.detail.href);
          }
        });
      });
    },
  };

  function loadPatientDetail(url) {
    const ajax = Drupal.ajax({
      url: url,
      element: document.body,
    });
    ajax.execute();
  }
})(Drupal, once);
```

**Critical:** Always use `once()` from Drupal core's `core/once` library to prevent duplicate event listeners when behaviors reattach.

## AJAX + HELIX Component Patterns

### Pattern 1: Infinite Scroll with Cards

```php
// Route: /api/patients/load-more
public function loadMorePatients(Request $request): AjaxResponse {
  $offset = $request->query->get('offset', 0);
  $limit = 12;

  $patients = $this->patientStorage->loadByProperties([
    'status' => 1,
  ], $limit, $offset);

  $cards = array_map(function ($patient) {
    return [
      '#type' => 'inline_template',
      '#template' => '<hx-card variant="compact" heading="{{ name }}" href="{{ url }}" data-patient-id="{{ id }}">
        <div slot="content">{{ summary }}</div>
        <div slot="meta">
          <hx-badge variant="info">{{ status }}</hx-badge>
        </div>
      </hx-card>',
      '#context' => [
        'id' => $patient->id(),
        'name' => $patient->label(),
        'url' => $patient->toUrl()->toString(),
        'summary' => $patient->get('field_summary')->value,
        'status' => $patient->get('field_status')->value,
      ],
    ];
  }, $patients);

  $response = new AjaxResponse();
  $response->addCommand(new AppendCommand('[data-drupal-selector="patient-grid"]', $cards));

  // Hide load more button if no more results
  if (count($patients) < $limit) {
    $response->addCommand(new InvokeCommand('[data-drupal-selector="load-more"]', 'setAttribute', ['hidden', '']));
  }

  return $response;
}
```

```twig
{# Template: patient-list.html.twig #}
<div class="patient-list">
  <div class="patient-grid" data-drupal-selector="patient-grid">
    {% for patient in patients %}
      <hx-card
        variant="compact"
        heading="{{ patient.label }}"
        href="{{ patient.url }}"
        data-patient-id="{{ patient.id }}"
      >
        <div slot="content">{{ patient.summary }}</div>
        <div slot="meta">
          <hx-badge variant="info">{{ patient.status }}</hx-badge>
        </div>
      </hx-card>
    {% endfor %}
  </div>

  <hx-button
    variant="secondary"
    class="use-ajax"
    href="{{ path('mymodule.load_more', {offset: patients|length}) }}"
    data-drupal-selector="load-more"
  >
    Load More
  </hx-button>
</div>
```

### Pattern 2: Live Search with Debounce

```php
$form['search'] = [
  '#type' => 'textfield',
  '#title' => $this->t('Search patients'),
  '#attributes' => [
    'placeholder' => $this->t('Enter patient name or ID'),
    'autocomplete' => 'off',
  ],
  '#ajax' => [
    'callback' => '::searchCallback',
    'event' => 'input',
    'wrapper' => 'search-results',
    'progress' => [
      'type' => 'none', // Custom loading indicator
    ],
    'debounce' => 500, // Drupal 10.1+ feature
  ],
];

$form['results_wrapper'] = [
  '#type' => 'container',
  '#attributes' => [
    'id' => 'search-results',
    'data-drupal-selector' => 'search-results',
  ],
];

public function searchCallback(array &$form, FormStateInterface $form_state): array {
  $query = $form_state->getValue('search');

  if (strlen($query) < 2) {
    return [
      '#type' => 'inline_template',
      '#template' => '<hx-empty-state message="Type at least 2 characters to search"></hx-empty-state>',
    ];
  }

  $results = $this->searchPatients($query);

  if (empty($results)) {
    return [
      '#type' => 'inline_template',
      '#template' => '<hx-empty-state message="No patients found" variant="info"></hx-empty-state>',
    ];
  }

  return [
    '#theme' => 'item_list',
    '#items' => array_map([$this, 'buildPatientCard'], $results),
    '#list_type' => 'div',
    '#attributes' => ['class' => ['search-results-list']],
  ];
}
```

### Pattern 3: Modal Confirmation Dialogs

```php
// Controller method
public function deletePatientForm(string $patient_id): AjaxResponse {
  $response = new AjaxResponse();

  $modal_content = [
    '#type' => 'inline_template',
    '#template' => '<hx-modal heading="Confirm Deletion" variant="danger" data-drupal-selector="delete-modal">
      <div slot="content">
        <p>Are you sure you want to delete patient record #{{ id }}?</p>
        <p><strong>This action cannot be undone.</strong></p>
      </div>
      <div slot="actions">
        <hx-button variant="danger" class="use-ajax" href="{{ confirm_url }}">Delete</hx-button>
        <hx-button variant="text" data-action="close">Cancel</hx-button>
      </div>
    </hx-modal>',
    '#context' => [
      'id' => $patient_id,
      'confirm_url' => Url::fromRoute('mymodule.patient_delete_confirm', ['id' => $patient_id])->toString(),
    ],
  ];

  $response->addCommand(new AppendCommand('body', $modal_content));
  $response->addCommand(new InvokeCommand('[data-drupal-selector="delete-modal"]', 'show'));

  return $response;
}

public function confirmDelete(string $patient_id): AjaxResponse {
  $this->patientStorage->load($patient_id)->delete();

  $response = new AjaxResponse();

  // Close modal
  $response->addCommand(new InvokeCommand('[data-drupal-selector="delete-modal"]', 'close'));
  $response->addCommand(new RemoveCommand('[data-drupal-selector="delete-modal"]'));

  // Remove card from DOM
  $response->addCommand(new RemoveCommand('[data-patient-id="' . $patient_id . '"]'));

  // Show success message
  $message = [
    '#type' => 'inline_template',
    '#template' => '<hx-alert variant="success" dismissible>Patient record deleted successfully</hx-alert>',
  ];
  $response->addCommand(new PrependCommand('[data-drupal-selector="messages"]', $message));

  return $response;
}
```

```javascript
// Attach close handler for cancel button
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.modalCancel = {
    attach(context) {
      once('modal-cancel', '[data-action="close"]', context).forEach((button) => {
        button.addEventListener('click', () => {
          const modal = button.closest('hx-modal');
          if (modal) {
            modal.close();
            // Remove from DOM after close animation
            modal.addEventListener('hx-close', () => modal.remove(), { once: true });
          }
        });
      });
    },
  };
})(Drupal, once);
```

### Pattern 4: Form Validation with Component Feedback

```php
$form['patient_name'] = [
  '#type' => 'textfield',
  '#title' => $this->t('Patient Name'),
  '#required' => TRUE,
  '#ajax' => [
    'callback' => '::validateNameCallback',
    'event' => 'blur',
    'wrapper' => 'name-validation-message',
  ],
  '#suffix' => '<div id="name-validation-message" data-drupal-selector="name-validation"></div>',
];

public function validateNameCallback(array &$form, FormStateInterface $form_state): array {
  $name = $form_state->getValue('patient_name');

  if (empty($name)) {
    return [
      '#type' => 'inline_template',
      '#template' => '<hx-alert variant="error" size="sm">Name is required</hx-alert>',
    ];
  }

  if (strlen($name) < 2) {
    return [
      '#type' => 'inline_template',
      '#template' => '<hx-alert variant="error" size="sm">Name must be at least 2 characters</hx-alert>',
    ];
  }

  if ($this->nameExists($name)) {
    return [
      '#type' => 'inline_template',
      '#template' => '<hx-alert variant="warning" size="sm">A patient with this name already exists</hx-alert>',
    ];
  }

  return [
    '#type' => 'inline_template',
    '#template' => '<hx-alert variant="success" size="sm">Name is valid</hx-alert>',
  ];
}
```

## Complete Example: Patient Dashboard

This example demonstrates a complete patient dashboard with AJAX filtering, sorting, and live updates using HELIX components.

```php
// src/Form/PatientDashboardForm.php
namespace Drupal\mymodule\Form;

use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Ajax\AjaxResponse;
use Drupal\Core\Ajax\ReplaceCommand;

class PatientDashboardForm extends FormBase {

  public function getFormId(): string {
    return 'patient_dashboard_form';
  }

  public function buildForm(array $form, FormStateInterface $form_state): array {
    $form['#attached']['library'][] = 'mymodule/patient-dashboard';

    // Filters
    $form['filters'] = [
      '#type' => 'container',
      '#attributes' => ['class' => ['dashboard-filters']],
    ];

    $form['filters']['status'] = [
      '#type' => 'select',
      '#title' => $this->t('Status'),
      '#options' => [
        'all' => $this->t('All'),
        'active' => $this->t('Active'),
        'pending' => $this->t('Pending'),
        'discharged' => $this->t('Discharged'),
      ],
      '#ajax' => [
        'callback' => '::updateResultsCallback',
        'wrapper' => 'patient-results',
        'event' => 'change',
      ],
    ];

    $form['filters']['sort'] = [
      '#type' => 'select',
      '#title' => $this->t('Sort By'),
      '#options' => [
        'name' => $this->t('Name'),
        'date' => $this->t('Admission Date'),
        'status' => $this->t('Status'),
      ],
      '#ajax' => [
        'callback' => '::updateResultsCallback',
        'wrapper' => 'patient-results',
        'event' => 'change',
      ],
    ];

    $form['filters']['search'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Search'),
      '#placeholder' => $this->t('Patient name or ID'),
      '#ajax' => [
        'callback' => '::updateResultsCallback',
        'wrapper' => 'patient-results',
        'event' => 'input',
        'debounce' => 500,
      ],
    ];

    // Results container
    $form['results'] = [
      '#type' => 'container',
      '#attributes' => [
        'id' => 'patient-results',
        'data-drupal-selector' => 'patient-results',
      ],
      'content' => $this->buildResults($form_state),
    ];

    return $form;
  }

  public function updateResultsCallback(array &$form, FormStateInterface $form_state): AjaxResponse {
    $response = new AjaxResponse();

    $results = $this->buildResults($form_state);

    $response->addCommand(new ReplaceCommand(
      '[data-drupal-selector="patient-results"]',
      $results
    ));

    return $response;
  }

  protected function buildResults(FormStateInterface $form_state): array {
    $status = $form_state->getValue('status', 'all');
    $sort = $form_state->getValue('sort', 'name');
    $search = $form_state->getValue('search', '');

    $patients = $this->loadPatients($status, $sort, $search);

    if (empty($patients)) {
      return [
        '#type' => 'inline_template',
        '#template' => '<hx-empty-state
          message="No patients found"
          description="Try adjusting your filters"
          variant="info"
        ></hx-empty-state>',
      ];
    }

    $cards = [];
    foreach ($patients as $patient) {
      $cards[] = [
        '#type' => 'inline_template',
        '#template' => '<hx-card
          variant="compact"
          heading="{{ name }}"
          href="{{ url }}"
          data-patient-id="{{ id }}"
        >
          <div slot="content">
            <p><strong>ID:</strong> {{ patient_id }}</p>
            <p><strong>Admitted:</strong> {{ admitted }}</p>
          </div>
          <div slot="meta">
            <hx-badge variant="{{ status_variant }}">{{ status }}</hx-badge>
          </div>
          <div slot="actions">
            <hx-button variant="text" size="sm" href="{{ url }}">View Details</hx-button>
          </div>
        </hx-card>',
        '#context' => [
          'id' => $patient->id(),
          'name' => $patient->label(),
          'patient_id' => $patient->get('field_patient_id')->value,
          'admitted' => $patient->get('field_admission_date')->value,
          'status' => $patient->get('field_status')->value,
          'status_variant' => $this->getStatusVariant($patient->get('field_status')->value),
          'url' => $patient->toUrl()->toString(),
        ],
      ];
    }

    return [
      '#type' => 'container',
      '#attributes' => [
        'id' => 'patient-results',
        'data-drupal-selector' => 'patient-results',
        'class' => ['patient-grid'],
      ],
      'cards' => $cards,
    ];
  }

  protected function loadPatients(string $status, string $sort, string $search): array {
    // Implementation details
    return [];
  }

  protected function getStatusVariant(string $status): string {
    return match ($status) {
      'active' => 'success',
      'pending' => 'warning',
      'discharged' => 'neutral',
      default => 'info',
    };
  }

  public function submitForm(array &$form, FormStateInterface $form_state): void {
    // Not used for AJAX-only form
  }
}
```

```twig
{# templates/patient-dashboard.html.twig #}
<div class="patient-dashboard">
  <header class="dashboard-header">
    <hx-container>
      <h1>Patient Dashboard</h1>
      {{ form.filters }}
    </hx-container>
  </header>

  <main class="dashboard-content">
    <hx-container>
      {{ form.results }}
    </hx-container>
  </main>
</div>
```

```javascript
// js/patient-dashboard.js
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.patientDashboard = {
    attach(context) {
      // Track card interactions
      once('patient-card-tracking', 'hx-card[data-patient-id]', context).forEach((card) => {
        card.addEventListener('hx-card-click', (e) => {
          if (typeof gtag !== 'undefined') {
            gtag('event', 'patient_card_click', {
              patient_id: e.target.getAttribute('data-patient-id'),
              source: 'dashboard',
            });
          }
        });
      });

      // Add loading states to form elements during AJAX
      once(
        'ajax-loading-state',
        '.dashboard-filters select, .dashboard-filters input',
        context,
      ).forEach((field) => {
        field.addEventListener('ajaxStart', () => {
          const wrapper = document.querySelector('[data-drupal-selector="patient-results"]');
          if (wrapper) {
            wrapper.setAttribute('aria-busy', 'true');
            wrapper.style.opacity = '0.6';
          }
        });

        field.addEventListener('ajaxComplete', () => {
          const wrapper = document.querySelector('[data-drupal-selector="patient-results"]');
          if (wrapper) {
            wrapper.removeAttribute('aria-busy');
            wrapper.style.opacity = '1';
          }
        });
      });
    },
  };
})(Drupal, once);
```

```yaml
# mymodule.libraries.yml
patient-dashboard:
  js:
    js/patient-dashboard.js: {}
  dependencies:
    - core/drupal
    - core/drupal.ajax
    - core/once
    - hxlibrary/components
```

## Troubleshooting

### Components Not Upgrading After AJAX

**Symptom:** Web components render as plain HTML after AJAX replacement.

**Solution:** Ensure component library is loaded on initial page load, not dynamically attached. Custom Elements must be registered before AJAX inserts HTML.

```yaml
# Attach library globally
mytheme.info.yml:
libraries:
  - hxlibrary/components
```

### Event Handlers Disappear After Replacement

**Symptom:** Click handlers or custom event listeners stop working after AJAX replaces elements.

**Solution:** Use `Drupal.behaviors.attach()` with `once()` to reattach event listeners:

```javascript
Drupal.behaviors.myEvents = {
  attach(context) {
    once('my-handler', 'hx-button.my-button', context).forEach((button) => {
      button.addEventListener('click', handleClick);
    });
  },
};
```

### Component State Lost on Replacement

**Symptom:** Accordion panels collapse, modal closes, or form inputs reset after AJAX update.

**Solution:** Store state in attributes or use `Drupal.behaviors.detach()` to cache state before replacement.

### data-drupal-selector Not Found

**Symptom:** `ReplaceCommand` targeting `data-drupal-selector` fails silently.

**Solution:** Ensure the selector exists in both the original markup and replacement HTML. Use browser DevTools to verify attribute presence.

### AJAX Progress Indicator Interferes with Components

**Symptom:** Throbber or progress bar renders inside Shadow DOM or disrupts layout.

**Solution:** Disable default progress indicator and use component-level loading states:

```php
'#ajax' => [
  'callback' => '::myCallback',
  'progress' => ['type' => 'none'],
],
```

```javascript
// Custom loading state
field.addEventListener('ajaxStart', () => {
  const results = document.querySelector('[data-drupal-selector="results"]');
  results.setAttribute('aria-busy', 'true');

  // Use component loading state if available
  const spinner = results.querySelector('hx-spinner');
  if (spinner) spinner.show();
});
```

### Form Components Don't Submit Values

**Symptom:** `<hx-text-input>`, `<hx-select>` values missing from form submission.

**Solution:** HELIX form components use `ElementInternals` and participate in native form submission. Ensure components have `name` attributes:

```twig
<hx-text-input
  name="patient_name"
  label="Patient Name"
  required
></hx-text-input>
```

If using custom AJAX submission, collect values via `FormData`:

```javascript
const form = document.querySelector('form');
const formData = new FormData(form);
// Form components automatically include their values
```

## Summary

Drupal's AJAX framework and HELIX web components form a powerful combination for building dynamic, accessible healthcare applications. The key principles:

1. **Custom Elements upgrade automatically** when inserted via AJAX commands
2. **Use `data-drupal-selector`** for stable DOM targeting across replacements
3. **Leverage `Drupal.behaviors.attach()`** with `once()` for event handler reattachment
4. **Store state in attributes** or server-side to survive DOM replacement
5. **Progressive enhancement** ensures content remains accessible during AJAX operations
6. **AJAX commands are composable** - combine multiple updates in a single response

By following these patterns, HELIX components maintain their interactivity, accessibility, and performance through Drupal's AJAX lifecycle while preserving the benefits of server-side rendering and caching.

For additional integration patterns, see:

- [Drupal Behaviors](/drupal-integration/behaviors/)
- [Form Integration](/drupal-integration/forms/)
- [Twig Patterns](/drupal-integration/twig/)

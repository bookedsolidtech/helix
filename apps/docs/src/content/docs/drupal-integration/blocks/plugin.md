---
title: Block Plugin Development
description: Complete guide to building Drupal Block plugins that render HELIX web components with configurable properties and slots
sidebar:
  order: 31
---

Drupal's Block Plugin system is one of the most powerful mechanisms for creating reusable, configurable content regions. This deep-dive guide shows how to build Block plugins that render HELIX web components, map configuration forms to component properties, and leverage Drupal's caching system for optimal performance.

---

## Table of Contents

1. [Block Plugin Architecture Overview](#block-plugin-architecture-overview)
2. [BlockBase Extension](#blockbase-extension)
3. [The build() Method](#the-build-method)
4. [blockForm() for Configuration](#blockform-for-configuration)
5. [blockSubmit() for Saving Config](#blocksubmit-for-saving-config)
6. [Rendering hx- Components in Blocks](#rendering-hx--components-in-blocks)
7. [Configuration to Component Properties](#configuration-to-component-properties)
8. [Cache Control for Blocks](#cache-control-for-blocks)
9. [Complete Example: hx-alert Block](#complete-example-hx-alert-block)
10. [Advanced Patterns](#advanced-patterns)
11. [Best Practices](#best-practices)

---

## Block Plugin Architecture Overview

### What is a Block Plugin?

In Drupal, a **Block Plugin** is a reusable chunk of content or functionality that can be placed in any region of a page layout. Blocks are discovered via Drupal's plugin system through annotations and extend the `BlockBase` class.

**Key characteristics:**

- **Annotation-based discovery** - Drupal scans modules for `@Block` annotations
- **Configuration storage** - Block settings are stored in the Drupal configuration system
- **Render arrays** - `build()` returns a structured array that Drupal's render pipeline processes
- **Cache metadata** - Blocks declare cache tags, contexts, and max-age for performance
- **Access control** - Blocks can implement access checks based on permissions or context

### Why Block Plugins for HELIX Components?

Block plugins provide an ideal bridge between Drupal's content management capabilities and HELIX's component-based UI:

**Configuration UI** - Site builders get a form-based interface for configuring component properties (variant, size, dismissible) without touching code.

**Reusability** - The same block plugin can be placed in multiple regions across different pages with different configurations.

**Layout Builder integration** - Blocks work seamlessly with Drupal's Layout Builder, allowing drag-and-drop component placement.

**Cache integration** - Drupal's render cache automatically optimizes component rendering based on declared cache metadata.

**Permission boundaries** - Block access control ensures components only render for users with appropriate permissions.

### Block Plugin Lifecycle

```
1. Discovery
   └─> Drupal scans @Block annotations
       └─> Plugin definition cached

2. Configuration (optional)
   └─> blockForm() renders configuration UI
       └─> blockValidate() checks input
           └─> blockSubmit() saves configuration

3. Rendering
   └─> build() returns render array
       └─> Drupal applies caching
           └─> Template renders HTML
               └─> HELIX component hydrates in browser

4. Cache invalidation
   └─> Cache tags trigger rebuild when content changes
```

---

## BlockBase Extension

Every custom Block plugin extends `Drupal\Core\Block\BlockBase` and implements the `BlockPluginInterface`. The base class provides scaffolding for configuration, access control, and rendering.

### Minimal Block Plugin Structure

```php
<?php

namespace Drupal\mymodule\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * Provides a simple HELIX component block.
 *
 * @Block(
 *   id = "mymodule_simple_block",
 *   admin_label = @Translation("Simple HELIX Block"),
 *   category = @Translation("HELIX Components"),
 * )
 */
class SimpleHelixBlock extends BlockBase {

  /**
   * {@inheritdoc}
   */
  public function build() {
    return [
      '#type' => 'markup',
      '#markup' => '<hx-button variant="primary">Click Me</hx-button>',
      '#attached' => [
        'library' => [
          'mymodule/hx-button',
        ],
      ],
    ];
  }

}
```

### Annotation Breakdown

The `@Block` annotation tells Drupal's plugin system about your block:

**id** - Unique machine name for this block (namespace it with your module)

**admin_label** - Human-readable name shown in the block placement UI

**category** - Groups blocks in the admin UI (e.g., "HELIX Components", "Layout", "Navigation")

**context_definitions** (optional) - Declares required context like current user or node

**forms** (optional) - Custom form classes for complex configuration

---

## The build() Method

The `build()` method is the core of your block plugin. It returns a Drupal **render array** that describes the structure, content, and metadata for this block instance.

### Render Array Structure

Drupal render arrays are associative PHP arrays with special keys:

```php
return [
  // Render element type
  '#type' => 'inline_template',

  // Template string with Twig syntax
  '#template' => '<hx-card variant="{{ variant }}">{{ content }}</hx-card>',

  // Variables passed to template
  '#context' => [
    'variant' => $this->configuration['variant'] ?? 'default',
    'content' => $this->configuration['content'] ?? '',
  ],

  // Attach libraries (CSS/JS)
  '#attached' => [
    'library' => [
      'mymodule/hx-card',
    ],
  ],

  // Cache metadata
  '#cache' => [
    'keys' => ['mymodule', 'hx_card_block', $this->configuration['variant']],
    'contexts' => ['url.path'],
    'tags' => ['config:block.block.' . $this->getDerivativeId()],
    'max-age' => 3600, // 1 hour
  ],
];
```

### Common Render Array Element Types

**`#type => 'markup'`** - Simple HTML string (not sanitized - use with caution)

**`#type => 'inline_template'`** - Inline Twig template with `#context` variables

**`#type => 'processed_text'`** - Text run through Drupal's text format filters

**`#type => 'container'`** - Wrapper div with children

**`#theme => 'custom_theme_hook'`** - Custom template file via hook_theme()

### Attaching Libraries

Every HELIX component requires its JavaScript to be loaded. Use `#attached` to declare library dependencies:

```php
'#attached' => [
  'library' => [
    'mymodule/hx-alert',     // Loads hx-alert web component
    'mymodule/hx-button',    // Loads hx-button (if used in slot)
  ],
  'drupalSettings' => [
    'mymodule' => [
      'apiEndpoint' => '/api/alerts',
    ],
  ],
],
```

These libraries are defined in `mymodule.libraries.yml`:

```yaml
hx-alert:
  js:
    js/components/hx-alert.js:
      attributes:
        type: module
  dependencies:
    - core/once
```

---

## blockForm() for Configuration

The `blockForm()` method generates a configuration form shown when site builders place or configure your block. This form maps to component properties.

### Method Signature

```php
/**
 * {@inheritdoc}
 */
public function blockForm($form, FormStateInterface $form_state) {
  $form = parent::blockForm($form, $form_state);

  // Add custom form elements here
  // Return $form array

  return $form;
}
```

### Form API Elements

Drupal's Form API provides rich field types that map cleanly to component properties:

```php
// Text field for simple strings
$form['heading'] = [
  '#type' => 'textfield',
  '#title' => $this->t('Heading'),
  '#default_value' => $this->configuration['heading'] ?? '',
  '#maxlength' => 255,
  '#required' => TRUE,
];

// Select dropdown for variant property
$form['variant'] = [
  '#type' => 'select',
  '#title' => $this->t('Alert Variant'),
  '#options' => [
    'info' => $this->t('Info'),
    'success' => $this->t('Success'),
    'warning' => $this->t('Warning'),
    'error' => $this->t('Error'),
  ],
  '#default_value' => $this->configuration['variant'] ?? 'info',
  '#required' => TRUE,
];

// Checkbox for boolean properties
$form['closable'] = [
  '#type' => 'checkbox',
  '#title' => $this->t('Allow users to dismiss'),
  '#default_value' => $this->configuration['closable'] ?? FALSE,
];

// Textarea for message content
$form['message'] = [
  '#type' => 'textarea',
  '#title' => $this->t('Message'),
  '#default_value' => $this->configuration['message'] ?? '',
  '#rows' => 3,
  '#required' => TRUE,
];

// Text format field (filtered HTML)
$form['body'] = [
  '#type' => 'text_format',
  '#title' => $this->t('Body Content'),
  '#format' => $this->configuration['body']['format'] ?? 'basic_html',
  '#default_value' => $this->configuration['body']['value'] ?? '',
];

// Number field for numeric properties
$form['max_items'] = [
  '#type' => 'number',
  '#title' => $this->t('Maximum Items'),
  '#default_value' => $this->configuration['max_items'] ?? 3,
  '#min' => 1,
  '#max' => 10,
];

// Radios for mutually exclusive options
$form['size'] = [
  '#type' => 'radios',
  '#title' => $this->t('Size'),
  '#options' => [
    'sm' => $this->t('Small'),
    'md' => $this->t('Medium'),
    'lg' => $this->t('Large'),
  ],
  '#default_value' => $this->configuration['size'] ?? 'md',
];

// Entity autocomplete for content references
$form['node'] = [
  '#type' => 'entity_autocomplete',
  '#target_type' => 'node',
  '#title' => $this->t('Referenced Node'),
  '#default_value' => $this->configuration['node'] ?? NULL,
  '#selection_settings' => [
    'target_bundles' => ['article'],
  ],
];
```

### Conditional Fields

Use `#states` to show/hide fields based on other field values:

```php
$form['variant'] = [
  '#type' => 'select',
  '#title' => $this->t('Variant'),
  '#options' => [
    'info' => $this->t('Info'),
    'error' => $this->t('Error'),
  ],
  '#default_value' => $this->configuration['variant'] ?? 'info',
];

$form['error_details'] = [
  '#type' => 'textarea',
  '#title' => $this->t('Error Details'),
  '#default_value' => $this->configuration['error_details'] ?? '',
  '#states' => [
    'visible' => [
      ':input[name="settings[variant]"]' => ['value' => 'error'],
    ],
    'required' => [
      ':input[name="settings[variant]"]' => ['value' => 'error'],
    ],
  ],
];
```

---

## blockSubmit() for Saving Config

The `blockSubmit()` method processes form submissions and saves configuration values. Called after `blockValidate()` passes.

### Method Signature

```php
/**
 * {@inheritdoc}
 */
public function blockSubmit($form, FormStateInterface $form_state) {
  parent::blockSubmit($form, $form_state);

  // Extract values from form state
  $this->configuration['variant'] = $form_state->getValue('variant');
  $this->configuration['closable'] = $form_state->getValue('closable');
  $this->configuration['message'] = $form_state->getValue('message');

  // For text_format fields, extract value and format
  $body = $form_state->getValue('body');
  $this->configuration['body'] = [
    'value' => $body['value'],
    'format' => $body['format'],
  ];

  // For entity references, extract ID
  $node = $form_state->getValue('node');
  if ($node) {
    $this->configuration['node_id'] = $node->id();
  }
}
```

### Default Configuration

Override `defaultConfiguration()` to provide sensible defaults:

```php
/**
 * {@inheritdoc}
 */
public function defaultConfiguration() {
  return [
    'variant' => 'info',
    'closable' => FALSE,
    'message' => '',
    'body' => [
      'value' => '',
      'format' => 'basic_html',
    ],
  ] + parent::defaultConfiguration();
}
```

### blockValidate() for Input Validation

Add custom validation logic before values are saved:

```php
/**
 * {@inheritdoc}
 */
public function blockValidate($form, FormStateInterface $form_state) {
  $message = $form_state->getValue('message');

  if (strlen($message) < 10) {
    $form_state->setErrorByName('message', $this->t('Message must be at least 10 characters.'));
  }

  if (strpos($message, '<script>') !== FALSE) {
    $form_state->setErrorByName('message', $this->t('Message cannot contain script tags.'));
  }
}
```

---

## Rendering hx- Components in Blocks

### Inline Template Approach

For simple blocks, use `#type => 'inline_template'`:

```php
public function build() {
  return [
    '#type' => 'inline_template',
    '#template' => '
      <hx-alert
        variant="{{ variant }}"
        {% if closable %}closable{% endif %}
        open
      >
        {{ message }}
      </hx-alert>
    ',
    '#context' => [
      'variant' => $this->configuration['variant'],
      'closable' => $this->configuration['closable'],
      'message' => $this->configuration['message'],
    ],
    '#attached' => [
      'library' => ['mymodule/hx-alert'],
    ],
  ];
}
```

### Custom Theme Hook Approach

For complex blocks, define a theme hook in `mymodule.module`:

```php
/**
 * Implements hook_theme().
 */
function mymodule_theme($existing, $type, $theme, $path) {
  return [
    'mymodule_alert_block' => [
      'variables' => [
        'variant' => 'info',
        'closable' => FALSE,
        'message' => '',
        'actions' => NULL,
      ],
    ],
  ];
}
```

Create template file `templates/mymodule-alert-block.html.twig`:

```twig
<hx-alert
  variant="{{ variant }}"
  {% if closable %}closable{% endif %}
  open
>
  {{ message }}
  {% if actions %}
    <div slot="actions">
      {{ actions }}
    </div>
  {% endif %}
</hx-alert>
```

Render in `build()`:

```php
public function build() {
  return [
    '#theme' => 'mymodule_alert_block',
    '#variant' => $this->configuration['variant'],
    '#closable' => $this->configuration['closable'],
    '#message' => $this->configuration['message'],
    '#actions' => $this->buildActions(),
    '#attached' => [
      'library' => ['mymodule/hx-alert'],
    ],
  ];
}

private function buildActions() {
  return [
    '#type' => 'inline_template',
    '#template' => '<hx-button variant="text">Learn More</hx-button>',
  ];
}
```

### Processed Text Rendering

For user-entered HTML content, use `#type => 'processed_text'`:

```php
public function build() {
  $body = $this->configuration['body'];

  return [
    '#type' => 'inline_template',
    '#template' => '
      <hx-card variant="{{ variant }}">
        <h2 slot="heading">{{ heading }}</h2>
        <div>{{ body }}</div>
      </hx-card>
    ',
    '#context' => [
      'variant' => $this->configuration['variant'],
      'heading' => $this->configuration['heading'],
      'body' => [
        '#type' => 'processed_text',
        '#text' => $body['value'],
        '#format' => $body['format'],
      ],
    ],
    '#attached' => [
      'library' => ['mymodule/hx-card'],
    ],
  ];
}
```

---

## Configuration to Component Properties

### Mapping Strategy

Block configuration values map directly to HELIX component HTML attributes:

| Block Config Type     | Component Property                | TWIG Rendering                  |
| --------------------- | --------------------------------- | ------------------------------- |
| String (textfield)    | String attribute                  | `attr="{{ value }}"`            |
| Boolean (checkbox)    | Boolean attribute                 | `{% if value %}attr{% endif %}` |
| Number (number field) | Numeric attribute                 | `attr="{{ value }}"`            |
| Select (dropdown)     | Enum string                       | `variant="{{ variant }}"`       |
| Text format           | Slot content                      | `<div>{{ value }}</div>`        |
| Entity reference      | Component property via data fetch | `href="{{ node.url }}"`         |

### Example Mappings

**Alert Block Configuration:**

```php
// blockForm()
$form['variant'] = [
  '#type' => 'select',
  '#options' => ['info', 'success', 'warning', 'error'],
  '#default_value' => $this->configuration['variant'] ?? 'info',
];

$form['closable'] = [
  '#type' => 'checkbox',
  '#default_value' => $this->configuration['closable'] ?? FALSE,
];

$form['message'] = [
  '#type' => 'textarea',
  '#default_value' => $this->configuration['message'] ?? '',
];
```

**Component Rendering:**

```twig
<hx-alert
  variant="{{ variant }}"
  {% if closable %}closable{% endif %}
  open
>
  {{ message }}
</hx-alert>
```

### Loading Referenced Entities

If your block references nodes, terms, or media, load them in `build()`:

```php
public function build() {
  $node_id = $this->configuration['node_id'] ?? NULL;

  if (!$node_id) {
    return ['#markup' => $this->t('No content selected.')];
  }

  $node = \Drupal::entityTypeManager()
    ->getStorage('node')
    ->load($node_id);

  if (!$node || !$node->access('view')) {
    return ['#markup' => ''];
  }

  return [
    '#type' => 'inline_template',
    '#template' => '
      <hx-card
        heading="{{ title }}"
        href="{{ url }}"
        variant="featured"
      >
        <div slot="media">
          {{ image }}
        </div>
        {{ summary }}
      </hx-card>
    ',
    '#context' => [
      'title' => $node->label(),
      'url' => $node->toUrl()->toString(),
      'image' => $this->renderNodeField($node, 'field_image'),
      'summary' => $this->renderNodeField($node, 'body', 'summary'),
    ],
    '#attached' => [
      'library' => ['mymodule/hx-card'],
    ],
    '#cache' => [
      'tags' => $node->getCacheTags(),
      'contexts' => ['user.permissions'],
    ],
  ];
}

private function renderNodeField($node, $field_name, $view_mode = 'default') {
  if (!$node->hasField($field_name) || $node->get($field_name)->isEmpty()) {
    return '';
  }

  $view_builder = \Drupal::entityTypeManager()->getViewBuilder('node');
  return $view_builder->viewField($node->get($field_name), $view_mode);
}
```

---

## Cache Control for Blocks

Drupal's render cache system dramatically improves performance by storing rendered HTML and reusing it until invalidation conditions are met. Blocks must declare cache metadata in the `build()` return array.

### Cache Metadata Keys

**`keys`** - Unique identifier for this cached item (includes block ID and variant values)

**`contexts`** - Cache varies by these contexts (URL path, user role, language)

**`tags`** - Cache is invalidated when any of these tags are cleared (entity IDs, config names)

**`max-age`** - Time in seconds before cache expires (use `Cache::PERMANENT` for indefinite)

### Example Cache Metadata

```php
use Drupal\Core\Cache\Cache;

public function build() {
  return [
    '#type' => 'inline_template',
    '#template' => '<hx-alert variant="{{ variant }}">{{ message }}</hx-alert>',
    '#context' => [
      'variant' => $this->configuration['variant'],
      'message' => $this->configuration['message'],
    ],
    '#attached' => [
      'library' => ['mymodule/hx-alert'],
    ],
    '#cache' => [
      // Unique cache key including block config
      'keys' => [
        'mymodule',
        'alert_block',
        $this->configuration['variant'],
      ],

      // Cache varies by URL path and user permissions
      'contexts' => [
        'url.path',
        'user.permissions',
      ],

      // Invalidate when block config changes
      'tags' => [
        'config:block.block.' . $this->getDerivativeId(),
      ],

      // Cache for 1 hour (3600 seconds)
      'max-age' => 3600,
    ],
  ];
}
```

### Cache Tags for Entity-Based Blocks

When rendering entity content, add entity cache tags:

```php
$node = \Drupal::entityTypeManager()->getStorage('node')->load($node_id);

return [
  // ... render array
  '#cache' => [
    'tags' => Cache::mergeTags(
      ['config:block.block.' . $this->getDerivativeId()],
      $node->getCacheTags()  // e.g., ['node:123']
    ),
    'contexts' => ['user.permissions'],
    'max-age' => Cache::PERMANENT,
  ],
];
```

### Cache Contexts Reference

- **`url`** - Full URL (path + query string)
- **`url.path`** - URL path only (ignores query parameters)
- **`url.query_args`** - Specific query parameters
- **`user`** - Current user ID
- **`user.permissions`** - User's permission set
- **`user.roles`** - User's role IDs
- **`languages:language_interface`** - Current interface language
- **`theme`** - Active theme
- **`timezone`** - User's timezone setting

---

## Complete Example: hx-alert Block

Here's a production-ready Block plugin that renders an `hx-alert` component with full configuration, validation, caching, and library attachment.

### File Structure

```
modules/custom/mymodule/
├── mymodule.info.yml
├── mymodule.libraries.yml
└── src/
    └── Plugin/
        └── Block/
            └── HelixAlertBlock.php
```

### mymodule.info.yml

```yaml
name: 'My Module'
type: module
description: 'HELIX component blocks'
core_version_requirement: ^10 || ^11
package: 'HELIX'
```

### mymodule.libraries.yml

```yaml
hx-alert:
  js:
    https://cdn.example.com/@helixui/library/dist/hx-alert.js:
      type: external
      attributes:
        type: module
  dependencies:
    - core/once

hx-button:
  js:
    https://cdn.example.com/@helixui/library/dist/hx-button.js:
      type: external
      attributes:
        type: module
  dependencies:
    - core/once
```

### src/Plugin/Block/HelixAlertBlock.php

```php
<?php

namespace Drupal\mymodule\Plugin\Block;

use Drupal\Core\Block\BlockBase;
use Drupal\Core\Cache\Cache;
use Drupal\Core\Form\FormStateInterface;

/**
 * Provides a configurable HELIX Alert component block.
 *
 * @Block(
 *   id = "mymodule_helix_alert",
 *   admin_label = @Translation("HELIX Alert"),
 *   category = @Translation("HELIX Components"),
 * )
 */
class HelixAlertBlock extends BlockBase {

  /**
   * {@inheritdoc}
   */
  public function defaultConfiguration() {
    return [
      'variant' => 'info',
      'closable' => FALSE,
      'heading' => '',
      'message' => '',
      'show_action' => FALSE,
      'action_text' => '',
      'action_url' => '',
    ] + parent::defaultConfiguration();
  }

  /**
   * {@inheritdoc}
   */
  public function blockForm($form, FormStateInterface $form_state) {
    $form = parent::blockForm($form, $form_state);

    $form['variant'] = [
      '#type' => 'select',
      '#title' => $this->t('Alert Variant'),
      '#description' => $this->t('Visual style and semantic meaning of the alert.'),
      '#options' => [
        'info' => $this->t('Info'),
        'success' => $this->t('Success'),
        'warning' => $this->t('Warning'),
        'error' => $this->t('Error'),
      ],
      '#default_value' => $this->configuration['variant'],
      '#required' => TRUE,
    ];

    $form['closable'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Allow users to dismiss'),
      '#description' => $this->t('Show a close button that hides the alert when clicked.'),
      '#default_value' => $this->configuration['closable'],
    ];

    $form['heading'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Heading'),
      '#description' => $this->t('Optional heading text shown above the message.'),
      '#default_value' => $this->configuration['heading'],
      '#maxlength' => 255,
    ];

    $form['message'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Message'),
      '#description' => $this->t('The main alert message text.'),
      '#default_value' => $this->configuration['message'],
      '#rows' => 3,
      '#required' => TRUE,
    ];

    $form['action_group'] = [
      '#type' => 'details',
      '#title' => $this->t('Action Button'),
      '#open' => $this->configuration['show_action'],
    ];

    $form['action_group']['show_action'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Show action button'),
      '#default_value' => $this->configuration['show_action'],
    ];

    $form['action_group']['action_text'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Button Text'),
      '#default_value' => $this->configuration['action_text'],
      '#maxlength' => 100,
      '#states' => [
        'required' => [
          ':input[name="settings[action_group][show_action]"]' => ['checked' => TRUE],
        ],
        'visible' => [
          ':input[name="settings[action_group][show_action]"]' => ['checked' => TRUE],
        ],
      ],
    ];

    $form['action_group']['action_url'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Button URL'),
      '#description' => $this->t('Destination URL for the action button (e.g., /contact, https://example.com).'),
      '#default_value' => $this->configuration['action_url'],
      '#maxlength' => 2048,
      '#states' => [
        'required' => [
          ':input[name="settings[action_group][show_action]"]' => ['checked' => TRUE],
        ],
        'visible' => [
          ':input[name="settings[action_group][show_action]"]' => ['checked' => TRUE],
        ],
      ],
    ];

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function blockValidate($form, FormStateInterface $form_state) {
    $message = $form_state->getValue('message');

    // Message length validation
    if (strlen($message) < 10) {
      $form_state->setErrorByName(
        'message',
        $this->t('Message must be at least 10 characters long.')
      );
    }

    // Action button validation
    $show_action = $form_state->getValue(['action_group', 'show_action']);
    if ($show_action) {
      $action_text = $form_state->getValue(['action_group', 'action_text']);
      $action_url = $form_state->getValue(['action_group', 'action_url']);

      if (empty($action_text)) {
        $form_state->setErrorByName(
          'action_group][action_text',
          $this->t('Button text is required when action button is enabled.')
        );
      }

      if (empty($action_url)) {
        $form_state->setErrorByName(
          'action_group][action_url',
          $this->t('Button URL is required when action button is enabled.')
        );
      }
    }
  }

  /**
   * {@inheritdoc}
   */
  public function blockSubmit($form, FormStateInterface $form_state) {
    parent::blockSubmit($form, $form_state);

    $this->configuration['variant'] = $form_state->getValue('variant');
    $this->configuration['closable'] = $form_state->getValue('closable');
    $this->configuration['heading'] = $form_state->getValue('heading');
    $this->configuration['message'] = $form_state->getValue('message');

    $this->configuration['show_action'] = $form_state->getValue(['action_group', 'show_action']);
    $this->configuration['action_text'] = $form_state->getValue(['action_group', 'action_text']);
    $this->configuration['action_url'] = $form_state->getValue(['action_group', 'action_url']);
  }

  /**
   * {@inheritdoc}
   */
  public function build() {
    $config = $this->configuration;

    // Build libraries array
    $libraries = ['mymodule/hx-alert'];
    if ($config['show_action']) {
      $libraries[] = 'mymodule/hx-button';
    }

    // Build template context
    $context = [
      'variant' => $config['variant'],
      'closable' => $config['closable'],
      'heading' => $config['heading'],
      'message' => $config['message'],
      'show_action' => $config['show_action'],
      'action_text' => $config['action_text'],
      'action_url' => $config['action_url'],
    ];

    return [
      '#type' => 'inline_template',
      '#template' => '
        <hx-alert
          variant="{{ variant }}"
          {% if closable %}closable{% endif %}
          open
        >
          {% if heading %}
            <strong>{{ heading }}</strong><br>
          {% endif %}
          {{ message }}
          {% if show_action %}
            <hx-button
              slot="actions"
              variant="text"
              href="{{ action_url }}"
            >
              {{ action_text }}
            </hx-button>
          {% endif %}
        </hx-alert>
      ',
      '#context' => $context,
      '#attached' => [
        'library' => $libraries,
      ],
      '#cache' => [
        'keys' => [
          'mymodule',
          'helix_alert_block',
          $config['variant'],
          $config['closable'] ? 'closable' : 'persistent',
          $config['show_action'] ? 'with_action' : 'no_action',
        ],
        'contexts' => [
          'url.path',
        ],
        'tags' => [
          'config:block.block.' . $this->getDerivativeId(),
        ],
        'max-age' => Cache::PERMANENT,
      ],
    ];
  }

}
```

### Usage in Layout Builder

1. Navigate to **Structure > Block layout**
2. Click **Place block** in desired region
3. Search for "HELIX Alert"
4. Configure variant, message, and options
5. Save block and layout

The block will render:

```html
<hx-alert variant="warning" closable open>
  <strong>Important Notice</strong><br />
  System maintenance is scheduled for tonight at 11 PM EST.
  <hx-button slot="actions" variant="text" href="/status"> View Status Page </hx-button>
</hx-alert>
```

---

## Advanced Patterns

### Context-Aware Blocks

Access current route context (node, user, term) in your block:

```php
use Drupal\Core\Plugin\ContextAwarePluginInterface;

/**
 * @Block(
 *   id = "mymodule_node_alert",
 *   admin_label = @Translation("Node Alert"),
 *   category = @Translation("HELIX Components"),
 *   context_definitions = {
 *     "node" = @ContextDefinition("entity:node", required = FALSE)
 *   }
 * )
 */
class NodeAlertBlock extends BlockBase implements ContextAwarePluginInterface {

  public function build() {
    $node = $this->getContextValue('node');

    if (!$node) {
      return [];
    }

    $variant = $node->hasField('field_alert_type')
      ? $node->get('field_alert_type')->value
      : 'info';

    $message = $node->hasField('field_alert_message')
      ? $node->get('field_alert_message')->value
      : '';

    return [
      '#type' => 'inline_template',
      '#template' => '<hx-alert variant="{{ variant }}">{{ message }}</hx-alert>',
      '#context' => [
        'variant' => $variant,
        'message' => $message,
      ],
      '#attached' => [
        'library' => ['mymodule/hx-alert'],
      ],
      '#cache' => [
        'tags' => $node->getCacheTags(),
        'contexts' => ['route'],
      ],
    ];
  }

}
```

### Dependency Injection

Inject services for testability and best practices:

```php
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

class AdvancedHelixBlock extends BlockBase implements ContainerFactoryPluginInterface {

  /**
   * The entity type manager.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entityTypeManager;

  /**
   * Constructs a new AdvancedHelixBlock.
   *
   * @param array $configuration
   *   Plugin configuration.
   * @param string $plugin_id
   *   Plugin ID.
   * @param mixed $plugin_definition
   *   Plugin definition.
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   Entity type manager service.
   */
  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    EntityTypeManagerInterface $entity_type_manager
  ) {
    parent::__construct($configuration, $plugin_id, $plugin_definition);
    $this->entityTypeManager = $entity_type_manager;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(
    ContainerInterface $container,
    array $configuration,
    $plugin_id,
    $plugin_definition
  ) {
    return new static(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->get('entity_type.manager')
    );
  }

  public function build() {
    $node_storage = $this->entityTypeManager->getStorage('node');
    $node = $node_storage->load($this->configuration['node_id']);

    // ... render logic
  }

}
```

### Access Control

Restrict block visibility based on permissions:

```php
use Drupal\Core\Access\AccessResult;
use Drupal\Core\Session\AccountInterface;

class RestrictedHelixBlock extends BlockBase {

  /**
   * {@inheritdoc}
   */
  protected function blockAccess(AccountInterface $account) {
    // Only show to users with specific permission
    return AccessResult::allowedIfHasPermission($account, 'view helix alerts');
  }

}
```

### Dynamic Library Attachment

Conditionally attach libraries based on configuration:

```php
public function build() {
  $libraries = ['mymodule/hx-card'];

  // Add additional libraries based on config
  if ($this->configuration['show_media']) {
    $libraries[] = 'mymodule/hx-image';
  }

  if ($this->configuration['show_actions']) {
    $libraries[] = 'mymodule/hx-button';
  }

  return [
    // ... render array
    '#attached' => [
      'library' => $libraries,
    ],
  ];
}
```

---

## Best Practices

### 1. Library Attachment Strategy

**Always attach component libraries** - Every HELIX component requires its JavaScript. Attach libraries in `#attached`, not in templates.

**Load only what you use** - Don't attach `hx-button` if no buttons are rendered. Build libraries array conditionally.

**Use library dependencies** - If `hx-card` always uses `hx-button`, declare it in `mymodule.libraries.yml` dependencies instead of attaching both.

### 2. Configuration Design

**Provide sensible defaults** - Block should render meaningfully even with zero configuration.

**Match component API** - Configuration form fields should map 1:1 to component properties where possible.

**Use Form API validation** - Validate input in `blockValidate()` before it reaches `blockSubmit()`.

**Group related settings** - Use `#type => 'details'` to organize complex configuration forms.

### 3. Cache Metadata

**Always declare cache metadata** - Missing cache metadata causes performance issues or stale content.

**Use entity cache tags** - When rendering entity data, merge entity cache tags into block cache tags.

**Choose appropriate max-age** - Use `Cache::PERMANENT` for static blocks, shorter durations for dynamic content.

**Vary by relevant contexts** - Only add cache contexts that actually affect rendering (avoid over-caching).

### 4. Template Organization

**Prefer theme hooks for complex blocks** - Inline templates are fine for simple markup, but complex blocks benefit from dedicated template files.

**Escape user input** - Drupal's template system auto-escapes, but verify untrusted content is sanitized.

**Use processed_text for rich content** - When rendering user-entered HTML, use `#type => 'processed_text'` to apply text format filters.

### 5. Accessibility

**Provide context for screen readers** - Alert variants set `role="alert"` and `aria-live` automatically, but verify other components have appropriate ARIA.

**Test keyboard navigation** - Ensure all interactive elements (buttons in action slots) are keyboard-accessible.

**Verify color contrast** - Don't rely solely on component defaults; test contrast in your theme.

### 6. Performance

**Minimize entity loads** - Cache loaded entities and avoid N+1 queries when rendering lists.

**Use view modes** - Render entity fields via view modes instead of hardcoding field names.

**Lazy-load heavy components** - Consider AJAX or IntersectionObserver patterns for blocks that render expensive content.

### 7. Testing

**Write functional tests** - Test block placement, configuration forms, and rendering output.

**Test cache invalidation** - Verify cache tags correctly invalidate when content changes.

**Test access control** - Ensure blocks respect permissions and access rules.

Example functional test:

```php
namespace Drupal\Tests\mymodule\Functional;

use Drupal\Tests\BrowserTestBase;

class HelixAlertBlockTest extends BrowserTestBase {

  protected static $modules = ['block', 'mymodule'];

  public function testAlertBlockRendering() {
    $this->drupalLogin($this->rootUser);

    // Place block
    $block = $this->drupalPlaceBlock('mymodule_helix_alert', [
      'variant' => 'warning',
      'message' => 'Test alert message',
      'closable' => TRUE,
    ]);

    // Visit page
    $this->drupalGet('<front>');

    // Verify component rendered
    $this->assertSession()->elementExists('css', 'hx-alert[variant="warning"]');
    $this->assertSession()->elementAttributeExists('css', 'hx-alert', 'closable');
    $this->assertSession()->pageTextContains('Test alert message');
  }

}
```

---

## Summary

Drupal Block plugins provide a powerful, flexible mechanism for rendering HELIX web components with site-builder-friendly configuration UIs. By extending `BlockBase`, implementing `blockForm()`, `blockSubmit()`, and `build()`, you create reusable component blocks that integrate seamlessly with Drupal's render cache, Layout Builder, and content architecture.

**Key takeaways:**

- Block configuration maps cleanly to component properties
- `build()` returns render arrays with `#attached` libraries
- Cache metadata (keys, tags, contexts, max-age) is critical for performance
- Template organization scales from inline templates to theme hooks
- Drupal's Form API provides rich configuration UIs with validation
- Entity references and context awareness enable dynamic content rendering

For next steps, explore Views integration for component-based list rendering, field formatters for entity display customization, and Single Directory Components (SDC) for component library integration.

---

## Additional Resources

- [Drupal Block Plugin API](https://www.drupal.org/docs/drupal-apis/plugin-api/block-api) - Official Drupal documentation
- [Form API Reference](https://api.drupal.org/api/drupal/elements) - Complete form element types
- [Cache API](https://www.drupal.org/docs/drupal-apis/cache-api) - Cache tags, contexts, and max-age
- [HELIX Component API](/components/) - Component property and slot reference
- [TWIG Patterns](/drupal-integration/twig/) - Template integration examples
- [Drupal Behaviors](/drupal-integration/behaviors/) - JavaScript event handling

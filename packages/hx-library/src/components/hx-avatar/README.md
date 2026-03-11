# hx-avatar — Drupal Integration Guide

## Overview

`hx-avatar` is a server-side-renderable web component. The `initials`, `alt`, `label`, and `hx-size` attributes are all plain HTML attributes that Twig can set directly — no JavaScript required for the initial render.

## Basic Twig Usage

```twig
{# Fallback icon (anonymous user) #}
<hx-avatar label="Anonymous user"></hx-avatar>

{# Initials fallback — most common server-side pattern #}
<hx-avatar
  initials="{{ user.initials }}"
  label="{{ user.display_name }}"
></hx-avatar>

{# Image with initials fallback — image loads client-side; initials render immediately #}
<hx-avatar
  src="{{ user.avatar_url }}"
  alt="{{ user.display_name }}"
  initials="{{ user.initials }}"
></hx-avatar>
```

## Attribute Reference

| Attribute  | Type                              | Default    | Notes                                                                                 |
|------------|-----------------------------------|------------|---------------------------------------------------------------------------------------|
| `src`      | `string`                          | —          | Image URL. Loaded client-side. If omitted or broken, initials/icon renders instead.  |
| `alt`      | `string`                          | `""`       | **Required when `src` is set.** Accessible label for the image.                      |
| `label`    | `string`                          | `""`       | Human-readable name for non-image states. Use full name, not initials abbreviations.  |
| `initials` | `string`                          | `""`       | 2–3 character fallback shown when no image. Computed server-side from user name.      |
| `hx-size`  | `xs \| sm \| md \| lg \| xl`      | `md`       | Note the hyphen — requires quoting in Twig attribute maps (see below).               |
| `shape`    | `circle \| square`                | `circle`   | Circle for people; square for system/role avatars.                                    |

## Size Attribute — Twig Quoting

The `hx-size` attribute name contains a hyphen, which requires explicit quoting in Twig
`create_attribute()` maps:

```twig
{# Correct: quoted key #}
{{ create_attribute({'hx-size': 'lg', 'initials': user.initials}) }}

{# In a full element #}
<hx-avatar
  {{ create_attribute({
    'hx-size': 'lg',
    'shape': 'circle',
    'initials': user.initials,
    'label': user.display_name,
  }) }}
></hx-avatar>
```

## Fallback Chain — Server-Side Strategy

The component resolves content in this order:

1. **Slotted content** (default slot) — full override
2. **Image** (`src` loads successfully)
3. **Initials** (`initials` attribute, non-empty)
4. **Fallback icon** (generic person silhouette)

For server-rendered pages, always provide `initials` when a user entity is available so the
avatar renders meaningful content before JavaScript loads:

```twig
{%- set initials = '' -%}
{%- if user.first_name and user.last_name -%}
  {%- set initials = user.first_name|first ~ user.last_name|first -%}
{%- elseif user.display_name -%}
  {%- set initials = user.display_name|split(' ')|map(w => w|first)|join('')|slice(0, 2) -%}
{%- endif -%}

<hx-avatar
  {% if user.avatar_url %}src="{{ user.avatar_url }}" alt="{{ user.display_name }}"{% endif %}
  initials="{{ initials|upper }}"
  label="{{ user.display_name }}"
></hx-avatar>
```

## Badge Slot (Status Indicators)

The badge renders outside the avatar's `overflow: hidden` clip boundary, so status dot borders
display correctly without being clipped.

```twig
<hx-avatar
  src="{{ clinician.avatar_url }}"
  alt="{{ clinician.name }}"
  initials="{{ clinician.initials }}"
  hx-size="lg"
>
  {% if clinician.is_available %}
    <span
      slot="badge"
      class="availability-dot availability-dot--available"
      aria-label="Available"
    ></span>
  {% endif %}
</hx-avatar>
```

## Accessibility Notes

- **Always set `alt`** when `src` is provided. Without it, screen readers announce "Avatar" — meaningless in a healthcare EHR.
- **Use `label`** for initials and icon states to provide the full person name. `initials="JD"` announces as "J D" (two letters); `label="Dr. Jane Doe"` announces the full name.
- **Decorative avatars** (e.g., in a table row that already announces the name) can set `label=""` and `alt=""`, but confirm with an accessibility audit that the surrounding context provides sufficient identification.

## Size Reference

| Value | Size     | Use case                          |
|-------|----------|-----------------------------------|
| `xs`  | 1.5rem   | Dense lists, inline mentions      |
| `sm`  | 2rem     | Compact table rows                |
| `md`  | 2.5rem   | Default — most contexts           |
| `lg`  | 3rem     | Card headers, sidebar profiles    |
| `xl`  | 4rem     | Profile pages, modal headers      |

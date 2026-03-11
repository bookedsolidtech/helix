/**
 * Manual snippet overrides for curated, real-world blog/content site examples.
 *
 * These override the auto-generated CEM snippets for specific components
 * where a hand-crafted example is more instructive than the generic output.
 *
 * To add an override:
 *  1. Add the tag name as a key.
 *  2. Provide code strings for any subset of frameworks.
 *  3. Omitted frameworks fall back to auto-generated snippets.
 *
 * New components that are NOT listed here still get full auto-generated
 * snippets from the CEM — zero maintenance required.
 */

import type { SnippetFramework } from '@/lib/snippet-generator';

export type SnippetOverrideMap = Record<string, Partial<Record<SnippetFramework, string>>>;

export const snippetOverrides: SnippetOverrideMap = {
  // ── hx-button ────────────────────────────────────────────────────
  'hx-button': {
    html: `<!-- Primary action: publish a blog post -->
<hx-button
  variant="primary"
  type="submit"
>
  Publish Article
</hx-button>

<!-- Secondary action alongside primary -->
<hx-button variant="secondary">
  Save as Draft
</hx-button>

<!-- Disabled state while form is submitting -->
<hx-button variant="primary" disabled>
  Publishing...
</hx-button>

<!-- Ghost variant for tertiary actions -->
<hx-button variant="ghost" hx-size="sm">
  Cancel
</hx-button>

<script>
  document.querySelector('hx-button')
    .addEventListener('hx-click', (e) => {
      console.log('Button clicked', e.detail.originalEvent);
    });
</script>`,

    react: `import { HxButton } from '@helixui/library/react';

function ArticleForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: CustomEvent<{originalEvent: MouseEvent}>) => {
    setIsSubmitting(true);
    publishArticle().finally(() => setIsSubmitting(false));
  };

  return (
    <form>
      {/* ...form fields... */}
      <div className="button-group">
        <HxButton
          variant="primary"
          type="submit"
          disabled={isSubmitting}
          onHxClick={handleSubmit}
        >
          {isSubmitting ? 'Publishing...' : 'Publish Article'}
        </HxButton>
        <HxButton variant="secondary">
          Save as Draft
        </HxButton>
        <HxButton variant="ghost" size="sm">
          Cancel
        </HxButton>
      </div>
    </form>
  );
}`,

    drupal: `{#
/**
 * @file
 * Theme override for the article publish button.
 *
 * Available variables:
 * - button_label: The button text (translatable).
 * - button_variant: 'primary' | 'secondary' | 'ghost'.
 * - is_disabled: Whether the button is disabled.
 * - button_type: Form button type ('button' | 'submit' | 'reset').
 */
#}

{{ attach_library('helix_button/component') }}

<hx-button
  variant="{{ button_variant|default('primary') }}"
  type="{{ button_type|default('submit') }}"
  {% if is_disabled %}disabled{% endif %}
>
  {{ button_label|default('Submit')|t }}
</hx-button>

{# Preprocess example: #}
{# function helix_button_preprocess_publish_button(&$variables) { #}
{#   $variables['button_label'] = t('Publish Article'); #}
{#   $variables['button_variant'] = 'primary'; #}
{#   $variables['is_disabled'] = $form_state->isSubmitting(); #}
{# } #}`,
  },

  // ── hx-text-input ────────────────────────────────────────────────
  'hx-text-input': {
    html: `<!-- Author name input with validation -->
<hx-text-input
  label="Author Name"
  name="author-name"
  placeholder="e.g., Sarah Chen"
  help-text="Enter the author's display name as it will appear on published articles."
  required
></hx-text-input>

<!-- Input in error state -->
<hx-text-input
  label="Article Slug"
  name="slug"
  placeholder="my-article-title"
  error="Slug must contain only lowercase letters, numbers, and hyphens."
  required
></hx-text-input>

<!-- Email type for editor contact -->
<hx-text-input
  label="Editor Email"
  name="editor-email"
  type="email"
  placeholder="editor@example.org"
></hx-text-input>

<script>
  const nameInput = document.querySelector('hx-text-input[name="author-name"]');
  nameInput.addEventListener('hx-change', (e) => {
    console.log('Author name:', e.detail.value);
  });
  nameInput.addEventListener('hx-input', (e) => {
    // Real-time validation as user types
    validateAuthorName(e.detail.value);
  });
</script>`,

    react: `import { HxTextInput } from '@helixui/library/react';

function AuthorProfile() {
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');

  const handleNameChange = (e: CustomEvent<{value: string}>) => {
    const value = e.detail.value;
    setName(value);

    if (!value.trim()) {
      setNameError('Author name is required.');
    } else if (value.length < 2) {
      setNameError('Name must be at least 2 characters.');
    } else {
      setNameError('');
    }
  };

  return (
    <form>
      <HxTextInput
        label="Author Name"
        name="author-name"
        placeholder="e.g., Sarah Chen"
        helpText="Display name shown on published articles."
        value={name}
        error={nameError}
        required
        onHxChange={handleNameChange}
      />
      <HxTextInput
        label="Published Date"
        name="published-date"
        placeholder="MM/DD/YYYY"
        required
      />
      <HxTextInput
        label="Author Bio"
        name="author-bio"
        placeholder="A short author biography..."
        helpText="Displayed on the article byline."
      />
    </form>
  );
}`,
  },

  // ── hx-card ──────────────────────────────────────────────────────
  'hx-card': {
    html: `<!-- Article card with all slots -->
<hx-card variant="default" elevation="raised">
  <img slot="image"
    src="/images/featured-article.jpg"
    alt="Abstract illustration of modern web architecture"
  />
  <h3 slot="heading">Building Scalable Design Systems in 2026</h3>
  <p>
    Discover how leading organizations are adopting web components
    to create consistent, accessible user experiences across
    their digital platforms.
  </p>
  <small slot="footer">
    By Sarah Chen &middot; February 10, 2026 &middot; 8 min read
  </small>
  <div slot="actions">
    <hx-button variant="primary" hx-size="sm">Read More</hx-button>
    <hx-button variant="secondary" hx-size="sm">Bookmark</hx-button>
  </div>
</hx-card>

<!-- Clickable card linking to article detail -->
<hx-card
  variant="compact"
  elevation="flat"
  hx-href="/articles/web-components-best-practices"
>
  <h3 slot="heading">Web Components Best Practices for Enterprise Teams</h3>
  <p>By Marcus Rivera &middot; February 5, 2026</p>
</hx-card>`,
  },

  // ── hx-alert ─────────────────────────────────────────────────────
  'hx-alert': {
    html: `<!-- Warning — unsaved draft reminder -->
<hx-alert variant="warning" closable>
  You have an unsaved draft. Your changes to
  <strong>"Building Scalable Design Systems"</strong>
  have not been saved.
</hx-alert>

<!-- Success confirmation -->
<hx-alert variant="success">
  Your article has been published successfully and is now
  live on the site.
</hx-alert>

<!-- Error alert with action -->
<hx-alert variant="error">
  Unable to upload the featured image. The file exceeded
  the maximum allowed size of 5 MB.
  <hx-button slot="actions" variant="secondary" hx-size="sm">
    Retry
  </hx-button>
</hx-alert>

<!-- Informational notice -->
<hx-alert variant="info">
  New content guidelines have been published. Please review
  the updated editorial style guide before submitting articles.
</hx-alert>

<script>
  document.querySelector('hx-alert[closable]')
    .addEventListener('hx-close', (e) => {
      console.log('Alert dismissed:', e.detail.reason);
    });
</script>`,

    react: `import { HxAlert } from '@helixui/library/react';

function ContentAlerts({ article }) {
  const [showDraftWarning, setShowDraftWarning] = useState(true);

  return (
    <div className="alerts-stack">
      {/* Unsaved draft warning */}
      {article.hasUnsavedChanges && showDraftWarning && (
        <HxAlert
          variant="warning"
          closable
          onHxClose={() => setShowDraftWarning(false)}
        >
          You have unsaved changes to{' '}
          <strong>{article.title}</strong>.
          Save your draft to avoid losing work.
        </HxAlert>
      )}

      {/* Upload error */}
      {uploadFailed && (
        <HxAlert variant="error">
          Unable to upload the featured image. Please try again.
          <HxButton slot="actions" variant="secondary" size="sm">
            Retry
          </HxButton>
        </HxAlert>
      )}
    </div>
  );
}`,
  },

  // ── hx-select ────────────────────────────────────────────────────
  'hx-select': {
    html: `<!-- Category selector for article publishing -->
<hx-select
  label="Category"
  name="category"
  required
  help-text="Select the primary category for this article."
>
  <option value="">-- Select Category --</option>
  <option value="technology">Technology</option>
  <option value="wellness">Wellness</option>
  <option value="research">Research</option>
  <option value="community">Community</option>
  <option value="tutorials">Tutorials</option>
</hx-select>

<script>
  document.querySelector('hx-select')
    .addEventListener('hx-change', (e) => {
      console.log('Selected category:', e.detail.value);
    });
</script>`,
  },
};

/**
 * Returns the override map for a specific component, if one exists.
 */
export function getOverridesForComponent(
  tagName: string,
): Partial<Record<SnippetFramework, string>> | undefined {
  return snippetOverrides[tagName];
}

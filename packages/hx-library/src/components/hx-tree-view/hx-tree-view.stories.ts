import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, userEvent, within } from 'storybook/test';
import './hx-tree-view.js';
import './hx-tree-item.js';

// ─────────────────────────────────────────────────
// META CONFIGURATION
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Tree View',
  component: 'hx-tree-view',
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: { type: 'text' },
      description: 'Accessible label for the tree (aria-label).',
      table: {
        category: 'Accessibility',
        defaultValue: { summary: '' },
        type: { summary: 'string' },
      },
    },
    selection: {
      control: { type: 'select' },
      options: ['none', 'single', 'multiple'],
      description: 'Selection mode for the tree.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: 'none' },
        type: { summary: "'none' | 'single' | 'multiple'" },
      },
    },
  },
  args: {
    label: 'File browser',
    selection: 'single',
  },
  parameters: {
    docs: {
      description: {
        component:
          'A hierarchical tree component for navigating nested data structures. ' +
          'Supports expand/collapse with animation, single and multi-selection, ' +
          'and full keyboard navigation following WAI-ARIA tree patterns.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

// ─────────────────────────────────────────────────
// STORIES
// ─────────────────────────────────────────────────

export const Default: Story = {
  name: 'Default',
  render: (args) => html`
    <hx-tree-view label=${args['label']} selection=${args['selection']}>
      <hx-tree-item>Documents</hx-tree-item>
      <hx-tree-item>Downloads</hx-tree-item>
      <hx-tree-item>Pictures</hx-tree-item>
    </hx-tree-view>
  `,
};

export const WithNestedItems: Story = {
  name: 'Nested Items',
  render: (args) => html`
    <hx-tree-view label=${args['label']} selection=${args['selection']}>
      <hx-tree-item expanded>
        Documents
        <hx-tree-item slot="children">Reports</hx-tree-item>
        <hx-tree-item slot="children" expanded>
          Projects
          <hx-tree-item slot="children">Q1 Plan</hx-tree-item>
          <hx-tree-item slot="children">Q2 Plan</hx-tree-item>
        </hx-tree-item>
        <hx-tree-item slot="children">Invoices</hx-tree-item>
      </hx-tree-item>
      <hx-tree-item>Downloads</hx-tree-item>
      <hx-tree-item expanded>
        Pictures
        <hx-tree-item slot="children">2024</hx-tree-item>
        <hx-tree-item slot="children">2025</hx-tree-item>
      </hx-tree-item>
    </hx-tree-view>
  `,
};

export const SingleSelection: Story = {
  name: 'Single Selection',
  render: () => html`
    <hx-tree-view label="Departments" selection="single">
      <hx-tree-item expanded>
        Departments
        <hx-tree-item slot="children" selected>Cardiology</hx-tree-item>
        <hx-tree-item slot="children">Neurology</hx-tree-item>
        <hx-tree-item slot="children">Oncology</hx-tree-item>
      </hx-tree-item>
      <hx-tree-item expanded>
        Administration
        <hx-tree-item slot="children">Finance</hx-tree-item>
        <hx-tree-item slot="children">HR</hx-tree-item>
      </hx-tree-item>
    </hx-tree-view>
  `,
};

export const MultipleSelection: Story = {
  name: 'Multiple Selection',
  render: () => html`
    <hx-tree-view label="ICD-10 categories" selection="multiple">
      <hx-tree-item expanded>
        ICD-10 Categories
        <hx-tree-item slot="children" selected
          >A00-A09: Intestinal infectious diseases</hx-tree-item
        >
        <hx-tree-item slot="children" selected>A15-A19: Tuberculosis</hx-tree-item>
        <hx-tree-item slot="children">A20-A28: Certain zoonotic bacterial diseases</hx-tree-item>
        <hx-tree-item slot="children">A30-A49: Other bacterial diseases</hx-tree-item>
      </hx-tree-item>
    </hx-tree-view>
  `,
};

export const WithDisabledItems: Story = {
  name: 'Disabled Items',
  render: () => html`
    <hx-tree-view label="Organization structure" selection="single">
      <hx-tree-item expanded>
        Org Structure
        <hx-tree-item slot="children">Active Department</hx-tree-item>
        <hx-tree-item slot="children" disabled>Archived Department</hx-tree-item>
        <hx-tree-item slot="children">
          Subdepartment
          <hx-tree-item slot="children" disabled>Inactive Unit</hx-tree-item>
          <hx-tree-item slot="children">Active Unit</hx-tree-item>
        </hx-tree-item>
      </hx-tree-item>
    </hx-tree-view>
  `,
};

export const NoSelection: Story = {
  name: 'No Selection (Navigation Only)',
  render: () => html`
    <hx-tree-view label="Site navigation" selection="none">
      <hx-tree-item expanded>
        Navigation
        <hx-tree-item slot="children">Home</hx-tree-item>
        <hx-tree-item slot="children">About</hx-tree-item>
        <hx-tree-item slot="children" expanded>
          Services
          <hx-tree-item slot="children">Consulting</hx-tree-item>
          <hx-tree-item slot="children">Support</hx-tree-item>
        </hx-tree-item>
      </hx-tree-item>
    </hx-tree-view>
  `,
};

export const HealthcareDrugHierarchy: Story = {
  name: 'Healthcare: Drug Classification',
  render: () => html`
    <hx-tree-view label="Drug classification" selection="single">
      <hx-tree-item expanded>
        Cardiovascular Drugs
        <hx-tree-item slot="children" expanded>
          Antihypertensives
          <hx-tree-item slot="children">ACE Inhibitors</hx-tree-item>
          <hx-tree-item slot="children" selected>Beta Blockers</hx-tree-item>
          <hx-tree-item slot="children">Calcium Channel Blockers</hx-tree-item>
        </hx-tree-item>
        <hx-tree-item slot="children">
          Anticoagulants
          <hx-tree-item slot="children">Warfarin</hx-tree-item>
          <hx-tree-item slot="children">Heparin</hx-tree-item>
        </hx-tree-item>
      </hx-tree-item>
      <hx-tree-item>
        Antibiotics
        <hx-tree-item slot="children">Penicillins</hx-tree-item>
        <hx-tree-item slot="children">Cephalosporins</hx-tree-item>
        <hx-tree-item slot="children">Fluoroquinolones</hx-tree-item>
      </hx-tree-item>
    </hx-tree-view>
  `,
};

// ─────────────────────────────────────────────────
// WITH ICONS
// ─────────────────────────────────────────────────

export const WithIcons: Story = {
  name: 'With Icons',
  render: () => html`
    <hx-tree-view label="Patient records" selection="single">
      <hx-tree-item expanded>
        <span slot="icon" style="font-size: 1rem;">&#128193;</span>
        Patient Records
        <hx-tree-item slot="children">
          <span slot="icon" style="font-size: 1rem;">&#128196;</span>
          Admission Notes
        </hx-tree-item>
        <hx-tree-item slot="children" expanded>
          <span slot="icon" style="font-size: 1rem;">&#128193;</span>
          Lab Results
          <hx-tree-item slot="children">
            <span slot="icon" style="font-size: 1rem;">&#128196;</span>
            CBC Panel
          </hx-tree-item>
          <hx-tree-item slot="children">
            <span slot="icon" style="font-size: 1rem;">&#128196;</span>
            Metabolic Panel
          </hx-tree-item>
        </hx-tree-item>
        <hx-tree-item slot="children">
          <span slot="icon" style="font-size: 1rem;">&#128196;</span>
          Discharge Summary
        </hx-tree-item>
      </hx-tree-item>
    </hx-tree-view>
  `,
};

// ─────────────────────────────────────────────────
// DEEP NESTING
// ─────────────────────────────────────────────────

export const DeepNesting: Story = {
  name: 'Deep Nesting (5 levels)',
  render: () => html`
    <hx-tree-view label="ICD-10 hierarchy" selection="single">
      <hx-tree-item expanded>
        Chapter I: Infectious Diseases (A00-B99)
        <hx-tree-item slot="children" expanded>
          Block A00-A09: Intestinal infections
          <hx-tree-item slot="children" expanded>
            A00: Cholera
            <hx-tree-item slot="children" expanded>
              A00.0: Cholera due to Vibrio cholerae 01, biovar cholerae
              <hx-tree-item slot="children">A00.0.1: Classical cholera</hx-tree-item>
              <hx-tree-item slot="children">A00.0.2: El Tor cholera</hx-tree-item>
            </hx-tree-item>
            <hx-tree-item slot="children"
              >A00.1: Cholera due to Vibrio cholerae 01, biovar eltor</hx-tree-item
            >
          </hx-tree-item>
        </hx-tree-item>
      </hx-tree-item>
    </hx-tree-view>
  `,
};

// ─────────────────────────────────────────────────
// MULTI-SELECT WITH CHECKBOXES (P1-8)
// ─────────────────────────────────────────────────

/**
 * Demonstrates a visual checkbox multi-select pattern. The hx-tree-view
 * supports selection="multiple" for programmatic multi-selection. Consumer
 * teams can augment items with slotted checkbox inputs to provide an explicit
 * visual affordance for multi-select state, as shown in this healthcare
 * diagnosis code selection example.
 */
export const CheckboxMultiSelect: Story = {
  name: 'Multi-Select with Checkboxes',
  render: () => html`
    <style>
      .checkbox-tree-item {
        display: flex;
        align-items: center;
        gap: var(--hx-space-2, 0.5rem);
      }
      .checkbox-tree-item input[type='checkbox'] {
        margin: 0;
        width: var(--hx-space-4, 1rem);
        height: var(--hx-space-4, 1rem);
        accent-color: var(--hx-color-primary-500);
        pointer-events: none;
        flex-shrink: 0;
      }
    </style>
    <hx-tree-view label="Select diagnosis codes" selection="multiple">
      <hx-tree-item expanded>
        <span class="checkbox-tree-item">
          <input
            type="checkbox"
            id="cat-a"
            aria-hidden="true"
            tabindex="-1"
          />
          Infectious &amp; Parasitic Diseases (A00-B99)
        </span>
        <hx-tree-item slot="children" selected>
          <span class="checkbox-tree-item">
            <input
              type="checkbox"
              id="a00-a09"
              checked
              aria-hidden="true"
              tabindex="-1"
            />
            A00-A09: Intestinal infectious diseases
          </span>
        </hx-tree-item>
        <hx-tree-item slot="children" selected>
          <span class="checkbox-tree-item">
            <input
              type="checkbox"
              id="a15-a19"
              checked
              aria-hidden="true"
              tabindex="-1"
            />
            A15-A19: Tuberculosis
          </span>
        </hx-tree-item>
        <hx-tree-item slot="children">
          <span class="checkbox-tree-item">
            <input
              type="checkbox"
              id="a20-a28"
              aria-hidden="true"
              tabindex="-1"
            />
            A20-A28: Certain zoonotic bacterial diseases
          </span>
        </hx-tree-item>
        <hx-tree-item slot="children">
          <span class="checkbox-tree-item">
            <input
              type="checkbox"
              id="a30-a49"
              aria-hidden="true"
              tabindex="-1"
            />
            A30-A49: Other bacterial diseases
          </span>
        </hx-tree-item>
      </hx-tree-item>
      <hx-tree-item>
        <span class="checkbox-tree-item">
          <input
            type="checkbox"
            id="cat-c"
            aria-hidden="true"
            tabindex="-1"
          />
          Neoplasms (C00-D49)
        </span>
        <hx-tree-item slot="children">
          <span class="checkbox-tree-item">
            <input
              type="checkbox"
              id="c00-c14"
              aria-hidden="true"
              tabindex="-1"
            />
            C00-C14: Malignant neoplasms of lip, oral cavity
          </span>
        </hx-tree-item>
        <hx-tree-item slot="children">
          <span class="checkbox-tree-item">
            <input
              type="checkbox"
              id="c15-c26"
              aria-hidden="true"
              tabindex="-1"
            />
            C15-C26: Malignant neoplasms of digestive organs
          </span>
        </hx-tree-item>
      </hx-tree-item>
    </hx-tree-view>
    <p
      style="margin-top: var(--hx-space-4, 1rem); font-size: var(--hx-font-size-sm, 0.875rem); color: var(--hx-color-text-secondary);"
    >
      2 diagnosis codes selected. Use <code>selection="multiple"</code> with slotted checkboxes for
      explicit visual affordance. The <code>selected</code> attribute reflects programmatic
      selection state.
    </p>
  `,
  play: async ({ canvasElement }) => {
    const tree = canvasElement.querySelector('hx-tree-view');
    await expect(tree).toBeTruthy();

    const selectedItems = canvasElement.querySelectorAll('hx-tree-item[selected]');
    await expect(selectedItems.length).toBe(2);

    const checkedBoxes = canvasElement.querySelectorAll('input[type="checkbox"]:checked');
    await expect(checkedBoxes.length).toBe(2);
  },
};

// ─────────────────────────────────────────────────
// ASYNC LOADING (P1-6)
// ─────────────────────────────────────────────────

/**
 * Demonstrates a simulated async-loaded subtree pattern. In healthcare taxonomy
 * browsers (ICD-10 has 70,000+ codes), subtrees are typically fetched on demand
 * when a parent node is expanded. This story shows the recommended pattern:
 * show a loading placeholder, fetch data, then populate the children slot.
 */
export const AsyncLoading: Story = {
  name: 'Async Loading (Simulated)',
  render: () => html`
    <style>
      .loading-placeholder {
        display: flex;
        align-items: center;
        gap: var(--hx-space-2, 0.5rem);
        color: var(--hx-color-text-muted);
        font-size: var(--hx-font-size-sm, 0.875rem);
        padding: var(--hx-space-1, 0.25rem) 0;
        font-style: italic;
      }
      .loading-placeholder::before {
        content: '';
        display: inline-block;
        width: var(--hx-font-size-sm, 0.875rem);
        height: var(--hx-font-size-sm, 0.875rem);
        border: var(--hx-border-width-medium, 2px) solid var(--hx-color-border-default);
        border-top-color: var(--hx-color-primary-500);
        border-radius: var(--hx-border-radius-full, 50%);
        animation: spin 0.75s linear infinite;
        flex-shrink: 0;
      }
      @media (prefers-reduced-motion: reduce) {
        .loading-placeholder::before {
          animation: none;
          border-top-color: var(--hx-color-text-muted);
        }
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    </style>
    <hx-tree-view id="async-tree" label="Drug classification" selection="single">
      <hx-tree-item id="cardiovascular-node">
        Cardiovascular Drugs
        <hx-tree-item slot="children" id="cardiovascular-loading">
          <span class="loading-placeholder">Loading subcategories...</span>
        </hx-tree-item>
      </hx-tree-item>
      <hx-tree-item expanded>
        Antibiotics
        <hx-tree-item slot="children">Penicillins</hx-tree-item>
        <hx-tree-item slot="children">Cephalosporins</hx-tree-item>
        <hx-tree-item slot="children">Fluoroquinolones</hx-tree-item>
      </hx-tree-item>
      <hx-tree-item id="analgesics-node">
        Analgesics
        <hx-tree-item slot="children" id="analgesics-loading">
          <span class="loading-placeholder">Loading subcategories...</span>
        </hx-tree-item>
      </hx-tree-item>
    </hx-tree-view>
    <p
      style="margin-top: var(--hx-space-4, 1rem); font-size: var(--hx-font-size-sm, 0.875rem); color: var(--hx-color-text-secondary);"
    >
      Expand "Cardiovascular Drugs" or "Analgesics" to see simulated async loading. Children replace
      the loading placeholder after a short delay.
    </p>
    <script>
      (function () {
        function loadChildren(parentItem, loadingItemId, children) {
          parentItem.addEventListener(
            'hx-tree-item-select',
            function onSelect() {
              const loadingItem = document.getElementById(loadingItemId);
              if (!loadingItem) return;
              setTimeout(function () {
                const parent = loadingItem.parentElement;
                if (!parent) return;
                loadingItem.remove();
                children.forEach(function (label) {
                  const item = document.createElement('hx-tree-item');
                  item.setAttribute('slot', 'children');
                  item.textContent = label;
                  parent.appendChild(item);
                });
              }, 400);
            },
            { once: true },
          );
        }
        const cvNode = document.getElementById('cardiovascular-node');
        const analNode = document.getElementById('analgesics-node');
        if (cvNode)
          loadChildren(cvNode, 'cardiovascular-loading', [
            'ACE Inhibitors',
            'Beta Blockers',
            'Calcium Channel Blockers',
          ]);
        if (analNode)
          loadChildren(analNode, 'analgesics-loading', [
            'NSAIDs',
            'Opioid Analgesics',
            'Non-opioid Analgesics',
          ]);
      })();
    </script>
  `,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tree = canvasElement.querySelector('hx-tree-view');
    await expect(tree).toBeTruthy();

    // Verify the loading placeholders are present before expansion
    const loadingPlaceholders = canvasElement.querySelectorAll('.loading-placeholder');
    await expect(loadingPlaceholders.length).toBeGreaterThan(0);

    // Expand the cardiovascular node by clicking its row
    const cvNode = canvasElement.querySelector('#cardiovascular-node') as HTMLElement & {
      expanded: boolean;
    };
    await expect(cvNode).toBeTruthy();

    // Click the expand button inside the tree item's shadow root
    const expandBtn = cvNode.shadowRoot?.querySelector('[part="expand-icon"]') as HTMLElement;
    await expect(expandBtn).toBeTruthy();
    await userEvent.click(expandBtn);

    // Wait for simulated async load: the story uses a 400ms setTimeout to mimic
    // an async data fetch, so we need a 600ms delay (400ms + 200ms buffer) here.
    // There is no element.updateComplete to await because the loading is driven
    // by the story's own setTimeout, not by a Lit reactive update cycle.
    await new Promise((resolve) => setTimeout(resolve, 600));

    // After async load, the loading placeholder should be replaced with actual items
    const loadingAfter = canvasElement.querySelector('#cardiovascular-loading');
    await expect(loadingAfter).toBeNull();

    // Verify the tree renders synchronously loaded items (Antibiotics subtree)
    await expect(canvas.getByText('Antibiotics')).toBeTruthy();
    await expect(canvas.getByText('Penicillins')).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// DRUPAL / CDN INTEGRATION REFERENCE
// ─────────────────────────────────────────────────

/**
 * Drupal Twig integration reference for hx-tree-view.
 *
 * A companion `hx-tree-view.twig` template ships alongside this component.
 * It handles server-rendered tree structures from Drupal taxonomy, menu trees,
 * or custom data sources for progressive enhancement.
 *
 * **Progressive enhancement:** The tree markup is server-rendered. Content is accessible
 * without JavaScript. The web component hydrates client-side to add keyboard navigation,
 * expand/collapse, and ARIA tree semantics (aria-level, aria-posinset, aria-setsize).
 *
 * **Critical: always provide `label`** — The `label` attribute maps to `aria-label` on the
 * `role="tree"` container. WCAG 4.1.2 requires an accessible name on the tree. Without it,
 * screen readers announce an unnamed tree, giving users no context.
 *
 * **Twig template pattern** (taxonomy term hierarchy):
 * ```twig
 * {% include '@mytheme/hx-tree-view/hx-tree-view.twig' with {
 *   label: 'ICD-10 Diagnosis Codes',
 *   selection: 'single',
 *   items: [
 *     {
 *       label: 'A00–A09: Intestinal infectious diseases',
 *       children: [
 *         { label: 'A00: Cholera', expanded: true, children: [
 *           { label: 'A00.0: Classical cholera' },
 *           { label: 'A00.1: El Tor cholera' },
 *         ]},
 *       ],
 *     },
 *   ],
 * } %}
 * ```
 *
 * **Drupal behavior for selection events:**
 * ```javascript
 * (function (Drupal, once) {
 *   Drupal.behaviors.helixTreeView = {
 *     attach: function (context) {
 *       once('hx-tree-view', 'hx-tree-view', context).forEach((tree) => {
 *         tree.addEventListener('hx-select', (event) => {
 *           const input = document.getElementById('selected-diagnosis');
 *           if (input) input.value = event.detail.item.textContent.trim();
 *         });
 *       });
 *     },
 *   };
 * })(Drupal, once);
 * ```
 *
 * **Library registration** (`mytheme.libraries.yml`):
 * ```yaml
 * hx-tree-view:
 *   js:
 *     path/to/@helixui/library/dist/hx-tree-view.js: { attributes: { type: module } }
 *     path/to/@helixui/library/dist/hx-tree-item.js: { attributes: { type: module } }
 *   dependencies:
 *     - core/drupal
 *     - core/once
 * ```
 */
export const DrupalIntegration: Story = {
  name: 'Drupal / CDN Integration',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 2rem; max-width: 560px;">
      <div>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; color: #6b7280; font-weight: 600;">
          Server-rendered taxonomy tree — ICD-10 diagnosis codes (single selection)
        </p>
        <hx-tree-view label="ICD-10 Diagnosis Codes" selection="single">
          <hx-tree-item expanded>
            A00–A09: Intestinal infectious diseases
            <hx-tree-item slot="children" expanded>
              A00: Cholera
              <hx-tree-item slot="children">A00.0: Classical cholera</hx-tree-item>
              <hx-tree-item slot="children">A00.1: El Tor cholera</hx-tree-item>
            </hx-tree-item>
            <hx-tree-item slot="children">A01: Typhoid and paratyphoid fevers</hx-tree-item>
          </hx-tree-item>
          <hx-tree-item>
            A15–A19: Tuberculosis
          </hx-tree-item>
        </hx-tree-view>
        <p style="margin: 0.5rem 0 0; font-size: 0.75rem; color: #9ca3af;">
          aria-label="ICD-10 Diagnosis Codes" ensures screen readers announce tree context
        </p>
      </div>

      <div>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; color: #6b7280; font-weight: 600;">
          Department org chart — navigation-only (no selection)
        </p>
        <hx-tree-view label="Hospital Departments">
          <hx-tree-item expanded>
            Clinical Services
            <hx-tree-item slot="children">Emergency Medicine</hx-tree-item>
            <hx-tree-item slot="children" expanded>
              Surgery
              <hx-tree-item slot="children">Cardiothoracic Surgery</hx-tree-item>
              <hx-tree-item slot="children">Orthopedics</hx-tree-item>
            </hx-tree-item>
          </hx-tree-item>
          <hx-tree-item>Administrative Services</hx-tree-item>
        </hx-tree-view>
      </div>

      <div>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; color: #6b7280; font-weight: 600;">
          Disabled items — permission-gated from Drupal access check
        </p>
        <hx-tree-view label="Patient Records">
          <hx-tree-item>Active Admissions</hx-tree-item>
          <hx-tree-item disabled>Archived Records (access restricted)</hx-tree-item>
          <hx-tree-item>Discharge Summaries</hx-tree-item>
        </hx-tree-view>
      </div>
    </div>
  `,
};

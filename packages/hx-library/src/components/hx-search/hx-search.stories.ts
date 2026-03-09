import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, within, userEvent, fn } from 'storybook/test';
import './hx-search.js';

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/Search',
  component: 'hx-search',
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: 'text',
      description: 'The name of the input, used for form submission via ElementInternals.',
      table: {
        category: 'Form',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    value: {
      control: 'text',
      description: 'The current value of the search input.',
      table: {
        category: 'Content',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text shown when the input is empty.',
      table: {
        category: 'Content',
        defaultValue: { summary: "'Search...'" },
        type: { summary: 'string' },
      },
    },
    label: {
      control: 'text',
      description: 'The visible label text rendered above the search input.',
      table: {
        category: 'Content',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    disabled: {
      control: 'boolean',
      description:
        'Whether the input is disabled. Prevents all interaction and dims the component.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    loading: {
      control: 'boolean',
      description:
        'Whether the component is in a loading state. Replaces the search icon with an animated spinner.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    hxSize: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Controls the visual size of the component.',
      table: {
        category: 'Appearance',
        defaultValue: { summary: "'md'" },
        type: { summary: "'sm' | 'md' | 'lg'" },
      },
    },
  },
  args: {
    name: '',
    value: '',
    placeholder: 'Search...',
    label: '',
    disabled: false,
    loading: false,
    hxSize: 'md',
  },
  render: (args) => html`
    <hx-search
      name=${args.name}
      value=${args.value}
      placeholder=${args.placeholder}
      label=${args.label}
      ?disabled=${args.disabled}
      ?loading=${args.loading}
      hx-size=${args.hxSize}
    ></hx-search>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// Helper: Query the native input inside shadow DOM
// ─────────────────────────────────────────────────

function getNativeInput(canvasElement: HTMLElement): HTMLInputElement {
  const host = canvasElement.querySelector('hx-search');
  if (!host || !host.shadowRoot) {
    throw new Error('hx-search not found or shadowRoot unavailable');
  }
  const input = host.shadowRoot.querySelector('input');
  if (!input) {
    throw new Error('Native <input> not found inside hx-search shadow DOM');
  }
  return input;
}

function getClearButton(canvasElement: HTMLElement): HTMLButtonElement | null {
  const host = canvasElement.querySelector('hx-search');
  if (!host || !host.shadowRoot) {
    throw new Error('hx-search not found or shadowRoot unavailable');
  }
  return host.shadowRoot.querySelector('button[part="clear-button"]');
}

// ─────────────────────────────────────────────────
// 1. DEFAULT — renders, label shows, type and verify
// ─────────────────────────────────────────────────

export const Default: Story = {
  args: {
    placeholder: 'Search...',
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-search')!;
    await expect(host).toBeTruthy();

    const input = getNativeInput(canvasElement);
    await expect(input).toBeTruthy();

    await userEvent.type(input, 'Mitchell');
    await expect(input.value).toBe('Mitchell');
  },
};

// ─────────────────────────────────────────────────
// 2. WITH LABEL
// ─────────────────────────────────────────────────

export const WithLabel: Story = {
  args: {
    label: 'Patient Search',
    placeholder: 'Search...',
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-search')!;

    const shadow = within(host.shadowRoot! as unknown as HTMLElement);
    const label = shadow.getByText('Patient Search');
    await expect(label).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 3. WITH PLACEHOLDER
// ─────────────────────────────────────────────────

export const WithPlaceholder: Story = {
  args: {
    label: 'Patient Lookup',
    placeholder: 'Search by name, MRN, or DOB',
  },
};

// ─────────────────────────────────────────────────
// 4. WITH VALUE (pre-populated)
// ─────────────────────────────────────────────────

export const WithValue: Story = {
  args: {
    label: 'Patient Search',
    value: 'Jane Mitchell',
    placeholder: 'Search by name, MRN, or DOB',
  },
};

// ─────────────────────────────────────────────────
// 5. DISABLED
// ─────────────────────────────────────────────────

export const Disabled: Story = {
  args: {
    label: 'Patient Search',
    placeholder: 'Search by name, MRN, or DOB',
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const input = getNativeInput(canvasElement);
    await expect(input.disabled).toBe(true);
  },
};

// ─────────────────────────────────────────────────
// 6. LOADING — async search in progress
// ─────────────────────────────────────────────────

export const Loading: Story = {
  args: {
    label: 'Patient Search',
    placeholder: 'Search by name, MRN, or DOB',
    value: 'Mitchell',
    loading: true,
  },
};

// ─────────────────────────────────────────────────
// 7. SIZE: SMALL
// ─────────────────────────────────────────────────

export const SizeSmall: Story = {
  name: 'Size: Small',
  args: {
    label: 'Quick Lookup',
    placeholder: 'Search...',
    hxSize: 'sm',
  },
};

// ─────────────────────────────────────────────────
// 8. SIZE: MEDIUM (default)
// ─────────────────────────────────────────────────

export const SizeMedium: Story = {
  name: 'Size: Medium (Default)',
  args: {
    label: 'Patient Search',
    placeholder: 'Search by name, MRN, or DOB',
    hxSize: 'md',
  },
};

// ─────────────────────────────────────────────────
// 9. SIZE: LARGE
// ─────────────────────────────────────────────────

export const SizeLarge: Story = {
  name: 'Size: Large',
  args: {
    label: 'Patient Search',
    placeholder: 'Search by name, MRN, or DOB',
    hxSize: 'lg',
  },
};

// ─────────────────────────────────────────────────
// 10. WITH SUGGESTIONS SLOT
// ─────────────────────────────────────────────────

export const WithSuggestionsSlot: Story = {
  render: () => html`
    <hx-search label="Patient Search" placeholder="Search by name, MRN, or DOB" value="Mitch">
      <ul
        slot="suggestions"
        style="
          list-style: none;
          margin: 0;
          padding: 0.25rem 0;
          background: var(--hx-color-neutral-0, #ffffff);
          border: 1px solid var(--hx-color-neutral-200, #e9ecef);
          border-radius: var(--hx-border-radius-md, 0.375rem);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          font-size: 0.875rem;
        "
      >
        <li
          style="
            padding: 0.5rem 0.75rem;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            gap: 0.125rem;
          "
        >
          <span style="font-weight: 500; color: var(--hx-color-neutral-900, #212529);">
            Sarah Mitchell
          </span>
          <span style="font-size: 0.75rem; color: var(--hx-color-neutral-500, #6c757d);">
            MRN: PAT-2026-00482 · DOB: 03/14/1978
          </span>
        </li>
        <li
          style="
            padding: 0.5rem 0.75rem;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            gap: 0.125rem;
          "
        >
          <span style="font-weight: 500; color: var(--hx-color-neutral-900, #212529);">
            James Mitchell
          </span>
          <span style="font-size: 0.75rem; color: var(--hx-color-neutral-500, #6c757d);">
            MRN: PAT-2026-00391 · DOB: 07/22/1955
          </span>
        </li>
        <li
          style="
            padding: 0.5rem 0.75rem;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            gap: 0.125rem;
          "
        >
          <span style="font-weight: 500; color: var(--hx-color-neutral-900, #212529);">
            Eleanor Mitchell
          </span>
          <span style="font-size: 0.75rem; color: var(--hx-color-neutral-500, #6c757d);">
            MRN: PAT-2026-00178 · DOB: 11/05/1990
          </span>
        </li>
      </ul>
    </hx-search>
  `,
};

// ─────────────────────────────────────────────────
// 11. HEALTHCARE SCENARIO: PATIENT SEARCH
// ─────────────────────────────────────────────────

export const PatientSearch: Story = {
  args: {
    name: 'q',
    label: 'Patient Search',
    placeholder: 'Search patients...',
    hxSize: 'md',
  },
  play: async ({ canvasElement }) => {
    const input = getNativeInput(canvasElement);
    await userEvent.type(input, 'Doe');
    await expect(input.value).toBe('Doe');
  },
};

// ─────────────────────────────────────────────────
// 12. HEALTHCARE SCENARIO: MEDICATION LOOKUP
// ─────────────────────────────────────────────────

export const MedicationLookup: Story = {
  args: {
    name: 'medication',
    label: 'Medication Lookup',
    placeholder: 'Search by drug name, NDC, or formulary code',
    hxSize: 'md',
  },
  play: async ({ canvasElement }) => {
    const input = getNativeInput(canvasElement);
    await userEvent.type(input, 'Metformin');
    await expect(input.value).toBe('Metformin');
  },
};

// ─────────────────────────────────────────────────
// 13. HEALTHCARE SCENARIO: FACILITY FINDER
// ─────────────────────────────────────────────────

export const FacilityFinder: Story = {
  args: {
    name: 'facility',
    label: 'Facility Finder',
    placeholder: 'Search by facility name, ZIP code, or network',
    hxSize: 'md',
  },
  play: async ({ canvasElement }) => {
    const input = getNativeInput(canvasElement);
    await userEvent.type(input, 'St. Luke');
    await expect(input.value).toBe('St. Luke');
  },
};

// ─────────────────────────────────────────────────
// 14. EVENT VERIFICATION
// hx-input fires on type, hx-search fires on Enter,
// hx-clear fires when clear button is clicked
// ─────────────────────────────────────────────────

export const EventVerification: Story = {
  args: {
    label: 'Event Test — Patient Search',
    placeholder: 'Type, press Enter, then clear',
    name: 'event-test',
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-search')!;
    const input = getNativeInput(canvasElement);

    // ── Track hx-input events ──
    let inputEventCount = 0;
    let lastInputValue = '';
    host.addEventListener('hx-input', ((e: CustomEvent<{ value: string }>) => {
      inputEventCount++;
      lastInputValue = e.detail.value;
    }) as EventListener);

    // ── Track hx-search events ──
    let searchFired = false;
    let lastSearchQuery = '';
    host.addEventListener('hx-search', ((e: CustomEvent<{ query: string }>) => {
      searchFired = true;
      lastSearchQuery = e.detail.query;
    }) as EventListener);

    // ── Track hx-clear events ──
    let clearFired = false;
    host.addEventListener('hx-clear', (() => {
      clearFired = true;
    }) as EventListener);

    // Type a query — hx-input fires per keystroke
    await userEvent.type(input, 'Aspirin');
    await expect(inputEventCount).toBe(7); // A-s-p-i-r-i-n
    await expect(lastInputValue).toBe('Aspirin');

    // Press Enter — hx-search should fire immediately
    await userEvent.keyboard('{Enter}');
    await expect(searchFired).toBe(true);
    await expect(lastSearchQuery).toBe('Aspirin');

    // Click the clear button — hx-clear should fire
    const clearButton = getClearButton(canvasElement);
    await expect(clearButton).toBeTruthy();
    await userEvent.click(clearButton!);
    await expect(clearFired).toBe(true);

    // Input value should now be empty
    await expect(input.value).toBe('');
  },
};

// ─────────────────────────────────────────────────
// 15. CLEAR BUTTON — type value, click clear, verify empty
// ─────────────────────────────────────────────────

export const ClearButton: Story = {
  args: {
    label: 'Patient Search',
    placeholder: 'Search by name, MRN, or DOB',
    name: 'clear-test',
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-search')!;
    const input = getNativeInput(canvasElement);

    // Type a value to reveal the clear button
    await userEvent.type(input, 'PAT-2026-00482');
    await expect(input.value).toBe('PAT-2026-00482');
    await expect(host.value).toBe('PAT-2026-00482');

    // The clear button should now be visible
    const clearButton = getClearButton(canvasElement);
    await expect(clearButton).toBeTruthy();

    // Click the clear button
    await userEvent.click(clearButton!);

    // Value should be cleared and focus returned to input
    await expect(input.value).toBe('');
    await expect(host.value).toBe('');

    // Clear button should be gone since value is empty
    const clearButtonAfter = getClearButton(canvasElement);
    await expect(clearButtonAfter).toBeNull();
  },
};

// ─────────────────────────────────────────────────
// 16. ALL SIZES — kitchen sink
// ─────────────────────────────────────────────────

export const AllSizes: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 560px;">
      <div>
        <p
          style="
            margin: 0 0 0.5rem;
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--hx-color-neutral-500, #6c757d);
            text-transform: uppercase;
            letter-spacing: 0.05em;
          "
        >
          Small (hx-size="sm")
        </p>
        <hx-search label="Quick Lookup" placeholder="Search..." hx-size="sm"></hx-search>
      </div>

      <div>
        <p
          style="
            margin: 0 0 0.5rem;
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--hx-color-neutral-500, #6c757d);
            text-transform: uppercase;
            letter-spacing: 0.05em;
          "
        >
          Medium — default (hx-size="md")
        </p>
        <hx-search
          label="Patient Search"
          placeholder="Search by name, MRN, or DOB"
          hx-size="md"
        ></hx-search>
      </div>

      <div>
        <p
          style="
            margin: 0 0 0.5rem;
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--hx-color-neutral-500, #6c757d);
            text-transform: uppercase;
            letter-spacing: 0.05em;
          "
        >
          Large (hx-size="lg")
        </p>
        <hx-search
          label="Global Patient Search"
          placeholder="Search by name, MRN, date of birth, or insurance ID"
          hx-size="lg"
        ></hx-search>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 17. ALL STATES — kitchen sink
// ─────────────────────────────────────────────────

export const AllStates: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 560px;">
      <div>
        <p
          style="
            margin: 0 0 0.5rem;
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--hx-color-neutral-500, #6c757d);
            text-transform: uppercase;
            letter-spacing: 0.05em;
          "
        >
          Default (empty)
        </p>
        <hx-search label="Patient Search" placeholder="Search by name, MRN, or DOB"></hx-search>
      </div>

      <div>
        <p
          style="
            margin: 0 0 0.5rem;
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--hx-color-neutral-500, #6c757d);
            text-transform: uppercase;
            letter-spacing: 0.05em;
          "
        >
          With value (clear button visible)
        </p>
        <hx-search
          label="Patient Search"
          placeholder="Search by name, MRN, or DOB"
          value="Jane Mitchell"
        ></hx-search>
      </div>

      <div>
        <p
          style="
            margin: 0 0 0.5rem;
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--hx-color-neutral-500, #6c757d);
            text-transform: uppercase;
            letter-spacing: 0.05em;
          "
        >
          Disabled
        </p>
        <hx-search
          label="Patient Search"
          placeholder="Search by name, MRN, or DOB"
          disabled
        ></hx-search>
      </div>

      <div>
        <p
          style="
            margin: 0 0 0.5rem;
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--hx-color-neutral-500, #6c757d);
            text-transform: uppercase;
            letter-spacing: 0.05em;
          "
        >
          Loading (async search in progress)
        </p>
        <hx-search
          label="Patient Search"
          placeholder="Search by name, MRN, or DOB"
          value="Mitchell"
          loading
        ></hx-search>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// ADDITIONAL INTERACTION TESTS
// ─────────────────────────────────────────────────

export const DisabledNoInput: Story = {
  name: 'Disabled: Blocks Interaction',
  args: {
    label: 'Read-Only Patient Record Search',
    placeholder: 'Search unavailable for archived records',
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const input = getNativeInput(canvasElement);
    await expect(input.disabled).toBe(true);
    await expect(input.value).toBe('');
  },
};

export const FocusManagement: Story = {
  args: {
    label: 'Focus Test — Patient Search',
    placeholder: 'Click or tab to focus',
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-search')!;
    const input = getNativeInput(canvasElement);

    host.focus();
    await expect(host.shadowRoot!.activeElement).toBe(input);

    await userEvent.type(input, 'Focused');
    await expect(input.value).toBe('Focused');
  },
};

export const DebouncedSearch: Story = {
  name: 'Debounced Search (300ms)',
  args: {
    label: 'Patient Search',
    placeholder: 'Type to trigger debounced hx-search after 300ms',
    name: 'debounce-test',
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-search')!;
    const input = getNativeInput(canvasElement);

    let searchFired = false;
    let lastQuery = '';
    host.addEventListener('hx-search', ((e: CustomEvent<{ query: string }>) => {
      searchFired = true;
      lastQuery = e.detail.query;
    }) as EventListener);

    await userEvent.type(input, 'Cardiology');
    await expect(input.value).toBe('Cardiology');

    // Wait for the 300ms debounce timer to elapse
    await new Promise((resolve) => setTimeout(resolve, 400));

    await expect(searchFired).toBe(true);
    await expect(lastQuery).toBe('Cardiology');
  },
};

export const EnterKeySearch: Story = {
  name: 'Enter Key: Fires hx-search Immediately',
  args: {
    label: 'Diagnosis Search',
    placeholder: 'Search ICD-10 codes or diagnosis descriptions',
    name: 'enter-key-test',
  },
  play: async ({ canvasElement }) => {
    const host = canvasElement.querySelector('hx-search')!;
    const input = getNativeInput(canvasElement);

    let searchFired = false;
    let lastQuery = '';
    host.addEventListener('hx-search', ((e: CustomEvent<{ query: string }>) => {
      searchFired = true;
      lastQuery = e.detail.query;
    }) as EventListener);

    await userEvent.type(input, 'J06.9');
    await userEvent.keyboard('{Enter}');

    await expect(searchFired).toBe(true);
    await expect(lastQuery).toBe('J06.9');
  },
};

export const WithResultsCount: Story = {
  name: 'With Results Count',
  render: () => {
    return html`
      <div style="max-width: 480px; display: flex; flex-direction: column; gap: 1rem;">
        <hx-search
          id="results-count-search"
          label="Medication Search"
          placeholder="Search medications..."
        ></hx-search>
        <div
          aria-live="polite"
          aria-atomic="true"
          id="results-count"
          style="font-size: 0.875rem; color: var(--hx-color-neutral-600);"
        >
          5 results found
        </div>
        <ul
          style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem;"
        >
          <li
            style="padding: 0.5rem; border: 1px solid var(--hx-color-neutral-200, #e9ecef); border-radius: 0.25rem;"
          >
            Metformin 500mg
          </li>
          <li
            style="padding: 0.5rem; border: 1px solid var(--hx-color-neutral-200, #e9ecef); border-radius: 0.25rem;"
          >
            Metformin 850mg
          </li>
          <li
            style="padding: 0.5rem; border: 1px solid var(--hx-color-neutral-200, #e9ecef); border-radius: 0.25rem;"
          >
            Metformin 1000mg
          </li>
          <li
            style="padding: 0.5rem; border: 1px solid var(--hx-color-neutral-200, #e9ecef); border-radius: 0.25rem;"
          >
            Metformin ER 500mg
          </li>
          <li
            style="padding: 0.5rem; border: 1px solid var(--hx-color-neutral-200, #e9ecef); border-radius: 0.25rem;"
          >
            Metformin ER 750mg
          </li>
        </ul>
        <p style="font-size: 0.75rem; color: var(--hx-color-neutral-500);">
          The <code>aria-live="polite"</code> region above announces the results count to screen
          readers whenever it updates. This is the recommended pattern for communicating search
          result counts in healthcare applications.
        </p>
      </div>
    `;
  },
  play: async ({ canvasElement }) => {
    const searchEl = canvasElement.querySelector('hx-search')!;
    const countEl = canvasElement.querySelector('#results-count')!;

    await expect(countEl.textContent?.trim()).toBe('5 results found');
    await expect(searchEl).toBeTruthy();
  },
};

export const FormDataParticipation: Story = {
  render: () => {
    const onSubmit = fn();

    return html`
      <form
        id="patient-search-form"
        @submit=${(e: SubmitEvent) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const data = new FormData(form);
          onSubmit(Object.fromEntries(data.entries()));
        }}
        style="display: flex; flex-direction: column; gap: 1rem; max-width: 480px;"
      >
        <hx-search
          label="Patient Search"
          name="patientQuery"
          placeholder="Search by name, MRN, or DOB"
        ></hx-search>

        <button
          type="submit"
          style="
            padding: 0.5rem 1rem;
            background: var(--hx-color-primary-600, #2563EB);
            color: white;
            border: none;
            border-radius: 0.375rem;
            cursor: pointer;
            font-size: 0.875rem;
            align-self: flex-start;
          "
        >
          Search Records
        </button>
      </form>
    `;
  },
  play: async ({ canvasElement }) => {
    const searchEl = canvasElement.querySelector('hx-search')!;
    const input = searchEl.shadowRoot!.querySelector('input')!;

    await userEvent.type(input, 'Mitchell');
    await expect(searchEl.value).toBe('Mitchell');

    const submitButton = canvasElement.querySelector('button[type="submit"]')!;
    await userEvent.click(submitButton);
  },
};

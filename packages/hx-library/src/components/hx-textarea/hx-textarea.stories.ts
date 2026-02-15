import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { expect, _within, _userEvent } from 'storybook/test';
import './hx-textarea.js';

const meta = {
  title: 'Components/Textarea',
  component: 'hx-textarea',
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'The visible label text for the textarea.',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text shown when the textarea is empty.',
    },
    value: {
      control: 'text',
      description: 'The current value of the textarea.',
    },
    rows: {
      control: { type: 'number', min: 1, max: 20 },
      description: 'The number of visible text rows.',
      table: {
        defaultValue: { summary: '4' },
      },
    },
    maxlength: {
      control: 'number',
      description: 'Maximum number of characters allowed.',
    },
    resize: {
      control: { type: 'select' },
      options: ['none', 'vertical', 'both', 'auto'],
      description: 'Controls how the textarea can be resized.',
      table: {
        defaultValue: { summary: 'vertical' },
      },
    },
    showCount: {
      control: 'boolean',
      description: 'Whether to show a character count below the textarea.',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    required: {
      control: 'boolean',
      description: 'Whether the textarea is required for form submission.',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the textarea is disabled.',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    error: {
      control: 'text',
      description: 'Error message. When set, the textarea enters an error state.',
    },
    helpText: {
      control: 'text',
      description: 'Help text displayed below the textarea for guidance.',
    },
    name: {
      control: 'text',
      description: 'The name of the textarea, used for form submission.',
    },
  },
  args: {
    label: 'Label',
    placeholder: 'Enter text...',
    value: '',
    rows: 4,
    resize: 'vertical',
    showCount: false,
    required: false,
    disabled: false,
    error: '',
    helpText: '',
    name: '',
  },
  render: (args) => html`
    <hx-textarea
      label=${args.label}
      placeholder=${args.placeholder}
      value=${args.value}
      rows=${args.rows}
      resize=${args.resize}
      ?show-count=${args.showCount}
      ?required=${args.required}
      ?disabled=${args.disabled}
      error=${args.error}
      help-text=${args.helpText}
      name=${args.name}
    ></hx-textarea>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// --- Default ---

export const Default: Story = {
  args: {
    label: 'Description',
    placeholder: 'Enter a description...',
  },
  play: async ({ canvasElement }) => {
    const textarea = canvasElement.querySelector('hx-textarea');
    expect(textarea).toBeTruthy();
    const nativeTextarea = textarea?.shadowRoot?.querySelector('textarea');
    expect(nativeTextarea).toBeTruthy();
    await userEvent.type(nativeTextarea!, 'Test notes');
    expect(nativeTextarea!.value).toBe('Test notes');
  },
};

// --- With Help Text ---

export const WithHelpText: Story = {
  args: {
    label: 'Clinical Notes',
    placeholder: 'Enter clinical observations...',
    helpText: 'Include relevant symptoms, vitals, and treatment notes.',
  },
};

// --- With Error ---

export const WithError: Story = {
  args: {
    label: 'Patient Notes',
    value: '',
    error: 'This field is required for patient records.',
  },
};

// --- Required ---

export const Required: Story = {
  args: {
    label: 'Reason for Visit',
    placeholder: 'Describe the reason for this visit...',
    required: true,
    helpText: 'Required field. Please provide details.',
  },
};

// --- Disabled ---

export const Disabled: Story = {
  args: {
    label: 'Previous Notes',
    value: 'Patient presented with mild symptoms. Prescribed standard treatment protocol.',
    disabled: true,
  },
};

// --- With Maxlength ---

export const WithMaxlength: Story = {
  args: {
    label: 'Short Summary',
    placeholder: 'Keep it brief...',
    maxlength: 200,
    helpText: 'Maximum 200 characters.',
  },
};

// --- With Character Counter ---

export const WithCharCounter: Story = {
  args: {
    label: 'Discharge Summary',
    placeholder: 'Enter discharge summary...',
    maxlength: 500,
    showCount: true,
    helpText: 'Summarize the patient discharge details.',
  },
};

// --- Auto Resize ---

export const AutoResize: Story = {
  args: {
    label: 'Auto-Growing Notes',
    placeholder: 'Start typing and the textarea will grow...',
    resize: 'auto',
    helpText: 'This textarea automatically grows as you type.',
  },
};

// --- All States ---

export const AllStates: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 500px;">
      <hx-textarea
        label="Default"
        placeholder="No validation state"
      ></hx-textarea>

      <hx-textarea
        label="Required (empty)"
        placeholder="This field is required"
        required
      ></hx-textarea>

      <hx-textarea
        label="With Error"
        value="Incomplete data"
        error="Please provide complete clinical notes."
      ></hx-textarea>

      <hx-textarea
        label="With Help Text"
        placeholder="Helpful guidance below"
        help-text="This is supplementary help text."
      ></hx-textarea>

      <hx-textarea
        label="With Character Counter"
        value="Some text here"
        show-count
        maxlength="100"
      ></hx-textarea>

      <hx-textarea
        label="Disabled"
        value="Read-only notes"
        disabled
      ></hx-textarea>
    </div>
  `,
};

// --- In a Form ---

export const InAForm: Story = {
  render: () => html`
    <form
      @submit=${(e: Event) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const data = new FormData(form);
        console.log('Form data:', Object.fromEntries(data.entries()));
      }}
      style="display: flex; flex-direction: column; gap: 1rem; max-width: 500px;"
    >
      <hx-text-input
        label="Patient Name"
        name="patientName"
        placeholder="Jane Doe"
        required
      ></hx-text-input>

      <hx-textarea
        label="Chief Complaint"
        name="chiefComplaint"
        placeholder="Describe the primary reason for the visit..."
        required
        rows="3"
        help-text="Brief description of the patient's main concern."
      ></hx-textarea>

      <hx-textarea
        label="Clinical Notes"
        name="clinicalNotes"
        placeholder="Enter detailed clinical observations..."
        rows="6"
        maxlength="2000"
        show-count
      ></hx-textarea>

      <hx-button type="submit">Submit Form</hx-button>
    </form>
  `,
};

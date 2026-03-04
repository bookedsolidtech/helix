import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { fn } from 'storybook/test';
import './hx-file-upload.js';

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/File Upload',
  component: 'hx-file-upload',
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: 'text',
      description: 'The form field name used during form submission.',
      table: {
        category: 'Form',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    label: {
      control: 'text',
      description: 'Visible label text displayed above the dropzone.',
      table: {
        category: 'Content',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    accept: {
      control: 'text',
      description:
        'Comma-separated list of accepted MIME types or file extensions. Mirrors the native input accept attribute.',
      table: {
        category: 'Validation',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
    maxSize: {
      control: 'number',
      description: 'Maximum allowed file size in bytes. 0 means unlimited.',
      table: {
        category: 'Validation',
        defaultValue: { summary: '0' },
        type: { summary: 'number' },
      },
    },
    maxFiles: {
      control: 'number',
      description: 'Maximum number of files that can be selected. 0 means unlimited.',
      table: {
        category: 'Validation',
        defaultValue: { summary: '0' },
        type: { summary: 'number' },
      },
    },
    multiple: {
      control: 'boolean',
      description: 'Whether multiple files may be selected at once.',
      table: {
        category: 'Behavior',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the component is disabled. Prevents all interaction.',
      table: {
        category: 'State',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
    error: {
      control: 'text',
      description:
        'Error message displayed below the dropzone. Also puts the dropzone in an error visual state.',
      table: {
        category: 'Validation',
        defaultValue: { summary: "''" },
        type: { summary: 'string' },
      },
    },
  },
  args: {
    name: '',
    label: '',
    accept: '',
    maxSize: 0,
    maxFiles: 0,
    multiple: false,
    disabled: false,
    error: '',
  },
  render: (args) => html`
    <hx-file-upload
      name=${args.name}
      label=${args.label}
      accept=${args.accept}
      max-size=${args.maxSize}
      max-files=${args.maxFiles}
      ?multiple=${args.multiple}
      ?disabled=${args.disabled}
      error=${args.error}
    ></hx-file-upload>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT
// ─────────────────────────────────────────────────

export const Default: Story = {
  args: {
    name: 'document',
  },
};

// ─────────────────────────────────────────────────
// 2. WITH LABEL
// ─────────────────────────────────────────────────

export const WithLabel: Story = {
  args: {
    name: 'patient_documents',
    label: 'Patient Documents',
  },
};

// ─────────────────────────────────────────────────
// 3. ACCEPT IMAGES
// ─────────────────────────────────────────────────

export const AcceptImages: Story = {
  name: 'Accept: Images',
  args: {
    name: 'imaging_files',
    label: 'Patient Imaging Files',
    accept: 'image/*',
  },
};

// ─────────────────────────────────────────────────
// 4. ACCEPT DOCUMENTS
// ─────────────────────────────────────────────────

export const AcceptDocuments: Story = {
  name: 'Accept: Documents',
  args: {
    name: 'lab_results',
    label: 'Lab Results',
    accept: '.pdf,.doc,.docx',
  },
};

// ─────────────────────────────────────────────────
// 5. MAX SIZE (10 MB)
// ─────────────────────────────────────────────────

export const MaxSize: Story = {
  name: 'Max Size: 10 MB',
  args: {
    name: 'consent_form',
    label: 'Consent Form',
    accept: '.pdf,.jpg,.jpeg,.png',
    maxSize: 10485760,
  },
};

// ─────────────────────────────────────────────────
// 6. MULTIPLE FILES
// ─────────────────────────────────────────────────

export const Multiple: Story = {
  args: {
    name: 'patient_records',
    label: 'Patient Records',
    multiple: true,
  },
};

// ─────────────────────────────────────────────────
// 7. DISABLED
// ─────────────────────────────────────────────────

export const Disabled: Story = {
  args: {
    name: 'locked_document',
    label: 'Document Upload (Locked)',
    disabled: true,
  },
};

// ─────────────────────────────────────────────────
// 8. WITH ERROR
// ─────────────────────────────────────────────────

export const WithError: Story = {
  args: {
    name: 'insurance_card',
    label: 'Insurance Card',
    error: 'File format not supported. Please use PDF or JPG.',
  },
};

// ─────────────────────────────────────────────────
// 9. CUSTOM DROPZONE SLOT (Drupal context)
// ─────────────────────────────────────────────────

export const CustomDropzoneSlot: Story = {
  name: 'Custom Dropzone Slot (Drupal)',
  render: () => html`
    <hx-file-upload name="referral_documents" label="Referral Documents" accept=".pdf" multiple>
      <div
        style="
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
        "
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--hx-color-primary-500, #2563EB)"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
        <span
          style="
            font-size: 1rem;
            font-weight: 600;
            color: var(--hx-color-neutral-700, #343a40);
          "
        >
          Upload Referral PDF
        </span>
        <span
          style="
            font-size: 0.8125rem;
            color: var(--hx-color-neutral-500, #6c757d);
            text-align: center;
          "
        >
          Drag and drop your referral letter here, or click to browse.
          <br />PDF files only. Required for specialist scheduling.
        </span>
      </div>
    </hx-file-upload>
  `,
};

// ─────────────────────────────────────────────────
// 10. MAX FILES
// ─────────────────────────────────────────────────

export const WithMaxFiles: Story = {
  name: 'Max Files: 3',
  args: {
    name: 'supporting_documents',
    label: 'Supporting Documents',
    multiple: true,
    maxFiles: 3,
  },
};

// ─────────────────────────────────────────────────
// 11. HEALTHCARE LAB RESULTS — Full Drupal-style example
// ─────────────────────────────────────────────────

export const HealthcareLabResults: Story = {
  name: 'Healthcare: Lab Results Upload',
  render: () => html`
    <div style="max-width: 560px;">
      <hx-file-upload
        name="lab_results"
        label="Upload Lab Results"
        accept=".pdf,.jpg,.png,.dcm"
        max-size="10485760"
        multiple
        max-files="10"
      >
        <div
          style="
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.625rem;
            padding: 1.25rem;
          "
        >
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--hx-color-primary-500, #2563EB)"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polyline points="16 16 12 12 8 16" />
            <line x1="12" y1="12" x2="12" y2="21" />
            <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
          </svg>
          <span
            style="
              font-size: 1rem;
              font-weight: 600;
              color: var(--hx-color-neutral-800, #1a1d20);
            "
          >
            Drag lab results here or click to browse
          </span>
          <span
            style="
              font-size: 0.8125rem;
              color: var(--hx-color-neutral-500, #6c757d);
              text-align: center;
              line-height: 1.5;
            "
          >
            Accepted formats: PDF, JPG, PNG, DICOM (.dcm)
            <br />Maximum 10 MB per file. Up to 10 files at a time.
          </span>
        </div>
      </hx-file-upload>
      <p
        style="
          margin-top: 0.75rem;
          font-size: 0.75rem;
          color: var(--hx-color-neutral-500, #6c757d);
          line-height: 1.5;
        "
      >
        Uploaded files are transmitted securely via TLS 1.3 and stored in compliance with HIPAA
        regulations. Do not upload files containing sensitive information beyond what is required
        for the lab result.
      </p>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 12. ALL STATES — Visual regression baseline
// ─────────────────────────────────────────────────

export const AllStates: Story = {
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 2rem; max-width: 560px;">
      <div>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; color: #6c757d; font-weight: 600;">
          DEFAULT
        </p>
        <hx-file-upload name="default_state" label="Medical Records"></hx-file-upload>
      </div>

      <div>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; color: #6c757d; font-weight: 600;">
          WITH ACCEPT CONSTRAINT
        </p>
        <hx-file-upload
          name="images_only"
          label="Imaging Files"
          accept="image/*,.dcm"
        ></hx-file-upload>
      </div>

      <div>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; color: #6c757d; font-weight: 600;">
          MULTIPLE + MAX FILES
        </p>
        <hx-file-upload
          name="consent_docs"
          label="Consent Documents"
          accept=".pdf"
          multiple
          max-files="5"
        ></hx-file-upload>
      </div>

      <div>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; color: #6c757d; font-weight: 600;">
          ERROR STATE
        </p>
        <hx-file-upload
          name="error_state"
          label="Insurance Card"
          error="File format not supported. Please upload a PDF or JPG image of your insurance card."
        ></hx-file-upload>
      </div>

      <div>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; color: #6c757d; font-weight: 600;">
          DISABLED
        </p>
        <hx-file-upload
          name="disabled_state"
          label="Document Upload (Closed)"
          disabled
        ></hx-file-upload>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 13. CSS CUSTOM PROPERTIES DEMO
// ─────────────────────────────────────────────────

export const CSSCustomProperties: Story = {
  name: 'CSS Custom Properties',
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 2rem; max-width: 560px;">
      <div>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; color: #6c757d; font-weight: 600;">
          DEFAULT (all tokens at defaults)
        </p>
        <hx-file-upload name="default_tokens" label="Default Appearance"></hx-file-upload>
      </div>

      <div>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; color: #6c757d; font-weight: 600;">
          --hx-file-upload-dropzone-bg + --hx-file-upload-dropzone-border-color
        </p>
        <hx-file-upload
          name="custom_bg"
          label="Custom Background and Border"
          style="
            --hx-file-upload-dropzone-bg: #eff6ff;
            --hx-file-upload-dropzone-border-color: #2563EB;
          "
        ></hx-file-upload>
      </div>

      <div>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; color: #6c757d; font-weight: 600;">
          --hx-file-upload-dropzone-border-radius
        </p>
        <hx-file-upload
          name="square_corners"
          label="Square Corners"
          style="--hx-file-upload-dropzone-border-radius: 0;"
        ></hx-file-upload>
      </div>

      <div>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; color: #6c757d; font-weight: 600;">
          --hx-file-upload-progress-color
        </p>
        <hx-file-upload
          name="custom_progress"
          label="Green Progress (accessibility theme)"
          style="--hx-file-upload-progress-color: #198754;"
        ></hx-file-upload>
      </div>

      <div>
        <p style="margin: 0 0 0.5rem; font-size: 0.75rem; color: #6c757d; font-weight: 600;">
          --hx-file-upload-error-color
        </p>
        <hx-file-upload
          name="custom_error"
          label="Custom Error Color"
          error="This field has a validation error."
          style="--hx-file-upload-error-color: #dc6502;"
        ></hx-file-upload>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 14. CSS PARTS DEMO
// ─────────────────────────────────────────────────

export const CSSParts: Story = {
  name: 'CSS Parts',
  render: () => html`
    <style>
      .css-parts-demo hx-file-upload::part(label) {
        color: #2563eb;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-size: 0.75rem;
      }

      .css-parts-demo hx-file-upload::part(dropzone) {
        border-color: #2563eb;
        border-width: 2px;
        background: #eff6ff;
      }

      .css-parts-demo hx-file-upload::part(file-list) {
        border-top: 2px solid #e2e8f0;
        margin-top: 0.75rem;
        padding-top: 0.75rem;
      }

      .css-parts-demo hx-file-upload::part(progress) {
        height: 6px;
        border-radius: 9999px;
      }
    </style>

    <div class="css-parts-demo" style="max-width: 560px;">
      <p style="margin: 0 0 1rem; font-size: 0.875rem; color: #6c757d;">
        Styled via ::part(label), ::part(dropzone), ::part(file-list), ::part(progress)
      </p>
      <hx-file-upload
        name="styled_parts"
        label="Upload via CSS Parts"
        accept=".pdf,.jpg"
        multiple
      ></hx-file-upload>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 15. IN A FORM (form association)
// ─────────────────────────────────────────────────

export const InAForm: Story = {
  render: () => {
    const onSubmit = fn();

    return html`
      <form
        @submit=${(e: SubmitEvent) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const data = new FormData(form);
          const files = data.getAll('lab_results');
          onSubmit({ fileCount: files.length });
        }}
        style="display: flex; flex-direction: column; gap: 1.25rem; max-width: 560px;"
      >
        <hx-file-upload
          name="lab_results"
          label="Lab Results"
          accept=".pdf,.jpg,.png"
          max-size="10485760"
          multiple
          max-files="5"
        ></hx-file-upload>

        <hx-file-upload
          name="insurance_card"
          label="Insurance Card (Front)"
          accept="image/*,.pdf"
          max-size="5242880"
        ></hx-file-upload>

        <div style="display: flex; gap: 0.75rem; margin-top: 0.5rem;">
          <button
            type="submit"
            style="
              padding: 0.5rem 1.25rem;
              background: #2563EB;
              color: white;
              border: none;
              border-radius: 0.375rem;
              cursor: pointer;
              font-size: 0.875rem;
              font-weight: 500;
            "
          >
            Submit Documents
          </button>
          <button
            type="reset"
            style="
              padding: 0.5rem 1.25rem;
              background: transparent;
              color: #6c757d;
              border: 1px solid #dee2e6;
              border-radius: 0.375rem;
              cursor: pointer;
              font-size: 0.875rem;
              font-weight: 500;
            "
          >
            Clear All
          </button>
        </div>
      </form>
    `;
  },
};

// ─────────────────────────────────────────────────
// 16. EDGE CASES
// ─────────────────────────────────────────────────

export const NoLabel: Story = {
  name: 'No Label (aria-label only)',
  render: () => html`
    <hx-file-upload name="attachment" aria-label="Upload attachment"></hx-file-upload>
  `,
};

export const LongErrorMessage: Story = {
  args: {
    name: 'dicom_upload',
    label: 'DICOM Imaging Files',
    accept: '.dcm',
    error:
      'One or more files could not be uploaded. DICOM files must conform to the DICOM 3.0 standard and must not exceed 50 MB per file. Contact the Radiology Information System (RIS) administrator at extension 6100 if you continue to encounter this error.',
  },
};

export const MultipleWithSizeAndTypeConstraints: Story = {
  name: 'Multiple + Size + Type Constraints',
  args: {
    name: 'patient_imaging',
    label: 'Patient Imaging Files',
    accept: 'image/*,.dcm,.pdf',
    multiple: true,
    maxSize: 52428800,
    maxFiles: 20,
  },
};

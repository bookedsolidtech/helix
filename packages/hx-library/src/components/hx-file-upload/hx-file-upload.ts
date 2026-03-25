import { LitElement, html, nothing, type PropertyValues } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { repeat } from 'lit/directives/repeat.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { helixFileUploadStyles } from './hx-file-upload.styles.js';

// Module-level counter for stable, SSR-safe IDs (avoids Math.random() hydration mismatch)
let _hxFileUploadIdCounter = 0;

interface FileEntry {
  file: File;
  progress: number;
}

/**
 * A drag-and-drop file upload component with client-side validation,
 * file list management, per-file progress, and native form association.
 *
 * @summary Form-associated file upload dropzone with drag-and-drop, validation, and progress tracking.
 *
 * @tag hx-file-upload
 *
 * @slot - Default dropzone content. Replaces the built-in "Drag files here or click to browse" prompt.
 * @slot file-list - Custom file list display. When provided, the built-in file list is hidden.
 *
 * @fires {CustomEvent<{files: File[]}>} hx-upload - Dispatched when valid files are selected via drag-and-drop or the file picker.
 * @fires {CustomEvent<{file: File, index: number}>} hx-remove - Dispatched when a file is removed from the list.
 * @fires {CustomEvent<{message: string, files: File[]}>} hx-error - Dispatched when file validation fails (type or size constraint).
 *
 * @csspart dropzone - The drag-and-drop target area.
 * @csspart file-list - The container wrapping the list of selected files.
 * @csspart file-item - An individual file entry in the list.
 * @csspart progress - The progress bar track for a file item.
 * @csspart label - The visible label element.
 * @csspart error - The error message container below the dropzone.
 *
 * @cssprop [--hx-file-upload-dropzone-bg=var(--hx-color-neutral-50)] - Dropzone background color.
 * @cssprop [--hx-file-upload-dropzone-border-color=var(--hx-color-neutral-300)] - Dropzone border color.
 * @cssprop [--hx-file-upload-dropzone-border-radius=var(--hx-border-radius-lg)] - Dropzone border radius.
 * @cssprop [--hx-file-upload-dropzone-active-bg] - Dropzone background when a file is dragged over.
 * @cssprop [--hx-file-upload-progress-color=var(--hx-color-primary-500)] - Progress bar fill color.
 * @cssprop [--hx-file-upload-error-color=var(--hx-color-error-500)] - Error state and remove-button hover color.
 */
@customElement('hx-file-upload')
export class HelixFileUpload extends LitElement {
  static override styles = [tokenStyles, helixFileUploadStyles];

  // ─── Form Association ───

  /** Marks this element as form-associated for ElementInternals support. @internal */
  static formAssociated = true;

  /** Holds the ElementInternals instance used for form value and validity management. @internal */
  private _internals: ElementInternals;

  constructor() {
    super();
    /** @internal */
    this._internals = this.attachInternals();
  }

  // ─── Properties ───

  /**
   * The form field name used during form submission.
   * @attr name
   */
  @property({ type: String })
  name = '';

  /**
   * Accepted file types as a comma-separated list of MIME types or extensions.
   * Mirrors the native `<input type="file" accept>` attribute.
   * @attr accept
   */
  @property({ type: String })
  accept = '';

  /**
   * Maximum allowed file size in bytes. 0 means unlimited.
   * @attr max-size
   */
  @property({ type: Number, attribute: 'max-size' })
  maxSize = 0;

  /**
   * Maximum number of files that can be selected. 0 means unlimited.
   * @attr max-files
   */
  @property({ type: Number, attribute: 'max-files' })
  maxFiles = 0;

  /**
   * Whether multiple files may be selected at once.
   * @attr multiple
   */
  @property({ type: Boolean })
  multiple = false;

  /**
   * Visible label text for the dropzone.
   * @attr label
   */
  @property({ type: String })
  label = '';

  /**
   * Whether the component is disabled.
   * @attr disabled
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Error message displayed below the dropzone. Also puts the dropzone in an error visual state.
   * @attr error
   */
  @property({ type: String })
  error = '';

  /**
   * Instructional text shown in the dropzone when no custom slot content is provided.
   * Also used as the accessible label for the dropzone.
   * @attr label-dropzone
   */
  @property({ type: String, attribute: 'label-dropzone' })
  labelDropzone = 'Drag files here or click to browse';

  /** Accessible label for the selected files list. */
  @property({ type: String, attribute: 'label-file-list' })
  labelFileList = 'Selected files';

  /**
   * Generates upload progress description for screen readers.
   * @param name - file name
   * @param progress - progress percentage 0-100
   */
  @property({ attribute: false })
  labelUploadProgress: (name: string, progress: number) => string = (name, progress) =>
    `Upload progress for ${name}: ${progress}%`;

  // ─── Internal State ───

  /** The list of currently selected file entries, each with a file reference and upload progress. @internal */
  @state() private _files: FileEntry[] = [];
  /** Whether a file is currently being dragged over the dropzone. @internal */
  @state() private _dragOver = false;
  /** Whether the named file-list slot contains projected content. @internal */
  @state() private _hasFileListSlot = false;

  // ─── Internal References ───

  /** Reference to the hidden native file input element used to open the OS file picker. @internal */
  @query('.file-input')
  private _fileInput: HTMLInputElement | null | undefined;

  // ─── Stable IDs ───

  /** @internal */
  private readonly _baseId = `hx-file-upload-${++_hxFileUploadIdCounter}`;
  /** @internal */
  private readonly _labelId = `${this._baseId}-label`;
  /** @internal */
  private readonly _errorId = `${this._baseId}-error`;
  /** @internal */
  private readonly _dropzoneId = `${this._baseId}-dropzone`;
  /** @internal */
  private readonly _liveId = `${this._baseId}-live`;

  // ─── Slot Handling ───

  /** @internal */
  private _handleFileListSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasFileListSlot = slot.assignedElements({ flatten: true }).length > 0;
  }

  // ─── Lifecycle ───

  override updated(changedProperties: PropertyValues<this>): void {
    super.updated(changedProperties);
    if (changedProperties.has('_files' as keyof HelixFileUpload) || changedProperties.has('name')) {
      this._syncFormValue();
    }
  }

  // ─── Form Integration ───

  /** Returns the associated form element, if any. */
  get form(): HTMLFormElement | null {
    return this._internals.form;
  }

  /** Returns the validation message. */
  get validationMessage(): string {
    return this._internals.validationMessage;
  }

  /** Returns the ValidityState object. */
  get validity(): ValidityState {
    return this._internals.validity;
  }

  /** Checks whether the component satisfies its constraints. */
  checkValidity(): boolean {
    return this._internals.checkValidity();
  }

  /** Reports validity and shows the browser's constraint validation UI. */
  reportValidity(): boolean {
    return this._internals.reportValidity();
  }

  /** @internal */
  formResetCallback(): void {
    this._files = [];
    this._internals.setFormValue(null);
  }

  /** @internal */
  formDisabledCallback(disabled: boolean): void {
    this.disabled = disabled;
  }

  /** @internal */
  formStateRestoreCallback(_state: string | File | FormData, mode: string): void {
    if (mode === 'restore' || mode === 'autocomplete') {
      this._files = [];
      this._internals.setFormValue(null);
    }
  }

  /** @internal */
  private _syncFormValue(): void {
    if (this._files.length === 0) {
      this._internals.setFormValue(null);
      return;
    }

    if (this._files.length === 1) {
      // Single file — pass directly as File (accepted by setFormValue)
      const firstEntry = this._files[0];
      if (firstEntry) {
        this._internals.setFormValue(firstEntry.file);
      }
      return;
    }

    // Multiple files — use FormData so all files are submitted under the same name
    const formData = new FormData();
    for (const entry of this._files) {
      formData.append(this.name, entry.file, entry.file.name);
    }
    this._internals.setFormValue(formData);
  }

  // ─── Validation ───

  /**
   * Validates a file against `accept` and `maxSize` constraints.
   * Returns null on success, or an error message string on failure.
   */
  /** @internal */
  private _validateFile(file: File): string | null {
    if (this.accept) {
      const accepted = this._isAccepted(file);
      if (!accepted) {
        return `"${file.name}" has an unsupported file type. Accepted types: ${this.accept}`;
      }
    }

    if (this.maxSize > 0 && file.size > this.maxSize) {
      const maxMb = (this.maxSize / (1024 * 1024)).toFixed(1);
      return `"${file.name}" exceeds the maximum size of ${maxMb} MB.`;
    }

    return null;
  }

  /**
   * Checks whether a file is accepted given the `accept` attribute value.
   * Handles MIME types (e.g. "image/png"), wildcard MIME types (e.g. "image/*"),
   * and extensions (e.g. ".pdf").
   */
  /** @internal */
  private _isAccepted(file: File): boolean {
    const tokens = this.accept.split(',').map((t) => t.trim().toLowerCase());

    for (const token of tokens) {
      if (token.startsWith('.')) {
        // Extension match
        if (file.name.toLowerCase().endsWith(token)) return true;
      } else if (token.endsWith('/*')) {
        // Wildcard MIME type e.g. "image/*"
        const baseType = token.slice(0, -2);
        if (file.type.toLowerCase().startsWith(baseType)) return true;
      } else {
        // Exact MIME type
        if (file.type.toLowerCase() === token) return true;
      }
    }

    return false;
  }

  // ─── File Processing ───

  /** @internal */
  private _processFiles(rawFiles: File[]): void {
    if (this.disabled) return;

    const candidateFiles = this.multiple ? rawFiles : rawFiles.slice(0, 1);
    const validFiles: File[] = [];
    const invalidFiles: File[] = [];
    const errorMessages: string[] = [];

    for (const file of candidateFiles) {
      const validationError = this._validateFile(file);
      if (validationError) {
        invalidFiles.push(file);
        errorMessages.push(validationError);
      } else {
        validFiles.push(file);
      }
    }

    if (invalidFiles.length > 0) {
      this.dispatchEvent(
        new CustomEvent<{ message: string; files: File[] }>('hx-error', {
          bubbles: true,
          composed: true,
          detail: { message: errorMessages.join(' '), files: invalidFiles },
        }),
      );
    }

    if (validFiles.length === 0) return;

    // Enforce maxFiles limit (only in multiple mode — single-file mode always replaces)
    const currentCount = this.multiple ? this._files.length : 0;
    const capacity =
      this.maxFiles > 0 ? Math.max(0, this.maxFiles - currentCount) : validFiles.length;
    const allowedFiles = validFiles.slice(0, capacity);

    if (allowedFiles.length === 0 && this.maxFiles > 0) {
      this.dispatchEvent(
        new CustomEvent<{ message: string; files: File[] }>('hx-error', {
          bubbles: true,
          composed: true,
          detail: {
            message: `Maximum of ${this.maxFiles} file${this.maxFiles === 1 ? '' : 's'} allowed.`,
            files: validFiles,
          },
        }),
      );
      return;
    }

    if (allowedFiles.length > 0) {
      const newEntries: FileEntry[] = allowedFiles.map((file) => ({ file, progress: 0 }));

      if (this.multiple) {
        this._files = [...this._files, ...newEntries];
      } else {
        this._files = newEntries;
      }

      this.dispatchEvent(
        new CustomEvent<{ files: File[] }>('hx-upload', {
          bubbles: true,
          composed: true,
          detail: { files: allowedFiles },
        }),
      );
    }

    // If remaining valid files were cut by maxFiles, report that too
    const overflow = validFiles.slice(capacity);
    if (overflow.length > 0 && this.maxFiles > 0) {
      this.dispatchEvent(
        new CustomEvent<{ message: string; files: File[] }>('hx-error', {
          bubbles: true,
          composed: true,
          detail: {
            message: `Maximum of ${this.maxFiles} file${this.maxFiles === 1 ? '' : 's'} allowed. ${overflow.length} file${overflow.length === 1 ? ' was' : 's were'} not added.`,
            files: overflow,
          },
        }),
      );
    }
  }

  // ─── Public Methods ───

  /**
   * Sets the upload progress for a file at the given index.
   * @param index - Zero-based index into the current file list.
   * @param percent - Progress percentage from 0 to 100.
   */
  setProgress(index: number, percent: number): void {
    if (index < 0 || index >= this._files.length) return;
    const clamped = Math.max(0, Math.min(100, percent));
    this._files = this._files.map((entry, i) =>
      i === index ? { ...entry, progress: clamped } : entry,
    );
  }

  /**
   * Returns a read-only copy of the currently selected files.
   */
  get files(): File[] {
    return this._files.map((e) => e.file);
  }

  // ─── Drag and Drop Handlers ───

  /** @internal */
  private _handleDragOver(e: DragEvent): void {
    e.preventDefault();
    if (this.disabled) return;
    this._dragOver = true;
  }

  /** @internal */
  private _handleDragLeave(e: DragEvent): void {
    // Only clear drag state when leaving the dropzone entirely
    const target = e.relatedTarget as Node | null;
    if (target && this.contains(target)) return;
    const dropzone = this.shadowRoot?.querySelector('.dropzone');
    if (dropzone && dropzone.contains(target)) return;
    this._dragOver = false;
  }

  /** @internal */
  private _handleDrop(e: DragEvent): void {
    e.preventDefault();
    this._dragOver = false;
    if (this.disabled) return;

    const dt = e.dataTransfer;
    if (!dt) return;

    const rawFiles = Array.from(dt.files);
    if (rawFiles.length === 0) return;

    this._processFiles(rawFiles);
  }

  // ─── Click / Keyboard Handlers ───

  /** @internal */
  private _handleDropzoneClick(): void {
    if (this.disabled) return;
    this._fileInput?.click();
  }

  /** @internal */
  private _handleDropzoneKeyDown(e: KeyboardEvent): void {
    if (this.disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this._fileInput?.click();
    }
  }

  /** @internal */
  private _handleFileInputChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const rawFiles = Array.from(input.files);
    // Reset the input so the same file can be re-selected after removal
    input.value = '';
    this._processFiles(rawFiles);
  }

  // ─── Remove Handler ───

  /** @internal */
  private _handleRemove(index: number): void {
    if (this.disabled) return;
    const entry = this._files[index];
    if (!entry) return;

    const removedFile = entry.file;
    this._files = this._files.filter((_, i) => i !== index);

    this.dispatchEvent(
      new CustomEvent<{ file: File; index: number }>('hx-remove', {
        bubbles: true,
        composed: true,
        detail: { file: removedFile, index },
      }),
    );
  }

  // ─── Formatters ───

  /** @internal */
  private _formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  // ─── Render Helpers ───

  /** @internal */
  private _renderFileList() {
    if (this._hasFileListSlot) return nothing;
    if (this._files.length === 0) return nothing;

    return html`
      <ul part="file-list" class="file-list" aria-label=${this.labelFileList}>
        ${repeat(
          this._files,
          (entry) => entry.file.name + entry.file.size,
          (entry, index) => html`
            <li part="file-item" class="file-item">
              <div class="file-item__row">
                <span class="file-item__name" title=${entry.file.name}> ${entry.file.name} </span>
                <span class="file-item__size">${this._formatSize(entry.file.size)}</span>
                <button
                  type="button"
                  class="file-item__remove"
                  aria-label=${`Remove ${entry.file.name}`}
                  @click=${() => this._handleRemove(index)}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      d="M1 1L13 13M13 1L1 13"
                      stroke="currentColor"
                      stroke-width="1.75"
                      stroke-linecap="round"
                    />
                  </svg>
                </button>
              </div>
              <div
                part="progress"
                class="progress-track"
                role="progressbar"
                aria-valuenow=${entry.progress}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-label=${this.labelUploadProgress(entry.file.name, entry.progress)}
              >
                <div
                  class="progress-bar"
                  style="--_progress-ratio: ${String(entry.progress / 100)}"
                ></div>
              </div>
            </li>
          `,
        )}
      </ul>
    `;
  }

  // ─── Render ───

  override render() {
    const hasError = !!this.error;

    const dropzoneClasses = {
      dropzone: true,
      'dropzone--drag-over': this._dragOver,
      'dropzone--error': hasError,
    };

    const dropzoneLabel = this.label ? `${this.label} — ${this.labelDropzone}` : this.labelDropzone;

    return html`
      <div class="field">
        ${this.label
          ? html`
              <label part="label" class="field__label" id=${this._labelId} for=${this._dropzoneId}>
                ${this.label}
              </label>
            `
          : nothing}

        <div
          part="dropzone"
          class=${classMap(dropzoneClasses)}
          id=${this._dropzoneId}
          role="button"
          tabindex=${this.disabled ? '-1' : '0'}
          aria-label=${ifDefined(!this.label ? dropzoneLabel : undefined)}
          aria-labelledby=${ifDefined(this.label ? this._labelId : undefined)}
          aria-disabled=${this.disabled ? 'true' : nothing}
          aria-describedby=${ifDefined(hasError ? this._errorId : undefined)}
          @click=${this._handleDropzoneClick}
          @keydown=${this._handleDropzoneKeyDown}
          @dragover=${this._handleDragOver}
          @dragleave=${this._handleDragLeave}
          @drop=${this._handleDrop}
        >
          <slot>${this.labelDropzone}</slot>
        </div>

        <input
          class="file-input"
          type="file"
          tabindex="-1"
          aria-hidden="true"
          accept=${ifDefined(this.accept || undefined)}
          ?multiple=${this.multiple}
          ?disabled=${this.disabled}
          @change=${this._handleFileInputChange}
        />

        <slot name="file-list" @slotchange=${this._handleFileListSlotChange}></slot>

        ${this._renderFileList()}
        ${hasError
          ? html`
              <div part="error" class="field__error" id=${this._errorId} role="alert">
                ${this.error}
              </div>
            `
          : nothing}

        <div id=${this._liveId} class="sr-only" aria-live="polite" aria-atomic="true">
          ${this._dragOver ? 'File detected. Release to upload.' : ''}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-file-upload': HelixFileUpload;
  }
}

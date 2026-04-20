import { html, nothing, type PropertyValues } from 'lit';
import '../../utilities/document-token-adoption.js';
import { customElement, property, query, state } from 'lit/decorators.js';
import { HelixElement, createIdCounter } from '../../base/index.js';
import { classMap } from 'lit/directives/class-map.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { repeat } from 'lit/directives/repeat.js';
import { mixinDelegatesAria } from '../../mixins/index.js';
import { FormMixin } from '../../mixins/FormMixin.js';
import { helixFileUploadStyles } from './hx-file-upload.styles.js';

const _nextFileUploadId = createIdCounter('hx-file-upload');

interface FileEntry {
  file: File;
  progress: number;
}

/** Detail for the hx-upload event dispatched by hx-file-upload. */
export interface HxFileUploadDetail {
  files: File[];
}

/** Detail for the hx-remove event dispatched by hx-file-upload. */
export interface HxFileRemoveDetail {
  file: File;
  index: number;
}

/** Detail for the hx-error event dispatched by hx-file-upload. */
export interface HxFileErrorDetail {
  message: string;
  files: File[];
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
export class HelixFileUpload extends FormMixin(mixinDelegatesAria(HelixElement)) {
  static override styles = [helixFileUploadStyles];

  // ─── Form Association ───

  /** Marks this element as form-associated for ElementInternals support. @internal */
  static override formAssociated = true;

  // ─── Properties ───

  /**
   * The form field name used during form submission.
   * @attr name
   */
  @property({ type: String, reflect: true })
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
   * Accessible label for the dropzone when no visible label text is provided.
   * Falls back to `label-dropzone` prop value, then a default string.
   *
   * Accepts both `accessible-label` and the standard `aria-label` HTML attribute.
   * `accessible-label` takes precedence when both are set.
   *
   * @attr accessible-label
   */
  @property({ type: String, attribute: 'accessible-label' })
  accessibleLabel: string = '';

  /**
   * Returns the effective label for the dropzone, checking accessible-label first,
   * then the aria-label attribute, falling back to empty string.
   * @internal
   */
  private get _effectiveLabel(): string {
    return this.accessibleLabel || this.ariaLabel || '';
  }

  /**
   * Generates upload progress description for screen readers.
   * @param name - file name
   * @param progress - progress percentage 0-100
   */
  @property({ attribute: false })
  labelUploadProgress: (name: string, progress: number) => string = (name, progress) =>
    `Upload progress for ${name}: ${progress}%`;

  /**
   * Screen reader announcement when file drag detected. Override for i18n.
   * @attr label-drag-detected
   */
  @property({ attribute: 'label-drag-detected' })
  labelDragDetected = 'File detected. Release to upload.';

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
  private readonly _baseId = _nextFileUploadId();
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
    // Force screen reader re-announcement when error text changes (a11y-v3-005)
    if (changedProperties.has('error') && this.error) {
      const errorEl = this.shadowRoot?.querySelector('[role="alert"]');
      if (errorEl) {
        const msg = this.error;
        requestAnimationFrame(() => {
          errorEl.textContent = '';
          requestAnimationFrame(() => {
            errorEl.textContent = msg;
          });
        });
      }
    }
  }

  // ─── Form Integration ───

  /** @internal */
  protected override _onFormReset(): void {
    this._files = [];
    this._internals.setFormValue(null);
    this._resetInteractionState();
  }

  /** @internal */
  protected override _onFormDisabled(disabled: boolean): void {
    this.disabled = disabled;
  }

  /** @internal */
  protected override _onFormStateRestore(
    _state: File | string | FormData | null,
    _mode: 'restore' | 'autocomplete',
  ): void {
    if (_mode === 'restore' || _mode === 'autocomplete') {
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

      this._handleInteractionInput();

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

    // Restore focus after removal so keyboard users are not stranded.
    this.updateComplete
      .then(() => {
        if (this._files.length === 0) {
          // List is now empty — return focus to the dropzone.
          const dropzone = this.shadowRoot?.querySelector<HTMLElement>('[part="dropzone"]');
          dropzone?.focus();
        } else {
          // Focus the remove button at the same position, or the previous one if
          // the removed item was the last in the list.
          const removeButtons =
            this.shadowRoot?.querySelectorAll<HTMLButtonElement>('.file-item__remove');
          if (removeButtons && removeButtons.length > 0) {
            const targetIndex = index < this._files.length ? index : this._files.length - 1;
            const targetButton = removeButtons[targetIndex];
            if (targetButton) {
              targetButton.focus();
            }
          }
        }
      })
      .catch(() => {
        // Focus restoration is best-effort; ignore errors.
      });
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
          aria-label=${ifDefined(this._effectiveLabel || (!this.label ? dropzoneLabel : undefined))}
          aria-labelledby=${ifDefined(!this._effectiveLabel && this.label ? this._labelId : undefined)}
          aria-disabled=${this.disabled ? 'true' : nothing}
          aria-invalid=${hasError ? 'true' : nothing}
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
          ${this._dragOver ? this.labelDragDetected : ''}
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

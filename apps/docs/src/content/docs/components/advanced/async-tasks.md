---
title: Async Tasks
description: Managing asynchronous operations in Lit components using the Task reactive controller from @lit/task.
---

Asynchronous data loading is unavoidable in healthcare applications. Components must fetch patient records, medication lists, lab results, and appointment data from APIs — and they must handle loading, success, and error states without introducing race conditions or memory leaks. The `Task` reactive controller from `@lit/task` solves this cleanly, with cancellation, automatic re-execution on argument changes, and a typed render helper that eliminates boilerplate.

## Installing @lit/task

```bash
npm install @lit/task
```

The package ships its own TypeScript types. No `@types/` package is needed.

## The Task Controller API

`Task` is a reactive controller, so it follows the same lifecycle as controllers described in the [Reactive Controllers](/components/advanced/controllers) guide. You create it inside the component class, pass the host reference (`this`), and it registers itself automatically.

### Constructor signature

```typescript
import { Task } from '@lit/task';

class MyComponent extends LitElement {
  private _task = new Task(this, {
    task: async ([arg1, arg2], { signal }) => {
      // Async work here. signal is an AbortController signal.
      return result;
    },
    args: () => [this.arg1, this.arg2] as const,
  });
}
```

The two required options are:

- **`task`** — An async function that receives the args tuple and an options object containing an `AbortSignal`. It returns a `Promise` of the result type.
- **`args`** — A function that returns a tuple of values. Whenever the tuple changes (by reference equality), the task re-executes automatically. This is how the Task controller knows when to re-fetch.

### TypeScript generics

`Task` is generic over two type parameters:

```typescript
Task<Args extends readonly unknown[], Result>
```

- `Args` — The tuple type returned by `args()`. Use `as const` on the return value to preserve tuple types.
- `Result` — The resolved type of the `task` function's returned Promise.

Full typed example:

```typescript
import { Task } from '@lit/task';

interface Patient {
  id: string;
  name: string;
  mrn: string;
  dateOfBirth: string;
}

class HelixPatientCard extends LitElement {
  @property({ type: String })
  patientId = '';

  private _patientTask = new Task<[string], Patient>(this, {
    task: async ([id], { signal }) => {
      const response = await fetch(`/api/patients/${id}`, { signal });
      if (!response.ok) {
        throw new Error(`Failed to load patient ${id}: ${response.statusText}`);
      }
      return response.json() as Promise<Patient>;
    },
    args: () => [this.patientId] as const,
  });
}
```

TypeScript will infer that `task.value` is `Patient | undefined` and that the `complete` render callback receives a `Patient`.

---

## Task Status Values

`Task` tracks its own state through the `TaskStatus` enum:

```typescript
import { TaskStatus } from '@lit/task';

// TaskStatus.INITIAL   — Task has never run (args returned undefined, or task was never started)
// TaskStatus.PENDING   — Task is currently running
// TaskStatus.COMPLETE  — Task completed successfully; result is in task.value
// TaskStatus.ERROR     — Task threw; error is in task.error
```

You can read `task.status` directly and branch on it in `render()`, or use the `task.render()` helper.

### Reading status directly

```typescript
override render() {
  if (this._patientTask.status === TaskStatus.PENDING) {
    return html`<hx-spinner></hx-spinner>`;
  }

  if (this._patientTask.status === TaskStatus.ERROR) {
    return html`<hx-alert variant="error">${this._patientTask.error?.message}</hx-alert>`;
  }

  const patient = this._patientTask.value;
  if (!patient) return html`<p>No patient selected.</p>`;

  return html`
    <div part="card">
      <h2>${patient.name}</h2>
      <p>MRN: ${patient.mrn}</p>
    </div>
  `;
}
```

---

## task.render() — The Recommended Approach

The `task.render()` method accepts an object with optional callbacks for each status. This is cleaner than a chain of `if` statements and ensures you handle every case explicitly:

```typescript
import { html } from 'lit';

override render() {
  return this._patientTask.render({
    initial: () => html`<p>Enter a patient ID to load records.</p>`,
    pending: () => html`<hx-spinner label="Loading patient..."></hx-spinner>`,
    complete: (patient) => html`
      <div part="patient-card">
        <hx-badge variant="info">${patient.mrn}</hx-badge>
        <h2>${patient.name}</h2>
        <p>Date of Birth: ${patient.dateOfBirth}</p>
      </div>
    `,
    error: (error) => html`
      <hx-alert variant="error">
        Failed to load patient: ${(error as Error).message}
      </hx-alert>
    `,
  });
}
```

All four callbacks are optional. If you omit `initial`, the task renders nothing in the initial state.

---

## Automatic Re-Execution When Args Change

The `args` function is the key to automatic re-fetching. Every time the component updates, Lit evaluates the `args` function and compares the result to the previous run using `===` for each element. If anything changed, the task re-executes.

```typescript
@customElement('hx-lab-results')
export class HelixLabResults extends LitElement {
  @property({ type: String })
  patientId = '';

  @property({ type: String })
  dateRange: 'week' | 'month' | 'year' = 'month';

  // Re-fetches whenever patientId or dateRange changes
  private _resultsTask = new Task<[string, string], LabResult[]>(this, {
    task: async ([patientId, dateRange], { signal }) => {
      const url = `/api/patients/${patientId}/labs?range=${dateRange}`;
      const response = await fetch(url, { signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json() as Promise<LabResult[]>;
    },
    args: () => [this.patientId, this.dateRange] as const,
  });

  override render() {
    return html`
      <div part="controls">
        <label
          >Date Range:
          <select
            @change=${(e: Event) => {
              this.dateRange = (e.target as HTMLSelectElement).value as typeof this.dateRange;
            }}
          >
            <option value="week">Past Week</option>
            <option value="month">Past Month</option>
            <option value="year">Past Year</option>
          </select>
        </label>
      </div>

      ${this._resultsTask.render({
        pending: () => html`<hx-spinner></hx-spinner>`,
        complete: (results) => html`
          <ul part="results">
            ${results.map(
              (r) => html`<li>${r.testName}: <strong>${r.value} ${r.unit}</strong></li>`,
            )}
          </ul>
        `,
        error: (e) => html`<hx-alert variant="error">${(e as Error).message}</hx-alert>`,
      })}
    `;
  }
}
```

Changing the `dateRange` select triggers a property update. The `args` function returns a different tuple. The task re-runs with the new args and the previous in-flight request is cancelled via its `AbortSignal`.

---

## Cancellation with AbortController

The second argument to the `task` function is `{ signal: AbortSignal }`. Pass this signal to `fetch()` and any other cancellable APIs. When the task is cancelled (because args changed or the component disconnected), the signal is aborted automatically.

```typescript
private _task = new Task<[string], Patient>(this, {
  task: async ([id], { signal }) => {
    // signal is aborted if patientId changes before this resolves
    const response = await fetch(`/api/patients/${id}`, { signal });
    if (!response.ok) throw new Error(response.statusText);
    return response.json() as Promise<Patient>;
  },
  args: () => [this.patientId] as const,
});
```

If `patientId` changes while the previous fetch is in flight, the browser cancels the previous request network-level. The `AbortError` thrown by `fetch()` is swallowed by the Task controller internally — it does not put the task into the error state when cancellation is the cause.

### Manual signal use in non-fetch async work

For non-fetch async operations, check `signal.aborted` at checkpoints:

```typescript
private _processingTask = new Task<[string[]], ProcessedRecord[]>(this, {
  task: async ([ids], { signal }) => {
    const results: ProcessedRecord[] = [];

    for (const id of ids) {
      // Check cancellation before each item
      if (signal.aborted) throw signal.reason;

      const record = await processRecord(id);
      results.push(record);
    }

    return results;
  },
  args: () => [this.recordIds] as const,
});
```

---

## Manual Task Execution with task.run()

By default, the task runs automatically when `args` change. For tasks that should run on demand (e.g., triggered by a button click), you can call `task.run()` directly:

```typescript
@customElement('hx-export-button')
export class HelixExportButton extends LitElement {
  @property({ type: String })
  patientId = '';

  // No args function — this task runs only on demand
  private _exportTask = new Task<[string], Blob>(this, {
    task: async ([id], { signal }) => {
      const response = await fetch(`/api/patients/${id}/export`, {
        method: 'POST',
        signal,
      });
      if (!response.ok) throw new Error('Export failed');
      return response.blob();
    },
    // Provide args so the task has access to them when run() is called
    args: () => [this.patientId] as const,
    // Prevent automatic execution on mount — run only when requested
    autoRun: false,
  });

  private async _handleExport(): Promise<void> {
    try {
      await this._exportTask.run();
      const blob = this._exportTask.value;
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `patient-${this.patientId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // Error state is already reflected in task.status
    }
  }

  override render() {
    return html`
      ${this._exportTask.render({
        initial: () => html` <hx-button @click=${this._handleExport}>Export Records</hx-button> `,
        pending: () => html`
          <hx-button disabled>
            <hx-spinner size="sm" slot="prefix"></hx-spinner>
            Exporting...
          </hx-button>
        `,
        complete: () => html`
          <hx-button variant="ghost" @click=${this._handleExport}>Export Again</hx-button>
        `,
        error: () => html`
          <hx-alert variant="error">Export failed. Try again.</hx-alert>
          <hx-button @click=${this._handleExport}>Retry</hx-button>
        `,
      })}
    `;
  }
}
```

---

## Combining Multiple Tasks

A component can have multiple `Task` instances for different data dependencies. Each task is independent — they do not block each other.

```typescript
@customElement('hx-patient-dashboard')
export class HelixPatientDashboard extends LitElement {
  @property({ type: String })
  patientId = '';

  // Task 1: Fetch patient profile
  private _profileTask = new Task<[string], PatientProfile>(this, {
    task: async ([id], { signal }) => {
      const res = await fetch(`/api/patients/${id}`, { signal });
      if (!res.ok) throw new Error('Failed to load profile');
      return res.json() as Promise<PatientProfile>;
    },
    args: () => [this.patientId] as const,
  });

  // Task 2: Fetch active medications (depends on same patientId)
  private _medsTask = new Task<[string], Medication[]>(this, {
    task: async ([id], { signal }) => {
      const res = await fetch(`/api/patients/${id}/medications?status=active`, { signal });
      if (!res.ok) throw new Error('Failed to load medications');
      return res.json() as Promise<Medication[]>;
    },
    args: () => [this.patientId] as const,
  });

  // Task 3: Fetch recent alerts
  private _alertsTask = new Task<[string], PatientAlert[]>(this, {
    task: async ([id], { signal }) => {
      const res = await fetch(`/api/patients/${id}/alerts?limit=5`, { signal });
      if (!res.ok) throw new Error('Failed to load alerts');
      return res.json() as Promise<PatientAlert[]>;
    },
    args: () => [this.patientId] as const,
  });

  override render() {
    return html`
      <div part="dashboard" class="dashboard">
        <section part="profile">
          ${this._profileTask.render({
            pending: () => html`<hx-skeleton lines="3"></hx-skeleton>`,
            complete: (profile) => html`
              <h1>${profile.name}</h1>
              <p class="mrn">MRN: ${profile.mrn}</p>
            `,
            error: (e) => html` <hx-alert variant="error">${(e as Error).message}</hx-alert> `,
          })}
        </section>

        <section part="medications">
          <h2>Active Medications</h2>
          ${this._medsTask.render({
            pending: () => html`<hx-spinner></hx-spinner>`,
            complete: (meds) =>
              meds.length === 0
                ? html`<p>No active medications.</p>`
                : html`
                    <ul>
                      ${meds.map((m) => html`<li>${m.name} ${m.dosage}</li>`)}
                    </ul>
                  `,
            error: () => html`<p class="error">Could not load medications.</p>`,
          })}
        </section>

        <section part="alerts">
          <h2>Recent Alerts</h2>
          ${this._alertsTask.render({
            pending: () => html`<hx-spinner></hx-spinner>`,
            complete: (alerts) =>
              alerts.map(
                (alert) => html`
                  <hx-alert variant=${alert.severity} closable open> ${alert.message} </hx-alert>
                `,
              ),
            error: () => html`<p class="error">Could not load alerts.</p>`,
          })}
        </section>
      </div>
    `;
  }
}
```

The three fetches run in parallel. If `patientId` changes, all three are cancelled and restarted simultaneously.

---

## Task vs. Fetching in updated()

Before `@lit/task` existed, developers fetched data in `updated()`:

```typescript
// Old approach — do not use this
override async updated(changed: Map<string, unknown>): Promise<void> {
  super.updated(changed);

  if (changed.has('patientId')) {
    this._loading = true;
    this._error = undefined;

    try {
      const res = await fetch(`/api/patients/${this.patientId}`);
      this._patient = await res.json();
    } catch (e) {
      this._error = e as Error;
    } finally {
      this._loading = false;
      this.requestUpdate();
    }
  }
}
```

This approach has several problems:

| Problem                     | Impact                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------ |
| No cancellation             | If `patientId` changes before the fetch resolves, the stale result overwrites the newer one (race condition) |
| Manual state tracking       | Requires `@state()` properties for loading, error, and result separately                                     |
| No AbortController plumbing | You must write it yourself                                                                                   |
| Error swallowing            | Easy to miss error cases                                                                                     |
| No re-run API               | No way to retry without duplicating logic                                                                    |

`Task` eliminates all of these problems. Use `Task` for any async operation that depends on component properties.

---

## Testing Async Tasks in Vitest

Testing async tasks requires controlling timing. Use `task.run()` to trigger execution in tests, and `element.updateComplete` to wait for renders.

```typescript
import { describe, it, expect, vi, afterEach } from 'vitest';
import { html } from 'lit';
import { fixture, cleanup } from '../../test-utils.js';
import './hx-patient-card.js';
import type { HelixPatientCard } from './hx-patient-card.js';

// Mock the global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('hx-patient-card', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('shows spinner while loading', async () => {
    // Never resolves — simulates a long-running request
    mockFetch.mockReturnValue(new Promise(() => {}));

    const el = await fixture<HelixPatientCard>(
      html`<hx-patient-card patient-id="P-001"></hx-patient-card>`,
    );

    await el.updateComplete;

    const spinner = el.shadowRoot?.querySelector('hx-spinner');
    expect(spinner).toBeTruthy();
  });

  it('renders patient data on success', async () => {
    const patient = {
      id: 'P-001',
      name: 'Jane Smith',
      mrn: 'MRN-12345',
      dateOfBirth: '1985-03-22',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => patient,
    });

    const el = await fixture<HelixPatientCard>(
      html`<hx-patient-card patient-id="P-001"></hx-patient-card>`,
    );

    // Wait for the task to complete and the component to re-render
    await el.updateComplete;
    // Task may schedule one additional microtask for the result
    await el.updateComplete;

    const heading = el.shadowRoot?.querySelector('h2');
    expect(heading?.textContent?.trim()).toBe('Jane Smith');
  });

  it('shows error alert on fetch failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    });

    const el = await fixture<HelixPatientCard>(
      html`<hx-patient-card patient-id="INVALID"></hx-patient-card>`,
    );

    await el.updateComplete;
    await el.updateComplete;

    const alert = el.shadowRoot?.querySelector('hx-alert');
    expect(alert).toBeTruthy();
    expect(alert?.getAttribute('variant')).toBe('error');
  });

  it('re-fetches when patientId changes', async () => {
    const patient1 = { id: 'P-001', name: 'Jane Smith', mrn: 'MRN-001', dateOfBirth: '1985-03-22' };
    const patient2 = { id: 'P-002', name: 'John Doe', mrn: 'MRN-002', dateOfBirth: '1990-07-14' };

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => patient1 })
      .mockResolvedValueOnce({ ok: true, json: async () => patient2 });

    const el = await fixture<HelixPatientCard>(
      html`<hx-patient-card patient-id="P-001"></hx-patient-card>`,
    );

    await el.updateComplete;
    await el.updateComplete;

    expect(el.shadowRoot?.querySelector('h2')?.textContent?.trim()).toBe('Jane Smith');

    // Change the property — should trigger re-fetch
    el.patientId = 'P-002';
    await el.updateComplete;
    await el.updateComplete;

    expect(el.shadowRoot?.querySelector('h2')?.textContent?.trim()).toBe('John Doe');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('passes AbortSignal to fetch', async () => {
    let capturedSignal: AbortSignal | undefined;

    mockFetch.mockImplementationOnce((_url: string, options: RequestInit) => {
      capturedSignal = options.signal as AbortSignal;
      return new Promise(() => {}); // Never resolves
    });

    const el = await fixture<HelixPatientCard>(
      html`<hx-patient-card patient-id="P-001"></hx-patient-card>`,
    );

    await el.updateComplete;

    expect(capturedSignal).toBeInstanceOf(AbortSignal);
  });
});
```

---

## Complete Example: Data-Loading Component

The following is a complete, production-ready `hx-patient-card` component demonstrating all Task patterns together.

```typescript
import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Task } from '@lit/task';

interface Patient {
  id: string;
  name: string;
  mrn: string;
  dateOfBirth: string;
  primaryPhysician: string;
  room: string;
}

/**
 * Displays a patient summary card, loading data from the patient API.
 * Automatically re-fetches when `patient-id` changes.
 *
 * @element hx-patient-card
 *
 * @attr {string} patient-id - The patient identifier. Setting this triggers a fetch.
 *
 * @csspart card - The outer card container
 * @csspart header - The card header containing name and MRN
 * @csspart body - The card body containing patient details
 */
@customElement('hx-patient-card')
export class HelixPatientCard extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    [part='card'] {
      border: 1px solid var(--hx-color-border);
      border-radius: var(--hx-radius-md);
      overflow: hidden;
      background: var(--hx-color-surface);
    }

    [part='header'] {
      padding: var(--hx-spacing-md);
      background: var(--hx-color-surface-raised);
      border-bottom: 1px solid var(--hx-color-border);
    }

    [part='header'] h2 {
      margin: 0 0 var(--hx-spacing-xs);
      font-size: var(--hx-font-size-lg);
      font-weight: var(--hx-font-weight-semibold);
      color: var(--hx-color-text-primary);
    }

    .mrn {
      font-size: var(--hx-font-size-sm);
      color: var(--hx-color-text-secondary);
      margin: 0;
    }

    [part='body'] {
      padding: var(--hx-spacing-md);
    }

    .detail-row {
      display: flex;
      gap: var(--hx-spacing-sm);
      margin-bottom: var(--hx-spacing-xs);
      font-size: var(--hx-font-size-sm);
    }

    .detail-label {
      font-weight: var(--hx-font-weight-medium);
      color: var(--hx-color-text-secondary);
      min-width: 10ch;
    }

    .skeleton {
      background: var(--hx-color-surface-muted);
      border-radius: var(--hx-radius-sm);
      animation: pulse 1.5s ease-in-out infinite;
    }

    .skeleton-text {
      height: 1em;
      margin-bottom: var(--hx-spacing-xs);
    }

    @keyframes pulse {
      0%,
      100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }
  `;

  /**
   * The patient identifier. Changing this property triggers a new API fetch.
   * @attr patient-id
   */
  @property({ type: String, attribute: 'patient-id' })
  patientId = '';

  private _patientTask = new Task<[string], Patient>(this, {
    task: async ([id], { signal }) => {
      if (!id) throw new Error('No patient ID provided');

      const response = await fetch(`/api/patients/${id}`, { signal });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Patient ${id} not found`);
        }
        throw new Error(`Failed to load patient: ${response.statusText}`);
      }

      return response.json() as Promise<Patient>;
    },
    args: () => [this.patientId] as const,
  });

  override render() {
    return this._patientTask.render({
      initial: () => html`
        <div part="card">
          <div part="body">
            <p>Select a patient to view their record.</p>
          </div>
        </div>
      `,

      pending: () => html`
        <div part="card" aria-busy="true" aria-label="Loading patient record">
          <div part="header">
            <div class="skeleton skeleton-text" style="width: 60%"></div>
            <div class="skeleton skeleton-text" style="width: 35%"></div>
          </div>
          <div part="body">
            <div class="skeleton skeleton-text" style="width: 80%"></div>
            <div class="skeleton skeleton-text" style="width: 70%"></div>
            <div class="skeleton skeleton-text" style="width: 55%"></div>
          </div>
        </div>
      `,

      complete: (patient) => html`
        <div part="card">
          <div part="header">
            <h2>${patient.name}</h2>
            <p class="mrn">MRN: ${patient.mrn}</p>
          </div>
          <div part="body">
            <div class="detail-row">
              <span class="detail-label">DOB</span>
              <span>${patient.dateOfBirth}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Physician</span>
              <span>${patient.primaryPhysician}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Room</span>
              <span>${patient.room}</span>
            </div>
          </div>
        </div>
      `,

      error: (error) => html`
        <div part="card">
          <div part="body">
            <hx-alert variant="error">
              ${(error as Error).message}
              <hx-button
                slot="actions"
                variant="ghost"
                size="sm"
                @click=${() => this._patientTask.run()}
              >
                Retry
              </hx-button>
            </hx-alert>
          </div>
        </div>
      `,
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-patient-card': HelixPatientCard;
  }
}
```

---

## Common Pitfalls

### Forgetting `as const` on the args return

Without `as const`, TypeScript widens the tuple to an array, losing position type information:

```typescript
// Wrong — args is inferred as (string | number)[]
args: () => [this.patientId, this.limit],

// Correct — args is inferred as readonly [string, number]
args: () => [this.patientId, this.limit] as const,
```

### Not awaiting updateComplete twice for complex renders

The task internally calls `requestUpdate()` when it transitions states. In tests, a single `await el.updateComplete` may not be sufficient to settle both the task state change and the resulting render:

```typescript
// In tests: wait twice to ensure the component fully settles
await el.updateComplete;
await el.updateComplete;
```

### Using async updated() instead of Task

The `updated()` lifecycle hook does not handle cancellation, race conditions, or retries. Always prefer `Task` for async operations tied to reactive property changes.

### Missing error typing

The `error` callback in `task.render()` receives `unknown`, not `Error`. Always cast before accessing `.message`:

```typescript
error: (e) => html`${(e as Error).message}`,
```

---

## References

- [@lit/task on npm](https://www.npmjs.com/package/@lit/task)
- [Lit — Async Tasks guide](https://lit.dev/docs/data/task/)
- [AbortController — MDN](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [Reactive Controllers](/components/advanced/controllers) — the underlying pattern Task is built on
- [State Management](/components/advanced/state-management) — for non-async state patterns

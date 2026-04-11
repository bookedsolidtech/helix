---
title: Async Tasks
description: Use @lit/task to manage async data fetching in HELiX components with automatic re-runs, loading states, and error handling.
---

`@lit/task` provides a `Task` class that wraps async operations and integrates them with Lit's reactive update cycle. It handles the `pending / complete / error` states that every data-fetching component needs, re-runs automatically when its argument dependencies change, and prevents stale responses from overwriting newer ones.

## Installation

```bash
npm install @lit/task
```

## Basic Task Declaration

```typescript
import { Task } from '@lit/task';
```

A `Task` is constructed with the host element, a task function, and an `args` function that returns the array of values the task depends on:

```typescript
import { LitElement, html, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Task } from '@lit/task';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
}

@customElement('hx-user-card')
export class HelixUserCard extends LitElement {
  @property({ type: String })
  userId: string = '';

  // Task auto-runs when userId changes
  private _userTask = new Task(this, {
    task: async ([userId]: [string]) => {
      if (!userId) return null;
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) throw new Error(`Failed to fetch user: ${response.status}`);
      return (await response.json()) as UserProfile;
    },
    args: () => [this.userId] as [string],
  });

  override render(): TemplateResult {
    return html`
      ${this._userTask.render({
        pending: () => html`<div class="skeleton" aria-busy="true"></div>`,
        complete: (user) =>
          user
            ? html`
                <div class="card">
                  <img src=${user.avatarUrl} alt="" />
                  <div class="card__info">
                    <strong>${user.name}</strong>
                    <span>${user.email}</span>
                  </div>
                </div>
              `
            : html`<div class="card--empty">No user selected.</div>`,
        error: (err) =>
          html`<div class="card--error" role="alert">
            Failed to load user: ${err instanceof Error ? err.message : 'Unknown error'}
          </div>`,
      })}
    `;
  }
}
```

## How `args` Triggers Re-Runs

The `args` function is called before every component update. If the returned array differs from the previous call (compared by strict equality per element), the task function re-runs. This is analogous to `useEffect` dependencies in React:

```typescript
// Re-runs when userId OR pageSize changes
private _itemsTask = new Task(this, {
  task: async ([userId, pageSize]: [string, number]) => {
    const response = await fetch(`/api/users/${userId}/items?limit=${pageSize}`);
    if (!response.ok) throw new Error('Failed to fetch items');
    return (await response.json()) as Item[];
  },
  args: () => [this.userId, this.pageSize] as [string, number],
});
```

When `args` returns the same values as before, the task does not re-run and the last `complete` result is preserved.

## Task States

A `Task` instance exposes its current state via `task.status`:

```typescript
import { TaskStatus } from '@lit/task';

// TaskStatus.INITIAL  — task has never run
// TaskStatus.PENDING  — task is running
// TaskStatus.COMPLETE — task completed successfully
// TaskStatus.ERROR    — task threw an error
```

You can read these directly if you need more control than `task.render()` provides:

```typescript
override render(): TemplateResult {
  const isLoading = this._userTask.status === TaskStatus.PENDING;
  const hasError = this._userTask.status === TaskStatus.ERROR;

  return html`
    <div
      class="container"
      aria-busy=${isLoading}
      aria-invalid=${hasError}
    >
      ${isLoading ? html`<hx-spinner></hx-spinner>` : nothing}
      ${hasError
        ? html`<hx-alert variant="error">${this._userTask.error}</hx-alert>`
        : nothing}
      ${this._userTask.value
        ? html`<div class="content">${this._userTask.value.name}</div>`
        : nothing}
    </div>
  `;
}
```

## Error Handling and Retry

Caught errors are available as `task.error`. To add retry behavior, expose a method that calls `task.run()`:

```typescript
import { LitElement, html, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Task } from '@lit/task';

@customElement('hx-data-table')
export class HelixDataTable extends LitElement {

  @property({ type: String })
  endpoint: string = '';

  @property({ type: Number })
  maxRetries: number = 3;

  private _retryCount: number = 0;

  private _dataTask = new Task(this, {
    task: async ([endpoint]: [string]) => {
      if (!endpoint) return [];
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      this._retryCount = 0; // reset on success
      return (await response.json()) as unknown[];
    },
    args: () => [this.endpoint] as [string],
  });

  private _retry(): void {
    if (this._retryCount < this.maxRetries) {
      this._retryCount++;
      this._dataTask.run();
    }
  }

  override render(): TemplateResult {
    return html`
      ${this._dataTask.render({
        pending: () => html`<hx-spinner label="Loading data..."></hx-spinner>`,
        complete: (rows) => html`
          <table>
            ${rows.map((row) => html`<tr>${JSON.stringify(row)}</tr>`)}
          </table>
        `,
        error: () => html`
          <div class="error-state" role="alert">
            <p>Failed to load data.</p>
            ${this._retryCount < this.maxRetries
              ? html`<hx-button @hx-click=${this._retry}>Retry</hx-button>`
              : html`<p>Max retries exceeded.</p>`}
          </div>
        `,
      })}
    `;
  }
}
```

## Combining Task with Context

Tasks integrate naturally with the Context Protocol. A consumer reads a configuration value from context and passes it to the task's `args`:

```typescript
import { consume } from '@lit/context';
import { Task } from '@lit/task';
import { helixConfigContext, type HelixConfig } from './contexts.js';

@customElement('hx-config-driven-list')
export class HelixConfigDrivenList extends LitElement {

  @consume({ context: helixConfigContext, subscribe: true })
  helixConfig!: HelixConfig;

  @property({ type: String })
  category: string = '';

  private _listTask = new Task(this, {
    task: async ([category, pageSize]: [string, number]) => {
      const response = await fetch(`/api/items?category=${category}&limit=${pageSize}`);
      if (!response.ok) throw new Error('Fetch failed');
      return (await response.json()) as unknown[];
    },
    // Re-runs when category OR helixConfig.defaultIconSize changes
    args: () => [this.category, this.helixConfig?.defaultIconSize === 'lg' ? 20 : 10] as [string, number],
  });

  override render() {
    return html`
      ${this._listTask.render({
        pending: () => html`<hx-spinner></hx-spinner>`,
        complete: (items) => html`<ul>${items.map((i) => html`<li>${JSON.stringify(i)}</li>`)}</ul>`,
        error: () => html`<p>Error loading items.</p>`,
      })}
    `;
  }
}
```

## Next Steps

- [Reactive Controllers](/components-guide/advanced/controllers/) — the mechanism `Task` builds on internally
- [Context Protocol](/components-guide/advanced/context-protocol/) — sharing task configuration across the component tree
- [Custom Directives](/components-guide/advanced/directives-advanced/) — directive-based rendering helpers for task states

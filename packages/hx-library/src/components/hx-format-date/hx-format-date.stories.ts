import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect, within } from 'storybook/test';
import './index.js';

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

// A fixed ISO date for deterministic story previews
const DEMO_DATE = '2024-06-15T14:30:00.000Z';

const meta = {
  title: 'Components/Format Date',
  component: 'hx-format-date',
  tags: ['autodocs'],
  argTypes: {
    date: {
      control: 'text',
      description:
        'The date/time to format. Accepts an ISO string, Unix timestamp (ms), or `Date` object. Defaults to current time when empty.',
      table: {
        category: 'Content',
        type: { summary: 'string | number | Date' },
      },
    },
    lang: {
      control: 'text',
      description:
        'BCP 47 locale tag (e.g. `"en-US"`, `"de"`, `"ja"`). Defaults to `document.documentElement.lang` or `navigator.language`.',
      table: {
        category: 'Locale',
        type: { summary: 'string' },
      },
    },
    month: {
      control: { type: 'select' },
      options: [undefined, 'narrow', 'short', 'long', 'numeric', '2-digit'],
      description: 'Month display format.',
      table: {
        category: 'Format',
        type: { summary: "'narrow' | 'short' | 'long' | 'numeric' | '2-digit'" },
      },
    },
    year: {
      control: { type: 'select' },
      options: [undefined, 'numeric', '2-digit'],
      description: 'Year display format.',
      table: {
        category: 'Format',
        type: { summary: "'numeric' | '2-digit'" },
      },
    },
    day: {
      control: { type: 'select' },
      options: [undefined, 'numeric', '2-digit'],
      description: 'Day of month display format.',
      table: {
        category: 'Format',
        type: { summary: "'numeric' | '2-digit'" },
      },
    },
    weekday: {
      control: { type: 'select' },
      options: [undefined, 'narrow', 'short', 'long'],
      description: 'Weekday display format.',
      table: {
        category: 'Format',
        type: { summary: "'narrow' | 'short' | 'long'" },
      },
    },
    hour: {
      control: { type: 'select' },
      options: [undefined, 'numeric', '2-digit'],
      description: 'Hour display format.',
      table: {
        category: 'Format',
        type: { summary: "'numeric' | '2-digit'" },
      },
    },
    minute: {
      control: { type: 'select' },
      options: [undefined, 'numeric', '2-digit'],
      description: 'Minute display format.',
      table: {
        category: 'Format',
        type: { summary: "'numeric' | '2-digit'" },
      },
    },
    second: {
      control: { type: 'select' },
      options: [undefined, 'numeric', '2-digit'],
      description: 'Second display format.',
      table: {
        category: 'Format',
        type: { summary: "'numeric' | '2-digit'" },
      },
    },
    timeZoneName: {
      control: { type: 'select' },
      options: [undefined, 'short', 'long'],
      description: 'Time zone name display format.',
      table: {
        category: 'Format',
        type: { summary: "'short' | 'long'" },
      },
    },
    timeZone: {
      control: 'text',
      description: 'IANA time zone identifier (e.g. `"UTC"`, `"America/New_York"`).',
      table: {
        category: 'Format',
        type: { summary: 'string' },
      },
    },
    hourFormat: {
      control: { type: 'select' },
      options: ['auto', '12', '24'],
      description: 'Whether to use 12-hour or 24-hour clock. `"auto"` defers to locale.',
      table: {
        category: 'Format',
        defaultValue: { summary: 'auto' },
        type: { summary: "'auto' | '12' | '24'" },
      },
    },
    numeric: {
      control: { type: 'select' },
      options: ['always', 'auto'],
      description:
        'Controls whether relative format always uses numeric output (`"always"`) or natural language (`"auto"`). Only applies when `relative` is true.',
      table: {
        category: 'Relative',
        defaultValue: { summary: 'auto' },
        type: { summary: "'always' | 'auto'" },
      },
    },
    relative: {
      control: 'boolean',
      description:
        'When true, displays a human-friendly relative time string such as "2 hours ago" or "in 3 days".',
      table: {
        category: 'Relative',
        defaultValue: { summary: 'false' },
        type: { summary: 'boolean' },
      },
    },
  },
  args: {
    date: DEMO_DATE,
    lang: 'en-US',
    month: 'long',
    year: 'numeric',
    day: 'numeric',
    relative: false,
    hourFormat: 'auto',
    numeric: 'auto',
  },
  render: (args) => html`
    <hx-format-date
      date=${ifDefined(args.date)}
      lang=${args.lang ?? ''}
      month=${ifDefined(args.month)}
      year=${ifDefined(args.year)}
      day=${ifDefined(args.day)}
      weekday=${ifDefined(args.weekday)}
      hour=${ifDefined(args.hour)}
      minute=${ifDefined(args.minute)}
      second=${ifDefined(args.second)}
      time-zone-name=${ifDefined(args.timeZoneName)}
      time-zone=${ifDefined(args.timeZone)}
      hour-format=${args.hourFormat}
      numeric=${args.numeric}
      ?relative=${args.relative}
    ></hx-format-date>
  `,
} satisfies Meta;

export default meta;

type Story = StoryObj;

// ─────────────────────────────────────────────────
// 1. DEFAULT — Date with year/month/day
// ─────────────────────────────────────────────────

export const Default: Story = {
  args: {
    date: DEMO_DATE,
    lang: 'en-US',
    month: 'long',
    year: 'numeric',
    day: 'numeric',
  },
  play: async ({ canvasElement }) => {
    const _canvas = within(canvasElement);
    const el = canvasElement.querySelector('hx-format-date');
    await expect(el).toBeTruthy();
    const time = el!.shadowRoot!.querySelector('time');
    await expect(time).toBeTruthy();
    await expect(time!.getAttribute('datetime')).toBeTruthy();
  },
};

// ─────────────────────────────────────────────────
// 2. DATE FORMATS
// ─────────────────────────────────────────────────

export const DateOnly: Story = {
  name: 'Date Only (long)',
  render: () => html`
    <hx-format-date date=${DEMO_DATE} lang="en-US" month="long" year="numeric" day="numeric">
    </hx-format-date>
  `,
};

export const DateShort: Story = {
  name: 'Date (short)',
  render: () => html`
    <hx-format-date date=${DEMO_DATE} lang="en-US" month="short" year="numeric" day="numeric">
    </hx-format-date>
  `,
};

export const DateNumeric: Story = {
  name: 'Date (numeric)',
  render: () => html`
    <hx-format-date date=${DEMO_DATE} lang="en-US" month="numeric" year="numeric" day="numeric">
    </hx-format-date>
  `,
};

export const WithWeekday: Story = {
  name: 'Date with Weekday',
  render: () => html`
    <hx-format-date
      date=${DEMO_DATE}
      lang="en-US"
      weekday="long"
      month="long"
      year="numeric"
      day="numeric"
    ></hx-format-date>
  `,
};

// ─────────────────────────────────────────────────
// 3. TIME FORMATS
// ─────────────────────────────────────────────────

export const TimeOnly: Story = {
  name: 'Time Only',
  render: () => html`
    <hx-format-date date=${DEMO_DATE} lang="en-US" hour="numeric" minute="2-digit">
    </hx-format-date>
  `,
};

export const TimeWithSeconds: Story = {
  name: 'Time with Seconds',
  render: () => html`
    <hx-format-date
      date=${DEMO_DATE}
      lang="en-US"
      hour="numeric"
      minute="2-digit"
      second="2-digit"
    ></hx-format-date>
  `,
};

export const Time24Hour: Story = {
  name: 'Time (24-hour clock)',
  render: () => html`
    <hx-format-date
      date=${DEMO_DATE}
      lang="en-US"
      hour="2-digit"
      minute="2-digit"
      hour-format="24"
    ></hx-format-date>
  `,
};

export const TimeWithZone: Story = {
  name: 'Time with Time Zone Name',
  render: () => html`
    <hx-format-date
      date=${DEMO_DATE}
      lang="en-US"
      hour="numeric"
      minute="2-digit"
      time-zone-name="short"
      time-zone="America/New_York"
    ></hx-format-date>
  `,
};

// ─────────────────────────────────────────────────
// 4. LOCALE STORIES
// ─────────────────────────────────────────────────

export const MultipleLocales: Story = {
  name: 'Multiple Locales',
  play: async ({ canvasElement }) => {
    const els = canvasElement.querySelectorAll('hx-format-date');
    for (const el of els) {
      const time = el.shadowRoot!.querySelector('time');
      await expect(time!.textContent!.trim().length).toBeGreaterThan(0);
    }
    // en-US long month for June should contain "June"
    const enEl = els[0];
    const enTime = enEl!.shadowRoot!.querySelector('time');
    await expect(enTime!.textContent).toContain('June');
  },
  render: () => html`
    <div style="display: flex; flex-direction: column; gap: 0.5rem; font-family: sans-serif;">
      <div>
        <strong>en-US:</strong>
        <hx-format-date
          date=${DEMO_DATE}
          lang="en-US"
          month="long"
          year="numeric"
          day="numeric"
        ></hx-format-date>
      </div>
      <div>
        <strong>de:</strong>
        <hx-format-date
          date=${DEMO_DATE}
          lang="de"
          month="long"
          year="numeric"
          day="numeric"
        ></hx-format-date>
      </div>
      <div>
        <strong>ja:</strong>
        <hx-format-date
          date=${DEMO_DATE}
          lang="ja"
          month="long"
          year="numeric"
          day="numeric"
        ></hx-format-date>
      </div>
      <div>
        <strong>ar-SA:</strong>
        <hx-format-date
          date=${DEMO_DATE}
          lang="ar-SA"
          month="long"
          year="numeric"
          day="numeric"
        ></hx-format-date>
      </div>
      <div>
        <strong>fr-FR:</strong>
        <hx-format-date
          date=${DEMO_DATE}
          lang="fr-FR"
          month="long"
          year="numeric"
          day="numeric"
        ></hx-format-date>
      </div>
      <div>
        <strong>zh-CN:</strong>
        <hx-format-date
          date=${DEMO_DATE}
          lang="zh-CN"
          month="long"
          year="numeric"
          day="numeric"
        ></hx-format-date>
      </div>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 5. RELATIVE TIME
// ─────────────────────────────────────────────────

export const RelativeTimeAuto: Story = {
  name: 'Relative Time (auto)',
  play: async ({ canvasElement }) => {
    const els = canvasElement.querySelectorAll('hx-format-date');
    for (const el of els) {
      const time = el.shadowRoot!.querySelector('time');
      await expect(time!.textContent!.trim().length).toBeGreaterThan(0);
    }
    // All relative time elements should contain "ago" or "in" (past/future)
    const firstEl = els[0];
    const firstTime = firstEl!.shadowRoot!.querySelector('time');
    await expect(firstTime!.textContent).toMatch(/ago|in/i);
  },
  render: () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const inTwoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    return html`
      <div style="display: flex; flex-direction: column; gap: 0.5rem; font-family: sans-serif;">
        <div>
          <strong>5 minutes ago:</strong>
          <hx-format-date date=${fiveMinutesAgo} relative lang="en-US"></hx-format-date>
        </div>
        <div>
          <strong>2 hours ago:</strong>
          <hx-format-date date=${twoHoursAgo} relative lang="en-US"></hx-format-date>
        </div>
        <div>
          <strong>3 days ago:</strong>
          <hx-format-date date=${threeDaysAgo} relative lang="en-US"></hx-format-date>
        </div>
        <div>
          <strong>In 2 weeks:</strong>
          <hx-format-date date=${inTwoWeeks} relative lang="en-US"></hx-format-date>
        </div>
      </div>
    `;
  },
};

export const RelativeTimeAlways: Story = {
  name: 'Relative Time (numeric="always")',
  render: () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    return html`
      <div style="display: flex; flex-direction: column; gap: 0.5rem; font-family: sans-serif;">
        <div>
          <strong>numeric="auto" (yesterday):</strong>
          <hx-format-date date=${yesterday} relative numeric="auto" lang="en-US"></hx-format-date>
        </div>
        <div>
          <strong>numeric="always" (1 day ago):</strong>
          <hx-format-date date=${yesterday} relative numeric="always" lang="en-US"></hx-format-date>
        </div>
      </div>
    `;
  },
};

export const RelativeTimeLocales: Story = {
  name: 'Relative Time — Multiple Locales',
  render: () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    return html`
      <div style="display: flex; flex-direction: column; gap: 0.5rem; font-family: sans-serif;">
        <div>
          <strong>en-US:</strong>
          <hx-format-date date=${twoHoursAgo} relative lang="en-US"></hx-format-date>
        </div>
        <div>
          <strong>de:</strong>
          <hx-format-date date=${twoHoursAgo} relative lang="de"></hx-format-date>
        </div>
        <div>
          <strong>ja:</strong>
          <hx-format-date date=${twoHoursAgo} relative lang="ja"></hx-format-date>
        </div>
        <div>
          <strong>fr:</strong>
          <hx-format-date date=${twoHoursAgo} relative lang="fr"></hx-format-date>
        </div>
      </div>
    `;
  },
};

// ─────────────────────────────────────────────────
// 6. HEALTHCARE SCENARIOS
// ─────────────────────────────────────────────────

export const AppointmentTimestamp: Story = {
  name: 'Appointment Timestamp',
  play: async ({ canvasElement }) => {
    const el = canvasElement.querySelector('hx-format-date');
    const time = el!.shadowRoot!.querySelector('time');
    await expect(time!.textContent).toContain('September');
    await expect(time!.getAttribute('datetime')).toBeTruthy();
  },
  render: () => html`
    <div style="font-family: sans-serif; max-width: 400px;">
      <p style="margin: 0 0 0.5rem; font-weight: 600;">Next Appointment</p>
      <p style="margin: 0; color: #374151;">
        <hx-format-date
          date="2024-09-20T09:00:00.000Z"
          lang="en-US"
          weekday="long"
          month="long"
          day="numeric"
          year="numeric"
          hour="numeric"
          minute="2-digit"
          time-zone="America/New_York"
          time-zone-name="short"
        ></hx-format-date>
      </p>
    </div>
  `,
};

export const LabResultAge: Story = {
  name: 'Lab Result Age (relative)',
  render: () => {
    const resultTime = new Date(Date.now() - 45 * 60 * 1000).toISOString();
    return html`
      <div style="font-family: sans-serif; max-width: 400px;">
        <p style="margin: 0 0 0.25rem; font-weight: 600;">CBC Panel</p>
        <p style="margin: 0; font-size: 0.875rem; color: #6b7280;">
          Result received
          <hx-format-date date=${resultTime} relative lang="en-US"></hx-format-date>
        </p>
      </div>
    `;
  },
};

export const DischargeDate: Story = {
  name: 'Discharge Date',
  render: () => html`
    <div style="font-family: sans-serif;">
      <table style="border-collapse: collapse; font-size: 0.875rem;">
        <tr>
          <td style="padding: 0.5rem 1rem 0.5rem 0; color: #6b7280; font-weight: 500;">
            Admitted:
          </td>
          <td style="padding: 0.5rem 0;">
            <hx-format-date
              date="2024-06-10T08:30:00.000Z"
              lang="en-US"
              month="short"
              day="numeric"
              year="numeric"
              hour="numeric"
              minute="2-digit"
            ></hx-format-date>
          </td>
        </tr>
        <tr>
          <td style="padding: 0.5rem 1rem 0.5rem 0; color: #6b7280; font-weight: 500;">
            Discharged:
          </td>
          <td style="padding: 0.5rem 0;">
            <hx-format-date
              date="2024-06-15T14:30:00.000Z"
              lang="en-US"
              month="short"
              day="numeric"
              year="numeric"
              hour="numeric"
              minute="2-digit"
            ></hx-format-date>
          </td>
        </tr>
        <tr>
          <td style="padding: 0.5rem 1rem 0.5rem 0; color: #6b7280; font-weight: 500;">
            Duration:
          </td>
          <td style="padding: 0.5rem 0;">5 days</td>
        </tr>
      </table>
    </div>
  `,
};

// ─────────────────────────────────────────────────
// 7. INLINE USAGE
// ─────────────────────────────────────────────────

export const InlineParagraph: Story = {
  name: 'Inline in Paragraph',
  render: () => html`
    <p style="font-family: sans-serif; line-height: 1.6; max-width: 500px;">
      The patient's last visit was on
      <hx-format-date
        date=${DEMO_DATE}
        lang="en-US"
        month="long"
        day="numeric"
        year="numeric"
      ></hx-format-date>
      and the follow-up is scheduled for
      <hx-format-date
        date="2024-09-20T09:00:00.000Z"
        lang="en-US"
        month="long"
        day="numeric"
        year="numeric"
      ></hx-format-date
      >.
    </p>
  `,
};

// ─────────────────────────────────────────────────
// 8. EDGE CASES
// ─────────────────────────────────────────────────

export const InvalidDate: Story = {
  name: 'Invalid Date (fallback to current time)',
  render: () => html`
    <div style="font-family: sans-serif; display: flex; flex-direction: column; gap: 0.5rem;">
      <div>
        <strong>date="not-a-date":</strong>
        <hx-format-date date="not-a-date" lang="en-US" month="long" year="numeric" day="numeric">
        </hx-format-date>
        <em style="color:#6b7280; font-size:0.8em;">(falls back to current time)</em>
      </div>
      <div>
        <strong>date="" (empty):</strong>
        <hx-format-date lang="en-US" month="long" year="numeric" day="numeric"></hx-format-date>
        <em style="color:#6b7280; font-size:0.8em;">(current time by design)</em>
      </div>
    </div>
  `,
};

export const TimezoneComparison: Story = {
  name: 'Timezone Comparison',
  render: () => {
    const utcDate = '2024-09-20T13:00:00.000Z';
    return html`
      <div style="font-family: sans-serif; display: flex; flex-direction: column; gap: 0.5rem;">
        <div>
          <strong>UTC:</strong>
          <hx-format-date
            date=${utcDate}
            lang="en-US"
            hour="numeric"
            minute="2-digit"
            time-zone="UTC"
            time-zone-name="short"
          ></hx-format-date>
        </div>
        <div>
          <strong>America/New_York:</strong>
          <hx-format-date
            date=${utcDate}
            lang="en-US"
            hour="numeric"
            minute="2-digit"
            time-zone="America/New_York"
            time-zone-name="short"
          ></hx-format-date>
        </div>
        <div>
          <strong>Asia/Tokyo:</strong>
          <hx-format-date
            date=${utcDate}
            lang="en-US"
            hour="numeric"
            minute="2-digit"
            time-zone="Asia/Tokyo"
            time-zone-name="short"
          ></hx-format-date>
        </div>
        <div>
          <strong>Europe/London:</strong>
          <hx-format-date
            date=${utcDate}
            lang="en-US"
            hour="numeric"
            minute="2-digit"
            time-zone="Europe/London"
            time-zone-name="short"
          ></hx-format-date>
        </div>
      </div>
    `;
  },
};

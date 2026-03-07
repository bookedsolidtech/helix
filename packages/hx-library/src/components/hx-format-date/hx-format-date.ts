import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tokenStyles } from '@helix/tokens/lit';
import { helixFormatDateStyles } from './hx-format-date.styles.js';

/**
 * Formats and displays a date/time value using the browser's `Intl.DateTimeFormat`
 * (or `Intl.RelativeTimeFormat` when `relative` is set). Renders as an inline
 * `<time>` element — machine-readable via `datetime`, human-readable via formatted text.
 *
 * No external dependencies. Uses native Intl APIs only.
 *
 * @summary Inline date/time formatter using Intl APIs with semantic `<time>` output.
 *
 * @tag hx-format-date
 *
 * @csspart base - The inner `<time>` element.
 */
@customElement('hx-format-date')
export class HelixFormatDate extends LitElement {
  static override styles = [tokenStyles, helixFormatDateStyles];

  /**
   * The date/time value to format. Accepts an ISO string, a Unix timestamp (ms), or
   * a `Date` object. Defaults to the current date/time when empty.
   * @attr date
   */
  @property()
  date: string | number | Date = '';

  /**
   * BCP 47 locale tag used for formatting (e.g. `"en-US"`, `"de"`, `"ja"`).
   * Defaults to `document.documentElement.lang`, then `navigator.language`.
   * @attr lang
   */
  @property()
  override lang = '';

  /**
   * Month display format.
   * @attr month
   */
  @property()
  month: 'narrow' | 'short' | 'long' | 'numeric' | '2-digit' | undefined = undefined;

  /**
   * Year display format.
   * @attr year
   */
  @property()
  year: 'numeric' | '2-digit' | undefined = undefined;

  /**
   * Day display format.
   * @attr day
   */
  @property()
  day: 'numeric' | '2-digit' | undefined = undefined;

  /**
   * Weekday display format.
   * @attr weekday
   */
  @property()
  weekday: 'narrow' | 'short' | 'long' | undefined = undefined;

  /**
   * Hour display format.
   * @attr hour
   */
  @property()
  hour: 'numeric' | '2-digit' | undefined = undefined;

  /**
   * Minute display format.
   * @attr minute
   */
  @property()
  minute: 'numeric' | '2-digit' | undefined = undefined;

  /**
   * Second display format.
   * @attr second
   */
  @property()
  second: 'numeric' | '2-digit' | undefined = undefined;

  /**
   * Time zone name display format.
   * @attr time-zone-name
   */
  @property({ attribute: 'time-zone-name' })
  timeZoneName: 'short' | 'long' | undefined = undefined;

  /**
   * IANA time zone identifier (e.g. `"America/New_York"`, `"UTC"`).
   * @attr time-zone
   */
  @property({ attribute: 'time-zone' })
  timeZone: string | undefined = undefined;

  /**
   * Whether to use 12-hour or 24-hour clock. `"auto"` defers to locale default.
   * @attr hour-format
   */
  @property({ attribute: 'hour-format' })
  hourFormat: 'auto' | '12' | '24' = 'auto';

  /**
   * Controls whether `Intl.RelativeTimeFormat` always shows numeric output
   * (`"always"`) or uses natural language when possible (`"auto"`, e.g. "yesterday").
   * Only used when `relative` is true.
   * @attr numeric
   */
  @property()
  numeric: 'always' | 'auto' = 'auto';

  /**
   * When true, displays a relative time string such as "2 hours ago" or "in 3 days"
   * using `Intl.RelativeTimeFormat`.
   * @attr relative
   */
  @property({ type: Boolean })
  relative = false;

  // ─── Private helpers ───

  private _getDate(): Date {
    const val = this.date;
    if (val === '') return new Date();
    if (val instanceof Date) {
      return isNaN(val.getTime()) ? new Date() : val;
    }
    if (typeof val === 'number') {
      const d = new Date(val);
      return isNaN(d.getTime()) ? new Date() : d;
    }
    // Numeric strings (e.g. Unix timestamps set via HTML attribute) must be
    // converted to a number before passing to Date — new Date("1718462400000")
    // returns Invalid Date in most JS engines.
    const asNumber = Number(val);
    if (!isNaN(asNumber)) {
      const d = new Date(asNumber);
      return isNaN(d.getTime()) ? new Date() : d;
    }
    const parsed = new Date(val);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  private _getLocale(): string {
    if (this.lang) return this.lang;
    return document.documentElement.lang || navigator.language || 'en';
  }

  private _getHour12(): boolean | undefined {
    if (this.hourFormat === '12') return true;
    if (this.hourFormat === '24') return false;
    return undefined;
  }

  private _formatRelative(date: Date): string {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const absSec = Math.abs(diffSec);
    const diffMin = Math.round(diffSec / 60);
    const absMin = Math.abs(diffMin);
    const diffHour = Math.round(diffSec / 3600);
    const absHour = Math.abs(diffHour);
    const diffDay = Math.round(diffSec / 86400);
    const absDay = Math.abs(diffDay);
    const diffMonth = Math.round(diffDay / 30);
    const absMonth = Math.abs(diffMonth);
    const diffYear = Math.round(diffDay / 365);

    const rtf = new Intl.RelativeTimeFormat(this._getLocale(), { numeric: this.numeric });

    if (absSec < 60) return rtf.format(diffSec, 'second');
    if (absMin < 60) return rtf.format(diffMin, 'minute');
    if (absHour < 24) return rtf.format(diffHour, 'hour');
    if (absDay < 30) return rtf.format(diffDay, 'day');
    if (absMonth < 12) return rtf.format(diffMonth, 'month');
    return rtf.format(diffYear, 'year');
  }

  private _formatAbsolute(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {};

    if (this.month !== undefined) options.month = this.month;
    if (this.year !== undefined) options.year = this.year;
    if (this.day !== undefined) options.day = this.day;
    if (this.weekday !== undefined) options.weekday = this.weekday;
    if (this.hour !== undefined) options.hour = this.hour;
    if (this.minute !== undefined) options.minute = this.minute;
    if (this.second !== undefined) options.second = this.second;
    if (this.timeZoneName !== undefined) options.timeZoneName = this.timeZoneName;
    if (this.timeZone !== undefined) options.timeZone = this.timeZone;

    const hour12 = this._getHour12();
    if (hour12 !== undefined) options.hour12 = hour12;

    // Fall back to a sensible default when no format options are specified
    if (Object.keys(options).length === 0) {
      options.year = 'numeric';
      options.month = 'long';
      options.day = 'numeric';
    }

    return new Intl.DateTimeFormat(this._getLocale(), options).format(date);
  }

  // ─── Render ───

  override render() {
    const date = this._getDate();
    const isoString = date.toISOString();
    const formattedText = this.relative ? this._formatRelative(date) : this._formatAbsolute(date);

    return html`<time part="base" datetime=${isoString}>${formattedText}</time>`;
  }
}

export type WcFormatDate = HelixFormatDate;

declare global {
  interface HTMLElementTagNameMap {
    'hx-format-date': HelixFormatDate;
  }
}
